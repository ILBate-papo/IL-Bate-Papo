import { sendFcm } from "./fcm.ts";
import { currentFcmRegistrationIds } from "./fcm-ownership.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const apps: Record<string, { id: string; name: string }> = {
  "https://il-chta.github.io": { id: "ilchats", name: "IL Chats" },
  "https://ilbate-papo.github.io": { id: "ilbp", name: "IL Bate Papo" },
  "https://bate.papo.il-talk.com.br": { id: "ilbp", name: "IL Bate Papo" },
};

function fcmConfigured():boolean {
  try{const account=JSON.parse(Deno.env.get("ILBP_FCM_SERVICE_ACCOUNT")||"{}");return account.project_id==="il-bate-papo-20261013-c1e4c"&&Boolean(account.client_email&&account.private_key);}catch{return false;}
}
console.info("ILBP_FCM_CONFIG_STATE",{configured:fcmConfigured()});

const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
let webpushConfigured = false;
if (vapidPublic && vapidPrivate) {
  try {
    webpush.setVapidDetails("https://bate.papo.il-talk.com.br/", vapidPublic, vapidPrivate);
    webpushConfigured = true;
  } catch {
    console.warn("ILBP_WEBPUSH_CONFIG_INVALID");
  }
}


Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  const app = apps[origin];
  const cors = { "Access-Control-Allow-Origin": app ? origin : "null", "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  if (!app) return Response.json({ error: "origin not allowed" }, { status: 403, headers: cors });
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authorization = request.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const callerClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: authData } = await callerClient.auth.getUser();
    const caller = authData.user;
    if (!caller) return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const body = await request.json();
    if (body.sender_id !== caller.id) return Response.json({ error: "invalid sender" }, { status: 403, headers: cors });
    if(body.type === "status" && app.id === "ilbp") {
      return Response.json({fcmConfigured:fcmConfigured()},{headers:cors});
    }
    const admin = createClient(url, service);
    let recipients: string[] = [];
    let callCreatedAt: string | undefined;
    let missedCall = false;
    let callMode = body.mode;

    if (body.type === "call" && body.recipient_id && body.call_id) {
      const { data: signal } = await admin.from("call_signals").select("call_id,created_at")
        .eq("call_id", body.call_id).eq("sender_id", caller.id)
        .eq("recipient_id", body.recipient_id).eq("signal_type", "offer").maybeSingle();
      if (!signal) return Response.json({ error: "call not found" }, { status: 403, headers: cors });
      if(app.id === "ilbp") {
        const created=Date.parse(signal.created_at);
        if(!Number.isFinite(created)||Date.now()-created>=90000)return Response.json({sent:0,expired:true},{headers:cors});
        const {data:terminal,error:terminalError}=await admin.from("call_signals").select("call_id").eq("call_id",body.call_id).in("signal_type",["answer","hangup"]).limit(1);
        if(terminalError)throw terminalError;
        if(terminal?.length)return Response.json({sent:0,ended:true},{headers:cors});
        callCreatedAt=signal.created_at;
      }
      recipients = [body.recipient_id];
    } else if (body.type === "call-end" && app.id === "ilbp" && body.recipient_id && body.call_id) {
      const {data: terminal,error: terminalError} = await admin.from("call_signals").select("call_id,signal_type")
        .eq("call_id",body.call_id).eq("sender_id",caller.id).eq("recipient_id",body.recipient_id)
        .in("signal_type",["answer","hangup"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(terminalError)throw terminalError;
      if(!terminal)return Response.json({error:"call not found"},{status:403,headers:cors});
      const {data: offer,error: offerError}=await admin.from("call_signals").select("sender_id,recipient_id,payload,created_at")
        .eq("call_id",body.call_id).eq("signal_type","offer").maybeSingle();
      if(offerError)throw offerError;
      if(!offer || ![offer.sender_id,offer.recipient_id].includes(caller.id) || ![offer.sender_id,offer.recipient_id].includes(body.recipient_id))
        return Response.json({error:"call offer not found"},{status:403,headers:cors});
      callMode=offer.payload?.mode;
      callCreatedAt=offer.created_at;
      const {data: answers,error: answersError}=await admin.from("call_signals").select("call_id")
        .eq("call_id",body.call_id).eq("signal_type","answer").limit(1);
      if(answersError)throw answersError;
      missedCall=terminal.signal_type==="hangup" && offer.sender_id===caller.id && !answers?.length;
      recipients=[body.recipient_id];
    } else if (body.type === "message" && body.conversation_id) {
      const { data: membership } = await admin.from("conversation_members").select("user_id")
        .eq("conversation_id", body.conversation_id).eq("user_id", caller.id).maybeSingle();
      if (!membership) return Response.json({ error: "conversation not found" }, { status: 403, headers: cors });
      const { data } = await admin.from("conversation_members").select("user_id")
        .eq("conversation_id", body.conversation_id).neq("user_id", caller.id);
      recipients = (data || []).map((item) => item.user_id);
    }
    if (!recipients.length) return Response.json({ sent: 0 }, { headers: cors });

    const { data: profile } = await admin.from("profiles").select("display_name").eq("id", caller.id).maybeSingle();
    const sender = profile?.display_name || "Alguém";
    const isCall = body.type === "call";
    const mode = callMode === "video" ? "vídeo" : "voz";
    const payload = JSON.stringify({
      type: body.type === "call-end" ? "call-end" : isCall ? "call" : "message",
      sender_name: sender,
      title: missedCall ? `Chamada perdida de ${sender}` : isCall ? (app.id === "ilbp" ? `${sender} ligando · ${mode}` : `Ligação de ${mode} no ${app.name}`) : `Mensagem de ${sender}`,
      body: missedCall ? `Você não atendeu à chamada de ${mode} de ${sender}.` : isCall ? `${sender} está ligando para você.` : String(body.preview || "Nova mensagem").slice(0, 140),
      app_id: app.id,
      mode: callMode,
      missed_call: missedCall,
      attachment_type: body.attachment_type,
      call_id: body.call_id,
      created_at: callCreatedAt || new Date().toISOString(),
      tag: isCall ? `call-${body.call_id}` : `message-${body.conversation_id}`,
      url: "/",
    });
    const { data: subscriptions, error: subscriptionError } = await admin.from("push_subscriptions").select("id,user_id,subscription,android_notification_mode").in("user_id", recipients).contains("subscription", { app_id: app.id });
    if (subscriptionError) throw subscriptionError;
    let currentFcm: Set<string> | null = null;
    if(app.id === "ilbp" && (subscriptions || []).some(item=>item.subscription.transport === "fcm")){
      const registrations = [];
      // Page rather than relying on the Data API's row cap as the app grows.
      for(let offset=0;;offset+=500){
        const {data:page,error:ownerError}=await admin.from("push_subscriptions")
          .select("id,user_id,updated_at,subscription").contains("subscription",{app_id:"ilbp",transport:"fcm"})
          .order("id").range(offset,offset+499);
        if(ownerError)throw ownerError;
        registrations.push(...(page || []));
        if(!page || page.length<500)break;
      }
      currentFcm=currentFcmRegistrationIds(registrations);
    }
    let sent = 0;
    let failed = 0;
    for (const item of subscriptions || []) {
      try {
        if (item.subscription.transport === "fcm") {
          if(app.id!=="ilbp")throw new Error("FCM_APP_MISMATCH");
          if(currentFcm && !currentFcm.has(item.id)){
            console.info("ILBP_PUSH_STALE_REGISTRATION_SKIPPED",{subscription_id:item.id,recipient_id:item.user_id});
            continue;
          }
          await sendFcm(item.subscription.token, item.user_id, JSON.parse(payload), item.android_notification_mode === "system");
        } else { if (!webpushConfigured) throw new Error("WEBPUSH_NOT_CONFIGURED"); await webpush.sendNotification(item.subscription, payload, {
          TTL: isCall || body.type === "call-end" ? 90 : 86400,
          urgency: isCall ? "high" : "normal",
          topic: isCall ? (`call-${String(body.call_id).replace(/[^a-zA-Z0-9_-]/g, "")}`).slice(0, 32) : undefined,
        });
        }
        sent += 1;
        if(app.id === "ilbp") console.info("ILBP_PUSH_PROVIDER_ACCEPTED", { type: body.type, call_id: body.call_id || null, recipient_id: item.user_id, transport: item.subscription.transport === "fcm" ? "fcm" : "webpush", android_display: item.subscription.transport === "fcm" && item.android_notification_mode === "system" ? "system" : "app" });
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", item.id);
        } else console.error("push delivery failed", { subscription_id: item.id, statusCode, message: error instanceof Error ? error.message : String(error) });
      }
    }
    if(app.id === "ilbp") console.info("ILBP_PUSH_SUMMARY", { type: body.type, call_id: body.call_id || null, recipients: recipients.length, subscriptions: subscriptions?.length || 0, accepted: sent, failed });
    return Response.json({ sent, failed, recipients: recipients.length }, { headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500, headers: cors });
  }
});




