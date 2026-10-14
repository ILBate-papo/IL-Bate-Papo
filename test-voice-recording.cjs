const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const buffer={numberOfChannels:2,length:24000,sampleRate:24000,getChannelData:channel=>Float32Array.from({length:24000},(_,i)=>Math.sin(i*2*Math.PI*440/24000)*(channel?0.4:0.6))};
let invalid=false;
const window={OfflineAudioContext:class{async decodeAudioData(){if(invalid)throw Error('Invalid container');return buffer;}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/voice-recording.js','utf8'),{window,Blob,File,ArrayBuffer,DataView,Array,Number,Math,Date,Error});
(async()=>{
 const file=await window.ILBPPrepareVoiceRecording(new Blob(['encoded-recording'],{type:'audio/webm'}));
 assert.equal(file.type,'audio/wav');assert(file.name.endsWith('.wav'));
 const bytes=Buffer.from(await file.arrayBuffer());assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
 assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt32LE(24),24000);assert.equal(bytes.readUInt16LE(34),16);assert.equal(bytes.readUInt32LE(40)/48000,1);
 assert(bytes.readInt16LE(46)>0,'Voice waveform is preserved');
 fs.writeFileSync(require('path').join(require('os').tmpdir(),'ilbp-voice-validation.wav'),bytes);
 invalid=true;await assert.rejects(()=>window.ILBPPrepareVoiceRecording(new Blob(['broken'])),/finalizar/);
 await assert.rejects(()=>window.ILBPPrepareVoiceRecording(new Blob([])),/vazia/);
 console.log('Passed: recording becomes mono PCM WAV with explicit one-second duration; invalid/empty recordings are rejected.');
})().catch(error=>{console.error(error);process.exit(1);});
