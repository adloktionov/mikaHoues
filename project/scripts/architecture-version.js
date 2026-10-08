import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(readFileSync(resolve(root,'data/apartment-data.json'),'utf8'));
const name=data.apartment.architectureVersion;
assert.match(name,/^Architecture v[1-9][0-9]*$/);
const versions=resolve(root,'versions'),version=resolve(versions,name.toLowerCase().replace(' ','-'));
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const geometryFiles=['data/original-scene.json','src/architecture.js','src/room-boundaries.js','src/geometry.js','src/furniture.js','src/finishes.js'];
const supportingFiles=['src/furniture.js','src/viewer.js','src/finishes.js','package.json','package-lock.json','data/reconstruction-source.json','data/photo-qa.json','data/photo-manifest.json','scripts/generate-data.py','scripts/reconcile-rooms.js','validation/source-hashes.json','validation/geometry-qa/area-comparison.json','validation/geometry-qa/wall-and-opening-dimensions.csv','geometry-qa-report.md'];
function pick(o,keys){return Object.fromEntries(keys.filter(k=>k in o).map(k=>[k,o[k]]));}
function architecture(d){return {
 apartment:pick(d.apartment,['architectureVersion','units','coordinateSystem','parameters','scaleMetresPerPixel','controlMeasurements','showDoorLeaves']),
 finishes:d.materials.finishes,
 rooms:d.rooms.map(r=>pick(r,['id','officialArea','calculatedArea','errorPercent','polygon','floorHeight','type','areaBasis'])),
 walls:d.walls.map(w=>pick(w,['id','a','b','thickness','type'])),
 doors:d.doors.map(o=>pick(o,['id','wall','position','width','height','sillHeight','openingDirection','hinge','type','connects'])),
 windows:d.windows.map(o=>pick(o,['id','wall','position','width','height','sillHeight','type','connects','paneCount'])),
 balconies:d.balconies,
 fixedFurniture:d.fixedFurniture.map(o=>pick(o,['id','category','width','depth','height','position','rotation','model','concealedCistern'])),
 photoCameras:d.photoCameras.map(p=>pick(p,['id','file','room','position','target','fov','status','confidence','roomAssignmentConfidence']))
};}
function verifySnapshot(directory){const manifest=json(resolve(directory,'manifest.json'));for(const [p,hash] of Object.entries(manifest.hashes))assert.equal(sha(readFileSync(resolve(directory,p))),hash,'Snapshot modified: '+directory+'/'+p);return manifest;}
for(const entry of readdirSync(versions,{withFileTypes:true}).filter(e=>e.isDirectory()&&/^architecture-v\d+$/.test(e.name)))verifySnapshot(resolve(versions,entry.name));
if(process.argv[2]==='freeze'){
 if(existsSync(version))throw new Error(name+' already exists; never overwrite a baseline.');
 mkdirSync(version,{recursive:true});
 const snapshot={...data};delete snapshot.movableFurniture;delete snapshot.materials;
 writeFileSync(resolve(version,'architecture-data.json'),JSON.stringify(snapshot,null,2)+'\n');
 writeFileSync(resolve(version,'geometry.json'),JSON.stringify(architecture(data),null,2)+'\n');
 const files=['architecture-data.json','geometry.json'];
 const revisionFiles=['scripts/apply-corridor-v3.js','scripts/corridor-v3-report.py','revision-v3-report.md','validation/revision-v3/area-comparison.json','validation/revision-v3/wall-and-opening-dimensions.csv','scripts/apply-revision-v2.js','scripts/revision-v2-report.py','revision-v2-report.md','validation/revision-v2/area-comparison.json','validation/revision-v2/wall-and-opening-dimensions.csv'];
 for(const file of new Set([...geometryFiles,...supportingFiles,...revisionFiles])){const dst=resolve(version,file);mkdirSync(dirname(dst),{recursive:true});copyFileSync(resolve(root,file),dst);files.push(file);}
 const hashes=Object.fromEntries(files.map(p=>[p,sha(readFileSync(resolve(version,p)))]));
 writeFileSync(resolve(version,'manifest.json'),JSON.stringify({version:name,createdAt:new Date().toISOString(),units:'metres',scope:'Baseline geometry, finish extents and estimated cameras, not a measured survey. Runtime overrides and user layouts are outside the baseline; the separately stored original scene is protected by its file hash.',geometryFiles,hashes},null,2)+'\n');
 console.log(name+' frozen.');
}else if(process.argv[2]!=='verify')throw new Error('Use freeze or verify');
const manifest=json(resolve(version,'manifest.json'));
for(const [p,hash] of Object.entries(manifest.hashes))assert.equal(sha(readFileSync(resolve(version,p))),hash,'Snapshot modified: '+p);
assert.deepEqual(architecture(data),json(resolve(version,'geometry.json')),'Current architecture differs from '+name);
for(const file of geometryFiles)assert.equal(sha(readFileSync(resolve(root,file))),manifest.hashes[file],'Geometry renderer differs: '+file);
console.log(name+': current dimensions, cameras and geometry renderer verified; all historical snapshot hashes intact.');
