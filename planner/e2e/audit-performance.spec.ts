import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';

test('audit measured multi-room workloads on all quality levels',async({page})=>{
 test.setTimeout(120000);await page.goto('/');
 const data=await page.evaluate(async()=>{
  const {PlannerScene}=await import('/src/render/scene.ts'),{createProject}=await import('/src/domain/project.ts'),{rectangle}=await import('/src/domain/geometry.ts'),{createFurniture}=await import('/src/domain/furniture.ts');
  const host=document.createElement('div');host.style.cssText='position:fixed;width:900px;height:600px;top:0;left:0;opacity:0;pointer-events:none';document.body.append(host);
  let latest:any;const samples:number[]=[];const scene=new PlannerScene(host,{select:()=>{},move:()=>{},stats:s=>{latest=s;samples.push(s.frameMs);}});const rows=[];
  try{for(const [name,roomCount,count] of [['Small',1,6],['Typical',5,40],['Heavy',5,160]] as const){
   const p=createProject();p.rooms=Array.from({length:roomCount},(_,i)=>rectangle('r'+i,'R'+i,10,20,i*10.12,0));
   p.variants[0].furniture=Array.from({length:count},(_,i)=>{const f=createFurniture('wardrobe'),room=i%roomCount,local=Math.floor(i/roomCount);f.x=room*10.12+1+(local%4)*2.3;f.z=1+Math.floor(local/4)*2.3;return f;});
   for(const level of [1,2,3,4,5]){const started=performance.now();scene.setQuality(level);scene.update(p);scene.fit();for(let i=0;i<5;i++){scene.invalidate();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}const loadAndWarmupMs=performance.now()-started;samples.length=0;const intervals=[];let previous=performance.now();for(let i=0;i<12;i++){scene.invalidate();await new Promise(requestAnimationFrame);const now=performance.now();intervals.push(now-previous);previous=now;}samples.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);
    rows.push({name,rooms:roomCount,count,quality:level,loadAndWarmupMs,cpuMedianMs:samples[Math.floor(samples.length/2)],frameIntervalMedianMs:intervals[6],...latest});
   }
  }return {recordedAt:new Date().toISOString(),userAgent:navigator.userAgent,viewport:[900,600],notes:'CPU submission timing, not GPU execution. RAF interval is not guaranteed FPS. Local Chrome headless; no weak-device or physical trackpad claim.',rows};
  }finally{scene.dispose();host.remove();}
 });
 expect(data.rows).toHaveLength(15);expect(data.rows.every(r=>Number.isFinite(r.cpuMedianMs)&&r.triangles>0)).toBe(true);
 writeFileSync('benchmarks/audit-results.json',JSON.stringify(data,null,2));
});
