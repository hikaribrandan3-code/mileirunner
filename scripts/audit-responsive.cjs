const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),kind=process.env.AUDIT_BROWSER||'chromium',base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
const out=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-responsive-audit/'+kind;fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(label,value)=>{assert(value,label);checks.push(label);console.log('PASS',label)};
(async()=>{const browser=await pw[kind].launch(kind==='chromium'?{channel:'chrome',headless:true}:{headless:true});
const p=await browser.newPage({viewport:{width:768,height:1024},hasTouch:true});p.on('pageerror',e=>errors.push(e.stack));
try{
 await p.goto(base+'/game/?test=1&testCharacters=1');await p.waitForFunction(()=>window.DiaperDebug,{},{timeout:60000});await p.addStyleTag({content:'#acceptance-controls,#acceptance-stats{display:none!important}'});
 for(const [width,height]of[[768,1024],[1024,768],[820,1180],[1180,820],[1024,1366],[1366,1024],[1280,720],[1440,900],[1920,1080]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(180);
  for(const action of['menu','characters','settings','leaderboard','achievements','donate','disclaimer','paused','results']){
   await p.evaluate(()=>DiaperDebug.engine.menu());
   if(action==='paused')await p.evaluate(()=>{DiaperDebug.start();DiaperDebug.engine.pause()});
   else if(action==='results')await p.evaluate(()=>{DiaperDebug.start();DiaperDebug.engine.fail('meter');DiaperDebug.advance(2)});
   else if(action!=='menu')await p.locator(`#menu [data-action=${action}]`).click();
   const layout=await p.evaluate(id=>{const game=document.querySelector('#game').getBoundingClientRect(),root=document.querySelector('#'+id);return {gameWidth:game.width,overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...root.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&!e.closest('.dialog,.parody-sheet,.pause-panel')).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+.5||r.top<0||r.bottom>innerHeight+.5}).map(e=>e.textContent.trim())}},action);
   check(`${width}x${height} ${action} controls fit`,!layout.overflow&&!layout.clipped.length&&layout.gameWidth===width);
   if(action==='characters')await p.locator('#character-preview').evaluate(image=>image.decode());
   if(action==='menu'||action==='characters'||action==='results'){await p.waitForTimeout(250);await p.screenshot({path:path.join(out,`${width}x${height}-${action}.png`)});}
  }
  await p.evaluate(()=>{DiaperDebug.start();const e=DiaperDebug.engine;e.nextPattern=e.powerGap=999;e.pool.clear();e.meter=10});
  for(const [key,action]of[['ArrowRight','right'],['a','left'],['Space','jump'],['ArrowDown','slide']]){await p.keyboard.press(key);check(`${width}x${height} keyboard ${action}`,await p.evaluate(a=>DiaperDebug.engine.inputHistory.at(-1).action===a,action));await p.waitForTimeout(action==='jump'?850:200)}
  await p.keyboard.press('p');check(`${width}x${height} keyboard pause`,await p.evaluate(()=>DiaperDebug.engine.state==='PAUSED'));await p.keyboard.press('p');await p.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING');
  await p.evaluate(()=>DiaperDebug.activate('rescue'));await p.waitForTimeout(700);await p.screenshot({path:path.join(out,`${width}x${height}-flight.png`)});
 }
 await p.goto(base);await p.locator('.get-row .play').click();await p.frameLocator('#game-frame').locator('#menu').waitFor({timeout:60000});check('hosted game dialog uses tablet width',await p.locator('#game-dialog').evaluate(e=>e.getBoundingClientRect().width>700));await p.locator('#close-game').click();check('desktop close returns to listing',!await p.locator('#game-dialog').isVisible());check('no uncaught responsive errors',!errors.length);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({browser:kind,checks,errors},null,2));await browser.close()}console.log('TOTAL',checks.length,'PASS');})().catch(e=>{console.error(e);process.exit(1)});
