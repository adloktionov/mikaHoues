import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { footprint, pointInPolygon, collisionMessages } from '../src/geometry.js';
import { findFurniturePlacement, furnitureCollisionMessages } from '../src/placement.js';

const room = (id, x = 0, z = 0, width = 6, depth = 6) => ({ id, polygon: [[x,z],[x+width,z],[x+width,z+depth],[x,z+depth]], interiorPoint: [x+width/2,z+depth/2] });
const dataFor = (...rooms) => ({ rooms, walls: [], doors: [], fixedFurniture: [] });
const furniture = (changes = {}) => ({ id: 'new-item', category: 'table', width: 1, depth: 1, height: .75, rotation: 0, position: [3,0,3], visible: true, ...changes });

test('keeps a free requested center and ignores hidden furniture', () => {
  const result = findFurniturePlacement(furniture(), {x:3,z:3}, [furniture({ id:'hidden', visible:false })], dataFor(room('main')));
  assert.deepEqual(result, {position:[3,0,3],fallback:false});
});

test('moves away from occupied center but stays in the current room', () => {
  const data = dataFor(room('other', 7), room('current'));
  const obstacles = [furniture({id:'occupied'})];
  const result = findFurniturePlacement(furniture(), {x:3,z:3}, obstacles, data);
  assert.equal(result.fallback, false);
  assert.ok(result.position[0] < 6);
  assert.ok(Math.hypot(result.position[0]-3, result.position[2]-3) >= 1);
  assert.deepEqual(furnitureCollisionMessages(furniture(result), obstacles, data), []);
  assert.deepEqual(result, findFurniturePlacement(furniture(), {x:3,z:3}, obstacles, data));
});

test('uses another room when the current room has no free footprint', () => {
  const data = dataFor(room('small', 0, 0, 1, 1), room('large', 3));
  const result = findFurniturePlacement(furniture({width:2,depth:2}), {x:.5,z:.5}, [], data);
  assert.equal(result.fallback, false);
  assert.ok(result.position[0] >= 4 && result.position[0] <= 8);
});

test('preserves rotated and unusual dimensions instead of shrinking to fit', () => {
  const data = dataFor(room('narrow', 0, 0, 1, 4));
  assert.deepEqual(findFurniturePlacement(furniture({width:3.8,depth:.7,rotation:90}), {x:.5,z:2}, [], data), {position:[.5,0,2],fallback:false});
  assert.equal(findFurniturePlacement(furniture({width:3.8,depth:.7,rotation:0}), {x:.5,z:2}, [], data).fallback, true);
  assert.equal(findFurniturePlacement(furniture({width:50,depth:30}), {x:.5,z:2}, [], data).fallback, true);
});

test('rejects footprints crossing a concave notch even if every corner is inside', () => {
  const polygon = [[0,0],[4,0],[4,4],[3,4],[3,1],[1,1],[1,4],[0,4]];
  const data = dataFor({id:'concave', polygon, interiorPoint:[.5,2]});
  const item = furniture({width:3.8,depth:.8,position:[2,0,2]});
  assert.ok(footprint(item).every(p=>pointInPolygon(p,polygon)));
  const result = findFurniturePlacement(item, {x:2,z:2}, [], data);
  assert.equal(result.fallback, false);
  assert.ok(result.position[2] <= .6);
});

test('requires the entire footprint within one room rather than straddling adjacent rooms', () => {
  const data = dataFor(room('left',0,0,1,2), room('right',1,0,1,2));
  assert.equal(findFurniturePlacement(furniture({width:1.5,depth:1}), {x:1,z:1}, [], data).fallback, true);
});

test('uses predictable center or interior fallback when there is no space', () => {
  const data = dataFor(room('tiny',0,0,1,1));
  const item = furniture({width:3,depth:3});
  assert.deepEqual(findFurniturePlacement(item, {x:.4,z:.3}, [], data), {position:[.4,0,.3],fallback:true});
  assert.deepEqual(findFurniturePlacement(item, {x:20,z:20}, [], data), {position:[.5,0,.5],fallback:true});
});

test('fixed furniture blocks placement even without an explicit visible field', () => {
  const data = dataFor(room('main'));
  data.fixedFurniture = [furniture({id:'fixed',visible:undefined})];
  const result = findFurniturePlacement(furniture(), {x:3,z:3}, [], data);
  assert.notDeepEqual(result.position, [3,0,3]);
  assert.equal(result.fallback, false);
  assert.ok(furnitureCollisionMessages(furniture(), [], data).includes('Пересечение с мебелью'));
});

test('accounts for workstation monitor height in either collision direction', () => {
  const desk = furniture({category:'workstation',height:.75,extraHeight:.65});
  const shelf = furniture({id:'shelf',position:[3,1.1,3],height:.2});
  const data = dataFor(room('main'));
  assert.ok(furnitureCollisionMessages(desk,[shelf],data).includes('Пересечение с мебелью'));
  assert.ok(furnitureCollisionMessages(shelf,[desk],data).includes('Пересечение с мебелью'));
  assert.deepEqual(furnitureCollisionMessages({...desk,category:'table'},[shelf],data), []);
});

test('does not mutate dimensions, positions, obstacles or apartment arrays', () => {
  const data = dataFor(room('main'));
  const item = furniture({category:'workstation',height:.73,extraHeight:.57,width:1.987,depth:.823,rotation:37});
  const objects = [furniture({id:'obstacle'})];
  const original = structuredClone({data,item,objects});
  findFurniturePlacement(item,{x:3,z:3},objects,data);
  furnitureCollisionMessages(item,objects,data);
  assert.deepEqual({data,item,objects},original);
});

test('avoids actual apartment walls and fixed furniture for every catalogue type', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
  const catalogue = JSON.parse(fs.readFileSync(new URL('../data/furniture.json',import.meta.url)));
  for (const definition of catalogue) {
    const item = furniture({...definition,id:`test-${definition.id}`});
    const result = findFurniturePlacement(item,{x:3.5,z:6.8},[],data);
    assert.equal(result.fallback,false,definition.id);
    const placed = {...item,position:result.position};
    assert.deepEqual(collisionMessages(placed,data.fixedFurniture.map(o=>({...o,visible:true})),data),[],definition.id);
    assert.ok(data.rooms.some(r=>footprint(placed).every(p=>pointInPolygon(p,r.polygon))),definition.id);
  }
});
