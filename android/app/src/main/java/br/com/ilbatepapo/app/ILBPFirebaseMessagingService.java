package br.com.ilbatepapo.app;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;
public final class ILBPFirebaseMessagingService extends FirebaseMessagingService {
 static void recordCall(android.content.Context context,String result){
  context.getSharedPreferences("call_delivery_diagnostics",MODE_PRIVATE).edit()
   .putLong("time",System.currentTimeMillis()).putString("result",result).apply();
 }
 private void recordFirebase(String result){CallDeliveryDiagnostics.outcome(this,result);recordCall(this,result);}
 @Override public void onNewToken(String token){PushState.token(this,token);}
 @Override public void onMessageReceived(RemoteMessage message){
  Map<String,String> data=message.getData();
  if(!"ilbp".equals(data.get("app_id")))return;
  String type=data.get("type");
  boolean call="call".equals(type);
  // Record arrival before account, expiry or notification checks can discard it.
  // WebView-triggered calls never write this independent receipt.
  if(call)CallDeliveryDiagnostics.received(this,message);
  String account=PushState.account(this);
  if(account.isEmpty()||!account.equals(data.get("recipient_id"))){
   if(call)recordFirebase("Aviso recebido, mas sem a conta destinatária ativa no APK.");
   return;
  }
  if(call){
   try{
    long expires=Long.parseLong(data.get("expires_at"));
    long now=System.currentTimeMillis();
    if(expires<=now){recordFirebase("Aviso recebido depois do prazo da chamada.");return;}
    if(expires>now+95000){recordFirebase("Horário da chamada incompatível com o relógio do aparelho.");return;}
    if(!NativeNotifications.permitted(this)){recordFirebase("Aviso recebido, mas notificações do APK bloqueadas.");return;}
    String name=data.get("sender_name");
    if(name==null){String body=data.get("body");name=body==null?"Contato do IL Bate Papo":body.replace(" está ligando para você.","");}
    boolean posted=NativeCalls.show(this,data.get("call_id"),account,name,data.get("mode"),expires);
    recordFirebase(posted?"O APK encaminhou o aviso ao Android.":"O APK descartou uma chamada encerrada ou inválida.");
   }catch(Exception error){recordFirebase("O APK recebeu o aviso, mas houve falha ao processá-lo.");}
   return;
  }
  if("call-end".equals(type)){
   NativeCalls.close(this,data.get("call_id"));
   if("true".equals(data.get("missed_call")))NativeNotifications.show(this,"message",data.get("title"),data.get("body"),"missed-"+data.get("call_id"));
   return;
  }
  String kind="audio".equals(data.get("attachment_type"))?"audio":"message";
  String title=data.get("title"),body=data.get("body"),tag=data.get("tag");
  NativeNotifications.show(this,kind,title==null?"IL Bate Papo":title,body==null?"Você recebeu um recado.":body,tag==null?message.getMessageId():tag);
 }
}
