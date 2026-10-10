import {test,expect} from '@playwright/test';

test('Top stays vertical, fits again after zoom, and Walk fit keeps eye height',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const result=await page.evaluate(async()=>{
  const {PlannerScene}=await import('/src/render/scene.ts');const {useEditor}=await import('/src/stores/editor.ts');
  const host=document.createElement('div');host.style.cssText='width:800px;height:600px';document.body.append(host);
  const scene=new PlannerScene(host,{select:()=>{},move:()=>{},stats:()=>{}});
  try{scene.update(useEditor().document);scene.setMode('top');scene.top.zoom=8;scene.top.updateProjectionMatrix();scene.fit();
   const zoom=scene.top.zoom,direction=scene.top.getWorldDirection(scene.top.position.clone()).toArray();
   scene.setMode('walk');scene.fit();return {zoom,direction,eye:scene.perspective.position.y,walkY:scene.perspective.getWorldDirection(scene.top.position.clone()).y};
  }finally{scene.dispose();host.remove();}
 });
 expect.soft(result.zoom).toBe(1);expect.soft(result.direction[0]).toBeCloseTo(0,5);expect.soft(result.direction[1]).toBeCloseTo(-1,5);expect.soft(result.direction[2]).toBeCloseTo(0,5);expect.soft(result.eye).toBeCloseTo(1.6,7);expect.soft(result.walkY).toBeCloseTo(0,5);
});

test('deleting a partial neighbour never teleports an opening to another exterior segment',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const result=await page.evaluate(async()=>{
  const {useEditor}=await import('/src/stores/editor.ts');const {rectangle}=await import('/src/domain/geometry.ts');const e=useEditor();
  e.architectural('Fixture',p=>{p.rooms=[rectangle('a','A',4,10),rectangle('b','B',3,2,4.12,2),rectangle('c','C',3,2,4.12,6)];});
  const wall=e.walls.find(w=>w.roomIds.length===1&&w.owners[0].roomId==='a'&&w.owners[0].edge===1&&Math.abs(w.owners[0].start-4)<1e-6)!;
  e.architectural('Door',p=>p.openings.push({id:'door',wallId:wall.id,kind:'door',offset:1,width:.8,height:2,sill:0}));
  e.selected={kind:'room',id:'b'};e.removeSelected();
  const opening=e.document.openings[0],host=e.walls.find(w=>w.id===opening.wallId)!;
  return {z:host.a.z+(host.b.z-host.a.z)/host.length*opening.offset,warnings:e.warnings};
 });
 expect(result.z).toBeCloseTo(5,8);expect(result.warnings).toEqual([]);
});

test('moving furniture updates its transform without replacing its GPU geometry',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const result=await page.evaluate(async()=>{
  const {PlannerScene}=await import('/src/render/scene.ts');const {useEditor}=await import('/src/stores/editor.ts');const {createFurniture}=await import('/src/domain/furniture.ts');
  const p=JSON.parse(JSON.stringify(useEditor().document)),f=createFurniture('wardrobe');p.variants[0].furniture.push(f);
  const host=document.createElement('div');host.style.cssText='width:800px;height:600px';document.body.append(host);const scene=new PlannerScene(host,{select:()=>{},move:()=>{},stats:()=>{}});
  try{scene.update(p);const root=()=>scene.scene.children.find(o=>o.userData.furnitureId===f.id)!;const initial=root().children[0];let disposed=0;initial.geometry.addEventListener('dispose',()=>disposed++);
   for(let i=0;i<20;i++){f.x+=.1;f.rotation+=1;scene.update(JSON.parse(JSON.stringify(p)));}
   return {same:root().children[0]===initial,disposed,x:root().position.x,rotation:root().rotation.y};
  }finally{scene.dispose();host.remove();}
 });
 expect(result.same).toBe(true);expect(result.disposed).toBe(0);expect(result.x).toBeCloseTo(4);expect(result.rotation).toBeCloseTo(-Math.PI/9);
});

test('Space drag over furniture pans without changing the project or undo history',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();await page.getByRole('button',{name:'Каталог',exact:true}).click();await page.getByRole('button',{name:'Добавить стол',exact:true}).click();
 const read=()=>page.evaluate(async()=>{const {useEditor}=await import('/src/stores/editor.ts');return JSON.stringify(useEditor().document);});const before=await read();
 const box=(await page.locator('.canvas-host').boundingBox())!;
 await page.mouse.click(box.x+20,box.y+20);await page.keyboard.down('Space');
 await page.mouse.move(box.x+220,box.y+237);await page.mouse.down();await page.mouse.move(box.x+280,box.y+267,{steps:10});await page.mouse.up();await page.keyboard.up('Space');
 expect(await read()).toBe(before);
});

test('rejected room size restores the visible input to its saved geometry',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const width=page.getByRole('spinbutton',{name:'Ширина, м',exact:true});await width.fill('-1');await width.press('Tab');
 await expect(page.getByRole('alert')).toBeVisible();await expect(width).toHaveValue('4.00');
});

test('invalid wall height and lighting restore their visible values',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const height=page.getByLabel('Высота стен, м');await height.fill('-1');await height.press('Tab');await expect(height).toHaveValue('2.7');
 await page.getByRole('button',{name:'Свет',exact:true}).click();const sun=page.getByLabel('Яркость солнца');await sun.fill('-1');await sun.press('Tab');await expect(sun).toHaveValue('2.5');
});

test('locked architecture rejects and restores room fields without changing history',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();await page.getByRole('button',{name:'Зафиксировать архитектуру',exact:true}).click();
 const width=page.getByRole('spinbutton',{name:'Ширина, м',exact:true});await width.fill('7');await width.press('Tab');await expect(width).toHaveValue('4.00');
 await expect(page.getByRole('alert')).toContainText('зафиксирована');
});

test('Walk blocks a solid wall and allows keyboard movement through a real door',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const collision=await page.evaluate(async()=>{
  const {PlannerScene}=await import('/src/render/scene.ts');const {useEditor}=await import('/src/stores/editor.ts');const {deriveWalls}=await import('/src/domain/geometry.ts');
  const host=document.createElement('div');host.style.cssText='width:800px;height:600px';document.body.append(host);
  const scene=new PlannerScene(host,{select:()=>{},move:()=>{},stats:()=>{}}),p=JSON.parse(JSON.stringify(useEditor().document));scene.update(p);scene.setQuality(1);scene.setMode('walk');
  const wall=deriveWalls(p).find(w=>w.owners[0].edge===0)!;const solid=scene.canWalk(scene.perspective.position.clone().set(2,1.6,wall.a.z));
  p.openings.push({id:'walk-door',wallId:wall.id,kind:'door',offset:2,width:1.2,height:2.1,sill:0});scene.update(p);
  const door=scene.canWalk(scene.perspective.position.clone().set(2,1.6,wall.a.z)),jamb=scene.canWalk(scene.perspective.position.clone().set(2.55,1.6,wall.a.z));
  scene.perspective.position.set(2,1.6,.5);scene.renderer.domElement.focus();window.auditWalk={scene,host};return {solid,door,jamb};
 });
 expect(collision).toEqual({solid:false,door:true,jamb:false});
 try{await page.keyboard.down('w');await expect.poll(()=>page.evaluate(()=>window.auditWalk.scene.perspective.position.z)).toBeLessThan(-.5);await page.keyboard.up('w');
  expect(await page.evaluate(()=>window.auditWalk.scene.perspective.position.y)).toBe(1.6);
 }finally{await page.keyboard.up('w');await page.evaluate(()=>{window.auditWalk.scene.dispose();window.auditWalk.host.remove();delete window.auditWalk;});}
});
