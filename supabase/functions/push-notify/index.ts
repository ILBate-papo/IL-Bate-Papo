import { sendFcm } from "./fcm.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const apps: Record<string, { id: string; name: string }> = {
  "https://il-chta.github.io": { id: "ilchats", name: "IL Chats" },
  "https://ilbate-papo.github.io": { id: "ilbp", name: "IL Bate Papo" },
};

webpush.setVapidDetails(
  "https://il-chta.github.io/",
  Deno.env.get("VAPID_PUBLIC_KEY") || "",
  Deno.env.get("VAPID_PRIVATE_KEY") || "",
);

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
    const admin = createClient(url, service);
    let recipients: string[] = [];

    if (body.type === "call" && body.recipient_id && body.call_id) {
      const { data: signal } = await admin.from("call_signals").select("call_id")
        .eq("call_id", body.call_id).eq("sender_id", caller.id)
        .eq("recipient_id", body.recipient_id).eq("signal_type", "offer").maybeSingle();
      if (!signal) return Response.json({ error: "call not found" }, { status: 403, headers: cors });
      recipients = [body.recipient_id];
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
    const mode = body.mode === "video" ? "vídeo" : "voz";
    const payload = JSON.stringify({
      type: isCall ? "call" : "message",
      title: isCall ? `Ligação de ${mode} no ${app.name}` : `Mensagem de ${sender}`,
      body: isCall ? `${sender} está ligando para você.` : String(body.preview || "Nova mensagem").slice(0, 140),
      app_id: app.id,
      mode: body.mode,
      attachment_type: body.attachment_type,
      call_id: body.call_id,
      created_at: new Date().toISOString(),
      tag: isCall ? `call-${body.call_id}` : `message-${body.conversation_id}`,
      url: "/",
    });
    const { data: subscriptions } = await admin.from("push_subscriptions").select("id,user_id,subscription").in("user_id", recipients).contains("subscription", { app_id: app.id });
    let sent = 0;
    let failed = 0;
    for (const item of subscriptions || []) {
      try {
        if (item.subscription.transport === "fcm") {
          if(app.id!=="ilbp")throw new Error("FCM_APP_MISMATCH");
          await sendFcm(item.subscription.token, item.user_id, JSON.parse(payload));
        } else await webpush.sendNotification(item.subscription, payload, {
          TTL: isCall ? 90 : 86400,
          urgency: isCall ? "high" : "normal",
          topic: isCall ? (`call-${String(body.call_id).replace(/[^a-zA-Z0-9_-]/g, "")}`).slice(0, 32) : undefined,
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", item.id);
        } else console.error("push delivery failed", { subscription_id: item.id, statusCode, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return Response.json({ sent, failed, recipients: recipients.length }, { headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500, headers: cors });
  }
});

