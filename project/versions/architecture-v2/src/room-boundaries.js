import clipping from 'polygon-clipping';
import {area,pointInPolygon,wallFootprint,wallLength} from './geometry.js';

// Close door thresholds for area accounting. Use precisely the same capped
// wall footprints as the rendered solid, rather than a second independent trace.
function interiorPoint(polygon){
  const z=(Math.min(...polygon.map(p=>p[1]))+Math.max(...polygon.map(p=>p[1])))/2;
  const crossings=[];
  polygon.forEach((a,i)=>{const b=polygon[(i+1)%polygon.length];if((a[1]>z)!==(b[1]>z))crossings.push(a[0]+(z-a[1])*(b[0]-a[0])/(b[1]-a[1]));});
  crossings.sort((a,b)=>a-b);
  let best=0;for(let i=2;i<crossings.length;i+=2)if(crossings[i+1]-crossings[i]>crossings[best+1]-crossings[best])best=i;
  return [(crossings[best]+crossings[best+1])/2,z];
}
export function reconcileRooms(data){
  const holes=clipping.union(...data.walls.map(w=>[wallFootprint(w,0,wallLength(w),w.thickness,w.thickness/2)])).flatMap(p=>p.slice(1));
  if(holes.length!==data.rooms.length)throw new Error('Room topology differs from the enclosed wall regions');
  const used=new Set();
  const updates=data.rooms.map(room=>{
    const seed=room.interiorPoint||room.polygon.reduce((s,p)=>[s[0]+p[0]/room.polygon.length,s[1]+p[1]/room.polygon.length],[0,0]);
    const overlaps=holes.map(h=>clipping.intersection([room.polygon],[h]).reduce((sum,p)=>sum+area(p[0])-p.slice(1).reduce((s,h)=>s+area(h),0),0));
    const index=overlaps.indexOf(Math.max(...overlaps));
    if(overlaps[index]<=0||used.has(index))throw new Error('Cannot uniquely identify room '+room.id);
    used.add(index);
    const polygon=holes[index].slice(0,-1).map(p=>[...p]);
    const calculatedArea=area(polygon);
    return {interiorPoint:pointInPolygon(seed,polygon)?seed:interiorPoint(polygon),polygon,calculatedArea,errorPercent:room.officialArea?(calculatedArea/room.officialArea-1)*100:null,areaBasis:'Inner wall faces; door thresholds closed'};
  });
  data.rooms.forEach((r,i)=>Object.assign(r,updates[i]));
  return data;
}
