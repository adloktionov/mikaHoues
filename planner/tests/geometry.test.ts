import { describe,it,expect } from 'vitest';
import {createProject} from '../src/domain/project';
import {rectangle,area,deriveWalls,attachRoom,moveSharedWall,validatePolygon,openingErrors} from '../src/domain/geometry';
describe('clear room geometry',()=>{
 it('keeps a 4×5 interior at 20 square metres',()=>{expect(area(rectangle('a','Кухня',4,5).points)).toBe(20);});
 it('attaches rooms across one 120mm partition without losing their clear widths',()=>{
  const p=createProject(); p.rooms=[rectangle('a','Кухня',4,5),rectangle('b','Спальня',3,5,8,0)];
  attachRoom(p,'b','a','right'); const walls=deriveWalls(p);
  expect(area(p.rooms[0].points)).toBeCloseTo(20); expect(area(p.rooms[1].points)).toBeCloseTo(15);
  expect(p.rooms[1].points[0].x).toBeCloseTo(4.12);
  const shared=walls.filter(w=>w.roomIds.length===2); expect(shared).toHaveLength(1);expect(shared[0].thickness).toBeCloseTo(.12);
  expect(walls).toHaveLength(7);
  moveSharedWall(p,shared[0].id,.5); expect(area(p.rooms[0].points)).toBeCloseTo(22.5);expect(area(p.rooms[1].points)).toBeCloseTo(12.5);
 });
 it('splits partial adjacency into exterior and interior wall segments',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5),rectangle('b','B',3,2,4.12,1)];
  const shared=deriveWalls(p).filter(w=>w.roomIds.length===2);expect(shared).toHaveLength(1);expect(shared[0].length).toBeCloseTo(2);
 });
 it('moves a partial shared wall while retaining the rest of the perimeter',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5),rectangle('b','B',3,2,4.12,1)];
  const w=deriveWalls(p).find(w=>w.roomIds.length===2)!;
  p.openings=[{id:'door',wallId:w.id,kind:'door',offset:1,width:.8,height:2,sill:0}];
  moveSharedWall(p,w.id,.5);expect(area(p.rooms[0].points)).toBeCloseTo(21);expect(area(p.rooms[1].points)).toBeCloseTo(5);
  expect(openingErrors(p)).toEqual([]);expect(p.rooms[0].points[0].x).toBe(0);
 });
 it('rejects acute angles and bow-tie/self intersection',()=>{
  expect(validatePolygon([{x:0,z:0},{x:4,z:0},{x:1,z:1}]).length).toBeGreaterThan(0);
  expect(validatePolygon([{x:0,z:0},{x:4,z:4},{x:0,z:4},{x:4,z:0}]).length).toBeGreaterThan(0);
  expect(validatePolygon(rectangle('x','x',4,5).points)).toEqual([]);
 });
 it('reports openings beyond their host without silently truncating them',()=>{
  const p=createProject();p.rooms=[rectangle('a','A',4,5)];const w=deriveWalls(p)[0];
  p.openings=[{id:'d',wallId:w.id,kind:'door',offset:3.8,width:1,height:2.1,sill:0}];
  expect(openingErrors(p).length).toBeGreaterThan(0);
 });
});
