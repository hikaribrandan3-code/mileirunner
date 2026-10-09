import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {contactShadowMaterial,buildProp} from './models.js';
import {supportAt} from './track.js';
import {advancePursuer} from './pursuit-motion.js';
function fabricMaps(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),d=g.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,fold=Math.sin(y*.15+Math.sin(x*.06)*1.6)*14+Math.cos(x*.12+y*.03)*8,weave=((x+y)%2?4:-4);const v=211+fold+weave;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}g.putImageData(d,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=2;return tex;}
const loader=new T.TextureLoader(),DOWN=new T.Vector3(0,-1,0);
const plate=(tex,w,h)=>new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.045,alphaToCoverage:true,depthWrite:true,toneMapped:false,side:T.DoubleSide}));
export class PressActors{
 constructor(renderer){this.r=renderer;this.root=new T.Group();this.root.name='animated-press';renderer.scene.add(this.root);this.fabric=fabricMaps();this.actors=[];this.clock=0;this.feedEnabled=true;this.feedFrames=0;this.feedCost=[];this.ready=null;}
 ensureLoaded(){if(!this.ready)this.ready=this.load().then(async()=>{await this.r.gl.compileAsync(this.r.scene,this.r.camera);return this;});return this.ready;}
 async art(name,w,h){const tex=await loader.loadAsync('../art/press-'+name+'.webp');tex.colorSpace=T.SRGBColorSpace;return plate(tex,w||h*tex.image.width/tex.image.height,h);}
 async load(){for(const [kind,head,width]of[['male','reporter-male',.70],['female','reporter-female',.69],['karina','karina-head',.94]]){
  const [gltf,tex]=await Promise.all([new GLTFLoader().loadAsync('../models/press-'+kind+'.glb'),loader.loadAsync('../art/press-'+head+'.webp')]);tex.colorSpace=T.SRGBColorSpace;const g=gltf.scene;const parts={};g.traverse(o=>{parts[o.name]=o;if(o.isMesh){o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(/tailoring|stitched/.test(m.name)){m.map=this.fabric;m.bumpMap=this.fabric;m.bumpScale=.017;m.roughness=.82;m.needsUpdate=true;}}}});const headMesh=plate(tex,width,width*tex.image.height/tex.image.width);parts['head-anchor'].add(headMesh);headMesh.position.set(0,.04,.135);g.scale.setScalar(.78);const shadow=new T.Mesh(new T.CircleGeometry(.35,16),contactShadowMaterial.clone());shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,.65,1);this.r.scene.add(shadow);const actor={kind,g,parts,shadow,head:headMesh,phase:this.actors.length*1.9,mounts:[]};this.root.add(g);this.actors.push(actor);
 }
 const [male,female,karina]=this.actors;
 // Rear artwork is reused on a shallow camera housing, with its lens facing -Z.
 const camera=new T.Group(),cameraArt=await this.art('press-camera-tn',null,.68);camera.add(cameraArt);cameraArt.position.set(0,.19,.08);
 const housing=new T.Mesh(new T.BoxGeometry(.30,.29,.27),new T.MeshStandardMaterial({color:0x17202c,roughness:.55}));housing.position.set(.01,.17,-.07);camera.add(housing);
 const lens=new T.Mesh(new T.CylinderGeometry(.085,.095,.17,16),new T.MeshStandardMaterial({color:0x080d17,roughness:.3}));lens.rotation.x=Math.PI/2;lens.position.set(.01,.17,-.28);camera.add(lens);this.mount(male,1,camera,new T.Vector3(0,.02,-.005));
 const mic=await this.art('press-mic-white',null,.42);mic.position.y=.145;this.mount(female,-1,mic,new T.Vector3(0,.005,0));
 const phoneTex=await loader.loadAsync('../art/press-press-phone.webp');phoneTex.colorSpace=T.SRGBColorSpace;const phone=plate(phoneTex,.22,.59);phone.position.y=.19;phone.scale.setScalar(1.15);const phoneMount=this.mount(female,1,phone,new T.Vector3(0,0,0));this.phone=phone;
 const roll=buildProp('tp');roll.traverse(o=>{if(o.geometry?.type==='TorusGeometry')o.visible=false;});roll.scale.setScalar(.65);roll.rotation.z=Math.PI/2;roll.position.set(.25,0,0);this.mount(karina,1,roll,new T.Vector3(0,0,0));
 this.target=new T.WebGLRenderTarget(96,160,{depthBuffer:true});this.target.texture.colorSpace=T.SRGBColorSpace;this.feedCamera=new T.PerspectiveCamera(54,96/160,.1,180);this.feedScreen=new T.Mesh(new T.PlaneGeometry(.144,.278),new T.MeshBasicMaterial({map:this.target.texture,toneMapped:false}));this.feedScreen.position.set(0,.136,.003);phone.add(this.feedScreen);this.feedScreen.visible=false;
 this.loaded=true;return this;
 }
 mount(a,s,object,offset){const group=new T.Group();this.node(a,'hand',s).add(group);group.add(object);a.mounts.push({group,s,offset});return group;}
 node(a,name,s){return a.parts[name+'-'+s];}
 // Solve a restrained forward reach in body coordinates, instead of swinging a prop arm.
 reach(a,s,target,bend){const shoulder=this.node(a,'shoulder',s),elbow=this.node(a,'elbow',s),origin=shoulder.position.clone(),d=target.clone().sub(origin),length=Math.min(.526,Math.max(.08,d.length())),direction=d.normalize();const upper=.28,lower=.25,along=(upper*upper-lower*lower+length*length)/(2*length),height=Math.sqrt(Math.max(0,upper*upper-along*along));const perpendicular=bend.clone().addScaledVector(direction,-bend.dot(direction)).normalize();const upperDirection=direction.clone().multiplyScalar(along).addScaledVector(perpendicular,height).normalize();shoulder.quaternion.setFromUnitVectors(DOWN,upperDirection);const elbowPosition=origin.addScaledVector(upperDirection,upper),lowerDirection=target.clone().sub(elbowPosition).normalize().applyQuaternion(shoulder.quaternion.clone().invert());elbow.quaternion.setFromUnitVectors(DOWN,lowerDirection);}
 update(e,dt,x){this.clock+=dt;const c=e.chase;const active=c&&['appearing','active','escape','caught'].includes(c.state);this.root.visible=!!active&&!['MENU','INTRO','REPEAT_INTRO','BOOT','GAME_OVER','NEW_HIGH_SCORE'].includes(e.state);for(const a of this.actors)a.shadow.visible=this.root.visible&&a.g.visible;if(!active||!this.loaded)return;
 const closeness=Math.max(0,Math.min(1,(7-c.gap)/4));for(let i=0;i<this.actors.length;i++){const a=this.actors[i];a.g.visible=(i<2||c.karina||c.proofAll)&&(!this.proofSelection||this.proofSelection===a.kind);const side=i===0?-1:1,offset=i===2?0:side*1.12;const appear=c.state==='appearing'?Math.min(1,c.timer/1.2):c.state==='escape'?Math.max(0,1-c.timer/1.4):1;const z=2.65-closeness*.9+(i===2?.9:0)+(1-appear)*2;const p=this.clock*Math.min(15,9+e.speed*.09+closeness*1.5)+a.phase,stride=Math.sin(p),ground=supportAt(e.pool.items,(x+offset)/3.2,z);a.g.position.set(x+offset,ground,z);a.g.rotation.set(0,-(e.lane-e.x)*.09,side*.012*stride);
  if(a.lastElapsed>e.elapsed||!a.motion)a.motion={};a.lastElapsed=e.elapsed;
  const motion=advancePursuer(a.motion,e.pool.items,x+offset,z,e.speed,dt);
  a.g.position.x+=motion.dodge;
  a.parts.torso.rotation.set(-.07-motion.duck*.48,0,stride*.018);
  for(const s of[-1,1]){const swing=Math.sin(p+(s<0?Math.PI:0));const hip=this.node(a,'hip',s),knee=this.node(a,'knee',s),foot=this.node(a,'foot',s);hip.rotation.x=swing*.53;knee.rotation.x=-Math.max(0,-swing)*.86;foot.rotation.x=-hip.rotation.x-knee.rotation.x+Math.max(0,-swing)*.12;}
  if(i===0){this.reach(a,1,new T.Vector3(.42, .54+stride*.012,-.25),new T.Vector3(.9,-.8,0));this.reach(a,-1,new T.Vector3(.14,.51+stride*.012,-.20),new T.Vector3(-.8,-1,0));}
  else if(i===1){this.reach(a,-1,new T.Vector3(-.269,.43+stride*.025,-.35),new T.Vector3(-.4,-1,0));this.reach(a,1,new T.Vector3(.40,.56+stride*.018,-.24),new T.Vector3(.6,-1,0));}
  else{this.reach(a,1,new T.Vector3(.37,.28+stride*.09,-.20),new T.Vector3(.5,-1,0));this.node(a,'shoulder',-1).rotation.set(.1-stride*.35,0,-.07);this.node(a,'elbow',-1).rotation.set(.8,0,0);}
  a.g.updateMatrixWorld(true);
  // Both shoes use the same planted floor. The swing foot can lift; neither tunnels.
  const inverse=a.g.matrixWorld.clone().invert();let floor=Infinity;for(const s of[-1,1])for(const toe of[-.20,.08]){const pt=new T.Vector3(0,-.104,toe).applyMatrix4(this.node(a,'foot',s).matrixWorld).applyMatrix4(inverse);floor=Math.min(floor,pt.y*.78);}a.g.position.y=motion.y+.025-floor-motion.duck*.12;a.g.updateMatrixWorld(true);
  const actorQ=a.g.getWorldQuaternion(new T.Quaternion());for(const m of a.mounts){const hand=this.node(a,'hand',m.s),localQ=hand.getWorldQuaternion(new T.Quaternion()).invert().multiply(actorQ);m.group.quaternion.copy(localQ);m.group.position.copy(m.offset).applyQuaternion(localQ);}
  a.shadow.visible=this.root.visible&&a.g.visible;a.shadow.position.set(a.g.position.x,ground+.028,z);a.head.rotation.z=Math.sin(p)*.012;
 }
 }
 renderFeed(dt){if(!this.root.visible||!this.loaded||!this.feedEnabled||!this.actors[1].g.visible)return;this.feedTime=(this.feedTime||0)+dt;if(this.feedTime<(this.r.lowQuality?1:.20))return;this.feedTime=0;const t=performance.now(),gl=this.r.gl,old=gl.getRenderTarget();this.feedCamera.position.set(this.r.heroRoot.position.x*.88,3.2+this.r.heroRoot.position.y*.8,6.5);this.feedCamera.lookAt(this.r.heroRoot.position.x*.88,.45+this.r.heroRoot.position.y*.8,-8);this.root.visible=false;gl.setRenderTarget(this.target);gl.render(this.r.scene,this.feedCamera);gl.setRenderTarget(old);this.root.visible=true;this.feedScreen.visible=true;this.feedFrames++;this.feedCost.push(performance.now()-t);if(this.feedCost.length>120)this.feedCost.shift();}
 snapshot(){return {loaded:!!this.loaded,visible:this.root.visible,bodies:this.actors.filter(a=>a.g.visible).map(a=>a.kind),feedFrames:this.feedFrames,feedResolution:this.r.lowQuality?'96×160 @ 1fps':'96×160 @ 5fps',feedMeanMs:this.feedCost.reduce((a,b)=>a+b,0)/(this.feedCost.length||1)};}
 dispose(){this.target?.dispose();this.fabric.dispose();}
}
