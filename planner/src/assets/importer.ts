import type { AssetRecord } from '../domain/types';
export interface ImportOptions { scale:number; signal?:AbortSignal; onProgress?:(message:string)=>void }
/** One worker per import: cancellation also stops parsers that have no cooperative abort API. */
export function importModel(files:File[],mainName:string,options:ImportOptions):Promise<AssetRecord>{
 return new Promise((resolve,reject)=>{
  if(options.signal?.aborted){reject(new DOMException('Импорт отменён','AbortError'));return;}
  const worker=new Worker(new URL('../workers/import.worker.ts',import.meta.url),{type:'module'});
  const cleanup=()=>{worker.terminate();options.signal?.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new DOMException('Импорт отменён','AbortError'));};
  options.signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=e=>{cleanup();reject(new Error(e.message||'Не удалось прочитать модель'));};
  worker.onmessage=({data})=>{
   if(data.progress){options.onProgress?.(data.progress);return;}
   cleanup();
   if(data.error){reject(new Error(data.error));return;}
   resolve({id:crypto.randomUUID(),name:mainName,kind:'model',originals:files.map(f=>({name:f.name,blob:f})),glb:new Blob([data.glb],{type:'model/gltf-binary'}),stats:data.stats,warnings:data.warnings});
  };
  worker.postMessage({files,mainName,scale:options.scale});
 });
}
