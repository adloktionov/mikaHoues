import {test,expect} from '@playwright/test';
test('creates a measured room and restores it after reload',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Добавить комнату',exact:true}).click();
 await expect(page.getByText('20.00 м²',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(page.getByText('Сохранено на этом устройстве',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('20.00 м²',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Отменить',exact:true}).isDisabled();
});
test('dragging an unselected room is one undoable command',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 const canvas=page.locator('.canvas-host');const box=(await canvas.boundingBox())!;
 await page.mouse.click(box.x+20,box.y+20);
 await page.mouse.move(box.x+200,box.y+250);await page.mouse.down();await page.mouse.move(box.x+265,box.y+250,{steps:10});await page.mouse.up();
 const read=()=>page.evaluate(async()=>{const {useEditor}=await import('/src/stores/editor.ts');return useEditor().document.rooms[0].points[0].x;});
 expect(await read()).toBeCloseTo(1);
 await page.getByRole('button',{name:'Отменить',exact:true}).click();expect(await read()).toBe(0);
});
test('attaches clear rooms, moves their common wall and edits a door',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 await page.getByRole('spinbutton',{name:'Ширина, м',exact:true}).fill('3');await page.getByRole('spinbutton',{name:'Ширина, м',exact:true}).press('Tab');
 await page.getByRole('button',{name:'Добавить комнату',exact:true}).click();
 await page.locator('.inspector-section > select').first().selectOption({label:'Комната 1'});
 await page.getByRole('button',{name:'Соединить',exact:true}).click();
 const state=await page.evaluate(async()=>{const {useEditor}=await import('/src/stores/editor.ts');const e=useEditor();return {shared:e.walls.filter(w=>w.roomIds.length===2),points:e.document.rooms.map(r=>r.points)};});
 expect(state.shared).toHaveLength(1);expect(state.points[1][0].x).toBeCloseTo(3.12);
 const box=(await page.locator('.canvas-host').boundingBox())!;await page.mouse.click(box.x+90+3.06*65,box.y+75+2.5*65);
 await page.getByRole('button',{name:'Сдвинуть стену'}).click();
 await page.getByRole('button',{name:'Добавить дверь'}).click();await page.getByLabel('Ширина',{exact:true}).fill('1');await page.getByLabel('Ширина',{exact:true}).press('Tab');
 await expect(page.getByRole('heading',{name:'Дверь',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.reload();
 expect(await page.evaluate(async()=>{const {useEditor}=await import('/src/stores/editor.ts');return useEditor().document.openings[0]?.width;})).toBe(1);
});
