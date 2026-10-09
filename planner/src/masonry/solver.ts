import clipping from 'polygon-clipping';
import type {MasonryProfile,ProjectDocument,MasonryResult,Point,Wall,StockUse} from '../domain/types';
import {deriveWalls,wallPolygon,ring,area,openingErrors,validateArchitecture} from '../domain/geometry';
import {minimumBond,profileIssues} from './rules';
type Poly=clipping.MultiPolygon;
interface Segment {start:number;length:number;stockId:string;cut:boolean}
const EPS=1e-6;
/** Candidate layouts use whole stock at both ends; only the central one or two pieces are trimmed. */
export function layoutSpan(from:number,to:number,m:MasonryProfile,previousJoints:number[]):Segment[]|null{
 const length=to-from,j=m.verticalJoint,min=m.length/2,stock=m.stock.filter(s=>s.enabled),base=stock.find(s=>Math.abs(s.length-m.length)<EPS);if(!base||length<min-EPS)return null;
 const valid=(pieces:Segment[])=>pieces.slice(0,-1).every(p=>previousJoints.every(q=>Math.abs(p.start+p.length+j/2-q)>=minimumBond(m)-EPS));
 const emit=(lengths:{length:number;stockId:string;cut:boolean}[])=>{let start=from;return lengths.map(p=>{const item={...p,start};start+=p.length+j;return item;});};
 for(const s of stock)if(Math.abs(s.length-length)<EPS){const p=emit([{length:s.length,stockId:s.id,cut:false}]);if(valid(p))return p;}
 const corners=[base,...stock.filter(s=>s.id!==base.id)];
 for(const left of corners)for(const right of corners){
  for(let full=Math.floor(length/m.length);full>=0;full--){
   const nl=Math.ceil(full/2),nr=Math.floor(full/2);if((left!==base&&!nl)||(right!==base&&!nr))continue;
   const l=Array.from({length:nl},(_,i)=>({length:i===0?left.length:base.length,stockId:i===0?left.id:base.id,cut:false}));
   const r=Array.from({length:nr},(_,i)=>({length:i===nr-1?right.length:base.length,stockId:i===nr-1?right.id:base.id,cut:false}));
   const filled=[...l,...r].reduce((s,p)=>s+p.length,0);
   if(Math.abs(filled+Math.max(0,full-1)*j-length)<EPS){const p=emit([...l,...r]);if(valid(p))return p;}
   for(const count of [1,2]){const residual=length-filled-(full+count-1)*j;if(residual<count*min-EPS||residual>count*base.length+EPS)continue;
    const candidates=count===1?[residual]:[residual/2,...Array.from({length:41},(_,i)=>min+(base.length-min)*i/40)];
    for(const a of candidates){const lengths=count===1?[a]:[a,residual-a];if(lengths.some(n=>n<min-EPS||n>base.length+EPS||(n<base.length-EPS&&n>base.length-m.kerf+EPS)))continue;
     const center=lengths.map(length=>({length,stockId:base.id,cut:Math.abs(length-base.length)>EPS}));const pieces=emit([...l,...center,...r]);if(valid(pieces))return pieces;
    }
   }
  }
 }return null;
}
// Boolean clipping can leave zero-width spikes at coincident wall corners.
// Snap only numerical noise (10 nanometres), then remove collapsed and collinear vertices.
function clean(poly:Poly):Poly{return poly.map(rings=>rings.map(points=>{
 const p=points.map(([x,z])=>[Math.round(x*1e8)/1e8,Math.round(z*1e8)/1e8] as [number,number]);
 if(p.length>1&&Math.hypot(p[0][0]-p.at(-1)![0],p[0][1]-p.at(-1)![1])<EPS)p.pop();
 let changed=true;while(changed&&p.length>=3){changed=false;for(let i=0;i<p.length;i++){const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];const cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
  if(Math.hypot(a[0]-b[0],a[1]-b[1])<EPS||Math.abs(cross)<1e-10){p.splice(i,1);changed=true;break;}
 }}return p;
 }).filter(r=>r.length>=3&&area(r.map(([x,z])=>({x,z})))>EPS*EPS)).filter(r=>r.length>0);}
const polygon=(p:Point[]):Poly=>[[ring(p)]];
const subtract=(a:Poly,b:Poly):Poly=>a.length&&b.length?clean(clipping.difference(a,b)):a;
const union=(a:Poly,b:Poly):Poly=>a.length?clean(clipping.union(a,b)):b;
/** Reserve mortar along previously assigned faces before allocating the next wall. */
function clearance(shape:Poly,width:number):Poly{
 if(width<=0)return shape;let expanded=shape;
 for(const rings of shape)for(const points of rings)for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<EPS)continue;
  const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;
  const border=[[-width,-width],[length+width,-width],[length+width,width],[-width,width]].map(([s,n])=>({x:a[0]+dx*s-dz*n,z:a[1]+dz*s+dx*n}));
  expanded=union(expanded,polygon(border));
 }return expanded;
}
function envelope(w:Wall,rooms:ProjectDocument['rooms']):Poly{let shape=polygon(wallPolygon(w,0,w.length,w.thickness));for(const r of rooms)shape=subtract(shape,polygon(r.points));return shape;}
function extent(w:Wall,p:Point[]){const dx=(w.b.x-w.a.x)/w.length,dz=(w.b.z-w.a.z)/w.length;const positions=p.map(v=>(v.x-w.a.x)*dx+(v.z-w.a.z)*dz);return {from:Math.min(...positions),to:Math.max(...positions)};}
/** Physical corner regions have exactly one owner, alternating at each row within a material group. */
export function solveMasonry(p:ProjectDocument):MasonryResult{
 const start=performance.now(),result:MasonryResult={pieces:[],stock:[],issues:[],complete:false,revision:p.revision,elapsedMs:0};
 const issue=(wallId:string,message:string,rule:string,row?:number)=>result.issues.push({wallId,message,rule,row});
 const invalid=[...validateArchitecture(p),...openingErrors(p)];if(invalid.length){invalid.forEach(s=>issue('',s,'geometry'));return result;}
 const walls=deriveWalls(p),envelopes=new Map(walls.map(w=>[w.id,envelope(w,p.rooms)]));let exterior:Poly=[];
 for(const w of walls.filter(w=>w.roomIds.length===1))exterior=union(exterior,envelopes.get(w.id)!);
 const previous=new Map<string,number[]>();
 for(const profileId of [...new Set(walls.map(w=>w.profileId))]){
  const m=p.profiles.find(m=>m.id===profileId)!;profileIssues(m).forEach(s=>issue('',s,'profile'));
  const exteriorWithJoint=clearance(exterior,m.verticalJoint);
  const group=walls.filter(w=>w.profileId===profileId);const count=Math.ceil(p.height/(m.height+m.horizontalJoint));
  if(count*group.length>20000){issue('','Слишком много рядов. Уменьшите план или увеличьте размер элемента.','limit');continue;}
  for(let row=0;row<count;row++){
   const y=row*(m.height+m.horizontalJoint),height=Math.min(m.height,p.height-y);if(height<EPS)continue;
   const ordered=[...group].sort((a,b)=>{const horizontal=(w:Wall)=>Math.abs(w.b.x-w.a.x)>Math.abs(w.b.z-w.a.z);return Number(horizontal(row%2?b:a))-Number(horizontal(row%2?a:b))||a.id.localeCompare(b.id);});
   let owned:Poly=[];
   for(const w of ordered){let shape=envelopes.get(w.id)!;if(w.roomIds.length===2&&profileId!==p.exteriorProfileId)shape=subtract(shape,exteriorWithJoint);shape=subtract(shape,owned);owned=union(owned,clearance(shape,m.verticalJoint));
    const openings=p.openings.filter(o=>o.wallId===w.id);const breaks=[y,y+height,...openings.flatMap(o=>[o.sill,o.sill+o.height]).filter(v=>v>y+EPS&&v<y+height-EPS)].sort((a,b)=>a-b);const joints:number[]=[];
    for(let bi=0;bi<breaks.length-1;bi++){const bottom=breaks[bi],top=breaks[bi+1];let band=shape;
     for(const o of openings)if(bottom<o.sill+o.height-EPS&&top>o.sill+EPS)band=subtract(band,polygon(wallPolygon(w,o.offset-o.width/2,o.offset+o.width/2)));
     for(const poly of band){if(poly.length!==1){issue(w.id,'Сложный контур участка кладки требует проверки.','shape',row);continue;}const points=poly[0].map(([x,z])=>({x,z})),range=extent(w,points);const pieces=layoutSpan(range.from,range.to,m,previous.get(w.id)||[]);
      if(!pieces){issue(w.id,'Не удалось совместить перевязку, размер участка и центральные обрезки ≥ половины. Проверьте размеры или наличие удлинённого изделия.','bond/cut',row);continue;}
      for(const [i,part] of pieces.entries()){
       const clipped=clean(clipping.intersection([poly],polygon(wallPolygon(w,part.start,part.start+part.length))));
       if(clipped.length!==1||clipped[0].length!==1){issue(w.id,'Деталь распалась на несколько частей.','shape',row);continue;}
       const footprint=clipped[0][0].map(([x,z])=>({x,z}));if(area(footprint)<EPS)continue;
       const physical=extent(w,footprint);if(physical.to-physical.from<m.length/2-EPS||Math.abs(physical.from-part.start)>EPS||Math.abs(physical.to-part.start-part.length)>EPS){issue(w.id,'Фактическая длина детали после обработки угла не соответствует раскладке.','physical-cut',row);continue;}
       const id=`${w.id}:${row}:${bi}:${result.pieces.length}`,sku=m.stock.find(s=>s.id===part.stockId)!;
       // Reuse only full-height horizontal leftovers; vertically sliced scraps are not treated as reusable stock.
       let stock:StockUse|undefined;
       if(part.cut)stock=result.stock.find(s=>s.profileId===profileId&&s.remaining>=part.length+m.kerf-EPS);
       if(!stock){stock={id:result.stock.length,profileId,stockId:sku.id,length:sku.length,used:0,kerf:0,remaining:sku.length,pieceIds:[]};result.stock.push(stock);}
       const cut=stock.remaining>part.length+EPS;const kerf=cut?m.kerf:0;
       stock.used+=part.length;stock.kerf+=kerf;stock.remaining=Math.max(0,stock.remaining-part.length-kerf);stock.pieceIds.push(id);
       result.pieces.push({id,wallId:w.id,row,start:part.start,length:part.length,y:bottom,height:top-bottom,profileId,stockId:stock.stockId,stockIndex:stock.id,cut:cut||top-bottom<m.height-EPS||Math.abs(area(footprint)-part.length*w.thickness)>EPS,footprint});
       if(i<pieces.length-1)joints.push(part.start+part.length+m.verticalJoint/2);
      }
     }
    }previous.set(w.id,[...new Set(joints)]);
   }
  }
 }
 result.complete=result.issues.length===0;result.elapsedMs=performance.now()-start;return result;
}
