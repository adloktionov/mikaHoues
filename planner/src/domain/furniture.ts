import type {FurnitureInstance,FurnitureKind,Material,ProjectDocument} from './types';
import {material,uid} from './project';import {deriveWalls,wallPolygon,overlapArea,area} from './geometry';
export const furnitureNames:Record<FurnitureKind,string>={wardrobe:'Шкаф',shelf:'Стеллаж',cabinet:'Тумба',table:'Стол',sofa:'Диван',bed:'Кровать',asset:'Модель'};
export function createFurniture(kind:FurnitureKind):FurnitureInstance{
 const dimensions:Record<FurnitureKind,[number,number,number]>={wardrobe:[1.6,.6,2.2],shelf:[.9,.35,1.8],cabinet:[1,.45,.75],table:[1.4,.8,.75],sofa:[2,.9,.85],bed:[1.4,2,.5],asset:[1,1,1]};const [width,depth,height]=dimensions[kind];
 return {id:uid(),name:furnitureNames[kind],kind,x:2,z:2,y:0,rotation:0,width,depth,height,shelves:kind==='table'||kind==='bed'||kind==='sofa'||kind==='asset'?0:kind==='cabinet'?1:3,sections:kind==='wardrobe'?2:1,board:.018,material:material(),partMaterials:{},shelfPositions:[],visible:true};
}
export interface FurniturePart {id:string;name:string;x:number;y:number;z:number;width:number;height:number;depth:number;material:Material}
export function shelfHeights(f:FurnitureInstance){return f.shelfPositions.length?f.shelfPositions:Array.from({length:f.shelves},(_,i)=>f.board+(f.height-2*f.board)*(i+1)/(f.shelves+1));}
export function furnitureParts(f:FurnitureInstance):FurniturePart[]{
 const parts:FurniturePart[]=[],w=f.width,h=f.height,d=f.depth,t=f.board;
 const add=(id:string,name:string,x:number,y:number,z:number,width:number,height:number,depth:number)=>parts.push({id,name,x,y,z,width,height,depth,material:f.partMaterials[id]||f.material});
 if(f.kind==='table'){add('top','Столешница',0,h-t/2,0,w,t,d);for(const x of [-1,1])for(const z of [-1,1])add(`leg-${x}-${z}`,'Ножка',x*(w/2-.05),(h-t)/2,z*(d/2-.05),.06,h-t,.06);}
 else if(f.kind==='bed'){add('base','Основание',0,h*.3,0,w,h*.6,d);add('mattress','Матрас',0,h*.8,0,w,h*.4,d);}
 else if(f.kind==='sofa'){add('seat','Сиденье',0,h*.3,0,w,h*.6,d);add('back','Спинка',0,h*.8,-d*.4,w,h*.4,d*.2);for(const sign of [-1,1])add('arm-'+sign,'Подлокотник',sign*w*.45,h*.7,0,w*.1,h*.2,d);}
 else if(f.kind==='asset'){add('proxy','Габариты модели',0,h/2,0,w,h,d);}
 else{
  add('side-left','Левая боковина',-w/2+t/2,h/2,0,t,h,d);add('side-right','Правая боковина',w/2-t/2,h/2,0,t,h,d);
  add('bottom','Дно',0,t/2,0,w-2*t,t,d);add('top','Верх',0,h-t/2,0,w-2*t,t,d);add('back','Задняя стенка',0,h/2,-d/2+t/2,w-2*t,h-2*t,t);
  const inner=(w-t*(f.sections+1))/f.sections;
  for(let i=1;i<f.sections;i++)add('partition-'+i,'Перегородка '+i,-w/2+t+i*inner+(i-.5)*t,h/2,t/2,t,h-2*t,d-t);
  for(let section=0;section<f.sections;section++)for(const [i,y] of shelfHeights(f).entries())add(`shelf-${section}-${i}`,`Полка ${i+1}, секция ${section+1}`,-w/2+t+inner/2+section*(inner+t),y,t/2,inner,t,d-t);
 }
 return parts;
}
export function furnitureFootprint(f:FurnitureInstance){const angle=f.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>({x:f.x+x*f.width/2*c-z*f.depth/2*s,z:f.z+x*f.width/2*s+z*f.depth/2*c}));}
export function placementWarnings(p:ProjectDocument,f:FurnitureInstance){const shape=furnitureFootprint(f),warnings:string[]=[];if(deriveWalls(p).some(w=>overlapArea(shape,wallPolygon(w))>1e-5))warnings.push('Предмет пересекает стену');if(!p.rooms.some(r=>Math.abs(overlapArea(shape,r.points)-area(shape))<1e-5))warnings.push('Предмет не полностью внутри помещения');for(const other of p.variants.find(v=>v.id===p.activeVariantId)!.furniture)if(other.id!==f.id&&other.visible&&f.y<other.y+other.height&&other.y<f.y+f.height&&overlapArea(shape,furnitureFootprint(other))>1e-5){warnings.push('Пересечение с предметом «'+other.name+'»');}return warnings;}
