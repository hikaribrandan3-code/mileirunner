// Simulation-owned chase. Presentation cannot catch the player or award points.
export class PressChase{
 constructor(emit){this.emit=emit;this.reset();}
 reset(){this.state='normal';this.timer=0;this.gap=7.8;this.nextAt=6;this.cycles=0;this.karina=false;this.hits=0;this.viewerCount=18400;this.live=false;this.pressureBand=0;this.commentCooldown=0;this.lastEvent='';}
 set(state){this.state=state;this.timer=0;this.emit('chase',{phase:state,gap:this.gap,karina:this.karina});}
 update(dt,e){this.commentCooldown=Math.max(0,this.commentCooldown-dt);this.timer+=dt;if(this.live)this.viewerCount=Math.min(999900,this.viewerCount+dt*(this.gap<=4.25?520:180));
  if(this.state==='normal'&&e.elapsed>=this.nextAt){this.karina=this.cycles>0&&e.elapsed>=50&&this.cycles%3===1;this.set('warning');}
  else if(this.state==='warning'&&this.timer>=2){this.gap=5.8;this.cycles++;this.live=true;this.set('appearing');}
  else if(this.state==='appearing'&&this.timer>=1.2)this.set('active');
  else if(this.state==='active'){this.gap=Math.min(7.8,this.gap+dt*(e.power==='lion'?.7:e.power==='rescue'?.85:.23));if(this.gap>=7.4){this.set('escape');this.emit('pressEscape');}}
  else if(this.state==='escape'&&this.timer>=1.4){this.nextAt=e.elapsed+17;this.karina=false;this.set('normal');}
  const band=e.meter>=85?2:e.meter>=65?1:0;if(band>this.pressureBand)this.react('pressure',{severity:band});this.pressureBand=band;
 }
 hit(){this.hits++;if(['appearing','active'].includes(this.state)&&this.gap<=4.25){this.gap=1.9;this.react('caught');this.set('caught');return true;}
  this.live=true;this.gap=3.2;this.timer=0;this.cycles+=this.state==='normal'?1:0;this.set('active');this.react('hit');return false;
 }
 react(kind,details={}){if(!this.live&&kind!=='hit')return;const gain={hit:14800,caught:35000,near:2700,lion:12000,rescue:6000,pressure:7500,escape:4200,news:3600}[kind]||0;this.viewerCount=Math.min(999900,this.viewerCount+gain);if(this.commentCooldown<=0||['hit','caught','lion'].includes(kind)){this.emit('broadcast',{kind,viewers:this.viewerCount,...details});this.commentCooldown=1.2;}this.lastEvent=kind;}
 snapshot(){return {state:this.state,gap:this.gap,timer:this.timer,karina:this.karina,live:this.live,viewers:this.viewerCount,cycles:this.cycles,hits:this.hits,nextAt:this.nextAt};}
}
