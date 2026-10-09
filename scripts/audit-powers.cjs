const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const kind=process.env.AUDIT_BROWSER||'chromium',base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
const out=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-production-review/'+kind;
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],missing=[],memory=[];
const check=(label,value)=>{assert(value,label);checks.push(label);console.log('PASS',label)};
(async()=>{
 const browser=await pw[kind].launch(kind==='chromium'?{channel:'chrome',headless:true}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())});
 try{
  await page.goto(base+'/game/?test=1&testCharacters=1');await page.waitForFunction(()=>window.DiaperDebug,{},{timeout:60000});
  await page.addStyleTag({content:'#acceptance-controls,#acceptance-stats{display:none!important}'});
  const select=async index=>{
   await page.evaluate(()=>DiaperDebug.engine.menu());await page.locator('#menu [data-action=characters]').click();
   await page.locator('[data-character="'+index+'"]').click();await page.locator('#selector-play').click();
   await page.waitForFunction(i=>DiaperDebug.engine.characterIndex===i&&DiaperDebug.engine.state==='INTRO',index);
   await page.locator('[data-action=skip-intro]').click();await page.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING');
   await page.evaluate(()=>{const e=DiaperDebug.engine;e.pool.clear();e.nextPattern=e.powerGap=999;e.meter=45});
  };
  const kits=[['rescue','lion','afuera','magnet','dollars'],['gas','ham','burger','maga'],['chosen','bibi','speech','victim'],['chickenflight','bigben','presspanic','chicken']];
  for(let index=0;index<4;index++){
   await select(index);
   for(const id of kits[index]){
    await page.evaluate(id=>{const d=DiaperDebug;d.engine.endPower();d.engine.pool.clear();d.engine.meter=45;d.activate(id)},id);
    await page.waitForTimeout(700);
    check(id+' HUD and renderer agree',await page.evaluate(id=>DiaperDebug.engine.power===id&&DiaperDebug.renderer.signature.stats.power===id&&document.querySelector('#power-hud').hidden===false,id));
    check(id+' power icon decodes',await page.locator('#power-icon').evaluate(i=>i.complete&&i.naturalWidth>0));
    if(['lion','ham','bibi','bigben'].includes(id))check(id+' enlarged head attached',await page.evaluate(()=>DiaperDebug.renderer.signature.size>1.8));
    if(id==='afuera'){
     check('chainsaw texture and visible weapon',await page.evaluate(()=>{const r=DiaperDebug.renderer;return r.chainsaw.visible&&r.chainsaw.material.map.image.width>0&&Math.abs(r.chainsaw.scale.x)>1}));
     check('chainsaw no longer replaced by a fire arc',await page.evaluate(()=>!DiaperDebug.renderer.signature.fx.visible));
     await page.evaluate(()=>{for(const kind of ['bus','high','portable','dumpster'])DiaperDebug.engine.spawn(kind,0,10)});
     await page.waitForTimeout(100);check('chainsaw clears visible traffic',await page.evaluate(()=>!DiaperDebug.engine.pool.items.some(o=>o.active&&['bus','high','portable','dumpster'].includes(o.kind))));
    }
    if(id==='presspanic'){
     await page.evaluate(()=>{for(const lane of[-1,0,1])DiaperDebug.engine.spawn('bus',lane,12)});
     await page.waitForTimeout(950);check('paper storm clears all three lanes',await page.evaluate(()=>!DiaperDebug.engine.pool.items.some(o=>o.active&&o.kind==='bus')));
    }
    if(id==='speech'){
     await page.evaluate(()=>{for(const lane of[-1,0,1])DiaperDebug.engine.spawn('bus',lane,12)});
     await page.waitForTimeout(100);check('speech leaves side lanes intact',await page.evaluate(()=>DiaperDebug.engine.pool.items.filter(o=>o.active&&o.kind==='bus').length===2));
    }
    check(id+' diaper stain is bound to the rig',await page.evaluate(()=>{const f=DiaperDebug.renderer.effects;return f.stains.length>0&&f.stains.every(m=>Number.isFinite(m.userData.pressure.value)&&Math.abs(m.userData.pressure.value-DiaperDebug.engine.meter)<.3)}));
    await page.screenshot({path:path.join(out,id+'-phone.png')});
    await page.evaluate(()=>{DiaperDebug.engine.endPower();DiaperDebug.engine.pool.clear()});
    await page.waitForTimeout(250);
    check(id+' clears sound loops',await page.evaluate(()=>DiaperDebug.audio.loops.size===0));
   }
  }
  for(const [width,height]of[[320,568],[768,1024],[1024,768],[1440,900]]){
   await page.setViewportSize({width,height});await select(0);await page.evaluate(()=>DiaperDebug.activate('afuera'));await page.waitForTimeout(550);
   check(width+'x'+height+' chainsaw on screen',await page.evaluate(async()=>{const T=await import('/game/rebuild/vendor/three.module.min.js');const r=DiaperDebug.renderer,p=r.chainsaw.getWorldPosition(new T.Vector3()).project(r.camera);return r.chainsaw.visible&&Math.abs(p.x)<1&&Math.abs(p.y)<1}));
   await page.screenshot({path:path.join(out,'chainsaw-'+width+'x'+height+'.png')});
  }
  await page.setViewportSize({width:390,height:844});
  // Warm all characters, then compare complete four-character cycles.
  for(let cycle=0;cycle<4;cycle++){
   for(const index of[1,2,3,0]){await select(index);await page.waitForTimeout(80);}
   memory.push(await page.evaluate(()=>({textures:DiaperDebug.renderer.gl.info.memory.textures,geometries:DiaperDebug.renderer.gl.info.memory.geometries})));
  }
  check('repeated character swaps have bounded texture memory',memory.slice(1).every(m=>m.textures<=memory[1].textures+1));
  check('repeated character swaps have bounded geometry memory',memory.slice(1).every(m=>m.geometries<=memory[1].geometries+1));
  check('no missing power-up assets',missing.length===0);check('no uncaught power-up errors',errors.length===0);
 }finally{fs.writeFileSync(path.join(out,'powers-report.json'),JSON.stringify({browser:kind,checks,errors,missing,memory},null,2));await browser.close()}
 console.log('TOTAL',checks.length,'PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
