import {it,expect} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {createProject} from '../src/domain/project';
import {unpackProject} from '../src/storage/archive';
function archive(){return zipSync({'project.json':strToU8(JSON.stringify(createProject())),'manifest.json':strToU8(JSON.stringify({version:1,assets:[]})),'extra.txt':new Uint8Array(100000)},{level:9});}
function central(bytes:Uint8Array){const view=new DataView(bytes.buffer);for(let i=0;i<bytes.length-4;i++)if(view.getUint32(i,true)===0x02014b50)return i;throw Error('no directory');}
it('rejects forged expanded sizes rather than accepting truncated asset bytes',async()=>{const bytes=archive(),view=new DataView(bytes.buffer);let pos=central(bytes);while(view.getUint32(pos,true)===0x02014b50){const n=view.getUint16(pos+28,true),name=new TextDecoder().decode(bytes.subarray(pos+46,pos+46+n));if(name==='extra.txt'){view.setUint32(pos+24,1,true);const local=view.getUint32(pos+42,true);view.setUint32(local+22,1,true);break;}pos+=46+n+view.getUint16(pos+30,true)+view.getUint16(pos+32,true);}await expect(unpackProject(bytes,10000)).rejects.toThrow();});
it('rejects a changed CRC even when the data can still be decompressed',async()=>{const bytes=archive(),view=new DataView(bytes.buffer),pos=central(bytes);view.setUint32(pos+16,12345,true);view.setUint32(view.getUint32(pos+42,true)+14,12345,true);await expect(unpackProject(bytes)).rejects.toThrow();});
it('rejects malformed model bounds and resource type mismatches before activation',async()=>{
 const p=createProject();const {createFurniture}=await import('../src/domain/furniture');const f=createFurniture('asset');f.assetId='resource';p.variants[0].furniture.push(f);
 const make=(kind:string,stats:unknown)=>zipSync({'project.json':strToU8(JSON.stringify(p)),'manifest.json':strToU8(JSON.stringify({version:1,assets:[{id:'resource',name:'Broken',kind,stats,originals:[],glbPath:'asset.glb',warnings:[]}]})),'asset.glb':new Uint8Array([1,2,3])});
 await expect(unpackProject(make('model',{bounds:[1]}))).rejects.toThrow();await expect(unpackProject(make('hdri',undefined))).rejects.toThrow();
});
