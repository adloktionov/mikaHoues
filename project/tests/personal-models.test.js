import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPersonalFurniture,supportsPersonalFurniture,visualHeight} from '../src/personal-furniture.js';

const models={beanbag:[.7,.9,.9],mattress:[1.8,2,.2],side_table:[.55,.55,.45],desk_workstation:[1.4,.7,.75],digital_piano:[1.4,.65,.9],electronic_drums:[.9,.7,1.3],desk_simple:[.9,.55,.75],robot_vacuum:[.4,.5,.5],studio_light:[.65,.65,1.5],turtle_aquarium:[.9,.4,.8],portable_ac:[.4,.4,.7],floor_lamp:[.2,.2,1.5],drying_rack:[.7,.4,.9],executive_chair:[.68,.7,1.18],ergonomic_chair:[.7,.7,1.22],saddle_chair:[.5,.5,.62],acoustic_guitar_stand:[.45,.35,1.08],acoustic_guitar:[.4,.12,1.02],piano_bench:[.6,.3,.6],shoe_cabinet:[.85,.3,.55],soil_box:[.4,.3,.4],water_cooler:[.3,.3,1.4]};
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-5,`${label}: ${a} != ${b}`);
const item=(modelType,scale=1)=>({id:'test-'+modelType,modelType,width:models[modelType][0]*scale,depth:models[modelType][1]*scale,height:models[modelType][2]*scale,position:[0,0,0],rotation:0,extraHeight:.5,bodyHeight:1,bottleHeight:.4,color:'#64788b'});
for(const modelType of Object.keys(models))test(`${modelType} has exact editable bounds, grounded and centered`,()=>{
  for(const scale of [1,1.27]){
    const data=item(modelType,scale),g=createPersonalFurniture(data),bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());
    assert.equal(supportsPersonalFurniture(data),true);assert.equal(g.userData.itemId,data.id);
    near(size.x,data.width,'width');near(size.z,data.depth,'depth');near(size.y,visualHeight(data),'height');near(bounds.min.y,0,'ground');near((bounds.min.x+bounds.max.x)/2,0,'center x');near((bounds.min.z+bounds.max.z)/2,0,'center z');
    let meshes=0,vertices=0;g.traverse(o=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;}});assert.ok(meshes>=3,`${modelType} recognizable composition`);assert.ok(vertices<70000,`${modelType} lightweight geometry`);
  }
});
test('placement and visibility survive rebuilding dimensions',()=>{const data={...item('executive_chair'),position:[3,.2,4],rotation:73,visible:false};for(const width of [.68,.93]){const g=createPersonalFurniture({...data,width});assert.deepEqual(g.position.toArray(),data.position);near(g.rotation.y,73*Math.PI/180,'rotation');assert.equal(g.visible,false);}});
test('workstation has accessories above the exact tabletop without expanding its footprint',()=>{const g=createPersonalFurniture(item('desk_workstation'));for(const name of ['monitor','laptop_closed','laptop_open','speaker_left','speaker_right'])assert.ok(g.getObjectByName(name),name);const top=new THREE.Box3().setFromObject(g.getObjectByName('tabletop'));near(top.max.y,.75,'tabletop height');const monitor=new THREE.Box3().setFromObject(g.getObjectByName('monitor'));assert.ok(monitor.min.y>=.75);});
test('cooler has a one metre body and additional nineteen litre bottle',()=>{const g=createPersonalFurniture(item('water_cooler'));const body=new THREE.Box3().setFromObject(g.getObjectByName('cooler_body'));near(body.max.y,1,'body height');const bottle=new THREE.Box3().setFromObject(g.getObjectByName('bottle19l'));near(bottle.min.y,1,'bottle base');near(bottle.max.y,1.4,'bottle top');});
test('first guitar includes a stand, second remains standalone',()=>{assert.ok(createPersonalFurniture(item('acoustic_guitar_stand')).getObjectByName('guitar_stand'));assert.equal(createPersonalFurniture(item('acoustic_guitar')).getObjectByName('guitar_stand'),undefined);});
test('existing catalogue objects are not claimed by personal renderer',()=>assert.equal(supportsPersonalFurniture({category:'table'}),false));
