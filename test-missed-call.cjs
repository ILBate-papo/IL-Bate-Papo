const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
(async()=>{
 let handler,caller='caller',terminal='hangup',answered=false,offerExists=true,queryError=false;const sent=[];
 const offer={sender_id:'caller',recipient_id:'recipient',payload:{mode:'video'},created_at:new Date().toISOString()};
 const db={auth:{getUser:async()=>({data:{user:{id:caller}}})},from(table){let signalType;return{
  select(){return this},eq(k,v){if(k==='signal_type')signalType=v;return this},in(){return this},order(){return this},limit(){return this},
  async maybeSingle(){return{data:table==='profiles'?{display_name:'Professor'}:signalType==='offer'?(offerExists?offer:null):{signal_type:terminal},error:queryError?new Error('query failed'):null}},
  then(resolve,reject){return Promise.resolve({data:answered?[{call_id:'call'}]:[],error:queryError?new Error('query failed'):null}).then(resolve,reject)},
  async contains(){return{data:[{id:'sub',user_id:'recipient',subscription:{transport:'fcm',token:'device'}}]}}
 }}};
 const src=fs.readFileSync(__dirname+'/supabase/functions/push-notify/index.ts','utf8').replace(/^import .*;\s*$/mg,'');
 vm.runInNewContext(stripTypeScriptTypes(src),{Deno:{env:{get:()=>''},serve:f=>handler=f},createClient:()=>db,sendFcm:async(t,u,p)=>sent.push(p),webpush:{},Response,Date,console});
 const request=()=>new Request('https://server.test',{method:'POST',headers:{Origin:'https://bate.papo.il-talk.com.br'},body:JSON.stringify({type:'call-end',sender_id:caller,recipient_id:caller==='caller'?'recipient':'caller',call_id:'call',mode:'audio',missed_call:true})});
 let response=await handler(request());assert.equal(response.status,200);assert.equal(sent.at(-1).type,'call-end');assert.equal(sent.at(-1).missed_call,true);assert.equal(sent.at(-1).mode,'video');assert.match(sent.at(-1).title,/Chamada perdida de Professor/);
 answered=true;await handler(request());assert.equal(sent.at(-1).missed_call,false,'answered calls still close alerts without false missed calls');
 answered=false;terminal='answer';await handler(request());assert.equal(sent.at(-1).missed_call,false,'answering never issues a missed call');
 terminal='hangup';caller='recipient';await handler(request());assert.equal(sent.at(-1).missed_call,false,'recipient rejection does not accuse caller of missing a call');
 caller='outsider';response=await handler(request());assert.equal(response.status,403);
 caller='caller';offerExists=false;response=await handler(request());assert.equal(response.status,403);
 offerExists=true;queryError=true;response=await handler(request());assert.equal(response.status,500);
 const handlers={},notices=[{tag:'call-call',close(){this.closed=true}}];
 const self={registration:{scope:'https://bate.papo.il-talk.com.br/',async getNotifications(){return notices},async showNotification(title,options){notices.push({title,...options})}},addEventListener:(n,f)=>handlers[n]=f};
 vm.runInNewContext(fs.readFileSync(__dirname+'/sw.js','utf8'),{self,Date,URL,Number});
 async function push(data){let pending;handlers.push({data:{json:()=>data},waitUntil:p=>pending=p});await pending}
 await push({type:'call-end',call_id:'call',missed_call:false});assert.equal(notices.length,1);assert(notices[0].closed);
 await push({type:'call-end',call_id:'call',missed_call:true,title:'Chamada perdida de Professor'});assert.equal(notices.length,2);assert.equal(notices[1].tag,'missed-call');
 console.log('PASS: server validates missed calls, preserves call-end cleanup, trusts stored mode, rejects unrelated callers and browser closes ringing notices.');
})().catch(e=>{console.error(e);process.exitCode=1});
