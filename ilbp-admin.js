(function () {
  "use strict";
  window.ILBPOpenAdmin = async function (client) {
    document.querySelector(".ilbp-admin-modal")?.remove();
    var modal = document.createElement("div");
    modal.className = "il-tools-modal ilbp-admin-modal";
    modal.innerHTML = '<div class="il-tools-card"><button type="button" class="il-tools-close-top" aria-label="Fechar painel">×</button><h3>Administrador do IL Bate Papo</h3><p class="ilbp-admin-status" role="status">Verificando sua permissão…</p><button type="button" class="ilbp-admin-retry" hidden>Tentar novamente</button></div>';
    modal.querySelector(".il-tools-close-top").onclick = function () { modal.remove(); };
    modal.querySelector(".ilbp-admin-retry").onclick = function () { window.ILBPOpenAdmin(client); };
    document.body.appendChild(modal);
    var card = modal.querySelector(".il-tools-card"), status = modal.querySelector(".ilbp-admin-status");
    function fail(message) {
      if (!modal.isConnected) return;
      status.textContent = message;
      modal.querySelector(".ilbp-admin-retry").hidden = false;
    }
    async function timed(operation) {
      var timer;
      try { return await Promise.race([operation, new Promise(function (_, reject) {
        timer = setTimeout(function () { reject(new Error("timeout")); }, 12000);
      })]); } finally { clearTimeout(timer); }
    }
    try {
      if (!client) { fail("Não foi possível conectar. Reabra o aplicativo e tente novamente."); return; }
      var identity = await timed(client.auth.getUser());
      if (!modal.isConnected) return;
      if (identity.error || !identity.data?.user) { fail("Entre novamente na sua conta para verificar o acesso de administrador."); return; }
      var permission = await timed(client.from("app_admins").select("user_id").eq("user_id", identity.data.user.id).limit(1).maybeSingle());
      if (!modal.isConnected) return;
      if (permission.error) { fail("Não foi possível verificar a permissão de administrador. Tente novamente."); return; }
      if (!permission.data) { fail("Esta conta não foi reconhecida como administradora. Entre com sua conta de administrador."); return; }
      status.textContent = "Conta reconhecida como administradora. Os indicadores disponíveis aparecem abaixo.";
      card.dataset.adminVerified = "1";
      document.dispatchEvent(new CustomEvent("ilbp-admin-verified", { detail: { card: card } }));
    } catch (_) { fail("A verificação não respondeu. Confira sua conexão e tente novamente."); }
  };
})();
