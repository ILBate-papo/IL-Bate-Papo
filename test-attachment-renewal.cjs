const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let handler,requests=0,button;
const db={storage:{from(bucket){assert.equal(bucket,'chat-files');return{async createSignedUrl(path){requests++;assert.equal(path,'user/audio.wav');return{data:{signedUrl:'https://example.test/new-link'}};}};}}};
const context={window:{__ilbpAppClient:db},document:{addEventListener(type,fn){if(type==='error')handler=fn;},createElement(){button={style:{},remove(){this.isConnected=false;}};return button;}},console,Map,WeakMap};
vm.runInNewContext(fs.readFileSync(__dirname+'/ilbp-media.js','utf8'),context);
(async()=>{
 const audio={tagName:'AUDIO',dataset:{attachmentPath:'user/audio.wav'},matches:()=>true,load(){this.loads=(this.loads||0)+1;},after(b){b.isConnected=true;}};
 await handler({target:audio});assert.equal(requests,1);assert.equal(audio.loads,1);assert.equal(audio.src,'https://example.test/new-link');
 await handler({target:audio});assert.equal(requests,1,'a codec error must not create an automatic retry loop');assert(button.isConnected);
 await button.onclick();assert.equal(requests,2);assert.equal(button.isConnected,false);
 console.log('Passed: expired attachment URL renewal, bounded automatic retry, and explicit manual retry.');
})().catch(e=>{console.error(e);process.exit(1);});
