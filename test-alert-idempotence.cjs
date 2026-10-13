const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const supported of [true,false]){
 const sections=[];let observer;
 const profile={querySelector:selector=>sections.find(s=>s.className.split(' ').includes(selector.slice(1)))||null,appendChild:s=>sections.push(s)};
 const element=()=>({style:{},children:[],setAttribute(){},append(...nodes){this.children.push(...nodes)}});
 const window={fetch:async()=>{},addEventListener(){}};
 if(supported){window.Notification={};window.PushManager=function(){};}
 const context={window,document:{querySelector:()=>profile,createElement:element,documentElement:{},addEventListener(){}},navigator:{},console,Set,MutationObserver:class{constructor(callback){observer=callback}observe(){}}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/notifications.js','utf8'),context);
 for(let i=0;i<100;i++)observer();
 assert.equal(sections.length,1,'profile mutations must not duplicate notification settings');
 if(!supported)assert.match(sections[0].children[0].textContent,/ainda não estão disponíveis/);
}
console.log('Passed: one notification settings panel after 100 DOM updates, with clear unsupported-device status.');
