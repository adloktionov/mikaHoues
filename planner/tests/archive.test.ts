import {it,expect} from 'vitest';
import {createProject} from '../src/domain/project';
import {packProject,unpackProject} from '../src/storage/archive';
import {zipSync,strToU8} from 'fflate';
it('keeps project and original assets together in a portable archive',async()=>{
 const p=createProject();const original=new Blob(['source FBX']);
 const packed=await packProject(p,[{id:'model-1',name:'Шкаф',kind:'model',originals:[{name:'шкаф.fbx',blob:original}],warnings:[]}]);
 const result=await unpackProject(packed);expect(result.document.id).toBe(p.id);expect(await result.assets[0].originals[0].blob.text()).toBe('source FBX');
});
it('rejects corrupt archives and an expanded size over caller budget',async()=>{
 await expect(unpackProject(new Uint8Array([1,2,3]))).rejects.toThrow();
 const zip=await packProject(createProject(),[]);await expect(unpackProject(zip,20)).rejects.toThrow(/размер/);
});
it('keeps unplaced catalog assets referenced and rejects an archive missing them',async()=>{
 const p=createProject();p.catalogAssetIds=['unplaced'];
 const {referencedAssets}=await import('../src/storage/archive');expect([...referencedAssets(p)]).toContain('unplaced');
 const asset={id:'unplaced',name:'Модель',kind:'model' as const,originals:[{name:'model.fbx',blob:new Blob(['original'])}],glb:new Blob(['model bytes']),stats:{triangles:12,vertices:24,meshes:1,materials:1,textures:0,texturePixels:0,estimatedBytes:1024,bounds:[1,1,1] as [number,number,number],processingMs:1},warnings:[]};
 const result=await unpackProject(await packProject(p,[asset]));expect(result.document.catalogAssetIds).toEqual(['unplaced']);
 await expect(packProject(p,[])).rejects.toThrow(/ресурс/);
 const missing=zipSync({'project.json':strToU8(JSON.stringify(p)),'manifest.json':strToU8(JSON.stringify({version:1,assets:[]}))});
 await expect(unpackProject(missing)).rejects.toThrow(/не содержит/);
});
