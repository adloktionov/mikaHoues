"""Regenerate current area/opening tables and plan overlay, keeping v1 and v2 reports intact."""
from pathlib import Path
import json,math,base64,html,csv
B=Path(__file__).resolve().parents[1]
d=json.loads((B/'data/apartment-data.json').read_text())
V=B/'validation/revision-v3';V.mkdir(exist_ok=True)
s=d['apartment']['scaleMetresPerPixel']
svg='<svg xmlns="http://www.w3.org/2000/svg" width="1135" height="1386" viewBox="0 0 1135 1386"><image href="data:image/png;base64,'+base64.b64encode((B/'public/references/official-floorplan.png').read_bytes()).decode()+'" width="1135" height="1386"/>'
for r in d['rooms']:
    pts=' '.join(f'{p[0]/s+246:.3f},{p[1]/s+236:.3f}' for p in r['polygon'])
    svg+=f'<polygon points="{pts}" fill="{r["color"]}" fill-opacity="0.28" stroke="#9b4737" stroke-width="2.5"><title>{html.escape(r["label"])}: {r["calculatedArea"]:.3f} м²</title></polygon>'
(B/'public/references/plan-overlay.svg').write_text(svg+'</svg>')
with (V/'wall-and-opening-dimensions.csv').open('w') as f:
    w=csv.writer(f);w.writerow(['kind','id','wall','length_or_width_m','thickness_m','offset_from_wall_start_m','height_m','status'])
    for a in d['walls']:w.writerow(['wall',a['id'],'',math.dist(a['a'],a['b']),a['thickness'],'',2.7,'Calculated/Estimated'])
    for a in d['doors']+d['windows']:w.writerow([a['type'],a['id'],a['wall'],a['width'],'',a['position'],a['height'],'Calculated/Estimated'])
(V/'area-comparison.json').write_text(json.dumps([{k:r.get(k) for k in ['id','label','officialArea','calculatedArea','errorPercent','areaBasis']} for r in d['rooms']],ensure_ascii=False,indent=2)+'\n')
