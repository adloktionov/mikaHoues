import test from 'node:test';import assert from 'node:assert/strict';
import * as variants from '../src/variants.js';
const d={id:'chair',name:'Chair',width:.5,depth:.5,height:1};
const obj={...d,id:'o',catalogueId:'chair',position:[1,0,1],rotation:0,visible:true};
const layout={version:1,objects:[obj],catalogue:[d]};
const parameters={ceilingHeight:2.7,doorHeight:2.1,windowHeight:1.45,sillHeight:.85,wallThicknessFactor:1};
const original={id:'original',name:'Исходная квартира',architectureVersion:'Architecture v2',createdAt:'2026-10-01T00:00:00.000Z',layout,parameters};
function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};}
const make=(storage=memory(),extra={})=>new variants.VariantStore({storage,original,legacyLayout:layout,legacyParameters:parameters,...extra});
test('migration creates editable current layout and preserves original source and legacy keys',()=>{
 const storage=memory();storage.setItem('old','leave me');const custom=structuredClone(layout);custom.objects[0].position[0]=7;
 const s=make(storage,{legacyLayout:custom});assert.equal(s.active().name,'Текущий вариант');assert.equal(s.active().layout.objects[0].position[0],7);s.switchTo('original');assert.equal(s.active().layout.objects[0].position[0],1);assert.equal(storage.getItem('old'),'leave me');
});
test('original refuses write/delete/reset/replace, and returned objects cannot mutate it',()=>{
 const s=make();s.switchTo('original');const a=s.active();a.layout.objects[0].width=5;assert.equal(s.active().layout.objects[0].width,.5);
 assert.throws(()=>s.saveActive(layout,parameters));assert.throws(()=>s.deleteActive());assert.throws(()=>s.resetActive());assert.throws(()=>s.importJSON(JSON.stringify(layout),true));
});
test('two copies persist independently through switching and reloading including dimensions and parameters',()=>{
 const storage=memory(),s=make(storage);const current=s.active().id;s.switchTo('original');s.create('Пианино у окна');const id=s.active().id;
 const change=s.active().layout;change.objects[0].width=.8;change.objects[0].position=[2,.2,3];change.objects[0].rotation=45;change.objects[0].visible=false;
 s.saveActive(change,{...parameters,wallThicknessFactor:1.2});s.switchTo(current);assert.equal(s.active().layout.objects[0].width,.5);s.switchTo(id);
 const reloaded=make(storage);assert.equal(reloaded.active().id,id);assert.deepEqual(reloaded.active().layout,change);assert.equal(reloaded.active().parameters.wallThicknessFactor,1.2);
});
test('create from original uses defaults not edited current parameters, and return remembers editable variant',()=>{
 const s=make();const id=s.active().id;s.saveActive(layout,{...parameters,ceilingHeight:3});s.switchTo('original');assert.equal(s.returnId,id);s.create('From original');assert.equal(s.active().parameters.ceilingHeight,2.7);assert.notEqual(s.active().id,id);
});
test('reset and delete affect only active variant and cannot remove last editable variant',()=>{
 const s=make();const first=s.active().id;s.create('Second');const second=s.active().id;const l=s.active().layout;l.objects=[];s.saveActive(l,parameters);s.resetActive();assert.deepEqual(s.active().layout,layout);s.deleteActive();assert.equal(s.active().id,first);assert.equal(s.list().some(v=>v.id===second),false);assert.throws(()=>s.deleteActive());
});
test('variant export/import creates independent id and all-layout backups append without replacing',()=>{
 const s=make();s.create('Extra');const id=s.active().id,json=s.exportActive();s.importJSON(json);assert.notEqual(s.active().id,id);assert.deepEqual(s.active().layout,layout);
 const all=s.exportAll();const before=s.list().length;s.importJSON(all);assert.equal(s.list().length,1+(before-1)*2);assert.equal(s.list().filter(v=>v.id==='original').length,1);
});
test('replace import retains target id and independent other variants; invalid architecture or layout reject transactionally',()=>{
 const s=make();const first=s.active().id;s.create('Second');const id=s.active().id,raw=JSON.parse(s.exportActive());raw.variant.layout.objects=[];
 s.importJSON(JSON.stringify(raw),true);assert.equal(s.active().id,id);assert.equal(s.active().layout.objects.length,0);s.switchTo(first);assert.equal(s.active().layout.objects.length,1);
 const before=s.exportAll();raw.variant.architectureVersion='Architecture v999';assert.throws(()=>s.importJSON(JSON.stringify(raw)));assert.equal(s.exportAll(),before);
 assert.throws(()=>s.importJSON('{'));assert.equal(s.exportAll(),before);
});
test('quota failure retains edits in memory for export, marks dirty and blocks switching',()=>{
 const storage=memory(),s=make(storage),edited=structuredClone(layout);edited.objects[0].width=1.2;
 storage.setItem=()=>{throw new Error('quota');};assert.throws(()=>s.saveActive(edited,parameters));assert.equal(s.dirty,true);assert.equal(JSON.parse(s.exportActive()).variant.layout.objects[0].width,1.2);assert.throws(()=>s.switchTo('original'));assert.notEqual(s.active().id,'original');
});
test('corrupted storage is not overwritten by migration or saving',()=>{
 const storage=memory();storage.setItem(variants.VARIANTS_KEY,'broken data');const s=make(storage);assert.ok(s.error);assert.throws(()=>s.saveActive(layout,parameters));assert.equal(storage.getItem(variants.VARIANTS_KEY),'broken data');
});
test('stale second tab cannot overwrite committed changes from first tab',()=>{
 const storage=memory(),a=make(storage),b=make(storage);a.create('First tab');assert.throws(()=>b.create('Second tab'),/другой вкладке/);assert.equal(make(storage).list().some(v=>v.name==='First tab'),true);
});
test('malformed timestamps, duplicated ids, invalid parameters and original ids in editable store reject',()=>{
 const s=make();const data=JSON.parse(s.exportAll());
 for(const mutate of [x=>x.variants[0].id='original',x=>x.variants[0].createdAt='bad',x=>x.variants[0].parameters.ceilingHeight=-1,x=>x.variants.push(x.variants[0])]){
  const bad=structuredClone(data);mutate(bad);assert.throws(()=>s.importJSON(JSON.stringify(bad)));
 }
});
