const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/password-recovery.js','utf8');
async function setup(hash,fail){
 const elements=Object.fromEntries(['status','recovery-form','save','password','confirmation'].map(id=>[id,{hidden:true,value:'',focus(){},addEventListener(type,fn){this[type]=fn;}}]));
 const calls=[];let cleaned=false;
 const auth={
  async setSession(tokens){assert(cleaned);calls.push('session');return fail==='session'?{error:{}}:{data:{session:{user:{id:'test'}}}};},
  async getUser(){calls.push('user');return fail==='user'?{error:{}}:{data:{user:{id:'test'}}};},
  async updateUser(value){calls.push(['update',value.password]);return fail==='update'?{error:{code:'same_password'}}:{data:{user:{id:'test'}}};},
  async signOut(options){assert.equal(options.scope,'local');calls.push('signOut');}
 };
 await vm.runInNewContext(source,{URLSearchParams,location:{hash,pathname:'/password-recovery.html'},history:{replaceState(_,__,path){assert.equal(path,'/password-recovery.html');cleaned=true;}},document:{getElementById:id=>elements[id]},window:{supabase:{createClient(url,key,options){assert.equal(url,'https://cipfycetzelxzwpfaqiu.supabase.co');assert.equal(options.auth.persistSession,false);assert.equal(options.auth.detectSessionInUrl,false);return{auth};}}}});
 return{elements,calls,async submit(a,b){elements.password.value=a;elements.confirmation.value=b;await elements['recovery-form'].submit({preventDefault(){}});}};
}
(async()=>{
 for(const hash of ['', '#error=access_denied&error_code=otp_expired','#type=signup&access_token=a&refresh_token=b','#type=recovery&access_token=a']){
  const x=await setup(hash);assert.equal(x.elements['recovery-form'].hidden,true);assert.equal(x.calls.length,0);
 }
 const valid='#type=recovery&access_token=a&refresh_token=b';
 for(const failure of ['session','user']){const x=await setup(valid,failure);assert.equal(x.elements['recovery-form'].hidden,true);assert.match(x.elements.status.textContent,/expirou/);}
 const x=await setup(valid);assert.equal(x.elements['recovery-form'].hidden,false);
 await x.submit('short','short');assert.equal(x.calls.length,2);
 await x.submit('long-password','different');assert.equal(x.calls.length,2);
 await x.submit('long-password','long-password');assert.equal(x.calls[2][0],'update');assert.equal(x.calls[3],'signOut');assert.equal(x.elements.password.value,'');assert.equal(x.elements['recovery-form'].hidden,true);assert.match(x.elements.status.textContent,/Senha atualizada/);
 await x.submit('long-password','long-password');assert.equal(x.calls.length,4,'completed recovery cannot submit twice');
 const y=await setup(valid,'update');await y.submit('long-password','long-password');assert.match(y.elements.status.textContent,/diferente/);assert.equal(y.elements.save.disabled,false);
 console.log('Passed: missing/expired/wrong-type links, server rejection, destination isolation, password validation, successful update, cleanup and retry.');
})().catch(e=>{console.error(e);process.exit(1);});
