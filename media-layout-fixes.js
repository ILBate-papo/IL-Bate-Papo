(function(){
 'use strict';
 let frame=0;const sizes=new WeakSet();
 function install(){
  frame=0;
  document.querySelectorAll('.composer').forEach(composer=>{
   if(sizes.has(composer))return;sizes.add(composer);
   const update=()=>document.documentElement.style.setProperty('--ilbp-composer-height',Math.ceil(composer.getBoundingClientRect().height)+'px');
   if(window.ResizeObserver)new ResizeObserver(update).observe(composer);update();
  });
  document.querySelectorAll('.self-video').forEach(preview=>{
   if(preview.dataset.ilbpExpand)return;preview.dataset.ilbpExpand='1';preview.tabIndex=0;preview.setAttribute('role','button');preview.setAttribute('aria-label','Ampliar sua câmera');preview.setAttribute('aria-expanded','false');
   const toggle=()=>{const expanded=preview.classList.toggle('ilbp-preview-expanded');preview.setAttribute('aria-expanded',String(expanded));preview.setAttribute('aria-label',expanded?'Reduzir sua câmera':'Ampliar sua câmera');};
   preview.addEventListener('click',toggle);preview.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
  });
  document.querySelectorAll('.profile-action').forEach(button=>{
   if(button.querySelector('svg,.ilbp-action-icon'))return;
   const label=button.textContent;const icon=document.createElement('span');icon.className='ilbp-action-icon';icon.setAttribute('aria-hidden','true');icon.textContent=/Prefer|Config/.test(label)?'⚙️':/Privacidade|segurança/.test(label)?'🔒':/Compartilhar|convidar/i.test(label)?'🔗':'👤';button.prepend(icon);
  });
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(install);}
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('resize',schedule);install();
})();
