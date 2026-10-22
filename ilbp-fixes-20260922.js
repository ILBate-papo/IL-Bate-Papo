// Compatibility for installed Android builds with a bundled legacy client.
(function () {
  'use strict';
  if (window.__ilbpDatabaseBridge) return;
  window.__ilbpDatabaseBridge = true;
  const oldOrigin = 'https://ngidsolvxegpyrprlbex.supabase.co';
  const newOrigin = 'https://cipfycetzelxzwpfaqiu.supabase.co';
  const oldKey = 'sb_publishable_-8u67PtkHJj1yRVWtOIkog_2skdsDcz';
  const newKey = 'sb_publishable_5AjtGWLaJG8VSk22RJpePA_k_DPQAuk';
  function isLegacy(url) {
    try { return new URL(url).origin === oldOrigin; } catch (_) { return false; }
  }
  function wrapFactory(factory) {
    if (typeof factory !== 'function') return factory;
    return function (url, key, options) {
      return factory.call(this, isLegacy(url) ? newOrigin : url,
        isLegacy(url) ? newKey : key, options);
    };
  }
  let factory = wrapFactory(window.ILBPCreateClient);
  Object.defineProperty(window, 'ILBPCreateClient', {
    configurable: true, enumerable: true,
    get: function () { return factory; },
    set: function (value) { factory = wrapFactory(value); }
  });
  // Older push helpers use fetch directly instead of the shared client.
  // Match only the retired project; keep user JWTs and unrelated requests intact.
  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      const isRequest = typeof Request !== 'undefined' && input instanceof Request;
      const url = isRequest ? input.url : String(input);
      if (!isLegacy(url)) return originalFetch.call(this, input, init);
      const target = newOrigin + url.slice(oldOrigin.length);
      const headers = new Headers(init && init.headers !== undefined ? init.headers : isRequest ? input.headers : undefined);
      if (headers.get('apikey') === oldKey) headers.set('apikey', newKey);
      if (headers.get('authorization') === 'Bearer ' + oldKey) headers.set('authorization', 'Bearer ' + newKey);
      if (isRequest) {
        const request = new Request(new Request(target, input), Object.assign({}, init, {headers: headers}));
        return originalFetch.call(this, request);
      }
      return originalFetch.call(this, target, Object.assign({}, init, {headers: headers}));
    };
  }
})();

(function(){
  'use strict';
  function addPasswordEyes(){
    document.querySelectorAll('input[type="password"]').forEach(function(input){
      const field=input.closest('.field') || input.parentElement;
      if(!field || field.querySelector('.ilbp-password-eye')) return;
      field.style.position='relative'; input.style.paddingRight='48px';
      const b=document.createElement('button');
      b.type='button'; b.className='ilbp-password-eye'; b.textContent='👁';
      b.setAttribute('aria-label','Mostrar senha'); b.setAttribute('title','Mostrar senha');
      b.addEventListener('click',function(ev){
        ev.preventDefault(); ev.stopPropagation();
        const showing=input.type==='text'; input.type=showing?'password':'text';
        b.textContent=showing?'👁':'🙈';
        b.setAttribute('aria-label',showing?'Mostrar senha':'Ocultar senha');
        b.setAttribute('title',showing?'Mostrar senha':'Ocultar senha'); input.focus();
      });
      field.appendChild(b);
    });
  }
  new MutationObserver(addPasswordEyes).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addPasswordEyes); else addPasswordEyes();
})();
