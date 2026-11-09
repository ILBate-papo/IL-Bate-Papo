package br.com.ilbatepapo.app;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.os.Looper;
import java.time.Duration;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={28,33,35})
public class IncomingCallLifecycleTest {
 private Application app;
 private static final String USER="11111111-1111-4111-8111-111111111111",CALL="22222222-2222-4222-8222-222222222222";
 @Before public void setup(){app=RuntimeEnvironment.getApplication();shadowOf(app).grantPermissions(Manifest.permission.POST_NOTIFICATIONS);PushState.account(app,USER);NativeNotifications.createChannels(app);}
 private Intent offer(){assertTrue(NativeCalls.show(app,CALL,USER,"Leandro","video",System.currentTimeMillis()+90000));Intent i=shadowOf(app).getNextStartedService();assertNotNull(i);assertEquals(IncomingCallService.class.getName(),i.getComponent().getClassName());return i;}
 @Test public void callUsesExistingChannelAndNativeButtons(){
  Intent i=offer();Notification n=i.getParcelableExtra("notification");assertNotNull(n);assertEquals("ilbp-video-calls-v1",n.getChannelId());assertEquals(Notification.CATEGORY_CALL,n.category);assertTrue(n.extras.getString(Notification.EXTRA_TITLE).contains("Leandro"));assertNotNull(n.contentIntent);assertNotNull(n.actions);assertTrue(n.actions.length>=2);
 }
 @Test public void newCallsMayAlertEvenWhenAForegroundNotificationIdIsReused(){
  Intent i=offer();Notification n=i.getParcelableExtra("notification");
  assertEquals(0,n.flags & Notification.FLAG_ONLY_ALERT_ONCE);
  assertNotEquals(0,n.flags & Notification.FLAG_INSISTENT);
 }
 @Test public void preferencesAloneDoNotSuppressASecondDelivery(){offer();assertFalse(NativeCalls.visible(app,CALL));offer();}
 @Test public void serviceKeepsOneNoticeAndExpires(){
  Intent i=offer();IncomingCallService service=Robolectric.buildService(IncomingCallService.class).create().get();
  assertEquals(Service.START_NOT_STICKY,service.onStartCommand(i,0,1));assertTrue(NativeCalls.visible(app,CALL));
  service.onStartCommand(i,0,2);assertEquals(1,app.getSystemService(NotificationManager.class).getActiveNotifications().length);
  shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(91));
  assertNull(NativeCalls.get(app,CALL));assertTrue(app.getSharedPreferences("incoming_calls",0).getLong("closed-"+CALL,0)>0);service.onDestroy();
 }
 @Test public void duplicateOfferCannotRestartAVisibleRingingCall(){
  Intent i=offer();IncomingCallService service=Robolectric.buildService(IncomingCallService.class).create().get();
  service.onStartCommand(i,0,1);
  assertTrue(NativeCalls.show(app,CALL,USER,"Leandro","video",System.currentTimeMillis()+90000));
  assertNull(shadowOf(app).getNextStartedService());
  assertEquals(1,app.getSystemService(NotificationManager.class).getActiveNotifications().length);
  service.onDestroy();
 }
 @Test public void closedExpiredAndOtherAccountCallsCannotRing(){
  offer();NativeCalls.close(app,CALL);assertFalse(NativeCalls.show(app,CALL,USER,"Leandro","video",System.currentTimeMillis()+90000));
  assertFalse(NativeCalls.show(app,"33333333-3333-4333-8333-333333333333",USER,"Leandro","audio",System.currentTimeMillis()-1));
  assertFalse(NativeCalls.show(app,"44444444-4444-4444-8444-444444444444","other","Leandro","audio",System.currentTimeMillis()+90000));
 }
 @Test public void bundledScriptsStayOnTrustedHttpsOrigins() throws Exception {
  assertNotNull(BundledWeb.open(app,android.net.Uri.parse("https://bate.papo.il-talk.com.br/native-alerts.js?v=1")));
  assertNotNull(BundledWeb.open(app,android.net.Uri.parse("https://ilbate-papo.github.io/IL-Bate-Papo/")));
  assertNull(BundledWeb.open(app,android.net.Uri.parse("http://bate.papo.il-talk.com.br/")));
  assertNull(BundledWeb.open(app,android.net.Uri.parse("https://bate.papo.il-talk.com.br:444/")));
  assertNull(BundledWeb.open(app,android.net.Uri.parse("https://foreign.example/native-alerts.js")));
  assertNull(BundledWeb.open(app,android.net.Uri.parse("https://bate.papo.il-talk.com.br/../native-alerts.js")));
 }
}
