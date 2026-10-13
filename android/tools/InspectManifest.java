import com.android.apksig.internal.apk.AndroidBinXmlParser;
import java.nio.ByteBuffer;
import java.util.zip.*;
class InspectManifest {
 public static void main(String[] args) throws Exception {
  try(ZipFile zip=new ZipFile(args[0])){
   var parser=new AndroidBinXmlParser(ByteBuffer.wrap(zip.getInputStream(zip.getEntry("AndroidManifest.xml")).readAllBytes()));
   int event;
   while((event=parser.next())!=AndroidBinXmlParser.EVENT_END_DOCUMENT){
    if(event!=AndroidBinXmlParser.EVENT_START_ELEMENT)continue;
    if(!java.util.List.of("manifest","uses-sdk","uses-permission","activity").contains(parser.getName()))continue;
    System.out.print(parser.getName()+": ");
    for(int i=0;i<parser.getAttributeCount();i++){
     int type=parser.getAttributeValueType(i);
     Object value=type==AndroidBinXmlParser.VALUE_TYPE_STRING?parser.getAttributeStringValue(i):type==AndroidBinXmlParser.VALUE_TYPE_INT?parser.getAttributeIntValue(i):"other";
     System.out.print(parser.getAttributeName(i)+"="+value+" ");
    }
    System.out.println();
   }
  }
 }
}
