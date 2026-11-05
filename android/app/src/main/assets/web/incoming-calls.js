/* Recover still-ringing calls when the browser resumes or reconnects. */
(function(root){
 'use strict';
 function create(options){
  const db=options.client,user=options.userId,events=options.events||root;
  const doc=options.document||root.document,now=options.now||Date.now;
  const seen=new Map(),closed=new Map(),pendingAlerts=new Map();
  let channel,started=false,destroyed=false,loading=false,repeat=false;
  function fresh(row){const time=Date.parse(row.created_at);return Number.isFinite(time)&&time<=now()+5000&&now()-time<90000;}
  function prune(){for(const map of [seen,closed])for(const [id,time] of map)if(now()-time>180000)map.delete(id);}
  function alert(row){
   if(!fresh(row)||closed.has(row.call_id)){pendingAlerts.delete(row.call_id);return;}
   if(root.ILBPNativeAlerts?.incoming?.(row,options.callerName?.(row)))pendingAlerts.delete(row.call_id);
  }
  function retryAlerts(){if(!destroyed)for(const row of pendingAlerts.values())alert(row);}
  function finish(row){
   if(!row?.call_id||![row.sender_id,row.recipient_id].includes(user))return;
   closed.set(row.call_id,now());pendingAlerts.delete(row.call_id);
   root.ILBPNativeAlerts?.closeCall?.(row.call_id);
   options.onHangup(row);
  }
  function offer(row){
   if(destroyed||row?.signal_type!=='offer'||row.recipient_id!==user||row.sender_id===user||!fresh(row)||closed.has(row.call_id)||seen.has(row.call_id)||!row.payload?.description)return;
   seen.set(row.call_id,now());options.onOffer(row);
   pendingAlerts.set(row.call_id,row);alert(row);
  }
  function receive(row){
   if(destroyed||!row)return;prune();
   if(row.signal_type==='hangup'||row.signal_type==='answer')finish(row);
   else offer(row);
  }
  async function reconcile(){
   if(destroyed)return;if(loading){repeat=true;return;}loading=true;
   try{
    const result=await db.from('call_signals').select('call_id,conversation_id,sender_id,recipient_id,signal_type,payload,created_at')
     .gte('created_at',new Date(now()-90000).toISOString()).in('signal_type',['offer','answer','hangup'])
     .or('recipient_id.eq.'+user+',sender_id.eq.'+user).order('created_at',{ascending:true});
    if(destroyed)return;if(result.error)throw result.error;
    const rows=result.data||[];prune();
    // Process terminal signals first so an old offer cannot ring after an answer.
    rows.filter(row=>row.signal_type==='answer'||row.signal_type==='hangup').forEach(finish);
    rows.filter(row=>row.signal_type==='offer').forEach(offer);
   }catch(error){if(!destroyed)options.onError?.(error);}
   finally{loading=false;if(repeat&&!destroyed){repeat=false;reconcile();}}
  }
  function visible(){if(!doc?.hidden)reconcile();}
  function start(){
   if(started||destroyed)return;started=true;
   channel=db.channel('ilbp-incoming-'+user)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'call_signals',filter:'recipient_id=eq.'+user},event=>receive(event.new))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'call_signals',filter:'sender_id=eq.'+user},event=>{
     if(['answer','hangup'].includes(event.new?.signal_type))receive(event.new);
    }).subscribe(status=>{if(status==='SUBSCRIBED')reconcile();});
   events.addEventListener('ilbp-native-alert-state',retryAlerts);
   events.addEventListener('online',reconcile);events.addEventListener('pageshow',visible);
   doc?.addEventListener('visibilitychange',visible);reconcile();
  }
  function destroy(){
   if(destroyed)return;destroyed=true;
   if(channel)db.removeChannel(channel);
   events.removeEventListener('ilbp-native-alert-state',retryAlerts);
   events.removeEventListener('online',reconcile);events.removeEventListener('pageshow',visible);
   doc?.removeEventListener('visibilitychange',visible);seen.clear();closed.clear();pendingAlerts.clear();
  }
  return {start,destroy,reconcile};
 }
 root.ILBPIncomingCalls={create};
})(typeof window==='undefined'?globalThis:window);
