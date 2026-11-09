package br.com.ilbatepapo.app;

import android.app.*;
import android.content.*;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import org.json.JSONObject;

/** Incoming calls are displayed by Android, independently of the WebView. */
public final class NativeCalls {
 private NativeCalls(){}
 private static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("incoming_calls",Context.MODE_PRIVATE);}
 public static boolean validId(String id){return id!=null&&id.matches("[a-fA-F0-9-]{36}");}
 public static JSONObject get(Context c,String id){
  if(!validId(id))return null;
  try{JSONObject value=new JSONObject(prefs(c).getString("call-"+id,""));
   if(!PushState.account(c).equals(value.optString("recipient"))||System.currentTimeMillis()>=value.optLong("expires"))return null;
   return value;
  }catch(Exception ignored){return null;}
 }
 public static void close(Context c,String id){
  if(!validId(id))return;
  IncomingCallService.stop(c,id);
  prefs(c).edit().remove("call-"+id).putLong("closed-"+id,System.currentTimeMillis()+120000).apply();
  c.getSystemService(NotificationManager.class).cancel("call-"+id,2);
 }
 public static boolean visible(Context c,String id){
  for(android.service.notification.StatusBarNotification n:c.getSystemService(NotificationManager.class).getActiveNotifications())
   if((n.getId()==2&&("call-"+id).equals(n.getTag()))||(n.getId()==IncomingCallService.NOTIFICATION_ID&&id.equals(IncomingCallService.active(c))))return true;
  return false;
 }
 public static boolean fullScreenAllowed(Context c){return Build.VERSION.SDK_INT<34||c.getSystemService(NotificationManager.class).canUseFullScreenIntent();}
 private static PendingIntent action(Context c,String id,String action,String nonce){
  Intent intent=new Intent(c,MainActivity.class).setAction("ilbp.call."+action).setData(Uri.parse("ilbp-call://"+id+"/"+action))
   .putExtra("call_id",id).putExtra("call_action",action).putExtra("call_action_token",nonce).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  return PendingIntent.getActivity(c,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
 }
 /** Uses the persisted offer's deadline; recovery must not renew an old call. */
 public static boolean showFromWeb(Context c,JSONObject data){
  return show(c,data.optString("callId"),data.optString("recipient"),data.optString("name"),data.optString("mode"),data.optLong("expiresAt"));
 }
 public static boolean show(Context c,String id,String recipient,String name,String mode,long expires){
  long now=System.currentTimeMillis();
  if(!validId(id)||!recipient.equals(PushState.account(c))||recipient.isEmpty()||expires<=now||expires>now+95000||!NativeNotifications.permitted(c))return false;
  if(prefs(c).getLong("closed-"+id,0)>now)return false;
  JSONObject existing=get(c,id);if(existing!=null&&visible(c,id))return true;
  NativeNotifications.createChannels(c);
  String caller=name==null||name.trim().isEmpty()?"Contato do IL Bate Papo":name.substring(0,Math.min(name.length(),100));
  byte[] token=new byte[32];new java.security.SecureRandom().nextBytes(token);String nonce=android.util.Base64.encodeToString(token,android.util.Base64.NO_WRAP|android.util.Base64.URL_SAFE);
  try{prefs(c).edit().putString("call-"+id,new JSONObject().put("actionToken",nonce).put("recipient",recipient).put("caller",caller).put("mode",mode).put("expires",expires).toString()).apply();}catch(Exception ignored){return false;}
  PendingIntent answer=action(c,id,"answer",nonce),decline=action(c,id,"decline",nonce);
  Intent screen=new Intent(c,IncomingCallActivity.class).setData(Uri.parse("ilbp-call://"+id+"/ringing")).putExtra("call_id",id);
  PendingIntent full=PendingIntent.getActivity(c,0,screen,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  String channel="video".equals(mode)?"ilbp-video-calls-v1":"ilbp-voice-calls-v1";
  Icon logo=Icon.createWithResource(c,R.drawable.lion);
  Notification.Builder builder=new Notification.Builder(c,channel).setSmallIcon(android.R.drawable.sym_call_incoming)
   .setLargeIcon(logo).setContentTitle(caller+" está ligando para você").setContentText("video".equals(mode)?"Chamada de vídeo":"Chamada de voz")
   .setCategory(Notification.CATEGORY_CALL).setVisibility(Notification.VISIBILITY_PRIVATE)
   .setContentIntent(full).setOngoing(true).setAutoCancel(false).setOnlyAlertOnce(false).setTimeoutAfter(expires-now);
  if(Build.VERSION.SDK_INT>=31)builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
  if(Build.VERSION.SDK_INT>=31)builder.setStyle(Notification.CallStyle.forIncomingCall(new Person.Builder().setName(caller).setIcon(logo).setImportant(true).build(),decline,answer));
  else builder.addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel,"Recusar",decline).build()).addAction(new Notification.Action.Builder(android.R.drawable.sym_action_call,"Atender",answer).build());
  if(fullScreenAllowed(c))builder.setFullScreenIntent(full,true);
  Notification notification=builder.build();notification.flags|=Notification.FLAG_INSISTENT;
  if(!IncomingCallService.start(c,id,notification))c.getSystemService(NotificationManager.class).notify("call-"+id,2,notification);return true;
 }
}
