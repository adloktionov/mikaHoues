import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {wallBands,extrude,solidMaterial} from '../src/architecture.js';import {wallFootprint,wallLength,pointInPolygon} from '../src/geometry.js';import {Viewer} from '../src/viewer.js';
const data=JSON.parse(readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
const old=JSON.parse(readFileSync(new URL('../versions/architecture-v2/architecture-data.json',import.meta.url)));
test('marked corridor spur ends exactly flush with study wall, while every other wall and opening stays unchanged',()=>{
 const w=data.walls.find(w=>w.id==='middle'),study=data.walls.find(w=>w.id==='study-east');
 assert.ok(Math.abs(Math.max(...wallFootprint(w,0,wallLength(w),w.thickness,w.thickness/2).map(p=>p[0]))-(study.a[0]+study.thickness/2))<1e-8);
 for(const other of data.walls.filter(w=>w.id!=='middle'))assert.deepEqual(other,old.walls.find(w=>w.id===other.id));
 assert.deepEqual(data.doors,old.doors);assert.deepEqual(data.windows,old.windows);
 assert.deepEqual(data.fixedFurniture,old.fixedFurniture);
});
test('actual rendered wall mesh and Walk collision leave former spur clear',()=>{
 const group=new THREE.Group();for(const band of wallBands(data))group.add(extrude(band.polygons,band.height,band.y,solidMaterial('#fff')));group.updateMatrixWorld(true);
 const viewer=Object.create(Viewer.prototype);viewer.data=data;
 for(const x of [3.65,3.8,4,4.2]){
  const ray=new THREE.Raycaster(new THREE.Vector3(x,1.6,7.05),new THREE.Vector3(0,0,1),0,.75);
  assert.equal(ray.intersectObject(group,true).length,0,'wall at x='+x);
  for(const z of [7.2,7.41614,7.65]){assert.equal(viewer.canWalk(x,z),true,`Walk blocked ${x},${z}`);assert.ok(pointInPolygon([x,z],data.rooms.find(r=>r.id==='hall').polygon));}
 }
});
