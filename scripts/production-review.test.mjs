import test from 'node:test';
import assert from 'node:assert/strict';
import {RunnerEngine, STATES, POWERS} from '../game/rebuild/engine.js';
import {CHARACTERS, FLIGHT, BIG_HEAD} from '../game/rebuild/characters.js';
import {SHAPES, sweptContact} from '../game/rebuild/track.js';
import {readSave, writeSave} from '../game/rebuild/storage.js';
import {difficultyAt} from '../game/rebuild/difficulty.js';
import {fillRate, PAPER_RELIEF, visualPressure} from '../game/rebuild/pressure.js';
import {materialName} from '../game/rebuild/rig-materials.js';

function run(power, difficulty='medium') {
 const events=[];
 const e=new RunnerEngine({seed:15,onEvent:event=>events.push(event)});
 e.difficulty=difficulty;e.reset();e.state=STATES.RUNNING;
 e.nextPattern=e.powerGap=999;e.meter=30;
 if(power) assert.equal(e.activate(power),true);
 e.pool.clear();e.hitStop=0;
 return {e,events};
}
const step=(e,seconds)=>{for(let t=0;t<seconds;t+=1/60)e.update(Math.min(1/60,seconds-t));};

test('chainsaw clears every lane hazard, including vehicles, overheads and holes',()=>{
 const hazards=['bus','vehicle','taxi','falcon','dumpster','portable','donkey','high','mics','cone','low','block','trash','bags','doublebarrier','shampoo','soap','plunger','brush','camera','skip','gap','pothole','manhole','trench'];
 for(const kind of hazards){
  const {e,events}=run('afuera');const obstacle=e.spawn(kind,0,10);
  e.update(1/60);
  assert.equal(obstacle.active,false,kind+' should be cleared');
  assert.equal(e.state,STATES.RUNNING);assert.equal(events.filter(v=>v.type==='destroy').length,1);
 }
});

test('chainsaw preserves other lanes, distant obstacles, paper, ramps and roofs',()=>{
 const {e}=run('afuera');
 const protectedObjects=[e.spawn('bus',1,10),e.spawn('block',0,30),e.spawn('tp',0,10),e.spawn('dollar',0,10),e.spawn('ramp',0,10),e.spawn('roof',0,10)];
 e.update(1/60);assert.ok(protectedObjects.every(o=>o.active));
});

test('chainsaw follows lane changes and clears a long hazard already crossing the runner',()=>{
 const {e}=run('afuera');const left=e.spawn('bus',-1,9),old=e.spawn('bus',0,-2);
 e.update(1/60);assert.equal(old.active,false);assert.equal(left.active,true);
 e.input('left');step(e,.2);assert.equal(left.active,false);
});

test('each big head breaks overheads and previously missing solid blockers',()=>{
 for(const power of BIG_HEAD)for(const kind of ['high','mics','dumpster','portable','donkey','camera','doublebarrier']){
  const {e}=run(power);e.activationSafe=0;const o=e.spawn(kind,0,.6);
  step(e,.1);assert.equal(o.active,false,power+' / '+kind);assert.equal(e.state,STATES.RUNNING);
 }
});

test('burger bulldozer destroys traffic on contact without making holes disappear',()=>{
 for(const kind of ['bus','taxi','vehicle','falcon','dumpster','high','portable']){
  const {e}=run('burger');e.activationSafe=0;const o=e.spawn(kind,0,.6);
  step(e,.1);assert.equal(o.active,false,kind);assert.equal(e.state,STATES.RUNNING);
 }
 const {e}=run('burger');const hole=e.spawn('gap',0,10);e.update(1/60);assert.equal(hole.active,true);
});

test('Bibi speech clears only the selected lane and keeps road geometry',()=>{
 const {e}=run('speech');const same=e.spawn('bus',0,10),other=e.spawn('taxi',1,10),hole=e.spawn('gap',0,10),ramp=e.spawn('ramp',0,10);
 e.update(1/60);assert.equal(same.active,false);assert.ok(other.active&&hole.active&&ramp.active);
});

test('Ben paper storm clears all lanes in pulses and drives pursuers back',()=>{
 const {e,events}=run();e.chase.live=true;e.chase.state='active';e.chase.gap=3.2;e.activate('presspanic');e.hitStop=0;
 const blockers=[e.spawn('bus',-1,10),e.spawn('camera',0,10),e.spawn('portable',1,10)],hole=e.spawn('gap',1,10);
 e.update(1/60);assert.ok(blockers.every(o=>!o.active));assert.equal(hole.active,true);assert.ok(e.chase.gap>=7.8);
 step(e,2);const pulses=events.filter(v=>v.type==='paperStorm').length;assert.equal(pulses,3);
});

test('all four flights lift, avoid traffic, freeze on pause, expire and land safely',()=>{
 for(const power of FLIGHT){
  const {e}=run(power);step(e,.8);assert.ok(e.airY>4);
  e.spawn('bus',0,.6);const meter=e.meter;step(e,.1);assert.equal(e.chase.hits,0);assert.ok(e.meter>=meter);
  e.pause();const before=e.snapshot();step(e,3);assert.equal(e.powerTime,before.powerTime);assert.equal(e.elapsed,before.elapsed);
  e.resume();step(e,1.6);assert.equal(e.state,STATES.RUNNING);
  e.powerTime=.01;e.update(1/60);assert.equal(e.power,null);assert.ok(e.landingSafe>0);step(e,1.8);assert.ok(e.airY<.01);
 }
});

test('all flights award the same airborne paper route exactly once',()=>{
 for(const power of FLIGHT){
  const e=new RunnerEngine();e.reset();e.state=STATES.RUNNING;e.activate(power);
  assert.equal(e.pool.items.filter(o=>o.active&&o.kind==='tp').length,16,power);
 }
});

test('nonflight expiry warning fires once before expiry',()=>{
 for(const power of ['afuera','burger','speech','presspanic','chicken','lion']){
  const {e,events}=run(power);e.powerTime=2.01;step(e,.3);
  assert.equal(events.filter(v=>v.type==='powerWarning').length,1,power);
 }
});

test('chicken head has a useful overhead clearance but still collides with traffic',()=>{
 const {e}=run('chicken');e.activationSafe=e.grace=0;e.elapsed=20;
 e.spawn('high',0,.6);step(e,.1);assert.equal(e.chase.hits,0);
 e.spawn('bus',0,.6);step(e,.1);assert.equal(e.chase.hits,1);
 assert.equal(sweptContact({kind:'high',lane:0,z:0,prevZ:1},0,0,0,0,false),true);
});

test('shield and boost prevent repeated traffic hits and their timers expire',()=>{
 for(const power of ['victim','maga']){
  const {e}=run(power);e.activationSafe=0;e.elapsed=20;
  for(let i=0;i<4;i++){e.spawn('bus',0,.6);step(e,.1);}
  assert.equal(e.chase.hits,0);assert.equal(e.state,STATES.RUNNING);
  if(power==='maga')assert.ok(e.speed>difficultyAt('medium').start);
  e.powerTime=.01;e.update(1/60);assert.equal(e.power,null);
 }
});

test('paper relief, meter failure and difficulty timing use one explicit contract',()=>{
 const times=[];
 for(const difficulty of ['easy','medium','hard']){
  const {e}=run(null,difficulty);e.meter=e.tuning.meterStart;
  while(e.state===STATES.RUNNING&&e.elapsed<60)e.update(1/60);
  assert.equal(e.failReason,'meter');times.push(e.elapsed);
  const r=run(null,difficulty).e;r.meter=50;r.pickup(r.spawn('tp',0,0));assert.equal(r.meter,50-PAPER_RELIEF);
 }
 assert.ok(times[0]>times[1]&&times[1]>times[2]);assert.ok(times[0]<38&&times[1]<31&&times[2]<26);
 assert.equal(fillRate(difficultyAt('medium'),0,'lion'),2.8*.35);
 console.log('No-paper/no-power failure seconds',JSON.stringify(times));
});

test('all kits spawn flight first, unique third second, then big head',()=>{
 const expected=[['rescue','afuera','lion'],['gas','burger','ham'],['chosen','speech','bibi'],['chickenflight','presspanic','bigben']];
 for(const c of CHARACTERS){const {e,events}=run();e.characterIndex=c.index;
  for(let i=0;i<3;i++){e.pool.clear();e.powerGap=0;e.update(1/60);assert.equal(events.filter(v=>v.type==='powerSpawn').at(-1).id,expected[c.index][i]);}
 }
});

test('every power ends and restores the normal fill rate',()=>{
 for(const p of POWERS){const {e}=run(p.id);e.powerTime=.01;e.update(1/60);assert.equal(e.power,null,p.id);assert.ok(fillRate(e.tuning,e.elapsed,e.power)>=e.tuning.meterRate);}
});

test('storage survives denied access and sanitizes malformed saves',()=>{
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('denied')}});
 try{assert.equal(readSave().prefs.character,0);assert.equal(writeSave({}),false);}finally{delete globalThis.localStorage;}
 const corrupt={getItem:()=>JSON.stringify({progress:{bestScore:-99,totalTP:'fake',unlocked:{trump:'yes'}},prefs:{character:40,music:9,difficulty:'impossible'}})};
 const s=readSave(corrupt);assert.equal(s.progress.bestScore,0);assert.equal(s.progress.totalTP,0);assert.equal(s.progress.unlocked.trump,false);assert.equal(s.prefs.character,0);assert.equal(s.prefs.music,1);assert.equal(s.prefs.difficulty,'medium');
});

test('exported duplicate materials retain their gameplay semantics',()=>{
 for(const name of ['diaper cotton','rubber','midnight tailoring','reference head back']){
  assert.equal(materialName({name:name+'.001'}),name);
  assert.equal(materialName({name:name+'.002'}),name);
  assert.equal(materialName({name}),name);
 }
});


test('cosmetic leakage starts at 20 active seconds regardless of paper relief for every character',()=>{
 for(const character of CHARACTERS){
  assert.equal(visualPressure(0,19.99),0,character.id);
  assert.equal(visualPressure(0,20),84,character.id);
  assert.equal(visualPressure(0,30),100,character.id);
  assert.equal(visualPressure(95,10),95,character.id);
 }
 const {e}=run();e.elapsed=20;e.meter=0;e.pause();
 const elapsed=e.elapsed;for(let i=0;i<120;i++)e.update(1/60);
 assert.equal(e.elapsed,elapsed);assert.equal(e.meter,0);
 e.reset();assert.equal(e.elapsed,0);assert.equal(visualPressure(0,e.elapsed),0);
});


test('all survival unlocks award at the threshold, persist immediately and survive reload',()=>{
 for(const [seconds,id] of [[60,'trump'],[90,'bibi'],[120,'ben']]){
  const {e,events}=run();e.elapsed=seconds-.02;e.meter=0;e.grace=999;e.nextPattern=999;e.powerGap=999;
  e.update(.01);assert.notEqual(e.progress.unlocked?.[id],true);
  e.update(.02);assert.equal(e.progress.unlocked[id],true);
  assert.ok(events.some(event=>event.type==='characterUnlocked'&&event.id===id));
  assert.ok(events.some(event=>event.type==='save'));
  const store={value:null,setItem(key,value){this.value=value;},getItem(){return this.value;}};
  writeSave({progress:e.progress,prefs:{}},store);assert.equal(readSave(store).progress.unlocked[id],true);
  e.finish();assert.ok(e.unlockedThisRun.includes(id));
 }
});

test('saved survival records repair missing historical character unlock flags',()=>{
 const storage={getItem:()=>JSON.stringify({progress:{bestSurvival:120}})};
 const progress=readSave(storage).progress;
 for(const id of ['trump','bibi','ben'])assert.equal(progress.unlocked[id],true);
});
