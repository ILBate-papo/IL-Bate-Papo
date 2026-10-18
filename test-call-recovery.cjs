const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/index-receber-video-20260906.js','utf8');
const start=source.indexOf('function Ne('),component=source.slice(start,source.indexOf('document.head.insertAdjacentHTML',start));
async function harness(){
 const refs=[],effects=[],played=[];let peer,signal,finishAnswer,applied=0;
 const stream={getTracks:()=>[],getAudioTracks:()=>[],getVideoTracks:()=>[]};
 class PC{constructor(){peer=this;this.signalingState='have-local-offer';}addTransceiver(){}addTrack(){}close(){}async setRemoteDescription(d){applied++;await new Promise(r=>finishAnswer=r);this.remoteDescription=d;this.signalingState='stable';}async addIceCandidate(){assert(this.remoteDescription,'ICE must wait for SDP');}}
 const channel={on(_,__,cb){signal=cb;return this},subscribe(){return this}};
 const context={S:{useRef:v=>{const ref={current:v};refs.push(ref);return ref},useState:v=>[v,()=>{}],useEffect:f=>effects.push(f)},j:{jsx:()=>({}),jsxs:()=>({})},A:{from:()=>({select(){return this},eq(){return this},order:async()=>({data:[]})}),channel:()=>channel,removeChannel(){}},MediaStream:class{constructor(){this.tracks=[]}getTracks(){return this.tracks}addTrack(t){this.tracks.push(t)}},RTCPeerConnection:PC,navigator:{mediaDevices:{enumerateDevices:async()=>[]}},window:{dispatchEvent(){},ILBPGetUserMedia:async()=>stream,ILBPMediaError:e=>e.message,ILBPPlayMedia:el=>played.push(el)},Event,console,Oe:'',Ae:'',E:'',de:'',Ce:'',ie:'',O:''};
 vm.createContext(context);vm.runInContext(component,context);context.Ne({call:{mode:'video',direction:'outgoing',callId:'call',peer:{id:'other'}},currentUserId:'me',cameraOn:true,notify(){},onEnd(){}});
 const cleanup=effects[0]();for(let i=0;i<20;i++)await Promise.resolve();
 return{refs,peer,played,cleanup,signal:row=>signal({new:row}),get applied(){return applied},finish:()=>finishAnswer()};
}
(async()=>{
 const h=await harness(),answer={id:'answer-one',sender_id:'other',signal_type:'answer',payload:{description:{type:'answer',sdp:'sdp'}}};
 const first=h.signal(answer);for(let i=0;i<5;i++)await Promise.resolve();
 const duplicate=h.signal({...answer});for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(h.applied,1,'the same answer replayed from realtime/history must apply once');
 h.finish();await Promise.all([first,duplicate]);
 let videoAssignments=0,audioAssignments=0;const video={muted:false},audio={};
 Object.defineProperty(video,'srcObject',{get(){return this._stream},set(v){this._stream=v;videoAssignments++}});
 Object.defineProperty(audio,'srcObject',{get(){return this._stream},set(v){this._stream=v;audioAssignments++}});
 h.refs[1].current=video;h.refs[2].current=audio;
 const listeners={},track={kind:'video',id:'remote-video',addEventListener:(n,f)=>listeners[n]=f};
 h.peer.ontrack({track});h.peer.ontrack({track:{kind:'audio',id:'remote-audio',addEventListener(){}}});
 assert.equal(videoAssignments,1,'new audio track must not reset the remote video element');assert.equal(audioAssignments,1);
 assert(listeners.unmute,'retry playback when the remote track starts delivering');
 const before=h.played.length;listeners.unmute();assert(h.played.length>before);
 h.cleanup();const after=h.played.length;listeners.unmute();assert.equal(h.played.length,after,'no playback after hangup');
 console.log('PASS: duplicate answer, stable media attachment, late remote data and hangup cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
