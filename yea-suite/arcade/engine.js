/* Original deterministic game models. No network or YEA account access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YeaArcadeEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const W=520,H=520,DIRS=[[0,-1],[1,0],[0,1],[-1,0]],GLYPHS=['↑','→','↓','←'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  const pick=(list,rng)=>list[Math.floor(rng()*list.length)];
  const copy=x=>JSON.parse(JSON.stringify(x));
  function pathClear(cells,n,index,dir){let x=index%n,y=Math.floor(index/n);const [dx,dy]=DIRS[dir];x+=dx;y+=dy;while(x>=0&&x<n&&y>=0&&y<n){if(cells[y*n+x]!=null)return false;x+=dx;y+=dy;}return true;}
  function arrowLevel(level){
    const n=clamp(4+Math.floor((level-1)/4),4,7),rng=random(1987+level*317),occupied=Array(n*n).fill(0),cells=Array(n*n),solution=[];
    while(solution.length<n*n){const options=[];occupied.forEach((v,i)=>{if(v!=null)for(let d=0;d<4;d++)if(pathClear(occupied,n,i,d))options.push([i,d]);});const [i,d]=pick(options,rng);cells[i]=d;occupied[i]=null;solution.push(i);}
    return {n,cells,solution};
  }
  class Arrows{
    constructor(level){Object.assign(this,arrowLevel(level));this.lives=3;this.moves=0;this.history=[];this.status='playing';}
    tap(i){if(this.status!=='playing'||this.cells[i]==null)return false;this.history.push({cells:[...this.cells],lives:this.lives,moves:this.moves});this.moves++;
      if(pathClear(this.cells,this.n,i,this.cells[i])){this.cells[i]=null;if(this.cells.every(x=>x==null))this.status='won';return true;}
      this.lives--;if(this.lives===0)this.status='lost';return false;
    }
    hint(){return this.cells.findIndex((d,i)=>d!=null&&pathClear(this.cells,this.n,i,d));}
    undo(){const prev=this.history.pop();if(prev){Object.assign(this,prev);this.status='playing';return true;}return false;}
    score(){return Math.max(50,this.n*this.n*50+this.lives*100-this.moves*3);}
  }
  const gates=[{id:'R',color:'#ef7b8c',name:'Gül',x:4,y:2,w:2,h:1,exit:1,lane:2},{id:'B',color:'#68b8f7',name:'Mavi',x:2,y:4,w:1,h:2,exit:2,lane:2},{id:'Y',color:'#efcb6e',name:'Sarı',x:0,y:3,w:2,h:1,exit:3,lane:3},{id:'G',color:'#77d8ad',name:'Yeşil',x:4,y:0,w:1,h:2,exit:0,lane:4},{id:'P',color:'#b39aef',name:'Mor',x:0,y:0,w:1,h:1,exit:3,lane:0},{id:'O',color:'#e8a66c',name:'Turuncu',x:5,y:5,w:1,h:1,exit:2,lane:5}];
  function blockMove(pieces,id,d,allowExit=true){
    const p=pieces.find(x=>x.id===id);if(!p||p.out)return false;
    const [dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy;
    if(x<0||y<0||x+p.w>6||y+p.h>6){const aligned=(d===0||d===2)?p.x===p.lane:p.y===p.lane;
      if(allowExit&&d===p.exit&&aligned){p.out=true;return true;}return false;}
    if(pieces.some(q=>q!==p&&!q.out&&x<q.x+q.w&&x+p.w>q.x&&y<q.y+q.h&&y+p.h>q.y))return false;
    p.x=x;p.y=y;return true;
  }
  function blockLevel(level){const rng=random(level*2797+11),pieces=copy(gates.slice(0,level<5?4:level<10?5:6)),reverse=[];
    for(let i=0;i<30+Math.min(level,30)*8;i++){const p=pick(pieces,rng),d=Math.floor(rng()*4);if(blockMove(pieces,p.id,d,false))reverse.unshift([p.id,(d+2)%4]);}
    return {pieces,reverse};
  }
  class Blocks{
    constructor(level){Object.assign(this,blockLevel(level));this.moves=0;this.history=[];this.status='playing';}
    move(id,dir){if(this.status!=='playing')return false;const prev=copy(this.pieces);if(!blockMove(this.pieces,id,dir))return false;this.history.push(prev);this.moves++;if(this.pieces.every(p=>p.out))this.status='won';return true;}
    undo(){const prev=this.history.pop();if(!prev)return false;this.pieces=prev;this.moves--;this.status='playing';return true;}
    score(){return Math.max(100,2000-this.moves*8);}
  }
  class Castle{
    constructor(level){const rng=random(level*933);this.level=level;this.wind=Math.round((rng()-.5)*24);this.blocks=[];this.shots=8+Math.floor(level/5);this.ball=null;this.particles=[];this.status='playing';this.hits=0;const rows=3+(level-1)%4;
      for(let c=0;c<3;c++)for(let r=0;r<rows-(c===1?0:1);r++)this.blocks.push({x:325+c*39,y:447-r*34,w:36,h:31,hp:level>5&&r%3===0?2:1});
      this.total=this.blocks.length;
    }
    fire(angle,power){if(this.ball||this.shots<=0||this.status!=='playing')return false;const rad=clamp(angle,15,80)*Math.PI/180,speed=clamp(power,20,100)*3.2+100;this.ball={x:55,y:444,vx:Math.cos(rad)*speed,vy:-Math.sin(rad)*speed,t:0,trail:[]};this.shots--;return true;}
    update(dt){if(this.status!=='playing')return;dt=Math.min(dt,.04);this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt;}
      const b=this.ball;if(b){b.t+=dt;b.vx+=this.wind*dt;b.vy+=260*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.trail.push([b.x,b.y]);if(b.trail.length>16)b.trail.shift();
        const target=this.blocks.find(p=>p.hp>0&&b.x+9>=p.x&&b.x-9<=p.x+p.w&&b.y+9>=p.y&&b.y-9<=p.y+p.h);
        if(target){for(const p of this.blocks){if(p.hp>0&&Math.hypot(p.x+p.w/2-b.x,p.y+p.h/2-b.y)<72){p.hp--;if(p.hp===0){this.hits++;for(let k=0;k<7;k++)this.particles.push({x:p.x+p.w/2,y:p.y+p.h/2,vx:Math.cos(k*1.7)*90,vy:-100+Math.sin(k*1.7)*80,life:1});}}}this.ball=null;}
        else if(b.x>W+30||b.x< -30||b.y>485||b.t>6)this.ball=null;
      }
      if(this.blocks.every(p=>p.hp<=0))this.status='won';else if(!this.ball&&this.shots===0)this.status='lost';
    }
    score(){return this.hits*100+this.shots*150;}
  }
  class Wood{
    constructor(level){this.level=level;this.rows=72;this.profile=Array(this.rows).fill(134);this.target=this.profile.map((_,i)=>{const t=i/(this.rows-1);switch((level-1)%4){case 0:return 65+45*Math.pow(Math.sin(Math.PI*t),2);case 1:return 92-40*Math.exp(-Math.pow((t-.3)*7,2));case 2:return 58+36*(.5+.5*Math.cos(t*Math.PI*4));default:return 55+55*t;}});this.stain=0;this.status='playing';this.seconds=0;}
    cut(row,radius,dt){if(this.status!=='playing')return;for(let i=0;i<this.rows;i++){const distance=Math.abs(i-row);if(distance<3.3){const amount=75*dt*(1-distance/3.3);this.profile[i]=Math.max(24,Math.min(this.profile[i],Math.max(radius,this.profile[i]-amount)));}}}
    accuracy(){const total=this.target.reduce((s,r)=>s+134-r,0),error=this.target.reduce((s,r,i)=>s+Math.abs(this.profile[i]-r)*(this.profile[i]<r?2:1),0);return clamp(Math.round(100*(1-error/total)),0,100);}
    finish(){if(this.accuracy()>=80){this.status='won';return true;}return false;}
    score(){return this.accuracy()*20;}
    update(dt){this.seconds+=dt;}
  }
  class Hole{
    constructor(level){const rng=random(level*859+73);this.level=level;this.hole={x:260,y:260,r:17,mass:0};this.time=100-Math.min(level,10)*2;this.items=[];this.status='playing';this.collected=0;this.target={x:260,y:260};const sizes=[6,9,13,20,28];
      for(let i=0;i<40+Math.min(level,10)*2;i++){const tier=i%5,r=sizes[tier];let x,y,tries=0;do{x=35+r+rng()*(450-2*r);y=35+r+rng()*(450-2*r);tries++;}while(tries<150&&this.items.some(o=>Math.hypot(x-o.x,y-o.y)<r+o.r+4));this.items.push({x,y,r,tier,taken:false,shape:i%2});}this.total=this.items.length;
    }
    update(dt){if(this.status!=='playing')return;dt=Math.min(dt,.04);this.time=Math.max(0,this.time-dt);const h=this.hole,dx=this.target.x-h.x,dy=this.target.y-h.y,d=Math.hypot(dx,dy),step=Math.min(d,260*dt);if(d){h.x=clamp(h.x+dx/d*step,h.r,W-h.r);h.y=clamp(h.y+dy/d*step,h.r,H-h.r);}
      for(const o of this.items)if(!o.taken&&o.r<=h.r&&Math.hypot(o.x-h.x,o.y-h.y)<Math.max(7,h.r-o.r*.6)){o.taken=true;this.collected++;h.mass+=o.r*o.r;h.r=Math.min(70,Math.sqrt(289+h.mass*.4));}
      if(this.collected===this.total)this.status='won';else if(this.time<=0)this.status='lost';
    }
    score(){return this.collected*35+Math.round(this.time*10);}
  }
  class Territory{
    constructor(level){this.level=level;const points=[[78,420],[258,452],[432,96],[98,180],[264,258],[425,388],[262,68],[75,65],[444,247]],rng=random(level*617);this.nodes=points.slice(0,level<5?7:9).map(([x,y],i)=>({x:x+(rng()-.5)*16,y:y+(rng()-.5)*16,owner:i===0?1:i===2?2:0,power:i===0?42:i===2?30:9+Math.floor(rng()*10),id:i}));this.fleets=[];this.aiClock=0;this.time=0;this.status='playing';}
    send(from,to,ratio=.6,owner=1){if(this.status!=='playing'||from===to)return false;const a=this.nodes[from],b=this.nodes[to];if(!a||!b||a.owner!==owner)return false;const count=Math.floor(a.power*clamp(ratio,.25,1));if(count<2)return false;a.power-=count;this.fleets.push({from,to,owner,count,progress:0,length:Math.hypot(a.x-b.x,a.y-b.y)});return true;}
    update(dt){if(this.status!=='playing')return;dt=Math.min(dt,.04);this.time+=dt;this.aiClock+=dt;for(const n of this.nodes)if(n.owner)n.power=Math.min(99,n.power+dt*(n.owner===1?2:1.15+Math.min(this.level,20)*.025));
      for(const f of this.fleets){f.progress+=dt*135/f.length;if(f.progress>=1){const n=this.nodes[f.to];if(n.owner===f.owner)n.power=Math.min(99,n.power+f.count);else{n.power-=f.count;if(n.power<0){n.owner=f.owner;n.power=-n.power;}}}}
      this.fleets=this.fleets.filter(f=>f.progress<1);
      if(this.aiClock>3.8){this.aiClock=0;const options=this.nodes.filter(n=>n.owner===2&&n.power>=12).sort((a,b)=>b.power-a.power);if(options.length){const from=options[0];const targets=this.nodes.filter(n=>n.owner!==2).sort((a,b)=>(a.power+Math.hypot(a.x-from.x,a.y-from.y)*.05)-(b.power+Math.hypot(b.x-from.x,b.y-from.y)*.05));if(targets.length)this.send(from.id,targets[0].id,.65,2);}}
      if(this.nodes.every(n=>n.owner===1)&&!this.fleets.some(f=>f.owner===2))this.status='won';
      else if(!this.nodes.some(n=>n.owner===1)&&!this.fleets.some(f=>f.owner===1))this.status='lost';
    }
    score(){return Math.max(100,3000-Math.round(this.time*8));}
  }
  const catalog=[
    {id:'castle',title:'Kale Atışı',symbol:'▥ ↗',tag:'Fizik · Nişan',desc:'Doğru açı, tek bir iyi atış.',help:'Açı ve gücü ayarla, Atış yap düğmesine dokun. Vuruş yakınındaki blokları kırar. Atışların bitmeden bütün blokları dağıt. Zemine düşen veya alan dışına çıkan top kaybolur.',levels:20,Model:Castle},
    {id:'arrows',title:'Ok Yolu',symbol:'↗ ↑',tag:'Mantık · Sıralama',desc:'Çıkış için doğru sırayı bul.',help:'Bir oka dokun. Okun baktığı yönde başka bir ok yoksa çıkar. Yol kapalıysa bir hak azalır. Üç hakkın bitmeden alanı temizle. Geri al ve İpucu kullanabilirsin.',levels:20,Model:Arrows},
    {id:'wood',title:'Ahşap Atölyesi',symbol:'◒',tag:'El becerisi · Şekil',desc:'Bir parçadan kendi formunu çıkar.',help:'Sanal ahşabın yanından parmağını kaydırarak kes. Beyaz kesikli çizgi hedef formu gösterir. Fazla kesersen geri büyümez; yeniden başlayabilirsin. En az %80 uyumda Teslim et. Renk seçerek bitir. Klavyede yön tuşları kesiciyi hareket ettirir, boşluk keser.',levels:12,Model:Wood},
    {id:'hole',title:'Yutan Halka',symbol:'◎',tag:'Beceri · Toplama',desc:'Küçük başla, bütün alanı topla.',help:'Parmağınla halkayı yönlendir. Yalnız halkadan küçük parçalar toplanabilir; küçüklerden başla. Topladıkça büyürsün. Süre dolmadan tüm parçaları topla. Klavyede yön tuşları veya WASD ile hareket edebilirsin.',levels:20,Model:Hole},
    {id:'territory',title:'Bölge Akışı',symbol:'● ⋯',tag:'Strateji · Alan',desc:'Gücünü doğru yere yönlendir.',help:'Mavi bölgeni seç, ardından güç göndermek istediğin bölgeye dokun. Sürükleyerek de gönderebilirsin. Gönderilecek oranı seç. Bölgeler zamanla güç üretir. Rakip kırmızı; gri bölgeler tarafsız. Tüm bölgeleri maviye çevir.',levels:20,Model:Territory},
    {id:'blocks',title:'Renkli Rota',symbol:'▰ ▪',tag:'Bulmaca · Kaydırma',desc:'Her bloğu kendi çıkışına götür.',help:'Bir bloğu seç ve yatay veya dikey kaydır. Harfi ve rengi eşleşen kenar çıkışına hizala, dışarı doğru kaydır. Diğer bloklar yolu kapatabilir. Seçili bloğu alttaki yön tuşlarıyla da hareket ettirebilirsin. Tüm blokları çıkar.',levels:30,Model:Blocks}
  ];
  return {W,H,DIRS,GLYPHS,clamp,random,pathClear,arrowLevel,blockLevel,blockMove,gates,Arrows,Blocks,Castle,Wood,Hole,Territory,catalog};
});
