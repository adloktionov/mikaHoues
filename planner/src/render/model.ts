import {BoxGeometry,ExtrudeGeometry,Group,Mesh,MeshStandardMaterial,MeshLambertMaterial,Path,Shape,Vector2,Texture,BufferGeometry,Material as ThreeMaterial,Object3D} from 'three';
import clipping from 'polygon-clipping';
import type {FurnitureInstance,Material,ProjectDocument} from '../domain/types';
import {deriveWalls,ring,wallPolygon} from '../domain/geometry';
import {furnitureParts} from '../domain/furniture';

export function surface(m:Material,simple=false){if(simple)return new MeshLambertMaterial({color:m.color,transparent:m.opacity<1,opacity:m.opacity});return new MeshStandardMaterial({color:m.color,roughness:m.roughness,metalness:m.metalness,transparent:m.opacity<1,opacity:m.opacity});}
export function buildFurniture(f:FurnitureInstance,proxy=false){const group=new Group();group.name=f.name;group.userData.furnitureId=f.id;group.position.set(f.x,f.y,f.z);group.rotation.y=-f.rotation*Math.PI/180;
 const parts=proxy?[{id:'proxy',name:f.name,x:0,y:f.height/2,z:0,width:f.width,height:f.height,depth:f.depth,material:f.material}]:furnitureParts(f);
 const materials=new Map<string,ThreeMaterial>();
 for(const part of parts){const key=JSON.stringify(part.material);let mat=materials.get(key);if(!mat){mat=surface(part.material,proxy);materials.set(key,mat);}const mesh=new Mesh(new BoxGeometry(part.width,part.height,part.depth),mat);mesh.position.set(part.x,part.y,part.z);mesh.name=part.name;mesh.userData.partId=part.id;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}return group;
}
export function extrude(polygon:clipping.Polygon,height:number,material:ThreeMaterial){
 const shape=new Shape(polygon[0].map(([x,z])=>new Vector2(x,-z)));
 for(const hole of polygon.slice(1))shape.holes.push(new Path(hole.map(([x,z])=>new Vector2(x,-z))));
 const geometry=new ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1});geometry.rotateX(-Math.PI/2);
 const mesh=new Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
/** Wall solids come from the same clear room boundaries; height bands preserve all openings. */
export function buildArchitecture(project:ProjectDocument,wallHeight=project.height){
 const group=new Group(),walls=deriveWalls(project),height=Math.min(project.height,wallHeight);
 const floorMaterial=new MeshStandardMaterial({color:'#c8b9a0',roughness:.85});
 for(const room of project.rooms){const floor=extrude([ring(room.points)],.04,floorMaterial);floor.position.y=-.04;floor.userData.roomId=room.id;group.add(floor);}
 const levels=[...new Set([0,height,...project.openings.flatMap(o=>[o.sill,o.sill+o.height]).filter(y=>y>0&&y<height)])].sort((a,b)=>a-b);
 const materials=new Map(project.profiles.map(p=>[p.id,new MeshStandardMaterial({color:p.kind==='aac'?'#e8e4da':'#d4c9b8',roughness:.9})]));
 for(let i=0;i<levels.length-1;i++){
  const bottom=levels[i],top=levels[i+1];let allocated:clipping.MultiPolygon=[];
  for(const profileId of [project.exteriorProfileId,project.interiorProfileId]){
   let solid:clipping.MultiPolygon=[];
   for(const wall of walls.filter(w=>w.profileId===profileId)){
    let shape:clipping.MultiPolygon=[[ring(wallPolygon(wall,0,wall.length,wall.thickness))]];
    for(const o of project.openings.filter(o=>o.wallId===wall.id&&o.sill<top&&o.sill+o.height>bottom))shape=clipping.difference(shape,[[ring(wallPolygon({...wall,thickness:wall.thickness+.002},o.offset-o.width/2,o.offset+o.width/2))]]);
    if(shape.length)solid=solid.length?clipping.union(solid,shape):shape;
   }
   if(!solid.length)continue;
   for(const room of project.rooms)solid=clipping.difference(solid,[[ring(room.points)]]);
   if(allocated.length)solid=clipping.difference(solid,allocated);
   if(!solid.length)continue;allocated=allocated.length?clipping.union(allocated,solid):solid;
   for(const polygon of solid){const mesh=extrude(polygon,top-bottom,materials.get(profileId)!);mesh.position.y=bottom;mesh.userData.architecture=true;group.add(mesh);}
  }
 }
 // Dispose materials that ended up with no mesh (empty project or fully open band).
 const used=new Set<ThreeMaterial>();group.traverse(o=>{if(o instanceof Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])used.add(m);});for(const m of [...materials.values(),floorMaterial])if(!used.has(m))m.dispose();
 return group;
}
export function disposeGroup(root:Object3D){const geometries=new Set<BufferGeometry>(),materials=new Set<ThreeMaterial>(),textures=new Set<Texture>();root.traverse(object=>{const o=object as Mesh;if(o.geometry)geometries.add(o.geometry);if(o.material)for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);for(const value of Object.values(mat))if(value instanceof Texture)textures.add(value);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();}
