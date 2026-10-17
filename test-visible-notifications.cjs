const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let load;const handlers={},shown=[],banners=[],sounds=[];
const node=()=>({style:{},setAttribute(){},append(){},remove(){},addEventListener(){}});
const registration={active:true,async update(){},pushManager:{async getSubscription(){return{endpoint:'test',toJSON:()=>({})}}},async showNotification(title,options){shown.push({title,options})}};
const channel={on(type,filter,fn){handlers[filter.table]=fn;return this},subscribe(){return this}};
const db={
 auth:{async getSession(){return{data:{session:{user:{id:'me'}}}}},onAuthStateChange(){}},
 channel:()=>channel,removeChannel(){},
 from(table){
  if(table==='profiles')return{select(){return this},eq(){return this},async maybeSingle(){return{data:{display_name:'Contato'}}}};
  return{upsert(){return this},select(){return this},async single(){return{data:{id:1}}}};
 }
};
const document={visibilityState:'visible',baseURI:'https://bate.papo.il-talk.com.br/',documentElement:{},body:{appendChild(n){banners.push(n)}},querySelector:()=>null,getElementById:()=>null,createElement:node};
const window={__ilbpToolsClient:db,Notification:{permission:'granted'},PushManager(){},ILBPSounds:{message:id=>sounds.push(id)},addEventListener(n,f){if(n==='load')load=f}};
vm.runInNewContext(fs.readFileSync(__dirname+'/notifications.js','utf8'),{window,document,Notification:window.Notification,navigator:{serviceWorker:{async register(){return registration}}},MutationObserver:class{observe(){}},URL,Set,Date,console,location:{href:document.baseURI},setTimeout(){},atob:s=>Buffer.from(s,'base64').toString('binary'),Uint8Array});
await load();await new Promise(r=>setImmediate(r));
for(const kind of ['audio','image','video',undefined]){handlers.messages({new:{id:String(kind),sender_id:'other',attachment_type:kind,created_at:new Date().toISOString()}});await new Promise(r=>setImmediate(r));}
handlers.call_signals({new:{call_id:'call',recipient_id:'me',sender_id:'other',signal_type:'offer',payload:{mode:'video'},created_at:new Date().toISOString()}});await new Promise(r=>setImmediate(r));
assert.equal(shown.length,5);assert.equal(banners.length,5);assert.equal(sounds.length,4);assert(shown[4].options.requireInteraction);
handlers.messages({new:{id:'audio',sender_id:'other',attachment_type:'audio'}});handlers.messages({new:{id:'self',sender_id:'me'}});await new Promise(r=>setImmediate(r));assert.equal(shown.length,5);
document.visibilityState='hidden';handlers.messages({new:{id:'background',sender_id:'other'}});await new Promise(r=>setImmediate(r));assert.equal(shown.length,6);assert.equal(banners.length,5);
console.log('PASS: visible audio/photo/video/text/call banners and system alerts; hidden alerts; duplicates and self messages filtered');
})().catch(e=>{console.error(e);process.exitCode=1});
