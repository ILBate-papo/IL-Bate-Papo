(function () {
  "use strict";

  var SUPABASE_URL = "https://ngidsolvxegpyrprlbex.supabase.co";
  var SUPABASE_KEY = "sb_publishable_-8u67PtkHJj1yRVWtOIkog_2skdsDcz";
  var client = null;
  var userId = "";
  var conversationMap = {};
  var lastConversationId = "";
  var refreshing = false;
  var warned = new Set();
  var receiptChannel=null,watchedConversation='',domSignature='';
  function watchConversation(db,id){
    if(watchedConversation===id)return;
    if(receiptChannel)db.removeChannel(receiptChannel);
    watchedConversation=id;
    receiptChannel=db.channel('ilbp-receipts-'+userId+'-'+id)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:'conversation_id=eq.'+id},function(){refresh();})
      .subscribe();
  }
  function report(stage,error){if(error&&!warned.has(stage)){warned.add(stage);console.warn('[IL Bate Papo] Confirmação '+stage+':',error.message||error);}}

  function getClient() {
    if (client) return client;
    if (window.__ilbpAppClient || window.__ilbpToolsClient) client = window.__ilbpAppClient || window.__ilbpToolsClient;
    else if (window.supabase && window.ILBPCreateClient) {
      client = window.ILBPCreateClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
      window.__ilbpToolsClient = client;
    }
    return client;
  }

  function normalize(value) {
    return String(value || "").trim().toLocaleLowerCase("pt-BR");
  }

  async function loadConversations() {
    var db = getClient();
    if (!db) return;
    var auth = await db.auth.getUser();
    var user = auth.data && auth.data.user;
    if (!user) { userId="";conversationMap={};return; }
    userId = user.id;

    var mine = await db.from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);
    var ids = (mine.data || []).map(function (row) { return row.conversation_id; });
    if (!ids.length) return;

    var members = await db.from("conversation_members")
      .select("conversation_id,user_id")
      .in("conversation_id", ids)
      .neq("user_id", userId);
    var peerIds = (members.data || []).map(function (row) { return row.user_id; });
    if (!peerIds.length) return;

    var profiles = await db.from("profiles")
      .select("id,display_name,username")
      .in("id", peerIds);
    var byId = {};
    (profiles.data || []).forEach(function (profile) { byId[profile.id] = profile; });
    conversationMap = {};
    (members.data || []).forEach(function (member) {
      var profile = byId[member.user_id];
      if (!profile) return;
      conversationMap[normalize(profile.display_name)] = member.conversation_id;
      conversationMap[normalize(profile.username)] = member.conversation_id;
    });

    ids.forEach(function (id) {
      Promise.resolve(db.rpc("mark_messages_delivered", { p_conversation_id: id })).then(function(result){report('de entrega',result.error);}).catch(function(error){report('de entrega',error);});
    });
  }

  function activeConversationId() {
    var active=document.querySelector('.conversation[data-conversation-id]');
    if(active)return active.dataset.conversationId||'';
    var selected = document.querySelector(".chat-list button.selected");
    var heading = document.querySelector(".conversation-head strong");
    var text = normalize((heading && heading.textContent) || (selected && selected.textContent));
    if (!text) return "";
    if (conversationMap[text]) return conversationMap[text];
    var key = Object.keys(conversationMap).find(function (name) {
      return name && (text.includes(name) || name.includes(text));
    });
    return key ? conversationMap[key] : "";
  }

  function paint(rows) {
    var outgoing = (rows || []).filter(function (row) { return row.sender_id === userId; });
    var byId=new Map(outgoing.map(function(row){return [String(row.id),row];}));
    document.querySelectorAll(".messages .message.me").forEach(function (bubble) {
      var time = bubble.querySelector(":scope > span");
      if (!time) return;
      var mark = time.querySelector(".il-read-receipt");
      if (!mark) {
        mark = document.createElement("b");
        mark.className = "il-read-receipt";
        time.appendChild(mark);
      }
      var row = byId.get(bubble.dataset.messageId) || {};
      var text=row.read_at || row.delivered_at ? "✓✓" : "✓";
      if(mark.textContent!==text)mark.textContent=text;
      mark.classList.toggle("is-read", Boolean(row.read_at));
      mark.title = row.read_at ? "Lida" : row.delivered_at ? "Entregue" : "Enviada";
    });
  }

  async function refresh() {
    var db = getClient();
    if (!db || !userId || refreshing) return;
    var conversationId = activeConversationId();
    if (!conversationId) return;
    watchConversation(db,conversationId);
    var account=userId;refreshing=true;
    try {
    lastConversationId = conversationId;
    if (document.visibilityState === "visible") {
      var read=await db.rpc("mark_messages_read", { p_conversation_id: conversationId });report('de leitura',read.error);
    }
    var result = await db.from("messages")
      .select("id,sender_id,delivered_at,read_at,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at");
    if (!result.error && userId===account && activeConversationId()===conversationId) paint(result.data || []);
    else report('de estado',result.error);
    } catch(error){report('de estado',error);} finally {refreshing=false;}
  }

  async function start() {
    await loadConversations();
    await refresh();
    var db=getClient();if(db)db.auth.onAuthStateChange(function(){if(receiptChannel)db.removeChannel(receiptChannel);receiptChannel=null;watchedConversation='';userId='';conversationMap={};setTimeout(function(){loadConversations().then(refresh).catch(function(error){report('da sessão',error);});},0);});
    setInterval(refresh, 3500);
    setInterval(loadConversations, 30000);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && lastConversationId) refresh();
  });
  if(typeof MutationObserver!=='undefined')new MutationObserver(function(){
    var signature=activeConversationId()+'|'+Array.from(document.querySelectorAll('.messages .message.me')).map(function(b){return b.dataset.messageId+':'+Boolean(b.querySelector('.il-read-receipt'));}).join(',');
    if(signature===domSignature)return;domSignature=signature;refresh();
  }).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load", function () { setTimeout(start, 1000); });
})();
