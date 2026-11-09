type Registration = {id:string;user_id:string;updated_at?:string;subscription?:{app_id?:string;transport?:string;token?:string}};
// Routing only. Recipient authorization and the APK account guard remain mandatory.
// One FCM token identifies an installation; older account rows must not fan out to it.
export function currentFcmRegistrationIds(rows:Registration[]):Set<string> {
 const groups=new Map<string,{time:number;rows:Registration[]}>();
 for(const row of rows){
  const sub=row.subscription;
  if(sub?.app_id!=="ilbp"||sub.transport!=="fcm"||typeof sub.token!=="string"||!sub.token)continue;
  const parsed=Date.parse(row.updated_at||""),time=Number.isFinite(parsed)?parsed:0;
  const group=groups.get(sub.token);
  if(!group||time>group.time)groups.set(sub.token,{time,rows:[row]});
  else if(time===group.time)group.rows.push(row);
 }
 const ids=new Set<string>();
 for(const group of groups.values()){
  // An ambiguous tie across accounts cannot safely identify the current owner.
  if(new Set(group.rows.map(r=>r.user_id)).size!==1)continue;
  ids.add(group.rows.map(r=>r.id).sort()[0]);
 }
 return ids;
}
