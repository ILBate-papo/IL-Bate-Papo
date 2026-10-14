package br.com.ilbatepapo.app;
import android.content.Context;
public final class PushState {
 private PushState() {}
 public static void token(Context c,String token){c.getSharedPreferences("ilbp_push",0).edit().putString("token",token).apply();}
 public static String token(Context c){return c.getSharedPreferences("ilbp_push",0).getString("token","");}
 public static void account(Context c,String id){c.getSharedPreferences("ilbp_push",0).edit().putString("account",id).apply();}
 public static String account(Context c){return c.getSharedPreferences("ilbp_push",0).getString("account","");}
}
