const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},events=[],sent=[],acks=[];let calls=[],user='me';
const id='11111111-1111-4111-8111-111111111111';
const query={select(){return this},eq(){return this},order:async()=>({data:calls}),insert:async row=>{sent.push(row);return{}}};
const db={auth:{getSession:async()=>({data:{session:{user:{id:user}}}})},from:table=>table==='profiles'?{select(){return this},eq(){return this},maybeSingle:async()=>({data:{display_name:'Contato'}})}:query};
const window={__ilbpAppClient:db,ILBPNativeAlerts:{ackCallAction:id=>acks.push(id)},addEventListener:(type,handler)=>handlers[type]=handler,dispatchEvent:e=>events.push(e)};
vm.runInNewContext(fs.readFileSync(__dirname+'/native-call-actions.js','utf8'),{window,Date,Number,console,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},setInterval:()=>1,clearInterval(){}});
const tick=()=>new Promise(r=>setImmediate(r));
function offer(){return{call_id:id,conversation_id:'conversation',sender_id:'other',recipient_id:'me',signal_type:'offer',created_at:new Date().toISOString(),payload:{mode:'video',description:{type:'offer'}}};}
async function act(action){handlers['ilbp-native-call-action']({detail:{callId:id,action,recipient:'me',expires:Date.now()+90000}});await tick();}
(async()=>{
 calls=[offer()];await act('answer');assert.equal(events.length,1);assert.equal(events[0].type,'ilbp-native-call-ready');assert.equal(events[0].detail.peer.id,'other');assert.equal(sent.length,0);
 await act('decline');assert.equal(sent.length,1);assert.equal(sent[0].signal_type,'hangup');assert.equal(sent[0].payload.reason,'rejected');
 calls=[offer(),{signal_type:'hangup'}];await act('answer');assert.equal(events.length,1,'closed calls must not be answered');
 calls=[{...offer(),created_at:new Date(Date.now()-100000).toISOString()}];await act('answer');assert.equal(events.length,1,'expired calls must not be answered');
 user='different';calls=[offer()];await act('decline');assert.equal(sent.length,1,'wrong signed-in account cannot act');
 console.log('PASS: native answer/decline, account isolation and closed/expired-call rejection.');
})().catch(error=>{console.error(error);process.exitCode=1});
