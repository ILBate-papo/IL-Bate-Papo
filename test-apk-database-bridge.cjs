const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const old='https://ngidsolvxegpyrprlbex.supabase.co',current='https://cipfycetzelxzwpfaqiu.supabase.co';
const oldKey='sb_publishable_-8u67PtkHJj1yRVWtOIkog_2skdsDcz',newKey='sb_publishable_5AjtGWLaJG8VSk22RJpePA_k_DPQAuk';
// Inspect the published APK itself: this reproduces the installed, bundled factory.
const apk=Buffer.from(fs.readdirSync('downloads').filter(n=>/^IL-Bate-Papo-1\.0\.6-part\d+\.txt$/.test(n)).sort().map(n=>fs.readFileSync('downloads/'+n,'utf8').trim()).join(''),'base64');
function asset(name){
 for(let i=0;i<apk.length-46;i++)if(apk.readUInt32LE(i)===0x02014b50){
  const len=apk.readUInt16LE(i+28),extra=apk.readUInt16LE(i+30),comment=apk.readUInt16LE(i+32);
  if(apk.subarray(i+46,i+46+len).toString()===name){const p=apk.readUInt32LE(i+42),start=p+30+apk.readUInt16LE(p+26)+apk.readUInt16LE(p+28),data=apk.subarray(start,start+apk.readUInt32LE(i+20));return (apk.readUInt16LE(i+10)===8?zlib.inflateRawSync(data):data).toString();}
  i+=45+len+extra+comment;
 }throw Error('APK asset missing: '+name);
}
const html=asset('assets/web/index.html'),main=asset('assets/web/index-receber-video-20260906.js');
assert(html.indexOf('./ilbp-fixes-20260922.js')<html.indexOf('./ilbp-media.js'));
const call=main.match(/window\.ILBPCreateClient\(`([^`]+)`,\s*`([^`]+)`/);assert(call);assert.equal(call[1],old);
const source=fs.readFileSync('ilbp-fixes-20260922.js','utf8'),requests=[],clients=[];
const document={querySelectorAll:()=>[],addEventListener(){},readyState:'loading',documentElement:{}};
const window={localStorage:{getItem(){return null;}},fetch:async(...args)=>{requests.push(args);return new Response('ok');},supabase:{createClient:(...args)=>{clients.push(args);return {auth:{}};}}};
const context=vm.createContext({window,document,MutationObserver:class{observe(){}},URL,Headers,Request,Response,console});
vm.runInContext(source,context);vm.runInContext(asset('assets/web/ilbp-media.js'),context);
window.ILBPCreateClient(call[1],call[2],{auth:{persistSession:true}});
assert.equal(clients[0][0],current);assert.equal(clients[0][1],newKey);
assert.equal(clients[0][2].auth.storageKey,'ilbp-auth-v1:cipfycetzelxzwpfaqiu.supabase.co');assert.equal(clients[0][2].auth.persistSession,true);
window.ILBPCreateClient(current,newKey);assert.equal(clients.length,1);
(async()=>{
 await window.fetch(old+'/auth/v1/token?grant_type=password',{method:'POST',body:'password-body',headers:{apikey:oldKey,Authorization:'Bearer '+oldKey}});
 assert.equal(requests[0][0],current+'/auth/v1/token?grant_type=password');assert.equal(requests[0][1].body,'password-body');assert.equal(requests[0][1].headers.get('apikey'),newKey);assert.equal(requests[0][1].headers.get('authorization'),'Bearer '+newKey);
 const controller=new AbortController();
 await window.fetch(new Request(old+'/functions/v1/push',{method:'POST',body:'push-body',headers:{apikey:oldKey,Authorization:'Bearer real-user-jwt'}}),{signal:controller.signal});
 const req=requests[1][0];assert.equal(req.url,current+'/functions/v1/push');assert.equal(req.method,'POST');assert.equal(await req.text(),'push-body');assert.equal(req.headers.get('authorization'),'Bearer real-user-jwt');controller.abort();assert(req.signal.aborted);
 const foreign=old+'.example.invalid/test',opts={headers:{apikey:oldKey}};await window.fetch(foreign,opts);assert.equal(requests[2][0],foreign);assert.equal(requests[2][1],opts);
 const fetch=window.fetch;vm.runInContext(source,context);assert.equal(window.fetch,fetch);
 const late=[];window.ILBPCreateClient=(...a)=>late.push(a);window.ILBPCreateClient(old,oldKey);assert.equal(late[0][0],current);assert.equal(late[0][1],newKey);
 console.log('PASS: published APK factory routes to new database; session isolation; push/password requests; user JWT, body, abort signal and foreign URLs preserved; safe repeated load.');
})().catch(e=>{console.error(e);process.exit(1);});
