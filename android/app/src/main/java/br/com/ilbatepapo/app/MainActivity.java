package br.com.ilbatepapo.app;
import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.view.View;
import java.util.ArrayList;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.util.Base64;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

public class MainActivity extends Activity {
 private WebView web;
 private WebMessagePort notificationPort;
 private boolean notificationTestPending;
 private PermissionRequest pending;
 private ValueCallback<Uri[]> files;
 private String pendingSession;
 private static final String SUPABASE="https://ngidsolvxegpyrprlbex.supabase.co";
 private static final String PUBLIC_KEY="sb_publishable_-8u67PtkHJj1yRVWtOIkog_2skdsDcz";
 private static final String CALLBACK="br.com.ilbatepapo.app://auth-callback";
 private static final String HOST="ilbate-papo.github.io";
 private boolean trusted(Uri uri){return "https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&(uri.getPath().isEmpty()||uri.getPath().equals("/")||uri.getPath().equals("/index.html")||uri.getPath().startsWith("/IL-Bate-Papo/"));}
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);
  web.setOnApplyWindowInsetsListener((view,insets)->{if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.ime());view.setPadding(bars.left,bars.top,bars.right,bars.bottom);}return insets;});
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setUserAgentString(s.getUserAgentString()+" ILBatePapo/1.0.4");s.setDomStorageEnabled(true);s.setCacheMode(WebSettings.LOAD_NO_CACHE);NativeNotifications.createChannels(this);com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token->{PushState.token(this,token);sendNotificationState();});s.setMediaPlaybackRequiresUserGesture(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if("ilbp-share".equals(uri.getScheme())){if(request.isForMainFrame()&&request.hasGesture()&&trusted(Uri.parse(view.getUrl()))){String text=uri.getQueryParameter("text");if(text!=null&&text.length()<=4000){Intent share=new Intent(Intent.ACTION_SEND);share.setType("text/plain");share.putExtra(Intent.EXTRA_TEXT,text);try{startActivity(Intent.createChooser(share,"Compartilhar contato"));}catch(Exception ignored){new AlertDialog.Builder(MainActivity.this).setMessage("Nenhum aplicativo disponível para compartilhar.").setPositiveButton("OK",null).show();}}}return true;}if(isGoogleStart(uri)){beginGoogleLogin();return true;}if(trusted(uri))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}return true;} @Override public void onPageFinished(WebView view,String url){applyPendingSession();connectNativeNotifications();}});
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result){
    if(!trusted(Uri.parse(url))){result.cancel();return true;}
    new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(dialog,which)->result.confirm()).setOnCancelListener(dialog->result.cancel()).show();return true;
   }
   @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){
    if(!trusted(Uri.parse(url))){result.cancel();return true;}
    new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Sim",(dialog,which)->result.confirm()).setNegativeButton("Não",(dialog,which)->result.cancel()).setOnCancelListener(dialog->result.cancel()).show();return true;
   }
   @Override public void onPermissionRequest(PermissionRequest request){runOnUiThread(()->{
    if(!trusted(request.getOrigin())||pending!=null){request.deny();return;}
    pending=request;ArrayList<String> missing=new ArrayList<>();
    for(String r:request.getResources()){String p=r.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)?Manifest.permission.CAMERA:r.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)?Manifest.permission.RECORD_AUDIO:null;if(p!=null&&checkSelfPermission(p)!=PackageManager.PERMISSION_GRANTED&&!missing.contains(p))missing.add(p);}
    if(missing.isEmpty())resolvePermission();else requestPermissions(missing.toArray(new String[0]),42);
   });}
   @Override public void onPermissionRequestCanceled(PermissionRequest request){if(pending==request)pending=null;}
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(files!=null)files.onReceiveValue(null);files=callback;try{Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT);pick.setType("*/*");pick.addCategory(Intent.CATEGORY_OPENABLE);pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);startActivityForResult(pick,43);}catch(Exception e){files.onReceiveValue(null);files=null;}return true;}
  });
  if(state!=null)web.restoreState(state);else web.loadUrl("https://ilbate-papo.github.io/");
  web.setDownloadListener((url,agent,disposition,mime,length)->{Uri uri=Uri.parse(url);if(trusted(uri)&&uri.getPath().endsWith(".apk"))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}});
  handleAuthReturn(getIntent().getData());
 }

 private void sendNotificationState(){
  if(notificationPort==null)return;
  try{notificationPort.postMessage(new WebMessage(new JSONObject().put("type","state").put("permission",NativeNotifications.permitted(this)).put("backgroundPush",!PushState.token(this).isEmpty()).put("fcmToken",PushState.token(this)).toString()));}catch(Exception ignored){}
 }
 private void connectNativeNotifications(){
  if(web.getUrl()==null||!trusted(Uri.parse(web.getUrl())))return;
  if(notificationPort!=null)try{notificationPort.close();}catch(Exception ignored){}
  WebMessagePort[] ports=web.createWebMessageChannel();notificationPort=ports[0];
  notificationPort.setWebMessageCallback(new WebMessagePort.WebMessageCallback(){@Override public void onMessage(WebMessagePort port,WebMessage message){
   if(web.getUrl()==null||!trusted(Uri.parse(web.getUrl()))||message.getData()==null||message.getData().length()>2500)return;
   try{
    JSONObject data=new JSONObject(message.getData());String type=data.optString("type");
    if("push-account".equals(type)){String id=data.optString("userId");if(id.isEmpty()||id.matches("[a-fA-F0-9-]{36}"))PushState.account(MainActivity.this,id);return;}
    if("ready".equals(type)){sendNotificationState();return;}
    if("enable-alerts".equals(type)){
     if(!NativeNotifications.permitted(MainActivity.this)&&android.os.Build.VERSION.SDK_INT>=33){notificationTestPending=true;requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},44);}
     else{NativeNotifications.show(MainActivity.this,"message","IL Bate Papo: teste de aviso","Som e vibração das notificações deste aparelho.","ilbp-test");sendNotificationState();}return;
    }
    if(!"notify".equals(type))return;
    String kind=data.optString("kind");if(!java.util.Arrays.asList("message","audio","call","video-call").contains(kind))return;
    String title=data.optString("title"),body=data.optString("body"),tag=data.optString("tag");
    NativeNotifications.show(MainActivity.this,kind,title.substring(0,Math.min(100,title.length())),body.substring(0,Math.min(180,body.length())),tag.substring(0,Math.min(100,tag.length())));
   }catch(Exception ignored){}
  }});
  web.postWebMessage(new WebMessage("ilbp-native-notifications",new WebMessagePort[]{ports[1]}),Uri.parse("https://"+HOST));
 }
 private boolean isGoogleStart(Uri uri){return "https".equals(uri.getScheme())&&"ngidsolvxegpyrprlbex.supabase.co".equals(uri.getHost())&&"/auth/v1/authorize".equals(uri.getPath())&&"google".equals(uri.getQueryParameter("provider"));}
 private SharedPreferences authFlow(){return getSharedPreferences("google_login_pending",MODE_PRIVATE);}
 private void loginError(String message){if(!isFinishing())new AlertDialog.Builder(this).setTitle("Entrar com Google").setMessage(message).setPositiveButton("OK",null).show();}
 private void beginGoogleLogin(){
  try{
   byte[] random=new byte[32];new SecureRandom().nextBytes(random);
   String verifier=Base64.encodeToString(random,Base64.URL_SAFE|Base64.NO_PADDING|Base64.NO_WRAP);
   String challenge=Base64.encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)),Base64.URL_SAFE|Base64.NO_PADDING|Base64.NO_WRAP);
   authFlow().edit().putString("verifier",verifier).putLong("started",System.currentTimeMillis()).commit();
   Uri url=Uri.parse(SUPABASE+"/auth/v1/authorize").buildUpon().appendQueryParameter("provider","google").appendQueryParameter("redirect_to",CALLBACK).appendQueryParameter("code_challenge",challenge).appendQueryParameter("code_challenge_method","s256").build();
   startActivity(new Intent(Intent.ACTION_VIEW,url));
  }catch(Exception error){authFlow().edit().clear().apply();loginError("Não foi possível abrir o Google. Confira se há um navegador instalado.");}
 }
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);handleAuthReturn(intent.getData());}
 private void handleAuthReturn(Uri uri){
  if(uri==null||!"br.com.ilbatepapo.app".equals(uri.getScheme())||!"auth-callback".equals(uri.getHost()))return;
  SharedPreferences saved=authFlow();String verifier=saved.getString("verifier",null);long started=saved.getLong("started",0);saved.edit().clear().commit();
  String code=uri.getQueryParameter("code");
  if(verifier==null||started<=0||System.currentTimeMillis()-started>600000||code==null||code.isEmpty()||uri.getQueryParameter("error")!=null){loginError("O login não foi concluído ou expirou. Toque em Entrar com Google para tentar novamente.");return;}
  new Thread(()->{
   HttpURLConnection connection=null;
   try{
    connection=(HttpURLConnection)new URL(SUPABASE+"/auth/v1/token?grant_type=pkce").openConnection();connection.setRequestMethod("POST");connection.setConnectTimeout(15000);connection.setReadTimeout(15000);connection.setDoOutput(true);connection.setRequestProperty("apikey",PUBLIC_KEY);connection.setRequestProperty("Content-Type","application/json");
    byte[] body=new JSONObject().put("auth_code",code).put("code_verifier",verifier).toString().getBytes(StandardCharsets.UTF_8);try(java.io.OutputStream output=connection.getOutputStream()){output.write(body);}
    if(connection.getResponseCode()!=200)throw new Exception("auth_failed");
    ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(InputStream input=connection.getInputStream()){byte[] buffer=new byte[4096];int n;while((n=input.read(buffer))!=-1){bytes.write(buffer,0,n);if(bytes.size()>262144)throw new Exception("response_too_large");}}
    JSONObject session=new JSONObject(new String(bytes.toByteArray(),StandardCharsets.UTF_8));String access=session.getString("access_token"),refresh=session.getString("refresh_token");if(access.isEmpty()||refresh.isEmpty())throw new Exception("invalid_session");
    String payload=new JSONObject().put("access_token",access).put("refresh_token",refresh).toString();
    runOnUiThread(()->{if(isFinishing())return;pendingSession=payload;if(web.getUrl()!=null&&trusted(Uri.parse(web.getUrl())))applyPendingSession();else web.loadUrl("https://ilbate-papo.github.io/");});
   }catch(Exception error){runOnUiThread(()->loginError("Não foi possível concluir o login. Confira a internet e tente entrar novamente."));}
   finally{if(connection!=null)connection.disconnect();}
  }).start();
 }
 private void applyPendingSession(){
  if(pendingSession==null||web.getUrl()==null||!trusted(Uri.parse(web.getUrl())))return;
  String payload=pendingSession;pendingSession=null;
  String script="(function(){var session="+payload+",tries=0;function apply(){var client=window.__ilbpAppClient||window.__ilbpToolsClient;if(client&&client.auth){client.auth.setSession(session).then(function(result){session=null;if(result.error)alert('Não foi possível entrar. Tente novamente.');}).catch(function(){session=null;alert('Não foi possível entrar. Tente novamente.');});return;}if(++tries<100)setTimeout(apply,100);else{session=null;alert('Reabra o aplicativo para concluir o login.');}}apply();})();";
  web.evaluateJavascript(script,null);
 }

 private void resolvePermission(){if(pending==null)return;ArrayList<String> grant=new ArrayList<>();for(String r:pending.getResources()){if(r.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)&&checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)grant.add(r);if(r.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)&&checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)grant.add(r);}if(grant.isEmpty())pending.deny();else pending.grant(grant.toArray(new String[0]));pending=null;}
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==42)resolvePermission();if(request==44){if(notificationTestPending&&NativeNotifications.permitted(this))NativeNotifications.show(this,"message","IL Bate Papo: teste de aviso","Som e vibração das notificações deste aparelho.","ilbp-test");notificationTestPending=false;sendNotificationState();}}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==43&&files!=null){ArrayList<Uri> uris=new ArrayList<>();if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)uris.add(data.getClipData().getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());}files.onReceiveValue(uris.isEmpty()?null:uris.toArray(new Uri[0]));files=null;}}
 @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);web.saveState(state);}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onPause(){if(web!=null)web.evaluateJavascript("window.dispatchEvent(new Event('ilbp-pause'))",null);super.onPause();}
 @Override protected void onDestroy(){if(notificationPort!=null)try{notificationPort.close();}catch(Exception ignored){}if(pending!=null)pending.deny();if(files!=null)files.onReceiveValue(null);web.destroy();super.onDestroy();}
}

