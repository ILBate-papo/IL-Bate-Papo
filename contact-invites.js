(function () {
  "use strict";
  var URL = "https://ngidsolvxegpyrprlbex.supabase.co";
  var KEY = "sb_publishable_-8u67PtkHJj1yRVWtOIkog_2skdsDcz";
  var db, userId = "", busy = false, sharedBusy = false, accepting = false;

  function client() {
    if (db) return db;
    db = window.__ilbpToolsClient || (window.supabase && window.ILBPCreateClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    }));
    if (db) window.__ilbpToolsClient = db;
    return db;
  }

  function clear() {
    document.querySelectorAll(".il-contact-invite").forEach(function (item) { item.remove(); });
  }

  function sharedUsername() {
    return (new URLSearchParams(location.search).get("contato") || "")
      .trim().replace(/^@/, "");
  }

  var sharedHandled = "", subscribed = false;
  function finishSharedInvite() {
    try { localStorage.removeItem("ilbp-pending-contact"); } catch (_) {}
    var url = new window.URL(location.href);
    url.searchParams.delete("contato");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    document.querySelectorAll(".ilbp-invite-guide").forEach(function (node) { node.remove(); });
  }
  function showInviteGuide() {
    var username = sharedUsername(), card = document.querySelector(".auth-card");
    if (!username || !card || card.querySelector(".ilbp-invite-guide")) return;
    var guide = document.createElement("section");guide.className = "ilbp-invite-guide";
    var title = document.createElement("strong");title.textContent = "Você recebeu um convite de @" + username;
    var help = document.createElement("p");help.textContent = "Crie sua conta ou entre. Seu convite ficará guardado para você adicionar o contato depois.";
    var cancel = document.createElement("button");cancel.type = "button";cancel.textContent = "Dispensar convite";
    cancel.onclick = finishSharedInvite;guide.append(title, help, cancel);card.prepend(guide);
  }
  function confirmSharedContact(profile) {
    return new Promise(function (resolve) {
      var dialog = document.createElement("dialog");dialog.className = "ilbp-share-dialog";
      var title = document.createElement("h2");title.id = "ilbp-received-title";title.textContent = "Adicionar " + (profile.display_name || profile.username) + "?";
      dialog.setAttribute("aria-labelledby", title.id);
      var help = document.createElement("p");help.textContent = "@" + profile.username + " compartilhou este convite. Adicione o contato para conversar e fazer chamadas.";
      var yes = document.createElement("button"), no = document.createElement("button");yes.type = no.type = "button";yes.textContent = "Adicionar contato";no.textContent = "Agora não";
      function done(value) { dialog.remove();resolve(value); }
      yes.onclick = function () { done(true); };no.onclick = function () { done(false); };
      dialog.addEventListener("cancel", function (event) { event.preventDefault();done(false); });
      dialog.append(title, help, yes, no);document.body.appendChild(dialog);dialog.showModal();
    });
  }
  async function addSharedContact() {
    var username = sharedUsername();
    if (!username || sharedBusy) return;
    sharedBusy = true;
    try {
      var c = client();if (!c) return;
      var auth = await c.auth.getUser(), user = auth.data && auth.data.user;
      if (auth.error || !user || sharedHandled === user.id + ":" + username) return;
      var profile = await c.from("profiles").select("id,display_name,username")
        .ilike("username", username.replace(/[%_\\]/g, "\\$&")).maybeSingle();
      if (profile.error) return;
      if (!profile.data) { sharedHandled = user.id + ":" + username;alert("Este contato não foi encontrado. Confira o convite com quem enviou.");return; }
      if (profile.data.id === user.id) { finishSharedInvite();return; }
      var relation = await c.from("friendships").select("status,requester_id,addressee_id")
        .or("and(requester_id.eq." + user.id + ",addressee_id.eq." + profile.data.id + "),and(requester_id.eq." + profile.data.id + ",addressee_id.eq." + user.id + ")");
      if (relation.error) return;
      if ((relation.data || []).some(function (row) { return row.status === "blocked"; })) {
        sharedHandled = user.id + ":" + username;alert("Este contato está bloqueado.");return;
      }
      if ((relation.data || []).some(function (row) { return row.status === "accepted"; })) { finishSharedInvite();return; }
      sharedHandled = user.id + ":" + username;
      if (!await confirmSharedContact(profile.data)) return;
      // Recheck the session after the user decides; never apply an invite to a different account.
      var current = await c.auth.getUser();
      if (current.error || current.data?.user?.id !== user.id) throw new Error("Entre novamente na sua conta.");
      var result = await c.rpc("accept_contact_link", { p_username: profile.data.username });
      if (result.error || !result.data) throw new Error(result.error?.message || "Não foi possível adicionar o contato.");
      finishSharedInvite();clear();location.reload();
    } catch (error) {
      sharedHandled = "";alert("Não foi possível adicionar este contato agora. Tente novamente em Encontrar amigos.");
    } finally { sharedBusy = false; }
  }

  async function accept(invite, button) {
    if (accepting) return;
    accepting = true;
    button.disabled = true;
    button.textContent = "Aceitando…";
    try {
    var auth = await client().auth.getUser();
    if (auth.error || !auth.data?.user || auth.data.user.id !== userId) throw new Error("Entre novamente na conta que recebeu o convite.");
    var result = await client().from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("requester_id", invite.requester_id)
      .eq("addressee_id", userId)
      .eq("status", "pending").select("requester_id");
    if (result.error || !result.data?.length) {
      throw new Error(result.error?.message || "O convite não foi aceito. Atualize a tela e tente novamente.");
    }
    clear();
    location.reload();
    } catch (error) {
      button.disabled = false;
      button.textContent = "Aceitar";
      alert("Não foi possível aceitar agora: " + error.message);
    } finally {
      accepting = false;
    }
  }

  function escapeText(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function render(invite, profile) {
    clear();
    var box = document.createElement("div");
    box.className = "il-contact-invite";
    var name = profile && (profile.display_name || profile.username) || "Uma pessoa";
    box.innerHTML = '<span><b>👤 ' + escapeText(name) + '</b><small>quer adicionar você</small></span>' +
      '<button type="button">Aceitar</button><button type="button" class="later">Depois</button>';
    var buttons = box.querySelectorAll("button");
    buttons[0].onclick = function () { accept(invite, buttons[0]); };
    buttons[1].onclick = function () { box.remove(); };
    var actions = document.querySelector(".ilbp-friend-actions");
    if (actions) { box.classList.add("il-invite-in-contacts"); actions.after(box); }
    else document.body.appendChild(box);
  }

  async function check(explicit) {
    if (busy || accepting) return;
    busy = true;
    try {
      var c = client();
      if (!c) return;
      if (!subscribed && c.auth.onAuthStateChange) {
        subscribed = true;
        c.auth.onAuthStateChange(function (event) {
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION") setTimeout(addSharedContact, 0);
          if (event === "SIGNED_OUT") { sharedHandled = "";clear(); }
        });
      }
      var auth = await c.auth.getUser();
      var user = auth.data && auth.data.user;
      if (!user) { userId = ""; clear(); return; }
      userId = user.id;
      var pending = await c.from("friendships")
        .select("requester_id,created_at")
        .eq("addressee_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (pending.error) { if(explicit)alert("Não foi possível consultar os convites. Tente novamente.");return; }
      if (!pending.data) { clear();if(explicit)alert("Você não tem convites pendentes nesta conta.");return; }
      var profile = await c.from("profiles")
        .select("display_name,username")
        .eq("id", pending.data.requester_id)
        .maybeSingle();
      render(pending.data, profile.data);
    } finally { busy = false; }
  }
  window.ILBPOpenContactInvites = function () { return check(true); };
  document.addEventListener("click", function (event) {
    if (event.target.closest('.mobile-nav button,.rail button')) setTimeout(function () { check(false); }, 150);
  });

  new MutationObserver(showInviteGuide).observe(document.documentElement, { childList: true, subtree: true });
  showInviteGuide();
  window.addEventListener("load", function () {
    showInviteGuide();
    setTimeout(addSharedContact, 1200);
    setTimeout(check, 1800);
    setInterval(function () { check(false);addSharedContact();showInviteGuide(); }, 12000);
  });
})();


