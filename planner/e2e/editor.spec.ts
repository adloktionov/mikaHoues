import {test,expect} from '@playwright/test';
test('creates a measured room and restores it after reload',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Добавить комнату',exact:true}).click();
 await expect(page.getByText('20.00 м²',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(page.getByText('Сохранено на этом устройстве',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('20.00 м²',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Отменить',exact:true}).isDisabled();
});
