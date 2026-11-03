(function(){
 'use strict';
 const username=(new URLSearchParams(location.search).get('contato')||'').trim().replace(/^@/,'');
 const continueLink=document.getElementById('continue-chat');
 if(username&&username.length<=100){
  document.getElementById('invite-name').textContent='@'+username+' convidou você para conversar';
  document.getElementById('invite-card').hidden=false;
  const url=new URL('./',location.href);url.searchParams.set('contato',username);continueLink.href=url.href;
  try{localStorage.setItem('ilbp-pending-contact',username);}catch(error){}
 }
 const download=document.getElementById('android-download'),status=document.getElementById('install-status');
 let busy=false;
 download.addEventListener('click',async event=>{
  event.preventDefault();if(busy)return;busy=true;download.setAttribute('aria-disabled','true');
  status.textContent='Preparando o APK 1.0.8 para baixar…';
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),45000);
   let bytes;
   try {
    const response=await fetch(new URL('./downloads/IL-Bate-Papo-1.0.8-TESTE.apk',document.baseURI).href,{cache:'no-cache',signal:controller.signal});
    if(!response.ok)throw Error('download');
    bytes=new Uint8Array(await response.arrayBuffer());
   } finally { clearTimeout(timeout); }
   if(bytes.length!==2763791)throw Error('size');
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!=='b10e09492cf75b969c04fa9fc839b26396bf88f1f693330eee21085be91f8080')throw Error('checksum');
   const blobURL=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.android.package-archive'}));
   const link=document.createElement('a');link.href=blobURL;link.download='IL-Bate-Papo-1.0.8-TESTE.apk';document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(blobURL),60000);
   status.textContent='Abra o arquivo baixado para instalar. Depois, volte a este convite para adicionar o contato. Você também pode continuar pelo navegador.';
  }catch(error){status.textContent='Não foi possível baixar agora. Confira sua conexão e toque em Baixar para tentar novamente.';}
  finally{busy=false;download.removeAttribute('aria-disabled');}
 });
})();
