const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},notices=[];
const self={registration:{scope:'https://bate.papo.il-talk.com.br/',async getNotifications(filter){return notices.filter(n=>!n.closed&&(!filter||n.tag===filter.tag));},async showNotification(title,options){notices.push({title,...options,closed:false,close(){this.closed=true;}});}},addEventListener(type,handler){handlers[type]=handler;}};
vm.runInNewContext(fs.readFileSync(__dirname+'/sw.js','utf8'),{self,URL,Date,Number});
async function push(data){let pending;handlers.push({data:{json:()=>data},waitUntil:p=>pending=p});await pending;}
(async()=>{
 await push({type:'call',call_id:'one',tag:'call-one'});
 await push({type:'call',call_id:'one',tag:'ilbp-call-one'});
 assert.equal(notices.length,1,'push and realtime share one notification identity');assert.equal(notices[0].tag,'ilbp-call-one');
 let pending;handlers.message({data:{type:'ILBP_CLOSE_CALL',callId:'one'},waitUntil:p=>pending=p});await pending;assert(notices[0].closed);
 await push({type:'message',tag:'message-chat',body:'First'});await push({type:'message',tag:'message-chat',body:'Second'});
 assert.equal(notices.length,3,'new messages in the same conversation must still update alerts');
 console.log('PASS: call notification identity, no duplicate ring, closure and subsequent conversation messages.');
})().catch(error=>{console.error(error);process.exitCode=1;});
