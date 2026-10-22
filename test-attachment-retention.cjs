const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('supabase/functions/cleanup-attachments/index.ts','utf8');
let handler,calls=[],failDelete=false;const token='a'.repeat(64);
vm.runInNewContext(source,{Deno:{env:{get:()=> 'server-value'},serve:f=>handler=f},Response,AbortSignal,console,Date,fetch:async(url,opt)=>{
 calls.push(url);if(url.endsWith('ilbp_cleanup_authorized'))return Response.json(true);
 if(url.endsWith('ilbp_expired_attachments'))return Response.json([{bucket:'chat-files',path:'fixture.pdf'}]);
 if(url.includes('/storage/'))return new Response('',{status:failDelete?500:200});
 return new Response(null,{status:204});
}});
const request=body=>new Request('https://example.test',{method:'POST',headers:{'x-cleanup-token':token,'Content-Type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 assert.equal((await handler(new Request('https://example.test',{method:'POST'}))).status,401);assert.equal(calls.length,0);
 let r=await handler(request({dry_run:true}));assert.equal((await r.json()).eligible,1);assert(!calls.some(x=>x.includes('/storage/')));
 calls=[];failDelete=true;assert.equal((await handler(request({}))).status,500);assert(!calls.some(x=>x.endsWith('ilbp_finish_expired_attachment')));
 calls=[];failDelete=false;r=await handler(request({}));assert.equal((await r.json()).removed,1);assert(calls.findIndex(x=>x.includes('/storage/'))<calls.findIndex(x=>x.endsWith('ilbp_finish_expired_attachment')));
 console.log('PASS: private authentication, dry run, Storage failure preserves records, success finalizes only after bytes deletion');
})().catch(e=>{console.error(e);process.exit(1)});
