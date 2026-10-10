// Test the listing's actual iframe, not just the standalone game route.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const kind=process.env.AUDIT_BROWSER||'chromium',base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
const out=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-ipad-audit/'+kind;
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],missing=[];
function check(label,value){assert(value,label);checks.push(label);console.log('PASS',label);}
(async()=>{
 const browser=await pw[kind].launch({headless:true,...(kind==='chromium'?{channel:'chrome'}:{})});
 const context=await browser.newContext({viewport:{width:834,height:1194},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const p=await context.newPage();
 p.on('pageerror',e=>errors.push(e.stack));
 p.on('response',r=>{if(r.status()>=400&&!r.url().includes('google-analytics'))missing.push(r.status()+' '+r.url());});
 async function frame(){await p.frameLocator('#game-frame').locator('#menu').waitFor({timeout:60000});return p.frames().find(f=>f.url().includes('/game/'));}
 async function fitted(f,label){
  const geometry=await f.evaluate(()=>{const g=document.querySelector('#game').getBoundingClientRect(),c=document.querySelector('#world').getBoundingClientRect();return {w:innerWidth,h:innerHeight,g:{x:g.x,y:g.y,w:g.width,h:g.height},c:{w:c.width,h:c.height},overflow:document.documentElement.scrollWidth>innerWidth};});
  const viewport=p.viewportSize(),dialog=await p.locator('#game-dialog').boundingBox();
  check(label+' dialog fills browser',Math.abs(dialog.x)<1&&Math.abs(dialog.y)<1&&Math.abs(dialog.width-viewport.width)<1&&Math.abs(dialog.height-viewport.height)<1);
  check(label+' iframe, game and canvas fill browser',Math.abs(geometry.w-viewport.width)<1&&Math.abs(geometry.h-viewport.height)<1&&geometry.g.x===0&&geometry.g.y===0&&Math.abs(geometry.g.w-viewport.width)<1&&Math.abs(geometry.g.h-viewport.height)<1&&geometry.c.w===geometry.g.w&&geometry.c.h===geometry.g.h&&!geometry.overflow);
 }
 async function controls(f,id,label){
  const clipped=await f.evaluate(id=>[...document.querySelector('#'+id).querySelectorAll('button,input,select')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&!e.closest('.dialog,.parody-sheet,.pause-panel')).filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5;}).map(e=>e.textContent.trim()||e.id),id);
  check(label+' '+id+' controls fit: '+clipped.join(', '),!clipped.length);
 }
 try{
  await p.goto(base);
  await p.locator('.get-row .play').tap();
  let f=await frame();
  check('real Play opens menu, not automatic preview',await f.locator('#game').getAttribute('data-state')==='MENU');
  check('normal launch has no test flags or debug hooks',!f.url().includes('test=')&&await f.evaluate(()=>!window.DiaperDebug));
  await fitted(f,'iPad 11 portrait real launch');
  await f.locator('#menu [data-action=characters]').tap();
  for(let i=1;i<4;i++){await f.locator(`[data-character="${i}"]`).tap();check('fresh profile character '+i+' remains locked',await f.locator('#selector-play').isDisabled());}
  await f.locator('[data-character="0"]').tap();await f.locator('#selector-play').tap();
  await f.locator('#cinematic').waitFor({timeout:60000});
  check('normal launch starts selected Milei cutscene',await f.locator('#cinematic').getAttribute('data-character')==='milei');
  await f.waitForFunction(()=>document.querySelector('#game').dataset.state==='RUNNING',null,{timeout:20000});
  await fitted(f,'iPad real running game');
  await f.locator('#pause').tap();await f.locator('#paused').waitFor();
  await p.setViewportSize({width:1194,height:834});await p.waitForTimeout(300);
  await fitted(f,'iPad rotated while paused');
  await f.locator('#paused [data-action=resume]').tap();await f.locator('#paused').waitFor({state:'hidden'});
  await f.locator('#pause').tap();await f.locator('#paused [data-action=menu]').tap();
  await f.locator('#menu [data-action=exit]').tap();await p.locator('#game-dialog').waitFor({state:'hidden'});
  check('exit restores listing and focus',await p.evaluate(()=>document.activeElement===document.querySelector('.get-row .play')&&document.body.style.overflow===''));
  await p.locator('.get-row .play').tap();f=await frame();await fitted(f,'iPad landscape reopen');
  await p.screenshot({path:path.join(out,'ipad-landscape-menu.png')});
  if(process.env.AUDIT_SMOKE==='1'){
   check('no runtime errors',!errors.length);check('no missing game assets',!missing.length);
   console.log('TOTAL',checks.length,'PASS');return;
  }

  // Explicit localhost fixture for powers/results; the real entry above has no hooks.
  await p.evaluate(()=>document.querySelector('#game-frame').src='game/?test=1&testCharacters=1');
  f=await frame();await f.waitForFunction(()=>window.DiaperDebug,null,{timeout:60000});
  await f.addStyleTag({content:'#acceptance-controls,#acceptance-stats{display:none!important}'});
  for(const [width,height] of [[834,1194],[1194,834],[834,1210],[1210,834],[820,1180],[1180,820],[1194,650],[600,834],[390,844],[844,390],[1440,900]]){
   const label=width+'x'+height;
   await p.setViewportSize({width,height});await p.waitForTimeout(250);await fitted(f,label);
   for(const id of ['menu','characters','settings','leaderboard','achievements','donate','disclaimer','paused','results']){
    await f.evaluate(()=>DiaperDebug.engine.menu());
    if(id==='paused')await f.evaluate(()=>{DiaperDebug.start();DiaperDebug.engine.pause();});
    else if(id==='results')await f.evaluate(()=>{DiaperDebug.start();DiaperDebug.engine.fail('meter');DiaperDebug.advance(2);});
    else if(id!=='menu')await f.locator(`#menu [data-action=${id}]`).tap();
    await controls(f,id,label);
    if(['settings','donate','disclaimer'].includes(id)){
     const target=f.locator(id==='settings'?'#settings [data-action=reset]':id==='donate'?'#donate [data-action=copy-alias]':'.parody-ok');
     await target.scrollIntoViewIfNeeded();
     check(label+' '+id+' final action reachable',await target.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+.5;}));
    }
    if([834,1194,1440].includes(width)&&['menu','characters','results'].includes(id))await p.screenshot({path:path.join(out,label+'-'+id+'.png')});
   }
  }
  for(const [width,height]of [[834,1194],[1194,834]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(200);
   for(const [i,id]of ['milei','trump','bibi','ben'].entries()){
    const label=width+'x'+height+' '+id;
    await f.evaluate(()=>DiaperDebug.engine.menu());await f.locator('#menu [data-action=characters]').tap();
    await f.locator(`[data-character="${i}"]`).tap();await f.locator('#selector-play').tap();
    await f.waitForFunction(id=>DiaperDebug.engine.state==='INTRO'&&document.querySelector('#cinematic').dataset.character===id,id,{timeout:60000});
    for(let shot=0;shot<5;shot++){
     await f.waitForFunction(shot=>document.querySelector('#cinematic').dataset.shot===String(shot),shot,{timeout:6000});
     await f.locator('#intro-stage').evaluate(img=>img.decode());check(label+' intro shot '+shot+' loads',true);
    }
    await f.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING',null,{timeout:6000});
    check(label+' full cutscene reaches gameplay',true);
    await f.evaluate(()=>{const e=DiaperDebug.engine;e.pool.clear();e.nextPattern=e.powerGap=999;e.meter=10;});
    for(const [action,dx,dy]of [['right',90,0],['left',-90,0],['jump',0,-90],['slide',0,90]]){
     const x=width*.5,y=height*.45;
     await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dy,{steps:5});await p.mouse.up();
     check(label+' swipe '+action,await f.evaluate(action=>DiaperDebug.engine.inputHistory.at(-1)?.action===action,action));await p.waitForTimeout(action==='jump'?850:200);
    }
    const flight=['rescue','gas','chosen','chickenflight'][i];
    await f.evaluate(power=>DiaperDebug.activate(power),flight);await p.waitForTimeout(1100);
    check(label+' flight renders at full viewport',await f.evaluate(()=>DiaperDebug.renderer.w===innerWidth&&DiaperDebug.renderer.h===innerHeight&&Math.abs(DiaperDebug.renderer.camera.aspect-innerWidth/innerHeight)<.001));
    await p.screenshot({path:path.join(out,width+'x'+height+'-'+id+'-flight.png')});
    await f.locator('#pause').tap();const paused=await f.evaluate(()=>({elapsed:DiaperDebug.engine.elapsed,powerTime:DiaperDebug.engine.powerTime,clock:DiaperDebug.renderer.clock}));
    await p.setViewportSize({width:height,height:width});await p.waitForTimeout(350);
    check(label+' rotation preserves pause and power',await f.evaluate(before=>DiaperDebug.engine.state==='PAUSED'&&DiaperDebug.engine.elapsed===before.elapsed&&DiaperDebug.engine.powerTime===before.powerTime&&DiaperDebug.renderer.clock===before.clock,paused));
    check(label+' paused camera resizes',await f.evaluate(()=>Math.abs(DiaperDebug.renderer.camera.aspect-innerWidth/innerHeight)<.001));
    await p.setViewportSize({width,height});await p.waitForTimeout(200);
    await f.locator('#paused [data-action=settings]').tap();await f.locator('#settings [data-action=back]').tap();
    await f.locator('#paused [data-action=resume]').tap();await f.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING');
    await f.evaluate(()=>{DiaperDebug.engine.fail('meter');DiaperDebug.advance(2);});await controls(f,'results',label);
    await f.locator('#results [data-action=characters]').tap();check(label+' can change character after loss',await f.locator('#selector-play').isVisible());
   }
  }
  check('no runtime errors',!errors.length);check('no missing game assets',!missing.length);
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({browser:kind,checks,errors,missing},null,2));await browser.close();}
 console.log('TOTAL',checks.length,'PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
