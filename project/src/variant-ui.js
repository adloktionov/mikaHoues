export function mountVariantUI({store,root,capture,load,openDialog,notify,beforeChange=()=>{},onError=()=>{}}){
 const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const close=()=>$('dialog').close();
 const handle=fn=>{try{return fn();}catch(e){notify(e.message);if($('variant-error'))$('variant-error').textContent=e.message;onError(e);return false;}};
 function change(fn){beforeChange();return handle(()=>{fn();load();render();return true;});}
 function render(){
  const active=store.active();root.classList.toggle('is-original',store.readOnly);
  root.innerHTML=`<label class="variant-picker">Вариант квартиры<select id="variant-select" aria-label="Вариант квартиры">${store.list().map(v=>`<option value="${esc(v.id)}" ${v.id===active.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label>
  <span id="variant-status">${store.readOnly?'Исходная квартира · только просмотр':'Редактируемый вариант'}</span>
  <button id="new-variant">${store.readOnly?'Создать вариант на основе исходной':'Сохранить как новый вариант'}</button>
  <button id="toggle-original">${store.readOnly?'Вернуться к текущему варианту':'Показать исходную квартиру'}</button><button id="manage-variants">Управление вариантами</button>`;
  $('variant-select').onchange=e=>{if(!change(()=>store.switchTo(e.target.value)))render();};
  $('new-variant').onclick=createDialog;$('toggle-original').onclick=()=>change(()=>store.switchTo(store.readOnly?store.returnId:'original'));$('manage-variants').onclick=manageDialog;
  $('save').disabled=store.readOnly;$('save').title=store.readOnly?'Исходная квартира защищена':'Сохранить выбранный вариант';
 }
 function createDialog(){
  beforeChange();openDialog(`<h2>${store.readOnly?'Создать вариант на основе исходной':'Сохранить как новый вариант'}</h2><p>Независимая копия текущей сцены. Исходная квартира и другие варианты сохранятся.</p><form id="variant-name-form"><label>Название варианта<input id="variant-name" required maxlength="100" value="${esc('Вариант '+store.state.variants.length)}"></label><p id="variant-error" role="alert"></p><button class="primary wide">Создать вариант</button></form>`);
  $('variant-name-form').onsubmit=e=>{e.preventDefault();const name=$('variant-name').value;if(change(()=>{if(!store.readOnly)capture();store.create(name);})){close();notify('Новый вариант создан и открыт');}};
 }
 function confirmAction(title,description,action,button='Подтвердить'){
  openDialog(`<h2>${esc(title)}</h2><p>${esc(description)}</p><p id="variant-error" role="alert"></p><div class="confirm-actions"><button id="cancel-variant-action">Отмена</button><button id="confirm-variant-action" class="danger">${esc(button)}</button></div>`);
  $('cancel-variant-action').onclick=close;$('confirm-variant-action').onclick=()=>{if(change(action)){close();notify('Изменение сохранено');}};
 }
 function manageDialog(){
  const a=store.active();openDialog(`<h2>Управление вариантами</h2><p><b>${esc(a.name)}</b> · ${esc(a.architectureVersion)}</p><p>Создан: ${esc(new Date(a.createdAt).toLocaleString('ru-RU'))}<br>Изменён: ${esc(new Date(a.updatedAt).toLocaleString('ru-RU'))}</p>
  <button id="export-all" class="wide secondary">Экспорт всех вариантов</button>${store.readOnly?'':`<button id="reset-variant" class="wide secondary">Сбросить текущий вариант</button><button id="delete-variant" class="wide danger" ${store.state.variants.length<2?'disabled':''}>Удалить вариант</button>`}`);
  $('export-all').onclick=()=>exportDialog(true);
  if($('reset-variant'))$('reset-variant').onclick=()=>confirmAction('Сбросить текущий вариант?',`«${a.name}» вернётся к исходной мебели и параметрам. Остальные варианты не изменятся.`,()=>store.resetActive(),'Сбросить вариант');
  if($('delete-variant'))$('delete-variant').onclick=()=>confirmAction('Удалить вариант?',`Удалить «${a.name}»? Перед удалением можно отменить действие и экспортировать вариант. Исходная квартира и другие варианты сохранятся.`,()=>store.deleteActive(),'Удалить вариант');
 }
 function exportDialog(all=false){
  beforeChange();if(!store.readOnly)handle(capture);
  const text=all?store.exportAll():store.exportActive();
  openDialog(`<h2>${all?'Экспорт всех вариантов':'Экспорт варианта'}</h2><p>Скопируйте JSON и сохраните его в текстовый файл .json. Включены мебель, размеры, положение, видимость, параметры и версия архитектуры.</p><textarea id="export-json" readonly aria-label="JSON вариантов">${esc(text)}</textarea><button id="copy-json" class="primary">Копировать JSON</button>`);
  $('copy-json').onclick=async()=>{try{await navigator.clipboard.writeText(text);$('copy-json').textContent='Скопировано';}catch{$('export-json').select();notify('Текст выделен. Нажмите Ctrl/Cmd C.');}};
 }
 function importDialog(){
  beforeChange();openDialog(`<h2>Импорт варианта</h2><p>По умолчанию импорт создаёт независимые копии. Старый JSON расстановки и резервная копия всех вариантов также поддерживаются.</p><button id="choose-layout-file" class="wide secondary">Выбрать файл JSON</button><input id="variant-import-file" type="file" accept="application/json,.json" hidden><textarea id="import-json" aria-label="Вставить JSON" placeholder="Вставьте JSON варианта или всех вариантов"></textarea><label>Режим импорта<select id="import-mode"><option value="new">Добавить как новые варианты</option>${store.readOnly?'':'<option value="replace">Заменить текущий вариант…</option>'}</select></label><p id="variant-error" role="alert"></p><button id="apply-import" class="primary wide">Импортировать</button>`);
  $('choose-layout-file').onclick=()=>$('variant-import-file').click();
  $('variant-import-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>20*1024*1024){$('variant-error').textContent='Файл больше 20 МБ';return;}try{$('import-json').value=await f.text();notify('Файл прочитан. Нажмите «Импортировать».');}catch{$('variant-error').textContent='Не удалось прочитать файл';}};
  $('apply-import').onclick=()=>{const text=$('import-json').value,replace=$('import-mode').value==='replace';if(!handle(()=>{store.parseImport(text);return true;}))return;
   if(replace)confirmAction('Заменить текущий вариант?',`Импорт заменит содержимое «${store.active().name}». Другие варианты и исходная квартира сохранятся.`,()=>store.importJSON(text,true),'Заменить вариант');
   else if(change(()=>store.importJSON(text))){close();notify('Импортированные варианты добавлены');}
  };
 }
 render();return {render,createDialog,exportDialog,importDialog,showOriginal:()=>change(()=>store.switchTo('original'))};
}
