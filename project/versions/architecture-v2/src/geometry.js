const EPS = 1e-7;
export function area(p) { return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2; }
export function pointInPolygon([x,z],p) {
  let inside=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++){
    const a=p[j],b=p[i];
    if(Math.abs((x-a[0])*(b[1]-a[1])-(z-a[1])*(b[0]-a[0]))<EPS && x>=Math.min(a[0],b[0])-EPS && x<=Math.max(a[0],b[0])+EPS && z>=Math.min(a[1],b[1])-EPS && z<=Math.max(a[1],b[1])+EPS)return true;
    if((a[1]>z)!==(b[1]>z) && x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside;
}
export function measure(a,b){const metres=Math.hypot(...a.map((v,i)=>b[i]-v));return {metres,centimetres:metres*100};}
export function snap(v,step){return step>0?Math.round(v/step)*step:v;}
export function footprint(o){const r=o.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [[-o.width/2,-o.depth/2],[o.width/2,-o.depth/2],[o.width/2,o.depth/2],[-o.width/2,o.depth/2]].map(([x,z])=>[o.position[0]+x*c+z*s,o.position[2]-x*s+z*c]);}
export function polygonsOverlap(a,b){for(const p of [a,b])for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length],v=p[i],axis=[q[1]-v[1],v[0]-q[0]];const aa=a.map(x=>x[0]*axis[0]+x[1]*axis[1]),bb=b.map(x=>x[0]*axis[0]+x[1]*axis[1]);if(Math.max(...aa)<=Math.min(...bb)+EPS||Math.max(...bb)<=Math.min(...aa)+EPS)return false;}return true;}
export function wallLength(w){return Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);}
export function wallFootprint(w,start=0,end=wallLength(w),thickness=w.thickness,cap=0){const len=wallLength(w),dx=(w.b[0]-w.a[0])/len,dz=(w.b[1]-w.a[1])/len,h=thickness/2;return [[start-cap,-h],[end+cap,-h],[end+cap,h],[start-cap,h]].map(([s,n])=>[w.a[0]+dx*s-dz*n,w.a[1]+dz*s+dx*n]);}
export function wallSolidAt(w,holes,p,height){const len=wallLength(w),dx=(w.b[0]-w.a[0])/len,dz=(w.b[1]-w.a[1])/len,along=(p[0]-w.a[0])*dx+(p[2]-w.a[1])*dz,normal=-(p[0]-w.a[0])*dz+(p[2]-w.a[1])*dx;if(p[1]<0||p[1]>height||along<0||along>len||Math.abs(normal)>w.thickness/2)return false;return !holes.some(h=>Math.abs(along-h.position)<h.width/2&&p[1]>=(h.sillHeight||0)&&p[1]<(h.sillHeight||0)+h.height);}
export function roomFor(item,rooms){return rooms.find(r=>pointInPolygon([item.position[0],item.position[2]],r.polygon))?.id??null;}
export function collisionMessages(item,objects,data){const p=footprint(item),warnings=[];if(!p.every(v=>data.rooms.some(r=>pointInPolygon(v,r.polygon))))warnings.push('Габариты выходят за границы помещения');for(const w of data.walls){if(!polygonsOverlap(p,wallFootprint(w)))continue;const holes=data.doors.filter(d=>d.wall===w.id);const fullHole=holes.some(d=>p.every(v=>pointInPolygon(v,wallFootprint(w,d.position-d.width/2,d.position+d.width/2,100)))&&item.position[1]+item.height<=d.height);if(!fullHole)warnings.push('Пересечение со стеной');}if(objects.some(o=>o.id!==item.id&&o.visible&&item.position[1]<o.position[1]+o.height&&o.position[1]<item.position[1]+item.height&&polygonsOverlap(p,footprint(o))))warnings.push('Пересечение с мебелью');return [...new Set(warnings)];}
export function snapToWall(item,walls,tolerance=.18){const p=footprint(item);let best=null;for(const w of walls){const len=wallLength(w),dx=(w.b[0]-w.a[0])/len,dz=(w.b[1]-w.a[1])/len,along=(item.position[0]-w.a[0])*dx+(item.position[2]-w.a[1])*dz;if(along<0||along>len)continue;const signed=-(item.position[0]-w.a[0])*dz+(item.position[2]-w.a[1])*dx;const extent=Math.max(...p.map(v=>Math.abs(-(v[0]-item.position[0])*dz+(v[1]-item.position[2])*dx)));const gap=Math.abs(signed)-extent-w.thickness/2;if(Math.abs(gap)<tolerance&&(!best||Math.abs(gap)<Math.abs(best.gap)))best={gap,nx:-dz,nz:dx,side:Math.sign(signed)||1};}if(best){item.position[0]-=best.nx*best.side*best.gap;item.position[2]-=best.nz*best.side*best.gap;}return item;}
