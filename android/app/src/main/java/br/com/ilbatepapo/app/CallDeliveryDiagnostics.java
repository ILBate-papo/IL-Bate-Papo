package br.com.ilbatepapo.app;

import android.app.ActivityManager;
import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.media.AudioManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;
import com.google.firebase.messaging.RemoteMessage;
import java.text.DateFormat;
import java.util.Date;

/** Local evidence only: never stores tokens, message contents or contact names. */
final class CallDeliveryDiagnostics {
 private CallDeliveryDiagnostics(){}
 private static SharedPreferences prefs(Context c){return c.getSharedPreferences("fcm_call_receipts",Context.MODE_PRIVATE);}
 static void received(Context c,RemoteMessage message){
  prefs(c).edit().putLong("received",System.currentTimeMillis())
   .putLong("sent",message.getSentTime())
   .putInt("priority",message.getPriority()).putInt("originalPriority",message.getOriginalPriority())
   .putBoolean("interactive",c.getSystemService(PowerManager.class).isInteractive())
   .putString("outcome","Aviso recebido; processamento iniciado.").apply();
 }
 static void outcome(Context c,String result){prefs(c).edit().putString("outcome",result).apply();}
 private static String time(long value){return DateFormat.getDateTimeInstance().format(new Date(value));}
 private static String yes(boolean value){return value?"sim":"não";}
 private static String priority(int value){return value==RemoteMessage.PRIORITY_HIGH?"alta":value==RemoteMessage.PRIORITY_NORMAL?"normal":"desconhecida";}
 static String report(Context c){
  SharedPreferences p=prefs(c);
  long received=p.getLong("received",0);
  StringBuilder report=new StringBuilder("Recebimento pelo Firebase:\n");
  if(received==0)report.append("Nenhum aviso de chamada registrado nesta versão de diagnóstico.");
  else report.append(time(received)).append(p.getLong("sent",0)>0?"\nEnvio informado pelo Firebase: "+time(p.getLong("sent",0)):"").append("\nPrioridade enviada: ").append(priority(p.getInt("originalPriority",0)))
   .append("; recebida: ").append(priority(p.getInt("priority",0)))
   .append("\nTela ligada ao receber: ").append(yes(p.getBoolean("interactive",false)))
   .append("\n").append(p.getString("outcome",""));
  SharedPreferences rendered=c.getSharedPreferences("call_delivery_diagnostics",Context.MODE_PRIVATE);
  long shown=rendered.getLong("time",0);
  report.append("\n\nProcessamento da chamada (pelo app aberto ou Firebase):\n");
  if(shown==0)report.append("Nenhum registro.");
  else report.append(time(shown)).append("\n").append(rendered.getString("result",""));
  PowerManager power=c.getSystemService(PowerManager.class);
  report.append("\n\nSituação atual:\nCadastro Firebase no APK: ").append(yes(!PushState.token(c).isEmpty()))
   .append("\nConta ativa no APK: ").append(yes(!PushState.account(c).isEmpty()))
   .append("\nEconomia de bateria do sistema: ").append(yes(power.isPowerSaveMode()))
   .append("\nAndroid em modo de repouso (Doze): ").append(yes(power.isDeviceIdleMode()));
  if(Build.VERSION.SDK_INT>=28)report.append("\nRestrição em segundo plano informada pelo Android: ")
   .append(yes(c.getSystemService(ActivityManager.class).isBackgroundRestricted()));
  report.append("\nNotificações permitidas: ").append(yes(NativeNotifications.permitted(c)))
   .append("\nTela cheia permitida: ").append(yes(NativeCalls.fullScreenAllowed(c)));
  NotificationManager manager=c.getSystemService(NotificationManager.class);
  AudioManager audio=c.getSystemService(AudioManager.class);
  report.append("\nModo de toque (0 silencioso, 1 vibrar, 2 normal): ").append(audio.getRingerMode())
   .append("\nVolume de toque: ").append(audio.getStreamVolume(AudioManager.STREAM_RING))
   .append("\nFiltro Não Perturbe (1 permite tudo): ").append(manager.getCurrentInterruptionFilter());
  for(String id:new String[]{"ilbp-voice-calls-v1","ilbp-video-calls-v1"}){
   NotificationChannel ch=manager.getNotificationChannel(id);
   report.append("\n\nCanal de ").append(id.contains("video")?"vídeo":"voz").append(": ");
   if(ch==null){report.append("não criado");continue;}
   report.append("importância ").append(ch.getImportance()).append(" (4=alta)")
    .append("; som ").append(ch.getSound()==null?"não":"sim")
    .append("; vibração ").append(yes(ch.shouldVibrate()));
  }
  return report.toString();
 }
}
