import {FloatType} from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
export interface EnvironmentPixels {width:number;height:number;data:Float32Array}
/** Check the header before the decoder can allocate an image from untrusted dimensions. */
export function decodeEnvironment(buffer:ArrayBuffer,maxWidth:number):EnvironmentPixels{
 if(buffer.byteLength>64*1024*1024)throw new Error('HDRI должна быть не больше 64 МБ');
 const header=new TextDecoder().decode(new Uint8Array(buffer,0,Math.min(buffer.byteLength,8192))),match=header.match(/(?:^|\n)-Y (\d+) \+X (\d+)(?:\r?\n)/);
 if(!header.startsWith('#?')||!match)throw new Error('Нужна панорама Radiance .hdr с ориентацией -Y +X');
 const h=Number(match[1]),w=Number(match[2]);if(w<8||h<4||w*h>8388608||w>8192||h>4096)throw new Error('Недопустимый размер HDRI: максимум 8 мегапикселей');if(w!==2*h)throw new Error('HDRI должна быть панорамой 2:1');
 if(!Number.isInteger(maxWidth)||maxWidth<4||maxWidth>2048)throw new Error('Неверное разрешение окружения');
 const image=new HDRLoader().setDataType(FloatType).parse(buffer);if(!image||image.width!==w||image.height!==h)throw new Error('Повреждённая HDRI');
 const source=image.data as Float32Array,width=Math.min(w,maxWidth),height=Math.max(1,Math.round(width/2)),data=new Float32Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const x0=Math.floor(x*w/width),x1=Math.max(x0+1,Math.floor((x+1)*w/width)),y0=Math.floor(y*h/height),y1=Math.max(y0+1,Math.floor((y+1)*h/height)),count=(x1-x0)*(y1-y0),index=(y*width+x)*4;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)for(let c=0;c<3;c++){const value=source[(sy*w+sx)*4+c];if(!Number.isFinite(value)||value<0)throw new Error('Повреждённые значения HDRI');data[index+c]+=value/count;}data[index+3]=1;}
 return {width,height,data};
}
