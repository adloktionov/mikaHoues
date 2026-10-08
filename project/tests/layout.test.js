import test from 'node:test';import assert from 'node:assert/strict';
import { validateLayout, serializeLayout, createItem, duplicateItem } from '../src/layout.js';
const definition={id:'piano',name:'Пианино',category:'piano',width:1.36,depth:.4,height:.78,model:null,notes:''};
test('export roundtrip keeps real dimensions, position, angle, room and visibility',()=>{const item={...createItem(definition,[2,0,3]),rotation:15,room:'study',visible:false};const raw=serializeLayout([item],[definition]);const result=validateLayout(JSON.parse(raw));assert.deepEqual(result.objects[0],item);assert.equal(result.catalogue[0].width,1.36);});
test('duplicate is independent and has a fresh identity',()=>{const a=createItem(definition,[2,0,3]);const b=duplicateItem(a);assert.notEqual(a.id,b.id);b.position[0]=8;assert.equal(a.position[0],2);});
test('invalid dimensions or non-finite coordinate fail before replacing layout',()=>{const raw=JSON.parse(serializeLayout([createItem(definition,[0,0,0])],[definition]));raw.objects[0].width=-1;assert.throws(()=>validateLayout(raw));raw.objects[0].width=1;raw.objects[0].position[1]=Infinity;assert.throws(()=>validateLayout(raw));});
test('unknown versions, duplicate ids and missing custom definitions are rejected',()=>{assert.throws(()=>validateLayout({version:99,objects:[],catalogue:[]}));const a=createItem(definition,[0,0,0]);assert.throws(()=>validateLayout({version:1,objects:[a,a],catalogue:[definition]}));assert.throws(()=>validateLayout({version:1,objects:[a],catalogue:[]}));});
test('import rejects render-breaking optional objects and enormous rotations',()=>{for(const [key,value] of [['category',{toString:null}],['notes',{}],['color',{}],['dimensionStatus',{}]]){const raw=JSON.parse(serializeLayout([createItem(definition,[0,0,0])],[definition]));raw.catalogue[0][key]=value;assert.throws(()=>validateLayout(raw),key);}const raw=JSON.parse(serializeLayout([createItem(definition,[0,0,0])],[definition]));raw.objects[0].rotation=1e308;assert.throws(()=>validateLayout(raw));});

import * as layout from '../src/layout.js';
test('duplicate near coordinate limits remains exportable without changing original',()=>{
 const original=createItem(definition,[100,100,99.9]),before=structuredClone(original),copy=duplicateItem(original);
 assert.deepEqual(copy.position,[100,100,100]);assert.deepEqual(original,before);
 assert.doesNotThrow(()=>serializeLayout([original,copy],[definition]));
});
test('adding at the layout or catalogue cap rejects before mutating either array',()=>{
 assert.equal(typeof layout.layoutWithAddedItem,'function');
 const objects=Array.from({length:500},()=>createItem(definition,[0,0,0])),catalogue=[definition],before=serializeLayout(objects,catalogue);
 assert.throws(()=>layout.layoutWithAddedItem(objects,catalogue,createItem(definition,[1,0,1])),/500/);
 assert.equal(serializeLayout(objects,catalogue),before);
 const definitions=Array.from({length:500},(_,i)=>({...definition,id:'definition-'+i})),custom={...definition,id:'custom'};
 assert.throws(()=>layout.layoutWithAddedItem([],definitions,createItem(custom,[0,0,0]),custom),/500/);
 assert.equal(definitions.length,500);
});
test('adding validates the entire proposed item before committing a custom definition',()=>{
 assert.equal(typeof layout.layoutWithAddedItem,'function');
 const objects=[],catalogue=[definition],custom={...definition,id:'custom'};
 assert.throws(()=>layout.layoutWithAddedItem(objects,catalogue,createItem(custom,[101,0,0]),custom));
 assert.deepEqual(objects,[]);assert.deepEqual(catalogue,[definition]);
 const item=createItem(custom,[1,0,2]),next=layout.layoutWithAddedItem(objects,catalogue,item,custom);
 assert.deepEqual(next.objects,[item]);assert.deepEqual(next.catalogue,[definition,custom]);
 assert.deepEqual(objects,[]);assert.deepEqual(catalogue,[definition]);
});
