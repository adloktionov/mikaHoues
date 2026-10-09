import {Group,Mesh,SkinnedMesh} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import type {AssetRecord,FurnitureInstance} from '../domain/types';
import {disposeGroup,surface} from './model';
interface Entry {users:number;promise:Promise<Group>;root?:Group}
/** Each representation is parsed once and shared; the final lease releases its GPU resources. */
export class ImportedModels {
 private entries=new Map<Blob,Entry>();
 acquire(blob:Blob,asset:AssetRecord,f:FurnitureInstance){
  let entry=this.entries.get(blob);
  if(!entry){entry={users:0,promise:Promise.resolve(new Group())};const current=entry;entry.promise=blob.arrayBuffer().then(bytes=>new GLTFLoader().parseAsync(bytes,'')).then(gltf=>{current.root=gltf.scene;if(!current.users)disposeGroup(gltf.scene);return gltf.scene;});this.entries.set(blob,entry);}
  entry.users++;let released=false,instance:Group|undefined;const current=entry;const override=f.useSourceMaterials===false?surface(f.material):undefined;
  const promise=current.promise.then(root=>{if(released)return;instance=new Group();instance.name=f.name;instance.userData.furnitureId=f.id;instance.position.set(f.x,f.y,f.z);instance.rotation.y=-f.rotation*Math.PI/180;const model=clone(root),b=asset.stats?.bounds??[1,1,1];model.scale.multiply({x:f.width/Math.max(b[0],.00001),y:f.height/Math.max(b[1],.00001),z:f.depth/Math.max(b[2],.00001)});model.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true;if(override)o.material=override;}});instance.add(model);return instance;});
  const release=()=>{if(released)return;released=true;override?.dispose();instance?.traverse(o=>{if(o instanceof SkinnedMesh)o.skeleton.dispose();});instance?.removeFromParent();current.users--;if(!current.users){this.entries.delete(blob);if(current.root)disposeGroup(current.root);}};
  return {promise,release};
 }
}
