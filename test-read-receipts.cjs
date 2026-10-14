const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const bubbles=['b','a','deleted'].map(id=>{const time={querySelector:()=>time.mark,appendChild:mark=>time.mark=mark};return {dataset:{messageId:id},querySelector:()=>time,time};});
const query={select(){return this;},eq(){return this;},order:async()=>({data:[{id:'a',sender_id:'me',delivered_at:'date',read_at:null},{id:'b',sender_id:'me',delivered_at:null,read_at:null}] }),then(resolve){return Promise.resolve({data:[]}).then(resolve);}};
const client={auth:{getUser:async()=>({data:{user:{id:'me'}}}),onAuthStateChange(){}},from:()=>query,rpc:async()=>({error:null})};
let load;
const window={__ilbpAppClient:client,addEventListener:(name,cb)=>{if(name==='load')load=cb;}};
const document={visibilityState:'visible',addEventListener(){},querySelector:()=>({dataset:{conversationId:'conversation'}}),querySelectorAll:()=>bubbles,createElement:()=>({classList:{toggle(name,value){this[name]=value;}}})};
vm.runInNewContext(fs.readFileSync(__dirname+'/read-receipts.js','utf8'),{window,document,Map,Set,String,Promise,console,setTimeout:fn=>fn(),setInterval(){}});
(async()=>{load();for(let i=0;i<20;i++)await Promise.resolve();assert.equal(bubbles[0].time.mark.textContent,'✓');assert.equal(bubbles[1].time.mark.textContent,'✓✓');assert.equal(bubbles[2].time.mark.textContent,'✓');assert.equal(bubbles[1].time.mark.title,'Entregue');console.log('Passed: receipts match exact message IDs even after reordering/deletion; no fabricated delivery for missing records.');})().catch(error=>{console.error(error);process.exit(1);});
