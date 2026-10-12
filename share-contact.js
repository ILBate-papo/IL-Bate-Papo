(function(){
 'use strict';
 let active=null;
 function fallback(data){
  if(active)active.close();
  const previous=document.activeElement,dialog=document.createElement('dialog');
  dialog.style.cssText='width:min(420px,90vw);max-height:85dvh;overflow:auto;border:0;border-radius:16px;padding:20px;box-sizing:border-box';
  const title=document.createElement('h2');title.textContent='Compartilhar meu contato';
  const field=document.createElement('textarea');field.readOnly=true;field.value=data.url;field.setAttribute('aria-label','Link do seu contato');field.style.cssText='width:100%;box-sizing:border-box;min-height:72px';
  const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Escolha como enviar o convite.';
  const whatsapp=document.createElement('a');whatsapp.textContent='Enviar pelo WhatsApp';whatsapp.href='https://wa.me/?text='+encodeURIComponent(data.text);whatsapp.style.cssText='display:block;margin:16px 0';
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar link';
  const close=document.createElement('button');close.type='button';close.textContent='Fechar';close.style.marginLeft='12px';
  function dismiss(){dialog.remove();if(active?.node===dialog)active=null;if(previous?.isConnected)previous.focus();}
  copy.onclick=async()=>{
   try{if(!navigator.clipboard?.writeText)throw Error('Clipboard indisponível');await navigator.clipboard.writeText(data.url);status.textContent='Link copiado! Cole na mensagem para seu amigo.';}
   catch(e){field.focus();field.select();try{if(!document.execCommand('copy'))throw Error('Cópia indisponível');status.textContent='Link copiado! Cole na mensagem para seu amigo.';}catch(error){status.textContent='O link está selecionado. Toque e segure para copiar.';}}
  };
  close.onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  dialog.append(title,field,status,whatsapp,copy,close);document.body.appendChild(dialog);active={node:dialog,close:dismiss};dialog.showModal();
 }
 window.ILBPShareContact=async function(data){
  const url=new URL(data.url);
  if(url.origin!=='https://ilbate-papo.github.io'||!url.searchParams.get('contato'))throw Error('Link de contato inválido');
  const safe={title:String(data.title||'Meu contato no IL Bate Papo'),text:String(data.text||data.url),url:url.href};
  if(typeof navigator.share==='function'){
   try{await navigator.share(safe);return;}catch(error){if(error.name==='AbortError')return;}
  }
  fallback(safe);
 };
})();
