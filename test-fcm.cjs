const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync(__dirname+'/supabase/functions/push-notify/fcm.ts','utf8').replace(/export /g,'');
const env={value:undefined},context={Deno:{env:{get:()=>env.value}},Date,TextEncoder,Uint8Array,btoa,atob,crypto:require('node:crypto').webcrypto,AbortSignal,fetch:()=>{throw Error('Unexpected network request');}};
vm.createContext(context);vm.runInContext(stripTypeScriptTypes(source),context);
(async()=>{
 const call=context.fcmMessage('token','recipient',{app_id:'ilbp',type:'call',mode:'video'});
 assert.equal(call.message.android.priority,'HIGH');assert.equal(call.message.android.ttl,'90s');
 assert.equal(call.message.data.recipient_id,'recipient');assert(Number(call.message.data.expires_at)>Date.now());
 const audio=context.fcmMessage('token','recipient',{app_id:'ilbp',type:'message',attachment_type:'audio',nothing:undefined});
 assert.equal(audio.message.android.ttl,'86400s');assert.equal(audio.message.data.attachment_type,'audio');assert(!('nothing' in audio.message.data));
 await assert.rejects(()=>context.sendFcm('token','recipient',{app_id:'ilchats'}),/FCM_INVALID_TARGET/);
 await assert.rejects(()=>context.sendFcm('token','recipient',{app_id:'ilbp'}),/FCM_NOT_CONFIGURED/);
 env.value=JSON.stringify({project_id:'other-project',client_email:'test',private_key:'test'});
 await assert.rejects(()=>context.sendFcm('token','recipient',{app_id:'ilbp'}),/FCM_INVALID_SERVER_CONFIG/);
 console.log('Passed: FCM recipient, call expiry, media type, app isolation and missing/incorrect server credentials. No live delivery tested.');
})().catch(error=>{console.error(error);process.exit(1);});
