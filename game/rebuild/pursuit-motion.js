import {supportAt,shape} from './track.js';

// Presentation follows the authoritative chase distance; it never awards hits.
export function advancePursuer(m,objects,x,z,speed,dt){
 let ground=supportAt(objects,x/3.2,z);if(ground===2.8&&(!m.initialized||m.y<2.5))ground=0;
 if(!m.initialized){Object.assign(m,{initialized:true,y:ground,vy:0,dodge:0,duck:0});}
 let dodge=0,duck=0;
 for(const o of objects){
  if(!o.active||['tp','dollar','power','newspapers','ramp','roof'].includes(o.kind))continue;
  const d=o.z+z,s=shape(o.kind);
  if(d+s.length<-.5||d>speed*.34||Math.abs(o.lane*3.2-x)>s.width*.5+.25)continue;
  if(s.bottom){duck=1;continue;}
  if(s.height>=1.5){if(m.y< s.height-.1)dodge=(x<=o.lane*3.2?-1:1)*1.65;continue;}
  if(m.y<=ground+.06&&m.vy<=0&&d>-.25)m.vy=10.5;
 }
 m.dodge+=(dodge-m.dodge)*Math.min(1,dt*12);
 m.duck+=(duck-m.duck)*Math.min(1,dt*14);
 m.vy-=25*dt;m.y+=m.vy*dt;
 if(m.y<ground){m.y=ground;m.vy=0;}
 return m;
}
