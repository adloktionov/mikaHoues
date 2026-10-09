import type {ProjectDocument} from './types';
import {clone,validateProject} from './project';
export class History {
 private past:ProjectDocument[]=[];private future:ProjectDocument[]=[];current:ProjectDocument;
 constructor(document:ProjectDocument){this.current=validateProject(document);}
 get canUndo(){return this.past.length>0;}get canRedo(){return this.future.length>0;}
 apply(_label:string,mutate:(document:ProjectDocument)=>void){const next=clone(this.current);mutate(next);next.revision=this.current.revision+1;next.updatedAt=new Date().toISOString();const valid=validateProject(next);this.past.push(this.current);if(this.past.length>100)this.past.shift();this.future=[];return this.current=valid;}
 undo(){if(this.canUndo){this.future.push(this.current);const prev=this.past.pop()!;prev.revision=this.current.revision+1;this.current=prev;}return clone(this.current);}
 redo(){if(this.canRedo){this.past.push(this.current);const next=this.future.pop()!;next.revision=this.current.revision+1;this.current=next;}return clone(this.current);}
}
