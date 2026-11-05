(function(){
 'use strict';
 let port=null;
 const api=window.ILBPNativeAlerts={available:false,permission:false,backgroundPush:false,fcmToken:null,fullScreenAllowed:false,callSoundEnabled:false,
  ackCallAction(callId){if(port)port.postMessage(JSON.stringify({type:"call-action-ack",callId}));},
  incoming(row,name){
   if(!port||!api.permission)return false;
   const expiresAt=Date.parse(row?.created_at)+90000,now=Date.now();
   if(row?.signal_type!=='offer'||!row.payload?.description||!Number.isFinite(expiresAt)||expiresAt<=now||expiresAt>now+95000||
    !/^[a-f0-9-]{36}$/i.test(row.call_id)||!/^[a-f0-9-]{36}$/i.test(row.recipient_id))return false;
   port.postMessage(JSON.stringify({type:'incoming-call',callId:row.call_id,recipient:row.recipient_id,
    name:String(name||'Contato do IL Bate Papo').slice(0,100),mode:row.payload?.mode==='video'?'video':'audio',expiresAt}));
   return true;
  },
  closeCall(callId){if(port)port.postMessage(JSON.stringify({type:"close-call",callId}));},
  callSettings(mode){if(port)port.postMessage(JSON.stringify({type:"call-settings",mode:mode||"audio"}));},
  fullScreenSettings(){if(port)port.postMessage(JSON.stringify({type:"full-screen-settings"}));},
  account(userId){if(port)port.postMessage(JSON.stringify({type:"push-account",userId:userId||""}));},
  enable(){if(port)port.postMessage(JSON.stringify({type:'enable-alerts'}));},
  notify(kind,title,body,tag){
   if(!port||!api.permission)return false;
   port.postMessage(JSON.stringify({type:'notify',kind,title:String(title).slice(0,100),body:String(body).slice(0,180),tag:String(tag).slice(0,100)}));return true;
  }
 };
 window.addEventListener('message',event=>{
  if(event.data!=='ilbp-native-notifications'||!event.ports?.length)return;
  const nativeSource=event.source==null&&(event.origin===''||event.origin==='null')&&/ILBatePapo\/1\.\d+\.\d+/.test(navigator.userAgent);
  if(event.origin!==location.origin&&!nativeSource)return;
  if(port)port.close();port=event.ports[0];api.available=true;
  port.onmessage=event=>{
   try{
    const state=JSON.parse(event.data);if(state.type==='call-action'){window.dispatchEvent(new CustomEvent('ilbp-native-call-action',{detail:state}));return;}if(state.type!=='state')return;
    api.fullScreenAllowed=state.fullScreenAllowed===true;api.callSoundEnabled=state.callSoundEnabled===true;
    api.fcmToken=typeof state.fcmToken==="string"?state.fcmToken:null;api.permission=state.permission===true;api.backgroundPush=state.backgroundPush===true;
    window.dispatchEvent(new Event('ilbp-native-alert-state'));
   }catch{}
  };
  port.start();port.postMessage(JSON.stringify({type:'ready'}));
 });
})();
