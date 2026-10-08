import {readFileSync,writeFileSync} from 'node:fs';
import {reconcileRooms} from '../src/room-boundaries.js';
const path=new URL('../data/apartment-data.json',import.meta.url);
const data=reconcileRooms(JSON.parse(readFileSync(path)));
writeFileSync(path,JSON.stringify(data,null,2)+'\n');
console.log(data.rooms.map(r=>`${r.id}: ${r.calculatedArea.toFixed(4)} m² (${r.errorPercent?.toFixed(3)??'no reference'}%)`).join('\n'));
