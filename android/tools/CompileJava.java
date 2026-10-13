import javax.tools.ToolProvider;
class CompileJava {
 public static void main(String[] args){int code=ToolProvider.getSystemJavaCompiler().run(null,System.out,System.err,args);if(code!=0)throw new IllegalStateException("Java compile failed: "+code);}
}
