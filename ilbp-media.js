(function () {
  'use strict';
  // Keep all authentication clients on the IL Bate Papo's own browser session.
  // This does NOT isolate server-side data: that still requires a dedicated project.
  window.ILBPCreateClient = function (url, key, options) {
    const opts = {...options, auth: {...options?.auth, storageKey:'ilbp-auth-v1:' + new URL(url).hostname}};
    return window.supabase.createClient(url, key, opts);
  };
  const retryButtons = new WeakMap();
  window.ILBPPlayMedia = async function (element) {
    if (!element) return;
    try {
      await element.play();
      retryButtons.get(element)?.remove();retryButtons.delete(element);
    } catch (error) {
      if (error.name !== 'NotAllowedError') { console.warn('[IL Bate Papo] Reprodução indisponível:',error.name);return; }
      if (retryButtons.has(element)) return;
      const host = element.closest('.call-screen');if (!host) return;
      const button = document.createElement('button');button.type='button';button.className='ilbp-enable-call-sound';button.textContent='🔊 Ativar som da chamada';
      button.style.cssText='position:absolute;z-index:30;top:80px;left:50%;transform:translateX(-50%);padding:14px;border:1px solid #19d7ff;border-radius:12px;background:#07111f;color:#fff';
      button.onclick=async()=>{try{await element.play();button.remove();retryButtons.delete(element);}catch{button.textContent='🔊 Toque para tentar o som novamente';}};
      retryButtons.set(element,button);host.appendChild(button);
    }
  };
})();
