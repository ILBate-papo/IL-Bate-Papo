// IL Bate Papo build corrigido 2026-09-20
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

var ILBP_HOME = new URL("/",self.registration.scope).href;
function isILBPWindow(client) { var url=new URL(client.url);return url.origin===new URL(ILBP_HOME).origin && (url.pathname==="/" || url.pathname==="/index.html" || url.pathname.indexOf("/IL-Bate-Papo/")===0); }
self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {
    data = { body: event.data ? event.data.text() : "Você tem uma novidade no IL Bate Papo." };
  }
  var isCall = data.type === "call";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
    // O Android pode manter uma janela como "visible" mesmo quando o PWA/TWA
    // está em segundo plano ou com a tela bloqueada. Nunca suprima chamadas.
    if (!isCall && windows.some(function (client) { return isILBPWindow(client) && client.visibilityState === "visible"; })) return;
    return self.registration.showNotification(data.title || (isCall ? "Ligação no IL Bate Papo" : "Nova mensagem no IL Bate Papo"), {
    body: data.body || (isCall ? "Alguém está ligando para você." : "Você recebeu uma mensagem."),
    icon: new URL("icon.svg",self.registration.scope).href,
    badge: new URL("icon.svg",self.registration.scope).href,
    tag: data.tag || (isCall ? "ilbp-call" : "ilbp-message"),
    renotify: true,
    requireInteraction: isCall,
    silent: false,
    timestamp: Date.now(),
    vibrate: isCall ? [700, 300, 700, 300, 900] : [250, 120, 250],
    data: { url: ILBP_HOME, type: data.type || "message" },
    actions: isCall ? [
      { action: "open", title: "Abrir chamada" },
      { action: "dismiss", title: "Fechar aviso" }
    ] : [{ action: "open", title: "Abrir" }]
    });
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.action === "dismiss") return;
  var target = ILBP_HOME;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
    for (var i = 0; i < windows.length; i += 1) {
      if (isILBPWindow(windows[i])) {
        windows[i].navigate(target);
        return windows[i].focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});

