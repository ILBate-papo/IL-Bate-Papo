package br.com.ilbatepapo.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.*;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;

/** Only caller information is visible over the lock screen, never the chat. */
public final class IncomingCallActivity extends Activity {
 private final Handler handler=new Handler(Looper.getMainLooper());
 private String callId;
 private final Runnable expiry=new Runnable(){public void run(){if(NativeCalls.get(IncomingCallActivity.this,callId)==null){NativeCalls.close(IncomingCallActivity.this,callId);finish();}else handler.postDelayed(this,1000);}};
 @Override public void onCreate(Bundle state){super.onCreate(state);callId=getIntent().getStringExtra("call_id");
  JSONObject call=NativeCalls.get(this,callId);if(call==null){finish();return;}
  if(Build.VERSION.SDK_INT>=27){setShowWhenLocked(true);setTurnScreenOn(true);}else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED|WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setGravity(Gravity.CENTER);layout.setPadding(32,32,32,32);layout.setBackgroundColor(Color.rgb(7,21,34));
  TextView brand=text("IL Bate Papo",20);layout.addView(brand);TextView caller=text(call.optString("caller")+" está ligando para você",30);layout.addView(caller);
  layout.addView(text("video".equals(call.optString("mode"))?"Chamada de vídeo":"Chamada de voz",20));
  LinearLayout buttons=new LinearLayout(this);buttons.setGravity(Gravity.CENTER);buttons.setPadding(0,60,0,0);
  Button decline=new Button(this);decline.setText("Recusar");decline.setTextColor(Color.WHITE);decline.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(224,45,77)));decline.setOnClickListener(v->act("decline"));
  Button answer=new Button(this);answer.setText("Atender");answer.setTextColor(Color.WHITE);answer.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(15,145,80)));answer.setOnClickListener(v->act("answer"));
  LinearLayout.LayoutParams size=new LinearLayout.LayoutParams(0,150,1);size.setMargins(12,0,12,0);buttons.addView(decline,size);buttons.addView(answer,size);layout.addView(buttons,new LinearLayout.LayoutParams(-1,-2));setContentView(layout);handler.post(expiry);
 }
 private TextView text(String value,int size){TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(Color.WHITE);t.setGravity(Gravity.CENTER);t.setPadding(8,16,8,16);return t;}
 private void act(String action){
  JSONObject call=NativeCalls.get(this,callId);if(call==null){finish();return;}
  Intent next=new Intent(this,MainActivity.class).setAction("ilbp.call."+action).putExtra("call_id",callId).putExtra("call_action",action).putExtra("call_action_token",call.optString("actionToken")).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  // MainActivity remains behind the keyguard until the user unlocks the phone.
  startActivity(next);finish();
 }
 @Override protected void onDestroy(){handler.removeCallbacks(expiry);super.onDestroy();}
}
