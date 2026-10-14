(function(){
 'use strict';
 function check(){const status=document.querySelector('.call-screen .call-person p');if(status?.textContent.trim()==='Chamando…')window.ILBPSounds?.startOutgoing();else window.ILBPSounds?.stopOutgoing();}
 new MutationObserver(check).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 window.addEventListener('pagehide',()=>window.ILBPSounds?.stopOutgoing());check();
})();
