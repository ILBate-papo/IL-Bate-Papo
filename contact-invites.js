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

  async function addSharedContact() {
    var username = sharedUsername();
    if (!username || sharedBusy) return;
    sharedBusy = true;
    try {
      var c = client();
      if (!c) return;
      var auth = await c.auth.getUser();
      var user = auth.data && auth.data.user;
      if (!user) return;

      var profile = await c.from("profiles")
        .select("id,display_name,username")
        .ilike("username", username)
        .maybeSingle();
      if (profile.error || !profile.data || profile.data.id === user.id) return;

      if (!confirm("Adicionar " + (profile.data.display_name || profile.data.username) + " aos seus contatos do IL Bate Papo?")) return;
      var result = await c.rpc("accept_contact_link", { p_username: profile.data.username });
      if (result.error) {
        alert("Não foi possível adicionar este contato agora: " + result.error.message);
        return;
      }
      localStorage.removeItem("ilbp-pending-contact");
      history.replaceState(null, "", location.pathname + location.hash);
      clear();
      location.reload();
    } finally {
      sharedBusy = false;
    }
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

  window.addEventListener("load", function () {
    setTimeout(addSharedContact, 1200);
    setTimeout(check, 1800);
    setInterval(check, 12000);
  });
})();


