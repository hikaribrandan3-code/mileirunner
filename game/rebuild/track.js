// Authored track grammar. Distances and shape dimensions are shared by rendering/physics.
export const LANE_WIDTH=3.2;
// World units are metres. Keep the character and its clearance in the same
// contract as the 2.8 m bus; import scale must never decide gameplay height.
export const HERO_HEIGHT=1.9;
export const SHAPES=Object.freeze({
 dumpster:{width:2.65,height:2.1,length:3.4},skip:{width:2.6,height:1.05,length:2.7},
 bags:{width:2.2,height:1.35,length:1.3},doublebarrier:{width:2.7,height:1.35,length:.75},manhole:{width:2.3,height:0,length:2.2},trench:{width:2.65,height:0,length:3.6},camera:{width:1.3,height:1.8,length:1.0},mics:{width:2.5,height:2.25,length:.8,bottom:1.15},newspapers:{width:2.5,height:1.8,length:.8},taxi:{width:2.3,height:1.55,length:5.2},
 falcon:{width:2.3,height:1.55,length:5.2},donkey:{width:1.2,height:1.65,length:1.4},pothole:{width:2.8,height:0,length:3.2},
 bus:{width:2.65,height:2.8,length:14},vehicle:{width:2.3,height:2.3,length:7},
 low:{width:2.5,height:.9,length:.65},high:{width:2.8,height:2.2,length:.65,bottom:1.15},
 portable:{width:2.0,height:2.6,length:1.6},shampoo:{width:.9,height:1.25,length:.9},soap:{width:1.6,height:.9,length:1},plunger:{width:.75,height:1.25,length:.8},brush:{width:.9,height:1.25,length:.9},
 cone:{width:.75,height:1,length:.8},block:{width:2.5,height:1.05,length:1},trash:{width:.9,height:1.25,length:.9},
 gap:{width:2.8,height:0,length:5},ramp:{width:2.8,height:2.8,length:12},roof:{width:2.8,height:2.8,length:4}
});
const row=(d,items)=>({d,items});
const defs=[
 ['learn-lane',0,[row(0,[['cone',-1]])]],['learn-jump',0,[row(0,[['low',0]])]],['learn-slide',0,[row(0,[['high',0]])]],['learn-relief',0,[]],
 ['first-bus',0,[row(0,[['bus',-1]]),row(30,[['bus',1]]),row(52,[['low',0]])]],['paper-hop',0,[row(0,[['low',1]])]],['blue-gate',0,[row(0,[['high',-1]])]],['sunny-corridor',0,[row(0,[['bus',-1],['cone',1]]),row(24,[['low',0],['taxi',1]]),row(44,[['high',0],['bus',-1]])]],['little-dodge',0,[row(0,[['cone',0]]),row(40,[['low',-1]])]],['easy-slide',0,[row(0,[['high',0]]),row(40,[['cone',1]])]],
 ['traffic-weave',1,[row(0,[['bus',-1],['low',0]]),row(42,[['bus',1],['high',0]])]],['jump-and-duck',1,[row(0,[['low',0],['bus',-1],['bus',1]]),row(42,[['high',0],['bus',-1],['bus',1]])]],['two-choices',1,[row(0,[['bus',-1],['low',0]]),row(42,[['high',1],['cone',0]])]],['bus-alley',1,[row(0,[['bus',-1],['bus',1]])]],['roadwork',1,[row(0,[['gap',0],['cone',1]])]],['ramp-route',1,[row(0,[['ramp',0]]),row(12,[['bus',0]]),row(26,[['roof',0]]),row(30,[['bus',0]])]],['curbside',1,[row(0,[['trash',-1],['low',1]]),row(42,[['high',0]])]],['press-crossing',1,[row(0,[['vehicle',1]]),row(42,[['low',-1],['high',0]])]],
 ['triple-jump',2,[row(0,[['low',-1],['low',0],['low',1]])]],['triple-slide',2,[row(0,[['high',-1],['high',0],['high',1]])]],['lane-slalom',2,[row(0,[['bus',-1],['bus',0]]),row(46,[['bus',0],['bus',1]])]],['roof-and-relief',2,[row(0,[['ramp',-1],['high',1]]),row(12,[['bus',-1]]),row(26,[['roof',-1]]),row(30,[['bus',-1]])]],['split-decision',2,[row(0,[['low',-1],['high',0],['bus',1]])]],['jump-cross',2,[row(0,[['gap',0],['bus',-1]]),row(46,[['high',1],['low',0]])]],
 ['magnet-relief',0,[row(0,[['cone',-1]])]],['lion-break',1,[row(0,[['low',-1],['trash',0]])]],['chainsaw-line',1,[row(0,[['low',0]]),row(40,[['high',0]])]],['landing-relief',0,[]],
 ['dumpster-slalom',1,[row(0,[['dumpster',-1],['skip',0]]),row(24,[['dumpster',1],['low',0]]),row(48,[['skip',-1],['high',1]])]],
 ['skip-roadworks',2,[row(0,[['skip',0],['bus',1]]),row(24,[['dumpster',-1],['doublebarrier',1]]),row(48,[['skip',1],['camera',0]])]],
 ['taxi-squeeze',1,[row(0,[['taxi',-1],['doublebarrier',0]]),row(36,[['bags',1],['manhole',0]])]],
 ['press-weave',1,[row(0,[['camera',0],['bus',1]]),row(36,[['mics',-1],['newspapers',0]])]],
 ['construction-chaos',2,[row(0,[['trench',0],['bags',-1]]),row(36,[['doublebarrier',1],['camera',0]])]],
 ['bus-broadcast',1,[row(0,[['bus',-1],['bus',1],['newspapers',0]]),row(32,[['doublebarrier',0],['taxi',1]])]],
 ['press-lane-change',2,[row(0,[['mics',0],['taxi',-1]]),row(36,[['camera',1],['bags',0]])]],
 ['roof-landing-jump',2,[row(0,[['ramp',0],['taxi',1]]),row(12,[['bus',0]]),row(26,[['roof',0]]),row(30,[['bus',0]]),row(68,[['manhole',0],['bags',-1]])]]
];
for(let i=4;i<defs.length;i++){const rows=defs[i][2];if(rows.length===1){rows.push(row(24,[[i%2?'skip':'low',i%3-1]]),row(48,[[i%2?'dumpster':'high',(i+1)%3-1]]));}if(rows.length===0)rows.push(row(0,[['skip',-1]]),row(24,[['dumpster',1]]));}
for(const [, ,rows] of defs)if(!rows.some(r=>r.items.some(([k])=>k==='ramp')))for(const r of rows)r.d=Math.round(r.d*.78);
for(let i=4;i<defs.length;i++){const rows=defs[i][2];if(!rows.some(r=>r.items.some(([k])=>k==='ramp')))for(let j=1;j<rows.length;j++)rows[j].d=Math.min(rows[j].d,rows[j-1].d+20);}
export const TEMPLATES=Object.freeze(defs.map(([name,band,rows],id)=>Object.freeze({id,name,band,rows,length:Math.max(62,...rows.map(r=>r.d+20))})));
export function shape(kind){return SHAPES[kind]||{width:.7,height:.7,length:.7};}
export function supportAt(objects,x,zOffset=0){let ground=0;for(const o of objects){if(!o.active||Math.abs(o.lane-x)*LANE_WIDTH>1.3)continue;const s=shape(o.kind),z=o.z+zOffset;if(z>(o.kind==='ramp'?0:.42)||z+s.length<0)continue;if(o.kind==='ramp')ground=Math.max(ground,Math.min(2.8,(-z/12)*2.8));else if(o.kind==='roof'||o.kind==='bus')ground=Math.max(ground,2.8);}return ground;}
export function contacts(o,x,feet,sliding){const s=shape(o.kind);if(Math.abs(o.lane-x)*LANE_WIDTH>s.width/2+.32)return false;if(o.z>.42||o.z+s.length<-.42)return false;if(['ramp','roof','newspapers'].includes(o.kind))return false;if(['gap','pothole','manhole','trench'].includes(o.kind))return feet<.25;if(['high','mics'].includes(o.kind))return !sliding&&feet+HERO_HEIGHT>s.bottom&&feet<s.height;return feet<s.height-.08;}
// Exact linear sweep over the fixed tick: clip the common contact-time interval.
export function sweptContact(o,previousX,x,previousFeet,feet,sliding,heroHeight=HERO_HEIGHT){
 if(['ramp','roof','newspapers'].includes(o.kind))return false;const s=shape(o.kind);let lo=0,hi=1;
 const clip=(a,b,min,max)=>{const delta=b-a;if(Math.abs(delta)<1e-9)return a>=min&&a<=max;let u=(min-a)/delta,v=(max-a)/delta;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);return lo<=hi;};
 const half=(s.width/2+.32)/LANE_WIDTH;
 if(!clip(previousX,x,o.lane-half,o.lane+half)||!clip(o.prevZ??o.z,o.z,-s.length-.42,.42))return false;
 if(['high','mics'].includes(o.kind))return !sliding&&clip(previousFeet,feet,s.bottom-heroHeight,s.height);
 return clip(previousFeet,feet,-Infinity,['gap','pothole','manhole','trench'].includes(o.kind)?.25:s.height-.08);
}
// Beam search over timed actions uses the same continuous contact/support model.
// Offline validation has explicit state/pruning limits and returns the witness path.
export function validateTemplate(template,speed=24,entry=0){
 const start=38;const objects=template.rows.flatMap(r=>r.items.map(([kind,lane])=>({kind,lane,z:start+r.d,active:true})));
 const end=(start+template.length+15)/speed;let states=[{x:entry,lane:entry,y:0,vy:0,ground:0,slide:0,path:[]}];
 const dt=.1;for(let time=0;time<end;time+=dt){const next=new Map();const scene=objects.map(o=>({...o,z:o.z-speed*(time+dt)}));
  for(const state of states)for(const action of ['none','left','right','jump','slide']){
   const s={...state,path:state.path};if(action==='left')s.lane=Math.max(-1,s.lane-1);if(action==='right')s.lane=Math.min(1,s.lane+1);
   if(action==='jump'&&s.y<.01&&s.slide<=0){s.vy=10.5;s.y=.001;}if(action==='slide'){if(s.y>.01)s.vy=Math.min(s.vy,-12);else s.slide=.78;}
   s.x+=(s.lane-s.x)*Math.min(1,dt/.16);s.slide=Math.max(0,s.slide-dt);
   const ground=supportAt(scene,s.x);if(s.y>.0||s.vy!==0){s.vy-=25*dt;s.y+=s.vy*dt;}
   const absolute=s.ground+Math.max(0,s.y);if(ground>s.ground&&absolute+.3>=ground||ground<s.ground&&s.y<=0){s.y=Math.max(0,absolute-ground);s.ground=ground;}
   if(s.y<=0){s.y=0;s.vy=0;s.ground=ground;}
   const feet=s.ground+s.y;if(scene.some(o=>contacts(o,s.x,feet,s.slide>0)))continue;
   const key=[s.lane,Math.round(s.x*5),Math.round(s.y*3),Math.round(s.vy/4),Math.round(s.ground*2),Math.ceil(s.slide*5)].join(':');
   if(!next.has(key))next.set(key,{...s,path:action==='none'?s.path:[...s.path,{time:Number(time.toFixed(2)),action}]});
  }
  states=[...next.values()].sort((a,b)=>a.path.length-b.path.length).slice(0,160);if(!states.length)return {valid:false,name:template.name,speed,entry,time};
 }
 return {valid:true,name:template.name,speed,entry,witness:states[0].path};
}
