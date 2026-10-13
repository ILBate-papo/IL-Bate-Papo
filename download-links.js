(function(){
 'use strict';
 function install(){
  document.querySelectorAll('.auth-card,.profile').forEach(host=>{
   if(host.querySelector('.ilbp-download-link'))return;
   const link=document.createElement('a');link.className='ilbp-download-link';link.textContent='📲 Baixar IL Bate Papo para Android — 1.0.3';
   link.href=new URL('./instalar.html',document.baseURI).href;
   link.style.cssText='display:block;padding:12px;margin:12px 0;color:#19d7ff;font:14px system-ui;text-align:center';
   host.appendChild(link);
  });
 }
 new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});install();
})();
