(function(){
 'use strict';
 // PCM WAV carries an explicit duration and does not depend on AAC/WebM codecs.
 window.ILBPEncodeVoiceWav=function(buffer){
  const channels=buffer.numberOfChannels,length=buffer.length,rate=buffer.sampleRate;
  if(!channels||!length||!Number.isFinite(rate)||rate<=0)throw new Error('A gravação ficou vazia. Grave novamente.');
  if(length*2+44>52428800)throw new Error('A gravação ultrapassa o tamanho permitido. Envie um áudio menor.');
  const bytes=new ArrayBuffer(44+length*2),view=new DataView(bytes);
  function text(offset,value){for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));}
  text(0,'RIFF');view.setUint32(4,36+length*2,true);text(8,'WAVE');text(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
  text(36,'data');view.setUint32(40,length*2,true);
  const samples=Array.from({length:channels},(_,channel)=>buffer.getChannelData(channel));
  for(let i=0;i<length;i++){
   let sample=0;for(let c=0;c<channels;c++)sample+=samples[c][i]/channels;
   sample=Number.isFinite(sample)?Math.max(-1,Math.min(1,sample)):0;
   view.setInt16(44+i*2,Math.round(sample*(sample<0?32768:32767)),true);
  }
  return new Blob([bytes],{type:'audio/wav'});
 };
 window.ILBPPrepareVoiceRecording=async function(blob){
  if(!blob?.size)throw new Error('A gravação ficou vazia. Grave novamente.');
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)throw new Error('Este navegador não consegue preparar a gravação. Atualize o navegador e tente novamente.');
  const decoder=new Offline(1,1,24000);
  let buffer;try{buffer=await decoder.decodeAudioData(await blob.arrayBuffer());}
  catch{throw new Error('Não foi possível finalizar esta gravação. Grave novamente antes de enviar.');}
  return new File([window.ILBPEncodeVoiceWav(buffer)],'audio-'+Date.now()+'.wav',{type:'audio/wav'});
 };
})();
