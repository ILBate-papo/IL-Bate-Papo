(function () {
  "use strict";
  var SUPABASE_URL = "https://ngidsolvxegpyrprlbex.supabase.co";
  var KEY = "sb_publishable_-8u67PtkHJj1yRVWtOIkog_2skdsDcz";
  var VAPID_PUBLIC_KEY = "BGq8IGyauun0vKpXPLksb5I_lrhxD89oxschTLQg8kGhKagxDyPOnXd7nTebG796JhAl_SP4KMa68P7Qz2IMp_c";
  var db, user, channel, registration, generation = 0;
  var seen = new Set(), promptId = "il-push-permission-prompt";
  function logError(stage, error) { console.error("[IL Bate Papo Push] " + stage, error && (error.message || error)); }
  function client() {
    if (db) return db;
    db = window.__ilbpToolsClient || (window.supabase && window.ILBPCreateClient(SUPABASE_URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }));
    if (db) window.__ilbpToolsClient = db;
    return db;
  }
  function applicationServerKey(value) {
    var padding = "=".repeat((4 - value.length % 4) % 4);
    var raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, function (character) { return character.charCodeAt(0); });
  }
  async function subscribeForPush() {
    if (!registration) throw new Error("Service Worker indisponível");
    if (!user) throw new Error("Usuário não autenticado");
    if (Notification.permission !== "granted") throw new Error("Permissão não concedida");
    var account = user.id, version = generation;
    var subscription = await registration.pushManager.getSubscription();
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(VAPID_PUBLIC_KEY) });
    if (!user || user.id !== account || version !== generation) return;
    var result = await client().from("push_subscriptions").upsert({ user_id: account, endpoint: subscription.endpoint, subscription: Object.assign(subscription.toJSON(), { app_id: "ilbp" }), updated_at: new Date().toISOString() }, { onConflict: "endpoint" }).select("id").single();
    if (result.error) throw result.error;
    console.info("[IL Bate Papo Push] dispositivo registrado", result.data && result.data.id);
  }
  function removePrompt() { var prompt = document.getElementById(promptId); if (prompt) prompt.remove(); }
  function showPermissionPrompt() {
    if (!user || Notification.permission !== "default" || document.getElementById(promptId)) return;
    var box = document.createElement("div");
    box.id = promptId; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Ativar notificações do IL Bate Papo");
    box.style.cssText = "position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:2147483000;max-width:360px;width:calc(100% - 32px);padding:14px;border-radius:16px;background:#07111f;color:#fff;border:1px solid #19d7ff;box-shadow:0 12px 35px rgba(0,0,0,.5);font:14px system-ui";
    box.innerHTML = '<b style="display:block;margin-bottom:6px">Receba mensagens e chamadas</b><span style="display:block;color:#c7d2df;margin-bottom:12px">Ative as notificações para ser avisado mesmo com o IL Bate Papo em segundo plano.</span><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-action="later" style="padding:9px 12px;border-radius:10px;border:1px solid #536274;background:transparent;color:#fff">Agora não</button><button type="button" data-action="enable" style="padding:9px 12px;border:0;border-radius:10px;background:#15c9ef;color:#00131a;font-weight:700">Ativar notificações</button></div>';
    box.querySelector('[data-action="later"]').addEventListener("click", removePrompt);
    box.querySelector('[data-action="enable"]').addEventListener("click", async function () {
      try { var permission = await Notification.requestPermission(); if (permission !== "granted") throw new Error("Permissão: " + permission); await subscribeForPush(); removePrompt(); }
      catch (error) { logError("falha ao ativar", error); var message = box.querySelector("span"); if (message) message.textContent = "Não foi possível ativar. Confira a permissão do navegador e tente novamente."; }
    });
    document.body.appendChild(box);
  }
  async function show(title, body, isCall, tag, createdAt) {
    if (!("Notification" in window) || Notification.permission !== "granted" || !registration) return;
    await registration.showNotification(title, { body: body, timestamp: Date.parse(createdAt) || Date.now(), silent: false, icon: new URL("./icon.svg",document.baseURI).href, badge: new URL("./icon.svg",document.baseURI).href, tag: tag, renotify: true, requireInteraction: isCall, vibrate: isCall ? [700,300,700,300,900] : [250,120,250], data: { url: new URL("/",location.href).href, type: isCall ? "call" : "message" } });
  }
  async function senderName(id) { var result = await client().from("profiles").select("display_name").eq("id", id).maybeSingle(); return result.data && result.data.display_name || "Alguém"; }

  function showInPage(title, body) {
    if (document.visibilityState !== "visible") return;
    document.getElementById("ilbp-incoming-alert")?.remove();
    var box = document.createElement("div"); box.id = "ilbp-incoming-alert";
    box.setAttribute("role", "alert");
    box.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483001;width:calc(100% - 32px);max-width:440px;box-sizing:border-box;padding:16px;border-radius:16px;background:#0b2035;color:white;border:1px solid #19d7ff;box-shadow:0 12px 35px #0008;font:14px/1.5 system-ui";
    var heading = document.createElement("strong"); heading.textContent = title;
    var text = document.createElement("p"); text.textContent = body; text.style.margin = "6px 0";
    var close = document.createElement("button"); close.type = "button"; close.textContent = "Fechar aviso";
    close.style.cssText = "padding:7px 12px;border:0;border-radius:8px;background:#15c9ef;color:#00131a";
    close.onclick = function () { box.remove(); };
    box.append(heading, text, close); document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 10000);
  }

  function foregroundMessageAlert(id) { window.ILBPSounds?.message('message-'+id);if(navigator.vibrate)navigator.vibrate([180,90,180]); }

  async function onMessage(row) {
    if (!user || !row || row.sender_id === user.id || seen.has("m:" + row.id)) return;
    var version = generation;
    seen.add("m:" + row.id);
    if(window.ILBPNativeAlerts?.notify(row.attachment_type==="audio"?"audio":"message","Nova mensagem no IL Bate Papo",row.body||({audio:"Você recebeu uma mensagem de áudio.",video:"Você recebeu um vídeo.",image:"Você recebeu uma foto.",file:"Você recebeu um arquivo."})[row.attachment_type]||"Você recebeu uma mensagem.","message-"+row.id))return;
    showInPage("Nova mensagem no IL Bate Papo", ({audio:"Você recebeu uma mensagem de áudio.",video:"Você recebeu um vídeo.",image:"Você recebeu uma foto.",file:"Você recebeu um arquivo."})[row.attachment_type] || "Você recebeu uma mensagem.");
    try { if(document.visibilityState==="visible")foregroundMessageAlert(row.id); var name = await senderName(row.sender_id); if(version !== generation || !user)return; var labels={audio:"Você recebeu uma mensagem de áudio.",video:"Você recebeu um vídeo.",image:"Você recebeu uma foto.",file:"Você recebeu um arquivo."}; var text = row.content || row.body || row.text || labels[row.attachment_type] || "Você recebeu uma nova mensagem."; await show("Mensagem de " + name, String(text).slice(0,140), false, "ilbp-message-" + row.id, row.created_at); } catch (error) { logError("mensagem", error); }
  }
  async function onCall(row) {
    if (!user || !row || row.recipient_id !== user.id || row.signal_type !== "offer" || seen.has("c:" + row.call_id)) return;
    if (Date.now() - Date.parse(row.created_at) > 90000) return;
    var version = generation;
    seen.add("c:" + row.call_id);
    if(window.ILBPNativeAlerts?.notify(row.payload?.mode==="video"?"video-call":"call",row.payload?.mode==="video"?"Chamada de vídeo recebida":"Chamada de voz recebida","Alguém está ligando para você no IL Bate Papo.","call-"+row.call_id))return;
    showInPage(row.payload?.mode === "video" ? "Chamada de vídeo recebida" : "Chamada de voz recebida", "Alguém está ligando para você no IL Bate Papo.");
    try { var name = await senderName(row.sender_id); if(version !== generation || !user)return; var mode = row.payload && row.payload.mode === "video" ? "vídeo" : "voz"; await show("Chamada de " + mode + " recebida", name + " está ligando para você no IL Bate Papo.", true, "ilbp-call-" + row.call_id, row.created_at); } catch (error) { logError("chamada", error); }
  }
  function startRealtime() {
    if (!user || !client()) return;
    if (channel) client().removeChannel(channel);
    var version = generation;
    channel = client().channel("il-notifications-" + user.id)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" }, function (event) { if(version === generation)onMessage(event.new); })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"call_signals", filter:"recipient_id=eq." + user.id }, function (event) { if(version === generation)onCall(event.new); })
      .subscribe(function (status) { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") logError("Realtime", status); });
  }
  async function configureForSession(nextUser) {
    var previous = user;
    var changed = (user && user.id) !== (nextUser && nextUser.id);
    if (changed) { generation += 1; seen.clear(); if(channel){client().removeChannel(channel);channel=null;} }
    user = nextUser || null;
    var version = generation;
    if (changed && previous && registration) {
      try { var oldSubscription = await registration.pushManager.getSubscription(); if (oldSubscription) await oldSubscription.unsubscribe(); }
      catch(error) { logError("saída do push",error); }
    }
    if (version !== generation) return;
    if (!user) { removePrompt(); return; }
    startRealtime();
    if (!("Notification" in window) || !("PushManager" in window)) return;
    if (Notification.permission === "granted") { try { await subscribeForPush(); } catch (error) { logError("registro", error); } }
    else if (Notification.permission === "default") showPermissionPrompt();
  }
  async function start() {
    try {
    if (("serviceWorker" in navigator) && ("Notification" in window) && ("PushManager" in window)) {
    registration = await navigator.serviceWorker.register(new URL("./sw.js?v=20261017-1", document.baseURI).href, { updateViaCache:"none" }); await registration.update();
    if (!registration.active) await new Promise((resolve,reject)=>{var timer=setTimeout(()=>reject(new Error("Ativação das notificações demorou. Reabra o site.")),12000);function check(){if(registration.active){clearTimeout(timer);resolve();}}var worker=registration.installing||registration.waiting;if(worker)worker.addEventListener("statechange",check);check();});
    }
    } catch(error) { logError("registro do dispositivo",error); }
    // A service-worker failure must not disable foreground realtime alerts.
    var c = client(); if (!c) throw new Error("Cliente Supabase não encontrado");
    var session = await c.auth.getSession(); await configureForSession(session.data && session.data.session && session.data.session.user);
    c.auth.onAuthStateChange(function (_event, nextSession) { setTimeout(function () { configureForSession(nextSession && nextSession.user).catch(function (error) { logError("sessão", error); }); }, 0); });
  }

  function installAlertSettings() {
    var profile=document.querySelector('.profile');if(!profile||profile.querySelector('.il-alert-settings'))return;
    var section=document.createElement('section');section.className='il-alert-settings ilbp-alert-settings';section.style.cssText='padding:12px;border:1px solid #19d7ff55;border-radius:12px;margin:12px 0';
    if(window.ILBPNativeAlerts?.available){
      var nativeButton=document.createElement('button');nativeButton.type='button';nativeButton.textContent='🔔 Ativar e testar avisos do Android';
      nativeButton.style.cssText='width:100%;min-height:44px;border:0;border-radius:10px;background:#15c9ef;color:#00131a;font-weight:700';
      nativeButton.onclick=()=>window.ILBPNativeAlerts.enable();
      var nativeStatus=document.createElement('p');nativeStatus.setAttribute('role','status');nativeStatus.style.cssText='font-size:12px;line-height:1.5;color:#c7d2df;margin:8px 0 0';
      nativeStatus.textContent=window.ILBPNativeAlerts.permission?'Som e vibração ativados. Os avisos com a tela apagada ainda estão em configuração.':'Permita os avisos do Android para ativar som e vibração. Os avisos com a tela apagada ainda estão em configuração.';
      section.append(nativeButton,nativeStatus);profile.appendChild(section);return;
    }
    if (!("Notification" in window) || !("PushManager" in window)) {
      var unavailable=document.createElement('p');unavailable.textContent='Aqui, os avisos de mensagens e chamadas com a tela apagada ainda não estão disponíveis.';
      unavailable.style.cssText='font-size:14px;line-height:1.5;margin:0;color:#c7d2df';
      section.append(unavailable);profile.appendChild(section);return;
    }
    var button=document.createElement('button');button.type='button';button.textContent='🔔 Ativar e testar avisos neste aparelho';button.style.cssText='width:100%;min-height:44px;border:0;border-radius:10px;background:#15c9ef;color:#00131a;font-weight:700';
    var status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='font-size:12px;line-height:1.5;color:#c7d2df;margin:8px 0 0';status.textContent='Ative aqui os avisos de mensagens e chamadas.';
    button.onclick=async function(){button.disabled=true;try{
      var permission=Notification.permission;if(permission==='default')permission=await Notification.requestPermission();
      if(permission!=='granted')throw new Error('Permita as notificações nas configurações deste site.');
      if(!registration||!user)await start();if(!user)throw new Error('Entre na sua conta para ativar os avisos.');
      if(window.ILBPSounds)await window.ILBPSounds.unlock();
      await subscribeForPush();
      await registration.showNotification('IL Bate Papo: avisos ativados',{body:'Este é um teste dos avisos neste aparelho.',icon:new URL('./icon.svg',document.baseURI).href,tag:'alerts-test',silent:false,vibrate:[250,120,250]});
      status.textContent='Inscrição salva e aviso local exibido. Confirme a entrega enviando uma mensagem de outro aparelho com esta tela bloqueada.';
    }catch(error){status.textContent=error.message||'Não foi possível ativar. Tente novamente.';}finally{button.disabled=false;}};
    section.append(button,status);profile.appendChild(section);
  }
  new MutationObserver(installAlertSettings).observe(document.documentElement,{childList:true,subtree:true});
  installAlertSettings();
  window.addEventListener('ilbp-native-alert-state',function(){document.querySelectorAll('.il-alert-settings').forEach(function(section){section.remove();});installAlertSettings();});

  window.addEventListener("load", function () { start().catch(function (error) { logError("inicialização", error); }); });
})();


