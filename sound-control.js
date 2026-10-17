(function(){
 'use strict';
 let context=null,resuming=null,pendingMessage=0,promptDismissed=false;
 const nodes={message:new Set(),incoming:new Set(),outgoing:new Set()},timers={},active={},seen=new Set();
 function prompt(){
  if(promptDismissed||document.getElementById('ilbp-unlock-sound'))return;
  const box=document.createElement('div');box.id='ilbp-unlock-sound';
  box.style.cssText='position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:25000;box-sizing:border-box;width:calc(100% - 32px);max-width:360px;padding:10px;border-radius:12px;border:1px solid #19d7ff;background:#07111f;color:white;display:flex;gap:8px;align-items:center;font:14px/1.4 system-ui';
  const button=document.createElement('button');button.type='button';button.textContent='🔊 Ativar e testar som';
  button.style.cssText='flex:1;min-height:40px;border:0;border-radius:8px;background:#15c9ef;color:#00131a;font:inherit';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar aviso de som');
  close.style.cssText='width:40px;height:40px;border:0;background:transparent;color:white;font-size:24px';
  close.onclick=()=>{promptDismissed=true;box.remove();};
  button.onclick=async()=>{
   button.disabled=true;button.textContent='Ativando som…';
   try{await window.ILBPSounds.test();}
   catch{button.textContent='Som bloqueado. Toque para tentar novamente.';}
   finally{button.disabled=false;}
  };
  box.append(button,close);document.body.appendChild(box);
 }
 async function unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
  if(!context||context.state==='closed')context=new Audio();
  const wasRunning=context.state==='running';
  if(context.state==='suspended'||context.state==='interrupted'){
   if(!resuming){
    let timer;
    resuming=Promise.race([context.resume(),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),2500);})]).finally(()=>{clearTimeout(timer);resuming=null;});
   }
   try{await resuming;}catch{}
   if(!context)return false;
   if(context.state!=='running'){
    const failed=context;context=null;
    try{Promise.resolve(failed.close()).catch(()=>{});}catch{}
    return false;
   }
  }
  if(!context||context.state!=='running')return false;
  document.getElementById('ilbp-unlock-sound')?.remove();
  if(!wasRunning){for(const kind of ['incoming','outgoing'])if(active[kind])pattern(kind);}
  if(pendingMessage&&Date.now()-pendingMessage<15000){pendingMessage=0;pattern('message');}
  window.dispatchEvent(new Event('ilbp-sound-state'));return true;
 }
 function tone(kind,frequency,offset,duration){
  const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime+offset;
  oscillator.type='sine';oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.2,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  oscillator.connect(gain).connect(context.destination);nodes[kind].add(oscillator);
  oscillator.onended=()=>{nodes[kind].delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(now);oscillator.stop(now+duration+.02);
 }
 function pattern(kind){
  if(!context||context.state!=='running'){prompt();return false;}
  if(kind==='message'){tone(kind,880,0,.16);tone(kind,1100,.2,.16);}
  else if(kind==='incoming')[0,.22,.7,.92].forEach((offset,i)=>tone(kind,i%2?920:740,offset,.18));
  else{tone(kind,425,0,.32);tone(kind,425,.65,.32);}
  return true;
 }
 function start(kind){if(active[kind])return;active[kind]=true;pattern(kind);timers[kind]=setInterval(()=>{if(active[kind])pattern(kind);},kind==='incoming'?2100:3500);}
 function stop(kind){active[kind]=false;clearInterval(timers[kind]);delete timers[kind];for(const oscillator of nodes[kind]){try{oscillator.stop();}catch{}}nodes[kind].clear();}
 window.ILBPSounds={unlock,
  message(id){if(id&&seen.has(id))return;if(id){seen.add(id);if(seen.size>256)seen.delete(seen.values().next().value);}if(!pattern('message'))pendingMessage=Date.now();},
  startIncoming:()=>start('incoming'),stopIncoming:()=>stop('incoming'),
  startOutgoing:()=>start('outgoing'),stopOutgoing:()=>stop('outgoing'),
  async test(){if(!await unlock())throw new Error('Não foi possível ativar o som neste navegador.');pattern('message');}
 };
 document.addEventListener('pointerdown',()=>{unlock().catch(()=>{});},{passive:true});document.addEventListener('keydown',()=>{unlock().catch(()=>{});});
 function recover(){if(document.hidden||!context)return;unlock().then(ok=>{if(!ok)prompt();}).catch(()=>prompt());}
 document.addEventListener('visibilitychange',recover);
 window.addEventListener('pageshow',recover);
 window.addEventListener('focus',recover);
 window.addEventListener('pagehide',()=>{stop('incoming');stop('outgoing');stop('message');});
 function install(){
  const profile=document.querySelector('.profile');if(!profile||profile.querySelector('.ilbp-sound-test'))return;
  const section=document.createElement('section');section.className='ilbp-sound-test';section.style.cssText='margin:12px 0;padding:12px;border:1px solid #19d7ff55;border-radius:12px';
  const button=document.createElement('button');button.type='button';button.textContent='🔊 Testar som deste aparelho';button.style.cssText='width:100%;min-height:44px;border-radius:10px;background:#15c9ef;color:#00131a;border:0';
  const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='font-size:12px;line-height:1.5';status.textContent='Teste o som antes de receber chamadas e mensagens.';
  button.onclick=async()=>{try{await window.ILBPSounds.test();status.textContent='Teste iniciado. Se não ouvir, confira o volume, a aba silenciada e a saída de som do aparelho.';}catch(error){status.textContent=error.message;}};
  section.append(button,status);profile.appendChild(section);
 }
 new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});install();
})();

