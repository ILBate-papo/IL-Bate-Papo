package br.com.ilbatepapo.app;
import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.util.Set;
final class BundledWeb {
 private static final Set<String> FILES=new java.util.HashSet<>(java.util.Arrays.asList("index.html","ilbp-media.js","incoming-calls.js","index-receber-video-20260906.js","native-alerts.js","native-call-actions.js","native-push-registration.js","notifications.js","push-sender.js","sw.js"));
 static WebResourceResponse open(Context c,Uri uri){
  if(uri==null||!"https".equals(uri.getScheme())||!("bate.papo.il-talk.com.br".equals(uri.getHost())||"ilbate-papo.github.io".equals(uri.getHost()))||(uri.getPort()!=-1&&uri.getPort()!=443))return null;
  String path=uri.getPath(),name;
  if(path==null||path.equals("/")||path.equals("/IL-Bate-Papo/"))name="index.html";
  else if(path.startsWith("/IL-Bate-Papo/"))name=path.substring(14);
  else name=path.startsWith("/")?path.substring(1):path;
  if(!FILES.contains(name))return null;
  try{return new WebResourceResponse(name.endsWith(".html")?"text/html":"application/javascript","UTF-8",c.getAssets().open("web/"+name));}catch(java.io.IOException error){return null;}
 }
 private BundledWeb(){}
}
