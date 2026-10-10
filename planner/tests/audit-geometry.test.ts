import {describe,it,expect} from 'vitest';
import {Raycaster,Vector3} from 'three';
import {createProject,validateProject} from '../src/domain/project';
import {rectangle,area,distance,deriveWalls,changeWallProfile,moveSharedWall,validateArchitecture,overlapArea,wallPolygon,reconcileOpenings} from '../src/domain/geometry';
import {History} from '../src/domain/history';
import {buildArchitecture,disposeGroup} from '../src/render/model';

describe('independent geometry audit',()=>{
 it.each([false,true])('validates concave floors, perimeter and winding without filling the notch (reversed=%s)',reversed=>{
  const p=createProject();const points=[[0,0],[4,0],[4,2],[2,2],[2,5],[0,5]].map(([x,z],i)=>({x,z,id:'v'+i}));if(reversed)points.reverse();p.rooms=[{id:'l',name:'L',color:'#dfebe4',points}];
  validateProject(p);expect(area(points)).toBe(14);expect(points.reduce((sum,a,i)=>sum+distance(a,points[(i+1)%points.length]),0)).toBe(18);
  const group=buildArchitecture(p);group.updateMatrixWorld(true);
  try{const hit=(x:number,z:number)=>new Raycaster(new Vector3(x,.1,z),new Vector3(0,-1,0),0,.2).intersectObject(group,true).length;expect(hit(1,4)).toBeGreaterThan(0);expect(hit(3,4)).toBe(0);}finally{disposeGroup(group);}
 });
 it('roundtrips geometry and openings through commands, undo/redo and JSON',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,10),rectangle('b','B',3,2,4.12,2),rectangle('c','C',3,2,4.12,6)];
  const wall=deriveWalls(p).find(w=>w.owners[0].roomId==='a'&&w.owners[0].edge===1&&w.owners[0].start===4)!;
  p.openings=[{id:'d',wallId:wall.id,kind:'door',offset:1,width:.8,height:2,sill:0}];const h=new History(p);
  h.apply('Remove neighbour',next=>{next.rooms=next.rooms.filter(r=>r.id!=='b');reconcileOpenings(p,next);});
  const after=JSON.stringify([h.current.rooms,h.current.openings]);h.undo();expect(h.current.rooms).toEqual(p.rooms);expect(h.current.openings).toEqual(p.openings);h.redo();
  const restored=validateProject(JSON.parse(JSON.stringify(h.current)));expect(JSON.stringify([restored.rooms,restored.openings])).toBe(after);
 });
 it('preserves clear rooms when a clockwise contour changes partition thickness',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5),rectangle('b','B',3,5,4.12,0)];
  p.rooms.forEach(r=>r.points.reverse());validateProject(p);
  changeWallProfile(p,'interior','aac-inner');
  expect(deriveWalls(p).filter(w=>w.roomIds.length===2)).toHaveLength(1);
  expect(Math.min(...p.rooms[1].points.map(v=>v.x))).toBeCloseTo(4.1,8);
  expect(area(p.rooms[0].points)).toBeCloseTo(20,9);expect(area(p.rooms[1].points)).toBeCloseTo(15,9);
 });
 it('moves clockwise shared walls outward from their first owner',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5),rectangle('b','B',3,5,4.12,0)];p.rooms.forEach(r=>r.points.reverse());
  moveSharedWall(p,deriveWalls(p).find(w=>w.roomIds.length===2)!.id,.5);
  expect(area(p.rooms[0].points)).toBeCloseTo(22.5);expect(area(p.rooms[1].points)).toBeCloseTo(12.5);
 });
 it('does not accept a partition protruding two millimetres into its owner room',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5),rectangle('b','B',3,5,4.118,0)];
  expect(validateArchitecture(p).length).toBeGreaterThan(0);
 });
 it('cuts real openings near corners through the final union of wall solids',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5)];const w=deriveWalls(p)[0];
  p.openings=[{id:'door',wallId:w.id,kind:'door',offset:.5,width:.9,height:2,sill:0}];
  const group=buildArchitecture(p);group.updateMatrixWorld(true);
  try{for(const x of [.1,.2,.5,.9]){
   expect(new Raycaster(new Vector3(x,1,-.5),new Vector3(0,0,1),0,.7).intersectObject(group,true),`door blocked at x=${x}`).toHaveLength(0);
  }}finally{disposeGroup(group);}
 });
 it.each([false,true])('keeps dimensions and shared-wall ownership after repeated wall shifts (reversed=%s)',reversed=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5),rectangle('b','B',3,5,4.12,0)];if(reversed)p.rooms.forEach(r=>r.points.reverse());
  for(let i=0;i<50;i++){const id=deriveWalls(p).find(w=>w.roomIds.length===2)!.id;moveSharedWall(p,id,.01);moveSharedWall(p,id,-.01);}
  expect(area(p.rooms[0].points)).toBeCloseTo(20,9);expect(area(p.rooms[1].points)).toBeCloseTo(15,9);
  const walls=deriveWalls(p);expect(new Set(walls.map(w=>w.id)).size).toBe(7);
  for(const w of walls)for(const room of p.rooms)expect(overlapArea(wallPolygon(w),room.points)).toBeLessThan(1e-8);
 });
});
