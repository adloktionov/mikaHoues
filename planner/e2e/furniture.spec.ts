import {test,expect} from '@playwright/test';
test('places furniture, edits dimensions and keeps layout variants independent',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Создать первую комнату'}).click();
 await page.getByRole('button',{name:'Каталог',exact:true}).click();await page.getByRole('button',{name:'Добавить шкаф',exact:true}).click();
 const width=page.getByRole('spinbutton',{name:'Ширина предмета, м',exact:true});await width.fill('2.2');await width.press('Tab');
 await page.getByRole('button',{name:'Копия варианта',exact:true}).click();await width.fill('1.2');await width.press('Tab');
 await page.getByLabel('Вариант расстановки').selectOption({label:'Вариант 1'});await expect(width).toHaveValue('2.2');
 await page.getByRole('button',{name:'Удалить предмет',exact:true}).click();await expect(width).toHaveCount(0);await page.getByRole('button',{name:'Отменить',exact:true}).click();
 await page.getByRole('button',{name:'Шкаф',exact:true}).click();await expect(width).toHaveValue('2.2');
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();await expect(page.getByText('Сохранено на этом устройстве',{exact:true})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Каталог',exact:true}).click();await page.getByRole('button',{name:'Шкаф',exact:true}).click();await expect(width).toHaveValue('2.2');
});
