import {readZip} from '../storage/zip-reader';
self.onmessage=({data}:{data:{bytes:Uint8Array;maxBytes:number}})=>{try{const files=readZip(data.bytes,data.maxBytes);self.postMessage({files},{transfer:Object.values(files).map(f=>f.buffer)});}catch(error){self.postMessage({error:(error as Error).message});}};
