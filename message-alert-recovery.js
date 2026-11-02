// Compatibility with installed APKs that bundle their notification handlers.
(function () {
  'use strict';
  if (window.__ilbpMessageRecovery) return;
  window.__ilbpMessageRecovery = true;
  const labels = {audio:'Você recebeu uma mensagem de áudio.',image:'Você recebeu uma foto.',video:'Você recebeu um vídeo.',file:'Você recebeu um arquivo.'};
  let account = null, bound = null, checking = false;
  let cursor = {time:new Date().toISOString(),id:null};
  const seen = new Set();
  function remember(tag) {
    seen.add(tag);
    if (seen.size > 1000) seen.delete(seen.values().next().value);
  }
  function banner(title, body) {
    if (document.visibilityState !== 'visible' || document.querySelector('.incoming-call')) return;
    document.getElementById('ilbp-incoming-alert')?.remove();
    const box = document.createElement('div'); box.id = 'ilbp-incoming-alert';
    box.setAttribute('role','alert');
    box.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483001;width:calc(100% - 32px);max-width:440px;box-sizing:border-box;padding:16px;border-radius:16px;background:#0b2035;color:white;border:1px solid #19d7ff;box-shadow:0 12px 35px #0008;font:14px/1.5 system-ui';
    const heading=document.createElement('strong');heading.textContent=String(title);
    const text=document.createElement('p');text.textContent=String(body);text.style.margin='6px 0';
    const close=document.createElement('button');close.type='button';close.textContent='Fechar aviso';
    close.style.cssText='padding:7px 12px;border:0;border-radius:8px;background:#15c9ef;color:#00131a';
    close.onclick=()=>box.remove();box.append(heading,text,close);document.body.appendChild(box);
    setTimeout(()=>box.remove(),10000);
  }
  function bindNative() {
    const api=window.ILBPNativeAlerts;
    if (!api || api.__messageRecovery) return;
    api.__messageRecovery=true;
    const originalAccount=api.account;
    api.__setNotificationAccount=id=>originalAccount.call(api,id||'');
    api.account=function(id) {
      // APK 1.0.6 clears its recipient on every auth event, including token
      // refresh. If the WebView sleeps before its queued sync runs, FCM then
      // discards valid pushes. Only an actual sign-out clears the recipient.
      if (!id && account) return;
      return originalAccount.call(this,id||'');
    };
    if(account)api.__setNotificationAccount(account);
    const original=api.notify;
    api.notify=function(kind,title,body,tag) {
      const message=kind==='message'||kind==='audio';
      if (message && seen.has(tag)) return true;
      const sent=original.call(this,kind,title,body,tag);
      if (message) {
        remember(tag);
        if (sent) banner(title,body);
      }
      return sent;
    };
  }
  function client(){return window.__ilbpAppClient||window.__ilbpToolsClient;}
  function setAccount(user) {
    const id=user?.id||null;
    window.ILBPNativeAlerts?.__setNotificationAccount?.(id);
    if (account===id) return;
    account=id;seen.clear();cursor={time:new Date().toISOString(),id:null};
  }
  async function recover() {
    bindNative();
    const db=client();
    if (checking || !db?.auth || document.visibilityState!=='visible') return;
    checking=true;
    try {
      if (bound!==db) {
        bound=db;
        db.auth.onAuthStateChange((_event,session)=>setTimeout(()=>setAccount(session?.user),0));
        const {data,error}=await db.auth.getSession();if(error)throw error;setAccount(data.session?.user);
      }
      if (!account) return;
      const expected=account;
      let query=db.from('messages').select('id,sender_id,body,attachment_type,created_at')
        .neq('sender_id',account).order('created_at',{ascending:true}).order('id',{ascending:true}).limit(100);
      query=cursor.id
        ? query.or('created_at.gt.'+cursor.time+',and(created_at.eq.'+cursor.time+',id.gt.'+cursor.id+')')
        : query.gt('created_at',cursor.time);
      const {data,error}=await query;
      if(error)throw error;
      if(expected!==account)return;
      for(const row of data||[]) {
        cursor={time:row.created_at,id:row.id};
        const tag='message-'+row.id;
        if (seen.has(tag)||/^[🎥📞]\s*Chamada de (vídeo|voz) (iniciada|encerrada|não atendida)/u.test(row.body||''))continue;
        const title='Nova mensagem no IL Bate Papo',body=labels[row.attachment_type]||row.body||'Você recebeu uma mensagem.';
        const native=window.ILBPNativeAlerts?.notify(row.attachment_type==='audio'?'audio':'message',title,body,tag);
        if(!native){remember(tag);banner(title,body);window.ILBPSounds?.message(tag);if(navigator.vibrate)navigator.vibrate([180,90,180]);}
      }
    }catch(error){console.error('[IL Bate Papo] Recuperação dos avisos:',error.message);}
    finally{checking=false;}
  }
  window.addEventListener('ilbp-native-alert-state',bindNative);
  window.addEventListener('online',recover);
  window.addEventListener('pageshow',recover);
  document.addEventListener('visibilitychange',recover);
  setInterval(recover,10000);
  recover();
})();
