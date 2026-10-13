const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/contact-invites.js','utf8');
const fn=source.slice(source.indexOf('  async function accept('),source.indexOf('  function escapeText'));
async function run(data,actualUser='mother'){
 let reloaded=0,cleared=0,alerts=[],filters=[],mutations=0;
 const query={update(){mutations++;return this},eq(k,v){filters.push([k,v]);return this},select:async()=>({data,error:null})};
 const context={accepting:false,userId:'mother',client:()=>({auth:{getUser:async()=>({data:{user:{id:actualUser}}})},from:()=>query}),clear:()=>cleared++,location:{reload:()=>reloaded++},alert:x=>alerts.push(x),Date,Error};
 vm.createContext(context);vm.runInContext(fn,context);
 const button={disabled:false};assert.equal(mutations,0);
 await context.accept({requester_id:'leandro'},button);
 return {reloaded,cleared,alerts,filters,mutations,button};
}
(async()=>{
 let r=await run([{requester_id:'leandro'}]);assert.equal(r.reloaded,1);assert.deepEqual(r.filters,[['requester_id','leandro'],['addressee_id','mother'],['status','pending']]);
 r=await run([]);assert.equal(r.reloaded,0);assert.equal(r.cleared,0);assert.equal(r.button.disabled,false);assert.equal(r.alerts.length,1);
 r=await run([{requester_id:'leandro'}],'another-user');assert.equal(r.mutations,0);assert.equal(r.reloaded,0);assert.equal(r.alerts.length,1);
 console.log('Passed: acceptance only by current recipient, zero-row updates never reported as success, no automatic acceptance.');
})().catch(e=>{console.error(e);process.exit(1)});
