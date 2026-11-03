/* A call is answered only after the user presses Android's Atender action. */
(function(){
 'use strict';
 let pending=null,running=false,retry=null;
 const api=()=>window.ILBPNativeAlerts,client=()=>window.__ilbpAppClient||window.__ilbpToolsClient;
 function ack(item){api()?.ackCallAction(item.callId);if(pending===item)pending=null;}
 async function run(){
  if(running||!pending)return;
  const item=pending,db=client();
  if(!db)return;
  if(Date.now()>=item.expires){ack(item);return;}
  running=true;
  try{
   const auth=await db.auth.getSession();if(auth.error)throw auth.error;
   const me=auth.data.session?.user;if(!me)return;
   if(me.id!==item.recipient){ack(item);return;}
   const result=await db.from('call_signals').select('call_id,conversation_id,sender_id,recipient_id,signal_type,payload,created_at').eq('call_id',item.callId).order('created_at',{ascending:true});
   if(result.error)throw result.error;
   const rows=result.data||[],offer=rows.find(row=>row.signal_type==='offer'&&row.recipient_id===me.id);
   if(!offer||Date.now()-Date.parse(offer.created_at)>=90000||rows.some(row=>['hangup','answer'].includes(row.signal_type))){ack(item);return;}
   if(pending!==item)return;
   if(item.action==='decline'){
    const sent=await db.from('call_signals').insert({conversation_id:offer.conversation_id,sender_id:me.id,recipient_id:offer.sender_id,call_id:item.callId,signal_type:'hangup',payload:{reason:'rejected'}});
    if(sent.error)throw sent.error;
   }else{
    const profile=await db.from('profiles').select('display_name,avatar_path').eq('id',offer.sender_id).maybeSingle();
    if(pending!==item)return;
    window.dispatchEvent(new CustomEvent('ilbp-native-call-ready',{detail:{mode:offer.payload?.mode==='video'?'video':'audio',direction:'incoming',callId:item.callId,conversationId:offer.conversation_id,peer:{id:offer.sender_id,name:profile.data?.display_name||'Contato do IL Bate Papo',avatar:profile.data?.avatar_path||'',color:'#15c9ef',initials:'IL'},offer:offer.payload?.description}}));
   }
   ack(item);
  }catch(error){console.warn('[IL Bate Papo] Ação da chamada pendente:',error.message);}
  finally{running=false;}
 }
 window.addEventListener('ilbp-native-call-action',event=>{
  const item=event.detail;
  if(!item||!['answer','decline'].includes(item.action)||!/^[a-fA-F0-9-]{36}$/.test(item.callId)||!Number.isFinite(item.expires))return;
  pending=item;run();
  if(!retry)retry=setInterval(()=>{if(!pending){clearInterval(retry);retry=null;}else run();},1000);
 });
 window.addEventListener('online',run);
})();
