const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.ILBP_CHROME_PATH,args:['--no-zygote','--single-process','--disable-gpu']});const page=await browser.newPage();try{
await page.route('https://ilbate-papo.github.io/**',r=>r.fulfill({contentType:'text/html',body:'<div class="profile"></div>'}));await page.goto('https://ilbate-papo.github.io/');await page.evaluate(()=>{
window.registered=[];window.notices=[];window.Notification={permission:'granted',requestPermission:async()=> 'granted'};window.PushManager=function(){};
const registration={active:{},update:async()=>{},pushManager:{getSubscription:async()=>({endpoint:'https://push.example/sub',toJSON:()=>({endpoint:'https://push.example/sub',keys:{auth:'test',p256dh:'test'}})})},showNotification:async(title,options)=>notices.push({title,options})};
Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register:async()=>registration}});
const client={auth:{getSession:async()=>({data:{session:{user:{id:'user'}}}}),onAuthStateChange:()=>({})},from:()=>({upsert(row){registered.push(row);return {select:()=>({single:async()=>({data:{id:'subscription'}})})};}}),channel:()=>({on(){return this;},subscribe(){return this;}}),removeChannel(){}};
window.supabase={};window.ILBPCreateClient=()=>client;
});await page.addScriptTag({content:fs.readFileSync(__dirname+'/notifications.js','utf8')});await page.getByRole('button',{name:'🔔 Ativar e testar avisos neste aparelho'}).click();await page.waitForTimeout(500);assert(await page.evaluate(()=>window.notices.length>0));
assert((await page.evaluate(()=>registered)).every(row=>row.subscription.app_id==='ilbp'));assert((await page.evaluate(()=>notices[0])).title.includes('IL Bate Papo'));assert((await page.locator('[role="status"]').textContent()).includes('Inscrição salva e aviso local exibido.'));console.log('Passed: explicit per-device registration uses app tag and local notification test shows success.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
