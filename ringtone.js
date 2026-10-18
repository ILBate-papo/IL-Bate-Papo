(function(){
 'use strict';
 function check(){if(document.querySelector('.incoming-call')){document.getElementById('ilbp-incoming-alert')?.remove();window.ILBPSounds?.startIncoming();}else window.ILBPSounds?.stopIncoming();}
 new MutationObserver(check).observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('pagehide',()=>window.ILBPSounds?.stopIncoming());check();
})();
