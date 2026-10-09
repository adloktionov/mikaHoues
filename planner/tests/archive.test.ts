import {it,expect} from 'vitest';
import {createProject} from '../src/domain/project';
import {packProject,unpackProject} from '../src/storage/archive';
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
 const asset={id:'unplaced',name:'Модель',kind:'model' as const,originals:[{name:'model.fbx',blob:new Blob(['original'])}],warnings:[]};
 const result=await unpackProject(await packProject(p,[asset]));expect(result.document.catalogAssetIds).toEqual(['unplaced']);
 await expect(unpackProject(await packProject(p,[]))).rejects.toThrow(/не содержит/);
});
