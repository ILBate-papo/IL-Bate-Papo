(function(){
 'use strict';
 let context=null,resuming=null,pendingMessage=0;
 const nodes={message:new Set(),incoming:new Set(),outgoing:new Set()},timers={},active={},seen=new Set();
 function prompt(){
  if(document.getElementById('ilbp-unlock-sound'))return;
  const button=document.createElement('button');button.id='ilbp-unlock-sound';button.type='button';button.textContent='🔊 Ativar som neste aparelho';
  button.style.cssText='position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:25000;padding:12px;border-radius:12px;border:1px solid #19d7ff;background:#07111f;color:white';
  button.onclick=()=>unlock().catch(()=>{button.textContent='🔊 Toque para tentar ativar o som';});document.body.appendChild(button);
 }
 async function unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
  context ||= new Audio();
  if(context.state==='suspended'){
   resuming ||= context.resume().finally(()=>{resuming=null;});await resuming;
  }
  if(context.state!=='running')return false;
  document.getElementById('ilbp-unlock-sound')?.remove();
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
