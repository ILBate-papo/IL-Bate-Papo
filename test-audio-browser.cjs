const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ILBP_CHROME_PATH,headless:true,args:['--no-zygote','--single-process','--disable-gpu']});
 const page=await browser.newPage();
 try{
  await page.addScriptTag({content:fs.readFileSync(__dirname+'/voice-recording.js','utf8')});
  const result=await page.evaluate(async encoded=>{
   const raw=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
   const file=await ILBPPrepareVoiceRecording(new Blob([raw],{type:'audio/webm'}));
   const audio=document.createElement('audio');audio.controls=true;document.body.appendChild(audio);
   const loaded=new Promise((resolve,reject)=>{audio.onloadedmetadata=resolve;audio.onerror=()=>reject(Error('WAV could not play'));});
   audio.src=URL.createObjectURL(file);await loaded;await audio.play();
   return {duration:audio.duration,rate:file.type,name:file.name,paused:audio.paused};
  },fs.readFileSync(require('path').join(require('os').tmpdir(),'ilbp-voice-validation.webm')).toString('base64'));
  assert(result.duration>.9&&result.duration<1.2);assert.equal(result.rate,'audio/wav');assert.equal(result.paused,false);
  console.log('Passed: real browser decodes WebM recording, generates PCM WAV, reads duration and starts playback. Speaker output not physically tested.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
