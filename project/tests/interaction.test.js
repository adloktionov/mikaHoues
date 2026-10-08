import test from 'node:test';import assert from 'node:assert/strict';import {dragAllowed,dragPosition} from '../src/interaction.js';
test('rotate and measure clicks in furniture mode are not consumed by drag',()=>{assert.equal(dragAllowed('furniture','rotate'),false);assert.equal(dragAllowed('furniture','measure'),false);assert.equal(dragAllowed('furniture','move'),true);assert.equal(dragAllowed('3d','select'),false);});
test('drag remains serializable even beyond visible scene or near horizon',()=>{assert.deepEqual(dragPosition([105.18,-120],[0,0],.1),[100,0,-100]);assert.deepEqual(dragPosition([1.26,2.16],[0,0],.1),[1.3,0,2.2]);});

import {readFileSync} from 'node:fs';
import {placementPosition} from '../src/interaction.js';
import {collisionMessages} from '../src/geometry.js';
test('adding outside rooms uses an interior fallback independent of polygon winding',()=>{
 const data=JSON.parse(readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
 for(let i=0;i<4;i++){
  const r=data.rooms.find(r=>r.id==='living');r.polygon.push(r.polygon.shift());
  const position=placementPosition({x:100,z:100},data.rooms);
  assert.deepEqual(collisionMessages({id:'new',width:.6,depth:.6,height:1,rotation:0,position},[],data),[]);
 }
});

import * as interaction from '../src/interaction.js';
test('Move starts only on the selected item with an unmodified primary pointer',()=>{
 assert.equal(typeof interaction.canStartFurnitureDrag,'function');
 assert.equal(interaction.canStartFurnitureDrag('top','move',{button:0},'sofa','sofa'),true);
 assert.equal(interaction.canStartFurnitureDrag('top','move',{button:0},'bed','sofa'),false);
 assert.equal(interaction.canStartFurnitureDrag('top','move',{button:0},null,null),false);
 assert.equal(interaction.canStartFurnitureDrag('3d','move',{button:0,shiftKey:true},'sofa','sofa'),false);
 assert.equal(interaction.canStartFurnitureDrag('furniture','select',{button:0},'sofa','sofa'),false);
});

test('migration moves only untouched legacy furniture and preserves custom edits',()=>{
 assert.equal(typeof interaction.migrateLayoutObjects,'function');
 const original={id:'fridge',position:[1,0,2],rotation:90,width:.6,depth:.65,height:1.8,visible:false,notes:'my note',model:'models/custom.glb'};
 const migration={id:'fridge',from:{position:[1,0,2],rotation:90,width:.6,depth:.65,height:1.8},to:{position:[3,0,4],rotation:180}};
 const objects=[structuredClone(original),{...structuredClone(original),id:'unrelated'}];
 assert.equal(interaction.migrateLayoutObjects(objects,[migration]),1);
 assert.deepEqual(objects[0],{...original,position:[3,0,4],rotation:180});
 assert.deepEqual(objects[1],{...original,id:'unrelated'});
 assert.equal(interaction.migrateLayoutObjects(objects,[migration]),0);
 for(const field of ['position','rotation','width','depth','height']){const edited=structuredClone(original);edited[field]=field==='position'?[1.1,0,2]:edited[field]+.1;const before=structuredClone(edited);assert.equal(interaction.migrateLayoutObjects([edited],[migration]),0);assert.deepEqual(edited,before);}
});
