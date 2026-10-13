package br.com.ilbatepapo.app;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.media.*;
import android.os.Build;
public final class NativeNotifications {
 private NativeNotifications(){}
 public static boolean permitted(Context context){
  return Build.VERSION.SDK_INT<33||context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED;
 }
 public static void createChannels(Context context){
  NotificationManager manager=context.getSystemService(NotificationManager.class);
  String[] ids={"ilbp-messages-v1","ilbp-audio-v1","ilbp-voice-calls-v1","ilbp-video-calls-v1"};
  String[] names={"Mensagens","Mensagens de áudio","Chamadas de voz","Chamadas de vídeo"};
  for(int i=0;i<ids.length;i++){
   NotificationChannel channel=new NotificationChannel(ids[i],names[i],NotificationManager.IMPORTANCE_HIGH);
   channel.setDescription("Avisos do IL Bate Papo");channel.enableVibration(true);
   channel.setVibrationPattern(i>=2?new long[]{0,700,300,700,300,900}:new long[]{0,250,120,250});
   channel.setSound(RingtoneManager.getDefaultUri(i>=2?RingtoneManager.TYPE_RINGTONE:RingtoneManager.TYPE_NOTIFICATION),
    new AudioAttributes.Builder().setUsage(i>=2?AudioAttributes.USAGE_NOTIFICATION_RINGTONE:AudioAttributes.USAGE_NOTIFICATION).build());
   channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);manager.createNotificationChannel(channel);
  }
 }
 public static boolean show(Context context,String kind,String title,String body,String tag){
  if(!permitted(context))return false;
  createChannels(context);
  boolean call="call".equals(kind)||"video-call".equals(kind);
  String channel="video-call".equals(kind)?"ilbp-video-calls-v1":"call".equals(kind)?"ilbp-voice-calls-v1":"audio".equals(kind)?"ilbp-audio-v1":"ilbp-messages-v1";
  Intent intent=new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  PendingIntent open=PendingIntent.getActivity(context,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification notification=new Notification.Builder(context,channel).setSmallIcon(android.R.drawable.stat_notify_chat)
   .setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body))
   .setCategory(call?Notification.CATEGORY_CALL:Notification.CATEGORY_MESSAGE).setVisibility(Notification.VISIBILITY_PRIVATE)
   .setContentIntent(open).setAutoCancel(true).setShowWhen(true).setWhen(System.currentTimeMillis()).build();
  context.getSystemService(NotificationManager.class).notify(tag,call?2:1,notification);return true;
 }
}
