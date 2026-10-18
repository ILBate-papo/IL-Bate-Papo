const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Stream { constructor(){this.tracks=[];} getTracks(){return [...this.tracks];} addTrack(track){this.tracks.push(track);} removeTrack(track){this.tracks=this.tracks.filter(t=>t!==track);} }
class Track extends EventTarget { constructor(kind){super();this.kind=kind;this.readyState='live';} }
const played=[],window={};
vm.runInNewContext(fs.readFileSync(__dirname+'/ilbp-media.js','utf8'),{window,MediaStream:Stream,WeakMap,Map,URL,console});
window.ILBPPlayMedia=element=>played.push(element);
function player(){let source,assignments=0;return {isConnected:true,classList:{remove(){}},closest:()=>null,get srcObject(){return source;},set srcObject(value){source=value;assignments++;},get assignments(){return assignments;}};}
const video=player(),audio=player(),v=new Track('video'),a=new Track('audio');
window.ILBPAttachRemoteTrack(video,audio,v);
const videoStream=video.srcObject;
window.ILBPAttachRemoteTrack(video,audio,a);
assert.equal(video.assignments,1,'late audio must not restart remote video');
assert.notEqual(video.srcObject,audio.srcObject);
assert.deepEqual(video.srcObject.getTracks(),[v]);assert.deepEqual(audio.srcObject.getTracks(),[a]);assert.equal(video.muted,true);
window.ILBPAttachRemoteTrack(video,audio,v);assert.equal(video.assignments,1);
const count=played.length;v.dispatchEvent(new Event('unmute'));assert.equal(played.length,count+1,'retry when RTP video becomes available');
const next=new Track('video');window.ILBPAttachRemoteTrack(video,audio,next);
assert.equal(video.srcObject,videoStream);assert.deepEqual(video.srcObject.getTracks(),[next]);
v.dispatchEvent(new Event('ended'));assert.deepEqual(video.srcObject.getTracks(),[next],'old ended track must not remove replacement');
next.readyState='ended';next.dispatchEvent(new Event('ended'));assert.equal(video.srcObject.getTracks().length,0);
console.log('PASS: independent remote tracks, delayed unmute, duplicate track, replacement and ended-track cleanup.');

const final=new Track('audio');window.ILBPAttachRemoteTrack(null,audio,final);const beforeRelease=played.length;window.ILBPReleaseMedia(audio);final.dispatchEvent(new Event('unmute'));assert.equal(played.length,beforeRelease);assert.equal(audio.srcObject,null);console.log('PASS: released call players ignore delayed track events.');
