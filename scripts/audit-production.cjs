const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.AUDIT_BASE||'https://diaperboyz.vercel.app';
const engine=process.env.AUDIT_BROWSER||'chromium',output=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-production-smoke';
const checks=[],errors=[],failed=[];fs.mkdirSync(output,{recursive:true});
function check(label,value){assert(value,label);checks.push(label);console.log('PASS',label)}
(async()=>{
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
 try{
  for(const file of ['game/rebuild/pressure.js','game/rebuild/power-rules.js','game/rebuild/rig-materials.js','game/rebuild/engine.js','game/rebuild/renderer.js','game/rebuild/main.js','game/rebuild/effects.js','game/rebuild/characters.js']){
   const response=await page.request.get(base+'/'+file);
   check('production matches reviewed '+file,response.ok()&&(await response.text())===fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
  }
  await page.goto(base+'/game/');
  await page.locator('#menu').waitFor({timeout:60000});
  check('fresh production boot reaches menu without preview',await page.locator('#game').getAttribute('data-state')==='MENU');
  check('production debug is absent',await page.evaluate(()=>!window.DiaperDebug));
  await page.locator('#menu [data-action=characters]').click();
  const locks=await page.locator('#characters [data-character]').evaluateAll(b=>b.map(v=>v.querySelector('small').textContent));
  assert.deepEqual(locks,['','60 s','90 s','120 s']);check('fresh production has only Milei available',true);
  // Private browser profile only: exercise already-earned character flows.
  await page.evaluate(()=>localStorage.setItem('diaper-run-v1',JSON.stringify({progress:{unlocked:{milei:true,trump:true,bibi:true,ben:true}},prefs:{character:0,difficulty:'easy'}})));
  await page.reload();await page.locator('#menu').waitFor({timeout:60000});
  for(const [i,id] of ['milei','trump','bibi','ben'].entries()){
   await page.locator('#menu [data-action=characters]').click();
   await page.locator('[data-character="'+i+'"]').click();
   await page.locator('#selector-play').click();
   await page.locator('#cinematic').waitFor({timeout:30000});
   await page.waitForFunction(id=>document.querySelector('#cinematic').dataset.character===id,id);
   check('production selected intro '+id,true);
   await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='RUNNING',null,{timeout:20000});
   check('production intro reaches playable '+id,true);
   await page.locator('#pause').click();await page.locator('#paused').waitFor();
   check('production pause has selected face '+id,(await page.locator('.pause-hero').getAttribute('src')).includes('selector-'+id+'-portrait'));
   await page.locator('#paused [data-action=menu]').click();await page.locator('#menu').waitFor();
  }
  check('production smoke has no runtime errors',errors.length===0);
  check('production smoke has no missing assets',failed.length===0);
  await page.screenshot({path:path.join(output,'production-menu.png')});
 }finally{fs.writeFileSync(path.join(output,'production-smoke.json'),JSON.stringify({base,engine,checks,errors,failed},null,2));await browser.close()}
 console.log('TOTAL',checks.length,'PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
