import {Box3,Group,LoadingManager,Mesh,Texture,Loader,Vector3} from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import type {AssetStats} from '../domain/types';

self.onmessage=async({data}:{data:{files:File[];mainName:string;scale:number}})=>{
 const started=performance.now(),urls:string[]=[],bitmaps:ImageBitmap[]=[],warnings:string[]=[];
 const originalWarn=console.warn;
 console.warn=(...args:unknown[])=>{warnings.push(args.map(String).join(' '));};
 try{
  const main=data.files.find(f=>f.name===data.mainName);
  if(!main||!Number.isFinite(data.scale)||data.scale<=0)throw new Error('Не выбран файл или неверный масштаб');
  if(data.files.reduce((sum,f)=>sum+f.size,0)>512*1024*1024)throw new Error('Выберите файлы общим размером до 512 МБ');
  const ext=main.name.split('.').pop()?.toLowerCase();
  if(!['fbx','glb','gltf'].includes(ext||''))throw new Error('Поддерживаются FBX, GLB и glTF');
  const manager=new LoadingManager();
  const basename=(name:string)=>decodeURIComponent(name.replaceAll('\\','/').split('/').pop()||'');
  const resolveLocal=(url:string)=>{
   if(url.startsWith('blob:')||url.startsWith('data:'))return url;
   const file=data.files.find(f=>f.name===url)||data.files.find(f=>f.name===basename(url));
   if(!file)throw new Error(`Не найден связанный файл: ${basename(url)}. Выберите его вместе с моделью.`);
   const local=URL.createObjectURL(file);urls.push(local);return local;
  };
  manager.setURLModifier(resolveLocal);
  const textures:Promise<void>[]=[];
  class WorkerTextureLoader extends Loader<Texture>{
   override load(url:string,onLoad?:(t:Texture)=>void,_onProgress?:((event:ProgressEvent)=>void),onError?:((err:unknown)=>void)):Texture{
    const texture=new Texture();
    textures.push((async()=>{
     try{const response=await fetch(resolveLocal((this.path||'')+url));if(!response.ok)throw new Error('Не удалось прочитать текстуру');
      const bitmap=await createImageBitmap(await response.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});bitmaps.push(bitmap);texture.image=bitmap;texture.needsUpdate=true;onLoad?.(texture);
     }catch(error){onError?.(error);throw error;}
    })());return texture;
   }
  }
  manager.addHandler(/\.(png|jpe?g|webp|bmp|gif)$/i,new WorkerTextureLoader(manager));
  self.postMessage({progress:'Чтение модели и текстур…'});
  const bytes=await main.arrayBuffer();let root:Group;let animations;
  if(ext==='fbx'){
   root=new FBXLoader(manager).parse(bytes,'');animations=root.animations;
   await Promise.all(textures);
   root.scale.multiplyScalar((Number(root.userData.unitScaleFactor)||1)/100);
  }else{
   const gltf=await new GLTFLoader(manager).parseAsync(ext==='gltf'?new TextDecoder().decode(bytes):bytes,'');root=gltf.scene;animations=gltf.animations;
  }
  root.scale.multiplyScalar(data.scale);root.updateMatrixWorld(true);
  let box=new Box3().setFromObject(root);
  if(box.isEmpty())throw new Error('В файле нет геометрии для отображения');
  const center=box.getCenter(new Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=box.min.y;root.updateMatrixWorld(true);
  box=new Box3().setFromObject(root);const size=box.getSize(new Vector3());
  if(![size.x,size.y,size.z].every(Number.isFinite))throw new Error('Некорректные координаты модели');
  const mats=new Set(),maps=new Set<Texture>();
  const stats:AssetStats={triangles:0,vertices:0,meshes:0,materials:0,textures:0,texturePixels:0,estimatedBytes:0,bounds:[size.x,size.y,size.z],processingMs:0};
  root.traverse(object=>{if(!(object instanceof Mesh))return;stats.meshes++;const g=object.geometry;stats.vertices+=g.attributes.position?.count||0;stats.triangles+=(g.index?.count||g.attributes.position?.count||0)/3;
   for(const a of Object.values(g.attributes))stats.estimatedBytes+=(a as {array:{byteLength:number}}).array.byteLength;
   if(g.index)stats.estimatedBytes+=g.index.array.byteLength;
   for(const mat of Array.isArray(object.material)?object.material:[object.material]){mats.add(mat);for(const value of Object.values(mat))if(value instanceof Texture)maps.add(value);}
  });
  if(!stats.triangles)throw new Error('В файле нет полигональной модели');
  stats.materials=mats.size;stats.textures=maps.size;
  for(const map of maps){const img=map.image as {width?:number;height?:number}|undefined;stats.texturePixels+=(img?.width||0)*(img?.height||0);}
  stats.estimatedBytes+=stats.texturePixels*4*4/3;
  self.postMessage({progress:'Преобразование в GLB…'});
  const glb=await new GLTFExporter().parseAsync(root,{binary:true,animations,onlyVisible:false});
  if(!(glb instanceof ArrayBuffer))throw new Error('Не удалось сохранить GLB');
  stats.processingMs=performance.now()-started;
  self.postMessage({glb,stats,warnings:[...new Set(warnings)]},{transfer:[glb]});
 }catch(error){self.postMessage({error:error instanceof Error?error.message:String(error)});}
 finally{console.warn=originalWarn;urls.forEach(URL.revokeObjectURL);bitmaps.forEach(b=>b.close());}
};
