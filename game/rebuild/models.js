import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import flagCloth from './flag-cloth.js';
import {SHAPES} from './track.js';
export const PALETTE={road:0x526575,cream:0xf2deb6,stone:0xc6bb9e,rose:0xdba28c,navy:0x15334f,blue:0x54b4e2,white:0xfff4d6,gold:0xf6bf32,orange:0xe85f34,green:0x558c57,leaf:0x739d43,dark:0x182a37,brown:0x65503c,red:0xd95139};
const cache=new Map();export function material(color,options={}){const key=color+JSON.stringify(options);if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness:.8,...options}));return cache.get(key);}
export const flagClock={value:0};
export const artMaterials={foliage:material(0xffffff,{name:'foliage',side:T.DoubleSide,alphaTest:.35,roughness:1}),walls:[0,1,2,3].map(i=>material(0xffffff,{name:'city-surface-'+i}))};
export function installArt(foliage,surface){artMaterials.foliage.map=foliage;artMaterials.foliage.needsUpdate=true;for(let i=0;i<4;i++){const tile=surface.clone();tile.offset.set((i%2)*.5,i<2?.5:0);tile.repeat.set(.5,.5);tile.needsUpdate=true;artMaterials.walls[i].map=tile;artMaterials.walls[i].needsUpdate=true;}}
function clothMaterial(color){const m=material(color,{name:'flag-'+color,side:T.DoubleSide});m.onBeforeCompile=s=>{s.uniforms.flagTime=flagClock;s.vertexShader='uniform float flagTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(uv.x*5.5+position.z*.13+flagTime*3.2)*.20*uv.x; transformed.y+=sin(uv.x*4.0+flagTime*2.5)*.055*uv.x;');};return m;}
export const propArt={bus:material(0xffffff,{name:'bus-surfaces',roughness:.48,metalness:.08}),hazards:material(0xffffff,{name:'hazard-surfaces',roughness:.83})};
export function installPropArt(bus,hazards){for(const [key,texture]of [['bus',bus],['hazards',hazards]]){propArt[key].map=texture;propArt[key].needsUpdate=true;}}
// UV regions use bottom-left texture coordinates. Insets keep atlas neighbors
// from bleeding into thin faces at mip levels. Geometry still owns silhouette.
const BUS_UV={side:[.008,.758,.984,.234],front:[.008,.258,.484,.484],rear:[.508,.258,.484,.484],roof:[.008,.008,.984,.234],glass:[.036,.46,.42,.215]};
const HAZARD_UV={warning:[.008,.508,.484,.484],orange:[.508,.508,.484,.484],concrete:[.008,.008,.484,.484],green:[.508,.008,.484,.484]};
function regionGeometry(geometry,region,{rotate=false,flip=false}={}){const g=geometry.clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){let u=uv.getX(i),v=uv.getY(i);if(rotate)[u,v]=[v,1-u];if(flip)u=1-u;uv.setXY(i,region[0]+u*region[2],region[1]+v*region[3]);}return g;}
function roundedShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
const softBoxGeo=new T.ExtrudeGeometry(roundedShape(.92,.92,.065),{depth:.92,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:4});softBoxGeo.translate(0,0,-.46);
{const p=softBoxGeo.attributes.position,n=softBoxGeo.attributes.normal,uv=softBoxGeo.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));const u=ax>ay&&ax>az?p.getZ(i):p.getX(i),v=ay>ax&&ay>az?p.getZ(i):p.getY(i);uv.setXY(i,Math.max(0,Math.min(1,u+.5)),Math.max(0,Math.min(1,v+.5)));}}
function softBox(p,mat,x,y,z,w,h,d){return mesh(softBoxGeo,mat,p,x,y,z,w,h,d);}
function face(p,mat,region,x,y,z,w,h,rotation=0,rotateUV=false){const geo=new T.ShapeGeometry(roundedShape(w,h,Math.min(w,h)*.065),5),pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+w/2)/w,(pos.getY(i)+h/2)/h);const o=mesh(regionGeometry(geo,region,{rotate:rotateUV}),mat,p,x,y,z);o.rotation.y=rotation;return o;}
function tileBox(p,tile,x,y,z,w,h,d){return mesh(regionGeometry(softBoxGeo,HAZARD_UV[tile]),propArt.hazards,p,x,y,z,w,h,d);}
function warning(p,x,y,z,w,h){const region=HAZARD_UV.warning.slice(),height=region[3]*Math.min(1,h/w);region[1]+=(region[3]-height)/2;region[3]=height;return face(p,propArt.hazards,region,x,y,z,w,h);}
const shadowPixels=new Uint8Array(48*48*4);for(let y=0;y<48;y++)for(let x=0;x<48;x++){const i=(y*48+x)*4,d=Math.max(Math.abs((x+.5)/24-1),Math.abs((y+.5)/24-1));shadowPixels[i]=shadowPixels[i+1]=shadowPixels[i+2]=255;shadowPixels[i+3]=Math.round(255*Math.min(1,Math.max(0,(1-d)/.40))**2);}
const shadowTexture=new T.DataTexture(shadowPixels,48,48);shadowTexture.needsUpdate=true;shadowTexture.magFilter=shadowTexture.minFilter=T.LinearFilter;
export const contactShadowMaterial=new T.MeshBasicMaterial({name:'soft-contact-shadow',map:shadowTexture,color:0x061322,transparent:true,opacity:.42,depthWrite:false});
function softShadow(p,z,width,length){const o=mesh(new T.PlaneGeometry(width,length),contactShadowMaterial,p,0,.023,z);o.rotation.x=-Math.PI/2;return o;}
function busWheels(p,width,length,r=.43){for(const side of[-1,1])for(const z of[-1.9,-length+2.1]){const tire=mesh(new T.TorusGeometry(r-.105,.105,8,24),material(0x141b23,{roughness:.95}),p,side*(width/2-.11),r,z);tire.rotation.y=Math.PI/2;const hub=cylinder(p,0xaeb8c0,side*(width/2-.008),r,z,r*.52,.035);hub.rotation.z=Math.PI/2;for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ball(p,0x344756,side*(width/2+.01),r+Math.sin(a)*r*.30,z+Math.cos(a)*r*.30,.018,.023,.023);}}}
function mesh(g,mat,p,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o;}
const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.SphereGeometry(1,10,7),cylinderGeo=new T.CylinderGeometry(1,1,1,16);
function box(p,c,x,y,z,w,h,d){return mesh(boxGeo,material(c),p,x,y,z,w,h,d);}
function ball(p,c,x,y,z,w,h,d){return mesh(sphereGeo,material(c),p,x,y,z,w,h,d);}
function cylinder(p,c,x,y,z,r,h){return mesh(cylinderGeo,material(c),p,x,y,z,r,h,r);}
function arch(p,x,y,z,w,h,color){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.closePath();const m=new T.Mesh(new T.ShapeGeometry(s,8),material(color));m.position.set(x,y,z);p.add(m);return m;}
export function bake(group){group.updateMatrixWorld(true);const by=new Map();group.traverse(o=>{if(!o.isMesh)return;const geom=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geom.applyMatrix4(o.matrixWorld);const key=o.material.uuid;if(!by.has(key))by.set(key,{material:o.material,geometry:[]});by.get(key).geometry.push(geom);});return [...by.values()].map(v=>({material:v.material,geometry:mergeGeometries(v.geometry,false)}));}
function stripes(p,x,y,z,w,h){for(let j=0;j<5;j++){const b=box(p,j%2?PALETTE.white:PALETTE.red,x-w/2+(j+.5)*w/5,y,z,w/5,h,.11);b.rotation.z=-.18;}}
export function buildBus(color=PALETTE.gold){const g=new T.Group(),c=PALETTE,{width,height,length}=SHAPES.bus;
 softBox(g,material(color,{roughness:.43,metalness:.15}),0,1.51,-length/2,width-.10,2.46,length);
 face(g,propArt.bus,BUS_UV.front,0,1.51,.018,width-.13,2.46);
 face(g,propArt.bus,BUS_UV.rear,0,1.51,-length-.018,width-.13,2.46,Math.PI);
 for(const side of[-1,1]){const panel=face(g,propArt.bus,BUS_UV.side,side*(width/2-.045),1.52,-length/2,length-.5,2.36,side*Math.PI/2);if(side<0){const uv=panel.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,BUS_UV.side[0]+BUS_UV.side[2]-(uv.getX(i)-BUS_UV.side[0]));}
  softBox(g,material(c.dark),side*(width/2+.17),2.03,-.55,.16,.35,.20);const stem=cylinder(g,c.stone,side*(width/2+.06),1.87,-.55,.025,.23);stem.rotation.z=side*-.7;
  softBox(g,material(c.navy),side*(width/2-.025),.66,-length/2,.045,.09,length-.65);
 }
 const roof=face(g,propArt.bus,BUS_UV.roof,0,height,-length/2,width-.23,length-.55,0,true);roof.rotation.x=-Math.PI/2;
 softBox(g,material(c.cream,{roughness:.5}),0,height+.05,-length/2,1.1,.1,2.2);
 softBox(g,material(c.dark),0,.33,.045,width-.12,.14,.15);
 busWheels(g,width,length);softShadow(g,-length/2,width+.35,length+.4);return g;
}
function buildPressVan(){const g=new T.Group(),c=PALETTE,{width,height,length}=SHAPES.vehicle;
 softBox(g,material(0xf3ecdd,{roughness:.46,metalness:.12}),0,1.15,-length/2,width-.06,2.15,length);
 face(g,propArt.bus,BUS_UV.glass,0,1.60,.025,width-.31,1.0);
 softBox(g,material(c.navy),0,.55,.08,width-.18,.32,.20);
 for(const side of[-1,1]){face(g,propArt.bus,BUS_UV.glass,side*(width/2-.02),1.62,-2.5,4.5,.80,side*Math.PI/2);softBox(g,material(c.blue),side*(width/2+.006),.90,-length/2,.025,.26,length-.45);softBox(g,material(c.dark),side*(width/2+.09),1.53,-.65,.12,.26,.18);softBox(g,material(c.white,{emissive:0xffd576,emissiveIntensity:.35}),side*.72,.77,.12,.38,.16,.04);}
 softBox(g,material(c.cream),0,height-.03,-3.8,1.5,.10,2.5);busWheels(g,width,length,.39);softShadow(g,-length/2,width+.25,length+.3);return g;
}
export const STREET_ART=['falcon-front','falcon-rear','falcon-side','donkey','ramp-deck','pothole'];
const streetMaterials=new Map(STREET_ART.map(k=>[k,new T.MeshBasicMaterial({name:k+'-art',transparent:true,alphaTest:.05,depthWrite:true,toneMapped:false,side:T.DoubleSide})]));
export function installStreetArt(textures){STREET_ART.forEach((k,i)=>{const m=streetMaterials.get(k);m.map=textures[i];m.needsUpdate=true;});}
function buildFalcon(){const g=new T.Group(),s=SHAPES.falcon;
 softBox(g,material(0x286334,{roughness:.55,metalness:.12}),0,.62,-s.length/2,s.width,.82,s.length);
 softBox(g,material(0x286334),0,1.19,-2.9,1.94,.64,2.1);
 for(const [id,z,angle]of[['falcon-front',.018,0],['falcon-rear',-s.length-.018,Math.PI]]){const m=mesh(new T.PlaneGeometry(s.width,s.height),streetMaterials.get(id),g,0,s.height/2,z);m.rotation.y=angle;}
 for(const side of[-1,1]){const m=mesh(new T.PlaneGeometry(s.length,s.height),streetMaterials.get('falcon-side'),g,side*(s.width/2+.01),s.height/2,-s.length/2);m.rotation.y=side*Math.PI/2;}
 softShadow(g,-s.length/2,s.width+.2,s.length+.3);return g;
}
export const HYGIENE=['portable','shampoo','soap','plunger','brush'];
const hygieneMaterials=new Map(HYGIENE.map(k=>[k,new T.MeshBasicMaterial({name:k+'-art',transparent:true,alphaTest:.04,depthWrite:true,toneMapped:false,side:T.DoubleSide})]));
export function installHygieneArt(textures){HYGIENE.forEach((k,i)=>{const m=hygieneMaterials.get(k);m.map=textures[i];m.needsUpdate=true;});}

export const PRESS_OBSTACLES=['bags','doublebarrier','manhole','trench','camera','mics','newspapers','taxi'];
const pressMaterials=new Map(PRESS_OBSTACLES.map(k=>[k,new T.MeshBasicMaterial({name:'press-'+k,map:null,transparent:true,alphaTest:.018,depthWrite:true,toneMapped:false,side:T.DoubleSide})]));
export function installPressObstacleArt(textures){PRESS_OBSTACLES.forEach((k,i)=>{const m=pressMaterials.get(k);m.map=textures[i];m.needsUpdate=true;});}
function pressProp(kind){const g=new T.Group(),s=SHAPES[kind],m=pressMaterials.get(kind);
 if(kind==='taxi'){softBox(g,material(0xeeb727,{roughness:.4,metalness:.15}),0,.63,-2.6,2.3,.85,5.2);softBox(g,material(0x192b3c),0,1.15,-2.9,1.98,.62,2.0);mesh(new T.PlaneGeometry(s.width,s.height),m,g,0,s.height/2,.023);busWheels(g,s.width,s.length,.34);softShadow(g,-2.6,2.5,5.5);}
 else if(kind==='manhole'){const flat=mesh(regionGeometry(new T.PlaneGeometry(2.3,2.2),[0,0,1,.54]),m,g,0,.035,-1.1);flat.rotation.x=-Math.PI/2;const lid=mesh(regionGeometry(new T.PlaneGeometry(2.0,1.25),[0,.54,1,.46]),m,g,0,.69,-2.0);lid.rotation.x=-.28;}
 else if(kind==='trench'){const trench=mesh(new T.PlaneGeometry(s.width,s.length),m,g,0,.045,-s.length/2);trench.rotation.x=-Math.PI/2;}
 else {const visualHeight=kind==='newspapers'?1.6:kind==='mics'?1.1:s.height;mesh(new T.PlaneGeometry(s.width,visualHeight),m,g,0,kind==='mics'?1.7:visualHeight/2,0);if(kind!=='newspapers')softShadow(g,-s.length/2,s.width,s.length+.3);}
 return g;
}
function buildContainer(kind){const g=new T.Group(),s=SHAPES[kind],big=kind==='dumpster',color=big?0x247d83:0xc57429,steel=material(color,{roughness:.73,metalness:.16}),dark=material(0x17303a,{roughness:.85});
 softBox(g,steel,0,s.height*.47,-s.length/2,s.width,s.height*.88,s.length);
 softBox(g,dark,0,s.height-.025,-s.length/2,s.width+.06,.12,s.length+.06);
 for(const side of[-1,1]){softBox(g,steel,side*(s.width/2-.05),s.height-.02,-s.length/2,.12,.20,s.length+.10);for(let z=.4;z<s.length;z+=.7)softBox(g,material(big?0x1c626a:0x92501c),side*(s.width/2+.01),s.height*.5,-z,.07,s.height*.66,.09);}
 for(const x of[-.85,-.42,0,.42,.85])softBox(g,material(big?0x1c626a:0x92501c),x,s.height*.45,.018,.07,s.height*.65,.05);
 warning(g,0,s.height*.56,.055,1.85,.27);
 if(big){for(const side of[-1,1]){const wheel=cylinder(g,0x12202c,side*.94,.14,-s.length+.4,.14,.12);wheel.rotation.z=Math.PI/2;}softBox(g,steel,0,s.height+.025,-s.length*.72,s.width,.08,s.length*.46);}
 else{for(let i=0;i<5;i++)ball(g,i%2?0xb6a185:0x7b7c74,(i-2)*.39,s.height-.02,-.7-(i%2)*1.1,.32,.19,.35);}
 softShadow(g,-s.length/2,s.width+.3,s.length+.4);return g;}
export function buildProp(kind){if(PRESS_OBSTACLES.includes(kind))return pressProp(kind);const g=new T.Group(),c=PALETTE;
 if(HYGIENE.includes(kind)){const s=SHAPES[kind];const plate=mesh(new T.PlaneGeometry(s.width,s.height),hygieneMaterials.get(kind),g,0,s.height/2,0);softShadow(g,-s.length/2,s.width+.15,s.length+.3);return g;}
 if(kind==='dumpster'||kind==='skip')return buildContainer(kind);if(kind==='falcon')return buildFalcon();if(kind==='donkey'){const s=SHAPES.donkey;mesh(new T.PlaneGeometry(s.width,s.height),streetMaterials.get('donkey'),g,0,s.height/2,0);softShadow(g,-.3,s.width,1.3);return g;}if(kind==='pothole'){const m=mesh(new T.PlaneGeometry(2.8,3.2),streetMaterials.get('pothole'),g,0,.026,-1.6);m.rotation.x=-Math.PI/2;return g;}if(kind==='bus')return buildBus();if(kind==='vehicle')return buildPressVan();
 if(kind==='tp'){const shell=new T.Mesh(new T.CylinderGeometry(.34,.34,.53,20,1,true),material(c.white));shell.position.y=.31;g.add(shell);const top=new T.Mesh(new T.RingGeometry(.10,.34,20),material(c.white,{side:T.DoubleSide}));top.rotation.x=-Math.PI/2;top.position.y=.575;g.add(top);cylinder(g,c.brown,0,.32,0,.095,.49);const flap=box(g,c.white,.29,.27,.19,.08,.45,.22);flap.rotation.z=-.2;const halo=mesh(new T.TorusGeometry(.41,.018,6,24),material(PALETTE.gold,{emissive:0x997b19,emissiveIntensity:.65}),g,0,.32,0);}
 else if(kind==='dollar'){box(g,0x75b754,0,.34,0,.68,.38,.45);box(g,c.cream,0,.36,0,.15,.4,.47);for(let y=.19;y<.52;y+=.06)box(g,0x487d3e,0,y,.231,.63,.012,.008);}
 else if(kind==='low'||kind==='block'){const height=SHAPES[kind].height,length=SHAPES[kind].length;tileBox(g,'concrete',0,height/2,-length/2,2.5,height,length);softBox(g,material(c.cream),0,height-.035,-length/2,2.5,.07,length);warning(g,0,height*.53,.015,2.35,height*.40);for(const side of[-1,1])softBox(g,material(c.dark),side*1.01,.15,.022,.05,.22,.03);}
 else if(kind==='high'){const {height,bottom,width}=SHAPES.high,boardHeight=height-bottom,boardY=(height+bottom)/2;for(const side of[-1,1]){tileBox(g,'orange',side*1.25,height/2,-.30,.18,height,.28);softBox(g,material(c.brown),side*1.25,.10,-.3,.46,.20,.65);for(const yy of[bottom+.15,height-.15])ball(g,c.stone,side*1.25,yy,-.135,.03,.03,.015);}softBox(g,material(c.brown),0,boardY,-.30,width,boardHeight,.27);warning(g,0,boardY,-.155,width,boardHeight);}
 else if(kind==='cone'){softBox(g,material(c.dark),0,.055,-.3,.73,.11,.73);mesh(regionGeometry(new T.ConeGeometry(.29,.88,24),HAZARD_UV.orange),propArt.hazards,g,0,.55,-.3);mesh(new T.CylinderGeometry(.11,.18,.17,24),material(0xfff9e7,{roughness:.48}),g,0,.64,-.3);mesh(new T.CylinderGeometry(.21,.25,.12,24),material(0xfff9e7,{roughness:.48}),g,0,.35,-.3);}
 else if(kind==='trash'){tileBox(g,'green',0,.59,-.43,.88,1.08,.82);softBox(g,material(c.dark),0,1.16,-.43,.94,.15,.88);for(const side of[-1,1]){softBox(g,material(c.dark),side*.445,.80,-.43,.06,.13,.26);const wheel=cylinder(g,c.dark,side*.35,.09,-.72,.085,.05);wheel.rotation.z=Math.PI/2;}for(let x=-.3;x<.4;x+=.15)box(g,0x145746,x,.60,-.008,.024,.80,.02);}
 else if(kind==='gap'){box(g,c.dark,0,-1.35,-2.5,2.8,.04,5);box(g,c.stone,-1.40,-.6,-2.5,.08,1.2,5);box(g,c.stone,1.40,-.6,-2.5,.08,1.2,5);for(const s of[-1,1])for(let j=0;j<7;j++)box(g,j%2?c.gold:c.dark,s*1.40,.014,-.35-j*.7,.12,.025,.7);}
 else if(kind==='ramp'){const v=[-1.4,0,0,1.4,0,0,-1.4,2.8,-12,1.4,2.8,-12,-1.4,0,-12,1.4,0,-12];const b=new T.BufferGeometry();b.setAttribute('position',new T.Float32BufferAttribute(v,3));b.setIndex([0,2,1,1,2,3,0,4,2,1,3,5,2,4,3,3,4,5,0,1,4,1,5,4]);b.computeVertexNormals();b.setAttribute('uv',new T.Float32BufferAttribute(v.flatMap((_,i)=>i%3===0?[(v[i]+1.4)/2.8,-v[i+2]/12]:[]),2));mesh(b,streetMaterials.get('ramp-deck'),g,0,0,0);for(let z=1;z<12;z+=2){const tread=box(g,c.dark,0,z/12*2.8+.026,-z,2.62,.04,.10);tread.rotation.x=.229;}for(const s of[-1,1]){const b=box(g,c.gold,s*1.36,1.42,-6,.08,.10,12.32);b.rotation.x=.229;}}
 else if(kind==='roof'){tileBox(g,'concrete',0,2.74,-2,2.8,.12,4);box(g,c.gold,-1.35,2.84,-2,.08,.1,4);box(g,c.gold,1.35,2.84,-2,.08,.1,4);}
 if(['low','block','high','cone','trash'].includes(kind)){const s=SHAPES[kind];softShadow(g,-s.length/2,s.width+.15,s.length+.4);}return g;}
export function buildPower(id){const g=new T.Group(),c=PALETTE;const colors={magnet:c.blue,lion:c.gold,afuera:c.red,dollars:0x70c751,rescue:c.blue};
 if(id==='magnet'){const m=mesh(new T.TorusGeometry(.34,.095,8,16,Math.PI*1.45),material(c.red),g,0,.6,0);m.rotation.z=-.72;for(const s of[-1,1])box(g,c.white,s*.29,.34,0,.17,.2,.17);}
 if(id==='lion'){ball(g,c.gold,0,.55,0,.42,.46,.25);for(let j=0;j<9;j++){const a=j*Math.PI*2/9;ball(g,c.orange,Math.sin(a)*.33,.55+Math.cos(a)*.33,0,.15,.19,.15);}ball(g,c.cream,0,.48,.24,.23,.15,.10);for(const s of[-1,1])ball(g,c.navy,s*.14,.66,.24,.04,.055,.03);}
 if(id==='afuera'){box(g,c.red,-.20,.48,0,.48,.45,.36);const b=box(g,c.stone,.34,.72,0,.20,.86,.08);b.rotation.z=-.7;for(let j=0;j<6;j++)ball(g,c.dark,-.02+j*.09,.47+j*.095,0,.045,.045,.055);const handle=mesh(new T.TorusGeometry(.20,.04,6,12,Math.PI),material(c.dark),g,-.3,.72,0);}
 if(id==='dollars'){g.add(buildProp('dollar'));g.scale.setScalar(1.15);}
 if(id==='rescue'){ball(g,c.blue,0,.56,0,.42,.23,.20);box(g,c.navy,0,.62,.17,.50,.18,.06);box(g,c.white,.46,.55,0,.66,.06,.08);box(g,c.blue,.76,.64,0,.07,.25,.07);box(g,c.dark,0,.9,0,1.15,.04,.06);for(const s of[-1,1])box(g,c.dark,0,.25,s*.20,.70,.04,.04);}
 return g;}
export function buildHelicopter(){const g=new T.Group(),c=PALETTE;ball(g,c.blue,0,.1,0,1.05,.60,1.55);ball(g,c.white,0,.02,.45,1.08,.47,1.05);box(g,c.navy,0,.28,1.25,1.25,.5,.2);box(g,c.blue,0,.20,-2.05,.20,.20,2.7);box(g,c.blue,0,.6,-3.15,.16,1.2,.45);box(g,c.white,0,.55,-3.25,1.2,.09,.34);const rotor=new T.Group();rotor.name='rotor';rotor.position.y=.91;box(rotor,c.dark,0,0,0,5.7,.035,.16);box(rotor,c.dark,0,0,0,.16,.035,5.7);g.add(rotor);for(const s of[-1,1]){box(g,c.dark,s*.8,-.62,0,.075,.075,2.7);for(const z of[-.7,.7])box(g,c.dark,s*.8,-.34,z,.075,.55,.075);}cylinder(g,c.dark,0,-1.25,0,.025,2);return g;}
function facade(p,x,z,variant){const c=PALETTE,w=7,h=8+variant*1.2,d=8;const g=new T.Group();const color=[c.rose,c.cream,0xb9c4b7,0xd4b287][variant%4];mesh(boxGeo,artMaterials.walls[variant%3],g,0,h/2,0,w,h,d);box(g,c.stone,0,.35,0,w+.2,.7,d+.2);for(let floor=0;floor<3;floor++){const y=1.6+floor*2.4;for(let j=0;j<3;j++){const wz=-2.4+j*2.4;box(g,c.cream,-3.53,y,wz,.14,1.75,1.24);box(g,c.navy,-3.62,y,wz,.08,1.42,.98);box(g,c.cream,-3.7,y,wz,.05,1.42,.065);box(g,c.cream,-3.7,y,wz,.05,.065,.98);box(g,c.stone,-3.71,y-.82,wz,.38,.12,1.46);}box(g,c.cream,0,y+1.15,0,w+.25,.15,d+.3);}box(g,c.stone,0,h-.1,0,w+.45,.3,d+.45);box(g,c.cream,0,h+.12,0,w+.6,.15,d+.6);for(let j=0;j<3;j++)box(g,c.blue,-3.70,.90,-2.3+j*2.3,.04,.85,1.3);g.position.set(x,0,z);if(x<0)g.rotation.y=Math.PI;p.add(g);}
function tree(p,x,z,index){const c=PALETTE;cylinder(p,c.brown,x,2.2,z,.16,4.4);for(let j=0;j<3;j++){const branch=cylinder(p,c.brown,x+Math.sin(j*2.1)*.4,3.7,z+Math.cos(j*2.1)*.4,.065,1.4);branch.rotation.z=Math.sin(j*2.1)*.6;const geo=new T.PlaneGeometry(4.4,4.5);const uv=geo.attributes.uv,cell=index%4;for(let k=0;k<uv.count;k++)uv.setXY(k,(cell%2)*.5+.015+uv.getX(k)*.47,(cell<2?.5:0)+.015+uv.getY(k)*.47);const crown=mesh(geo,artMaterials.foliage,p,x,4.5,z);crown.rotation.y=j*Math.PI/3;crown.scale.setScalar(1+(index%3)*.07);}}
function lamp(p,x,z){const c=PALETTE;cylinder(p,c.navy,x,2.35,z,.075,4.7);cylinder(p,c.navy,x,.13,z,.21,.26);box(p,c.navy,x,4.80,z,.35,.35,.35);ball(p,c.white,x,4.83,z,.12,.16,.12);mesh(new T.ConeGeometry(.27,.20,4),material(c.navy),p,x,5.07,z);}
function flag(p,x,z,side){const c=PALETTE;box(p,c.navy,x,3,z,.06,6,.06);const flag=new T.Group();for(let i=0;i<3;i++){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(flagCloth.positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(flagCloth.uv,2));geo.setIndex(flagCloth.indices);geo.translate(-.59,0,0);geo.computeVertexNormals();if(side<0){const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setX(k,1-uv.getX(k));}mesh(geo,clothMaterial(i===1?c.white:c.blue),flag,side*.59,4.7-i*.23,0);}ball(flag,c.gold,side*.59,4.47,.025,.065,.07,.015);flag.position.set(x,0,z);p.add(flag);}
export function buildSegment(index){const p=new T.Group(),c=PALETTE;box(p,c.road,0,-.10,-20,10.2,.2,40);for(const s of[-1,1]){box(p,c.stone,s*7.2,-.05,-20,4.15,.1,40);box(p,c.cream,s*5.2,.055,-20,.16,.15,40);for(let j=0;j<8;j++)box(p,j%2?c.dark:c.gold,s*5.2,.16,-2.5-j*5,.22,.12,5);for(let j=0;j<10;j++)box(p,0xa99e84,s*7.2,.012,-j*4,4.0,.018,.025);for(let j=0;j<3;j++)facade(p,s*13,-6-j*12,(index+j)%4);for(let j=0;j<3;j++){tree(p,s*7.1,-3-j*14,index+j);if(s<0){const shadow=mesh(new T.CircleGeometry(1,16),material(0x142838,{transparent:true,opacity:.16,depthWrite:false}),p,s*7.1+2.4,.027,-1-j*14,2.2,4.5,1);shadow.rotation.x=-Math.PI/2;shadow.rotation.z=-.4;}};for(let j=0;j<2;j++){lamp(p,s*5.9,-8-j*20);flag(p,s*6,-3-j*20,-s);}}
 // Sidewalk dressing is baked into recycled segments, outside the playable lanes.
 for(const side of[-1,1]){const z=-15-index*3;
  if(index%2===0){const parked=buildProp(index===0?'taxi':'falcon');parked.scale.setScalar(.64);parked.position.set(side*8.7,0,z);p.add(parked);}
  else{box(p,0x635340,side*8.3,.48,z,1.6,.12,.48);box(p,0x775c3d,side*8.3,.84,z-.24,1.6,.65,.08);for(const dx of[-.6,.6])box(p,c.dark,side*8.3+dx,.23,z,.08,.46,.4);}
  if(side===1&&index%2===1){box(p,index===1?0x2d8596:0xb7484b,8.8,.75,-30,1.7,1.5,1.15);box(p,c.cream,8.8,1.16,-29.4,1.45,.48,.04);box(p,c.blue,8.8,1.8,-30,2.1,.14,1.6);for(let j=0;j<4;j++)box(p,j%2?c.white:c.gold,8.1+j*.45,1.69,-29.18,.4,.18,.05);}
 }
 for(const x of[-1.6,1.6])for(let j=0;j<7;j++)box(p,c.white,x,.012,-2-j*6,.09,.018,2.8);
 if(index%3===0){for(let j=0;j<8;j++)box(p,c.white,-4.1+j*1.2,.016,-36,.55,.025,2.2);}
 return p;}
export function buildPalace(){const p=new T.Group(),c=PALETTE;box(p,c.rose,0,8,-185,42,16,8);box(p,0xc78d80,0,12,-180.8,15,8,.7);box(p,c.cream,0,4,-180.2,7,8,.16);arch(p,0,0,-180.05,6,8,c.navy);for(let f=0;f<3;f++)for(let j=-8;j<=8;j++){if(f===0&&Math.abs(j)<2)continue;arch(p,j*2.25,1.7+f*4.3,-180.6,1.15,2.8,c.navy);box(p,c.cream,j*2.25,1.58+f*4.3,-180.35,1.5,.16,.4);}for(let f=1;f<4;f++)box(p,c.cream,0,f*4.25,-180.35,42,.24,.5);box(p,c.rose,0,17,-184,13,3,6);const clock=mesh(new T.CircleGeometry(.95,24),material(c.cream),p,0,17.5,-180.85);box(p,c.navy,0,17.75,-180.80,.06,.48,.04);box(p,c.navy,.2,17.5,-180.8,.4,.06,.04);mesh(new T.ConeGeometry(2.1,3,4),material(c.rose),p,0,20,-184);flag(p,0,-183,1);return p;}

// Thirty named source designs for reproducible GLB kit exports.
export function sourceKits(){
 const city=new T.Group(),traffic=new T.Group(),rewards=new T.Group(),powers=new T.Group();
 const add=(parent,name,g)=>{g.name=name;parent.add(g);};
 let g=new T.Group();box(g,PALETTE.road,0,-.1,-20,10.2,.2,40);add(city,'road_tile',g);
 g=new T.Group();box(g,PALETTE.stone,0,0,-20,4,.1,40);add(city,'sidewalk_tile',g);
 g=new T.Group();box(g,PALETTE.road,0,-.1,0,10.2,.2,8);for(let j=0;j<8;j++)box(g,PALETTE.white,-4.1+j*1.2,.016,0,.55,.02,2.2);add(city,'intersection_tile',g);
 for(let j=0;j<4;j++){g=new T.Group();facade(g,13,0,j);g.children[0].position.x=0;add(city,'facade_'+j,g);}
 for(let j=0;j<2;j++){g=new T.Group();tree(g,0,0,j);add(city,'tree_'+j,g);}
 g=new T.Group();lamp(g,0,0);add(city,'lamp',g);g=new T.Group();flag(g,0,0,1);add(city,'flag_pole',g);g=buildPalace();g.position.z=183;add(city,'casa_rosada',g);
 g=new T.Group();box(g,PALETTE.navy,0,2,0,1.6,.45,.08);box(g,PALETTE.gold,0,2.02,.05,1.3,.08,.02);add(city,'shop_sign_frame',g);
 for(const k of ['bus','ramp','roof','low','high','cone','trash','gap','vehicle'])add(traffic,k,buildProp(k));
 for(const k of ['tp','dollar'])add(rewards,k,buildProp(k));
 for(const k of ['magnet','lion','afuera','dollars','rescue'])add(powers,k,k==='rescue'?buildHelicopter():buildPower(k));
 return {city,traffic,rewards,powers};
}
