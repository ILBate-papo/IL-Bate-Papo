(function(){
  "use strict";
  function installResponsiveLion(){
    document.querySelectorAll('.auth-card .login-logo-compact .login-logo-inner').forEach(function(inner){
      if(inner.querySelector('.ilbp-responsive-lion-effects')) return;
      var effects=document.createElement('span');
      effects.className='ilbp-responsive-lion-effects';
      effects.setAttribute('aria-hidden','true');
      effects.innerHTML='<span class="ilbp-responsive-globe-glow"></span><span class="ilbp-responsive-lion-orbit"></span><span class="ilbp-responsive-lion-orbit two"></span><span class="ilbp-responsive-spark"></span>';
      inner.appendChild(effects);
    });
  }
  function install(){
    installResponsiveLion();
    var story=document.querySelector('.auth-story');
    if(!story||story.querySelector('.ilbp-mail-stage')) return;
    story.classList.add('ilbp-photo-mode');
    var stage=document.createElement('div');
    stage.className='ilbp-mail-stage';
    stage.setAttribute('aria-label','IL Bate Papo — Conversas, família, amigos e novas amizades.');
    stage.innerHTML='\
      <img class="ilbp-mail-photo" src="./logo-login-il-bate-papo-mail-original.png" alt="IL Bate Papo — Conversas, família, amigos e novas amizades.">\
      <span class="ilbp-globe-glow" aria-hidden="true"></span>\
      <span class="ilbp-lion-orbit" aria-hidden="true"></span>\
      <span class="ilbp-lion-orbit two" aria-hidden="true"></span>\
      <span class="ilbp-spark" aria-hidden="true"></span>\
      <span class="ilbp-neon-mails" aria-hidden="true"><i class="ilbp-neon-mail pink"></i><i class="ilbp-neon-mail"></i></span>\
      <svg class="ilbp-frame-svg" viewBox="0 0 1000 455" preserveAspectRatio="none" aria-hidden="true">\
        <defs>\
          <linearGradient id="ilbpFrameGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19dcff"/><stop offset=".52" stop-color="#178cff"/><stop offset="1" stop-color="#ff35c8"/></linearGradient>\
          <filter id="ilbpGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>\
        </defs>\
        <rect class="ilbp-frame-track" x="3" y="3" width="994" height="449" rx="27" ry="27" pathLength="2000"/>\
        <rect class="ilbp-frame-led" x="3" y="3" width="994" height="449" rx="27" ry="27" pathLength="2000"/>\
      </svg>';
    story.appendChild(stage);
  }
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
