(function(){
 'use strict';
 let port=null;
 const api=window.ILBPNativeAlerts={available:false,permission:false,backgroundPush:false,fcmToken:null,
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
    const state=JSON.parse(event.data);if(state.type!=='state')return;
    api.fcmToken=typeof state.fcmToken==="string"?state.fcmToken:null;api.permission=state.permission===true;api.backgroundPush=state.backgroundPush===true;
    window.dispatchEvent(new Event('ilbp-native-alert-state'));
   }catch{}
  };
  port.start();port.postMessage(JSON.stringify({type:'ready'}));
 });
})();
