const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
const fail=()=>{throw new Error('Некорректный файл расстановки: проверьте версию, размеры и координаты.');};
function validMattress(d){const m=d.mattress;return m==null||(typeof m==='object'&&['width','depth','height'].every(k=>finite(m[k])&&m[k]>.01)&&m.width<=d.width&&m.depth+.07<=d.depth+1e-8&&m.height+.1<=d.height);}
function validDefinition(d){return d&&validPersonalMetadata(d)&&validMattress(d)&&['category','color','notes','dimensionStatus','thumbnail'].every(k=>d[k]==null||(typeof d[k]==='string'&&d[k].length<=5000))&&(d.color==null||/^#[0-9a-f]{6}$/i.test(d.color))&&typeof d.id==='string'&&d.id.length>0&&d.id.length<160&&typeof d.name==='string'&&d.name.length<=200&&['width','depth','height'].every(k=>finite(d[k])&&d[k]>.01&&d[k]<30)&&(d.model==null||(typeof d.model==='string'&&/^\/?models\/[\w /.-]+\.glb$/i.test(d.model)&&!d.model.includes('..')));}
export function validateLayout(raw){if(!raw||raw.version!==1||!Array.isArray(raw.objects)||!Array.isArray(raw.catalogue)||raw.objects.length>500||raw.catalogue.length>500)fail();const ids=new Set(),defs=new Set();for(const d of raw.catalogue){if(!validDefinition(d)||defs.has(d.id))fail();defs.add(d.id);}for(const o of raw.objects){if(!validDefinition(o)||ids.has(o.id)||!defs.has(o.catalogueId)||!Array.isArray(o.position)||o.position.length!==3||!o.position.every(v=>finite(v)&&Math.abs(v)<=100)||o.position[1]<0||(!finite(o.rotation)||Math.abs(o.rotation)>360000)||typeof o.visible!=='boolean'||!(o.room==null||typeof o.room==='string'))fail();ids.add(o.id);}return structuredClone({version:1,objects:raw.objects,catalogue:raw.catalogue});}
export function serializeLayout(objects,catalogue){return JSON.stringify(validateLayout({version:1,objects,catalogue}),null,2);}
export function createItem(d,position){return {...structuredClone(d),id:crypto.randomUUID(),catalogueId:d.id,position:[...position],rotation:0,room:null,visible:true};}
export function duplicateItem(item){return {...structuredClone(item),id:crypto.randomUUID(),position:[Math.max(-100,Math.min(100,item.position[0]+.2)),item.position[1],Math.max(-100,Math.min(100,item.position[2]+.2))]};}

export function layoutWithAddedItem(objects,catalogue,item,definition=null){if(objects.length>=500)throw new Error('В расстановке уже 500 предметов. Удалите предмет перед добавлением.');if(definition&&catalogue.length>=500)throw new Error('В каталоге уже 500 моделей. Можно добавить предмет из существующего каталога.');return validateLayout({version:1,objects:[...objects,item],catalogue:definition?[...catalogue,definition]:catalogue});}

function validPersonalMetadata(d){
 const confidence=v=>['estimated','user-provided'].includes(v);
 if(['modelType','collection','extraHeightConfidence','bodyHeightConfidence','bottleHeightConfidence'].some(k=>d[k]!=null&&(typeof d[k]!=="string"||d[k].length>200)))return false;
 if(d.dimensionsConfidence!=null&&!confidence(d.dimensionsConfidence))return false;
 if(d.quantityOwned!=null&&(!Number.isInteger(d.quantityOwned)||d.quantityOwned<0||d.quantityOwned>500))return false;
 if(['extraHeight','bodyHeight','bottleHeight','panelWidth','panelHeight'].some(k=>d[k]!=null&&(!finite(d[k])||d[k]<=0||d[k]>=30)))return false;
 if(d.height+(d.extraHeight||0)>=30)return false;
 if(d.dimensionConfidence!=null){if(typeof d.dimensionConfidence!=='object'||Array.isArray(d.dimensionConfidence))return false;for(const [k,v] of Object.entries(d.dimensionConfidence))if(!['width','depth','height'].includes(k)||!confidence(v))return false;}
 return true;
}
