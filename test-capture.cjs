const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
async function run(){
 let calls=0,active=0,maxActive=0,mode='retry';
 const context={window:{},navigator:{mediaDevices:{getUserMedia:async options=>{
  calls++;active++;maxActive=Math.max(maxActive,active);
  await new Promise(r=>setTimeout(r,5));active--;
  if(mode==='denied')throw Object.assign(Error('denied'),{name:'NotAllowedError'});
  if(calls===1)throw Object.assign(Error('busy'),{name:'NotReadableError'});
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
 console.log('Passed: serialized capture, retry for device-start failure, no retry for denied permission, accurate errors.');
}
run().catch(e=>{console.error(e);process.exit(1)});
