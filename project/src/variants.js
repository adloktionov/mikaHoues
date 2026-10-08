import {validateLayout} from './layout.js';
export const VARIANTS_KEY='apartment-planner.variants.v1';
const ORIGINAL='original',MAX_VARIANTS=100;
const clone=x=>structuredClone(x),now=()=>new Date().toISOString();
const ranges={ceilingHeight:[2.3,4.5],doorHeight:[1.8,3],windowHeight:[.5,2.5],sillHeight:[.1,1.5],wallThicknessFactor:[.5,2]};
function freeze(o){Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);}
function fail(message='Некорректный файл вариантов. Текущие данные не изменены.'){throw new Error(message);}
function validName(name){if(typeof name!=='string'||!name.trim()||name.trim().length>100)fail('Введите название от 1 до 100 символов.');return name.trim();}
export function validateParameters(p){if(!p||typeof p!=='object'||Array.isArray(p))fail();const out={};for(const [k,[min,max]] of Object.entries(ranges)){const v=p[k];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Недопустимые параметры квартиры.');out[k]=v;}return out;}
function validateVariant(v,architectureVersion,allowOriginal=false){
 if(!v||typeof v.id!=='string'||!v.id||v.id.length>160||(!allowOriginal&&v.id===ORIGINAL))fail();
 if(v.architectureVersion!==architectureVersion)fail('Этот вариант относится к другой версии архитектуры.');
 for(const k of ['createdAt','updatedAt'])if(typeof v[k]!=='string'||v[k].length>40||!Number.isFinite(Date.parse(v[k])))fail();
 return {id:v.id,name:validName(v.name),createdAt:v.createdAt,updatedAt:v.updatedAt,architectureVersion,layout:validateLayout(v.layout),parameters:validateParameters(v.parameters)};
}
function validateStore(raw,version){
 if(!raw||raw.kind!=='apartment-layouts'||raw.schemaVersion!==1||!Array.isArray(raw.variants)||!raw.variants.length||raw.variants.length>MAX_VARIANTS)fail();
 const vs=raw.variants.map(v=>validateVariant(v,version));if(new Set(vs.map(v=>v.id)).size!==vs.length)fail();
 if(raw.activeId!==ORIGINAL&&!vs.some(v=>v.id===raw.activeId))fail();
 if(!vs.some(v=>v.id===raw.lastEditableId))fail();
 return {kind:'apartment-layouts',schemaVersion:1,architectureVersion:version,activeId:raw.activeId,lastEditableId:raw.lastEditableId,variants:vs};
}
export class VariantStore{
 constructor({storage,original,legacyLayout,legacyParameters,migrationError=''}){
  this.storage=storage;this.original=freeze(clone(original));this.version=original.architectureVersion;this.expectedRaw=null;this.dirty=false;this.error='';this.blocked=false;
  try{this.expectedRaw=storage.getItem(VARIANTS_KEY);if(this.expectedRaw!==null){this.state=validateStore(JSON.parse(this.expectedRaw),this.version);return;}}
  catch(error){this.error='Сохранённые варианты не прочитаны. Исходные данные сохранения оставлены без изменений. '+error.message;this.blocked=true;}
  const stamp=now(),v={id:crypto.randomUUID(),name:'Текущий вариант',createdAt:stamp,updatedAt:stamp,architectureVersion:this.version,layout:validateLayout(legacyLayout||original.layout),parameters:validateParameters(legacyParameters||original.parameters)};
  this.state={kind:'apartment-layouts',schemaVersion:1,architectureVersion:this.version,activeId:v.id,lastEditableId:v.id,variants:[v]};
  if(migrationError){this.error=migrationError;this.blocked=true;}
  if(!this.blocked)try{this.persist();}catch(error){this.error=error.message;this.dirty=true;}
 }
 get readOnly(){return this.state.activeId===ORIGINAL;}
 get returnId(){return this.state.lastEditableId;}
 active(){return this.readOnly?{...clone(this.original),updatedAt:this.original.createdAt,readOnly:true}:clone(this.state.variants.find(v=>v.id===this.state.activeId));}
 list(){return [{id:ORIGINAL,name:this.original.name,readOnly:true},...this.state.variants.map(v=>({id:v.id,name:v.name,createdAt:v.createdAt,updatedAt:v.updatedAt}))];}
 assertEditable(){if(this.readOnly)fail('Исходная квартира защищена. Создайте вариант на основе исходной.');}
 write(next){
  if(this.blocked)fail('Автосохранение заблокировано, чтобы не затереть непрочитанные данные. Экспортируйте изменения.');
  if(this.storage.getItem(VARIANTS_KEY)!==this.expectedRaw)fail('Варианты изменены в другой вкладке. Экспортируйте текущие изменения и обновите страницу.');
  const text=JSON.stringify(validateStore(next,this.version));
  try{this.storage.setItem(VARIANTS_KEY,text);}catch{fail('Не удалось сохранить в браузере. Экспортируйте вариант или все варианты.');}
  this.expectedRaw=text;this.dirty=false;this.error='';
 }
 persist(){this.write(this.state);}
 transact(next){this.write(next);this.state=next;}
 saveActive(layout,parameters){
  this.assertEditable();const current=this.active(),v={...current,layout:validateLayout(layout),parameters:validateParameters(parameters),updatedAt:now()};
  this.state.variants=this.state.variants.map(o=>o.id===v.id?v:o);this.dirty=true;this.persist();
 }
 switchTo(id){
  if(!this.list().some(v=>v.id===id))fail('Вариант не найден.');if(this.dirty)this.persist();
  const next=clone(this.state);next.activeId=id;if(id!==ORIGINAL)next.lastEditableId=id;
  // Viewing the original must remain possible even if storage is unavailable and no edits are pending.
  if(this.blocked&&!this.dirty){this.state=next;return;}
  this.transact(next);
 }
 uniqueName(name,vs=this.state.variants){const base=validName(name);let value=base,n=2;while(vs.some(v=>v.name===value))value=base.slice(0,90)+' ('+(n++)+')';return value;}
 create(name){
  if(this.state.variants.length>=MAX_VARIANTS)fail('Достигнут предел: 100 вариантов. Сначала экспортируйте и удалите ненужный вариант.');
  const source=this.active(),stamp=now(),v={...source,id:crypto.randomUUID(),name:this.uniqueName(name),createdAt:stamp,updatedAt:stamp};delete v.readOnly;
  const next=clone(this.state);next.variants.push(validateVariant(v,this.version));next.activeId=v.id;next.lastEditableId=v.id;this.transact(next);return v.id;
 }
 resetActive(){this.assertEditable();const next=clone(this.state),i=next.variants.findIndex(v=>v.id===next.activeId);next.variants[i]={...next.variants[i],layout:clone(this.original.layout),parameters:clone(this.original.parameters),updatedAt:now()};this.transact(next);}
 deleteActive(){this.assertEditable();if(this.state.variants.length===1)fail('Оставьте хотя бы один редактируемый вариант.');const next=clone(this.state);next.variants=next.variants.filter(v=>v.id!==next.activeId);next.activeId=next.variants[0].id;next.lastEditableId=next.activeId;this.transact(next);}
 exportActive(){const v=this.active();delete v.readOnly;return JSON.stringify({kind:'apartment-variant',schemaVersion:1,variant:v},null,2);}
 exportAll(){return JSON.stringify(this.state,null,2);}
 parseImport(text){
  if(typeof text!=='string'||text.length>20*1024*1024)fail('Файл слишком большой (максимум 20 МБ).');let raw;try{raw=JSON.parse(text);}catch{fail('JSON не прочитан. Проверьте содержимое файла.');}
  if(raw?.kind==='apartment-layouts')return validateStore(raw,this.version).variants;
  if(raw?.kind==='apartment-variant'&&raw.schemaVersion===1)return [validateVariant(raw.variant,this.version,true)];
  if(raw?.version===1){const stamp=now();return [{id:crypto.randomUUID(),name:'Импортированная расстановка',createdAt:stamp,updatedAt:stamp,architectureVersion:this.version,layout:validateLayout(raw),parameters:clone(this.original.parameters)}];}
  fail();
 }
 importJSON(text,replace=false){
  const incoming=this.parseImport(text),next=clone(this.state);
  if(replace){this.assertEditable();if(incoming.length!==1)fail('Заменить выбранный вариант можно только одним вариантом.');const i=next.variants.findIndex(v=>v.id===next.activeId),old=next.variants[i];next.variants[i]={...incoming[0],id:old.id,name:old.name,createdAt:old.createdAt,updatedAt:now()};}
  else{if(next.variants.length+incoming.length>MAX_VARIANTS)fail('После импорта будет больше 100 вариантов.');for(const source of incoming){const stamp=now(),v={...source,id:crypto.randomUUID(),name:this.uniqueName(source.name+' · импорт',next.variants),createdAt:stamp,updatedAt:stamp};next.variants.push(v);next.activeId=v.id;next.lastEditableId=v.id;}}
  this.transact(next);return incoming.length;
 }
}
