import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createFurniture} from '../src/furniture.js';
import {collisionMessages} from '../src/geometry.js';
import {validateLayout} from '../src/layout.js';
const data=JSON.parse(readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
const catalogue=JSON.parse(readFileSync(new URL('../data/furniture.json',import.meta.url)));
test('bed mattress uses user confirmed 140 by 200 cm, while exterior frame remains estimated',()=>{
 const item=structuredClone(data.movableFurniture.find(o=>o.id==='existing-bed'));
 assert.equal(item.mattress?.width,1.4);assert.equal(item.mattress?.depth,2);assert.equal(item.dimensionStatus,'Estimated');
 item.position=[0,0,0];item.rotation=0;
 const root=createFurniture(item);root.updateMatrixWorld(true);
 const mattress=root.getObjectByName('mattress');assert.ok(mattress);
 const size=new THREE.Box3().setFromObject(mattress).getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x-1.4)<1e-6);assert.ok(Math.abs(size.z-2)<1e-6);
 const outer=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());assert.ok(Math.abs(outer.x-item.width)<1e-6);assert.ok(Math.abs(outer.z-item.depth)<1e-6);
});
test('every initial movable object fits without wall or furniture volume collisions',()=>{
 const all=[...data.movableFurniture,...data.fixedFurniture.map(o=>({...o,visible:true}))];
 for(const item of data.movableFurniture)assert.deepEqual(collisionMessages(item,all,data),[],item.id);
});
test('import rejects invalid or oversize mattress before changing layout',()=>{
 const layout={version:1,objects:structuredClone(data.movableFurniture),catalogue};
 layout.objects[0].mattress={width:10,depth:2,height:.18};assert.throws(()=>validateLayout(layout));
 layout.objects[0].mattress={width:1.4,depth:2,height:'invalid'};assert.throws(()=>validateLayout(layout));
});
