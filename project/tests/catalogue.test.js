import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as layout from '../src/layout.js';
const source=JSON.parse(readFileSync(new URL('../data/furniture.json',import.meta.url)));
test('personal inventory contains 25 definitions, 26 owned objects and unmodified stated dimensions',()=>{
 const own=source.filter(d=>d.collection==='my');
 assert.equal(own.length,25);assert.equal(own.reduce((n,d)=>n+d.quantityOwned,0),26);
 const expected={'my-mattress':[1.8,2,.2],'my-desk':[1.4,.7,.75],'my-robot':[.4,.5,.5],'my-bench':[.6,.3,.6],'my-cooler':[.3,.3,1.4]};
 for(const [id,dims] of Object.entries(expected)){const d=own.find(d=>d.id===id);assert.deepEqual([d.width,d.depth,d.height],dims);}
 for(const d of own){assert.ok(d.modelType);assert.ok(['estimated','user-provided'].includes(d.dimensionsConfidence));assert.equal(typeof d.notes,'string');}
 assert.equal(own.find(d=>d.id==='my-robot').dimensionsConfidence,'estimated');
 assert.equal(own.find(d=>d.id==='my-cooler').bodyHeight,1);
 assert.equal(own.find(d=>d.id==='my-desk').extraHeight,.5);
});
test('new metadata survives export, resized duplicate and reload',()=>{
 const d=source.find(d=>d.id==='my-desk');assert.ok(d);
 const a=layout.createItem(d,[1,.2,3]);a.width=1.55;a.rotation=75;
 const b=layout.duplicateItem(a);b.position[0]=4;
 const state=layout.validateLayout(JSON.parse(layout.serializeLayout([a,b],[d])));
 assert.deepEqual(state.objects,[a,b]);assert.equal(state.objects[0].modelType,'desk_workstation');
});
test('render-affecting personal metadata rejects unsafe imports',()=>{
 const base={id:'d',name:'d',width:1,depth:1,height:1};
 for(const extra of [{modelType:{}},{extraHeight:-2},{extraHeight:Infinity},{bodyHeight:'x'},{quantityOwned:-1},{dimensionsConfidence:'certain'},{dimensionConfidence:{width:{}}}]){
  assert.throws(()=>layout.validateLayout({version:1,objects:[],catalogue:[{...base,...extra}]}),JSON.stringify(extra));
 }
});
