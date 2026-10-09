import {test,expect} from '@playwright/test';
test('computes a course in a worker and exports the actual stock bill',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();await page.getByRole('spinbutton',{name:'Высота стен, м'}).fill('0.25');await page.getByRole('spinbutton',{name:'Высота стен, м'}).press('Tab');
 await page.getByRole('button',{name:'Кладка',exact:true}).click();await expect(page.getByText(/Раскладка завершена/)).toBeVisible();await expect(page.getByRole('img',{name:'Раскладка деталей по рядам'})).toBeVisible();
 const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Скачать CSV'}).click();const file=await downloading;expect(file.suggestedFilename()).toContain('.csv');
 await page.getByRole('button',{name:'План',exact:true}).click();await page.getByRole('button',{name:'Отменить',exact:true}).click();await page.getByRole('button',{name:'Кладка',exact:true}).click();await expect(page.getByRole('status')).toHaveCount(0);
});
