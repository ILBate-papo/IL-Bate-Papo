const fs=require('fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.ILBP_JSDOM_PATH||'jsdom');
const tick=()=>new Promise(r=>setTimeout(r,15));
function page(url='https://bate.papo.il-talk.com.br/?contato=friend&keep=1'){
 const dom=new JSDOM('<button id="start">Início</button><div class="auth-card"></div>',{url,runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 const observers=[],Observer=w.MutationObserver;w.MutationObserver=class extends Observer{constructor(fn){super(fn);observers.push(this)}};
 const close=dom.window.close.bind(dom.window);dom.window.close=()=>{observers.forEach(o=>o.disconnect());close()};
 w.alerts=[];w.alert=x=>w.alerts.push(x);w.setInterval=()=>0;
 const realTimeout=w.setTimeout.bind(w);w.setTimeout=(fn)=>realTimeout(fn,0);
 return dom;
}
function load(w,file){w.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));}
async function inviteCase({blocked=false,changedAccount=false,cancel=false}={}){
 const dom=page(),w=dom.window;let user=null,callback,rpc=0;
 const client={auth:{getUser:async()=>({data:{user},error:null}),onAuthStateChange:fn=>{callback=fn}},
  from:table=>({select(){return this},ilike(){return this},maybeSingle:async()=>({data:table==='profiles'?{id:'friend-id',username:'friend',display_name:'Amiga'}:null}),or:async()=>({data:blocked?[{status:'blocked'}]:[]}),eq(){return this},order(){return this},limit(){return this}}),
  rpc:async()=>{rpc++;return {error:{message:'Simulated server failure'}}}};
 w.__ilbpToolsClient=client;load(w,'contact-invites.js');await tick();
 // Pending invitation must stay visible until sign-in; it must never be accepted automatically.
 assert.match(w.document.querySelector('.ilbp-invite-guide').textContent,/@friend/);assert.equal(rpc,0);
 user={id:'viewer'};callback('SIGNED_IN');await tick();
 if(blocked){assert.equal(w.document.querySelector('dialog'),null);assert.equal(rpc,0);assert.match(w.alerts[0],/bloqueado/);await tick();dom.window.close();return;}
 const dialog=w.document.querySelector('dialog');assert(dialog,'invite must resume on same-page sign-in');
 callback('SIGNED_IN');await tick();assert.equal(w.document.querySelectorAll('dialog').length,1);
 if(changedAccount)user={id:'other'};
 dialog.querySelectorAll('button')[cancel?1:0].click();await tick();
 assert.equal(rpc,cancel||changedAccount?0:1);assert(w.location.search.includes('contato=friend'),'failed/deferred invite must survive');await tick();dom.window.close();
}
(async()=>{
 const dom=page(),w=dom.window;let copied,shared;
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copied=text}});
 Object.defineProperty(w.navigator,'share',{value:async data=>shared=data});load(w,'share-contact.js');
 await w.ILBPShareContact({url:'https://ilbate-papo.github.io/?contato=amiga'});
 const dialog=w.document.querySelector('dialog'),wa=new URL(dialog.querySelector('a').href);
 assert.equal(wa.hostname,'wa.me');assert.match(wa.searchParams.get('text'),/https:\/\/bate.papo.il-talk.com.br\/instalar.html\?contato=amiga/);
 await dialog.querySelectorAll('button')[0].onclick();assert.match(copied,/Adicionar contato/);
 await dialog.querySelectorAll('button')[1].onclick();assert.equal(shared.url,'https://bate.papo.il-talk.com.br/instalar.html?contato=amiga');
 await assert.rejects(w.ILBPShareContact({url:'https://evil.example/?contato=x'}));dom.window.close();
 for(const opts of [{},{cancel:true},{blocked:true},{changedAccount:true}])await inviteCase(opts);
 const searchDom=page('https://bate.papo.il-talk.com.br/'),sw=searchDom.window;let filters=[];
 sw.__ilbpToolsClient={auth:{getUser:async()=>({data:{user:{id:'viewer'}}})},from:()=>({select(){return this},ilike(k,v){filters.push([k,v]);return this},limit:async()=>({data:[]})})};
 load(sw,'contact-search.js');sw.ILBPOpenContactSearch();sw.document.querySelector('input').value='https://bate.papo.il-talk.com.br/?contato=amiga';
 await sw.document.querySelector('form').onsubmit({preventDefault(){}});assert(filters.length===2);assert(filters.every(f=>f[1]==='amiga'));
 searchDom.window.close();
 const installDom=page('https://bate.papo.il-talk.com.br/instalar.html?contato=%3Cimg%3E'),iw=installDom.window;
 iw.document.body.innerHTML='<section id="invite-card" hidden><strong id="invite-name"></strong></section><a id="continue-chat"></a><a id="android-download"></a><p id="install-status"></p>';
 load(iw,'install-invite.js');
 assert.equal(iw.document.querySelector('#invite-name').textContent,'@<img> convidou você para conversar');
 assert.equal(iw.document.querySelector('#invite-card img'),null);
 assert.equal(new URL(iw.document.querySelector('#continue-chat').href).searchParams.get('contato'),'<img>');
 assert.equal(iw.localStorage.getItem('ilbp-pending-contact'),'<img>');
 let downloaded=0;
 iw.fetch=async url=>({ok:true,text:async()=>fs.readFileSync(__dirname+'/downloads/'+new URL(url).pathname.split('/downloads/')[1],'utf8')});
 Object.defineProperty(iw.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
 iw.URL.createObjectURL=blob=>{assert.equal(blob.size,2876260);return 'blob:apk'};iw.URL.revokeObjectURL=()=>{};
 const originalClick=iw.HTMLAnchorElement.prototype.click;iw.HTMLAnchorElement.prototype.click=function(){if(this.download==='IL-Bate-Papo-1.0.6-TESTE.apk'){downloaded++;return;}return originalClick.call(this)};
 iw.document.querySelector('#android-download').click();for(let i=0;i<200&&!downloaded&&!iw.document.querySelector('#install-status').textContent.startsWith('Não foi');i++)await tick();
 assert.equal(downloaded,1,iw.document.querySelector('#install-status').textContent);assert.match(iw.document.querySelector('#install-status').textContent,/volte a este convite/);
 iw.fetch=async()=>({ok:true,text:async()=>Buffer.from('corrupted APK').toString('base64')});
 iw.document.querySelector('#android-download').click();await tick();assert.equal(downloaded,1);assert.match(iw.document.querySelector('#install-status').textContent,/Não foi possível baixar/);
 installDom.window.close();
 console.log('Passed: canonical sharing, WhatsApp/copy/native share, invitation resumed after login, no duplicate dialog, cancellation, blocked contacts, account changes and pasted invite search.');
})().catch(e=>{console.error(e);process.exitCode=1});
