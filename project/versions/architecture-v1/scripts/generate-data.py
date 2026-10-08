"""Rebuild metric data from audited pixel trace and a shared fitted grid. No source edits."""
from pathlib import Path
import json,math,subprocess
BASE=Path(__file__).resolve().parents[1]
c=json.loads((BASE/'data/reconstruction-source.json').read_text());s=c['scale'];v=c['values']
def warp(q,axis):
 a=c['xAnchors'] if axis=='x' else c['yAnchors'];b=[n+next((v[k+1] for k,(ax,t) in enumerate(c['variables']) if ax==axis and t==n),0) for n in a]
 if q<a[0]:return q+b[0]-a[0]
 if q>a[-1]:return q+b[-1]-a[-1]
 for i in range(len(a)-1):
  if a[i]<=q<=a[i+1]:return b[i]+(b[i+1]-b[i])*(q-a[i])/(a[i+1]-a[i])
def xy(p):return [round((warp(p[0],'x')-246)*s,5),round((warp(p[1],'y')-236)*s,5)]
def pos(x,z,y=0):a=xy([x,z]);return [a[0],y,a[1]]
def area(p):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1])))/2
labels={'bedroom':'Спальня','living':'Большая комната','study':'Комната с диваном','kitchen':'Кухня','bathroom':'Ванная','balcony-west':'Лоджия 4,2','balcony-east':'Лоджия 4,3','wc':'Туалет по плану','hall':'Прихожая и коридор'}
rooms=[]
raw={**c['rooms'],'wc':([[334,873],[385,873],[385,1014],[334,1014]],None),'hall':([[475,489],[620,489],[620,855],[334,855],[334,753],[533,753],[533,735],[475,735]],None)}
for id,(p,A) in raw.items():
 poly=list(map(xy,p));a=area(poly)
 rooms.append({'id':id,'label':labels[id],'officialArea':A,'calculatedArea':round(a,5),'errorPercent':round((a/A-1)*100,3) if A else None,'polygon':poly,'floorHeight':0,'type':'balcony' if id.startswith('balcony') else 'living' if id in ['bedroom','living','study'] else id,'status':'Calculated','confidence':'MEDIUM','source':'official-floorplan.png; shared constrained grid','rawPixelPolygon':p,'rawAreaAtGlobalScale':round(area(p)*c['rawScale']**2,4),'color':{'bedroom':'#b4b5c1','living':'#d6c3a7','study':'#bbc5c2','kitchen':'#d9c6ae','bathroom':'#abc0c6','wc':'#b8c5bf','hall':'#d9d4a8'}.get(id,'#c3c8b6')})
# Centre-lines from the raster; thick and thin wall families retained separately.
W=[('north',[246,236],[953,236],18,'exterior'),('east-loggia-north',[953,236],[1049,236],10,'exterior'),('bedroom-west',[246,236],[246,489],18,'exterior'),('bedroom-living',[546,236],[546,489],18,'partition'),('bedroom-south',[246,489],[546,489],18,'partition'),('living-south',[546,489],[953,489],18,'exterior'),('living-east',[953,236],[953,489],18,'facade'),('study-west',[246,489],[246,744],18,'facade'),('study-east',[471,489],[471,744],8,'partition'),('middle',[139,744],[533,744],18,'partition'),('hall-east',[629,489],[629,864],18,'exterior'),('entry',[330,864],[629,864],18,'exterior'),('kitchen-east',[330,744],[330,1023],8,'partition'),('wc-bath',[389,864],[389,1023],8,'partition'),('bath-east',[526,864],[526,1023],18,'exterior'),('south',[139,1023],[526,1023],18,'exterior'),('bay-upper',[139,744],[51,802],12,'exterior'),('bay-front',[51,802],[51,968],12,'exterior'),('bay-lower',[51,968],[139,1023],12,'exterior'),('west-loggia-south',[116,744],[246,744],10,'exterior'),('west-loggia-front',[116,591],[116,744],10,'exterior'),('west-loggia-diagonal',[116,591],[246,475],10,'exterior'),('east-loggia-front',[1049,236],[1049,405],10,'exterior'),('east-loggia-diagonal',[1049,405],[1110,435],10,'exterior'),('east-loggia-tip',[1110,435],[1110,475],10,'exterior'),('east-loggia-south',[953,475],[1110,475],10,'exterior')]
walls=[{'id':id,'a':xy(a),'b':xy(b),'thickness':round(t*s,5),'type':typ,'confidence':'MEDIUM','status':'Calculated','thicknessStatus':'Estimated','thicknessFactor':1,'rawPixelLine':[a,b]} for id,a,b,t,typ in W]
wallBy={w['id']:w for w in walls}
def opening(id,wall,point,widthPx,typ,rooms,confidence='MEDIUM',sill=0,height=2.1,direction=1):
 w=wallBy[wall];p=xy(point);a=w['a'];b=w['b'];L=math.dist(a,b);t=((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/L
 return {'id':id,'wall':wall,'position':round(t,5),'width':round(widthPx*s,5),'height':height,'sillHeight':sill,'openingDirection':direction,'confidence':confidence,'status':'Calculated' if confidence=='MEDIUM' else 'Estimated','type':typ,'connects':rooms,'heightStatus':'Estimated'}
doors=[opening('bedroom-door','bedroom-south',[507,489],54,'door',['bedroom','hall']),opening('living-door','living-south',[597,489],56,'door',['living','hall']),opening('study-door','study-east',[471,619],108,'double',['study','hall']),opening('kitchen-door','kitchen-east',[330,832],52,'glazed',['kitchen','hall']),opening('wc-door','entry',[359,864],48,'door',['wc','hall']),opening('bath-door','entry',[453,864],52,'door',['bathroom','hall']),opening('front-door','entry',[580,864],67,'entrance',['hall','outside']),opening('west-balcony-door','study-west',[246,680],56,'glazed',['study','balcony-west']),opening('east-balcony-door','living-east',[953,412],54,'glazed',['living','balcony-east'])]
for door in doors:
 if door['id']=='kitchen-door':door.update(glazingStatus='Confirmed',glazingSource='P12',glazingDimensionsStatus='Estimated')
 door['hinge']='end' if door['id'] in ['bedroom-door','bath-door','front-door','west-balcony-door','east-balcony-door'] else 'start'
 door['openingDirection']=-1 if door['id'] in ['study-door','kitchen-door','east-balcony-door'] else 1
 door['swingStatus']='Estimated'
windows=[opening('bedroom-window','bedroom-west',[246,355],145,'window',['bedroom','outside'],sill=.85,height=1.45),opening('study-window','study-west',[246,588],112,'window',['study','balcony-west'],sill=.85,height=1.45),opening('living-window','living-east',[953,331],101,'window',['living','balcony-east'],sill=.85,height=1.45)]
for id,w,pt,width,conn in [('kitchen-bay-main','bay-front',[51,885],128,['kitchen','outside']),('kitchen-bay-upper','bay-upper',[94,774],70,['kitchen','outside']),('kitchen-bay-lower','bay-lower',[94,995],70,['kitchen','outside']),('west-loggia-glass','west-loggia-front',[116,670],122,['balcony-west','outside']),('west-loggia-angle-glass','west-loggia-diagonal',[181,533],137,['balcony-west','outside']),('east-loggia-glass','east-loggia-front',[1049,320],139,['balcony-east','outside']),('east-loggia-angle-glass','east-loggia-diagonal',[1079,420],48,['balcony-east','outside'])]:windows.append(opening(id,w,pt,width,'window',conn,'LOW',sill=.85,height=1.45))
windows[0].update(paneCount=3,paneCountStatus='Confirmed',paneCountSource='P09',paneWidthsStatus='Estimated')
# Dimensioned proxies are estimates of existing furniture, not measured personal furniture.
cat=[]
def defn(id,name,category,w,d,h,color,notes='Габариты оценены по фото; замените реальным замером.',model=None):
 item={'id':id,'name':name,'category':category,'width':w,'depth':d,'height':h,'model':model,'thumbnail':None,'notes':notes,'color':color,'dimensionStatus':'Estimated'};cat.append(item);return item
for args in [('bed','Кровать · матрас 140×200','bed',1.46,2.08,.85,'#e2dccc'),('sofa','Серый диван','sofa',2.2,.9,.85,'#68716d'),('wardrobe','Шкаф','wardrobe',1.8,.6,2.3,'#dbd6c7'),('dresser','Белый комод','dresser',.8,.45,1,'#eeede7'),('low-cabinet','Низкая тумба','cabinet',1.6,.4,.45,'#aca69d'),('table','Обеденный стол','table',.8,.6,.75,'#dfd5c3'),('chair','Стул','chair',.48,.52,.87,'#b39b94'),('fridge','Холодильник','fridge',.6,.65,1.95,'#e3e5df'),('piano','Пианино — пример','piano',1.36,.4,.78,'#343b3e')]:defn(*args)
cat[-1]['notes']='Пример из задания, не подтверждённый предмет пользователя. Замените размеры.'
cat[0]['mattress']={'width':1.4,'depth':2.0,'height':.18,'status':'Confirmed','confidence':'HIGH','heightStatus':'Estimated','source':'Размер матраса сообщён пользователем 2026-09-30'}
cat[0]['notes']='Матрас 140 × 200 см — подтверждён пользователем. Наружный каркас 146 × 208 × 85 см и толщина матраса 18 см — допущения, требуют замера.'
by={i['id']:i for i in cat};mov=[]
def item(id,definition,x,z,rotation=0,room=None):
 mov.append(dict(by[definition],id=id,catalogueId=definition,position=pos(x,z),rotation=rotation,room=room,visible=True))
item('existing-bed','bed',380,400,90,'bedroom');item('existing-low','low-cabinet',375,275,0,'bedroom');item('existing-sofa','sofa',355,530,0,'study');item('existing-dresser','dresser',300,715,180,'study');item('existing-wardrobe','wardrobe',641,273,0,'living');item('existing-table','table',220,790,0,'kitchen');item('existing-chair-1','chair',173,790,90,'kitchen');item('existing-chair-2','chair',271,790,270,'kitchen');item('existing-fridge','fridge',286,834,90,'kitchen')
# Bedroom headboard near the window wall and side near lower plan wall, as in P09. Position remains estimated.
br=next(r for r in rooms if r['id']=='bedroom')['polygon']
mov[0]['position']=[round(min(p[0] for p in br)+2.08/2+.26,5),0,round(max(p[1] for p in br)-1.46/2-.05,5)]
fixed=[]
def fx(id,name,category,w,d,h,x,z,rotation=0,y=0,color='#e8e4d8',confidence='LOW'):
 fixed.append({'id':id,'name':name,'category':category,'width':w,'depth':d,'height':h,'position':pos(x,z,y),'rotation':rotation,'color':color,'confidence':confidence,'status':'Estimated'})
fx('kitchen-run','Кухонные нижние шкафы','kitchen',2.3,.6,.9,218,987,180)
fx('kitchen-return','Кухонный возврат','kitchen',1.55,.6,.9,292,911,270)
fx('kitchen-upper','Навесные шкафы','upper',2.15,.36,.75,220,1001,180,1.48)
fx('kitchen-oven','Пенал с духовкой','oven',.6,.6,2.3,102,926,90)
fx('bath','Ванна','bath',1.65,.7,.6,448,988,0,color='#eeeeea')
fx('vanity','Раковина и столешница','sink',.6,.5,.85,414,896,90)
fx('washer','Стиральная машина','washer',.6,.5,.85,414,938,90)
fx('bath-toilet','Унитаз на фото P08','toilet',.38,.61,.8,471,898,180,confidence='MEDIUM')
fx('wc','Унитаз по плану','toilet',.38,.62,.8,358,980,0)
fx('hall-closet','Шкаф в прихожей','wardrobe',1.7,.55,2.5,525,819,0,color='#c9c5b7')
# P11 shows the wardrobe along the north side of the entry-to-kitchen passage.
# Preserve its estimated size; align its back with the existing middle wall.
closet=fixed[-1];middle=wallBy['middle']
closet['position']=[3.07,0,middle['a'][1]+middle['thickness']/2+closet['depth']/2+.03]
closet['placementSource']='P10/P11/P15; wall association confirmed, exact offset Estimated'
fx('plan-niche','Ниша у кухни','cabinet',.8,.42,2.2,366,778,0)
for id,x,z,w,rot in [('bed',262,355,1,90),('study',262,583,1,90),('living',939,331,1,90),('kitchen',68,886,.8,90)]:fx('radiator-'+id,'Радиатор','radiator',w,.13,.55,x,z,rot,.18,color='#f2f2e9')
for r in rooms:
 if r['type']=='balcony':continue
 p=r['polygon'];cx=sum(v[0] for v in p)/len(p);cz=sum(v[1] for v in p)/len(p)
 fixed.append({'id':'light-'+r['id'],'name':'Потолочный светильник','category':'light','width':.35,'depth':.35,'height':.08,'position':[cx,2.61,cz],'rotation':0,'color':'#fff8d9','confidence':'LOW','status':'Estimated'})
manifest=json.loads((BASE/'data/photo-manifest.json').read_text())
# Approximate cameras: raw pixel position -> metric, height measured from floor. Directions map visual evidence, not compass bearings.
photoInfo=[
('bathroom',[501,889],[420,987],83,'Вид от двери на ванну, раковину и стиральную машину.','MEDIUM'),
('study',[448,712],[254,565],76,'От входа к балконному блоку; диван вдоль верхней стены плана.','HIGH'),
('balcony-west',[220,703],[133,560],85,'Остекление и скошенная грань. Отнесение к лоджии 4,2 предварительное.','LOW'),
('kitchen',[232,852],[292,987],87,'Угол Г-образной кухни, мойка, варочная поверхность.','HIGH'),
('study',[269,520],[422,707],87,'Обратный вид: вход слева, комод и балконный блок справа.','HIGH'),
('kitchen',[254,840],[60,888],76,'Кухня от входа: гарнитур слева, стол справа, окно впереди. Эркер на плане не подтверждается фото.','MEDIUM'),
('kitchen',[254,877],[74,948],82,'Кухонный гарнитур, пенал и окно.','MEDIUM'),
('bathroom',[502,984],[424,888],83,'Стиральная машина, унитаз, короб и полотенцесушитель. Точное место короба неизвестно.','MEDIUM'),
('bedroom',[513,462],[263,340],79,'Кровать слева, окно прямо, низкая тумба справа.','HIGH'),
('hall',[568,523],[590,853],79,'В сторону входной двери. Двери комнат справа в кадре.','HIGH'),
('hall',[598,833],[300,837],79,'От входа к кухне, зеркальный шкаф справа.','HIGH'),
('kitchen',[141,925],[308,847],80,'Обратный ракурс: стол, холодильник и дверь.','HIGH'),
('living',[909,281],[582,455],82,'Обратный вид: вход, шкаф и стена с орнаментом.','HIGH'),
('living',[588,455],[937,326],78,'К балконному блоку; дверь справа от окна, шкаф слева.','HIGH'),
('hall',[573,825],[570,494],77,'В противоположную от входа сторону: двери трёх комнат.','HIGH'),
('balcony-east',[978,448],[1042,278],87,'Панорамное остекление; отнесение к лоджии 4,3 предварительное.','LOW')]
photos=[]
for m,(room,at,target,fov,note,conf) in zip(manifest,photoInfo):
 photos.append(dict(m,room=room,position=pos(*at,1.55),target=pos(*target,1.3),fov=fov,status='Estimated',confidence=conf,visibleSurfaces=note,url='/references/'+m['id']+'.webp'))
photoQA=json.loads((BASE/'data/photo-qa.json').read_text())
for photo in photos:
 photo['roomAssignmentConfidence']=photo['confidence'];photo['confidence']='LOW';photo['qa']=photoQA[photo['id']]
parameters={'ceilingHeight':{'value':2.7,'unit':'m','status':'Estimated','confidence':'LOW'},'doorHeight':{'value':2.1,'unit':'m','status':'Estimated','confidence':'LOW'},'windowHeight':{'value':1.45,'unit':'m','status':'Estimated','confidence':'LOW'},'sillHeight':{'value':.85,'unit':'m','status':'Estimated','confidence':'LOW'},'wallThicknessFactor':{'value':1,'unit':'multiplier','status':'Estimated','confidence':'LOW'}}
uncertainties=[{'id':'scale','label':'Масштаб и длины стен','status':'Calculated','confidence':'MEDIUM','detail':'Единый масштаб по семи площадям, совместная поправка общих линий стен до 16 px (~23 см). Нужен контрольный размер.'},{'id':'height','label':'Высота потолка','status':'Estimated','confidence':'LOW','detail':'2,70 м — редактируемое допущение, не замер.'},{'id':'kitchen-window','label':'Кухня: окно и эркер','status':'Unknown','confidence':'LOW','detail':'План показывает гранёный фасад; фото P06–P07 — одно плоское окно. Сохранён контур плана; боковое остекление предположительное.'},{'id':'bathroom-layout','label':'Туалет и ванная','status':'Unknown','confidence':'LOW','detail':'P08 показывает унитаз рядом со стиральной машиной в ванной. Наличие и конфигурация отдельного WC после ремонта не подтверждены. Перегородка сохранена по плану.'},{'id':'balcony-assignment','label':'Фотографии лоджий','status':'Estimated','confidence':'LOW','detail':'P03 → 4,2 и P16 → 4,3 — предварительное сопоставление по скошенным граням; нет проходного ракурса.'},{'id':'openings','label':'Проёмы и толщина стен','status':'Calculated / Estimated','confidence':'MEDIUM','detail':'Положение по плану, высота и толщина по предположению. Двухстворчатый проём комнаты 11,1 м² требует проверки.'},{'id':'total-area','label':'Что включено в 76,4 м²','status':'Unknown','confidence':'LOW','detail':'Число читается, но учёт лоджий в этой общей площади не пояснён. Не используется как независимое ограничение.'}]
uncertainties.extend([{'id':'hall-portal','label':'Сужение/портал в прихожей','status':'Unknown','confidence':'LOW','detail':'Видно на P10, но точные координаты, ширина и глубина по схеме не определяются. В Architecture v1 не добавлен вымышленный обмер.'},{'id':'photo-match','label':'Камеры и совпадение с фото','status':'Estimated','confidence':'LOW','detail':'Все 16 ракурсов проверены в формате 4:3. Ни один не имеет метрической калибровки. P03/P06/P07/P08/P10/P16 содержат нерешённые геометрические расхождения.'}])
data={'schemaVersion':1,'apartment':{'label':'Квартира · 76,4 м²','officialTotalArea':76.4,'officialLivingArea':44.8,'roomCount':3,'units':'metres','coordinateSystem':'Y up, X right and Z down on source plan; origin pixel (246,236). No geographic north inferred.','parameters':parameters,'scaleMetresPerPixel':s,'geometryStatus':'Calculated','sourceImageSize':[1135,1386]},'rooms':rooms,'walls':walls,'doors':doors,'windows':windows,'balconies':[r['id'] for r in rooms if r['type']=='balcony'],'fixedFurniture':fixed,'movableFurniture':mov,'materials':{'wall':'#ede9df','wood':'#9f7653','tile':'#d4d6ca','hallWall':'#e1dca3'},'uncertainties':uncertainties,'photoCameras':photos}
finishes=[]
for wall,side,style in [('hall-east',1,'hall'),('study-east',-1,'hall'),('entry',-1,'hall'),('bedroom-living',1,'bedroom'),('bedroom-west',-1,'bedroom'),('bath-east',1,'tile'),('wc-bath',-1,'tile'),('west-loggia-front',-1,'balcony'),('west-loggia-diagonal',1,'balcony'),('east-loggia-front',1,'balcony')]:
 finishes.append({'wall':wall,'side':side,'style':style})
for wall,side,style,a,b in [('north',1,'bedroom',[246,236],[546,236]),('north',1,'wallpaper',[546,236],[953,236]),('kitchen-east',-1,'hall',[330,744],[330,864]),('entry',1,'tile',[389,864],[526,864]),('south',-1,'tile',[389,1023],[526,1023])]:
 w=wallBy[wall];finishes.append({'wall':wall,'side':side,'style':style,'start':math.dist(w['a'],xy(a)),'end':math.dist(w['a'],xy(b))})
data['materials']['finishes']=finishes
data['apartment']['architectureVersion']='Architecture v1'
data['apartment']['geometryQA']='2026-09-30; physical inner wall faces; photo poses Estimated'
data['apartment']['controlMeasurements']=[{'object':'existing-bed','component':'mattress','width':1.4,'depth':2.0,'unit':'m','status':'Confirmed','confidence':'HIGH','source':'Пользователь, 2026-09-30','scope':'Матрас; не наружный габарит кровати и не размер комнаты'}]
(BASE/'data/apartment-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(BASE/'data/furniture.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2))


subprocess.run(['node',str(BASE/'scripts/reconcile-rooms.js')],check=True)
