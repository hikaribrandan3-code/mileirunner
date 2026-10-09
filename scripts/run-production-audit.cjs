const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const runtime='/Users/daiskebrandan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const modulePath=process.env.PLAYWRIGHT_MODULE||(fs.existsSync(runtime)?runtime:'playwright');
const output=process.env.AUDIT_OUTPUT||'/private/tmp/diaper-production-review';fs.mkdirSync(output,{recursive:true});
const scripts=process.argv.slice(2).length?process.argv.slice(2):['audit-powers.cjs','audit-mobile.cjs','audit-mobile-failures.cjs','audit-responsive.cjs'];
async function run(browser,script){
 const dir=path.join(output,browser,path.basename(script,'.cjs'));fs.mkdirSync(dir,{recursive:true});
 const log=fs.createWriteStream(path.join(dir,script+'.log'));
 console.log('START',browser,script);
 const child=spawn(process.execPath,[path.join(__dirname,script)],{cwd:path.join(__dirname,'..'),env:{...process.env,PLAYWRIGHT_MODULE:modulePath,AUDIT_BROWSER:browser,AUDIT_OUTPUT:dir},stdio:['ignore','pipe','pipe']});
 let last='';child.stdout.on('data',b=>{log.write(b);last=(last+b.toString()).slice(-500)});child.stderr.on('data',b=>{log.write(b);process.stderr.write(b)});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});log.end();
 console.log('DONE',browser,script,'exit',code,last.trim().split('\n').at(-1));if(code!==0)throw Error(browser+' '+script+' failed');
}
(async()=>{
 for(const script of scripts){
  const browsers=script==='audit-inputs.cjs'?['chromium']:['chromium','webkit'];
  // Frame measurements must not compete with another browser on this host.
  if(script==='audit-performance.cjs')for(const browser of browsers)await run(browser,script);
  else await Promise.all(browsers.map(browser=>run(browser,script)));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
