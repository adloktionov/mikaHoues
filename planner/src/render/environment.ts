import {DataTexture,EquirectangularReflectionMapping,FloatType,LinearSRGBColorSpace,PMREMGenerator,RGBAFormat,Scene,WebGLRenderer,WebGLRenderTarget} from 'three';
import {prepareEnvironment} from '../assets/hdri';import type {AssetRecord} from '../domain/types';
export class EnvironmentMap{
 private key='';private controller?:AbortController;private target?:WebGLRenderTarget;ready:Promise<void>=Promise.resolve();
 constructor(private renderer:WebGLRenderer,private scene:Scene,private changed:()=>void,private warning:(message:string)=>void){}
 update(asset:AssetRecord|undefined,level:number){const width=level<=3?256:level===4?512:1024,key=level>1&&asset?asset.id+':'+width:'';if(key===this.key)return;this.clear();this.key=key;if(!key||!asset)return;const blob=asset.originals[0]?.blob;if(!blob){this.warning('Не найден исходный файл HDRI');return;}const controller=new AbortController();this.controller=controller;
  this.ready=prepareEnvironment(blob,width,controller.signal).then(pixels=>{if(controller.signal.aborted)return;let {data,width,height}=pixels;if(width<64){const expanded=new Float32Array(64*32*4);for(let y=0;y<32;y++)for(let x=0;x<64;x++){const i=(Math.floor(y*height/32)*width+Math.floor(x*width/64))*4;expanded.set(data.subarray(i,i+4),(y*64+x)*4);}data=expanded;width=64;height=32;}const texture=new DataTexture(data,width,height,RGBAFormat,FloatType);texture.flipY=true;texture.mapping=EquirectangularReflectionMapping;texture.colorSpace=LinearSRGBColorSpace;texture.needsUpdate=true;const generator=new PMREMGenerator(this.renderer);try{this.target=generator.fromEquirectangular(texture);this.scene.environment=this.target.texture;}finally{texture.dispose();generator.dispose();}this.changed();}).catch(error=>{if((error as Error).name!=='AbortError')this.warning('Не удалось применить HDRI: '+(error as Error).message);});
 }
 private clear(){this.controller?.abort();this.scene.environment=null;this.target?.dispose();this.target=undefined;this.changed();}
 dispose(){this.key='';this.clear();}
}
