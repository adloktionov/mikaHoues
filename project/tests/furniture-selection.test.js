import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {Viewer} from '../src/viewer.js';
test('selection shows a rotated footprint and collision color, and hides with object',()=>{
 const viewer=Object.create(Viewer.prototype);viewer.scene=new THREE.Scene();
 viewer.data={rooms:[{polygon:[[0,0],[5,0],[5,5],[0,5]]}],walls:[],doors:[],fixedFurniture:[]};
 const item={id:'a',width:1.8,depth:2,height:.2,position:[2,0,2],rotation:30,visible:true};viewer.objects=[item];viewer.select('a');
 let p=viewer.selection.getObjectByName('selected-footprint');assert.ok(p);assert.equal(p.geometry.parameters.width,1.8);assert.equal(p.geometry.parameters.height,2);
 assert.ok(Math.abs(viewer.selection.rotation.y-Math.PI/6)<1e-8);
 viewer.objects.push({...item,id:'b'});viewer.select('a');p=viewer.selection.getObjectByName('selected-footprint');assert.equal(p.material.color.getHexString(),'bd503e');
 item.visible=false;viewer.select('a');assert.equal(viewer.selection,null);
});
