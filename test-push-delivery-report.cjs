const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
(async()=>{
 let handler,authorized=true,fail=false,dbError=false;const accepted=[],logs=[];
 const db={auth:{getUser:async()=>({data:{user:authorized?{id:'sender'}:null}})},from(table){
  const q={select(){return this},eq(){return this},neq(){return this},in(){return this},order(){return this},limit(){return this},delete(){return this},
   async maybeSingle(){return {data:table==='profiles'?{display_name:'Contato'}:{call_id:'call',created_at:new Date().toISOString(),user_id:'sender',sender_id:'sender',recipient_id:'recipient',signal_type:'hangup',payload:{mode:'video'}}}},
   async contains(){return dbError?{error:new Error('subscription query failed')}:{data:[{id:'registration',user_id:'recipient',subscription:{app_id:'ilbp',transport:'fcm',token:'private-token'}}]};} };
  return q;
 }};
 const source=fs.readFileSync(__dirname+'/supabase/functions/push-notify/index.ts','utf8').replace(/^import .*;\s*$/mg,'');
 vm.runInNewContext(stripTypeScriptTypes(source),{Deno:{env:{get:()=>''},serve:fn=>handler=fn},createClient:()=>db,sendFcm:async(...a)=>{if(fail)throw new Error('provider rejected');accepted.push(a)},webpush:{},Response,Date,console:{info:(...a)=>logs.push(a),error:(...a)=>logs.push(a),warn(){}}});
 const request=()=>new Request('https://server.test',{method:'POST',headers:{Origin:'https://bate.papo.il-talk.com.br'},body:JSON.stringify({type:'call',sender_id:'sender',recipient_id:'recipient',call_id:'call'})});
 // A terminal call signal exercises delivery without sending a real message.
 const message=()=>new Request('https://server.test',{method:'POST',headers:{Origin:'https://bate.papo.il-talk.com.br'},body:JSON.stringify({type:'call-end',sender_id:'sender',recipient_id:'recipient',call_id:'call'})});
 let response=await handler(message());assert.equal(response.status,200);assert.equal((await response.json()).sent,1);
 assert.equal(logs.find(x=>x[0]==='ILBP_PUSH_SUMMARY')[1].accepted,1);
 assert.equal(logs.find(x=>x[0]==='ILBP_PUSH_PROVIDER_ACCEPTED')[1].recipient_id,'recipient');
 assert(!JSON.stringify(logs).includes('private-token'),'diagnostics must not expose device tokens');
 fail=true;response=await handler(message());assert.equal((await response.json()).failed,1);assert.equal(logs.filter(x=>x[0]==='ILBP_PUSH_SUMMARY').at(-1)[1].accepted,0);
 dbError=true;response=await handler(message());assert.equal(response.status,500,'database failure cannot masquerade as a successful empty delivery');
 authorized=false;response=await handler(request());assert.equal(response.status,401);
 console.log('PASS: provider acceptance and failure reporting, no token exposure, database errors and authentication.');
})().catch(e=>{console.error(e);process.exitCode=1;});
