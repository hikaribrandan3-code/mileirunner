// Tuning lives here. Unlocks use active time survived in ONE completed run.
export const TRUMP_UNLOCK_SECONDS=60;
export const BIBI_UNLOCK_SECONDS=90;
export const CHARACTERS=Object.freeze([
 {id:'milei',index:0,name:'MILEI · EL LEÓN',short:'MILEI',model:'milei-character',unlock:0,color:'#43caff',powers:['lion','afuera','rescue'],first:'rescue',portrait:'panic',result:'results',intro:['opening-crowd','speech','realization','escape','media-chase'],captions:['TRANSMISIÓN DESDE CASA ROSADA','TODO BAJO CONTROL','UN MOMENTO…','¡CORRÉ, LEÓN!',''],quote:'EL LEÓN SE CAGÓ'},
 {id:'trump',index:1,name:'TRUMP JR',short:'TRUMP JR',model:'trump-pig',unlock:TRUMP_UNLOCK_SECONDS,color:'#ff534f',powers:['ham','maga','burger','gas'],first:'gas',portrait:'trump-hero',result:'trump-over',intro:['trump-event','trump-speech','trump-realization','trump-escape','trump-chase'],captions:['LA CASA BLANCA · PARODIA','EL MEJOR DISCURSO. ENORME.','ESTO NO ESTABA EN EL PLAN…','¡RUN, PIG, RUN!',''],quote:'MAKE DIAPERS CLEAN AGAIN'},
 {id:'bibi',index:2,name:'BIBI BIBI',short:'BIBI BIBI',model:'bibi-bibi',unlock:BIBI_UNLOCK_SECONDS,color:'#6abaff',powers:['bibi','speech','victim','chosen'],first:'chosen',portrait:'bibi-hero',result:'bibi-over',intro:['bibi-event','bibi-speech','bibi-realization','bibi-escape','bibi-chase'],captions:['CONFERENCIA INTERNACIONAL · PARODIA','YO TENGO TODO BAJO CONTROL','¿QUIÉN APAGÓ EL MICRÓFONO?','¡BIBI, CORRÉ!',''],quote:'ESTO NECESITA OTRA CONFERENCIA'},
 {id:'ben',index:3,name:'BEN-GVIR',short:'BEN-GVIR',model:'ben-gvir',unlock:120,color:'#40d5c3',powers:['chicken','bigben','presspanic','chickenflight'],first:'chickenflight',portrait:'ben-hero',result:'ben-over',intro:['ben-event','ben-speech','ben-realization','ben-escape','ben-chase'],captions:['CONFERENCIA DE PRENSA · PARODIA','SIN COMENTARIOS','¿ALGUIEN TIENE PAPEL?','¡CORRÉ!',''],quote:'NO COMMENT. SOLO CLUCK.'}
]);
export const characterAt=i=>CHARACTERS.find(c=>c.index===i)||CHARACTERS[0];
export const isUnlocked=(progress,i)=>i===0||progress.unlocked?.[characterAt(i).id]===true;
export function awardCharacters(progress,seconds){
 progress.bestSurvival=Math.max(Number(progress.bestSurvival)||0,seconds);
 progress.unlocked={milei:true,...progress.unlocked};
 const earned=[];
 for(const c of CHARACTERS)if(c.unlock>0&&seconds>=c.unlock&&!progress.unlocked[c.id]){progress.unlocked[c.id]=true;earned.push(c.id);}
 return earned;
}
export const BONUS_POWERS=Object.freeze([
 {id:'ham',name:'HAM MODE',duration:7,color:'#ffbe35',icon:'🐷',family:'smash'},
 {id:'maga',name:'MAGA BOOST',duration:6,color:'#ff4a50',icon:'🧢',family:'boost'},
 {id:'burger',name:'BIG MAC ATTACK',duration:7,color:'#ffc83e',icon:'🍔',family:'bulldozer'},
 {id:'bibi',name:'BIBI BIBI',duration:7,color:'#ffd84c',icon:'♛',family:'smash'},
 {id:'speech',name:'SPEECH MODE',duration:6,color:'#6abaff',icon:'🎙',family:'lane'},
 {id:'victim',name:'VICTIM CARD',duration:8,color:'#5bd8ff',icon:'🛡',family:'shield'},
 {id:'gas',name:'AIR FORCE JR',duration:7,color:'#a1f44c',icon:'💨',family:'flight'},
 {id:'chosen',name:'THE CHOSEN FLIGHT',duration:7,color:'#ffe18a',icon:'✦',family:'flight'},
 {id:'chicken',name:'CHICKEN HEAD',duration:7,color:'#ffc249',icon:'🐔',family:'smallhead'},
 {id:'bigben',name:'BIG BEN MODE',duration:7,color:'#ffce4f',icon:'😳',family:'smash'},
 {id:'presspanic',name:'PAPER STORM',duration:6,color:'#42dcc9',icon:'📄',family:'storm'},
 {id:'chickenflight',name:'CLUCK AIRLINES',duration:7,color:'#fff3a2',icon:'🪽',family:'flight'}
]);
export const BIG_HEAD=new Set(['lion','ham','bibi','bigben']);
export const SMASH=new Set(['lion','ham','bibi','bigben','burger']);
export const PROTECTED=new Set(['maga','victim']);

export const FLIGHT=new Set(['rescue','gas','chosen','chickenflight']);
