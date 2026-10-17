const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {create} = require('./history-sync.js');
const tick = () => new Promise(r=>setImmediate(r));
const deferred = () => {let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const id = n => String(n).padStart(36,'0');
const row = (n,conversation='chat-a',attachment=false) => ({id:id(n),conversation_id:conversation,sender_id:'peer',body:'text '+n,attachment_path:attachment?'file/'+n:null,attachment_type:attachment?'video':null,created_at:'2026-10-16T22:43:00.000Z'});
class Events {constructor(){this.handlers={};this.visibilityState='visible';}addEventListener(n,f){(this.handlers[n]??=new Set()).add(f);}removeEventListener(n,f){this.handlers[n]?.delete(f);}fire(n){this.handlers[n]?.forEach(f=>f());}}
function harness(source,options={}) {
 let server=source.slice(),output=[],errors=[],requests=[],filter,error=false,block=null;
 const events=new Events(), handlers={}, subscriptions=[];
 const db={
  from(table){assert.equal(table,'messages');let conversation,cursor;const q={
   select(){return q},eq(k,v){assert.equal(k,'conversation_id');conversation=v;return q},
   order(k,v){assert.equal(v.ascending,false);return q},limit(){return q},
   or(value){cursor=value;return q},
   then(resolve,reject){
    requests.push({conversation,cursor});
    let records=server.filter(x=>x.conversation_id===conversation).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
    if(cursor){const m=cursor.match(/^created_at.lt.(.*),and\(created_at.eq.(.*),id.lt.(.*)\)$/);assert(m);records=records.filter(x=>x.created_at<m[1]||(x.created_at===m[2]&&x.id<m[3]));}
    const result=error?{error:new Error('network')}:{data:records.slice(0,options.cap||83),error:null};
    let wait=block;block=null;
    return(wait?wait.promise:Promise.resolve()).then(()=>result).then(resolve,reject);
   }
  };return q;},
  storage:{from(){return{createSignedUrl:options.sign||((path)=>Promise.resolve({data:{signedUrl:'signed:'+path}}))}}},
  channel(){const c={on(_,cfg,fn){handlers[cfg.event]=fn;return c},subscribe(fn){subscriptions.push(fn);return c}};return c},removeChannel(){},
 };
 const controller=create({client:db,conversationId:'chat-a',userId:'me',events,document:events,onMessages:r=>output=r,onError:e=>errors.push(e),onIncoming:()=>{},...options.controller});
 return{controller,events,handlers,subscriptions,requests,errors,get output(){return output},setServer(x){server=x},setError(x){error=x},block(){block=deferred();return block}};
}
(async()=>{
 const many=Array.from({length:1205},(_,i)=>row(i+1));
 const h=harness(many);await h.controller.sync();
 assert.equal(h.output.length,1205);assert.equal(h.output[0].id,id(1));assert.equal(h.output.at(-1).id,id(1205));assert(h.requests.length>14);
 console.log('PASS: 1205 records, API cap below page size, equal timestamps, oldest and newest recovered');
 const gate=h.block();const sync=h.controller.sync();h.controller.receive(row(1206),'INSERT');h.controller.receive(row(1206),'INSERT');h.controller.receive({id:id(1)},'DELETE');gate.resolve();await sync;
 assert.equal(h.output.length,1205);assert(!h.output.some(x=>x.id===id(1)));assert.equal(h.output.at(-1).id,id(1206));
 console.log('PASS: delayed snapshot preserves INSERT and DELETE without duplicates');
 h.setError(true);await h.controller.sync();assert.equal(h.output.at(-1).id,id(1206));assert.equal(h.errors.length,1);h.setError(false);
 h.setServer([row(42)]);await h.controller.sync();assert.deepEqual(h.output.map(x=>x.id),[id(42)]);
 console.log('PASS: failure preserves current history; successful reconciliation removes offline deletions');
 const mediaGate=deferred();let signs=0;
 const a=harness([row(1,'chat-a',true),row(2)],{sign:()=>{signs++;return mediaGate.promise}});
 await a.controller.sync();assert.equal(a.output.length,2);assert.equal(a.output[1].text,'text 2');assert.equal(a.output[0].attachmentUrl,'');
 a.controller.destroy();mediaGate.resolve({data:{signedUrl:'old'}});await tick();assert.equal(a.output[0].attachmentUrl,'');
 console.log('PASS: slow video does not block text; closed conversation rejects attachment result');
 const media=harness([row(1,'chat-a',true)]);await media.controller.sync();await tick();const url=media.output[0].attachmentUrl;assert(url);
 await media.controller.sync();media.controller.receive(row(1,'chat-a',true),'INSERT');assert.equal(media.output[0].attachmentUrl,url);
 const bad=harness([row(1,'chat-a',true)],{sign:()=>Promise.resolve({error:new Error('signature')})});await bad.controller.sync();await tick();assert.equal(bad.output.length,1);
 console.log('PASS: media URL survives duplicate/sync; signing error preserves message');
 const resume=harness([row(1)]);resume.controller.start();await tick();resume.setServer([row(1),row(2)]);resume.events.fire('online');await tick();assert.equal(resume.output.length,2);
 resume.setServer([row(1),row(2),row(3)]);resume.subscriptions[0]('SUBSCRIBED');await tick();assert.equal(resume.output.length,3);
 resume.setServer([row(4)]);resume.events.fire('visibilitychange');await tick();assert.equal(resume.output[0].id,id(4));
 resume.controller.destroy();assert.equal(resume.events.handlers.online.size,0);
 console.log('PASS: online, subscription, visibility and listener cleanup');
 // Execute the actual integration fragment with React hook stand-ins, not a hand-written copy.
 const bundle=fs.readFileSync(__dirname+'/index-receber-video-20260906.js','utf8');
 const start=bundle.indexOf('let tt=async e=>'),end=bundle.indexOf('(0,S.useEffect)(()=>{if(!Fe)return;let e=A.channel(`incoming-calls-',start);
 assert(start>0&&end>start);const r1=deferred(),r2=deferred();let rpc=0,selected='',contact,display=[];
 const state={request:0,account:'me',controller:null};
 const context={historyRef:{current:state},A:{auth:{getUser:async()=>({data:{user:{id:'me'}}})},rpc:()=> (++rpc===1?r1.promise:r2.promise)},w:x=>contact=x,D:()=>{},Te:x=>display=x,Pe:x=>selected=x,Ie:()=>{},M:()=>{},S:{useEffect:()=>{}},a:true,je:'',Fe:'me',window:{ILBPHistory:require('./history-sync.js')}};
 vm.createContext(context);vm.runInContext(bundle.slice(start,end)+';this.openChat=tt;',context);
 const first=context.openChat({id:'peer-a'});await tick();const second=context.openChat({id:'peer-b'});await tick();r2.resolve({data:'conversation-b'});await second;r1.resolve({data:'conversation-a'});await first;
 assert.equal(selected,'conversation-b');assert.equal(contact.id,'peer-b');
 console.log('PASS: actual bundle rejects out-of-order conversation RPC');
 const logoutGate=deferred();context.A.rpc=()=>logoutGate.promise;
 const opening=context.openChat({id:'peer-a'});await tick();state.account='';state.request++;selected='';logoutGate.resolve({data:'conversation-a'});await opening;assert.equal(selected,'');
 console.log('PASS: logout during open cannot restore conversation');
 const html=fs.readFileSync(__dirname+'/index.html','utf8');assert(html.indexOf('./history-sync.js')<html.indexOf('./index-receber-video-20260906.js'));
 for(const item of [h,a,media,bad,resume])item.controller.destroy();
 console.log('PASS: script load order');
})().catch(e=>{console.error(e);process.exitCode=1});
