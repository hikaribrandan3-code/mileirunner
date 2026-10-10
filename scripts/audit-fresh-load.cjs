// Fresh browser/cache per sample. Set AUDIT_BASE and PLAYWRIGHT_MODULE as needed.
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5198';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const samples=[];
try{for(const slow of [false,true]){const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});if(slow)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:625000,uploadThroughput:125000});
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
const start=Date.now();await page.goto(base+'/game/?test=1',{waitUntil:'domcontentloaded',timeout:60000});
await page.locator('#menu').waitFor({state:'visible',timeout:90000});const menuMs=Date.now()-start;
const menuBytes=await page.evaluate(()=>performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0));
await page.waitForFunction(()=>window.DiaperDebug,null,{timeout:90000});const sceneMs=Date.now()-start;
await page.locator('#menu [data-action="run"]').click();await page.locator('#cinematic').waitFor({state:'visible',timeout:60000});const firstPlayMs=Date.now()-start;
await page.locator('[data-action="skip-intro"]').click();await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='RUNNING',{timeout:15000});
const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({file:r.name.split('/').pop(),bytes:r.transferSize,ms:Math.round(r.duration)})));
samples.push({connection:slow?'5 Mbps / 80 ms latency':'unthrottled',menuMs,sceneMs,firstPlayMs,menuBytes,totalBytes:resources.reduce((n,r)=>n+r.bytes,0),errors,largest:resources.sort((a,b)=>b.bytes-a.bytes).slice(0,8)});console.log(JSON.stringify(samples.at(-1)));await context.close();}
if(process.env.AUDIT_OUTPUT)fs.writeFileSync(process.env.AUDIT_OUTPUT,JSON.stringify({base,samples},null,2)+'\n');if(samples.some(s=>s.errors.length))process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
