package br.com.ilbatepapo.app;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;
public final class ILBPFirebaseMessagingService extends FirebaseMessagingService {
 @Override public void onNewToken(String token){PushState.token(this,token);}
 @Override public void onMessageReceived(RemoteMessage message){
  Map<String,String> data=message.getData();
  if(!"ilbp".equals(data.get("app_id")))return;
  String account=PushState.account(this);
  if(account.isEmpty()||!account.equals(data.get("recipient_id")))return;
  String type=data.get("type");boolean call="call".equals(type);
  if("missed-call".equals(type)){
   String name=data.get("sender_name");
   if(name==null||name.trim().isEmpty())name="Alguém";
   String mode="video".equals(data.get("mode"))?"vídeo":"voz";
   String callId=data.get("call_id");
   NativeNotifications.show(this,"message","Chamada perdida de "+name,
    "Chamada de "+mode+" não atendida. Consulte o histórico de chamadas.",
    "missed-"+(callId==null?message.getMessageId():callId));
   return;
  }
  if(call){try{long expiry=Long.parseLong(data.get("expires_at"));if(System.currentTimeMillis()>expiry)return;}catch(Exception invalid){return;}}
  String kind=call?("video".equals(data.get("mode"))?"video-call":"call"):("audio".equals(data.get("attachment_type"))?"audio":"message");
  String title=data.get("title"),body=data.get("body"),tag=data.get("tag");
  if(call){
   String sender=data.get("sender_name");
   if(sender!=null&&!sender.trim().isEmpty()){
    title=sender.trim()+" está ligando para você";
    body="video".equals(data.get("mode"))?"Chamada de vídeo":"Chamada de voz";
   }
  }
  NativeNotifications.show(this,kind,title==null?"IL Bate Papo":title,body==null?"Você recebeu um recado.":body,tag==null?message.getMessageId():tag);
 }
}
