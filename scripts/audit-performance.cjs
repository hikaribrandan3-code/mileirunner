const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.AUDIT_BROWSER||'chromium';
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
const output=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-performance';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.stack));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));
 const begin=Date.now(),samples=[];
 try{
  await page.goto(base+'/game/?test=1&testCharacters=1');
  await page.waitForFunction(()=>window.DiaperDebug,null,{timeout:60000});
  const bootMs=Date.now()-begin;
  await page.addStyleTag({content:'#acceptance-controls,#acceptance-stats{display:none!important}'});
  for(const i of [0,1,2,3]){
   await page.evaluate(()=>DiaperDebug.engine.menu());
   await page.locator('#menu [data-action=characters]').click();
   await page.locator('[data-character="'+i+'"]').click();
   await page.locator('#selector-play').click();
   await page.waitForFunction(i=>DiaperDebug.engine.state==='INTRO'&&DiaperDebug.engine.characterIndex===i,i);
   await page.locator('[data-action=skip-intro]').click();
   await page.waitForFunction(()=>DiaperDebug.engine.state==='RUNNING');
   await page.evaluate(()=>{const e=DiaperDebug.engine;e.grace=999;e.elapsed=20;e.meter=30;});
   await page.waitForTimeout(1500);
   const frames=await page.evaluate(()=>new Promise(resolve=>{
    const times=[],until=performance.now()+5000;let previous=0;
    function sample(t){if(previous)times.push(t-previous);previous=t;if(t<until)requestAnimationFrame(sample);else{times.sort((a,b)=>a-b);resolve({frames:times.length,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],maxMs:times.at(-1)})}}requestAnimationFrame(sample);
   }));
   samples.push(await page.evaluate(({frames,i})=>({character:i,frames,render:DiaperDebug.snapshot().render}),{frames,i}));
  }
  const resources=await page.evaluate(()=>{const r=performance.getEntriesByType('resource');return {requests:r.length,encodedBytes:r.reduce((n,v)=>n+v.encodedBodySize,0),largest:r.map(v=>({url:v.name,bytes:v.encodedBodySize})).sort((a,b)=>b.bytes-a.bytes).slice(0,8)}});
  assert.equal(errors.length,0,'runtime errors');assert.equal(failed.length,0,'failed requests');
  fs.writeFileSync(path.join(output,'performance.json'),JSON.stringify({engine,viewport:{width:390,height:844},bootMs,resources,samples,errors,failed,limitations:'Local desktop host, headless browser, warm shaders; not a physical phone/iPad benchmark. No device FPS threshold inferred.'},null,2));
  console.log(JSON.stringify({bootMs,encodedMiB:resources.encodedBytes/1048576,frames:samples.map(s=>({character:s.character,median:s.frames.medianMs,p95:s.frames.p95Ms,drawCalls:s.render.drawCalls,triangles:s.render.triangles}))}));
  console.log('TOTAL 2 PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
