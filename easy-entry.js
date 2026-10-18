(function(){
  "use strict";
  var installedAuth=false, installedInvite=false;

  function addWelcome(){
    var card=document.querySelector(".auth-card");
    if(!card||card.querySelector(".il-easy-start"))return;
    var guide=document.createElement("section");
    guide.className="il-easy-start";
    guide.setAttribute("aria-label","Como começar no IL Bate Papo");
    guide.innerHTML="<strong>Entre e convide seus amigos — é fácil</strong><p>Crie sua conta com nome, e-mail e senha. Depois, encontre seus amigos ou envie seu convite.</p><ul><li>Cadastro rápido e gratuito</li><li>Convite pronto pelo WhatsApp</li><li>Mensagens, fotos, áudio e vídeo</li></ul>";
    var title=card.querySelector("h2");
    if(title)card.insertBefore(guide,title);else card.prepend(guide);
    installedAuth=true;
  }

  function invite(){
    if(window.ILBPInviteFriends)return window.ILBPInviteFriends();
    alert("Aguarde o aplicativo carregar e tente novamente.");
  }

  function addInvite(){
    var empty=document.querySelector(".empty-conversation");
    if(!empty||empty.querySelector(".il-invite-whatsapp"))return;
    var button=document.createElement("button");
    button.type="button";
    button.className="il-invite-whatsapp";
    button.textContent="💬 Convidar amigos";
    button.onclick=invite;
    var help=document.createElement("small");
    help.className="il-invite-help";
    help.textContent="Envie pelo WhatsApp ou compartilhe seu link em qualquer aplicativo.";
    var find=document.createElement("button");find.type="button";find.className="il-invite-whatsapp";find.textContent="🔎 Encontrar amigos";
    find.onclick=function(){window.ILBPOpenContactSearch?.()};
    empty.append(button,find,help);
    installedInvite=true;
  }

  function install(){
    if(!installedAuth||!document.querySelector(".il-easy-start"))addWelcome();
    if(!installedInvite||!document.querySelector(".il-invite-whatsapp"))addInvite();
  }
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",function(){setTimeout(install,300)});
  install();
})();

