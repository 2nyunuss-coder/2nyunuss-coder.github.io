/* Original YEA game rules. Rendering-independent, deterministic and replayable. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YeaStudio=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
  function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  const designs=[
    ['Damla vazo',[48,43,50,74,105,115,105,84,65]],
    ['Kum saati',[100,113,92,56,40,56,92,113,100]],
    ['Dalga',[65,100,76,48,84,114,85,48,70]],
    ['İskandinav vazo',[68,65,66,80,103,108,108,104,80]],
    ['Minyatür kadeh',[110,115,103,77,38,34,38,65,96]],
    ['Fener',[54,70,105,114,114,103,74,48,74]],
    ['Spiral ritim',[63,109,59,103,50,94,47,85,57]],
    ['Seramik form',[85,50,44,69,96,116,113,96,62]],
    ['Yaprak',[42,54,71,94,117,108,79,52,44]],
    ['Çift boğum',[73,98,106,80,43,76,108,98,73]],
    ['Lale',[115,106,87,62,43,43,46,72,100]],
    ['Kule formu',[54,52,70,92,75,100,85,115,115]]
  ];
  class WoodStudio{
    constructor(level=1){
      this.level=level;this.rows=128;this.name=designs[(level-1)%designs.length][0];
      const knots=designs[(level-1)%designs.length][1];
      this.target=Array.from({length:this.rows},(_,i)=>{const p=i/(this.rows-1)*(knots.length-1),k=Math.min(knots.length-2,Math.floor(p)),t=p-k;return mix(knots[k],knots[k+1],t*t*(3-2*t));});
      this.profile=Array(this.rows).fill(134);this.sanded=Array(this.rows).fill(0);this.coated=Array(this.rows).fill(0);
      this.phase='shape';this.status='playing';this.assist=true;this.precision=false;this.stain=0;this.seconds=0;this.revision=0;this.surfaceRevision=0;this.activity=0;this.lastRow=null;this.reveal=0;
    }
    accuracy(){const e=this.profile.reduce((sum,r,i)=>sum+Math.abs(r-this.target[i])*(r<this.target[i]?2.5:1),0);const max=this.target.reduce((s,r)=>s+134-r,0);return Math.round(clamp(100-e/max*100,0,100));}
    smoothness(){return Math.round(this.sanded.reduce((s,n)=>s+n,0)/this.rows*100);}
    coverage(){return Math.round(this.coated.reduce((s,n)=>s+n,0)/this.rows*100);}
    progress(){return this.phase==='shape'?this.accuracy():this.phase==='sand'?this.smoothness():this.phase==='finish'?this.coverage():100;}
    required(){return this.phase==='shape'?90:this.phase==='sand'?85:90;}
    endStroke(){this.lastRow=null;}
    cut(row,radius,dt){
      if(this.status!=='playing'||this.phase==='display'||!Number.isFinite(row)||!Number.isFinite(radius)||!Number.isFinite(dt))return;
      row=clamp(row,0,this.rows-1);dt=clamp(dt,0,.06);radius=clamp(radius,20,180);
      const from=this.lastRow??row,steps=Math.max(1,Math.ceil(Math.abs(row-from)/2));
      for(let s=1;s<=steps;s++)this.apply(mix(from,row,s/steps),radius,dt/steps);
      this.lastRow=row;
    }
    apply(row,radius,dt){
      const width=this.phase==='shape'?(this.precision?4:8):15;let changed=false;
      for(let i=Math.max(0,Math.floor(row-width));i<=Math.min(this.rows-1,Math.ceil(row+width));i++){
        const f=Math.max(0,1-Math.abs(i-row)/width);
        if(this.phase==='shape'){
          const limit=this.assist?this.target[i]:24,next=Math.max(limit,Math.min(this.profile[i],Math.max(radius,this.profile[i]-110*dt*f)));
          if(next<this.profile[i]){this.activity=Math.max(this.activity,this.profile[i]-next);this.profile[i]=next;changed=true;}
        }else if(radius<=this.profile[i]+30){
          const a=this.phase==='sand'?this.sanded:this.coated,old=a[i];a[i]=Math.min(1,a[i]+dt*f*3.8);changed ||= a[i]!==old;this.activity=Math.max(this.activity,dt*8);
        }
      }
      if(changed){if(this.phase==='shape')this.revision++;else this.surfaceRevision++;}
    }
    advance(){
      if(this.status!=='playing'||this.phase==='display'||this.progress()<this.required())return false;
      this.phase=({shape:'sand',sand:'finish',finish:'display'})[this.phase];this.lastRow=null;this.activity=0;this.surfaceRevision++;return true;
    }
    finish(){return this.advance();}
    update(dt){dt=clamp(Number(dt)||0,0,.06);this.seconds+=dt;this.activity*=Math.exp(-dt*12);if(this.phase==='display'){this.reveal+=dt;if(this.reveal>2.4)this.status='won';}}
    score(){return this.accuracy()*18+this.smoothness()*5+this.coverage()*5;}
    stars(){return this.accuracy()>=97&&this.smoothness()>=95&&this.coverage()>=95?3:this.accuracy()>=93?2:1;}
  }
  const themes=[{name:'Sahil meydanı',sky:0xbddce5,floor:0xe5d5bc,accent:0x168b8a},{name:'Botanik park',sky:0xb8d7cb,floor:0xd9d5bc,accent:0x468565},{name:'Renkli pasaj',sky:0xd0cee1,floor:0xd8caca,accent:0xb06a69}];
  const kinds=['portakal','top','saksı','kasa','tabure','araba','ağaç'];
  class HoleWorld{
    constructor(level=1){
      this.level=level;this.theme=themes[(level-1)%3];this.status='playing';this.hole={x:260,y:260,r:18,mass:0,vx:0,vy:0};this.target={x:260,y:260};
      this.time=150-Math.min(18,level-1)*2;this.seconds=0;this.relaxed=false;this.started=false;this.collected=0;this.combo=0;this.bestCombo=0;this.comboTimer=0;this.points=0;this.effects=[];this.growth=0;this.lastKind='Küçük nesnelerle başla';this.items=[];
      const rng=random(801+level*7919),cells=Array.from({length:64},(_,i)=>i).filter(i=>![27,28,35,36].includes(i));
      for(let i=cells.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
      const counts=[14,12,10,8,6,4,3],sizes=[5.5,8,12,18,24,32,43];
      counts.forEach((count,tier)=>{for(let j=0;j<count;j++){
        const cell=cells[this.items.length],r=sizes[tier];this.items.push({id:this.items.length,kind:kinds[tier],tier,r,x:51+(cell%8)*59+(rng()-.5)*6,y:51+Math.floor(cell/8)*59+(rng()-.5)*6,vx:0,vy:0,z:0,vz:0,angle:rng()*Math.PI*2,tilt:0,fall:0,phase:'ground',taken:false,axis:rng()*Math.PI*2,variant:j%3});
      }});this.total=this.items.length;
    }
    setRelaxed(on){if(!this.started)this.relaxed=!!on;}
    canTake(o){return o.r<=this.hole.r*.88;}
    update(dt){
      if(this.status!=='playing')return;dt=clamp(Number(dt)||0,0,.05);this.seconds+=dt;const h=this.hole;
      const edge=h.r+8;this.target.x=clamp(Number(this.target.x)||260,edge,520-edge);this.target.y=clamp(Number(this.target.y)||260,edge,520-edge);
      const dx=this.target.x-h.x,dy=this.target.y-h.y,d=Math.hypot(dx,dy),speed=Math.min(210,d*8),blend=1-Math.exp(-dt*11);
      h.vx=mix(h.vx,d>1?dx/d*speed:0,blend);h.vy=mix(h.vy,d>1?dy/d*speed:0,blend);
      if(d>3)this.started=true;
      h.x=clamp(h.x+h.vx*dt,edge,520-edge);h.y=clamp(h.y+h.vy*dt,edge,520-edge);
      if(this.started&&!this.relaxed)this.time=Math.max(0,this.time-dt);
      this.comboTimer=Math.max(0,this.comboTimer-dt);if(this.comboTimer===0)this.combo=0;this.growth=Math.max(0,this.growth-dt*1.5);
      for(const o of this.items){
        if(o.taken)continue;
        if(o.phase==='falling'){
          o.fall+=dt;o.vz-=490*dt;o.z+=o.vz*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=Math.exp(-dt*5);o.vy*=Math.exp(-dt*5);o.tilt=Math.min(1.25,o.tilt+dt*1.5);
          if(o.z<-130)this.collect(o);
          continue;
        }
        const ox=h.x-o.x,oy=h.y-o.y,dist=Math.hypot(ox,oy),fits=this.canTake(o);
        if(fits&&dist<h.r+o.r*.65){
          const pull=(1-dist/(h.r+o.r*.65))*360;
          o.vx+=ox/(dist||1)*pull*dt;o.vy+=oy/(dist||1)*pull*dt;o.tilt=mix(o.tilt,Math.min(.7,Math.max(0,1-dist/h.r)*.7),blend);o.axis=Math.atan2(oy,ox);
          if(dist<Math.max(3,h.r-o.r*.9)){
            o.phase='falling';o.vz=-8;o.vx=ox*1.6;o.vy=oy*1.6;o.fall=0;continue;
          }
        }else{o.tilt*=Math.exp(-dt*8);if(!fits&&dist<h.r+o.r&&dist>1){const push=(h.r+o.r-dist)*14*dt;o.vx-=ox/dist*push;o.vy-=oy/dist*push;}}
        o.x=clamp(o.x+o.vx*dt,o.r+7,513-o.r);o.y=clamp(o.y+o.vy*dt,o.r+7,513-o.r);o.vx*=Math.exp(-dt*5);o.vy*=Math.exp(-dt*5);
      }
      // Bounded pairwise contact pass: larger objects have greater inertia.
      const ground=this.items.filter(o=>o.phase==='ground');
      for(let i=0;i<ground.length;i++)for(let j=i+1;j<ground.length;j++){
        const a=ground[i],b=ground[j],x=b.x-a.x,y=b.y-a.y,d=Math.hypot(x,y),r=(a.r+b.r)*.7;
        if(d>0&&d<r){const correction=(r-d)*.45,weight=b.r*b.r/(a.r*a.r+b.r*b.r),nx=x/d,ny=y/d;a.x-=nx*correction*weight;a.y-=ny*correction*weight;b.x+=nx*correction*(1-weight);b.y+=ny*correction*(1-weight);}
      }
      for(const o of ground){o.x=clamp(o.x,o.r+7,513-o.r);o.y=clamp(o.y,o.r+7,513-o.r);}
      this.effects=this.effects.filter(e=>(e.life-=dt)>0);
      if(this.collected===this.total)this.status='won';else if(this.time<=0&&!this.relaxed)this.status='lost';
    }
    collect(o){
      if(o.taken)return;o.taken=true;o.phase='collected';this.collected++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.comboTimer=3.5;this.lastKind=o.kind;
      const old=this.hole.r;this.hole.mass+=o.r*o.r;this.hole.r=Math.min(82,Math.sqrt(324+this.hole.mass*.34));this.growth=Math.min(1,(this.hole.r-old)*.3+.2);
      const points=(o.tier+1)*25*Math.min(4,1+Math.floor(this.combo/5));this.points+=points;this.effects.push({x:o.x,y:o.y,life:.8,points});if(this.effects.length>20)this.effects.shift();
      if(this.combo%8===0&&!this.relaxed)this.time+=3;
    }
    score(){return this.points+(this.relaxed?0:Math.round(this.time*5));}
    nextSize(){return this.items.filter(o=>!o.taken&&!this.canTake(o)).reduce((n,o)=>Math.min(n,o.r/.88),82);}
  }
  return {WoodStudio,HoleWorld,designs,themes};
});
