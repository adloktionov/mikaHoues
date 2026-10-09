import {it,expect} from 'vitest';
import {createProject} from '../src/domain/project';
import {buildLights,disposeLights} from '../src/render/lighting';
it('keeps light position, direction and color, limiting only shadow quality',()=>{
 const p=createProject();p.lighting.lights=[{id:'lamp',name:'Spot',type:'spot',x:2,y:2.4,z:3,targetX:2,targetY:0,targetZ:4,color:'#ffbb88',intensity:60,angle:.5}];const before=JSON.stringify(p);const high=buildLights(p.lighting.lights,5),light:any=high.children.find(o=>o.name==='lamp');expect(light.position.toArray()).toEqual([2,2.4,3]);expect(light.target.position.toArray()).toEqual([2,0,4]);expect(light.color.getHexString()).toBe('ffbb88');expect(light.castShadow).toBe(true);const low=buildLights(p.lighting.lights,1);expect(low.children).toHaveLength(0);expect(JSON.stringify(p)).toBe(before);disposeLights(high);disposeLights(low);
});
