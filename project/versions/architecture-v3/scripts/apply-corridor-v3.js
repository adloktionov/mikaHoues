import {readFileSync,writeFileSync} from 'node:fs';import {reconcileRooms} from '../src/room-boundaries.js';
const path=new URL('../data/apartment-data.json',import.meta.url),data=JSON.parse(readFileSync(path));
const wall=data.walls.find(w=>w.id==='middle'),study=data.walls.find(w=>w.id==='study-east');
// Wall extrusions cap endpoints by half their thickness. Align the outside face,
// rather than simply moving the axis to the study wall and leaving a new stub.
wall.b[0]=study.a[0]+study.thickness/2-wall.thickness/2;
data.apartment.architectureVersion='Architecture v3';
data.apartment.corridorCorrection={source:'User marked screenshot 2026-10-01',wall:'middle',note:'Remove eastward extension beyond study-east wall face. Historical plan depicts an extension; current owner explicitly confirms it does not exist.'};
reconcileRooms(data);writeFileSync(path,JSON.stringify(data,null,2)+'\n');
console.log('Hall area:',data.rooms.find(r=>r.id==='hall').calculatedArea);
