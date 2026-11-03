const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
let handler,created=new Date().toISOString(),ended=false,sent=[];
const createClient=()=>({auth:{getUser:async()=>({data:{user:{id:'sender'}}})},from(table){return {select(){return this},eq(){return this},in(){return this},order(){return this},limit(){return this},contains:async()=>({data:[{id:'sub',user_id:'peer',subscription:{app_id:'ilbp',transport:'fcm',token:'device'}}]}),maybeSingle:async()=>({data:table==='profiles'?{display_name:'Leandro'}:{call_id:'call',created_at:created}}),then(resolve,reject){return Promise.resolve({data:ended?[{call_id:'call'}]:[]}).then(resolve,reject)}}}});
let source=fs.readFileSync(__dirname+'/supabase/functions/push-notify/index.ts','utf8').replace(/^import .*;\s*$/mg,'');
vm.runInNewContext(stripTypeScriptTypes(source),{Deno:{env:{get:()=>''},serve:f=>handler=f},createClient,sendFcm:async(t,u,p)=>sent.push(p),webpush:{setVapidDetails(){}},Response,Date,Number,Boolean,JSON,console});
async function call(){return handler(new Request('https://server.test',{method:'POST',headers:{Origin:'https://bate.papo.il-talk.com.br'},body:JSON.stringify({type:'call',sender_id:'sender',recipient_id:'peer',call_id:'call',mode:'video'})}));}
(async()=>{
 assert.equal((await call()).status,200);assert.equal(sent.length,1);assert.equal(sent[0].created_at,created);assert.equal(sent[0].sender_name,'Leandro');
 ended=true;assert.equal((await (await call()).json()).ended,true);assert.equal(sent.length,1,'closed call cannot ring again');
 ended=false;created=new Date(Date.now()-100000).toISOString();assert.equal((await (await call()).json()).expired,true);assert.equal(sent.length,1,'old offer cannot acquire a new expiry');
 console.log('PASS: persisted offer expiry, closed-call suppression and caller name in native push.');
})().catch(error=>{console.error(error);process.exitCode=1});
