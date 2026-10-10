import {characterAt,isUnlocked} from './characters.js';
const ART=['selector-milei-v1','selector-trump-v1','selector-bibi-v1','selector-ben-v1'];
const NAMES=['EL LEÓN','TRUMP JR','BIBI','BEN JR'];
const COLORS=['#ffe14b','#ff7490','#73d8ff','#ffad39'];
const KITS=[
 [['rescue','VUELO PRESIDENCIAL','RESCATE POR EL AIRE'],['lion','MODO GATO','CABEZA GRANDE · ROMPÉ TODO'],['afuera','¡AFUERA!','CORTÁ TODO · INCLUSO TRÁFICO']],
 [['gas','AIR FORCE JR','RESCATE MILITAR POR EL AIRE'],['burger','BIG MAC ATTACK','ARRASÁ CON EL TRÁFICO'],['ham','HAM MODE','CABEZA GRANDE · SIN FRENOS']],
 [['chosen','THE CHOSEN FLIGHT','POR ENCIMA DEL CAOS'],['speech','SPEECH MODE','DESPEJÁ TU CARRIL'],['bibi','BIBI BIBI','CABEZA GRANDE · ROMPÉ TODO']],
 [['chickenflight','CLUCK AIRLINES','EL POLLO TE LLEVA'],['presspanic','PAPER STORM','DESPEJÁ LOS TRES CARRILES'],['bigben','BIG BEN MODE','CABEZA GRANDE · ROMPÉ TODO'],['chicken','CHICKEN HEAD','CABEZA PEQUEÑA · MÁS FÁCIL ESQUIVAR']]
];
const ICON={rescue:'power-helicopter-v2',lion:'power-cat-v2',afuera:'power-chainsaw-v2',gas:'trump-helicopter-v2',chickenflight:'ben-chicken-drone-v2'};
export class CharacterSelector {
 constructor(root,{progress,prefs,onPlay}){
  Object.assign(this,{root,progress,prefs,onPlay,index:prefs.character,busy:false});
  this.hero=root.querySelector('#character-preview');
  root.querySelectorAll('[data-character]').forEach(b=>{const i=Number(b.dataset.character);b.querySelector('img').src='../art/'+ART[i].replace('-v1','-portrait-v1')+'.webp';b.querySelector('b').textContent=NAMES[i];b.addEventListener('click',()=>this.select(i));});
  root.querySelectorAll('[data-select-step]').forEach(b=>b.addEventListener('click',()=>this.select((this.index+Number(b.dataset.selectStep)+4)%4)));
  const stage=root.querySelector('.selector-stage');let pointer;
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointerup',e=>{if(pointer?.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25)this.select((this.index+(dx<0?1:3))%4);});
  stage.addEventListener('pointercancel',()=>pointer=null);
  stage.addEventListener('pointermove',e=>{if(!prefs.motion||pointer)return;const box=stage.getBoundingClientRect();this.hero.style.setProperty('--hero-tilt',((e.clientX-box.left)/box.width-.5)*5+'deg');});
  stage.addEventListener('pointerleave',()=>this.hero.style.setProperty('--hero-tilt','0deg'));
  root.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.select((this.index+(e.key==='ArrowRight'?1:3))%4);}});
  root.querySelector('#selector-play').addEventListener('click',async()=>{if(this.busy||!isUnlocked(progress,this.index))return;this.busy=true;this.render();try{await onPlay(this.index);}finally{this.busy=false;this.render();}});
 }
 open(){this.index=this.prefs.character;this.render();}
 select(index){if(this.busy||this.index===index)return;this.index=index;this.render();if(this.prefs.motion){this.hero.getAnimations().forEach(a=>a.cancel());this.hero.animate([{opacity:.15,transform:'translateX(24px) scale(.96)'},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:250,easing:'cubic-bezier(.2,.8,.2,1)'});}}
 render(){const c=characterAt(this.index),open=isUnlocked(this.progress,this.index),en=this.prefs.language==='en';
  this.root.style.setProperty('--runner-color',COLORS[this.index]);this.root.dataset.runner=c.id;
  this.hero.src='../art/'+ART[this.index]+'.webp';this.hero.alt=NAMES[this.index];
  this.root.querySelector('#character-name').textContent=NAMES[this.index];
  this.root.querySelector('#character-lock').textContent=open?(en?'READY TO RUN':'LISTO PARA EL CAOS'):(en?'SURVIVE '+c.unlock+' SECONDS IN ONE RUN · BEST: '+Math.floor(this.progress.bestSurvival||0)+' s':'SOBREVIVÍ '+c.unlock+' SEGUNDOS EN UNA CARRERA · TU MEJOR: '+Math.floor(this.progress.bestSurvival||0)+' s');
  this.root.querySelectorAll('[data-character]').forEach(b=>{const i=Number(b.dataset.character),available=isUnlocked(this.progress,i);b.setAttribute('aria-pressed',i===this.index);b.setAttribute('aria-label',NAMES[i]+(available?'':', '+characterAt(i).unlock+' s'));b.querySelector('small').textContent=available?'':characterAt(i).unlock+' s';});
  this.root.querySelector('#selector-abilities').replaceChildren(...KITS[this.index].map(([id,name,description])=>{const row=document.createElement('li'),img=new Image(),label=document.createElement('div'),strong=document.createElement('strong'),detail=document.createElement('small');img.src='../art/'+(ICON[id]||'power-'+id)+'.webp';img.alt='';strong.textContent=name;detail.textContent=description;label.append(strong,detail);row.append(img,label);return row;}));
  const play=this.root.querySelector('#selector-play');play.disabled=this.busy||!open;play.querySelector('b').textContent=this.busy?(en?'LOADING…':'CARGANDO…'):open?(en?'PLAY':'¡A CORRER!'):(en?'LOCKED':'BLOQUEADO');
 }
}
