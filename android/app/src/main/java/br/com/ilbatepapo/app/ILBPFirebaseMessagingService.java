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
  String type=data.get("type");
  if("call-end".equals(type)){
   NativeCalls.close(this,data.get("call_id"));
   if("true".equals(data.get("missed_call")))NativeNotifications.show(this,"message",data.get("title"),data.get("body"),"missed-"+data.get("call_id"));
   return;
  }
  boolean call="call".equals(type);
  if(call){try{long expiry=Long.parseLong(data.get("expires_at"));if(System.currentTimeMillis()>expiry)return;}catch(Exception invalid){return;}}
  if(call){try{String name=data.get("sender_name");if(name==null){String body=data.get("body");name=body==null?"Contato do IL Bate Papo":body.replace(" está ligando para você.","");}NativeCalls.show(this,data.get("call_id"),account,name,data.get("mode"),Long.parseLong(data.get("expires_at")));}catch(Exception ignored){}return;}
  String kind=call?("video".equals(data.get("mode"))?"video-call":"call"):("audio".equals(data.get("attachment_type"))?"audio":"message");
  String title=data.get("title"),body=data.get("body"),tag=data.get("tag");
  NativeNotifications.show(this,kind,title==null?"IL Bate Papo":title,body==null?"Você recebeu um recado.":body,tag==null?message.getMessageId():tag);
 }
}
