import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bytes=readFileSync(new URL('../data/apartment-data.json',import.meta.url));
const data=JSON.parse(bytes),original=JSON.parse(readFileSync(new URL('../data/original-scene.json',import.meta.url)));
test('protected original is a separately stored, architecture-linked reconstruction with nine original objects',()=>{
 assert.equal(original.architectureVersion,data.apartment.architectureVersion);
 assert.equal(original.architectureDataSha256,createHash('sha256').update(bytes).digest('hex'));
 assert.deepEqual(original.layout.objects,data.movableFurniture);
 assert.equal(original.layout.objects.length,9);
 assert.ok(original.layout.objects.every(o=>!o.id.startsWith('my-')));
 assert.deepEqual(original.materials,data.materials);
 assert.deepEqual(original.parameters,Object.fromEntries(Object.entries(data.apartment.parameters).map(([k,v])=>[k,v.value])));
 assert.equal(original.layout.objects.find(o=>o.id==='existing-bed').mattress.width,1.4);
 assert.equal(original.layout.objects.find(o=>o.id==='existing-bed').mattress.depth,2);
});
