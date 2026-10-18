(function(){
 'use strict';
 let active=null;
 const HOME='https://bate.papo.il-talk.com.br/instalar.html';
 window.ILBPContactURL=function(username){const url=new URL(HOME);url.searchParams.set('contato',String(username).trim().replace(/^@/,''));return url.href;};
 function node(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
 window.ILBPShareContact=async function(data){
  const original=new URL(data.url);
  if(!['https://ilbate-papo.github.io','https://bate.papo.il-talk.com.br'].includes(original.origin)||!original.searchParams.get('contato'))throw Error('Link de contato inválido');
  const url=window.ILBPContactURL(original.searchParams.get('contato'));
  const safe={title:'Meu convite no IL Bate Papo',url,text:'Olá! Adicione @'+original.searchParams.get('contato')+' no IL Bate Papo. Abra o convite, instale ou continue pelo navegador, crie sua conta e toque em Adicionar contato.'};
  if(active)active();
  const previous=document.activeElement,dialog=node('dialog');dialog.className='ilbp-share-dialog';
  const title=node('h2','Convide quem faz parte da sua vida'),intro=node('p','Seu amigo abre o convite, instala ou continua pelo navegador e adiciona você. Depois é só conversar.'),field=node('input');
  title.id='ilbp-share-title';dialog.setAttribute('aria-labelledby',title.id);
  field.readOnly=true;field.value=url;field.setAttribute('aria-label','Seu link de convite');
  const status=node('p','Escolha como enviar seu convite.');status.setAttribute('role','status');
  const whatsapp=node('a','💬 Enviar pelo WhatsApp');whatsapp.className='ilbp-share-primary';whatsapp.href='https://wa.me/?text='+encodeURIComponent(safe.text+'\n'+url);whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';
  const copy=node('button','🔗 Copiar convite'),other=node('button','↗ Mais opções'),close=node('button','Fechar');
  for(const b of [copy,other,close])b.type='button';close.className='ilbp-share-close';
  function dismiss(){dialog.remove();if(active===dismiss)active=null;if(previous?.isConnected)previous.focus();}
  copy.onclick=async()=>{
   try{await navigator.clipboard.writeText(safe.text+'\n'+url);status.textContent='Convite copiado! Cole na conversa com seu amigo.';}
   catch(error){field.focus();field.select();try{if(!document.execCommand('copy'))throw Error();status.textContent='Link copiado! Cole na conversa com seu amigo.';}catch(e){status.textContent='Toque e segure no link selecionado para copiar.';}}
  };
  other.onclick=async()=>{if(!navigator.share){if(/ILBatePapo\//.test(navigator.userAgent)){location.href='ilbp-share://contact?text='+encodeURIComponent(safe.text+'\n'+url);return;}status.textContent='Use Copiar convite e cole no aplicativo que preferir.';return;}try{await navigator.share(safe);}catch(error){if(error.name!=='AbortError')status.textContent='Use o WhatsApp ou copie o convite.';}};
  close.onclick=dismiss;dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  dialog.append(node('small','IL BATE PAPO · AMIGOS'),title,intro,whatsapp,copy,other,field,status,close);document.body.append(dialog);active=dismiss;dialog.showModal();
 };
})();
