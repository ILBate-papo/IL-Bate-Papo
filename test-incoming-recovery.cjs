const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=new EventTarget(),doc=new EventTarget();doc.hidden=false;root.document=doc;
vm.runInNewContext(fs.readFileSync(__dirname+'/incoming-calls.js','utf8'),{window:root,Date,Map});
const now=Date.now(),offers=[],ends=[],handlers={},errors=[];let rows=[],reads=0,release,blocked=false,removed=0;
function row(id,type='offer',age=1000){return{call_id:id,signal_type:type,sender_id:'peer',recipient_id:'me',created_at:new Date(now-age).toISOString(),payload:{description:{type:'offer'}}};}
const db={from(){return{select(){return this},gte(){return this},in(){return this},or(){return this},async order(){reads++;if(blocked)await new Promise(r=>release=r);return{data:rows};}}},
 channel(){return{on(_event,filter,fn){handlers[filter.filter]=fn;return this},subscribe(fn){this.status=fn;return this}}},removeChannel(){removed++}};
const c=root.ILBPIncomingCalls.create({client:db,userId:'me',events:root,document:doc,now:()=>now,onOffer:r=>offers.push(r.call_id),onHangup:r=>ends.push(r.call_id),onError:e=>errors.push(e)});
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 rows=[row('fresh'),row('answered'),row('answered','answer'),row('cancelled'),row('cancelled','hangup'),row('expired','offer',91000)];
 c.start();await tick();assert.deepEqual(offers,['fresh']);
 handlers['recipient_id=eq.me']({new:row('fresh')});assert.equal(offers.length,1,'snapshot/realtime duplicate must not ring twice');
 rows=[row('resumed')];doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(offers.length,1);
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.deepEqual(offers,['fresh','resumed']);
 // Cancellation can race with a database read containing the older offer.
 blocked=true;rows=[row('race')];root.dispatchEvent(new Event('online'));await tick();
 handlers['recipient_id=eq.me']({new:row('race','hangup')});release();await tick();assert(!offers.includes('race'));
 handlers['sender_id=eq.me']({new:{...row('resumed','answer'),sender_id:'me',recipient_id:'peer'}});assert(ends.includes('resumed'));
 blocked=false;rows=[row('after-destroy')];const count=reads;c.destroy();root.dispatchEvent(new Event('online'));doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(reads,count);assert.equal(removed,1);assert(!offers.includes('after-destroy'));assert.equal(errors.length,0);
 console.log('PASS: startup/resume recovery, answered/cancelled/expired filtering, event deduplication, cancellation race and cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
