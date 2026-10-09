import {zip,unzip, strToU8,strFromU8} from 'fflate';
import type {ProjectDocument,AssetRecord} from '../domain/types';
import {validateProject} from '../domain/project';
type ManifestAsset=Omit<AssetRecord,'originals'|'glb'|'lowGlb'|'thumbnail'> & { originals:{name:string;path:string;type:string}[];glbPath?:string;lowPath?:string;thumbnailPath?:string };
export async function packProject(document:ProjectDocument,assets:AssetRecord[]):Promise<Uint8Array>{
 const files:Record<string,Uint8Array>={'project.json':strToU8(JSON.stringify(validateProject(document)))};const manifest:ManifestAsset[]=[];
 for(let i=0;i<assets.length;i++){const a=assets[i],base='assets/'+i+'/';const entry:ManifestAsset={id:a.id,name:a.name,kind:a.kind,stats:a.stats,warnings:a.warnings,originals:[]};
  for(let j=0;j<a.originals.length;j++){const o=a.originals[j],path=base+'original-'+j;files[path]=new Uint8Array(await o.blob.arrayBuffer());entry.originals.push({name:o.name,path,type:o.blob.type});}
  for(const [key,pathKey] of [['glb','glbPath'],['lowGlb','lowPath'],['thumbnail','thumbnailPath']] as const){if(a[key]){const path=base+key;files[path]=new Uint8Array(await a[key]!.arrayBuffer());entry[pathKey]=path;}}
  manifest.push(entry);
 }files['manifest.json']=strToU8(JSON.stringify({version:1,assets:manifest}));
 return new Promise((resolve,reject)=>zip(files,{level:1},(error,data)=>error?reject(error):resolve(data)));
}
export async function unpackProject(bytes:Uint8Array,maxBytes=512*1024*1024):Promise<{document:ProjectDocument;assets:AssetRecord[]}>{
 // Inspect the central directory before decompression, including every original size.
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('Повреждённый архив');const count=view.getUint16(end+10,true);let pos=view.getUint32(end+16,true),total=0;
 if(count>30000)throw new Error('Слишком много файлов');
 for(let i=0;i<count;i++){if(pos+46>bytes.length||view.getUint32(pos,true)!==0x02014b50)throw new Error('Повреждённый каталог архива');total+=view.getUint32(pos+24,true);if(total>maxBytes)throw new Error('Распакованный размер превышает доступный бюджет памяти');const n=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true);const path=strFromU8(bytes.subarray(pos+46,pos+46+n));if(path.includes('..')||path.startsWith('/')||path.includes('\\')||path.includes('__proto__'))throw new Error('Недопустимый путь');pos+=46+n+extra+comment;}
 const files=await new Promise<Record<string,Uint8Array>>((resolve,reject)=>unzip(bytes,(e,data)=>e?reject(new Error('Не удалось распаковать проект')):resolve(data)));
 if(!files['project.json']||!files['manifest.json'])throw new Error('Это не архив House Planner');const document=validateProject(JSON.parse(strFromU8(files['project.json'])));const manifest=JSON.parse(strFromU8(files['manifest.json']));
 if(manifest.version!==1||!Array.isArray(manifest.assets)||manifest.assets.length>10000)throw new Error('Неподдерживаемый каталог ресурсов');
 const blob=(path:string,type:string)=>{if(!files[path])throw new Error('Отсутствует ресурс '+path);return new Blob([files[path].slice().buffer as ArrayBuffer],{type});};const ids=new Set<string>();
 const assets:AssetRecord[]=manifest.assets.map((a:ManifestAsset)=>{if(!a||typeof a.id!=='string'||ids.has(a.id)||typeof a.name!=='string'||!['model','texture','hdri'].includes(a.kind)||!Array.isArray(a.originals)||!Array.isArray(a.warnings))throw new Error('Некорректный ресурс');ids.add(a.id);return {id:a.id,name:a.name,kind:a.kind,stats:a.stats,warnings:a.warnings,originals:a.originals.map(o=>({name:o.name,blob:blob(o.path,o.type)})),glb:a.glbPath?blob(a.glbPath,'model/gltf-binary'):undefined,lowGlb:a.lowPath?blob(a.lowPath,'model/gltf-binary'):undefined,thumbnail:a.thumbnailPath?blob(a.thumbnailPath,'image/png'):undefined};});
 for(const id of referencedAssets(document))if(!ids.has(id))throw new Error('Архив не содержит используемую модель или текстуру: '+id);
 return {document,assets};
}
export function referencedAssets(p:ProjectDocument){const ids=new Set<string>(p.catalogAssetIds??[]);for(const v of p.variants)for(const f of v.furniture){if(f.assetId)ids.add(f.assetId);for(const m of [f.material,...Object.values(f.partMaterials)])if(m.textureAssetId)ids.add(m.textureAssetId);}if(p.lighting.hdriAssetId)ids.add(p.lighting.hdriAssetId);return ids;}
export function download(data:Blob,name:string){const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
