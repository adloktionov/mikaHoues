import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createProject, validateProject, duplicateVariant } from '../src/domain/project';
import { History } from '../src/domain/history';
import { Repository } from '../src/storage/database';

describe('project transactions', () => {
  it('starts without private apartment data and roundtrips a renamed project', () => {
    const p = createProject(); p.name = 'Мой дом';
    expect(validateProject(JSON.parse(JSON.stringify(p))).name).toBe('Мой дом');
    expect(p.rooms).toHaveLength(0); expect(p.variants[0].furniture).toHaveLength(0);
  });
  it('rejects future formats and nonfinite geometry before replacing a document', () => {
    const p = createProject(); expect(() => validateProject({...p, schemaVersion:999})).toThrow();
    expect(() => validateProject({...p, height: NaN})).toThrow();
  });
  it('undoes one command and clears redo after a divergent edit', () => {
    const h = new History(createProject()); h.apply('Название', p => {p.name='Первый';});
    h.apply('Название', p => {p.name='Второй';});
    expect(h.undo().name).toBe('Первый'); expect(h.redo().name).toBe('Второй');
    h.undo(); h.apply('Новое', p=>{p.name='Другой';}); expect(h.canRedo).toBe(false);
    expect(()=>h.apply('Ошибка',p=>{p.height=-1;})).toThrow(); expect(h.current.height).toBe(2.7);
  });
  it('copies variants without shared nested furniture references', () => {
    const p = createProject(); p.variants[0].name='Исходный'; const copy=duplicateVariant(p);
    copy.name='Копия'; expect(p.variants[0].name).toBe('Исходный'); expect(copy.id).not.toBe(p.variants[0].id);
  });
  it('persists projects and rejects a stale second writer', async () => {
    const r=new Repository('test-'+crypto.randomUUID()), p=createProject();
    const rev=await r.save(p,0); expect((await r.load(p.id))?.document.name).toBe('Новый проект');
    await r.save({...p,name:'Новая версия'},rev);
    await expect(r.save({...p,name:'Устаревшая версия'},rev)).rejects.toThrow(/изменён/);
    expect((await r.load(p.id))?.document.name).toBe('Новая версия'); await r.db.delete();
  });
});
