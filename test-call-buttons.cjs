const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.ILBP_CHROME_PATH,headless:true,args:['--no-zygote','--single-process','--disable-gpu']});const page=await browser.newPage();
try{const html=fs.readFileSync(__dirname+'/index.html','utf8'),base=fs.readFileSync(__dirname+'/index-CtQnR9aj.css','utf8'),patch=html.split('<style id="il-mobile-viewport-20261011">')[1].split('</style>')[0];
for(const [width,height] of [[320,568],[393,700],[568,320]]){
 await page.goto('about:blank');await page.setViewportSize({width,height});
 await page.setContent('<style>'+base+patch+fs.readFileSync(__dirname+'/media-layout-fixes.css','utf8')+'</style><div class="incoming-call"><div class="avatar">IL</div><div><strong>Contato com nome muito comprido</strong><span>Chamada de vídeo</span></div><button class="decline">☎<span>Recusar</span></button><button class="accept">☎<span>Atender</span></button></div>');
 const banner=await page.locator('.incoming-call').boundingBox();assert(banner.height<110,'Incoming banner must not stretch from top to bottom');assert(banner.x>=0&&banner.x+banner.width<=width);
 for(const selector of ['.accept','.decline']){const button=await page.locator(selector).boundingBox();assert(button.width>=44&&button.height>=44);assert(button.x>=0&&button.x+button.width<=width);assert(button.y>=0&&button.y+button.height<=height);}
 console.log('Passed: incoming call buttons and compact banner at '+width+'x'+height);
}}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
