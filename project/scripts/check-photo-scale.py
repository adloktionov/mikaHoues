"""Exploratory P09 single-view sensitivity, NOT survey calibration. Requires NumPy.
Mattress top: A/B head corners, C/D foot corners. D extrapolated beyond frame.
Window jamb bottom corners and room wall seams are manually read approximations.
Principal point assumed image centre, no lens distortion correction.
"""
import numpy as np
import json
from pathlib import Path
pixels=np.array([[104,652],[430,576],[674,704],[111,1098]],float)
metric=np.array([[0,0],[1.4,0],[1.4,2],[0,2]])
A=[];b=[]
for (x,y),(u,v) in zip(metric,pixels):
 A.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
 b.extend([u,v])
H=np.r_[np.linalg.solve(A,b),1].reshape(3,3)
results=[]
for focal in [440,460,480]:
 K=np.array([[focal,0,640],[0,focal,480],[0,0,1.]])
 B=np.linalg.inv(K)@H;l=2/(np.linalg.norm(B[:,0])+np.linalg.norm(B[:,1]))
 r1=B[:,0]*l;r2=B[:,1]*l
 U,S,V=np.linalg.svd(np.column_stack([r1,r2,np.cross(r1,r2)]));R=U@V;C=-R.T@(B[:,2]*l)
 for gap in [.1,.3,.5]:
  def project(uv):
   ray=R.T@np.linalg.inv(K)@np.array([*uv,1]);return C+((-gap-C[1])/ray[1])*ray
  width=abs(project([625,500])[0]-project([95,520])[0])
  window=abs(project([550,480])[0]-project([274,509])[0])
  results.append({'focalPx':focal,'assumedMattressHeadToWallGap':gap,'roomWindowWallWidth':round(width,3),'windowWidth':round(window,3)})
out={'status':'Exploratory, not calibrated; sensitivity intervals are not statistical confidence intervals','photo':'P09','mattressMetres':[1.4,2.0],'cornersPixels':pixels.tolist(),'fourthCornerExtrapolated':True,'results':results}
path=Path(__file__).resolve().parents[1]/'validation/photo-scale-sensitivity.json';path.write_text(json.dumps(out,indent=2))
print(json.dumps(out,indent=2))
