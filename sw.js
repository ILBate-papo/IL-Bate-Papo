// IL Bate Papo build corrigido 2026-09-20
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

var ILBP_HOME = new URL("./",self.registration.scope).href;
function isILBPWindow(client) { var url=new URL(client.url);return url.origin===new URL(ILBP_HOME).origin && (url.pathname==="/" || url.pathname==="/index.html" || url.pathname.indexOf("/IL-Bate-Papo/")===0); }
self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {
    data = { body: event.data ? event.data.text() : "Você tem uma novidade no IL Bate Papo." };
  }
  if (!data || typeof data !== "object") data = {};
  var isCall = data.type === "call";
  var isVideoCall = isCall && data.mode === "video";
  var kind = data.attachment_type || data.message_type;
  var label = isCall ? (isVideoCall ? "Videochamada recebida" : "Ligação recebida") :
    kind === "audio" ? "Mensagem de áudio recebida" :
    kind === "video" ? "Vídeo recebido" :
    kind === "image" ? "Foto recebida" :
    kind === "file" ? "Arquivo recebido" : "Nova mensagem";
  var rawTime = data.created_at || data.timestamp;
  var timestamp = typeof rawTime === "number" ? rawTime : Date.parse(rawTime);
  if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > Date.now() + 300000) timestamp = Date.now();
  // Expired offers are still visible as missed calls, without a fresh ringing alert.
  var expiredCall = isCall && Date.now() - timestamp > 90000;
  if (expiredCall) label = isVideoCall ? "Videochamada perdida" : "Ligação perdida";
  var suppliedBody = String(data.body || data.preview || "").slice(0,180);
  var body = expiredCall ? "Você recebeu uma chamada enquanto estava ausente." : suppliedBody || (isCall ? "Alguém está ligando para você." : "Você recebeu uma mensagem no IL Bate Papo.");
  var title = String(data.title || label + " no IL Bate Papo").slice(0,100);
  var eventId = String(data.call_id || data.message_id || "").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,100);
  // A push must produce an OS notification even when a frozen client reports visible.
  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: new URL("icon.svg",self.registration.scope).href,
    badge: new URL("icon.svg",self.registration.scope).href,
    tag: String(data.tag || (isCall ? "ilbp-call-" : "ilbp-message-") + (eventId || String(timestamp))).slice(0,150),
    renotify: true,
    requireInteraction: isCall && !expiredCall,
    silent: expiredCall,
    timestamp: timestamp,
    vibrate: expiredCall ? undefined : isCall ? [700,300,700,300,900] : [250,120,250],
    data: { url: ILBP_HOME, type: isCall ? "call" : "message", received_at: timestamp },
    actions: isCall ? [{action:"open",title:"Abrir chamada"},{action:"dismiss",title:"Fechar aviso"}] :
      [{action:"open",title:"Abrir"}]
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.action === "dismiss") return;
  var target = ILBP_HOME;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
    for (var i = 0; i < windows.length; i += 1) {
      if (isILBPWindow(windows[i])) {
        return windows[i].navigate(target).then(function (client) { return client && client.focus(); });
      }
    }
    return self.clients.openWindow(target);
  }));
});

