// No user JWT can run maintenance: a private, random Vault token is required.
const base = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function api(path, body, method='POST') {
 const response=await fetch(base+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Maintenance API failed: '+response.status);
 const text=await response.text();return text?JSON.parse(text):null;
}
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const token=req.headers.get('x-cleanup-token')||'';
 if(!/^[a-f0-9]{64}$/.test(token))return new Response('Unauthorized',{status:401});
 try {
  if(await api('/rest/v1/rpc/ilbp_cleanup_authorized',{token})!==true)return new Response('Unauthorized',{status:401});
  const input=await req.json();
  const candidates=await api('/rest/v1/rpc/ilbp_expired_attachments',{});
  if(input.dry_run===true)return Response.json({dry_run:true,eligible:candidates.length,retention_days:7});
  let removed=0,failed=0;const deadline=Date.now()+45000;
  // Bounded batches. Failure leaves the row/path eligible for retry next run.
  for(const item of candidates){
   if(Date.now()>deadline)break;
   try{
    if(!['chat-files','story-files'].includes(item.bucket))throw Error('Invalid bucket');
    await api('/storage/v1/object/'+item.bucket,{prefixes:[item.path]},'DELETE');
    await api('/rest/v1/rpc/ilbp_finish_expired_attachment',item);
    removed++;
   }catch{failed++;}
  }
  console.log(JSON.stringify({retention_days:7,eligible:candidates.length,removed,failed}));
  return Response.json({retention_days:7,eligible:candidates.length,removed,failed},{status:failed?500:200});
 }catch{console.error('Attachment cleanup failed');return Response.json({error:'Cleanup failed'},{status:500});}
});
