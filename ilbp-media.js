(function () {
  'use strict';
  // Shrink media before network upload; never replace it with a larger result.
  window.ILBPPrepareAttachment = async function(file) {
    if (!file || file.size < 256*1024) return file;
    if (/^image\/(jpeg|png|webp)$/.test(file.type)) {
      const url=URL.createObjectURL(file), image=new Image();
      try {
        await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
        const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));
        return blob && blob.size<file.size ? new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:file.lastModified}) : file;
      } catch { return file; } finally { URL.revokeObjectURL(url); }
    }
    if (!file.type.startsWith('video/') || file.size<2*1024*1024 || !window.MediaRecorder) return file;
    const video=document.createElement('video');
    if (!video.captureStream || !HTMLCanvasElement.prototype.captureStream) return file;
    const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime)return file;
    const url=URL.createObjectURL(file);let source,output,recorder,frame,timer,visibility;
    video.preload='auto';video.playsInline=true;video.muted=true;
    try {
      await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('Video timeout')),10000);video.onloadeddata=resolve;video.onerror=reject;video.src=url;});clearTimeout(timer);
      // Re-encoding runs locally in real time. Preserve originals on unsupported/long videos.
      if(!Number.isFinite(video.duration)||video.duration>180)return file;
      source=video.captureStream();await video.play();
      const audio=source.getAudioTracks();video.pause();video.currentTime=0;
      // Some mobile browsers cannot capture soundtrack; never send a silent replacement.
      if(!audio.length)return file;
      const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(2,Math.round(video.videoWidth*scale/2)*2);canvas.height=Math.max(2,Math.round(video.videoHeight*scale/2)*2);
      const ctx=canvas.getContext('2d');const draw=()=>{ctx.drawImage(video,0,0,canvas.width,canvas.height);frame=requestAnimationFrame(draw);};draw();
      output=canvas.captureStream(24);audio.forEach(track=>output.addTrack(track));
      recorder=new MediaRecorder(output,{mimeType:mime,videoBitsPerSecond:900000,audioBitsPerSecond:64000});
      const chunks=[];
      const blob=await new Promise((resolve,reject)=>{
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=reject;
        recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}));
        video.onended=()=>{if(recorder.state!=='inactive')recorder.stop();};
        video.onerror=reject;
        visibility=()=>{if(document.hidden)reject(Error('Video interrupted'));};document.addEventListener('visibilitychange',visibility);
        timer=setTimeout(()=>reject(Error('Video timeout')),(video.duration+15)*1000);
        recorder.start(1000);video.play().catch(reject);
      });
      return blob.size && blob.size<file.size ? new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webm',{type:mime,lastModified:file.lastModified}) : file;
    } catch { return file; }
    finally {
      clearTimeout(timer);cancelAnimationFrame(frame);if(visibility)document.removeEventListener('visibilitychange',visibility);
      if(recorder && recorder.state!=='inactive'){recorder.onstop=null;recorder.stop();}
      video.pause();source?.getTracks().forEach(t=>t.stop());output?.getTracks().forEach(t=>t.stop());video.removeAttribute('src');video.load();URL.revokeObjectURL(url);
    }
  };

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
  // Bind each kind independently: receiving audio must not reload the video.
  const remoteBindings = new WeakMap();
  window.ILBPReleaseMedia = function (element) {
    if (!element) return;
    retryButtons.get(element)?.remove();retryButtons.delete(element);
    const binding=remoteBindings.get(element);
    binding?.dispose?.();remoteBindings.delete(element);
    if (typeof element.pause === 'function') element.pause();
    element.srcObject=null;
  };
  window.ILBPAttachRemoteTrack = function (video, audio, track) {
    if (!track || !['audio','video'].includes(track.kind)) return;
    const element = track.kind === 'video' ? video : audio;
    if (!element) return;
    let binding = remoteBindings.get(element);
    if (!binding) {
      binding = {stream:new MediaStream(), track:null};
      remoteBindings.set(element,binding);
    }
    if (binding.track === track) return;
    binding.dispose?.();
    binding.stream.getTracks().forEach(previous => binding.stream.removeTrack(previous));
    binding.stream.addTrack(track);binding.track=track;
    if (track.kind === 'video') { element.muted=true;element.playsInline=true; }
    if (element.srcObject !== binding.stream) element.srcObject=binding.stream;
    const play = () => {
      if (binding.track !== track || track.readyState === 'ended' || element.isConnected === false) return;
      window.ILBPPlayMedia(element);
    };
    track.addEventListener('unmute',play);
    const ended = () => {
      track.removeEventListener('unmute',play);
      if (binding.track !== track) return;
      binding.stream.removeTrack(track);binding.track=null;
      if (track.kind === 'video') {
        element.classList.remove('ilbp-video-ready');
        element.closest('.call-screen')?.classList.remove('ilbp-remote-ready');
      }
    };
    track.addEventListener('ended',ended,{once:true});
    binding.dispose=()=>{track.removeEventListener('unmute',play);track.removeEventListener('ended',ended);};
    play();
  };
  if (typeof document !== 'undefined') {
    const resume=()=>{
      if(document.hidden)return;
      document.querySelectorAll('.call-screen audio,.call-screen video').forEach(element=>{
        if(element.srcObject?.getTracks().some(track=>track.readyState==='live'))window.ILBPPlayMedia(element);
      });
    };
    document.addEventListener('visibilitychange',resume);
    window.addEventListener?.('pageshow',resume);
  }
})();

