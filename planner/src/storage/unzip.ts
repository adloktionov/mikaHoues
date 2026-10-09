import {readZip} from './zip-reader';
export async function unzipChecked(bytes:Uint8Array,maxBytes:number):Promise<Record<string,Uint8Array>>{
 if(typeof Worker==='undefined')return readZip(bytes,maxBytes);
 return new Promise((resolve,reject)=>{const worker=new Worker(new URL('../workers/archive.worker.ts',import.meta.url),{type:'module'});worker.onerror=e=>{worker.terminate();reject(new Error(e.message));};worker.onmessage=({data})=>{worker.terminate();data.error?reject(new Error(data.error)):resolve(data.files);};const copy=bytes.slice();worker.postMessage({bytes:copy,maxBytes},{transfer:[copy.buffer]});});
}
