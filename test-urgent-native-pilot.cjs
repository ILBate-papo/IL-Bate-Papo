const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
function load(path){const c={Date,TextEncoder,Uint8Array,btoa,atob,AbortSignal,Deno:{env:{get(){}}}};vm.createContext(c);vm.runInContext(stripTypeScriptTypes(fs.readFileSync(path,'utf8').replace(/export /g,'')),c);return c;}
const root=__dirname+'/supabase/functions/push-notify/',next=load(root+'fcm.ts'),old=load(__dirname+'/test/fixtures/push-fcm-v11.ts'),policy=load(root+'delivery-policy.ts');
const id='aeaef01d-f0cb-438d-8be1-fa9a6fa4e46f',owner='e0907d03-1ec7-4649-9126-f476c53bc2ba',now=Date.parse('2026-11-09T20:00:00Z');
const payload={app_id:'ilbp',type:'call',call_id:'00000000-0000-4000-8000-000000000001',mode:'video',created_at:new Date().toISOString(),sender_name:'Caller'};
const clean=x=>JSON.parse(JSON.stringify(x));let tests=0;
for(const mode of ['audio','video'])for(const type of ['call','call-end','message'])for(const system of [true,false]){
 const p={...payload,mode,type};assert.deepEqual(clean(next.fcmMessage('token',owner,p,system)),clean(old.fcmMessage('token',owner,p,system)));tests++;
}
assert(policy.urgentNativePilot(id,owner,payload,true,now));tests++;
for(const args of [[id,'another',payload,true,now],['another',owner,payload,true,now],[id,owner,{...payload,app_id:'ilchats'},true,now],[id,owner,{...payload,type:'message'},true,now],[id,owner,payload,false,now],[id,owner,payload,true,Date.parse('2026-11-11T00:00:00Z')]]){assert.equal(policy.urgentNativePilot(...args),false);tests++;}
for(const mode of ['audio','video']) {
 const out=next.fcmMessage('token',owner,{...payload,mode},false,true).message;
 assert(!out.android);assert(!out.notification);assert(out.android_v2.remote_notification.mutable_content);assert(out.android_v2.remote_notification.use_as_v1_data_message);assert.equal(out.android_v2.remote_notification.notification.channel_id,mode==='video'?'ilbp-video-calls-v1':'ilbp-voice-calls-v1');assert.equal(out.data.recipient_id,owner);assert(Number(out.data.expires_at)>Date.now());tests++;
}
for(const missed_call of [true,false]){const out=next.fcmMessage('token',owner,{...payload,type:'call-end',missed_call},true,true).message;assert(!out.android.notification);assert(!out.android_v2);assert.equal(out.android.priority,'HIGH');assert.equal(out.data.missed_call,String(missed_call));tests++;}
console.log(`PASS ${tests} cases: unchanged other devices, exact account+installation scope, expiry, voice/video native callbacks and cancellation.`);
