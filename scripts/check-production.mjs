import {readdir, readFile, access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['app.js','game/engine.js','game/audio.js','game/storage.js'];
for(const name of await readdir(path.join(root,'game/rebuild')))if(name.endsWith('.js'))files.push('game/rebuild/'+name);
let imports=0,assets=0;
for(const file of files){
 const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
 if(result.status!==0)throw Error(file+'\n'+result.stderr);
 const source=await readFile(path.join(root,file),'utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+)['"]/g)){
  await access(path.resolve(root,path.dirname(file),match[1]));imports++;
 }
}
for(const manifest of ['game/audio/manifest-v3.json']){
 const data=JSON.parse(await readFile(path.join(root,manifest),'utf8'));
 for(const source of [data.circus,data.menuComedy,data.introComedy,data.gameOver,...Object.values(data.effects),...Object.values(data.loops)]){
  await access(path.join(root,'game/audio',source));assets++;
 }
}
for(const file of ['index.html','game/index.html','game/rebuild/index.html']){
 const html=await readFile(path.join(root,file),'utf8');
 const base=html.match(/<base href="([^"]+)"/)?.[1]||'./';
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const url=match[1].split('?')[0];if(/^(https?:|data:)/.test(url)||url===base)continue;
  await access(path.resolve(root,path.dirname(file),base,url));assets++;
 }
}
console.log(`Production syntax and files: ${files.length} modules, ${imports} local imports, ${assets} asset references PASS`);
