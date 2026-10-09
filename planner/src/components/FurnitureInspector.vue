<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {useEditor} from '../stores/editor';
import {furnitureParts,placementWarnings,shelfHeights} from '../domain/furniture';
import {clone,uid} from '../domain/project';
import type {FurnitureInstance,Material} from '../domain/types';
const e=useEditor(),item=computed(()=>e.variant.furniture.find(f=>f.id===e.selected?.id)),warnings=computed(()=>item.value?placementWarnings(e.document,item.value):[]),partId=ref('');
const parts=computed(()=>item.value&&item.value.kind!=='asset'?furnitureParts(item.value):[]),part=computed(()=>parts.value.find(p=>p.id===partId.value));
const configurable=computed(()=>item.value&&['wardrobe','shelf','cabinet'].includes(item.value.kind));
const fields=[['width','Ширина предмета, м'],['depth','Глубина предмета, м'],['height','Высота предмета, м'],['x','Положение X, м'],['z','Положение Z, м'],['y','Высота над полом, м'],['rotation','Поворот, °']] as const;
watch(()=>item.value?.id,()=>partId.value='');watch(parts,()=>{if(!parts.value.some(p=>p.id===partId.value))partId.value='';});
function change(fn:(f:FurnitureInstance)=>void){const id=item.value!.id;return e.edit('Изменить мебель',p=>fn(p.variants.find(v=>v.id===p.activeVariantId)!.furniture.find(f=>f.id===id)!));}
function number(event:Event,key:typeof fields[number][0]|'shelves'|'sections'|'board'){const input=event.target as HTMLInputElement;const accepted=change(f=>{f[key]=Number(input.value);if(key==='shelves')f.shelfPositions=[];});if(!accepted)input.value=String(item.value![key]);}
function shelf(event:Event,index:number){const input=event.target as HTMLInputElement;if(!change(f=>{f.shelfPositions=shelfHeights(f);f.shelfPositions[index]=Number(input.value);}))input.value=String(shelfHeights(item.value!)[index]);}
function appearance(key:keyof Pick<Material,'color'|'roughness'|'metalness'|'opacity'>,value:string|number){change(f=>{const target=partId.value?(f.partMaterials[partId.value]??=clone(f.material)):f.material;if(key==='color')target.color=String(value);else target[key]=Number(value);});}
const selectedMaterial=computed(()=>part.value?.material??item.value?.material);
function duplicate(){const copy=clone(item.value!);copy.id=uid();copy.name+=' — копия';copy.x+=.3;copy.z+=.3;if(e.edit('Копировать предмет',p=>p.variants.find(v=>v.id===p.activeVariantId)!.furniture.push(copy)))e.selected={kind:'furniture',id:copy.id};}
</script>
<template><section v-if="item" class="inspector-section"><div class="eyebrow">Предмет</div><h2>{{item.name}}</h2>
<label>Название предмета<input :value="item.name" @change="change(f=>f.name=($event.target as HTMLInputElement).value)"></label>
<label v-for="[key,label] in fields">{{label}}<input type="number" :step="key==='rotation'?15:.01" :value="item[key]" @change="number($event,key)"></label>
<template v-if="configurable"><h3>Конструкция</h3><label>Количество полок<input type="number" min="0" max="30" step="1" :value="item.shelves" @change="number($event,'shelves')"></label><label>Количество секций<input type="number" min="1" max="20" step="1" :value="item.sections" @change="number($event,'sections')"></label></template>
<label v-if="configurable||item.kind==='table'">Толщина деталей, м<input type="number" min=".005" max=".1" step=".001" :value="item.board" @change="number($event,'board')"></label>
<template v-if="configurable"><label v-for="(height,i) in shelfHeights(item)">Высота полки {{i+1}}, м<input type="number" step=".01" :value="Number(height.toFixed(3))" @change="shelf($event,i)"></label><button v-if="item.shelfPositions.length" @click="change(f=>f.shelfPositions=[])">Распределить полки равномерно</button></template>
<h3>Материалы</h3><label v-if="item.kind==='asset'" class="check-label"><input type="checkbox" :checked="item.useSourceMaterials!==false" @change="change(f=>f.useSourceMaterials=($event.target as HTMLInputElement).checked)">Исходные материалы модели</label>
<template v-if="item.kind!=='asset'||item.useSourceMaterials===false"><label v-if="parts.length">Деталь для материала<select v-model="partId"><option value="">Весь предмет</option><option v-for="part in parts" :value="part.id">{{part.name}}</option></select></label><label>{{partId?'Цвет выбранной детали':'Цвет предмета'}}<input type="color" :value="selectedMaterial!.color" @change="appearance('color',($event.target as HTMLInputElement).value)"></label><label v-for="[key,label] in ([['roughness','Шероховатость'],['metalness','Металличность'],['opacity','Непрозрачность']] as const)">{{label}}<input type="number" min="0" max="1" step=".05" :value="selectedMaterial![key]" @change="appearance(key,($event.target as HTMLInputElement).value)"></label><button v-if="partId&&item.partMaterials[partId]" @click="change(f=>{delete f.partMaterials[partId]})">Материал всего предмета для детали</button></template>
<p v-if="item.kind==='asset'" class="hint">Конструкция импортированной модели сохраняется. Можно менять габариты и заменять её материалы одним своим материалом.</p>
<label class="check-label"><input type="checkbox" :checked="item.visible" @change="change(f=>f.visible=($event.target as HTMLInputElement).checked)">Показывать предмет</label><div v-if="warnings.length" class="warnings"><p v-for="warning in warnings">{{warning}}</p></div><button @click="duplicate">Копировать предмет</button><button class="danger" @click="e.removeSelected">Удалить предмет</button></section></template>
