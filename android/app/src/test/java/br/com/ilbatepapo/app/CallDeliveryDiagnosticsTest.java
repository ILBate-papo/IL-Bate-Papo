package br.com.ilbatepapo.app;

import android.app.Application;
import android.os.Bundle;
import com.google.firebase.messaging.RemoteMessage;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={28,33,35})
public class CallDeliveryDiagnosticsTest {
 private Application app;
 private ILBPFirebaseMessagingService receiver;
 private static final String USER="11111111-1111-4111-8111-111111111111";
 @Before public void setup(){
  app=RuntimeEnvironment.getApplication();
  app.getSharedPreferences("fcm_call_receipts",0).edit().clear().commit();
  app.getSharedPreferences("call_delivery_diagnostics",0).edit().clear().commit();
  PushState.account(app,USER);
  receiver=Robolectric.buildService(ILBPFirebaseMessagingService.class).create().get();
 }
 private RemoteMessage call(String appId,String recipient,long expires){
  Bundle data=new Bundle();data.putString("app_id",appId);data.putString("type","call");
  data.putString("recipient_id",recipient);data.putString("expires_at",String.valueOf(expires));
  data.putString("google.original_priority","high");data.putString("google.delivered_priority","normal");
  return new RemoteMessage(data);
 }
 @Test public void localDisplayCannotBeMistakenForAFirebaseReceipt(){
  ILBPFirebaseMessagingService.recordCall(app,"Serviço nativo de chamada ativo.");
  String report=CallDeliveryDiagnostics.report(app);
  assertTrue(report.contains("Nenhum aviso de chamada registrado nesta versão"));
  assertTrue(report.contains("Serviço nativo de chamada ativo."));
 }
 @Test public void expiredReceiptAndDowngradedPrioritySurviveLaterLocalDisplay(){
  receiver.onMessageReceived(call("ilbp",USER,System.currentTimeMillis()-1000));
  ILBPFirebaseMessagingService.recordCall(app,"Serviço nativo de chamada ativo.");
  String report=CallDeliveryDiagnostics.report(app);
  assertTrue(report.contains("Aviso recebido depois do prazo da chamada."));
  assertTrue(report.contains("Prioridade enviada: alta; recebida: normal"));
  assertTrue(report.contains("Serviço nativo de chamada ativo."));
  assertFalse(report.contains(USER));
 }
 @Test public void wrongAccountReceiptIsVisibleWithoutRinging(){
  receiver.onMessageReceived(call("ilbp","another-account",System.currentTimeMillis()+90000));
  assertTrue(CallDeliveryDiagnostics.report(app).contains("sem a conta destinatária ativa"));
  assertNull(org.robolectric.Shadows.shadowOf(app).getNextStartedService());
 }
 @Test public void anotherApplicationCannotReplaceTheReceipt(){
  receiver.onMessageReceived(call("other-app",USER,System.currentTimeMillis()+90000));
  assertEquals(0,app.getSharedPreferences("fcm_call_receipts",0).getLong("received",0));
 }
}
