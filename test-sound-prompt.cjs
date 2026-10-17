const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{let count=0,closed=0,mode='hang';const nodes=new Map();
class AudioContext{constructor(){count++;this.state='suspended';this.currentTime=0;this.destination={}}resume(){if(mode==='hang')return new Promise(()=>{});this.state='running';return Promise.resolve()}close(){closed++;this.state='closed';return Promise.resolve()}createOscillator(){return{frequency:{},connect:x=>x,disconnect(){},start(){},stop(){}}}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this},disconnect(){}}}}
const element=()=>({style:{},children:[],setAttribute(){},append(...n){this.children.push(...n)},remove(){nodes.delete(this.id)}});
const document={getElementById:id=>nodes.get(id),querySelector:()=>null,addEventListener(){},createElement:element,body:{appendChild(n){nodes.set(n.id,n)}}};
const window={AudioContext,addEventListener(){},dispatchEvent(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/sound-control.js','utf8'),{window,document,Date,Set,Event,Promise,MutationObserver:class{observe(){}},setInterval:()=>1,clearInterval(){},setTimeout:(f)=>setTimeout(f,5),clearTimeout});
window.ILBPSounds.message('pending');const box=nodes.get('ilbp-unlock-sound'),activate=box.children[0],close=box.children[1];
await activate.onclick();assert.equal(activate.disabled,false);assert.match(activate.textContent,/bloqueado/);assert.equal(closed,1,'timed-out context is closed');
mode='success';await activate.onclick();assert.equal(nodes.has('ilbp-unlock-sound'),false,'success removes prompt');assert.equal(count,2,'retry creates a fresh context');
mode='hang';window.ILBPSounds.startIncoming();window.ILBPSounds.stopIncoming();
// A fresh page with an unsupported sound output still permits dismissal.
const unsupported={...window,AudioContext:undefined};nodes.clear();
vm.runInNewContext(fs.readFileSync(__dirname+'/sound-control.js','utf8'),{window:unsupported,document,Date,Set,Event,Promise,MutationObserver:class{observe(){}},setInterval:()=>1,clearInterval(){},setTimeout,clearTimeout});
unsupported.ILBPSounds.message('new');nodes.get('ilbp-unlock-sound').children[1].onclick();assert.equal(nodes.size,0);unsupported.ILBPSounds.message('again');assert.equal(nodes.size,0,'dismissed banner does not repeatedly cover chat');
console.log('PASS: stalled audio resume completes, retry succeeds and removes banner, dismiss works without AudioContext');
})().catch(e=>{console.error(e);process.exitCode=1});
