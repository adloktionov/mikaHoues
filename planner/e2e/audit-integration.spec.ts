import {test,expect} from '@playwright/test';

test('real 3D drag is one command and persists through undo, redo, archive and reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const start=await page.evaluate(async()=>{
  const {useEditor}=await import('/src/stores/editor.ts'),{createFurniture}=await import('/src/domain/furniture.ts'),{PlannerScene}=await import('/src/render/scene.ts');const e=useEditor(),f=createFurniture('bed');f.x=2;f.z=2.5;e.edit('Bed',p=>p.variants[0].furniture.push(f));
  const host=document.createElement('div');host.id='audit-drag';host.style.cssText='position:fixed;inset:0;width:900px;height:700px;z-index:1000;background:white';document.body.append(host);
  const scene=new PlannerScene(host,{select:id=>e.selected={kind:'furniture',id},move:(id,x,z)=>{e.edit('Drag',p=>{const f=p.variants[0].furniture.find(f=>f.id===id)!;f.x=x;f.z=z;});scene.update(e.document);},stats:()=>{}});scene.update(e.document);scene.setMode('top');
  (window as any).auditScene=scene;scene.scene.updateMatrixWorld(true);scene.camera.updateMatrixWorld(true);const v=scene.camera.position.clone().set(f.x,f.height,f.z).project(scene.camera);return {x:(v.x+1)*450,y:(1-v.y)*350,revision:e.document.revision};
 });
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+65,start.y+20,{steps:12});await page.mouse.up();
 const state=await page.evaluate(async()=>{const {useEditor}=await import('/src/stores/editor.ts');const {packProject,unpackProject}=await import('/src/storage/archive.ts');const e=useEditor(),moved=JSON.parse(JSON.stringify(e.variant.furniture[0])),revision=e.document.revision;e.undo();const undone=e.variant.furniture[0].x;e.redo();const roundtrip=await unpackProject(await packProject(e.document,[]));await e.save();(window as any).auditScene.dispose();document.querySelector('#audit-drag')!.remove();return {moved,revision,undone,restored:roundtrip.document.variants[0].furniture[0]};});
 expect(state.revision-start.revision).toBe(1);expect(state.moved.x).toBeGreaterThan(2.2);expect(state.moved.y).toBe(0);expect(state.undone).toBe(2);expect(state.restored).toEqual(state.moved);
 await page.reload();await page.getByRole('button',{name:'Каталог',exact:true}).click();await page.getByRole('button',{name:'Кровать',exact:true}).click();await expect(page.getByLabel('Положение X, м')).toHaveValue(String(state.moved.x));
 await page.getByRole('button',{name:'3D',exact:true}).click();await expect(page.getByTestId('scene-stats')).toBeVisible();await page.screenshot({path:'test-results/audit-final-editor.png',fullPage:true});expect(errors).toEqual([]);
});
