package br.com.ilbatepapo.app;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import org.json.JSONObject;

/** Lives only while an incoming call rings; never holds the WebView alive. */
public final class IncomingCallService extends Service {
 static final int NOTIFICATION_ID=1002;
 private static final String ACTIVE="service-call";
 private final Handler handler=new Handler(Looper.getMainLooper());
 private String callId;
 private final Runnable expire=()->{NativeCalls.close(this,callId);stopSelf();};
 static String active(Context c){return c.getSharedPreferences("incoming_calls",MODE_PRIVATE).getString(ACTIVE,"");}
 static boolean start(Context c,String id,Notification notification){
  try{c.startForegroundService(new Intent(c,IncomingCallService.class).putExtra("call_id",id).putExtra("notification",notification));return true;}
  catch(RuntimeException error){ILBPFirebaseMessagingService.recordCall(c,"O Android não permitiu iniciar o serviço da chamada; aviso simples solicitado.");return false;}
 }
 static void stop(Context c,String id){
  if(id!=null&&id.equals(active(c)))c.stopService(new Intent(c,IncomingCallService.class));
 }
 static void stopAll(Context c){c.stopService(new Intent(c,IncomingCallService.class));}
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  String id=intent==null?null:intent.getStringExtra("call_id");
  JSONObject call=NativeCalls.get(this,id);
  Notification notice=intent==null?null:intent.getParcelableExtra("notification");
  if(call==null||notice==null){if(callId==null)stopSelf(startId);return START_NOT_STICKY;}
  if(id.equals(callId)&&NativeCalls.visible(this,id))return START_NOT_STICKY;
  handler.removeCallbacks(expire);callId=id;
  getSharedPreferences("incoming_calls",MODE_PRIVATE).edit().putString(ACTIVE,id).apply();
  try{
   if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFICATION_ID,notice,ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL);
   else startForeground(NOTIFICATION_ID,notice);
   ILBPFirebaseMessagingService.recordCall(this,"Serviço nativo de chamada ativo. Tela cheia permitida: "+NativeCalls.fullScreenAllowed(this));
   handler.postDelayed(expire,Math.max(1,call.optLong("expires")-System.currentTimeMillis()));
  }catch(RuntimeException error){
   getSystemService(android.app.NotificationManager.class).notify("call-"+id,2,notice);
   ILBPFirebaseMessagingService.recordCall(this,"O serviço de chamada foi recusado pelo Android; aviso simples encaminhado.");stopSelf(startId);
  }
  return START_NOT_STICKY;
 }
 @Override public void onDestroy(){handler.removeCallbacks(expire);getSharedPreferences("incoming_calls",MODE_PRIVATE).edit().remove(ACTIVE).apply();stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}
