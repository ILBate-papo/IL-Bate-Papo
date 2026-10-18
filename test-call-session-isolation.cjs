const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/index-receber-video-20260906.js','utf8');
const start=source.indexOf('function Ne('),component=source.slice(start,source.indexOf('document.head.insertAdjacentHTML',start));
let effects=[],refs=[],sub,signal,peer,applied=[],descriptions=0,releaseAnswer;
const videoTrack={kind:'video',id:'video',stop(){this.stopped=true;}},stream={getTracks:()=>[videoTrack],getVideoTracks:()=>[videoTrack],getAudioTracks:()=>[]};
class PC{constructor(){peer=this;}addTrack(){}close(){}async setRemoteDescription(d){descriptions++;if(d.type==='answer')await new Promise(resolve=>releaseAnswer=resolve);this.remoteDescription=d;}async addIceCandidate(c){assert(this.remoteDescription);applied.push(c);}async createAnswer(){return{type:'answer'};}async setLocalDescription(d){this.localDescription=d;}}
const query={select(){return this;},eq(){return this;},order:async()=>({data:[]}),insert:async()=>({error:null})};
const context={S:{useRef:current=>{let ref={current};refs.push(ref);return ref;},useState:v=>[v,()=>{}],useEffect:f=>effects.push(f)},j:{jsx:()=>({}),jsxs:()=>({})},A:{from:()=>query,channel:()=>({on(type,filter,cb){signal=cb;return this;},subscribe(cb){sub=cb;return this;}}),removeChannel(){}},MediaStream:class{constructor(){this.tracks=[];}getTracks(){return this.tracks;}addTrack(t){this.tracks.push(t);}},RTCPeerConnection:PC,navigator:{mediaDevices:{enumerateDevices:async()=>[]}},window:{dispatchEvent(){},ILBPGetUserMedia:async()=>stream,ILBPPlayMedia:()=>{},ILBPMediaError:e=>e.message},Event,console,Oe:'',Ae:'',E:'',de:'',Ce:'',ie:'',O:''};
vm.createContext(context);vm.runInContext(component,context);
(async()=>{
 context.Ne({call:{mode:'video',direction:'incoming',offer:{type:'offer'},callId:'call',peer:{id:'peer'}},currentUserId:'self',cameraOn:true,notify:()=>{},onEnd:()=>{}});
 const cleanup=effects[0]();for(let i=0;i<20;i++)await Promise.resolve();
 await signal({new:{sender_id:'peer',signal_type:'ice',payload:{candidate:{candidate:'early'}}}});
 assert.equal(applied.length,0);await sub('SUBSCRIBED');assert.equal(applied.length,1);assert.equal(applied[0].candidate,'early');
 // A repeated answer from snapshot + realtime must be applied once, with ICE serialized after it.
 peer.remoteDescription=null;
 const answer={id:'answer-1',sender_id:'peer',signal_type:'answer',payload:{description:{type:'answer'}}};
 const answerPromise=signal({new:answer});await Promise.resolve();await Promise.resolve();
 const queuedIce=signal({new:{id:'ice-2',sender_id:'peer',signal_type:'ice',payload:{candidate:{candidate:'late'}}}});
 const duplicate=signal({new:answer});
 assert.equal(applied.length,1,'ICE cannot race pending remote description');
 releaseAnswer();await answerPromise;await queuedIce;await duplicate;
 assert.equal(descriptions,2,'offer plus a single answer; replay must be ignored');
 assert.equal(applied.length,2);
 const staleTrackHandler=peer.ontrack;
 const staleSignalHandler=signal;
 cleanup();assert(videoTrack.stopped);assert.equal(peer.ontrack,null);assert.equal(peer.onicecandidate,null);
 const before=applied.length;
 await staleSignalHandler({new:{sender_id:'peer',signal_type:'ice',payload:{candidate:{candidate:'after-close'}}}});
 staleTrackHandler({track:{kind:'video'},streams:[]});
 assert.equal(applied.length,before,'closed session must ignore queued signals');
 console.log('PASS: serialized SDP/ICE, replayed answer, track release and stale callbacks after hangup.');
})().catch(e=>{console.error(e);process.exit(1);});
