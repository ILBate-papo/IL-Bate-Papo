const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/index-receber-video-20260906.js','utf8');
const code=source.slice(source.indexOf('Qe=async'),source.indexOf(',et=async'));
const gate=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
(async()=>{
 let pending=gate(),inserted=[],received=[],composer='hello',toasts=[];const state={account:'me',request:1,controller:{receive:r=>received.push(r)}};
 const context={historyRef:{current:state},ze:' hello ',je:'chat-a',Fe:'me',Le:false,window:{ILBPHistory:{fields:'id'}},crypto:{randomUUID:()=> 'unique'},Re(){},Be:s=>composer=s,M:s=>toasts.push(s),A:{from(table){assert.equal(table,'messages');return{insert(row){inserted.push(row);return{select(){return{single:()=>pending.promise}}}}}},storage:{from(){return{upload:()=>Promise.resolve({error:null})}}}}};
 vm.createContext(context);vm.runInContext('let Qe,$e;'+code+';globalThis.send=Qe;globalThis.file=$e;',context);
 const sending=context.send();assert.equal(composer,'hello');context.je='chat-b';state.request++;pending.resolve({data:{id:'saved',...inserted[0]}});await sending;assert.equal(inserted[0].conversation_id,'chat-a');assert.equal(composer,'hello');assert.equal(received.length,1);
 pending=gate();const failed=context.send();pending.resolve({error:{message:'denied'}});await failed;assert.equal(composer,'hello');assert(toasts.at(-1).includes('não foi confirmado'));
 console.log('PASS: actual text sender waits for server row, preserves new composer and reports unconfirmed writes');
 const upload=gate();context.A.storage.from=()=>({upload:()=>upload.promise});pending=gate();const attachment=context.file({name:'clip.mp4',type:'video/mp4',size:200},'video');context.je='chat-c';state.request++;upload.resolve({error:null});await new Promise(r=>setImmediate(r));assert.equal(inserted.at(-1).conversation_id,'chat-b');pending.resolve({data:{id:'video',...inserted.at(-1)}});await attachment;
 const previous=inserted.length,late=gate();context.A.storage.from=()=>({upload:()=>late.promise});const logout=context.file({name:'voice.wav',type:'audio/wav',size:20},'audio');state.account='other';late.resolve({error:null});await logout;assert.equal(inserted.length,previous);
 console.log('PASS: actual attachment sender keeps original conversation and stops after account change');
})().catch(e=>{console.error(e);process.exitCode=1});
