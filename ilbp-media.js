(function () {
  'use strict';
  let captureQueue = Promise.resolve();
  window.ILBPGetUserMedia = function (constraints) {
    const capture = async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não oferece acesso à câmera e ao microfone.');
      try { return await navigator.mediaDevices.getUserMedia(constraints); }
      catch (error) {
        if (!['NotReadableError','AbortError','OverconstrainedError'].includes(error.name)) throw error;
        // Retry only device-start failures, never a denied permission.
        await new Promise(resolve => setTimeout(resolve, 350));
        return navigator.mediaDevices.getUserMedia({
          audio: constraints.audio ? true : false,
          video: constraints.video || false
        });
      }
    };
    const result = captureQueue.then(capture);
    captureQueue = result.catch(() => {});
    return result;
  };
  window.ILBPMediaError = function (error) {
    if (error?.name === 'NotAllowedError') return 'Permita o microfone e a câmera nas configurações do aplicativo ou do navegador.';
    if (error?.name === 'NotReadableError' || error?.name === 'AbortError') return 'Não foi possível iniciar o microfone ou a câmera. Feche outras chamadas e tente novamente.';
    if (error?.name === 'NotFoundError') return 'O aparelho não encontrou o microfone ou a câmera.';
    return error?.message || 'Não foi possível abrir o microfone ou a câmera.';
  };
  if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    function prepareVideos() {
      document.querySelectorAll('.call-screen video').forEach(video => {
        if (video.dataset.ilbpReadyBound) return;
        video.dataset.ilbpReadyBound = '1';
        const update = () => {
          const ready = video.readyState >= 2 && video.videoWidth > 0;
          video.classList.toggle('ilbp-video-ready', ready);
          if (video.classList.contains('remote-video')) video.closest('.call-screen')?.classList.toggle('ilbp-remote-ready', ready);
        };
        ['loadedmetadata','loadeddata','canplay','playing','resize','emptied','ended'].forEach(event => video.addEventListener(event, update));
        update();
      });
    }
    new MutationObserver(prepareVideos).observe(document.documentElement, {childList:true,subtree:true});
    prepareVideos();
  }
  // Keep all authentication clients on the IL Bate Papo's own browser session.
  // This does NOT isolate server-side data: that still requires a dedicated project.
  const authClients = new Map();
  window.ILBPCreateClient = function (url, key, options) {
    if(authClients.has(url))return authClients.get(url);
    const hostname=new URL(url).hostname,storageKey='ilbp-auth-v1:' + hostname;
    // Preserve this site's existing login when upgrading its legacy client.
    // Never overwrite the app's current session or remove the legacy copy.
    try{
      const storage=window.localStorage;
      if(storage&&!storage.getItem(storageKey)){
        const legacy=storage.getItem('sb-'+hostname.split('.')[0]+'-auth-token');
        if(legacy){const session=JSON.parse(legacy);if(session.access_token&&session.refresh_token)storage.setItem(storageKey,legacy);}
      }
    }catch{}
    const opts = {...options, auth: {...options?.auth, storageKey}};
    const client=window.supabase.createClient(url,key,opts);
    authClients.set(url,client);window.__ilbpAppClient=client;return client;
  };
  const retryButtons = new WeakMap();
  // Refresh private attachment links once after a load failure. Do not retry
  // indefinitely or start playback without a user gesture.
  const attachmentRetries = new WeakMap();
  async function renewAttachment(element) {
    const path = element.dataset.attachmentPath;
    const db = window.__ilbpAppClient;
    if (!path || !db) throw new Error('A sessão do aplicativo ainda não está disponível.');
    const result = await db.storage.from('chat-files').createSignedUrl(path, 3600);
    if (result.error || !result.data?.signedUrl) throw result.error || new Error('Não foi possível renovar o arquivo.');
    element.src = result.data.signedUrl;
    if (element.tagName !== 'IMG') element.load();
  }
  if (typeof document !== 'undefined') document.addEventListener('error', async event => {
    const element = event.target;
    if (!element?.matches?.('.messages audio[data-attachment-path],.messages video[data-attachment-path],.messages img[data-attachment-path]')) return;
    let state = attachmentRetries.get(element);
    if (!state) { state = {attempted:false, busy:false}; attachmentRetries.set(element,state); }
    if (state.busy) return;
    if (!state.attempted) {
      state.attempted=true;state.busy=true;
      try { await renewAttachment(element); return; }
      catch (error) { console.warn('[IL Bate Papo] Arquivo indisponível:',error.message); }
      finally { state.busy=false; }
    }
    if (state.button?.isConnected) return;
    const button=document.createElement('button');button.type='button';button.className='ilbp-retry-attachment';
    button.textContent='Arquivo indisponível. Toque para carregar novamente.';
    button.style.cssText='display:block;max-width:100%;margin:8px 0;padding:10px;color:inherit;background:transparent;border:1px solid currentColor;border-radius:8px';
    button.onclick=async()=>{
      if(state.busy)return;state.busy=true;button.disabled=true;
      try { await renewAttachment(element);button.remove();state.button=null; }
      catch { button.textContent='Não foi possível carregar. Confira a conexão e tente novamente.'; }
      finally { state.busy=false;button.disabled=false; }
    };
    state.button=button;element.after(button);
  },true);
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

