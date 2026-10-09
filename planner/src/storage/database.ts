import Dexie, {type Table} from 'dexie';
import type {ProjectDocument,AssetRecord} from '../domain/types';
import {validateProject} from '../domain/project';
interface Saved {id:string;document:ProjectDocument;version:number;updatedAt:string}
class Database extends Dexie {projects!:Table<Saved,string>;assets!:Table<AssetRecord,string>;constructor(name:string){super(name);this.version(1).stores({projects:'id,updatedAt',assets:'id'});}}
export class Repository {
 db:Database;constructor(name='house-planner-v1'){this.db=new Database(name);}
 async save(document:ProjectDocument,expectedVersion:number){const p=validateProject(document);return this.db.transaction('rw',this.db.projects,async()=>{const old=await this.db.projects.get(p.id);if((old?.version??0)!==expectedVersion)throw new Error('Проект изменён в другой вкладке. Сохраните копию или откройте актуальную версию.');const version=expectedVersion+1;await this.db.projects.put({id:p.id,document:p,version,updatedAt:new Date().toISOString()});return version;});}
 async load(id:string){const saved=await this.db.projects.get(id);if(saved)saved.document=validateProject(saved.document);return saved;}
 list(){return this.db.projects.orderBy('updatedAt').reverse().toArray();}
 remove(id:string){return this.db.projects.delete(id);}
}
