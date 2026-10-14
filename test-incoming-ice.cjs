const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/index-receber-video-20260906.js','utf8');
const start=source.indexOf('function Ne('),component=source.slice(start,source.indexOf('document.head.insertAdjacentHTML',start));
let effects=[],refs=[],sub,signal,peer,applied=[];
const videoTrack={kind:'video',id:'video',stop(){}},stream={getTracks:()=>[videoTrack],getVideoTracks:()=>[videoTrack],getAudioTracks:()=>[]};
class PC{constructor(){peer=this;}addTrack(){}close(){}async setRemoteDescription(d){this.remoteDescription=d;}async addIceCandidate(c){assert(this.remoteDescription);applied.push(c);}async createAnswer(){return{type:'answer'};}async setLocalDescription(d){this.localDescription=d;}}
const query={select(){return this;},eq(){return this;},order:async()=>({data:[]}),insert:async()=>({error:null})};
const context={S:{useRef:current=>{let ref={current};refs.push(ref);return ref;},useState:v=>[v,()=>{}],useEffect:f=>effects.push(f)},j:{jsx:()=>({}),jsxs:()=>({})},A:{from:()=>query,channel:()=>({on(type,filter,cb){signal=cb;return this;},subscribe(cb){sub=cb;return this;}}),removeChannel(){}},MediaStream:class{constructor(){this.tracks=[];}getTracks(){return this.tracks;}addTrack(t){this.tracks.push(t);}},RTCPeerConnection:PC,navigator:{mediaDevices:{enumerateDevices:async()=>[]}},window:{dispatchEvent(){},ILBPGetUserMedia:async()=>stream,ILBPPlayMedia:()=>{},ILBPMediaError:e=>e.message},Event,console,Oe:'',Ae:'',E:'',de:'',Ce:'',ie:'',O:''};
vm.createContext(context);vm.runInContext(component,context);
(async()=>{
 context.Ne({call:{mode:'video',direction:'incoming',offer:{type:'offer'},callId:'call',peer:{id:'peer'}},currentUserId:'self',cameraOn:true,notify:()=>{},onEnd:()=>{}});
 const cleanup=effects[0]();for(let i=0;i<20;i++)await Promise.resolve();
 await signal({new:{sender_id:'peer',signal_type:'ice',payload:{candidate:{candidate:'early'}}}});
 assert.equal(applied.length,0);await sub('SUBSCRIBED');assert.equal(applied.length,1);assert.equal(applied[0].candidate,'early');
 // A fresh preview node is mounted when the camera is turned on again.
 refs[0].current={};effects[2]();assert.equal(refs[0].current.srcObject,stream);
 // Audio and video tracks may arrive with different MediaStream instances.
 const remoteAudio={kind:'audio',id:'remote-audio'},remoteVideo={kind:'video',id:'remote-video'};
 refs[1].current={};refs[2].current={};peer.ontrack({track:remoteAudio,streams:[{}]});peer.ontrack({track:remoteVideo,streams:[{}]});
 assert.equal(refs[1].current.srcObject,refs[2].current.srcObject);assert.equal(refs[1].current.srcObject.getTracks().length,2);
 cleanup();console.log('Passed: incoming early ICE, camera remount, and separate remote audio/video streams.');
})().catch(e=>{console.error(e);process.exit(1);});
