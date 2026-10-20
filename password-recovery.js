(async function () {
  'use strict';
  const params = new URLSearchParams(location.hash.slice(1));
  // Keep credentials only in memory, never in browser history or persistent storage.
  history.replaceState(null, '', location.pathname);
  const status = document.getElementById('status');
  const form = document.getElementById('recovery-form');
  const save = document.getElementById('save');
  const password = document.getElementById('password');
  const confirmation = document.getElementById('confirmation');
  const invalid = 'Este link é inválido ou expirou. Volte à entrada e solicite outro em “Esqueci minha senha”.';
  let db;
  let ready = false;
  try {
    if (params.has('error') || params.get('type') !== 'recovery' ||
        !params.get('access_token') || !params.get('refresh_token')) throw new Error(invalid);
    db = window.supabase.createClient(
      'https://cipfycetzelxzwpfaqiu.supabase.co',
      'sb_publishable_5AjtGWLaJG8VSk22RJpePA_k_DPQAuk',
      {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}}
    );
    const session = await db.auth.setSession({
      access_token: params.get('access_token'), refresh_token: params.get('refresh_token')
    });
    params.delete('access_token');
    params.delete('refresh_token');
    if (session.error || !session.data?.session) throw new Error(invalid);
    // Validate with the destination server, rather than trusting a decoded JWT.
    const user = await db.auth.getUser();
    if (user.error || !user.data?.user) throw new Error(invalid);
    ready = true;
    form.hidden = false;
    status.textContent = 'Use uma senha de pelo menos 8 caracteres.';
    password.focus();
  } catch (_) {
    status.textContent = invalid;
    return;
  }
  let busy = false;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!ready || busy) return;
    if (password.value.length < 8) {
      status.textContent = 'Use uma senha de pelo menos 8 caracteres.';
      return;
    }
    if (password.value !== confirmation.value) {
      status.textContent = 'As senhas precisam ser iguais.';
      confirmation.focus();
      return;
    }
    busy = true;
    save.disabled = true;
    status.textContent = 'Salvando sua nova senha…';
    try {
      const result = await db.auth.updateUser({password: password.value});
      if (result.error) {
        status.textContent = result.error.code === 'same_password'
          ? 'Escolha uma senha diferente da anterior.'
          : 'Não foi possível salvar. Tente novamente; se o link expirou, solicite outro.';
        return;
      }
      ready = false;
      password.value = '';
      confirmation.value = '';
      form.hidden = true;
      status.textContent = 'Senha atualizada! Volte para entrar com sua nova senha.';
      // End only this recovery session, leaving other devices untouched.
      try { await db.auth.signOut({scope: 'local'}); } catch (_) {}
    } catch (_) {
      status.textContent = 'Não foi possível conectar. Confira sua conexão e tente novamente.';
    } finally {
      busy = false;
      save.disabled = false;
    }
  });
})();
