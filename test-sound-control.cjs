const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let count=0,started=0,stopped=0;const callbacks={},buttons=new Map();
class AudioContext{constructor(){count++;this.state='suspended';this.currentTime=0;this.destination={};}async resume(){this.state='running';}createOscillator(){return {frequency:{},connect(node){return node;},disconnect(){},start(){started++;},stop(){stopped++;}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;},disconnect(){}};}}
const document={documentElement:{},getElementById:id=>buttons.get(id),querySelector:()=>null,addEventListener:(name,cb)=>callbacks[name]=cb,createElement:()=>({style:{},remove(){buttons.delete(this.id);}}),body:{appendChild:button=>buttons.set(button.id,button)}};
const window={AudioContext,addEventListener(){},dispatchEvent(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/sound-control.js','utf8'),{window,document,Date,Set,Event,MutationObserver:class{observe(){}},setInterval:()=>1,clearInterval(){}});
(async()=>{
 window.ILBPSounds.message('same');assert.equal(started,0);assert(buttons.has('ilbp-unlock-sound'));
 await window.ILBPSounds.unlock();assert.equal(started,2,'Queued message plays once after gesture');
 window.ILBPSounds.message('same');assert.equal(started,2,'Duplicate realtime events must not beep twice');
 window.ILBPSounds.startIncoming();assert.equal(started,6);const before=stopped;
 window.ILBPSounds.stopIncoming();assert.equal(stopped-before,4,'Ringtone silences scheduled tones immediately');
 await window.ILBPSounds.test();assert.equal(count,1,'Reuse unlocked output instead of creating suspended contexts');
 console.log('Passed: gesture unlock, deferred message, duplicate suppression, ringtone cancellation and one shared sound output.');
})().catch(error=>{console.error(error);process.exit(1);});
