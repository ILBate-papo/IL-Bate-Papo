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

public class MainActivity extends Activity {
 private WebView web;
 private PermissionRequest pending;
 private ValueCallback<Uri[]> files;
 private static final String HOST="ilbate-papo.github.io";
 private boolean trusted(Uri uri){return "https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&(uri.getPath().isEmpty()||uri.getPath().equals("/")||uri.getPath().equals("/index.html")||uri.getPath().startsWith("/IL-Bate-Papo/"));}
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);
  web.setOnApplyWindowInsetsListener((view,insets)->{if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.ime());view.setPadding(bars.left,bars.top,bars.right,bars.bottom);}return insets;});
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(trusted(uri))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}return true;}});
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
 }
 private void resolvePermission(){if(pending==null)return;ArrayList<String> grant=new ArrayList<>();for(String r:pending.getResources()){if(r.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)&&checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)grant.add(r);if(r.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)&&checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)grant.add(r);}if(grant.isEmpty())pending.deny();else pending.grant(grant.toArray(new String[0]));pending=null;}
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==42)resolvePermission();}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==43&&files!=null){ArrayList<Uri> uris=new ArrayList<>();if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)uris.add(data.getClipData().getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());}files.onReceiveValue(uris.isEmpty()?null:uris.toArray(new Uri[0]));files=null;}}
 @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);web.saveState(state);}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){if(pending!=null)pending.deny();if(files!=null)files.onReceiveValue(null);web.destroy();super.onDestroy();}
}
