// Photo-based current configuration overrides the historical plan in two areas.
// Positions/dimensions below are estimates; owner confirms topology, not survey dimensions.
import {readFileSync,writeFileSync} from 'node:fs';
import {reconcileRooms} from '../src/room-boundaries.js';
const file=new URL('../data/apartment-data.json',import.meta.url),d=JSON.parse(readFileSync(file));
const byWall=id=>d.walls.find(w=>w.id===id),fx=id=>d.fixedFurniture.find(f=>f.id===id);
const oldMovable=structuredClone(d.movableFurniture);
const kitchen=d.rooms.find(r=>r.id==='kitchen'),bath=d.rooms.find(r=>r.id==='bathroom');
const east=byWall('kitchen-east'),north=byWall('middle'),south=byWall('south');
const clearHeight=south.a[1]-south.thickness/2-(north.a[1]+north.thickness/2);
// A single rectangular depth constrained by 12.9m², while keeping the existing
// north/south/east lines. The location remains Calculated/Estimated, not measured.
const westThickness=.17369;
const entryCap=(byWall('entry').thickness-east.thickness)/2*byWall('entry').thickness;
const westX=east.a[0]-east.thickness/2-(kitchen.officialArea+entryCap)/clearHeight-westThickness/2;
d.walls=d.walls.filter(w=>!['bay-upper','bay-front','bay-lower','wc-bath'].includes(w.id));
byWall('middle').a[0]=westX;byWall('south').a[0]=westX;
d.walls.push({id:'kitchen-window-wall',a:[westX,north.a[1]],b:[westX,south.a[1]],thickness:westThickness,type:'exterior',status:'Estimated',confidence:'LOW',thicknessStatus:'Estimated',source:'P06/P07 and owner: flat window wall; depth constrained by historical area'});
d.windows=d.windows.filter(w=>!w.connects.includes('kitchen'));
d.windows.push({id:'kitchen-window',wall:'kitchen-window-wall',position:1.96,width:1.85268,height:1.45,sillHeight:.85,type:'window',connects:['kitchen','outside'],paneCount:2,status:'Estimated',confidence:'LOW',source:'P06/P07; ordinary two-section window; dimensions not measured'});
d.rooms=d.rooms.filter(r=>r.id!=='wc');
bath.label='Совмещённый санузел';bath.historicalArea=3.9;bath.officialArea=null;bath.source='Owner confirms combined bathroom; P01/P08; historical outer envelope retained';bath.status='Estimated';bath.confidence='LOW';
d.doors=d.doors.filter(o=>o.id!=='wc-door');
const bathDoor=d.doors.find(o=>o.id==='bath-door');bathDoor.position=2.65-byWall('entry').a[0];bathDoor.status='Estimated';bathDoor.confidence='LOW';bathDoor.source='Owner and P01/P08; entrance offset estimated for combined layout';
d.fixedFurniture=d.fixedFurniture.filter(f=>!['wc','light-wc'].includes(f.id));
function set(id,position,rotation,dimensions={}){Object.assign(fx(id),{position,rotation,...dimensions,status:'Estimated',confidence:'LOW'});}
function add(id,name,category,position,width,depth,height,rotation=0,color='#e8e4d8'){d.fixedFurniture.push({id,name,category,position,width,depth,height,rotation,color,status:'Estimated',confidence:'LOW',source:'P01/P04/P06/P07/P08; existence and relative placement visible, dimensions estimated'});}
const kLeft=westX+westThickness/2,kSouth=south.a[1]-south.thickness/2;
const ovenX=kLeft+.32,ovenZ=kSouth-.32;
set('kitchen-oven',[ovenX,0,ovenZ],180);
const runLeft=ovenX+.3,runRight=east.a[0]-east.thickness/2-.62;
set('kitchen-run',[(runLeft+runRight)/2,0,ovenZ],180,{width:runRight-runLeft});
set('kitchen-upper',[(runLeft+runRight)/2,1.48,kSouth-.2],180,{width:runRight-runLeft});
set('kitchen-return',[east.a[0]-east.thickness/2-.32,0,10],270,{width:1.32121});
set('radiator-kitchen',[kLeft+.09,.18,north.a[1]+1.96],90);
add('kitchen-sink','Мойка в коротком плече кухни','basin',[.70,.905,10.13],.48,.50,.055);
add('kitchen-hob','Варочная поверхность','hob',[-1.15,.905,ovenZ],.60,.50,.025);
const setMov=(id,position,rotation)=>Object.assign(d.movableFurniture.find(f=>f.id===id),{position,rotation});
setMov('existing-fridge',[.60,0,7.895],0);
setMov('existing-table',[-1.17,0,7.90],0);
setMov('existing-chair-1',[-1.87,0,7.95],90);
setMov('existing-chair-2',[-.47,0,7.95],270);
set('bath',[3.55,0,10.405],90);
set('vanity',[2.845,0,11],180,{width:.65,depth:.5,height:.81,category:'cabinet'});
set('washer',[2.21,0,11],180,{height:.82});
set('bath-toilet',[1.53,0,10.58],180,{concealedCistern:true});
add('bath-worktop','Общая столешница раковины и машинки','countertop',[2.5275,.83,11],1.315,.53,.04,0,'#efeee6');
add('bath-basin','Раковина в общей столешнице','basin',[2.845,.875,11],.48,.36,.065,0,'#efeee6');
add('towel-rail','Полотенцесушитель','towel-rail',[1.215,1.05,9.60],.55,.08,.95,90,'#a5aaa8');
add('bath-service-box','Локальный короб за унитазом','service-box',[1.53,0,11.085],.60,.39,2.7,0,'#d4d6ca');
d.materials.finishes=d.materials.finishes.filter(f=>f.wall!=='wc-bath');
for(const f of d.materials.finishes){if(f.wall==='entry'&&f.style==='tile')f.start=0;if(f.wall==='south'&&f.style==='tile'){f.start=east.a[0]-south.a[0];f.end=south.b[0]-south.a[0];}}
d.materials.finishes.push({wall:'kitchen-east',side:-1,style:'tile',start:byWall('entry').a[1]-east.a[1],end:Math.hypot(east.b[0]-east.a[0],east.b[1]-east.a[1])});
d.apartment.architectureVersion='Architecture v2';d.apartment.geometryQA='Photo/owner correction and UI audit, 2026-09-30';d.apartment.showDoorLeaves=false;
d.layoutMigrations=oldMovable.filter(o=>['existing-fridge','existing-table','existing-chair-1','existing-chair-2'].includes(o.id)).map(o=>{const n=d.movableFurniture.find(n=>n.id===o.id);return {id:o.id,from:Object.fromEntries(['position','rotation','width','depth','height'].map(k=>[k,o[k]])),to:{position:n.position,rotation:n.rotation}};});
reconcileRooms(d);
set('light-bathroom',[bath.interiorPoint[0],2.61,bath.interiorPoint[1]],0);
set('light-kitchen',[kitchen.interiorPoint[0],2.61,kitchen.interiorPoint[1]],0);
const poses={P01:[[2.65,1.55,9.27],[2.9,1.15,10.95],83],P08:[[2.95,1.55,9.95],[1.6,1.2,10.4],83],P04:[[-.25,1.55,8.75],[.60,1.3,10.8],87],P06:[[.55,1.55,8.64],[kLeft,1.30,9.36],76],P07:[[-.45,1.55,8.8],[kLeft+.12,1.35,10.04],82],P12:[[kLeft+.3,1.55,9.6],[.45,1.3,8.0],80],P15:[[4.97,1.62,8.62],[4.8,1.4,4],77]};
for(const p of d.photoCameras){if(poses[p.id]){[p.position,p.target,p.fov]=poses[p.id];}p.status='Estimated';p.confidence='LOW';}
const notes={P01:'Совмещённый санузел: ванна слева, раковина и машинка впереди. Общая столешница. Размеры оценочные.',P08:'Один санузел; унитаз справа от входа, локальный короб и полотенцесушитель. Отступы оценочные.',P04:'Г-образный гарнитур: мойка в коротком плече, варочная поверхность в длинном. Полотна скрыты.',P06:'Обычное окно в плоской стене; пенал с духовкой слева от окна, стол у противоположной стены. Холодильник проверяется обратным ракурсом P12.',P07:'Пенал больше не занимает центр кухни; обычный оконный проём без эркера. Точная глубина кухни требует обмера.',P10:'Скрыты дверные полотна. Реальная стена с сужением прохода по плану сохранена.',P11:'Проход больше не перекрыт открытым полотном. Дверь справа на исходном фото — отражение в зеркале шкафа.',P12:'Обратный ракурс: стол и холодильник вдоль противоположной от гарнитура стены, рядом с входом.',P15:'Вид от входа без мешающих полотен; реальные стены коридора сохранены.'};
for(const p of d.photoCameras)if(notes[p.id]){p.visibleSurfaces=notes[p.id];p.qa={result:'Partial',note:notes[p.id]+' Камера Estimated; метрическая калибровка не выполнена.'};}
d.uncertainties=d.uncertainties.filter(u=>!['kitchen-window','bathroom-layout','photo-match'].includes(u.id));
d.uncertainties.push({id:'kitchen-window',label:'Окно и размеры кухни',status:'Confirmed / Estimated',confidence:'LOW',detail:'Обычное окно и отсутствие эркера подтверждены пользователем и P06/P07. Точное положение плоской стены рассчитано по площади12,9 и прежним боковым стенам; это допущение.'},{id:'bathroom-layout',label:'Совмещённый санузел',status:'Confirmed / Estimated',confidence:'LOW',detail:'Одно помещение подтверждено пользователем и P01/P08. Наружный контур сохранён; положение входа, оборудования и короба оценочное. Подпись3,9 относится к старой отдельной ванной.'},{id:'photo-match',label:'Камеры и пропорции',status:'Estimated',confidence:'LOW',detail:'Все16 фото повторно изучены. Пропорции и камеры оценочные; полного метрического совмещения нет.'});
writeFileSync(file,JSON.stringify(d,null,2)+'\n');
console.log('Architecture v2:',d.rooms.length,'rooms; kitchen',kitchen.calculatedArea.toFixed(3),'m²; combined bathroom',bath.calculatedArea.toFixed(3),'m²');
