import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.*;
public class SignAndVerify {
 public static void main(String[] args) throws Exception {
  char[] password=Files.readString(Path.of(args[1])).trim().toCharArray();
  KeyStore store=KeyStore.getInstance("PKCS12");
  try(InputStream in=Files.newInputStream(Path.of(args[0]))){store.load(in,password);}
  PrivateKey key=(PrivateKey)store.getKey("ilbatepapo",password);
  List<X509Certificate> certificates=new ArrayList<>();
  for(java.security.cert.Certificate cert:store.getCertificateChain("ilbatepapo"))certificates.add((X509Certificate)cert);
  Arrays.fill(password,'\0');
  ApkSigner.SignerConfig signer=new ApkSigner.SignerConfig.Builder("ilbatepapo",key,certificates).build();
  new ApkSigner.Builder(List.of(signer)).setInputApk(new File(args[2])).setOutputApk(new File(args[3]))
   .setV1SigningEnabled(true).setV2SigningEnabled(true).setV3SigningEnabled(true).setMinSdkVersion(26).build().sign();
  ApkVerifier.Result result=new ApkVerifier.Builder(new File(args[3])).setMinCheckedPlatformVersion(26).build().verify();
  if(!result.isVerified())throw new Exception("APK signature verification failed: "+result.getErrors());
  X509Certificate verified=result.getSignerCertificates().get(0);
  if(!Arrays.equals(verified.getEncoded(),certificates.get(0).getEncoded()))throw new Exception("Signing identity mismatch");
  System.out.println("Verified APK; v1="+result.isVerifiedUsingV1Scheme()+", v2="+result.isVerifiedUsingV2Scheme()+", v3="+result.isVerifiedUsingV3Scheme());
  System.out.println("Certificate SHA-256: "+HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(verified.getEncoded())));
  for(var warning:result.getWarnings())System.out.println("Warning: "+warning);
 }
}
