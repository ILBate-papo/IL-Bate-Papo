// FCM server credentials belong only in an Edge Function secret.
const PROJECT = "il-bate-papo-20261013-c1e4c";
let cached: {value: string; expires: number} | null = null;
function base64url(bytes: Uint8Array): string {
 let binary = "";for (const byte of bytes) binary += String.fromCharCode(byte);
 return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function accessToken(): Promise<string> {
 if(cached && cached.expires > Date.now()+60000)return cached.value;
 const raw = Deno.env.get("ILBP_FCM_SERVICE_ACCOUNT");
 if(!raw)throw new Error("FCM_NOT_CONFIGURED: secret ILBP_FCM_SERVICE_ACCOUNT missing");
 const account = JSON.parse(raw);
 if(account.project_id !== PROJECT || !account.client_email || !account.private_key)throw new Error("FCM_INVALID_SERVER_CONFIG");
 const now=Math.floor(Date.now()/1000),encoder=new TextEncoder();
 const header=base64url(encoder.encode(JSON.stringify({alg:"RS256",typ:"JWT"})));
 const payload=base64url(encoder.encode(JSON.stringify({iss:account.client_email,scope:"https://www.googleapis.com/auth/firebase.messaging",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600})));
 const pem=account.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
 const bytes=Uint8Array.from(atob(pem),(letter)=>letter.charCodeAt(0));
 const key=await crypto.subtle.importKey("pkcs8",bytes,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
 const input=header+"."+payload;
 const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,encoder.encode(input));
 const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:input+"."+base64url(new Uint8Array(signature))}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("FCM_AUTH_FAILED: "+response.status);
 const data=await response.json();if(!data.access_token)throw new Error("FCM_AUTH_INVALID_RESPONSE");
 cached={value:data.access_token,expires:Date.now()+Number(data.expires_in||3600)*1000};return cached.value;
}
export function fcmMessage(token: string,recipient: string,payload: Record<string, unknown>, systemDisplay = false) {
 const call=payload.type === "call";
 const data: Record<string,string>={};
 for(const [key,value] of Object.entries(payload))if(value!==undefined&&value!==null)data[key]=String(value);
 data.recipient_id=recipient;
 if(call){const created=Date.parse(String(payload.created_at||""));data.expires_at=String((Number.isFinite(created)?created:Date.now())+90000);}
 const android: Record<string,unknown>={priority:"HIGH",ttl:call||payload.type==="call-end"?"90s":"86400s"};
 if(systemDisplay && payload.app_id==="ilbp" && ["call","call-end","message"].includes(String(payload.type))){
  const video=payload.mode==="video",ended=payload.type==="call-end";
  const mode=video?"vídeo":"voz";
  // The OS may display this before the app can validate its signed-in account.
  // Keep this surface generic; names and message previews remain inside the app.
  android.notification={
   title:call?`Chamada de ${mode} no IL Bate Papo`:ended?(payload.missed_call===true?"Chamada não atendida no IL Bate Papo":"Chamada encerrada no IL Bate Papo"):"Nova mensagem no IL Bate Papo",
   body:call?"Toque para abrir o aplicativo e atender.":ended?"Toque para consultar o histórico no aplicativo.":"Toque para abrir o aplicativo e ler.",
   channel_id:call?(video?"ilbp-video-calls-v1":"ilbp-voice-calls-v1"):(payload.attachment_type==="audio"?"ilbp-audio-v1":"ilbp-messages-v1"),
   tag:call||ended?`ilbp-remote-call-${payload.call_id}`:String(payload.tag||"ilbp-remote-message"),
   notification_priority:"PRIORITY_HIGH",visibility:"PRIVATE",proxy:"ALLOW",default_vibrate_timings:true
  };
  if(call||ended)android.collapse_key="ilbp-system-call";
  if(call)android.ttl=`${Math.max(1,Math.min(90,Math.ceil((Number(data.expires_at)-Date.now())/1000)))}s`;
 }
 return {message:{token,data,android}};
}
export async function sendFcm(token: string,recipient: string,payload: Record<string, unknown>, systemDisplay = false): Promise<void> {
 if(!token||token.length>4096||!recipient||payload.app_id!=="ilbp")throw new Error("FCM_INVALID_TARGET");
 const authorization=await accessToken();
 const response=await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`,{method:"POST",headers:{Authorization:`Bearer ${authorization}`,"Content-Type":"application/json"},body:JSON.stringify(fcmMessage(token,recipient,payload,systemDisplay)),signal:AbortSignal.timeout(15000)});
 if(!response.ok){
  const result=await response.json().catch(()=>({}));
  const unregistered=result.error?.details?.some((detail: {errorCode?: string})=>detail.errorCode==="UNREGISTERED");
  if(response.status===401)cached=null;
  const error=Object.assign(new Error("FCM_SEND_FAILED: "+response.status),{statusCode:unregistered?410:response.status});throw error;
 }
}

