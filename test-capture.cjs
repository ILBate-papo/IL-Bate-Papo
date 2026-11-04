const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
async function run(){
 let calls=0,active=0,maxActive=0,mode='retry';
 let stopped=0;
 const tracks=[];
 const context={window:{},navigator:{mediaDevices:{getUserMedia:async options=>{
  calls++;active++;maxActive=Math.max(maxActive,active);
  await new Promise(r=>setTimeout(r,5));active--;
  if(mode==='denied')throw Object.assign(Error('denied'),{name:'NotAllowedError'});
  if(calls===1)throw Object.assign(Error('busy'),{name:'NotReadableError'});
  if(mode==='split'||mode==='camera-denied'){
   if(options.audio&&options.video)throw Object.assign(Error('combined capture failed'),{name:'NotReadableError'});
   if(options.video&&mode==='camera-denied')throw Object.assign(Error('camera denied'),{name:'NotAllowedError'});
   const track={kind:options.audio?'audio':'video',stop:()=>{stopped++;}};
   return options.audio
    ? {addTrack:track=>tracks.push(track),getTracks:()=>[track]}
    : {getVideoTracks:()=>[track]};
  }
  return {options};
 }}},setTimeout,Promise,console};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/ilbp-media.js','utf8'),context);
 const streams=await Promise.all([context.window.ILBPGetUserMedia({audio:{noiseSuppression:true},video:false}),context.window.ILBPGetUserMedia({audio:true,video:true})]);
 assert.equal(calls,3);assert.equal(maxActive,1);assert.equal(streams[0].options.audio,true);assert.equal(streams[1].options.video,true);
 mode='denied';const before=calls;
 await assert.rejects(context.window.ILBPGetUserMedia({audio:true}),e=>e.name==='NotAllowedError');
 assert.equal(calls,before+1,'permission denial must not be retried');
 assert(context.window.ILBPMediaError({name:'NotReadableError'}).includes('Não foi possível iniciar'));
 assert(context.window.ILBPMediaError({name:'NotAllowedError'}).includes('Permita'));
 mode='split';
 await context.window.ILBPGetUserMedia({audio:true,video:true});
 assert.equal(tracks[0].kind,'video');
 assert.equal(stopped,0,'keep the microphone open when both devices start');
 mode='camera-denied';
 await assert.rejects(context.window.ILBPGetUserMedia({audio:true,video:true}),e=>e.name==='NotAllowedError');
 assert.equal(stopped,1,'release the microphone when the camera fails');
 console.log('Passed: serialized capture, retry for device-start failure, no retry for denied permission, accurate errors.');
}
run().catch(e=>{console.error(e);process.exit(1)});
