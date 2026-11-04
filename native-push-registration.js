(function(){
 'use strict';
 let bound=false,queue=Promise.resolve(),revision=0;
 function client(){return window.__ilbpAppClient||window.__ilbpToolsClient;}
 async function sync(){
  const db=client(),api=window.ILBPNativeAlerts;
  if(!db?.auth||!api?.available)return;
  if(!bound){
   bound=true;
   db.auth.onAuthStateChange((event,session)=>{
    revision++;
    if(event==='SIGNED_OUT')api.account('');
    else if(session?.user?.id)api.account(session.user.id);
    setTimeout(schedule,0);
   });
  }
  const version=revision;
  const {data,error}=await db.auth.getSession();
  if(error)throw error;
  const user=data.session?.user;
  if(version!==revision)return;
  api.account(user?.id||'');
  const token=api.fcmToken;
  if(!user||!token||!api.permission)return;
  // Separate endpoints per account avoid reassigning another user's registration.
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  const hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  if(version!==revision||token!==api.fcmToken)return;
  const {error:saveError}=await db.from('push_subscriptions').upsert({
   user_id:user.id,endpoint:'fcm:ilbp:'+user.id+':'+hash,
   subscription:{app_id:'ilbp',transport:'fcm',token},updated_at:new Date().toISOString()
  },{onConflict:'endpoint'});
  if(saveError)throw saveError;
  window.dispatchEvent(new Event('ilbp-fcm-registered'));
 }
 function schedule(){queue=queue.catch(()=>{}).then(sync).catch(error=>console.error('[IL Bate Papo] Registro de avisos pendente:',error.message));}
 window.addEventListener('ilbp-native-alert-state',schedule);
 window.addEventListener('online',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 const timer=setInterval(()=>{if(client()){schedule();clearInterval(timer);}},1000);
 setTimeout(()=>clearInterval(timer),60000);
})();
