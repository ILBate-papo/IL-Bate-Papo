const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const events={},timers=new Map(),accounts=[],saves=[],errors=[];let serial=0,authChanged,poll,session='one',hangSession=true,hangSave=false,aborted=false;
const db={auth:{onAuthStateChange(fn){authChanged=fn;},getSession(){return hangSession?new Promise(()=>{}):Promise.resolve({data:{session:session?{user:{id:session}}:null}});}},from(){return{upsert(row){saves.push(row);return{abortSignal(signal){if(hangSave){signal.addEventListener('abort',()=>{aborted=true;});return new Promise(()=>{});}return Promise.resolve({error:null});}};}};}};
const window={__ilbpAppClient:db,ILBPNativeAlerts:{available:true,permission:true,fcmToken:'device',account:id=>accounts.push(id)},addEventListener:(n,f)=>events[n]=f,dispatchEvent(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/native-push-registration.js','utf8'),{window,document:{hidden:false,addEventListener:(n,f)=>events[n]=f},crypto:{subtle:{digest:async()=>new Uint8Array([1,2,3]).buffer}},TextEncoder,AbortController,Event,console:{error:(...a)=>errors.push(a)},setTimeout:(f,ms)=>{const id=++serial;timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:f=>{poll=f;return 1;},clearInterval(){}});
const flush=async()=>{for(let i=0;i<30;i++){for(const [id,t] of timers)if(t.ms===0){timers.delete(id);t.f();}await new Promise(r=>setImmediate(r));}};
async function deadline(){const entry=[...timers].find(([,t])=>t.ms===15000);assert(entry,'registration deadline scheduled');timers.delete(entry[0]);entry[1].f();await flush();}
(async()=>{
 poll();await flush();assert.equal(saves.length,0);
 events.online();events.online();hangSession=false;await deadline();
 assert.equal(saves.length,1,'a blocked session must not permanently block subsequent registration');
 assert.equal(saves[0].user_id,'one');assert.equal(errors.length,1);assert(!('android_notification_mode' in saves[0]),'older clients retain their delivery configuration');window.ILBPNativeAlerts.callServiceVersion=1;events.online();await flush();assert.equal(saves.at(-1).android_notification_mode,'native');assert.equal(saves.at(-1).subscription.native_call_service,true);
 authChanged('TOKEN_REFRESHED',{user:{id:'one'}});await flush();assert(!accounts.includes(''),'token refresh must not clear the active native account');
 hangSave=true;events.online();await flush();await deadline();assert(aborted,'timed-out network writes must be aborted');
 hangSave=false;events.online();await flush();assert.equal(saves.at(-1).user_id,'one');
 session='two';authChanged('SIGNED_IN',{user:{id:'two'}});await flush();assert.equal(saves.at(-1).user_id,'two');assert.notEqual(saves[0].endpoint,saves.at(-1).endpoint,'account endpoints remain separate');
 session=null;authChanged('SIGNED_OUT',null);await flush();assert.equal(accounts.at(-1),'');
 console.log('PASS: registration recovers after stalled auth/network, aborts expired writes, preserves account on token refresh and isolates sign-in/sign-out.');
})().catch(e=>{console.error(e);process.exitCode=1;});
