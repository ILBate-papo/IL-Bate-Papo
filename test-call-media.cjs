const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/index-receber-video-20260906.js','utf8'),start=source.indexOf('function Ne('),component=source.slice(start,source.indexOf('document.head.insertAdjacentHTML',start));
let effects=[],refs=[],peer,played=[];
const track={kind:'audio',id:'a',stop(){}},stream={getTracks:()=>[track],getVideoTracks:()=>[],getAudioTracks:()=>[track]};
class PC{constructor(){peer=this;}addTrack(){}addTransceiver(){}close(){}}
const query={select(){return this;},eq(){return this;},order:async()=>({data:[]})};
const context={S:{useRef:current=>{const ref={current};refs.push(ref);return ref;},useState:()=>['',()=>{}],useEffect:fn=>effects.push(fn)},j:{jsx:()=>({}),jsxs:()=>({})},A:{from:()=>query,channel:()=>({on(){return this;},subscribe(){return this;}}),removeChannel(){}},MediaStream:class{},RTCPeerConnection:PC,navigator:{mediaDevices:{enumerateDevices:async()=>[]}},window:{dispatchEvent(){},ILBPGetUserMedia:async()=>stream,ILBPPlayMedia:element=>played.push(element),ILBPMediaError:e=>e.message},Event,console,Oe:'',Ae:'',E:'',de:'',Ce:'',ie:'',O:''};
vm.createContext(context);vm.runInContext(component,context);
(async()=>{
 context.Ne({call:{mode:'video',direction:'outgoing',peer:{id:'other'},conversationId:'conversation',callId:'call'},currentUserId:'me',notify:()=>{},onEnd:()=>{}});
 const video={muted:false},audio={};refs[1].current=video;refs[2].current=audio;
 const cleanup=effects[0]();for(let i=0;i<15;i++)await Promise.resolve();
 peer.ontrack({streams:[stream],track});assert.equal(video.srcObject,stream);assert.equal(video.muted,true);assert.equal(audio.srcObject,stream);assert(played.includes(video)&&played.includes(audio));cleanup();
 console.log('Passed: remote video starts muted while the dedicated audio player receives the same stream independently.');
})().catch(error=>{console.error(error);process.exit(1);});
