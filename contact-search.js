(function () {
 'use strict';
 let modal=null, request=0;
 function db(){return window.__ilbpAppClient||window.__ilbpToolsClient;}
 function element(tag,text){const node=document.createElement(tag);if(text)node.textContent=text;return node;}
 function open(){
  if(modal)return;
  const previous=document.activeElement;
  modal=element('dialog');modal.className='ilbp-contact-search';
  modal.style.cssText='width:min(420px,90vw);max-height:85dvh;overflow:auto;background:#07131f;color:white;border:1px solid #19d7ff;border-radius:16px;padding:20px';
  const title=element('h2','Encontrar amigos'),close=element('button','Fechar'),form=element('form'),input=element('input'),search=element('button','Buscar'),status=element('p','Busque pelo nome ou pelo @usuário.'),results=element('div');
  input.placeholder='Nome ou @usuário';input.setAttribute('aria-label','Nome ou usuário');input.style.cssText='box-sizing:border-box;width:100%;padding:14px;margin:12px 0';input.required=true;input.maxLength=80;search.type='submit';close.type='button';
  const dismiss=()=>{request++;modal.remove();modal=null;previous?.focus();};close.onclick=dismiss;modal.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  form.append(input,search);modal.append(title,close,form,status,results);document.body.append(modal);modal.showModal();input.focus();
  form.onsubmit=async e=>{
   e.preventDefault();const token=++request;const query=input.value.trim().replace(/^@/,'').replace(/[%*,()\\]/g,' ');results.replaceChildren();
   if(query.length<2){status.textContent='Digite pelo menos duas letras.';return;}
   const client=db();if(!client){status.textContent='Aguarde o aplicativo carregar.';return;}
   status.textContent='Buscando…';search.disabled=true;
   try{
    const auth=await client.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Entre na sua conta para adicionar pessoas.');const user=auth.data.user;
    const found=await Promise.all(['display_name','username'].map(field=>client.from('profiles').select('id,display_name,username').ilike(field,'%'+query+'%').limit(20)));
    if(token!==request||!modal)return;
    if(found.some(r=>r.error))throw Error('Não foi possível buscar pessoas. Tente novamente.');
    const people=[...new Map(found.flatMap(r=>r.data||[]).filter(p=>p.id!==user.id).map(p=>[p.id,p])).values()];
    status.textContent=people.length?'Escolha a pessoa. Ela receberá um convite para aceitar.':'Nenhuma pessoa encontrada. Confira o nome ou @usuário e se ela tem conta no IL Bate Papo.';
    for(const person of people){const row=element('div'),name=element('p',(person.display_name||'Pessoa')+' — @'+person.username),button=element('button','Adicionar');button.type='button';row.append(name,button);results.append(row);
     button.onclick=async()=>{
      button.disabled=true;
      try{
       const relation=await client.from('friendships').select('status,requester_id,addressee_id').or('and(requester_id.eq.'+user.id+',addressee_id.eq.'+person.id+'),and(requester_id.eq.'+person.id+',addressee_id.eq.'+user.id+')');
       if(relation.error)throw relation.error;
       const rows=relation.data||[];
       if(rows.some(r=>r.status==='blocked'))throw Error('Este contato está bloqueado.');
       if(rows.some(r=>r.status==='accepted')){button.textContent='Já é seu contato';return;}
       const incoming=rows.find(r=>r.status==='pending'&&r.addressee_id===user.id);
       if(incoming){const accepted=await client.from('friendships').update({status:'accepted',updated_at:new Date().toISOString()}).eq('requester_id',person.id).eq('addressee_id',user.id).eq('status','pending').select('requester_id');if(accepted.error||!accepted.data?.length)throw Error('Não foi possível aceitar o convite.');button.textContent='Contato adicionado';status.textContent='Contato adicionado. Reabra a lista de conversas para atualizar.';return;}
       if(rows.some(r=>r.status==='pending')){button.textContent='Convite já enviado';return;}
       const sent=await client.from('friendships').insert({requester_id:user.id,addressee_id:person.id,status:'pending'}).select('requester_id');
       if(sent.error||!sent.data?.length)throw Error('Não foi possível enviar o convite.');
       button.textContent='Convite enviado';status.textContent='Convite enviado. A pessoa precisa aceitar no IL Bate Papo.';
      }catch(error){button.disabled=false;status.textContent=error.message||'Não foi possível adicionar agora.';}
     };
    }
   }catch(error){if(token===request&&modal)status.textContent=error.message||'Não foi possível buscar agora.';}
   finally{search.disabled=false;}
  };
 }
 window.ILBPOpenContactSearch=open;
 window.ILBPInviteFriends=async function(){
  const client=db();if(!client){alert('Aguarde o aplicativo carregar.');return;}
  try{
   const auth=await client.auth.getUser();
   if(auth.error||!auth.data?.user)throw Error('Entre na sua conta para convidar amigos.');
   const result=await client.from('profiles').select('username').eq('id',auth.data.user.id).maybeSingle();
   if(result.error||!result.data?.username)throw Error('Não foi possível obter seu contato. Tente novamente.');
   const url=new URL('https://ilbate-papo.github.io/');url.searchParams.set('contato',result.data.username);
   await window.ILBPShareContact({title:'Meu contato no IL Bate Papo',url:url.href,text:'Converse comigo no IL Bate Papo: '+url.href});
  }catch(error){alert(error.message||'Não foi possível compartilhar o convite.');}
 };
 document.addEventListener('click',e=>{const button=e.target.closest('button[title="Convidar ou aceitar contato"]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();open();},true);
})();
