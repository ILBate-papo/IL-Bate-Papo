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
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(isGoogleStart(uri)){beginGoogleLogin();return true;}if(trusted(uri))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}return true;} @Override public void onPageFinished(WebView view,String url){applyPendingSession();}});
  web.setWebChromeClient(new WebChromeClient(){
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
  handleAuthReturn(getIntent().getData());
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
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==42)resolvePermission();}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==43&&files!=null){ArrayList<Uri> uris=new ArrayList<>();if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)uris.add(data.getClipData().getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());}files.onReceiveValue(uris.isEmpty()?null:uris.toArray(new Uri[0]));files=null;}}
 @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);web.saveState(state);}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){if(pending!=null)pending.deny();if(files!=null)files.onReceiveValue(null);web.destroy();super.onDestroy();}
}
