// Native Chromium touch events through the same iframe used by the public site.
const assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
(async()=>{
 const browser=await pw.chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:834,height:1194},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.locator('.get-row .play').tap();
  await p.frameLocator('#game-frame').locator('#menu').waitFor({timeout:60000});
  await p.evaluate(()=>document.querySelector('#game-frame').src='game/?test=1&testCharacters=1');
  await p.waitForTimeout(250);
  const f=p.frames().find(f=>f.url().includes('/game/'));
  await f.waitForFunction(()=>window.DiaperDebug,null,{timeout:60000});
  const cdp=await context.newCDPSession(p);let checks=0;
  for(const [width,height] of [[834,1194],[1194,834]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(200);
   for(let character=0;character<4;character++){
    await f.evaluate(async character=>{await DiaperDebug.renderer.selectCharacter(character);DiaperDebug.prefs.character=character;DiaperDebug.engine.characterIndex=character;DiaperDebug.start();const e=DiaperDebug.engine;e.pool.clear();e.nextPattern=e.powerGap=999;e.meter=10;},character);
    for(const [action,dx,dy]of [['right',100,0],['left',-100,0],['jump',0,-100],['slide',0,100]]){
     const x=width*.5,y=height*.45;
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
     for(let n=1;n<=5;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*n/5,y:y+dy*n/5,id:1}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
     assert(await f.evaluate(action=>DiaperDebug.engine.inputHistory.at(-1)?.action===action,action),width+'x'+height+' character '+character+' native '+action);
     checks++;await p.waitForTimeout(action==='jump'?850:200);
    }
   }
  }
  assert.deepEqual(errors,[]);console.log('TOTAL',checks,'native iframe touch swipes PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
