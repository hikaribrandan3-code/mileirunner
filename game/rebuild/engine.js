import {RunnerEngine as LegacyEngine,STATES,POWERS,QUOTES,meterBand} from '../engine.js';
import {PressChase} from './chase.js';
import {TEMPLATES,shape,supportAt,sweptContact} from './track.js';
export {STATES,POWERS,QUOTES,meterBand};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BREAKABLE=new Set(['skip','cone','low','block','trash','shampoo','soap','plunger','brush','bags','doublebarrier','camera']);
export class RunnerEngine extends LegacyEngine{
 reset(){super.reset();this.chase=new PressChase((type,details)=>this.emit(type,details));this.groundY=0;this.previousGroundY=0;this.previousAirY=0;this.vy=0;this.fastFall=false;this.laneFrom=0;this.laneTime=.16;this.actionAge=0;this.nearCooldown=0;this.lastTemplate=-1;this.patternHistory=[];this.inputHistory=[];this.previousDistance=0;this.previousX=0;this.previousY=0;this.presentationScale=1;this.nextPattern=.1;this.powerGap=7;this.firstPowerSpawned=false;this.jumpTime=0;this.airY=0;this.runSeed=this.seed;this.speed=18;}
 spawn(...args){const o=super.spawn(...args);if(o){o.resolved=false;o.roofReward=false;o.length=shape(o.kind).length;}return o;}
 handoff(){super.handoff();if(this.state===STATES.RUNNING)this.pattern();}
 input(action){if(![STATES.RUNNING].includes(this.state))return false;this.lastActionTime=this.elapsed;this.actionAge=0;this.inputHistory.push({t:this.elapsed,action});if(this.inputHistory.length>120)this.inputHistory.shift();
  if(action==='left'||action==='right'){const next=clamp(this.lane+(action==='left'?-1:1),-1,1);if(next===this.lane)return false;this.laneFrom=this.x;this.laneTime=0;this.lane=next;this.emit('lane',{direction:action});return true;}
  if(action==='jump'){if(this.power==='rescue')return false;if(this.jumpY>.01||this.slideTime>0){this.buffer='jump';this.bufferTime=.14;return false;}this.vy=10.5;this.jumpY=.001;this.jumpTime=.84;this.fastFall=false;this.emit('jump');return true;}
  if(action==='slide'){if(this.power==='rescue')return false;if(this.jumpY>.01){this.fastFall=true;this.vy=Math.min(this.vy,-12);return true;}this.slideTime=.78;this.emit('slide');return true;}return false;
 }
 pattern(){const band=this.elapsed<12?0:this.elapsed<45?1:2;const phase=['challenge','build','peak','recovery'][this.group%4];this.rhythmPhase=phase;const eligible=TEMPLATES.filter(t=>t.id>=4&&t.band<=band&&t.id!==this.lastTemplate);let choices=eligible.filter(t=>phase==='recovery'?['landing-relief','magnet-relief','first-bus'].includes(t.name):phase==='peak'?t.band===band:t.name!=='landing-relief'&&t.name!=='magnet-relief');if(!choices.length)choices=eligible;const index=Math.floor(this.random()*choices.length);const opening=['sunny-corridor','ramp-route','jump-and-duck','taxi-squeeze','dumpster-slalom','press-weave','curbside'];const forced=this.group<7?opening[this.group]:this.group%5===1?'ramp-route':null;const t=forced?TEMPLATES.find(t=>t.name===forced):choices[index];this.lastTemplate=t.id;this.group++;const mirror=this.random()<.5?-1:1;const start=this.group===1?36:48;if(this.group===1)this.trail(0,12,3);for(const r of t.rows)for(const[kind,lane]of r.items)this.spawn(this.streetVariant(this.hygieneVariant(kind,t),t),lane*mirror,start+r.d);
  // Each template has recovery spacing; roof paths have a raised reward route.
  let safe=this.lastSafe;const first=t.rows[0]?.items||[];const occupied=new Set(first.map(i=>i[1]*mirror));const free=[-1,0,1].filter(l=>!occupied.has(l));if(free.length)safe=free.reduce((a,b)=>Math.abs(a-this.lane)<Math.abs(b-this.lane)?a:b);else safe=this.lane;
  this.lastSafe=safe;
  const roof=t.rows.some(r=>r.items.some(i=>i[0]==='ramp'));if(roof){const lane=t.rows[0].items.find(i=>i[0]==='ramp')[1]*mirror;for(let z=start+3;z<start+48;z+=4){const height=z<start+12?(z-start)/12*2.8:2.8;const o=this.spawn('tp',lane,z,height+.7);if(o)o.roofReward=true;}}
  this.trail(safe,start+4,phase==='recovery'?5:2,{dollars:this.power==='dollars'});
  // Optional action rewards appear above low barriers, not in the barrier volume.
  for(const r of t.rows)for(const[kind,l]of r.items)if(kind==='low'){for(let i=-1;i<=1;i++)this.spawn(this.power==='dollars'?'dollar':'tp',l*mirror,start+r.d+i*3,1.65);}
  // Recovery paper anchors a readable route at every template join.
  this.trail(safe,start+t.length,phase==='recovery'?4:2);const lastExit=Math.max(0,...t.rows.flatMap(r=>r.items.map(([k])=>r.d+shape(k).length)));this.nextPattern=Math.max(20,lastExit+8-(this.group===1?12:0))/this.speed;this.patternHistory.push(t.name);if(this.patternHistory.length>24)this.patternHistory.shift();this.emit('pattern',{name:t.name,safe,group:this.group,phase});
 }
 streetVariant(kind,t){if(kind==='cone'&&this.group===3)return 'plunger';if(kind==='vehicle'||(kind==='bus'&&(this.group===1||this.group%4===0)&&!t.rows.some(r=>r.items.some(([k])=>k==='ramp'||k==='roof'))))return 'falcon';if(kind==='gap')return this.group%2?'pothole':'gap';if(kind==='trash'&&this.group%2===0)return 'donkey';return kind;}
 hygieneVariant(kind,template){if(this.group%3!==0||template?.rows.some(r=>r.items.some(([k])=>k==='ramp'||k==='roof')))return kind;return {trash:this.group%2?'brush':'shampoo',cone:'plunger',low:'soap',bus:this.group>4?'portable':'bus'}[kind]||kind;}
 pickup(o){super.pickup(o,2.5);}
 collide(o){
  if(this.grace>0||this.landingSafe>0||o.resolved)return;o.resolved=true;
  if(this.chase.hit()){this.fail('press');return;}
  this.meter=Math.min(100,this.meter+18);this.grace=1.3;this.slow=.65;this.hitStop=.10;this.pickupStreak=0;this.combo=1;this.emit('stumble',{kind:o.kind,lane:o.lane,pressClose:true});if(this.meter>=100)this.fail('meter');
 }
 emit(type,details={}){super.emit(type,details);if(this.chase){if(type==='near')this.chase.react('near');if(type==='power'&&['lion','rescue'].includes(details.id))this.chase.react(details.id);if(type==='pressEscape')this.chase.react('escape');}}
 activate(id){const okay=super.activate(id);if(okay&&id==='rescue'){this.jumpY=this.jumpTime=this.vy=this.groundY=0;for(const o of this.pool.items)if(o.active&&o.kind==='tp'&&o.z<100)o.y=5.5;}return okay;}
 endPower(){const id=this.power;super.endPower();if(id==='rescue'){this.landingSafe=1.8;this.groundY=0;for(const o of this.pool.items)if(o.active&&o.kind==='tp'&&o.y>4)o.active=false;}}
 update(dt){dt=clamp(dt,0,.05);this.presentationScale=1;
  if(![STATES.RUNNING].includes(this.state)){super.update(dt);return;}
  this.simTicks++;this.previousDistance=this.distance;this.previousX=this.x;this.previousY=this.jumpY+this.groundY+this.airY;this.previousGroundY=this.groundY;this.previousAirY=this.airY;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);this.presentationScale=0;return;}
  if(this.slow>0){this.slow=Math.max(0,this.slow-dt);dt*=.72;this.presentationScale=.72;}
  this.elapsed+=dt;this.actionAge+=dt;this.nearCooldown=Math.max(0,this.nearCooldown-dt);this.speed=Math.min(34,18+this.elapsed*.10);this.distance+=this.speed*dt;this.score+=this.speed*dt*(this.power==='dollars'?2:1);
  this.laneTime=Math.min(.16,this.laneTime+dt);const t=this.laneTime/.16;this.x=this.laneFrom+(this.lane-this.laneFrom)*(1-(1-t)**3);if(t>=1)this.x=this.lane;
  this.grace=Math.max(0,this.grace-dt);this.landingSafe=Math.max(0,this.landingSafe-dt);this.slideTime=Math.max(0,this.slideTime-dt);
  const objects=this.pool.items;for(const o of objects)if(o.active){o.prevZ=o.z;o.z-=this.speed*dt;}
  const nextGround=supportAt(objects,this.x);const absoluteFeet=this.groundY+this.jumpY;
  if(this.groundY>=2.72)for(const o of objects)if(o.active&&o.kind==='bus'&&Math.abs(o.lane-this.previousX)*3.2<1.31&&o.prevZ<=.42&&o.prevZ+o.length>=0)o.roofVisited=true;
  if(nextGround>this.groundY&&absoluteFeet+.24>=nextGround){this.jumpY=Math.max(0,absoluteFeet-nextGround);this.groundY=nextGround;}
  else if(nextGround<this.groundY){this.jumpY+=this.groundY-nextGround;this.groundY=nextGround;}
  if(this.jumpY>0||this.vy!==0){this.vy-=25*dt;this.jumpY+=this.vy*dt;this.jumpTime=Math.max(0,this.jumpTime-dt);if(this.jumpY<=0){this.jumpY=0;this.vy=0;this.jumpTime=0;this.emit('land');if(this.fastFall){this.fastFall=false;this.input('slide');}}}
  // Resolve a descending roof crossing before the swept side-impact test.
  // A coarse frame must not turn a landing onto a bus into a vehicle hit.
  if(nextGround===2.8&&this.vy<0&&absoluteFeet>=nextGround&&this.groundY+this.jumpY<=nextGround){this.groundY=nextGround;this.jumpY=0;this.vy=0;this.jumpTime=0;this.emit('land');}
  if(this.jumpY===0&&this.vy===0&&nextGround<=this.groundY+.24)this.groundY=nextGround;
  if(this.bufferTime>0){this.bufferTime-=dt;if(this.jumpY===0&&this.slideTime===0){const action=this.buffer;this.bufferTime=0;this.input(action);}}
  if(this.state===STATES.RUNNING)this.chase.update(dt,this);
  {this.meter=Math.min(100,this.meter+(2.6+Math.min(2.6,this.elapsed*.016))*dt*(this.power==='lion'?.08:1));if(this.meter>97)this.wasCritical=true;if(this.meter>=100){this.fail('meter');return;}this.nextPattern-=dt;if(this.nextPattern<=0)this.pattern();this.powerGap-=dt;if(this.powerGap<=0&&!this.power){const ids=['magnet','lion','afuera','dollars','rescue'];const id=this.firstPowerSpawned?ids[Math.max(0,this.powerCount-1)%5]:'rescue';const spawned=this.spawn('power',this.lastSafe,this.firstPowerSpawned?80:42,0,id);if(spawned){this.firstPowerSpawned=true;this.emit('powerSpawn',{id});}this.powerGap=18+this.random()*6;}}
  if(this.power){this.powerTime=Math.max(0,this.powerTime-dt);if(this.power==='rescue'){const sec=Math.ceil(this.powerTime);if(sec<=3&&sec!==this.rescueWarning){this.rescueWarning=sec;this.emit('rescueWarning',{seconds:sec});}}if(this.powerTime===0)this.endPower();}
  this.airY+=((this.power==='rescue'?5:0)-this.airY)*Math.min(1,dt*4.5);const feet=this.groundY+this.jumpY+this.airY;
  for(const o of objects){if(!o.active)continue;
   if(o.kind==='tp'&&this.power==='magnet'&&o.z<30&&o.z>-.5&&Math.abs(o.y-feet)<3.5){o.pull+=dt;o.lane+=(this.x-o.lane)*Math.min(1,dt*9);o.y+=(feet+.7-o.y)*Math.min(1,dt*7);o.z-=dt*26;}
   if(this.power==='afuera'&&BREAKABLE.has(o.kind)&&Math.abs(o.lane-this.x)<.4&&o.z<15&&o.z>0){this.destroy(o);continue;}
   if(['tp','dollar','power'].includes(o.kind)){if(o.z<1&&o.z>-.9&&Math.abs(o.lane-this.x)<.44&&(o.kind==='power'||Math.abs(o.y-(feet+.65))<1.05))this.pickup(o);}
   else if(o.kind==='newspapers'&&!o.resolved&&o.z<=.42&&o.prevZ>.42&&Math.abs(o.lane-this.x)<.7){o.resolved=true;this.emit('news',{lane:o.lane});this.chase.react('news');}
   else if(!o.resolved&&this.airY<.7&&!(o.kind==='bus'&&(o.roofVisited||this.groundY===2.8&&feet>=2.72))&&sweptContact(o,this.previousX,this.x,this.previousY,feet,this.slideTime>0&&this.slideTime<=.62&&this.power!=='lion')){if(this.power==='lion'&&BREAKABLE.has(o.kind)){this.destroy(o);continue;}if(this.grace<=0&&this.landingSafe<=0){this.collide(o);if(this.state===STATES.IMPACT)return;}o.resolved=true;}
   if(!o.resolved&&o.prevZ+o.length>0&&o.z+o.length<=0){o.resolved=true;const edge=Math.abs(o.lane-this.x)*3.2-shape(o.kind).width/2-.32;if(this.state===STATES.RUNNING&&this.nearCooldown===0&&edge>0&&edge<.18&&this.elapsed-this.lastActionTime<.35){this.score+=75*this.combo;this.nearCooldown=4;this.emit('near');}}
   if(o.z+o.length<-8)o.active=false;
  }
 }
 snapshot(){return {...super.snapshot(),groundY:this.groundY,feetY:this.groundY+this.jumpY+this.airY,simTicks:this.simTicks,seed:this.runSeed,patternHistory:[...this.patternHistory],chase:this.chase.snapshot()};}
}
