import type {AssetRecord} from '../domain/types';
export const qualityProfiles=[
 {level:1,name:'Минимальное',proxy:true,shadows:false,shadowSize:0,pixelRatio:1,ao:false},
 {level:2,name:'Лёгкое',proxy:false,shadows:false,shadowSize:0,pixelRatio:1,ao:false},
 {level:3,name:'Сбалансированное',proxy:false,shadows:true,shadowSize:1024,pixelRatio:1.25,ao:false},
 {level:4,name:'Высокое',proxy:false,shadows:true,shadowSize:2048,pixelRatio:1.5,ao:true},
 {level:5,name:'Максимальное',proxy:false,shadows:true,shadowSize:4096,pixelRatio:2,ao:true}
] as const;
export function getQuality(level:number){return qualityProfiles[Number.isFinite(level)?Math.max(0,Math.min(4,Math.round(level)-1)):2];}
export function assetRepresentation(level:number,asset:Pick<AssetRecord,'glb'|'lowGlb'>):'proxy'|'low'|'full'{if(level<=1)return 'proxy';if(level<=3)return asset.lowGlb?'low':'proxy';return asset.glb?'full':asset.lowGlb?'low':'proxy';}
