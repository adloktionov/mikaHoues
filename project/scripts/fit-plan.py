import math,json
from pathlib import Path
P={
'bedroom':([[255,245],[537,245],[537,480],[255,480]],14.8),
'living':([[555,245],[944,245],[944,480],[555,480]],18.9),
'study':([[255,498],[467,498],[467,735],[255,735]],11.1),
'kitchen':([[142,753],[326,753],[326,1014],[142,1014],[60,963],[60,807]],12.9),
'bathroom':([[393,873],[517,873],[517,1014],[393,1014]],3.9),
'balcony-west':([[124,595],[237,485],[237,735],[142,735],[124,746]],4.2),
'balcony-east':([[962,241],[1044,241],[1044,408],[1105,438],[1105,470],[962,470]],4.3)}
def area(poly): return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(poly,poly[1:]+poly[:1])))/2
xs=[51,116,139,246,330,389,471,526,546,629,953,1049,1110];ys=[236,489,744,864,1023]
# fit global shared architectural grid, not per-room transforms
variables=[('x',116),('x',471),('x',330),('x',546),('x',953),('y',489),('y',744),('y',1023),('y',864)]
def mapping(q,axis,vals):
 a=xs if axis=='x' else ys
 b=[v+next((vals[k+1] for k,(ax,n) in enumerate(variables) if ax==axis and n==v),0) for v in a]
 if q<a[0]: return q+b[0]-a[0]
 if q>a[-1]: return q+b[-1]-a[-1]
 for i in range(len(a)-1):
  if a[i]<=q<=a[i+1]:return b[i]+(b[i+1]-b[i])*(q-a[i])/(a[i+1]-a[i])
def poly(p,v):return [[mapping(x,'x',v),mapping(y,'y',v)] for x,y in p]
rawq=sum(area(p)/A for p,A in P.values())/sum((area(p)/A)**2 for p,A in P.values())
v=[math.sqrt(rawq)]+[0]*len(variables)
def loss(v):
 # target precision 2%; regularization reflects ~12 px line/schematic uncertainty
 return sum(((area(poly(p,v))*v[0]**2/A-1)/.02)**2 for p,A in P.values())+sum((d/12)**2 for d in v[1:])
for step in [1,.5,.2,.1,.04,.01,.002]:
 for _ in range(600):
  improve=False
  for k in range(len(v)):
   inc=step*(.00002 if k==0 else 1)
   opts=[]
   for sign in [-1,1]:
    vv=v.copy();vv[k]+=sign*inc
    if k and abs(vv[k])>16:continue
    opts.append((loss(vv),vv))
   best=min(opts,key=lambda o:o[0])
   if best[0]<loss(v): v=best[1];improve=True
  if not improve: break
print('raw scale',math.sqrt(rawq),'fit',v[0], 'adjustments',list(zip(variables,v[1:])))
for n,(p,A) in P.items():print(n,round(area(p)*rawq,3), round((area(p)*rawq/A-1)*100,2),'->',round(area(poly(p,v))*v[0]**2,3),round((area(poly(p,v))*v[0]**2/A-1)*100,2))
(Path(__file__).resolve().parents[1]/'data/reconstruction-source.json').write_text(json.dumps({'scale':v[0],'rawScale':math.sqrt(rawq),'variables':variables,'values':v,'xAnchors':xs,'yAnchors':ys,'rooms':P},indent=2))
