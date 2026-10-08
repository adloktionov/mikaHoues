export const categories={sleep:'Спальные места',tables:'Столы',seating:'Кресла и сиденья',music:'Музыкальные инструменты',appliances:'Техника',storage:'Хранение',lighting:'Освещение',other:'Прочее'};
export const categoryLabel=d=>categories[d.category]||'Существующая мебель';
export function mergeCatalogue(saved,source){
 const result=structuredClone(saved);
 for(const def of source)if(!result.some(d=>d.id===def.id))result.push(structuredClone(def));
 return result;
}
export function filterCatalogue(catalogue,query='',category='',collection='my'){
 const q=query.trim().toLocaleLowerCase('ru-RU');
 return catalogue.filter(d=>(collection==='all'||(collection==='my'?d.collection==='my':d.collection!=='my'))&&(!category||d.category===category)&&(!q||d.name.toLocaleLowerCase('ru-RU').includes(q)));
}
export const confidenceLabel=d=>d.dimensionsConfidence==='user-provided'?'user-provided · ваши размеры':d.dimensionsConfidence==='estimated'?'estimated · есть оценочные размеры':d.dimensionStatus==='Measured'?'Размеры пользователя':'Estimated · оценка по фото';
export function setDimension(item,key,value){
 item[key]=value;
 if(item.collection==='my'){
  item.dimensionConfidence={...(item.dimensionConfidence||{}),[key]:'user-provided'};
  item.dimensionsConfidence=Object.values(item.dimensionConfidence).some(v=>v==='estimated')?'estimated':'user-provided';
  item.dimensionStatus=item.dimensionsConfidence==='estimated'?'Estimated':'Measured';
 }else item.dimensionStatus='Measured';
}
