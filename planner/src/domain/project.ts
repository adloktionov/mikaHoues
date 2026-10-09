import {validateArchitecture} from './geometry';
import type { ProjectDocument, LayoutVariant, Material } from './types';
export const uid=()=>crypto.randomUUID();
export const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
export const material=(color='#b7a18a'):Material=>({color,roughness:.75,metalness:0,opacity:1});
export function createProject():ProjectDocument {
 const now=new Date().toISOString(), variant=uid();
 return {schemaVersion:1,catalogAssetIds:[],id:uid(),name:'Новый проект',revision:0,height:2.7,rooms:[],openings:[],architectureLocked:false,
 profiles:[{id:'aac',name:'Газобетон наружный',kind:'aac',length:.625,width:.3,height:.25,horizontalJoint:.002,verticalJoint:.002,kerf:.003,stock:[{id:'aac-base',name:'Обычный блок',length:.625,enabled:true},{id:'aac-long',name:'Удлинённый 1,5 — подтвердите наличие',length:.9375,enabled:false}]},
 {id:'brick',name:'Кирпич перегородочный',kind:'brick',length:.25,width:.12,height:.065,horizontalJoint:.012,verticalJoint:.01,kerf:.003,stock:[{id:'brick-base',name:'Обычный кирпич',length:.25,enabled:true},{id:'brick-long',name:'Удлинённый 1,5 — подтвердите наличие',length:.375,enabled:false}]},
 {id:'aac-inner',name:'Газобетон перегородочный',kind:'aac',length:.625,width:.1,height:.25,horizontalJoint:.002,verticalJoint:.002,kerf:.003,stock:[{id:'aac-inner-base',name:'Перегородочный блок',length:.625,enabled:true},{id:'aac-inner-long',name:'Удлинённый 1,5 — подтвердите наличие',length:.9375,enabled:false}]}],
 exteriorProfileId:'aac',interiorProfileId:'brick',variants:[{id:variant,name:'Вариант 1',furniture:[]}],activeVariantId:variant,
 lighting:{sun:2.5,fill:1.5,azimuth:135,altitude:45,lights:[]},createdAt:now,updatedAt:now};
}
function assert(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(message);}
function finite(n:unknown,min:number,max:number){return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;}
export function validateProject(value:unknown):ProjectDocument {
 const p=value as ProjectDocument;
 assert(p&&p.schemaVersion===1,'Неподдерживаемая версия проекта');
 assert(p.catalogAssetIds===undefined||(Array.isArray(p.catalogAssetIds)&&p.catalogAssetIds.length<=10000&&p.catalogAssetIds.every(id=>typeof id==='string'&&id.length>0)&&new Set(p.catalogAssetIds).size===p.catalogAssetIds.length),'Некорректный каталог проекта');
 assert(typeof p.id==='string'&&p.id.length>0&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=200,'Некорректное имя проекта');
 assert(finite(p.height,.1,20)&&finite(p.revision,0,Number.MAX_SAFE_INTEGER),'Некорректная высота или версия');
 assert(Array.isArray(p.rooms)&&p.rooms.length<=500&&Array.isArray(p.openings)&&p.openings.length<=5000,'Некорректные помещения');
 const ids=new Set<string>(); const unique=(id:string)=>{assert(typeof id==='string'&&id.length>0&&!ids.has(id),'Повторяющийся ID');ids.add(id);};
 for(const r of p.rooms){unique(r.id);assert(typeof r.name==='string'&&Array.isArray(r.points)&&r.points.length>=3&&r.points.length<=500,'Некорректный контур');const vertices=new Set<string>();for(const [i,v] of r.points.entries()){assert(finite(v.x,-1000,1000)&&finite(v.z,-1000,1000),'Некорректные координаты');const id=v.id??`${r.id}-v${i}`;assert(typeof id==='string'&&id.length>0&&!vertices.has(id),'Повторяющийся ID вершины');vertices.add(id);}}
 assert(Array.isArray(p.profiles)&&p.profiles.length>0&&p.profiles.length<=50,'Не заданы материалы кладки');
 for(const m of p.profiles){unique(m.id);assert(['aac','brick'].includes(m.kind)&&typeof m.name==='string','Некорректный материал');for(const n of [m.length,m.width,m.height])assert(finite(n,.01,3),'Некорректные размеры блока');for(const n of [m.horizontalJoint,m.verticalJoint,m.kerf])assert(finite(n,0,.05),'Некорректный шов или рез');assert(Array.isArray(m.stock)&&m.stock.length>0&&m.stock.length<100,'Нет типоразмеров');for(const s of m.stock){assert(typeof s.id==='string'&&finite(s.length,.01,5)&&typeof s.enabled==='boolean','Некорректный типоразмер');}}
 assert(p.profiles.some(m=>m.id===p.exteriorProfileId)&&p.profiles.some(m=>m.id===p.interiorProfileId),'Не найден материал стены');
 assert(p.profiles.find(m=>m.id===p.exteriorProfileId)!.kind==='aac'&&p.profiles.find(m=>m.id===p.interiorProfileId)!.width<p.profiles.find(m=>m.id===p.exteriorProfileId)!.width,'Наружные стены — газобетон; перегородки должны быть тоньше наружных стен');
 for(const o of p.openings){unique(o.id);assert(typeof o.wallId==='string'&&['door','window'].includes(o.kind)&&finite(o.offset,0,3000)&&finite(o.width,.05,30)&&finite(o.height,.05,20)&&finite(o.sill,0,20),'Некорректный проём');}
 assert(Array.isArray(p.variants)&&p.variants.length>0&&p.variants.length<=100&&p.variants.some(v=>v.id===p.activeVariantId),'Не найден вариант');
 const checkMaterial=(m:Material)=>{assert(m&&/^#[0-9a-f]{6}$/i.test(m.color)&&[m.roughness,m.metalness,m.opacity].every(n=>finite(n,0,1)),'Некорректный материал поверхности');};
 for(const v of p.variants){unique(v.id);assert(typeof v.name==='string'&&Array.isArray(v.furniture)&&v.furniture.length<=10000,'Некорректный вариант');const furnitureIds=new Set<string>();for(const f of v.furniture){assert(typeof f.id==='string'&&!furnitureIds.has(f.id),'Повтор предмета');furnitureIds.add(f.id);assert(['wardrobe','shelf','cabinet','table','sofa','bed','asset'].includes(f.kind)&&typeof f.name==='string','Некорректная мебель');for(const n of [f.width,f.depth,f.height])assert(finite(n,.02,30),'Некорректные габариты мебели');for(const n of [f.x,f.z,f.y,f.rotation])assert(finite(n,-10000,10000),'Некорректное положение мебели');assert(Number.isInteger(f.shelves)&&finite(f.shelves,0,30)&&Number.isInteger(f.sections)&&finite(f.sections,1,20)&&finite(f.board,.005,.1),'Некорректная конструкция');assert(f.kind==='asset'||(f.width>f.board*(f.sections+1)&&f.height>f.board*(f.shelves+2)),'Детали не помещаются в габариты');assert(!['wardrobe','shelf','cabinet'].includes(f.kind)||f.depth>f.board,'Глубина должна быть больше толщины задней стенки');assert(f.kind!=='table'||(f.width>=.1&&f.depth>=.1),'Столешница слишком мала для ножек');checkMaterial(f.material);assert(f.partMaterials&&Array.isArray(f.shelfPositions)&&f.shelfPositions.every(n=>finite(n,0,30)),'Некорректные детали');Object.values(f.partMaterials).forEach(checkMaterial);if(f.shelfPositions.length){assert(f.shelfPositions.length===f.shelves,'Число высот полок не совпадает с числом полок');const ys=[...f.shelfPositions].sort((a,b)=>a-b);assert(ys.every((y,i)=>y>=f.board*1.5&&y<=f.height-f.board*1.5&&(i===0||y-ys[i-1]>=f.board)),'Полки пересекаются или выходят за габариты');}assert(f.useSourceMaterials===undefined||typeof f.useSourceMaterials==='boolean','Некорректный режим материала');if(f.kind==='asset')assert(typeof f.assetId==='string','Не задана модель');}}
 assert(typeof p.architectureLocked==='boolean'&&p.lighting&&Array.isArray(p.lighting.lights),'Некорректные настройки');
 assert(finite(p.lighting.sun,0,20)&&finite(p.lighting.fill,0,10)&&finite(p.lighting.azimuth,0,360)&&finite(p.lighting.altitude,1,90),'Некорректный свет');
 assert(p.lighting.lights.length<=16,'Допускается до 16 источников света');for(const l of p.lighting.lights){unique(l.id);assert(['point','spot'].includes(l.type)&&[l.x,l.y,l.z,l.targetX,l.targetY,l.targetZ].every(n=>finite(n,-1000,1000))&&finite(l.intensity,0,10000)&&finite(l.angle,.01,1.57)&&/^#[0-9a-f]{6}$/i.test(l.color),'Некорректный светильник');}
 const geometryErrors=validateArchitecture(p);assert(!geometryErrors.length,geometryErrors[0]||'Некорректная геометрия');
 return clone(p);
}
export function duplicateVariant(p:ProjectDocument):LayoutVariant {const source=p.variants.find(v=>v.id===p.activeVariantId)!;const copy=clone(source);copy.id=uid();copy.name=source.name+' — копия';p.variants.push(copy);p.activeVariantId=copy.id;return copy;}
