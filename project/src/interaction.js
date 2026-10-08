import {MOUSE} from 'three';
import {snap,roomFor} from './geometry.js';
export function dragAllowed(mode,tool){return mode!=='walk'&&tool==='move';}
export function dragPosition(point,offset,step){const bound=v=>Math.max(-100,Math.min(100,Number.isFinite(v)?snap(v,step):0));return [bound(point[0]+offset[0]),0,bound(point[1]+offset[1])];}

export function placementPosition(center,rooms){const r=rooms.find(r=>r.id==='living');const position=[center.x,0,center.z];return roomFor({position},rooms)?position:[r.interiorPoint[0],0,r.interiorPoint[1]];}

export function isEditingPointer(event){return event.button===0&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey;}
export function cameraMouseButtons(mode,event={}){const modified=event.shiftKey||event.ctrlKey||event.metaKey;return {LEFT:mode==='3d'||modified?MOUSE.ROTATE:MOUSE.PAN,MIDDLE:modified?MOUSE.ROTATE:MOUSE.PAN,RIGHT:modified?MOUSE.ROTATE:MOUSE.PAN};}

export function canStartFurnitureDrag(mode,tool,event,hitId,selectedId){return dragAllowed(mode,tool)&&isEditingPointer(event)&&!!hitId&&hitId===selectedId;}

export function migrateLayoutObjects(objects,migrations){let changed=0;for(const {id,from,to} of migrations){const item=objects.find(o=>o.id===id);if(!item||!['rotation','width','depth','height'].every(key=>item[key]===from[key])||!item.position.every((v,i)=>v===from.position[i]))continue;item.position=[...to.position];item.rotation=to.rotation;changed++;}return changed;}
