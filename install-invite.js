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
  status.textContent='Preparando o APK 1.0.6 para baixar…';
  try{
   const parts=[];
   for(let start=0;start<15;start+=4){
    const group=await Promise.all(Array.from({length:Math.min(4,15-start)},async(_,offset)=>{
     const number=String(start+offset).padStart(2,'0');
     const response=await fetch(new URL('./downloads/IL-Bate-Papo-1.0.6-part'+number+'.txt',document.baseURI).href,{cache:'no-cache'});
     if(!response.ok)throw Error('download');return (await response.text()).trim();
    }));parts.push(...group);
   }
   const encoded=parts.join('');
   if(encoded.length>5000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Error('invalid');
   const raw=atob(encoded),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
   if(bytes.length!==2876260)throw Error('size');
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!=='82f808384ee6512eb60e9198f1038d51748f6a4b0db6ba1f5e0fbcb30be5c3b3')throw Error('checksum');
   const blobURL=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.android.package-archive'}));
   const link=document.createElement('a');link.href=blobURL;link.download='IL-Bate-Papo-1.0.6-TESTE.apk';document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(blobURL),60000);
   status.textContent='Abra o arquivo baixado para instalar. Depois, volte a este convite para adicionar o contato. Você também pode continuar pelo navegador.';
  }catch(error){status.textContent='Não foi possível baixar agora. Confira sua conexão e toque em Baixar para tentar novamente.';}
  finally{busy=false;download.removeAttribute('aria-disabled');}
 });
})();
