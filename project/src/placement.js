import clipping from 'polygon-clipping';
import {collisionMessages,footprint,pointInPolygon,area} from './geometry.js';
export const occupiedHeight = o => o.height + (o.modelType==='desk_workstation'||o.category==='workstation' ? (o.extraHeight??.5) : 0);
const occupied = o => ({...o,height:occupiedHeight(o),visible:o.visible!==false});
export function furnitureCollisionMessages(item,objects,data){return collisionMessages(occupied(item),[...objects,...(data.fixedFurniture||[])].map(occupied),data);}
function contained(item,room){
 const p=footprint(item);if(!p.every(v=>pointInPolygon(v,room.polygon)))return false;
 const remaining=clipping.difference([p],[room.polygon]);
 return remaining.reduce((n,rings)=>n+area(rings[0])-rings.slice(1).reduce((s,r)=>s+area(r),0),0)<1e-7;
}
export function findFurniturePlacement(def,center,objects,data){
 const current=data.rooms.find(r=>pointInPolygon([center.x,center.z],r.polygon));
 const rooms=[...data.rooms].sort((a,b)=>(b===current)-(a===current));
 const start=current?[center.x,0,center.z]:[...(rooms[0]?.interiorPoint||[0,0])];
 const fallback=start.length===3?start:[start[0],0,start[1]];
 const item={...def,id:'placement-candidate',rotation:def.rotation||0,visible:true,position:fallback};
 for(const r of rooms){
  const xs=r.polygon.map(p=>p[0]),zs=r.polygon.map(p=>p[1]);const cx=r===current?center.x:r.interiorPoint?.[0]??(Math.min(...xs)+Math.max(...xs))/2,cz=r===current?center.z:r.interiorPoint?.[1]??(Math.min(...zs)+Math.max(...zs))/2;
  const candidates=[[cx,cz]];
  for(let x=Math.min(...xs);x<=Math.max(...xs);x+=.25)for(let z=Math.min(...zs);z<=Math.max(...zs);z+=.25)candidates.push([x,z]);
  candidates.sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cz)-Math.hypot(b[0]-cx,b[1]-cz));
  for(const [x,z] of candidates){item.position=[x,0,z];if(contained(item,r)&&!furnitureCollisionMessages(item,objects,data).length)return {position:item.position,fallback:false};}
 }
 return {position:fallback,fallback:true};
}
