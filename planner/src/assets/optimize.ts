import {WebIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,simplify,weld} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
/** Browser-worker-only optimization. The full representation retains mesh topology. */
export async function optimizeGlb(input:ArrayBuffer){
 const io=new WebIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 await MeshoptDecoder.ready;const full=await io.readBinary(new Uint8Array(input));await full.transform(dedup(),prune());
 const glb=await io.writeBinary(full),low=await io.readBinary(glb);
 await low.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.35,error:.01,lockBorder:false}));
 for(const texture of low.getRoot().listTextures()){
  const image=texture.getImage();if(!image)continue;const mime=texture.getMimeType();if(!['image/png','image/jpeg','image/webp'].includes(mime))continue;
  const bitmap=await createImageBitmap(new Blob([image.slice().buffer as ArrayBuffer],{type:mime}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  try{const scale=Math.min(1,512/Math.max(bitmap.width,bitmap.height));if(scale>=1)continue;const canvas=new OffscreenCanvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale))),context=canvas.getContext('2d');if(!context)throw new Error('Не удалось уменьшить текстуру');context.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await canvas.convertToBlob({type:'image/png'});texture.setImage(new Uint8Array(await blob.arrayBuffer())).setMimeType('image/png');}finally{bitmap.close();}
 }
 await low.transform(prune());const lowGlb=await io.writeBinary(low);return {glb:glb.slice().buffer as ArrayBuffer,lowGlb:lowGlb.slice().buffer as ArrayBuffer};
}
