const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let pending=false,banner=false,observe,start=0,stop=0,removed=0;
const document={documentElement:{},querySelector:()=>pending?{}:null,getElementById:()=>banner?{remove(){banner=false;removed++;}}:null};
const window={ILBPSounds:{startIncoming(){start++;},stopIncoming(){stop++;}},addEventListener(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/ringtone.js','utf8'),{window,document,MutationObserver:class{constructor(fn){observe=fn;}observe(){}}});
assert.equal(stop,1);pending=true;banner=true;observe();assert.equal(banner,false);assert.equal(start,1);
// A late message may arrive in the same turn as the pending call mounts.
banner=true;observe();assert.equal(banner,false);assert.equal(removed,2);
pending=false;observe();assert.equal(stop,2);
console.log('PASS: incoming calls keep answer controls clear, start ringing and silence after dismissal.');
