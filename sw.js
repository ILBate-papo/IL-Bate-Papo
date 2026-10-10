// IL Bate Papo build corrigido 2026-09-20
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {
    data = { body: event.data ? event.data.text() : "Você tem uma novidade no IL Bate Papo." };
  }
  var isCall = data.type === "call";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
    // O Android pode manter uma janela como "visible" mesmo quando o PWA/TWA
    // está em segundo plano ou com a tela bloqueada. Nunca suprima chamadas.
    if (!isCall && windows.some(function (client) { return client.url.indexOf(self.registration.scope) === 0 && client.visibilityState === "visible"; })) return;
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
    data: { url: self.registration.scope, type: data.type || "message" },
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
  var target = self.registration.scope;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
    for (var i = 0; i < windows.length; i += 1) {
      if (windows[i].url.indexOf(self.registration.scope) === 0) {
        windows[i].navigate(target);
        return windows[i].focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});

