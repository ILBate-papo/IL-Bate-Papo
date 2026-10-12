const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
async function test(app){
const source=fs.readFileSync(app+'/index-receber-video-20260906.js','utf8'),component=source.slice(source.indexOf('function Ne('),source.indexOf('document.head.insertAdjacentHTML',source.indexOf('function Ne(')));
let effects=[],states=[],sent=[],ended=0,activeCallback,subscribeCallback,failOffer=false;
const track={stop(){this.stopped=true;}},stream={getTracks:()=>[track],getVideoTracks:()=>[track],getAudioTracks:()=>[track]};
class PC{constructor(){this.connectionState='new';}addTrack(){}async createOffer(){return {type:'offer',sdp:'offer'};}async setLocalDescription(d){this.localDescription=d;}async setRemoteDescription(d){this.remoteDescription=d;}async createAnswer(){return {type:'answer',sdp:'answer'};}async addIceCandidate(){}close(){this.closed=true;}}
const query={select(){return this;},eq(){return this;},order:async()=>({data:[]}),insert:async row=>{sent.push(row);return {error:failOffer?{message:'offline'}:null};}};
const A={from:()=>query,channel:()=>({on(_type,_filter,cb){activeCallback=cb;return this;},subscribe(cb){subscribeCallback=cb;return this;}}),removeChannel(){}};
const S={useRef:()=>({current:null}),useState:x=>[x,x=>states.push(x)],useEffect:fn=>effects.push(fn)};
const j={jsx:(type,props)=>({type,...props}),jsxs:(type,props)=>({type,...props})};
const context={A,S,j,MediaStream:class{},RTCPeerConnection:PC,navigator:{mediaDevices:{getUserMedia:async()=>stream}},window:{ILChatsGetUserMedia:async()=>stream,ILChatsPlayMedia:async()=>{}},console,Oe:'brand',Ae:'avatar',E:'icon',de:'icon',Ce:'icon',ie:'icon',O:'icon'};
vm.createContext(context);vm.runInContext(component,context);
const tree=context.Ne({call:{mode:'audio',direction:'outgoing',callId:'c1',conversationId:'conversation',peer:{id:'peer',name:'Peer'}},currentUserId:'self',onMute(){},onCamera(){},onEnd:()=>ended++,notify:x=>states.push(x)});const cleanup=effects[0]();for(let i=0;i<8;i++)await Promise.resolve();
await subscribeCallback('SUBSCRIBED');await subscribeCallback('SUBSCRIBED');assert.equal(sent.filter(s=>s.signal_type==='offer').length,1,'reconnect must not send duplicate offers');
await activeCallback({new:{signal_type:'answer',sender_id:'peer',payload:{description:{type:'answer',sdp:'answer'}}}});assert(states.includes('Conectando mídia…'),'SDP answer is not yet a connected media stream');
function find(node){if(!node||typeof node!=='object')return null;if(node.className==='hangup')return node;for(const child of Array.isArray(node.children)?node.children:[node.children]){const found=find(child);if(found)return found;}return null;}
const button=find(tree);assert(button);query.insert=()=>new Promise(()=>{});button.onClick();assert.equal(ended,1,'end UI immediately despite stalled network');cleanup();assert(track.stopped);
const incoming=source.slice(source.indexOf('incoming-calls-${Fe}'));const start=incoming.indexOf('e=>{let t=e.new;'),end=incoming.indexOf('}).subscribe()',start);const callback=incoming.slice(start,end+1);let current={callId:'c1'};
const incomingContext={b:fn=>{current=typeof fn==='function'?fn(current):fn;},p:[],Ee:{}};vm.createContext(incomingContext);vm.runInContext('var handler='+callback,incomingContext);incomingContext.handler({new:{signal_type:'hangup',call_id:'different'}});assert.equal(current.callId,'c1');incomingContext.handler({new:{signal_type:'hangup',call_id:'c1'}});assert.equal(current,null,'caller cancellation must close the incoming call');
console.log(app+': passed call cancellation, local hangup, stream cleanup, reconnect deduplication and honest connection status');
}
(async()=>{for(const app of (process.argv.length>2?process.argv.slice(2):[__dirname]))await test(app);})().catch(e=>{console.error(e);process.exit(1);});
