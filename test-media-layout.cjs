const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ILBP_CHROME_PATH,headless:true,args:['--no-zygote','--single-process','--disable-gpu']});
 const page=await browser.newPage();
 try{for(const [width,height] of [[375,667],[1280,720]]){
  await page.goto('about:blank');await page.setViewportSize({width,height});
  const html=fs.readFileSync(__dirname+'/index.html','utf8'),base=fs.readFileSync(__dirname+'/index-CtQnR9aj.css','utf8'),patch=html.split('<style id="il-mobile-viewport-20261011">')[1].split('</style>')[0];
  await page.setContent('<style>'+base+patch+fs.readFileSync(__dirname+'/media-layout-fixes.css','utf8')+'</style><div id="root"><div class="app"><section class="conversation mobile-open"><div class="conversation-head">Contato</div><div class="messages">'+Array.from({length:18},(_,i)=>'<div class="message me"><p>Mensagem '+i+'</p><audio controls></audio><button class="message-delete">Excluir</button></div>').join('')+'</div><footer class="composer"><input><button>Enviar</button></footer></section></div></div>');
  await page.addScriptTag({content:fs.readFileSync(__dirname+'/media-layout-fixes.js','utf8')});await page.waitForTimeout(100);
  await page.locator('.messages').evaluate(e=>e.scrollTop=e.scrollHeight);
  const audio=await page.locator('audio').last().boundingBox(),del=await page.locator('.message-delete').last().boundingBox(),composer=await page.locator('.composer').boundingBox();
  assert(audio.height>=54);assert(del.y>=audio.y+audio.height);assert(del.y+del.height<=composer.y,'Delete must be above composer without another message');
  await page.setContent('<style>'+base+fs.readFileSync(__dirname+'/media-layout-fixes.css','utf8')+'</style><div class="call-screen"><div class="self-video"><video></video><span>Você</span></div></div>');
  await page.addScriptTag({content:fs.readFileSync(__dirname+'/media-layout-fixes.js','utf8')});
  const preview=page.locator('.self-video');await preview.click();assert.equal(await preview.getAttribute('aria-expanded'),'true');
  const expanded=await preview.boundingBox();assert(expanded.width>width*.8);assert(expanded.height>height*.5);
  await preview.press('Enter');assert.equal(await preview.getAttribute('aria-expanded'),'false');
  console.log('Passed: audio, delete visibility and expandable camera at '+width+'x'+height);
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
