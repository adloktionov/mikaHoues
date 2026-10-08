import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Viewer} from '../src/viewer.js';
import * as interaction from '../src/interaction.js';
const data=JSON.parse(readFileSync(new URL('../data/apartment-data.json',import.meta.url)));
function viewer(width=446,height=1000,mode='3d'){
 const v=Object.create(Viewer.prototype);
 Object.assign(v,{data,mode,container:{clientWidth:width,clientHeight:height},renderer:{setSize(){}},perspective:new THREE.PerspectiveCamera(43,1,.03,300),ortho:new THREE.OrthographicCamera(-10,10,10,-10,.01,300),architecture:{ceiling:{}},keys:new Set()});
 v.camera=mode==='top'?v.ortho:v.perspective;
 v.controls=new OrbitControls(v.camera);v.controls.enableDamping=true;v.controls.maxPolarAngle=Math.PI*.49;v.controls.maxDistance=200;
 return v;
}
function corners(){const points=data.rooms.flatMap(r=>r.polygon);const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);return [Math.min(...xs)-.2,Math.max(...xs)+.2].flatMap(x=>[0,data.apartment.parameters.ceilingHeight.value].flatMap(y=>[Math.min(...zs)-.2,Math.max(...zs)+.2].map(z=>new THREE.Vector3(x,y,z))));}
for(const mode of ['3d','top'])for(const [width,height] of [[446,1000],[1200,650]])test(`${mode} fits the whole apartment at ${width} × ${height}`,()=>{
 const v=viewer(width,height,mode);v.setMode(mode);v.camera.updateMatrixWorld();
 for(const c of corners()){const p=c.project(v.camera);assert.ok(Math.abs(p.x)<.94&&Math.abs(p.y)<.94,`clipped at ${p.x}, ${p.y}`);}
});
test('resize preserves a user-adjusted camera',()=>{const v=viewer();v.setMode('3d');v.viewFitted=false;v.camera.position.set(12,13,14);v.controls.target.set(2,0,3);const p=v.camera.position.clone(),t=v.controls.target.clone();v.container.clientWidth=450;v.resize();assert.deepEqual(v.camera.position,p);assert.deepEqual(v.controls.target,t);});
test('fit exits a photo or walk and includes the whole apartment',()=>{const v=viewer();v.setMode('walk');v.fitApartment();assert.equal(v.mode,'3d');assert.equal(v.photoActive,false);assert.equal(v.camera.fov,43);});
test('Plan and Furniture left drags pan and right/middle drag pan in every view',()=>{
 assert.equal(typeof interaction.cameraMouseButtons,'function');
 for(const mode of ['3d','top','furniture']){
  const b=interaction.cameraMouseButtons(mode,{});
  assert.equal(b.LEFT,mode==='3d'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN);
  assert.equal(b.MIDDLE,THREE.MOUSE.PAN);assert.equal(b.RIGHT,THREE.MOUSE.PAN);
  // OrbitControls swaps ROTATE to PAN on Shift/Ctrl/Meta; map accordingly.
  assert.deepEqual(interaction.cameraMouseButtons(mode,{shiftKey:true}),{LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.ROTATE});
 }
});
test('camera modifier gestures never edit and only Move drags selected furniture',()=>{
 assert.equal(typeof interaction.isEditingPointer,'function');
 assert.equal(interaction.isEditingPointer({button:0}),true);
 for(const e of [{button:1},{button:2},{button:0,shiftKey:true},{button:0,ctrlKey:true},{button:0,metaKey:true},{button:0,altKey:true}])assert.equal(interaction.isEditingPointer(e),false);
 assert.equal(interaction.dragAllowed('furniture','select'),false);
 assert.equal(interaction.dragAllowed('walk','move'),false);
 assert.equal(interaction.dragAllowed('top','move'),true);
});

// Real OrbitControls receives the same pointer events and mapping as the viewer;
// only the DOM surface is replaced because Node has no canvas or document.
class Surface extends EventTarget{
 constructor(){super();this.style={};this.clientWidth=446;this.clientHeight=1000;this.root=new EventTarget();}
 getRootNode(){return this.root;}
 setPointerCapture(){}
 releasePointerCapture(){}
}
function pointer(surface,type,button,x,y,shiftKey=false){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:1,pointerType:'mouse',button,clientX:x,clientY:y,shiftKey,ctrlKey:false,metaKey:false});surface.dispatchEvent(event);}
for(const mode of ['3d','top'])for(const gesture of [{button:1},{button:2},{button:0,shiftKey:true},...(mode==='top'?[{button:0}]:[])])test(`${mode} pointer pan ${JSON.stringify(gesture)} changes target without orbiting`,()=>{
 const v=viewer(446,1000,mode);v.setMode(mode);v.camera.updateMatrixWorld();v.controls.enableDamping=false;
 const surface=new Surface();v.controls.connect(surface);v.controls.mouseButtons=interaction.cameraMouseButtons(mode,gesture);
 const position=v.camera.position.clone(),target=v.controls.target.clone(),offset=position.clone().sub(target);
 pointer(surface,'pointerdown',gesture.button,120,200,gesture.shiftKey);pointer(surface,'pointermove',gesture.button,210,270,gesture.shiftKey);pointer(surface,'pointerup',gesture.button,210,270,gesture.shiftKey);
 assert.ok(v.controls.target.distanceTo(target)>.1,'pan did not move');
 assert.ok(v.camera.position.clone().sub(v.controls.target).distanceTo(offset)<.0001,'pan changed view angle or distance');
 if(mode==='top')assert.ok(v.camera.getWorldDirection(new THREE.Vector3()).y<-.99999,'plan tilted');
 v.controls.dispose();
});
test('Shift-wheel pan preserves camera orientation and distance',()=>{for(const mode of ['top','3d']){const v=viewer(446,1000,mode);v.setMode(mode);const before=v.camera.position.clone().sub(v.controls.target),target=v.controls.target.clone();v.panPixels(80,90);assert.ok(v.controls.target.distanceTo(target)>.1);assert.ok(v.camera.position.clone().sub(v.controls.target).distanceTo(before)<.0001);assert.equal(v.viewFitted,false);}});
