// Limited rollout: never change delivery for another account or installation.
// Expires automatically while awaiting real hardware verification.
export function urgentNativePilot(id:string,userId:string,payload:Record<string,unknown>,nativeService:boolean,now=Date.now()):boolean {
 return now<Date.parse("2026-11-11T00:00:00Z") && nativeService===true &&
  id==="aeaef01d-f0cb-438d-8be1-fa9a6fa4e46f" &&
  userId==="e0907d03-1ec7-4649-9126-f476c53bc2ba" && payload.app_id==="ilbp" &&
  (payload.type==="call" || payload.type==="call-end");
}
