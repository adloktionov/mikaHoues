import {createFurniture as legacy} from './furniture.js';
import {createPersonalFurniture,supportsPersonalFurniture} from './personal-furniture.js';
export function createFurniture(item,onError){return supportsPersonalFurniture(item)&&!item.model?createPersonalFurniture(item):legacy(item,onError);}
