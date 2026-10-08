import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';import {Viewer} from '../src/viewer.js';
const data=JSON.parse(readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
function walker(position,yaw=0){const v=Object.create(Viewer.prototype);Object.assign(v,{data,mode:'walk',keys:new Set(['KeyW']),walkYaw:yaw,camera:new THREE.PerspectiveCamera(),renderer:{render(){}},scene:{},labelElements:[]});v.camera.position.fromArray(position);return v;}
function frame(v){v.lastTime=performance.now()-50;v.tick();}
test('walk advances in metric scene with floor height preserved',()=>{const v=walker([5.1,1.6,8.45]);frame(v);assert.ok(v.camera.position.z<8.4);assert.equal(v.camera.position.x,5.1);assert.equal(v.camera.position.y,1.6);});
test('walk cannot cross a solid bedroom partition',()=>{const v=walker([4.1,1.6,1.6],-Math.PI/2);for(let i=0;i<25;i++)frame(v);assert.ok(v.camera.position.x<4.34);assert.ok(v.camera.position.x>=4.1);});
