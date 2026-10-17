const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{for(const scope of ['https://ilbate-papo.github.io/','https://ilbate-papo.github.io/IL-Bate-Papo/']){
 const handlers={},notices=[];let navigated,focused=false,finish;
 const client={url:scope,async navigate(url){await new Promise(r=>finish=r);navigated=url;return this;},async focus(){assert.equal(navigated,scope);focused=true;return this;}};
 const self={registration:{scope,async showNotification(title,options){notices.push({title,options});}},clients:{async matchAll(){return[client]},async openWindow(){throw Error('must reuse window')}},addEventListener(n,f){handlers[n]=f}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/sw.js','utf8'),{self,URL,Date,Number});
 async function deliver(data){let pending;handlers.push({data:{json:()=>data},waitUntil:p=>pending=p});await pending;return notices.at(-1);}
 for(const attachment_type of ['image','video','audio','file']){const n=await deliver({attachment_type,message_id:attachment_type});assert.equal(n.options.data.url,scope);assert.equal(n.options.silent,false);}
 const old=await deliver({type:'call',mode:'video',created_at:new Date(Date.now()-120000).toISOString()});assert.match(old.title,/perdida/);assert.equal(old.options.silent,true);assert.equal(old.options.requireInteraction,false);
 const current=await deliver({type:'call',mode:'audio',created_at:new Date().toISOString()});assert.equal(current.options.silent,false);assert.equal(current.options.requireInteraction,true);
 let pending;handlers.notificationclick({notification:{close(){}},waitUntil:p=>pending=p});await new Promise(r=>setImmediate(r));assert.equal(focused,false);finish();await pending;assert(focused);
 console.log('PASS: push types, expired call and awaited click navigation at '+scope);
 }
 const html=fs.readFileSync(__dirname+'/index.html','utf8');assert(!html.includes('r.unregister()'));assert(!html.includes('serviceWorker.register('));console.log('PASS: notification script alone owns registration; root subscription preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
