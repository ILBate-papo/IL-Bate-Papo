(function(){
 'use strict';
 let stream=null, recorder=null, generation=0, cleanup=null;
 async function open(composer){
  if(document.querySelector(".call-screen")){alert("Encerre a chamada antes de gravar com a câmera da conversa.");return;}
  if(cleanup)cleanup();
  document.querySelectorAll('.chat-camera-overlay').forEach(node=>node.remove());
  const overlay=document.createElement('div');overlay.className='chat-camera-overlay';
  overlay.innerHTML='<div class="chat-camera-head"><button type="button" aria-label="Fechar câmera">✕</button><strong>Câmera da conversa</strong><button type="button" aria-label="Trocar câmera">🔄</button></div><div class="chat-camera-stage"><video autoplay muted playsinline></video><span class="chat-camera-status">Preparando câmera…</span></div><div class="chat-camera-controls"><button type="button" class="take-photo">📷</button><button type="button" class="record-video">● Gravar vídeo</button></div>';
  document.body.appendChild(overlay);
  const video=overlay.querySelector('video'),status=overlay.querySelector('.chat-camera-status'),photo=overlay.querySelector('.take-photo'),record=overlay.querySelector('.record-video'),flip=overlay.querySelector('[aria-label="Trocar câmera"]');
  let devices=[],deviceIndex=0,front=false,previewURL=null,pending=false,opening=false;
  function message(text){status.style.display='block';status.textContent=text;}
  function stop(){if(recorder){recorder.onstop=null;recorder.ondataavailable=null;if(recorder.state!=='inactive')recorder.stop();recorder=null;}if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;}
  function close(){generation++;stop();if(previewURL)URL.revokeObjectURL(previewURL);overlay.remove();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',close);window.removeEventListener('ilbp-pause',close);window.removeEventListener('ilbp-release-camera',close);window.removeEventListener('popstate',routeChanged);window.removeEventListener('hashchange',routeChanged);observer.disconnect();if(cleanup===close)cleanup=null;}
  function hidden(){if(document.hidden)close();}
  function routeChanged(){close();}
  const observer=new MutationObserver(()=>{if(!composer.isConnected)close();});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('popstate',routeChanged);window.addEventListener('hashchange',routeChanged);
  cleanup=close;document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',close);window.addEventListener('ilbp-pause',close);window.addEventListener('ilbp-release-camera',close);overlay.querySelector('[aria-label="Fechar câmera"]').onclick=close;
  async function start(){
   if(opening)return;opening=true;
   const token=++generation;stop();photo.disabled=record.disabled=flip.disabled=true;
   message('Preparando câmera…');
   await new Promise(resolve=>setTimeout(resolve,350));
   if(token!==generation||!overlay.isConnected){opening=false;return;}
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Abra o site em um navegador com acesso à câmera.');
    let opened;
    const facing=front?'user':'environment';
    // Prefer lens facing: numeric device order may include several rear cameras.
    const candidates=[{facingMode:{exact:facing}}];
    const selected=devices.find(d=>front?/front|user|frontal|facetime/i.test(d.label):/back|rear|environment|traseira/i.test(d.label));
    if(selected)candidates.push({deviceId:{exact:selected.deviceId}});
    candidates.push({facingMode:{ideal:facing}},true);
    for(let attempt=0;attempt<candidates.length;attempt++){
     try{opened=await window.ILBPGetUserMedia({video:candidates[attempt],audio:false});break;}
     catch(error){if(!['OverconstrainedError','NotFoundError','NotReadableError','AbortError'].includes(error.name)||attempt===candidates.length-1)throw error;}
     if(token!==generation||!overlay.isConnected)return;
    }
    if(token!==generation||!overlay.isConnected){opened.getTracks().forEach(t=>t.stop());return;}
    stream=opened;video.srcObject=opened;await video.play();
    if(token!==generation||!overlay.isConnected)return;
    try{devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');}catch{devices=[];}
    const actualFacing=opened.getVideoTracks()[0]?.getSettings().facingMode;
    if(actualFacing)front=actualFacing==='user';
    const id=opened.getVideoTracks()[0]?.getSettings().deviceId;deviceIndex=Math.max(0,devices.findIndex(d=>d.deviceId===id));
    photo.disabled=record.disabled=false;flip.disabled=false;message('Câmera pronta');
   }catch(e){if(token!==generation)return;stop();message(e.name==='NotAllowedError'?'Permita a câmera nas configurações do IL Bate Papo ou do navegador.':e.name==='NotReadableError'?'A câmera está ocupada. Feche outro aplicativo ou chamada e tente novamente.':e.message||'Não foi possível abrir a câmera.');flip.disabled=false;}finally{opening=false;}
  }
  function preview(file){
   stop();photo.disabled=record.disabled=flip.disabled=true;
   previewURL=URL.createObjectURL(file);const stage=overlay.querySelector('.chat-camera-stage');stage.replaceChildren();
   const media=document.createElement(file.type.startsWith('image/')?'img':'video');media.className='chat-camera-preview';media.src=previewURL;if(media.tagName==='VIDEO'){media.controls=true;media.playsInline=true;}stage.appendChild(media);
   const controls=overlay.querySelector('.chat-camera-controls');controls.replaceChildren();
   for(const [text,action] of [['↻ Refazer',()=>{close();open(composer);}],['Enviar',()=>{const input=composer.querySelector('input.attachment-file');if(!input||!composer.isConnected){alert('Abra a conversa novamente para enviar.');return;}try{const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));close();}catch(e){alert('Não foi possível anexar. Tente selecionar o arquivo pelo botão de anexos.');}}],['Cancelar',close]]){const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=action;controls.appendChild(button);}
  }
  flip.onclick=()=>{if(opening||pending||recorder?.state==='recording')return;front=!front;start();};
  photo.onclick=()=>{if(pending||recorder?.state==='recording')return;if(!video.videoWidth){message('Aguarde a imagem da câmera.');return;}const token=generation;const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>{if(blob&&token===generation&&overlay.isConnected)preview(new File([blob],'foto-'+Date.now()+'.jpg',{type:'image/jpeg'}));},'image/jpeg',.9);};
  record.onclick=async()=>{
   if(recorder?.state==='recording'){record.disabled=true;recorder.stop();return;}
   if(pending||!stream)return;if(!stream.getVideoTracks().some(t=>t.readyState==='live')){message('A câmera parou. Toque em Refazer para abrir novamente.');return;}if(!window.MediaRecorder){message('Este navegador não permite gravar vídeo.');return;}
   pending=true;record.disabled=photo.disabled=flip.disabled=true;const token=generation;
   try{
    if(!stream.getAudioTracks().some(t=>t.readyState==='live')){
     message('Aguardando permissão do microfone para gravar com áudio…');
     let microphoneExpired=false,timer;
     const request=window.ILBPGetUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false}).then(mic=>{if(microphoneExpired||token!==generation||!overlay.isConnected){mic.getTracks().forEach(t=>t.stop());throw new Error('Permissão do microfone demorou. Tente novamente.');}return mic;});
     let mic;
     try{mic=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{microphoneExpired=true;reject(new Error('A permissão do microfone não respondeu.'));},12000);})]);}
     catch(error){message('Microfone indisponível: '+(error.message||error.name));if(!overlay.isConnected||token!==generation)return;if(!confirm('Não foi possível acessar o microfone. Deseja gravar o vídeo sem áudio?'))throw error;}
     finally{clearTimeout(timer);}
     if(mic){if(token!==generation||!stream||!overlay.isConnected){mic.getTracks().forEach(t=>t.stop());return;}mic.getAudioTracks().forEach(t=>stream.addTrack(t));}
    }
    message('Preparando gravação…');
    const mime=['video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
    recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);const active=recorder,chunks=[];
    active.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    active.onerror=event=>{stop();record.textContent='● Gravar vídeo';message('A gravação falhou: '+(event.error?.message||event.error?.name||'Abra a câmera novamente para tentar.'));};
    active.onstop=()=>{if(token!==generation||!overlay.isConnected)return;const type=active.mimeType||mime||'video/webm';const blob=new Blob(chunks,{type});if(!blob.size){stop();message('O vídeo ficou vazio. Abra a câmera novamente.');return;}preview(new File([blob],'video-'+Date.now()+(type.includes('mp4')?'.mp4':'.webm'),{type}));};
    recorder.start(1000);record.disabled=false;record.textContent='■ Parar gravação';message(stream.getAudioTracks().some(t=>t.readyState==='live')?'Gravando vídeo com áudio':'Gravando vídeo sem áudio');
   }catch(e){if(token===generation&&overlay.isConnected){message('Não foi possível gravar: '+(e.message||e.name));record.disabled=photo.disabled=false;flip.disabled=devices.length<2;}}
   finally{pending=false;}
  };
  await start();
 }
 function install(){document.querySelectorAll('.composer .camera-share-button').forEach(current=>{if(current.dataset.inChatCamera)return;const button=current.cloneNode(true);button.dataset.modeFix=button.dataset.nativeCamera=button.dataset.inChatCamera='1';current.replaceWith(button);button.type='button';button.setAttribute('aria-label','Abrir câmera na conversa');button.onclick=()=>open(button.closest('.composer'));});}
 new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});install();
})();

