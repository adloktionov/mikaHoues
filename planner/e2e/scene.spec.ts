import {test,expect} from '@playwright/test';
test('renders 3D/Top/Walk and preserves furniture selection and document',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();await page.getByRole('button',{name:'Каталог',exact:true}).click();await page.getByRole('button',{name:'Добавить шкаф',exact:true}).click();
 const read=()=>page.evaluate(async()=>{const {useEditor}=await import('/src/stores/editor.ts');const e=useEditor();return JSON.stringify({document:e.document,selected:e.selected});});const before=await read();
 for(const name of ['3D','Сверху','Прогулка','3D']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByTestId('scene-stats')).toBeVisible();await expect(page.getByLabel('Трёхмерный план')).toBeVisible();expect(await read()).toBe(before);}
 await page.getByRole('button',{name:'Полные стены',exact:true}).click();await page.getByRole('button',{name:'2D',exact:true}).click();expect(await read()).toBe(before);await expect(page.getByRole('spinbutton',{name:'Ширина предмета, м'})).toHaveValue('1.6');expect(errors).toEqual([]);
});
