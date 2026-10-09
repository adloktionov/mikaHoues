import clipping from 'polygon-clipping';
import type {Point,Room,Wall,ProjectDocument} from './types';
import {uid} from './project';
export const EPS=1e-5;
export const distance=(a:Point,b:Point)=>Math.hypot(b.x-a.x,b.z-a.z);
export const signedArea=(p:Point[])=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
export const area=(p:Point[])=>Math.abs(signedArea(p));
export function bounds(points:Point[]){return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minZ:Math.min(...points.map(p=>p.z)),maxZ:Math.max(...points.map(p=>p.z))};}
export function rectangle(id:string,name:string,width:number,depth:number,x=0,z=0):Room {return {id,name,color:'#dfebe4',points:[{x,z},{x:x+width,z},{x:x+width,z:z+depth},{x,z:z+depth}].map((p,i)=>({...p,id:id+'-v'+i}))};}
const onSegment=(a:Point,b:Point,p:Point)=>Math.abs(cross(a,b,p))<EPS&&p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.z>=Math.min(a.z,b.z)-EPS&&p.z<=Math.max(a.z,b.z)+EPS;
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
export function validatePolygon(p:Point[]):string[]{
 const errors:string[]=[];if(p.length<3||area(p)<.04)return ['Помещение слишком мало или контур пересекает сам себя'];
 for(let i=0;i<p.length;i++){const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];const l=distance(a,b),r=distance(b,c);if(l<.05||r<.05){errors.push('Стена короче 5 см');continue;}const angle=Math.acos(Math.max(-1,Math.min(1,((a.x-b.x)*(c.x-b.x)+(a.z-b.z)*(c.z-b.z))/(l*r))))*180/Math.PI;if(angle<90-.001)errors.push('Острый угол недопустим');
  for(let j=i+1;j<p.length;j++){if(j===i+1||(i===0&&j===p.length-1))continue;const d=p[(j+1)%p.length],e=p[j];if((cross(b,c,e)*cross(b,c,d)<-EPS&&cross(e,d,b)*cross(e,d,c)<-EPS)||onSegment(b,c,e)||onSegment(b,c,d)||onSegment(e,d,b)||onSegment(e,d,c))errors.push('Контур пересекает сам себя');}
 }
 return [...new Set(errors)];
}
export const ring=(p:Point[])=>p.map(v=>[v.x,v.z] as [number,number]);
export function overlapArea(a:Point[],b:Point[]):number {return clipping.intersection([ring(a)],[ring(b)]).reduce((s,poly)=>s+poly.reduce((n,r,i)=>n+(i===0?1:-1)*area(r.map(v=>({x:v[0],z:v[1]}))),0),0);}
export function validateArchitecture(p:ProjectDocument){const errors=p.rooms.flatMap(r=>validatePolygon(r.points).map(e=>r.name+': '+e));for(let i=0;i<p.rooms.length;i++)for(let j=i+1;j<p.rooms.length;j++)if(overlapArea(p.rooms[i].points,p.rooms[j].points)>EPS)errors.push(`Пересекаются комнаты «${p.rooms[i].name}» и «${p.rooms[j].name}»`);if(!errors.length)for(const w of deriveWalls(p))for(const room of p.rooms)if(!w.roomIds.includes(room.id)&&overlapArea(wallPolygon(w),room.points)>EPS)errors.push(`Стена заходит внутрь комнаты «${room.name}». Соедините комнаты или увеличьте расстояние.`);return [...new Set(errors)];}
interface Edge {room:Room;index:number;a:Point;b:Point;dx:number;dz:number;nx:number;nz:number;length:number;key:string}
function edges(p:ProjectDocument):Edge[]{return p.rooms.flatMap(room=>room.points.map((a,index)=>{const b=room.points[(index+1)%room.points.length],length=distance(a,b),sign=Math.sign(signedArea(room.points))||1;return {room,index,a,b,length,dx:(b.x-a.x)/length,dz:(b.z-a.z)/length,nx:sign*(b.z-a.z)/length,nz:-sign*(b.x-a.x)/length,key:room.id+':'+(a.id??index)};}));}
export function deriveWalls(p:ProjectDocument):Wall[]{
 const all=edges(p),inside=p.profiles.find(m=>m.id===p.interiorProfileId)!,outside=p.profiles.find(m=>m.id===p.exteriorProfileId)!;const walls:Wall[]=[],seen=new Set<string>();
 for(const e of all){if(e.length<EPS)continue;const neighbours:{edge:Edge;lo:number;hi:number}[]=[];
  for(const n of all){if(n.room.id===e.room.id||e.nx*n.nx+e.nz*n.nz>-.99999)continue;const gap=(n.a.x-e.a.x)*e.nx+(n.a.z-e.a.z)*e.nz;if(Math.abs(gap-inside.width)>.003)continue;const q=(v:Point)=>(v.x-e.a.x)*e.dx+(v.z-e.a.z)*e.dz;const lo=Math.max(0,Math.min(q(n.a),q(n.b))),hi=Math.min(e.length,Math.max(q(n.a),q(n.b)));if(hi-lo>.01)neighbours.push({edge:n,lo,hi});}
  const cuts=[...new Set([0,e.length,...neighbours.flatMap(n=>[n.lo,n.hi])].map(n=>Math.round(n*1e6)/1e6))].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){const lo=cuts[i],hi=cuts[i+1],middle=(lo+hi)/2,n=neighbours.find(n=>middle>n.lo-EPS&&middle<n.hi+EPS);const profile=n?inside:outside;
   const id=n?'wall:'+ [e.key,n.edge.key].sort().join('|'):'wall:'+e.key+':outer:'+i;if(seen.has(id))continue;seen.add(id);
   const at=(s:number)=>({x:e.a.x+e.dx*s+e.nx*profile.width/2,z:e.a.z+e.dz*s+e.nz*profile.width/2});
   const owners=[{roomId:e.room.id,edge:e.index,start:lo,end:hi}];if(n){const project=(s:number)=>{const v={x:e.a.x+e.dx*s+e.nx*profile.width,z:e.a.z+e.dz*s+e.nz*profile.width};return (v.x-n.edge.a.x)*n.edge.dx+(v.z-n.edge.a.z)*n.edge.dz;};owners.push({roomId:n.edge.room.id,edge:n.edge.index,start:Math.min(project(lo),project(hi)),end:Math.max(project(lo),project(hi))});}
   walls.push({id,a:at(lo),b:at(hi),length:hi-lo,thickness:profile.width,roomIds:owners.map(o=>o.roomId),owners,profileId:profile.id});
  }
 }return walls;
}
export function attachRoom(p:ProjectDocument,movingId:string,targetId:string,side:'right'|'left'|'top'|'bottom'){
 if(p.architectureLocked)throw new Error('Архитектура зафиксирована');const moving=p.rooms.find(r=>r.id===movingId)!,target=p.rooms.find(r=>r.id===targetId)!;if(!moving||!target||moving===target)throw new Error('Выберите две разные комнаты');
 const a=bounds(moving.points),b=bounds(target.points),t=p.profiles.find(m=>m.id===p.interiorProfileId)!.width;
 const dx=side==='right'?b.maxX+t-a.minX:side==='left'?b.minX-t-a.maxX:b.minX-a.minX;
 const dz=side==='bottom'?b.maxZ+t-a.minZ:side==='top'?b.minZ-t-a.maxZ:b.minZ-a.minZ;
 moving.points.forEach(v=>{v.x+=dx;v.z+=dz;});const errors=validateArchitecture(p);if(errors.length)throw new Error(errors[0]);
}
export function moveSharedWall(p:ProjectDocument,wallId:string,delta:number){
 if(p.architectureLocked)throw new Error('Архитектура зафиксирована');const w=deriveWalls(p).find(w=>w.id===wallId);if(!w)throw new Error('Стена не найдена');
 const dx=(w.b.x-w.a.x)/w.length,dz=(w.b.z-w.a.z)/w.length;const nx=dz,nz=-dx;
 for(const o of w.owners){const r=p.rooms.find(r=>r.id===o.roomId)!;const a=r.points[o.edge],b=r.points[(o.edge+1)%r.points.length];const len=distance(a,b);
  const ex=(b.x-a.x)/len,ez=(b.z-a.z)/len;
  const at=(s:number,shift=0):Point=>({id:uid(),x:a.x+ex*s+nx*shift,z:a.z+ez*s+nz*shift});
  const extra:Point[]=[];
  if(o.start>EPS)extra.push(at(o.start),at(o.start,delta));
  if(o.end<len-EPS)extra.push(at(o.end,delta),at(o.end));
  if(o.start<=EPS){a.x+=nx*delta;a.z+=nz*delta;}
  if(o.end>=len-EPS){b.x+=nx*delta;b.z+=nz*delta;}
  if(extra.length)r.points.splice(o.edge+1,0,...extra);
 }const errors=validateArchitecture(p);if(errors.length)throw new Error(errors[0]);
 const newWalls=deriveWalls(p);
 for(const opening of p.openings.filter(o=>o.wallId===wallId)){
  const pos={x:w.a.x+dx*opening.offset+nx*delta,z:w.a.z+dz*opening.offset+nz*delta};
  const host=newWalls.find(n=>n.roomIds.length===w.roomIds.length&&n.roomIds.every(id=>w.roomIds.includes(id))&&Math.abs(cross(n.a,n.b,pos))<EPS*n.length&&distance(n.a,pos)+distance(pos,n.b)<=n.length+EPS);
  if(host){opening.wallId=host.id;opening.offset=distance(host.a,pos);}
 }
}
export function openingErrors(p:ProjectDocument):string[]{const walls=deriveWalls(p);const result:string[]=[];for(const o of p.openings){const w=walls.find(w=>w.id===o.wallId);if(!w){result.push('Проём потерял стену: '+o.id);continue;}if(o.offset-o.width/2<0||o.offset+o.width/2>w.length||o.sill+o.height>p.height)result.push('Проём выходит за стену');for(const other of p.openings){if(other.id<=o.id||other.wallId!==o.wallId)continue;if(Math.abs(o.offset-other.offset)<(o.width+other.width)/2&&o.sill<other.sill+other.height&&other.sill<o.sill+o.height)result.push('Пересекаются проёмы');}}return [...new Set(result)];}
export function wallPolygon(w:Wall,from=0,to=w.length,cap=0):Point[]{const dx=(w.b.x-w.a.x)/w.length,dz=(w.b.z-w.a.z)/w.length;return [[from-cap,-w.thickness/2],[to+cap,-w.thickness/2],[to+cap,w.thickness/2],[from-cap,w.thickness/2]].map(([s,n])=>({x:w.a.x+dx*s-dz*n,z:w.a.z+dz*s+dx*n}));}
export function bendWall(p:ProjectDocument,roomId:string,edge:number,x:number,z:number){if(p.architectureLocked)throw new Error('Архитектура зафиксирована');const r=p.rooms.find(r=>r.id===roomId)!;r.points.splice(edge+1,0,{id:uid(),x,z});const errors=validateArchitecture(p);if(errors.length)throw new Error(errors[0]);}

/** Preserve clear room dimensions while propagating a thickness change through joined rooms. */
export function changeWallProfile(p:ProjectDocument,kind:'interior'|'exterior',profileId:string){
 if(p.architectureLocked)throw new Error('Архитектура зафиксирована');
 const profile=p.profiles.find(m=>m.id===profileId);if(!profile)throw new Error('Материал не найден');
 if(kind==='exterior'&&profile.kind!=='aac')throw new Error('Для наружных стен выберите газобетон');
 const shared=deriveWalls(p).filter(w=>w.roomIds.length===2);
 if(kind==='interior'){
  const shifts=new Map<string,Point>();
  for(const room of p.rooms){if(shifts.has(room.id))continue;shifts.set(room.id,{x:0,z:0});const queue=[room.id];
   while(queue.length){const id=queue.shift()!,s=shifts.get(id)!;
    for(const wall of shared.filter(w=>w.roomIds.includes(id))){const forward=wall.roomIds[0]===id,other=wall.roomIds[forward?1:0];const sign=forward?1:-1,d=profile.width-wall.thickness;
     const target={x:s.x+sign*(wall.b.z-wall.a.z)/wall.length*d,z:s.z-sign*(wall.b.x-wall.a.x)/wall.length*d};const old=shifts.get(other);
     if(old&&distance(old,target)>EPS)throw new Error('Замкнутая цепочка комнат не позволяет изменить толщину без изменения размеров. Отсоедините одну комнату.');
     if(!old){shifts.set(other,target);queue.push(other);}
    }
   }
  }
  for(const r of p.rooms){const shift=shifts.get(r.id)!;for(const v of r.points){v.x+=shift.x;v.z+=shift.z;}}
  p.interiorProfileId=profileId;
 }else p.exteriorProfileId=profileId;
 const errors=validateArchitecture(p);if(errors.length)throw new Error(errors[0]);
}
