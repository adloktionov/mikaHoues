import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// A shared palette avoids allocating identical materials during selection / layout rebuilds.
// The viewer owns geometry disposal; palette materials live for the application lifetime.
const palette = new Map();
function material(color, options = {}) {
  const key = JSON.stringify([color, options]);
  if (!palette.has(key)) palette.set(key, new THREE.MeshStandardMaterial({ color, roughness: .65, ...options }));
  return palette.get(key);
}
const TYPES = new Set(['beanbag','mattress','side_table','desk_workstation','digital_piano','electronic_drums','desk_simple','robot_vacuum','studio_light','turtle_aquarium','portable_ac','floor_lamp','drying_rack','executive_chair','ergonomic_chair','saddle_chair','acoustic_guitar_stand','acoustic_guitar','piano_bench','shoe_cabinet','soil_box','water_cooler']);
export const supportsPersonalFurniture = item => TYPES.has(item.modelType);
export const visualHeight = item => item.height + (item.modelType === 'desk_workstation' ? (item.extraHeight ?? .5) : 0);
const metal = () => material('#252b2e', {metalness:.65, roughness:.36});
const silver = () => material('#a1aaad', {metalness:.7, roughness:.3});
const white = () => material('#eceee9');
const dark = () => material('#20252b');
const wood = () => material('#916340', {roughness:.72});
function mesh(parent, geometry, mat, x=0, y=0, z=0, name='') {
  const m = new THREE.Mesh(geometry, mat); m.position.set(x,y,z); m.name=name;
  m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function box(p,w,h,d,x,y,z,m,name='') { return mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z,name); }
function round(p,w,h,d,x,y,z,m,r=.04,name='') { return mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),m,x,y,z,name); }
function ball(p,w,h,d,x,y,z,m,name='') { const o=mesh(p,new THREE.SphereGeometry(1,20,12),m,x,y,z,name);o.scale.set(w/2,h/2,d/2);return o; }
function cyl(p,r,h,x,y,z,m,rt=r,name='') { return mesh(p,new THREE.CylinderGeometry(rt,r,h,24),m,x,y,z,name); }
function rod(p,a,b,r,m) {const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),v=end.clone().sub(start);const o=cyl(p,r,v.length(),...start.clone().add(end).multiplyScalar(.5).toArray(),m);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
function group(p,name) { const g=new THREE.Group();g.name=name;p.add(g);return g; }
function fit(g,w,h,d) {
  g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g),s=b.getSize(new THREE.Vector3());
  g.scale.set(w/s.x,h/s.y,d/s.z);g.updateMatrixWorld(true);
  const f=new THREE.Box3().setFromObject(g),c=f.getCenter(new THREE.Vector3());g.position.set(-c.x,-f.min.y,-c.z);g.updateMatrixWorld(true);
}
function fourLegs(p,w,d,h,m,r=.04) {for(const x of [-1,1])for(const z of [-1,1])box(p,r,h,r,x*(w/2-r),h/2,z*(d/2-r),m);}
function starBase(p) {
  cyl(p,.042,.37,0,.26,0,silver());cyl(p,.06,.14,0,.15,0,metal());
  for(let i=0;i<5;i++) {const a=i*Math.PI*2/5, x=Math.sin(a)*.46,z=Math.cos(a)*.46;rod(p,[0,.14,0],[x,.065,z],.024,metal());const wheel=cyl(p,.045,.035,x,.045,z,dark());wheel.rotation.z=Math.PI/2;}
}
function guitar(p,withStand) {
  const instrument=group(p,'guitar');
  // Extruded hourglass outline, with a narrow waist and two rounded bouts.
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.28,0,-.28,.2,-.17,.27);shape.bezierCurveTo(-.1,.32,-.26,.43,-.13,.51);shape.bezierCurveTo(-.07,.55,.07,.55,.13,.51);shape.bezierCurveTo(.26,.43,.1,.32,.17,.27);shape.bezierCurveTo(.28,.2,.28,0,0,0);
  mesh(instrument,new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelThickness:.007,bevelSize:.007,bevelSegments:2,steps:1,curveSegments:12}),wood(),0,.06,-.055,'guitar_body');
  box(instrument,.048,.41,.033,0,.74,0,dark());
  round(instrument,.075,.13,.04,0,1.0,0,wood());
  const hole=mesh(instrument,new THREE.CircleGeometry(.06,24),dark(),0,.39,.065);hole.name='soundhole';
  box(instrument,.12,.02,.015,0,.2,.066,dark());
  for(let i=0;i<3;i++)for(const side of [-1,1])ball(instrument,.028,.02,.018,side*.05,.97+i*.035,0,silver());
  if(withStand){const s=group(p,'guitar_stand');rod(s,[-.3,.02,.2],[.3,.02,.2],.016,metal());rod(s,[0,.02,-.3],[0,.6,-.12],.02,metal());for(const x of [-.18,.18])rod(s,[0,.2,-.13],[x,.1,.16],.016,metal());}
}
function table(p,w,d,h,m,xLegs=false){
 const t=.045;box(p,w,t,d,0,h-t/2,0,m,'tabletop');
 if(xLegs){for(const x of [-w*.42,w*.42])for(const dir of [-1,1])rod(p,[x,.025,dir*d*.41],[x,h-t,-dir*d*.41],.025,metal());rod(p,[-w*.42,h*.6,0],[w*.42,h*.6,0],.017,metal());}
 else fourLegs(p,w,d,h-t,metal());
}
function workstation(p,item){
 const w=item.width,d=item.depth,h=item.height,extra=item.extraHeight??.5;
 const base=group(p,'desk_workstation');table(base,w,d,h,material(item.color||'#825937'),true);for(const x of [-w*.42,w*.42])for(const z of [-d*.41,d*.41])box(base,.06,.03,.06,x,.015,z,metal());
 const tech=group(base,'desktop_equipment');
 const monitor=group(tech,'monitor');box(monitor,.54,.31,.024,0,.33,-.13,dark());box(monitor,.50,.27,.008,0,.33,-.114,material('#3f6578'));cyl(monitor,.009,.16,0,.12,-.14,silver());box(monitor,.19,.013,.14,0,.007,-.12,dark());
 const closed=group(tech,'laptop_closed');round(closed,.30,.017,.20,-.39,.009,.10,silver(),.009);
 const laptop=group(tech,'laptop_open');round(laptop,.30,.013,.20,.33,.007,.15,silver(),.007);const screen=round(laptop,.30,.19,.014,.33,.107,.055,silver(),.006);screen.rotation.x=-.12;box(laptop,.278,.166,.005,.33,.107,.065,material('#35566c'));
 for(const [x,name] of [[-.59,'speaker_left'],[.59,'speaker_right']]){const s=group(tech,name);round(s,.09,.15,.09,x,.075,-.10,dark(),.009);for(const y of [.05,.11]){const q=cyl(s,.025,.006,x,y,-.052,silver());q.rotation.x=Math.PI/2;}}
 fit(tech,w*.93,extra,d*.86);tech.position.y+=h;
}
export function createPersonalFurniture(item){
 const root=new THREE.Group();root.name=item.id;root.userData.itemId=item.id;
 const p=group(root,item.modelType),m=material(item.color||'#87918a');
 switch(item.modelType){
 case 'beanbag':{
  const pts=[[0,0],[.30,.03],[.47,.18],[.48,.35],[.37,.53],[.23,.76],[.14,.96],[0,1]].map(([x,y])=>new THREE.Vector2(x,y));
  const g=new THREE.LatheGeometry(pts,32);const a=g.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i);a.setZ(i,a.getZ(i)+y*y*.19);a.setY(i,y+Math.sin(a.getX(i)*14)*.009*Math.sin(y*Math.PI));}g.computeVertexNormals();mesh(p,g,m);
  ball(p,.57,.15,.48,0,.36,.19,m);round(p,.12,.025,.035,0,.96,.20,m,.01);break;}
 case 'mattress':round(p,1,.9,1,0,.5,0,m,.09);round(p,1,.035,1,0,.10,0,material('#c0beb7'),.015);round(p,1,.035,1,0,.89,0,material('#c0beb7'),.015);break;
 case 'side_table':fourLegs(p,1,1,.94,m);box(p,1,.06,1,0,.97,0,m);break;
 case 'desk_simple':table(p,1,1,1,m);break;
 case 'desk_workstation':workstation(p,item);break;
 case 'digital_piano':{
  for(const x of [-.46,.46])box(p,.07,.76,.7,x,.38,0,m);box(p,1,.18,1,0,.78,0,m);box(p,.95,.045,.40,0,.89,.27,white());
  for(let i=0;i<28;i++){box(p,.003,.008,.38,-.456+i*.034,.917,.27,dark());if(i%7!==2&&i%7!==6)box(p,.016,.025,.23,-.445+i*.034,.93,.185,dark());}
  box(p,.50,.18,.022,0,.96,-.34,m);box(p,.82,.07,.07,0,.12,-.27,m);for(const x of [-.07,0,.07])round(p,.045,.035,.17,x,.055,.05,silver(),.01);break;}
 case 'electronic_drums':{
  for(const x of [-.43,.43]){rod(p,[x,.03,-.25],[x,.80,-.25],.022,silver());rod(p,[x,.03,-.35],[x,.03,.34],.026,metal());}
  rod(p,[-.43,.73,-.25],[.43,.73,-.25],.023,silver());
  for(const [x,y,z,r] of [[-.22,.81,-.08,.15],[.16,.83,-.09,.15],[-.30,.60,.25,.19],[.29,.64,.23,.18]]){rod(p,[x,.72,-.25],[x,y-.035,z],.018,silver());cyl(p,r,.044,x,y,z,dark());cyl(p,r*.85,.009,x,y+.027,z,material('#929997'));}
  for(const [x,y,z] of [[-.43,1.22,-.20],[.42,1.12,-.26],[.30,.96,.31]]){rod(p,[x,.72,-.25],[x,y,z],.014,silver());cyl(p,.205,.018,x,y,z,dark(),.13);cyl(p,.03,.03,x,y+.025,z,metal());}
  box(p,.14,.06,.16,-.43,.77,.05,material('#364d5a'));for(const x of [-.12,.15])box(p,.11,.04,.23,x,.04,.28,dark());break;}
 case 'robot_vacuum':cyl(p,.5,.80,0,.42,0,m);cyl(p,.47,.05,0,.84,0,dark());cyl(p,.13,.10,0,.915,-.1,m);box(p,.15,.06,.05,0,.6,.49,dark());break;
 case 'studio_light':{
  const w=item.width,d=item.depth,h=item.height,legs=group(p,'tripod');
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(legs,[0,.32,0],[Math.cos(a)*.48,.02,Math.sin(a)*.48],.018,metal());}
  fit(legs,w,h*.22,d);cyl(p,.015,h*.78,0,h*.39,0,silver());cyl(p,.028,h*.04,0,h*.50,0,dark());
  const panelW=w*.4/.65,panelH=h*.4/1.5,panelD=d*.065/.65;
  round(p,panelW,panelH,panelD,0,h-panelH/2,0,dark(),.02,'light_panel');
  box(p,panelW*.92,panelH*.92,panelD*.08,0,h-panelH/2,panelD*.53,material('#fff2ce',{emissive:'#fff1cf',emissiveIntensity:.35}));break;}
 case 'turtle_aquarium':{
  box(p,1,.48,1,0,.24,0,m);for(const x of [-.25,.25])box(p,.015,.13,.015,x,.25,.505,dark());
  const glass=material('#a2ced3',{transparent:true,opacity:.22,depthWrite:false,roughness:.1,metalness:.1,side:THREE.DoubleSide});
  for(const x of [-.49,.49])box(p,.02,.5,1,x,.75,0,glass);for(const z of [-.49,.49])box(p,1,.5,.02,0,.75,z,glass);
  box(p,.97,.14,.97,0,.57,0,material('#67aab6',{transparent:true,opacity:.46,depthWrite:false}));box(p,1,.03,1,0,.49,0,dark());
  ball(p,.35,.14,.42,.23,.66,-.15,material('#8d8f7f'));
  for(const x of [-.22,.20]){ball(p,.16,.07,.22,x,.67,.20,material('#52663e'));ball(p,.06,.045,.055,x,.67,.33,material('#788865'));}break;}
 case 'portable_ac':{
  round(p,1,.91,1,0,.54,0,m,.08);for(const x of [-.37,.37])for(const z of [-.36,.36])ball(p,.13,.12,.13,x,.06,z,dark());
  for(let i=0;i<8;i++)box(p,.73,.017,.012,0,.59+i*.042,.502,dark());box(p,.26,.035,.013,0,.94,.49,material('#354751'));break;}
 case 'floor_lamp':cyl(p,.10,.035,0,.0175,0,metal());cyl(p,.007,1.3,0,.68,0,silver());cyl(p,.095,.19,0,1.40,0,m,.055);cyl(p,.083,.008,0,1.499,0,material('#fff0c7'));break;
 case 'drying_rack':{
  for(const x of [-.48,.48])for(const dir of [-1,1])rod(p,[x,.02,dir*.45],[x,.9,-dir*.45],.013,silver());
  for(const z of [-.48,.48])rod(p,[-.5,.9,z],[.5,.9,z],.012,silver());for(let i=0;i<9;i++)rod(p,[-.5,.9,-.48+i*.12],[.5,.9,-.48+i*.12],.006,silver());break;}
 case 'executive_chair':case 'ergonomic_chair':case 'saddle_chair':{
  starBase(p);const saddle=item.modelType==='saddle_chair';
  if(saddle){for(const x of [-.115,.115])ball(p,.28,.16,.40,x,.49,0,m);break;}
  round(p,.65,.12,.65,0,.52,.02,m,.07);
  if(item.modelType==='executive_chair'){round(p,.66,.68,.16,0,.92,-.28,m,.07);round(p,.5,.19,.05,0,1.08,-.17,m,.035);}
  else{round(p,.55,.5,.11,0,.93,-.27,m,.06);round(p,.46,.18,.17,0,.72,-.20,dark(),.035);round(p,.36,.16,.13,0,1.26,-.26,m,.05);rod(p,[0,.55,-.34],[0,1.24,-.34],.025,metal());}
  for(const x of [-.36,.36]){rod(p,[x,.45,0],[x,.76,0],.026,metal());round(p,.095,.055,.39,x,.78,.02,dark(),.025);}break;}
 case 'acoustic_guitar_stand':guitar(p,true);break;
 case 'acoustic_guitar':guitar(p,false);break;
 case 'piano_bench':fourLegs(p,1,1,.88,metal(),.06);round(p,1,.12,1,0,.94,0,m,.04);break;
 case 'shoe_cabinet':box(p,1,.93,1,0,.515,0,m);for(const y of [.36,.68]){box(p,.95,.012,.012,0,y,.506,dark());box(p,.18,.018,.03,0,y+.11,.52,silver());}fourLegs(p,1,1,.08,metal(),.06);break;
 case 'soil_box':round(p,1,.92,1,0,.46,0,m,.05);round(p,1,.08,1,0,.96,0,material('#4b574b'),.03);for(const x of [-.49,.49])box(p,.02,.08,.3,x,.81,0,dark());break;
 case 'water_cooler':{
  const ratio=(item.bodyHeight??1)/((item.bodyHeight??1)+(item.bottleHeight??.4));const bh=item.height*ratio;
  const body=group(p,'cooler_body');round(body,item.width,bh,item.depth,0,bh/2,0,m,.025);
  box(body,item.width*.65,bh*.25,.012,0,bh*.58,item.depth/2-.006,material('#566775'));
  for(const x of [-.06,.06])cyl(body,.016,.04,x,bh*.63,item.depth/2-.016,material(x<0?'#597da7':'#af5d54'));
  const bottle=group(p,'bottle19l'),glass=material('#67aaca',{transparent:true,opacity:.60,roughness:.2,depthWrite:false});
  const pts=[[0,0],[.17,.0],[.17,.10],[.38,.20],[.47,.34],[.47,.86],[.36,1],[0,1]].map(v=>new THREE.Vector2(...v));mesh(bottle,new THREE.LatheGeometry(pts,28),glass);for(const y of [.42,.68,.85])cyl(bottle,.48,.018,0,y,0,glass);fit(bottle,item.width*.90,item.height-bh,item.depth*.90);bottle.position.y=bh;break;}
 default:throw new Error('Unknown personal model: '+item.modelType);
 }
 if(!['desk_workstation','water_cooler','studio_light'].includes(item.modelType))fit(p,item.width,item.height,item.depth);
 root.position.fromArray(item.position||[0,0,0]);root.rotation.y=(item.rotation||0)*Math.PI/180;root.visible=item.visible!==false;
 root.updateMatrixWorld(true);return root;
}
