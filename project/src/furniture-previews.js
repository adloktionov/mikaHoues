import * as THREE from 'three';
import {createPersonalFurniture} from './personal-furniture.js';
import {disposeTree} from './architecture.js';
const cache=new Map();let renderer;
export function furniturePreview(def){
 if(cache.has(def.id))return cache.get(def.id);
 try{
  renderer??=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(180,140);renderer.setPixelRatio(1);renderer.setClearColor('#f1f2ed',1);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  const scene=new THREE.Scene(),obj=createPersonalFurniture({...def,position:[0,0,0],rotation:0,visible:true});scene.add(obj);
  scene.add(new THREE.HemisphereLight('#ffffff','#758079',3));const light=new THREE.DirectionalLight('#fff1de',3);light.position.set(3,5,4);scene.add(light);
  const bounds=new THREE.Box3().setFromObject(obj),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const r=Math.max(size.x,size.y,size.z)*.87,camera=new THREE.OrthographicCamera(-r*180/140,r*180/140,r,-r,.01,50);
  camera.position.copy(center).add(new THREE.Vector3(3,2.1,4));camera.lookAt(center);renderer.render(scene,camera);
  const url=renderer.domElement.toDataURL('image/png');cache.set(def.id,url);disposeTree(obj);return url;
 }catch{return null;}
}
