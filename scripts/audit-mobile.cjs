// Real browser regression audit. Use PLAYWRIGHT_MODULE when Playwright is installed elsewhere.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
const kind=process.env.AUDIT_BROWSER||'chromium';
const output=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-mobile-audit/'+kind;
fs.mkdirSync(output,{recursive:true});
const checks=[],errors=[],missing=[];
const check=(label,value)=>{assert.ok(value,label);checks.push(label);console.log('PASS',label)};
(async()=>{
 const browser=await pw[kind].launch(kind==='chromium'?{channel:'chrome',headless:true}:{headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 const observe=p=>{p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())})};observe(page);
 const snap=()=>page.evaluate(()=>DiaperDebug.snapshot());
 const shot=name=>page.screenshot({path:path.join(output,name+'.png')});
 const ready=async()=>{await page.waitForFunction(()=>window.DiaperDebug,{},{timeout:60000});await page.addStyleTag({content:'#acceptance-controls,#acceptance-stats{display:none!important}'})};
 const menu=()=>page.evaluate(()=>DiaperDebug.engine.menu());
 const open=async action=>{await menu();await page.locator(`#menu [data-action=${action}]`).tap()};
 const back=async id=>{await page.locator(`#${id} [data-action=back]`).first().tap();check(id+' closes to menu',(await snap()).screen==='menu')};
 try{
  await page.goto(base+'/game/?test=1');await ready();
  check('fresh boot lands on main menu',(await snap()).screen==='menu');
  check('no automatic intro on initial load',(await snap()).state==='MENU');await shot('01-menu');
  await open('characters');
  for(let i=1;i<4;i++){await page.locator(`[data-character="${i}"]`).tap();check('fresh character '+i+' locked',await page.locator('#selector-play').isDisabled())}
  await page.locator('[data-character="0"]').tap();check('Milei initially available',await page.locator('#selector-play').isEnabled());
  for(const difficulty of['easy','medium','hard']){await page.locator(`[data-difficulty=${difficulty}]`).tap();check(difficulty+' saves',await page.evaluate(d=>DiaperDebug.prefs.difficulty===d,difficulty))}
  await page.locator('[data-difficulty=medium]').tap();await back('characters');
  for(const action of['leaderboard','achievements','donate','disclaimer']){await open(action);check(action+' opens',await page.locator('#'+action).isVisible());if(action==='donate'){for(const amount of['500','1000','2000','5000']){await page.locator(`[data-amount="${amount}"]`).tap();check('donation '+amount+' selects',(await page.locator('#other-amount').inputValue())===amount)}await page.locator('[data-action=copy-alias]').tap();check('copy alias gives feedback',(await page.locator('#donation-note').textContent()).includes('Daiske.mp'))}if(action==='disclaimer'){await page.locator('.parody-ok').tap();check('disclaimer acknowledgement closes',(await snap()).screen==='menu')}else await back(action)}
  await open('settings');
  for(const [id,value]of[['music','0.25'],['sfx','0.45'],['voice','0.5']]){await page.locator('#'+id).fill(value);check(id+' slider saves',await page.evaluate(([id,v])=>JSON.parse(localStorage.getItem('diaper-run-v1')).prefs[id]===Number(v),[id,value]))}
  for(const id of['mute','reduced','haptics']){await page.locator('#'+id).tap();check(id+' toggle responds',await page.evaluate(id=>id==='reduced'?!DiaperDebug.prefs.motion:DiaperDebug.prefs[id]===document.querySelector('#'+id).checked,id));await page.locator('#'+id).tap()}
  await page.locator('#language').selectOption('en');check('English applies',await page.locator('#menu [data-action=run] b').textContent()==='TAP TO RUN');await page.locator('#language').selectOption('es');
  await page.locator('[data-action=reset]').tap();await page.locator('[data-action=cancel-reset]').tap();check('cancel reset retains preferences',await page.evaluate(()=>DiaperDebug.prefs.music===.25));await back('settings');
  await page.locator('#menu [data-action=run]').tap();await page.waitForFunction(()=>DiaperDebug.engine.state==='INTRO');check('first play starts full Milei intro',await page.locator('#cinematic').getAttribute('data-character')==='milei');
  await page.locator('[data-action=skip-intro]').tap();await page.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING');check('skip intro enters playable run',(await snap()).screen==='run');
  // Fast-forward genuine engine ticks on an obstacle-free fixture to audit unlock
  // thresholds without asking automation to survive two minutes of random traffic.
  for(const [seconds,id]of[[60.1,'trump'],[90.1,'bibi'],[120.1,'ben']]){
   if(id!=='trump'){await page.locator('#results [data-action=restart]').tap();await page.waitForFunction(()=>DiaperDebug.engine.state==='INTRO');await page.locator('[data-action=skip-intro]').tap()}
   await page.evaluate(seconds=>{const d=DiaperDebug,e=d.engine;e.pool.clear();e.nextPattern=e.powerGap=999;e.meter=10;for(let t=0;t<seconds;t+=1/60){e.pool.clear();e.meter=10;e.update(1/60)}e.fail('meter');d.advance(2)},seconds);
   await page.locator('.unlock-reveal').waitFor();check(id+' unlock awarded by completed run',await page.evaluate(id=>DiaperDebug.engine.progress.unlocked[id],id));check(id+' unlock persisted',await page.evaluate(id=>JSON.parse(localStorage.getItem('diaper-run-v1')).progress.unlocked[id],id));await shot('unlock-'+id);
   while(await page.locator('.unlock-reveal').count())await page.locator('.unlock-reveal button').tap();check('unlock closes to results '+id,(await snap()).screen==='results');
  }
  await menu();await page.reload();await ready();check('unlocks survive reload',await page.evaluate(()=>['trump','bibi','ben'].every(id=>DiaperDebug.engine.progress.unlocked[id])));check('returning player still boots to menu',(await snap()).screen==='menu');
  await open('characters');
  const ids=['milei','trump','bibi','ben'],flight=['rescue','gas','chosen','chickenflight'];
  const kits=[['lion','afuera','magnet','dollars'],['ham','maga','burger'],['bibi','speech','victim'],['bigben','chicken','presspanic']];
  for(const index of[1,2,3,0]){
   const id=ids[index];await page.locator(`[data-character="${index}"]`).tap();await page.locator('#selector-play').tap();await page.waitForFunction(i=>DiaperDebug.engine.state==='INTRO'&&DiaperDebug.engine.characterIndex===i,index,{timeout:30000});
   check(id+' has matching model',await page.evaluate(id=>DiaperDebug.renderer.character.id===id,id));
   for(const portrait of['#meter-face','.pause-hero'])check(id+' '+portrait+' matches',(await page.locator(portrait).getAttribute('src')).includes('selector-'+id+'-portrait'));
   for(let n=0;n<5;n++){await page.waitForFunction(n=>document.querySelector('#cinematic').dataset.shot===String(n),n,{timeout:4000});check(id+' intro shot '+n+' displays',await page.evaluate(()=>{const i=document.querySelector('#intro-stage');return i.complete&&i.naturalWidth>0}));if(n===1)await shot('intro-'+id)}
   await page.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING',{},{timeout:5000});check(id+' cinematic hands off to gameplay',(await snap()).screen==='run');
   await page.evaluate(()=>{const e=DiaperDebug.engine;e.pool.clear();e.nextPattern=999;e.powerGap=.01;e.meter=15});await page.waitForFunction(()=>DiaperDebug.engine.pool.items.some(o=>o.active&&o.kind==='power'));
   check(id+' first spawned power is flight',await page.evaluate(power=>DiaperDebug.engine.pool.items.find(o=>o.active&&o.kind==='power').power===power,flight[index]));
   await page.evaluate(()=>{const e=DiaperDebug.engine;e.pool.clear();e.nextPattern=e.powerGap=999;e.meter=15});
   for(const [action,dx,dy]of[['right',75,0],['left',-75,0],['jump',0,-75],['slide',0,75]]){
    await page.mouse.move(150,300);await page.mouse.down();await page.mouse.move(150+dx,300+dy,{steps:6});await page.mouse.up();
    check(id+' swipe '+action,await page.evaluate(a=>DiaperDebug.engine.inputHistory.at(-1).action===a,action));await page.waitForTimeout(action==='jump'?850:200)
   }
   for(const power of[flight[index],...kits[index]]){
    await page.evaluate(power=>{const d=DiaperDebug;d.engine.endPower();d.engine.pool.clear();d.engine.meter=15;d.activate(power)},power);await page.waitForTimeout(1150);check(id+' power '+power+' renders',(await snap()).power===power);
    if(power===flight[index]){await shot('flight-'+id);if(index!==2)check(id+' carrier and rope visible',await page.evaluate(()=>DiaperDebug.renderer.helicopter.visible&&DiaperDebug.renderer.heliRopeLength>1));}
    await page.locator('#pause').tap();const paused=await snap();await page.waitForTimeout(180);check(id+' '+power+' pause freezes simulation',(await snap()).elapsed===paused.elapsed);await page.locator('#paused [data-action=resume]').tap();await page.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING',{},{timeout:3000});
    await page.evaluate(()=>{DiaperDebug.engine.endPower();DiaperDebug.engine.pool.clear();});check(id+' '+power+' sound loop stops',await page.evaluate(()=>DiaperDebug.audio.loops.size===0))
   }
   await page.locator('#pause').tap();await page.locator('#paused [data-action=settings]').tap();await page.locator('#settings [data-action=back]').tap();check(id+' settings returns to pause',(await snap()).screen==='paused');await page.locator('#paused [data-action=resume]').tap();await page.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING');
   await page.evaluate(()=>{DiaperDebug.engine.fail('meter');DiaperDebug.advance(2)});await page.locator('#results').waitFor();await shot('results-'+id);
   await page.locator('#results [data-action=share]').tap();await page.waitForFunction(()=>document.querySelector('#share-image').naturalWidth===720);check(id+' share card generates',true);await page.locator('#share [data-action=back]').tap();check(id+' share returns to results',(await snap()).screen==='results');
   await page.locator('#results [data-action=settings]').tap();await page.locator('#settings [data-action=back]').tap();check(id+' result settings returns',(await snap()).screen==='results');
   await page.locator('#results [data-action=characters]').tap();check(id+' loss permits character change',await page.locator('#selector-play').isVisible());
  }
  // Deliberately interrupted intro must resume without losing its shot/time.
  await page.locator('#selector-play').tap();await page.waitForFunction(()=>DiaperDebug.engine.state==='INTRO');await page.waitForTimeout(400);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const interrupted=await snap();check('backgrounding intro pauses',interrupted.state==='PAUSED');await page.locator('#paused [data-action=resume]').tap();check('resume restores intro',await page.evaluate(()=>DiaperDebug.engine.state==='INTRO'));await page.locator('[data-action=skip-intro]').tap();
  // Exhaustively check every menu control at portrait, short browser chrome, and landscape sizes.
  for(const [width,height]of[[320,568],[360,640],[375,667],[390,844],[430,932],[844,390]]){
   await page.setViewportSize({width,height});
   for(const action of['menu','characters','settings','leaderboard','achievements','donate','disclaimer','paused','results']){
    await menu();if(action==='paused')await page.evaluate(()=>{DiaperDebug.start();DiaperDebug.engine.pause()});else if(action==='results')await page.evaluate(()=>{DiaperDebug.start();DiaperDebug.engine.fail('meter');DiaperDebug.advance(2)});else if(action!=='menu')await page.locator(`#menu [data-action=${action}]`).tap();
    check(`${width}x${height} ${action} has no clipped fixed buttons`,await page.evaluate(id=>{const root=document.querySelector('#'+id);return document.documentElement.scrollWidth<=innerWidth&&[...root.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&!e.closest('.dialog,.parody-sheet,.pause-panel')).every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+.5&&r.top>=0&&r.bottom<=innerHeight+.5})},action));
    if(action==='characters')for(let i=0;i<4;i++)await page.locator(`[data-character="${i}"]`).tap();
    if(action==='settings'||action==='donate'){const target=page.locator(action==='settings'?'[data-action=reset]':'[data-action=copy-alias]');await target.scrollIntoViewIfNeeded();check(`${width}x${height} ${action} scroll reaches bottom`,await target.isVisible());}
   }
   await shot('layout-'+width+'x'+height);
  }
  await page.setViewportSize({width:390,height:844});await open('settings');await page.locator('[data-action=reset]').tap();await page.locator('[data-action=confirm-reset]').tap();check('reset removes unlocks and returns Milei',await page.evaluate(()=>DiaperDebug.prefs.character===0&&!DiaperDebug.engine.progress.unlocked.trump));await back('settings');
  // Native exit/reopen through the actual listing iframe, with no test hooks.
  const host=await ctx.newPage();observe(host);await host.goto(base);await host.locator('.get-row .play').tap();const frame=host.frameLocator('#game-frame');await frame.locator('#menu').waitFor({timeout:60000});check('website tap loads main menu',true);check('normal game exposes no debug hooks',await frame.locator('body').evaluate(()=>!window.DiaperDebug));await frame.locator('#menu [data-action=exit]').tap();await host.locator('#game-dialog').waitFor({state:'hidden'});check('game exit closes website dialog',true);await host.locator('.get-row .play').tap();await frame.locator('#menu').waitFor({timeout:60000});check('website can reopen the game',true);await host.locator('#close-game').tap();await host.close();
  check('no uncaught runtime errors',errors.length===0);check('no missing runtime assets',missing.length===0);
 }finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({browser:kind,checks,errors,missing},null,2));await browser.close()}
 console.log('TOTAL',checks.length,'PASS');
})().catch(error=>{console.error(error);process.exit(1)});
