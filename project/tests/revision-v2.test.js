import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';import {buildArchitecture} from '../src/architecture.js';import {footprint,polygonsOverlap,pointInPolygon} from '../src/geometry.js';
const data=JSON.parse(readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){}})})};
function arch(){const d=structuredClone(data);d.materials.finishes=[];return buildArchitecture(d);}
test('combined bathroom has one entrance and no obsolete separating wall or duplicate toilet',()=>{
 assert.equal(data.rooms.filter(r=>['wc','bathroom'].includes(r.type)).length,1);
 assert.ok(!data.walls.some(w=>w.id==='wc-bath'));
 assert.ok(!data.doors.some(d=>d.id==='wc-door'));
 assert.equal(data.fixedFurniture.filter(f=>f.category==='toilet').length,1);
 assert.equal(data.rooms.find(r=>r.id==='bathroom').officialArea,null);
});
test('bathroom left/front/right layout follows the entrance direction',()=>{
 const f=id=>data.fixedFurniture.find(f=>f.id===id),door=data.doors.find(d=>d.id==='bath-door'),wall=data.walls.find(w=>w.id===door.wall),entryX=wall.a[0]+door.position;
 assert.ok(f('bath').position[0]>entryX+.4,'tub must be left (+X) when entering toward +Z');
 assert.ok(f('washer').position[2]>10.7,'washer ahead');assert.ok(f('vanity').position[2]>10.7,'sink ahead');
 assert.ok(f('bath-toilet').position[0]<entryX-.4,'toilet to right (-X)');assert.ok(f('towel-rail'));
});
test('kitchen has one plain window wall, oven adjacent to south run and empty central aisle',()=>{
 assert.equal(data.windows.filter(w=>w.connects.includes('kitchen')).length,1);
 assert.ok(!data.walls.some(w=>['bay-upper','bay-front','bay-lower'].includes(w.id)));
 const oven=data.fixedFurniture.find(f=>f.id==='kitchen-oven'),run=data.fixedFurniture.find(f=>f.id==='kitchen-run');
 assert.ok(Math.abs(oven.position[2]-run.position[2])<.05);assert.ok(Math.abs(oven.position[0]+oven.width/2-(run.position[0]-run.width/2))<.05);
 const aisle=[[-1.45,8.7],[.2,8.7],[.2,10.4],[-1.45,10.4]];
 for(const f of [...data.fixedFurniture,...data.movableFurniture].filter(f=>f.position[1]<1.6&&f.position[1]+f.height>.1))assert.ok(!polygonsOverlap(aisle,footprint(f)),f.id+' blocks kitchen aisle');
 assert.ok(data.fixedFurniture.some(f=>f.id==='kitchen-sink'));assert.ok(data.fixedFurniture.some(f=>f.id==='kitchen-hob'));
});
test('door leaves are hidden but all door openings remain real mesh voids',()=>{
 const a=arch();a.group.updateMatrixWorld(true);
 for(const d of data.doors){const frame=a.openings.children.find(g=>g.userData.opening===d.id);assert.ok(frame);assert.equal(frame.children.filter(c=>c.isGroup&&c.visible).length,0,d.id+' has a visible door leaf');
  const w=data.walls.find(w=>w.id===d.wall),length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),dx=(w.b[0]-w.a[0])/length,dz=(w.b[1]-w.a[1])/length;
  const c=new THREE.Vector3(w.a[0]+dx*d.position,1,w.a[1]+dz*d.position),n=new THREE.Vector3(-dz,0,dx);
  assert.equal(new THREE.Raycaster(c.clone().addScaledVector(n,.4),n.clone().negate(),0,.8).intersectObject(a.walls,true).length,0,d.id);
 }
});
test('entrance corridor keeps confirmed structural walls and has no door leaf obstruction',()=>{for(const id of ['middle','entry','hall-east'])assert.ok(data.walls.some(w=>w.id===id));const hall=data.rooms.find(r=>r.id==='hall');for(const p of [[4.97,8.6],[4.97,7.2],[4.97,5]])assert.ok(pointInPolygon(p,hall.polygon));});
