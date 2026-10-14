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
export function fcmMessage(token: string,recipient: string,payload: Record<string, unknown>) {
 const call=payload.type === "call";
 const data: Record<string,string>={};
 for(const [key,value] of Object.entries(payload))if(value!==undefined&&value!==null)data[key]=String(value);
 data.recipient_id=recipient;
 if(call){const created=Date.parse(String(payload.created_at||""));data.expires_at=String((Number.isFinite(created)?created:Date.now())+90000);}
 return {message:{token,data,android:{priority:"HIGH",ttl:call?"90s":"86400s"}}};
}
export async function sendFcm(token: string,recipient: string,payload: Record<string, unknown>): Promise<void> {
 if(!token||token.length>4096||!recipient||payload.app_id!=="ilbp")throw new Error("FCM_INVALID_TARGET");
 const authorization=await accessToken();
 const response=await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`,{method:"POST",headers:{Authorization:`Bearer ${authorization}`,"Content-Type":"application/json"},body:JSON.stringify(fcmMessage(token,recipient,payload)),signal:AbortSignal.timeout(15000)});
 if(!response.ok){
  const result=await response.json().catch(()=>({}));
  const unregistered=result.error?.details?.some((detail: {errorCode?: string})=>detail.errorCode==="UNREGISTERED");
  if(response.status===401)cached=null;
  const error=Object.assign(new Error("FCM_SEND_FAILED: "+response.status),{statusCode:unregistered?410:response.status});throw error;
 }
}
