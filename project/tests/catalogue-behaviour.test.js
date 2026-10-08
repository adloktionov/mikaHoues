import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeCatalogue,filterCatalogue,setDimension} from '../src/catalogue.js';
test('catalogue upgrade and old import add missing personal definitions without overwriting custom edits',()=>{
 const saved=[{id:'a',width:1.7,notes:'edited'}],source=[{id:'a',width:1},{id:'new',collection:'my'}];
 const out=mergeCatalogue(saved,source);assert.deepEqual(out,[saved[0],source[1]]);out[0].width=3;assert.equal(saved[0].width,1.7);assert.equal(mergeCatalogue(out,source).length,2);
});
test('search, group and collection filters compose and tolerate Russian letter case',()=>{
 const ds=[{name:'Матрас 180 × 200',category:'sleep',collection:'my'},{name:'Пианино',category:'music',collection:'my'},{name:'Матрас старый',category:'bed'}];
 assert.equal(filterCatalogue(ds,' МАТРАС ').length,1);assert.equal(filterCatalogue(ds,'','music')[0].name,'Пианино');assert.equal(filterCatalogue(ds,'','','all').length,3);assert.equal(filterCatalogue(ds,'','','legacy').length,1);
});
test('editing one dimension does not incorrectly confirm other estimated axes',()=>{
 const item={width:.7,depth:.8,height:.9,collection:'my',dimensionConfidence:{width:'estimated',depth:'estimated',height:'estimated'}};
 setDimension(item,'width',.75);assert.equal(item.dimensionsConfidence,'estimated');assert.equal(item.dimensionConfidence.width,'user-provided');
 setDimension(item,'depth',.85);setDimension(item,'height',.94);assert.equal(item.dimensionsConfidence,'user-provided');
});
