const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{let load,subscribed=false;const errors=[];
const channel={on(){return this},subscribe(){subscribed=true;return this}};
const db={auth:{async getSession(){return{data:{session:{user:{id:'me'}}}}},onAuthStateChange(){}},channel:()=>channel,removeChannel(){}};
const window={__ilbpToolsClient:db,Notification:{permission:'default'},PushManager(){},addEventListener(n,f){if(n==='load')load=f}};
const document={baseURI:'https://bate.papo.il-talk.com.br/',documentElement:{},querySelector:()=>null,getElementById:()=>({remove(){}})};
vm.runInNewContext(fs.readFileSync(__dirname+'/notifications.js','utf8'),{window,Notification:window.Notification,navigator:{serviceWorker:{async register(){throw Error('service worker unavailable')}}},document,MutationObserver:class{observe(){}},console:{error:(...a)=>errors.push(a)},URL,Set,setTimeout});
load();await new Promise(r=>setImmediate(r));assert(subscribed,'foreground subscription survives failed service worker');assert.equal(errors.length,1);console.log('PASS: service-worker failure does not disable foreground realtime notifications');
})().catch(e=>{console.error(e);process.exitCode=1});
