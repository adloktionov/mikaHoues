import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('FBX is converted and analyzed in a worker, including embedded textures',async({page})=>{
 await page.goto('/');
 for(const name of ['cube.fbx','textured.fbx']){const base64=readFileSync(new URL('./fixtures/'+name,import.meta.url)).toString('base64');
 const result=await page.evaluate(async({base64,name})=>{
  const {importModel}=await import('/src/assets/importer.ts');
  const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const asset=await importModel([new File([bytes],name)],name,{scale:1});
  return {stats:asset.stats,magic:new DataView(await asset.glb.arrayBuffer()).getUint32(0,true),original:await asset.originals[0].blob.arrayBuffer().then(b=>b.byteLength)};
 },{base64,name});
 expect(result.stats.triangles).toBeGreaterThan(0);expect(result.magic).toBe(0x46546c67);expect(result.original).toBe(Buffer.from(base64,'base64').byteLength);if(name==='textured.fbx')expect(result.stats.textures).toBeGreaterThan(0);
 }
});
test('cancelling an import terminates its work without creating an asset',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{const {importModel}=await import('/src/assets/importer.ts');const c=new AbortController();const pending=importModel([new File(['bad'],'broken.fbx')],'broken.fbx',{scale:1,signal:c.signal});c.abort();try{await pending;return 'resolved';}catch(e){return (e as Error).name;}});expect(result).toBe('AbortError');
});
test('produces a lightweight GLB and can import its normalized GLB again',async({page})=>{
 await page.goto('/');const base64=readFileSync(new URL('./fixtures/textured.fbx',import.meta.url)).toString('base64');const result=await page.evaluate(async(base64)=>{const {importModel}=await import('/src/assets/importer.ts');const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const first=await importModel([new File([bytes],'textured.fbx')],'textured.fbx',{scale:1});if(!first.lowGlb)return {hasLow:false};const second=await importModel([new File([first.glb],'normalized.glb')],'normalized.glb',{scale:1});const low=await importModel([new File([first.lowGlb],'low.glb')],'low.glb',{scale:1});return {lowTriangles:low.stats.triangles,fullTriangles:first.stats.triangles,hasLow:true,lowMagic:new DataView(await first.lowGlb.arrayBuffer()).getUint32(0,true),first:first.stats.bounds,second:second.stats.bounds};},base64);expect(result.hasLow).toBe(true);expect(result.lowMagic).toBe(0x46546c67);expect(result.lowTriangles).toBeLessThan(result.fullTriangles!);for(let i=0;i<3;i++)expect(result.second![i]).toBeCloseTo(result.first![i],4);
});
test('corrupt FBX fails without yielding an asset',async({page})=>{await page.goto('/');const result=await page.evaluate(async()=>{const {importModel}=await import('/src/assets/importer.ts');try{await importModel([new File(['broken'],'broken.fbx')],'broken.fbx',{scale:1});return false;}catch(error){return Boolean((error as Error).message);}});expect(result).toBe(true);});
