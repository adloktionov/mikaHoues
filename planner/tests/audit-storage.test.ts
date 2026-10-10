import {it,expect} from 'vitest';
import {createProject,validateProject} from '../src/domain/project';
import {createFurniture} from '../src/domain/furniture';
import {packProject,unpackProject} from '../src/storage/archive';

it('refuses to export an archive with missing referenced model data',async()=>{
 const p=createProject(),f=createFurniture('asset');f.assetId='missing';p.variants[0].furniture.push(f);
 await expect(packProject(p,[])).rejects.toThrow(/ресурс|модел/i);
});
it('rejects duplicate stock IDs that otherwise duplicate rows in the bill',()=>{
 const p=createProject();p.profiles[0].stock[1].id=p.profiles[0].stock[0].id;
 expect(()=>validateProject(p)).toThrow(/типоразмер|ID/i);
});
it('rejects an invalid unplaced catalog model before it reaches the furniture UI',async()=>{
 const p=createProject();p.catalogAssetIds=['broken'];
 const bytes=await packProject(p,[{id:'broken',name:'Broken',kind:'model',originals:[],warnings:[]}]);
 await expect(unpackProject(bytes)).rejects.toThrow(/модел|размер/i);
});
