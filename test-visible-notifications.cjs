const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let load,pendingCall=false,removed=0;const handlers={},shown=[],banners=[],sounds=[];
const node=()=>({style:{},setAttribute(){},append(){},remove(){},addEventListener(){}});
const registration={active:true,async update(){},pushManager:{async getSubscription(){return{endpoint:'test',toJSON:()=>({})}}},async showNotification(title,options){shown.push({title,options})}};
const channel={on(type,filter,fn){if(filter.table!=='call_signals'||filter.filter?.startsWith('recipient_id'))handlers[filter.table]=fn;return this},subscribe(){return this}};
const db={
 auth:{async getSession(){return{data:{session:{user:{id:'me'}}}}},onAuthStateChange(){}},
 channel:()=>channel,removeChannel(){},
 from(table){
  if(table==='profiles')return{select(){return this},eq(){return this},async maybeSingle(){return{data:{display_name:'Contato'}}}};
  return{upsert(){return this},select(){return this},async single(){return{data:{id:1}}}};
 }
};
const document={visibilityState:'visible',baseURI:'https://bate.papo.il-talk.com.br/',documentElement:{},body:{appendChild(n){banners.push(n)}},querySelector:selector=>selector==='.incoming-call'&&pendingCall?{}:null,getElementById:id=>id==='ilbp-incoming-alert'?{remove(){removed++;}}:null,createElement:node};
const window={__ilbpToolsClient:db,Notification:{permission:'granted'},PushManager(){},ILBPSounds:{message:id=>sounds.push(id)},addEventListener(n,f){if(n==='load')load=f}};
vm.runInNewContext(fs.readFileSync(__dirname+'/notifications.js','utf8'),{window,document,Notification:window.Notification,navigator:{serviceWorker:{async register(){return registration}}},MutationObserver:class{observe(){}},URL,Set,Date,console,location:{href:document.baseURI},setTimeout(){},atob:s=>Buffer.from(s,'base64').toString('binary'),Uint8Array});
await load();await new Promise(r=>setImmediate(r));
for(const kind of ['audio','image','video',undefined]){handlers.messages({new:{id:String(kind),sender_id:'other',attachment_type:kind,created_at:new Date().toISOString()}});await new Promise(r=>setImmediate(r));}
handlers.call_signals({new:{call_id:'call',recipient_id:'me',sender_id:'other',signal_type:'offer',payload:{mode:'video'},created_at:new Date().toISOString()}});await new Promise(r=>setImmediate(r));
assert.equal(shown.length,5);assert.equal(banners.length,4,'the incoming call must not be covered by a toast');assert(removed>0,'remove an older message toast when the call arrives');assert.equal(sounds.length,4);assert(shown[4].options.requireInteraction);
handlers.messages({new:{id:'audio',sender_id:'other',attachment_type:'audio'}});handlers.messages({new:{id:'self',sender_id:'me'}});await new Promise(r=>setImmediate(r));assert.equal(shown.length,5);
pendingCall=true;handlers.messages({new:{id:'during-call',sender_id:'other'}});await new Promise(r=>setImmediate(r));assert.equal(banners.length,4,'messages arriving while ringing must not hide answer controls');assert.equal(shown.length,6);
document.visibilityState='hidden';handlers.messages({new:{id:'background',sender_id:'other'}});await new Promise(r=>setImmediate(r));assert.equal(shown.length,7);assert.equal(banners.length,4);
const native=[];window.ILBPNativeAlerts={notify(...args){native.push(args);return true;}};
document.visibilityState='visible';pendingCall=false;
for(const kind of ['audio','image','video',undefined]){handlers.messages({new:{id:'native-'+kind,sender_id:'other',attachment_type:kind,body:kind?'caption':'Olá',created_at:new Date().toISOString()}});await new Promise(r=>setImmediate(r));}
assert.equal(banners.length,8,'Android system notifications must also show a banner in the open app');assert.equal(native.length,4);assert.equal(shown.length,7,'avoid duplicating native notifications through web push');assert.equal(sounds.length,5,'native notifications supply their own sound');
assert.equal(native[0][2],'Você recebeu uma mensagem de áudio.');assert.equal(native[1][2],'Você recebeu uma foto.');assert.equal(native[2][2],'Você recebeu um vídeo.');assert.equal(native[3][2],'Olá');
console.log('PASS: visible audio/photo/video/text/call banners and system alerts; hidden alerts; duplicates and self messages filtered');
})().catch(e=>{console.error(e);process.exitCode=1});
