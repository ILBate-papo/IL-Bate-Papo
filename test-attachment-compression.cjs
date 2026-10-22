const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let dimensions,quality,revoked=0,blobSize=80000;
class Image{naturalWidth=4000;naturalHeight=3000;set src(x){this.onload();}}
class File{constructor(parts,name,opt){Object.assign(this,opt);this.name=name;this.size=parts[0].size;}}
const context={window:{},Image,File,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},document:{addEventListener(){},createElement:()=>{let canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(){dimensions=[canvas.width,canvas.height]}}),toBlob(cb,type,q){quality=q;cb({size:blobSize})}};return canvas;}}};
vm.runInNewContext(fs.readFileSync('ilbp-media.js','utf8'),context);
(async()=>{
 const photo={type:'image/jpeg',size:4000000,name:'camera.jpg',lastModified:1};
 let result=await context.window.ILBPPrepareAttachment(photo);assert.equal(result.size,80000);assert.deepEqual(dimensions,[1600,1200]);assert.equal(quality,.78);assert.equal(revoked,1);
 blobSize=5000000;assert.equal(await context.window.ILBPPrepareAttachment(photo),photo);assert.equal(revoked,2);
 for(const type of ['application/pdf','image/gif','audio/webm']){const f={type,size:4000000};assert.equal(await context.window.ILBPPrepareAttachment(f),f);}
 console.log('PASS: 4000x3000 downscaled to 1600x1200, smaller encoding used, larger encoding rejected, original PDFs/GIF/audio preserved, blob URLs released');
})().catch(e=>{console.error(e);process.exit(1)});
