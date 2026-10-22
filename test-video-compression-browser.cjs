const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process'),{chromium}=require('playwright');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ilbp-compress-'));let browser;
 try{
  const input=path.join(dir,'source.webm'),output=path.join(dir,'compressed.webm');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=1280x720:rate=24:duration=2','-f','lavfi','-i','sine=frequency=440:duration=2','-c:v','libvpx','-b:v','2M','-c:a','libopus','-shortest',input]);
  browser=await chromium.launch({headless:true,executablePath:process.env.ILBP_CHROME_PATH,args:['--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage();await page.setContent('<html><body></body></html>');await page.addScriptTag({content:fs.readFileSync('ilbp-media.js','utf8')});
  const result=await page.evaluate(async encoded=>{
   const raw=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
   const file=new File([raw,new Uint8Array(3*1024*1024)],'source.webm',{type:'video/webm'});
   const reduced=await window.ILBPPrepareAttachment(file);
   return {original:file.size,size:reduced.size,changed:reduced!==file,data:Array.from(new Uint8Array(await reduced.arrayBuffer()))};
  },fs.readFileSync(input).toString('base64'));
  assert(result.changed,'supported browser should re-encode video');assert(result.size<result.original);
  fs.writeFileSync(output,Buffer.from(result.data));
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output]));
  assert(info.streams.some(s=>s.codec_type==='audio'),'compressed video must preserve soundtrack');assert(info.streams.some(s=>s.codec_type==='video'));
  const length=Number(info.format.duration);assert(length>=1.7 && length<=2.6,'full clip preserved');
  console.log('PASS: browser re-encodes video smaller with audio and full clip duration');
 }finally{await browser?.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
