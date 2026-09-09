'use strict';
(() => {
  const E=window.YeaArcadeEngine,$=s=>document.querySelector(s),key='yea_arcade_progress_v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalize(raw){const out={version:1,games:{}};for(const g of E.catalog){const p=raw?.games?.[g.id]||{};out.games[g.id]={unlocked:E.clamp(Math.floor(Number(p.unlocked)||1),1,g.levels),best:E.clamp(Math.floor(Number(p.best)||0),0,100000),plays:E.clamp(Math.floor(Number(p.plays)||0),0,100000),wins:E.clamp(Math.floor(Number(p.wins)||0),0,100000)};}return out;}
  let progress;try{progress=normalize(JSON.parse(localStorage.getItem(key)||'null'));}catch{progress=normalize(null);$('#storage-message').textContent='Bu tarayıcı ilerlemeyi okuyamadı. Oyunlar bu oturumda çalışır; yedek alabilirsin.';}
  let active=null,level=1,model=null,canvas=null,ctx=null,paused=false,settled=false,raf=0,last=0,hudAt=0,selected=null,drag=null,aim={angle:44,power:69},brush={x:386,y:250,down:false},ratio=.6,hint=-1,sound=false,audioContext=null;
  const keys=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function save(){try{localStorage.setItem(key,JSON.stringify(progress));return true;}catch{$('#storage-message').textContent='İlerleme cihazına kaydedilemedi. Yedek düğmesiyle dışarı aktarabilirsin.';$('#game-message').textContent='Cihaz kaydı başarısız; bu oturumdaki ilerleme korunuyor. Oyun listesine dönüp yedek alabilirsin.';return false;}}
  function beep(win=false){if(!sound||!audioContext)return;try{audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.type='sine';oscillator.frequency.setValueAtTime(win?520:350,audioContext.currentTime);oscillator.frequency.exponentialRampToValueAtTime(win?900:260,audioContext.currentTime+.13);gain.gain.setValueAtTime(.035,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.2);oscillator.start();oscillator.stop(audioContext.currentTime+.21);}catch{}}
  function lobby(){
    cancelAnimationFrame(raf);keys.clear();brush.down=false;active=null;model=null;$('#lobby').hidden=false;$('#play').hidden=true;$('#overlay').hidden=true;
    $('#game-list').innerHTML=E.catalog.map(g=>{const p=progress.games[g.id];return `<article class="game-card"><button class="game-open" data-start="${g.id}"><span class="game-art" aria-hidden="true">${g.symbol}</span><span class="game-card-body"><b>${g.title}</b><span class="game-desc">${g.desc}</span><span class="game-meta"><span>${g.tag}<br>En iyi: ${p.best.toLocaleString('tr-TR')}</span><span aria-hidden="true">↗</span></span></span></button><label class="level-pick">Bölüm<select class="level-select" data-level="${g.id}" aria-label="${g.title} bölüm seç">${Array.from({length:p.unlocked},(_,i)=>`<option value="${i+1}" ${i+1===p.unlocked?'selected':''}>${i+1}. bölüm${i+1===p.unlocked?' · Devam':''}</option>`).join('')}</select></label></article>`;}).join('');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function start(id,chosen){
    const g=E.catalog.find(x=>x.id===id);if(!g)return;
    cancelAnimationFrame(raf);active=g;level=E.clamp(Number(chosen)||progress.games[id].unlocked,1,progress.games[id].unlocked);model=new g.Model(level);paused=false;settled=false;selected=id==='blocks'?model.pieces[0].id:null;drag=null;hint=-1;keys.clear();brush.down=false;aim={angle:44,power:69};
    progress.games[id].plays++;save();$('#lobby').hidden=true;$('#play').hidden=false;$('#overlay').hidden=true;$('#game-title').textContent=g.title;$('#level-label').textContent=`Bölüm ${level} / ${g.levels}`;$('#instruction').textContent=({castle:'Açı ve gücü ayarla; bütün blokları dağıt.',arrows:'Önü açık okları seçerek alanı temizle.',wood:'Parmağını parçanın kenarında kaydır. Kesikli çizgiye yaklaş.',hole:'Halkayı parmağınla yönlendir. Küçük parçalarla başla.',territory:'Mavi bölgeni seç, sonra hedefe dokun veya sürükle.',blocks:'Bloğu seç, aynı harfli çıkışına doğru kaydır.'})[id];$('#game-message').textContent='';$('#controls').innerHTML='';$('#undo').hidden=!['arrows','blocks'].includes(id);$('#pause').disabled=false;
    if(id==='arrows'){canvas=null;ctx=null;$('#stage').innerHTML=`<div class="arrow-board" style="--size:${model.n}">${model.cells.map((d,i)=>`<button class="arrow-cell" data-arrow="${i}" aria-label="${Math.floor(i/model.n)+1}. satır ${i%model.n+1}. sütun, ${['yukarı','sağ','aşağı','sol'][d]}">${E.GLYPHS[d]}</button>`).join('')}</div>`;
      $('#controls').innerHTML='<button id="hint" class="primary">İpucu göster</button>';
      $('#hint').onclick=()=>{if(!canPlay())return;hint=model.hint();renderArrows();$('#game-message').textContent='Parlayan okun yolu açık.';};
    }else{
      $('#stage').innerHTML='<canvas width="1040" height="1040" tabindex="0" role="img"></canvas>';canvas=$('#stage canvas');canvas.setAttribute('aria-label',g.title+' oyun alanı. '+g.help);ctx=canvas.getContext('2d');if(!ctx){$('#game-message').textContent='Bu tarayıcı çizim alanını açamadı.';return;}ctx.setTransform(2,0,0,2,0,0);bindPointer();
      if(id==='castle'){
        $('#controls').innerHTML='<label>Açı <output id="angle-value">44°</output><input id="angle" type="range" min="15" max="80" value="44"></label><label>Güç <output id="power-value">69</output><input id="power" type="range" min="20" max="100" value="69"></label><button id="fire" class="primary">Atış yap</button>';
        $('#angle').oninput=e=>{aim.angle=+e.target.value;$('#angle-value').textContent=aim.angle+'°';draw();};$('#power').oninput=e=>{aim.power=+e.target.value;$('#power-value').textContent=aim.power;draw();};$('#fire').onclick=()=>{if(canPlay()&&model.fire(aim.angle,aim.power)){beep();updateHud();}};
      }else if(id==='wood'){
        $('#controls').innerHTML='<div class="stains" aria-label="Ahşap rengi"><button data-stain="0" aria-pressed="true">Doğal</button><button data-stain="1" aria-pressed="false">Ceviz</button><button data-stain="2" aria-pressed="false">Mavi</button></div><button id="wood-finish" class="primary">Teslim et</button><label>Kesici yüksekliği<input id="wood-row" type="range" min="0" max="71" value="36"></label><label>Kesim yarıçapı<input id="wood-radius" type="range" min="24" max="134" value="110"></label><button id="wood-cut">Seçili noktayı kes</button>';
        document.querySelectorAll('[data-stain]').forEach(b=>b.onclick=()=>{if(!canPlay())return;model.stain=+b.dataset.stain;document.querySelectorAll('[data-stain]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();});
        $('#wood-finish').onclick=()=>{if(!canPlay())return;if(model.finish())checkEnd();else $('#game-message').textContent=`Uyum %${model.accuracy()}. Teslim için en az %80 gerekiyor. Fazla kestiysen yeniden başlayabilirsin.`;};
        $('#wood-cut').onclick=()=>{if(canPlay()){model.cut(+$('#wood-row').value,+$('#wood-radius').value,.6);draw();updateHud();}};
      }else if(id==='territory'){
        $('#controls').innerHTML='<label>Gönderilecek güç<select id="send-ratio"><option value="0.25">%25</option><option value="0.6" selected>%60</option><option value="1">%100</option></select></label><div class="node-controls" id="node-buttons" aria-label="Bölge seçimi"></div>';
        ratio=.6;$('#send-ratio').onchange=e=>{ratio=+e.target.value;};$('#node-buttons').innerHTML=model.nodes.map(n=>`<button data-node="${n.id}" aria-label="${n.id+1}. bölge">${n.id+1}</button>`).join('');$('#node-buttons').onclick=e=>{const b=e.target.closest('[data-node]');if(b&&canPlay())selectNode(+b.dataset.node);};
      }else if(id==='blocks'){
        $('#controls').innerHTML='<label>Seçili blok<select id="block-select"></select></label><button id="show-gate">Çıkışı göster</button><div class="block-controls" aria-label="Seçili bloğu kaydır"><button data-dir="3" aria-label="Sola kaydır">←</button><button data-dir="0" aria-label="Yukarı kaydır">↑</button><button data-dir="2" aria-label="Aşağı kaydır">↓</button><button data-dir="1" aria-label="Sağa kaydır">→</button></div>';
        syncBlockSelect();$('#block-select').onchange=e=>{selected=e.target.value;draw();};$('#show-gate').onclick=()=>{const p=model.pieces.find(x=>x.id===selected);if(p)$('#game-message').textContent=`${p.name} (${p.id}) çıkışı: ${['üst kenar','sağ kenar','alt kenar','sol kenar'][p.exit]}, ${p.lane+1}. ${p.exit%2?'satır':'sütun'}.`;};document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>moveBlock(+b.dataset.dir));
      }
    }
    if(location.hash!=='#'+id)history.pushState(null,'','#'+id);
    updateHud();draw();last=performance.now();hudAt=0;raf=requestAnimationFrame(frame);window.scrollTo({top:0,behavior:'instant'});
  }
  function canPlay(){return active&&model&&model.status==='playing'&&!paused;}
  function renderArrows(){document.querySelectorAll('[data-arrow]').forEach(b=>{const i=+b.dataset.arrow,cleared=model.cells[i]==null;b.classList.toggle('cleared',cleared);b.classList.toggle('hint',i===hint&&!cleared);b.disabled=cleared||!canPlay();});}
  $('#stage').addEventListener('click',e=>{if(active?.id!=='arrows'||!canPlay())return;const b=e.target.closest('[data-arrow]');if(!b)return;hint=-1;const ok=model.tap(+b.dataset.arrow);$('#game-message').textContent=ok?'':'Bu okun yolu kapalı. Önündeki okları çıkar.';beep();renderArrows();updateHud();checkEnd();});
  function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*E.W,y:(e.clientY-r.top)/r.height*E.H};}
  function nodeAt(p){return model.nodes.find(n=>Math.hypot(n.x-p.x,n.y-p.y)<36)?.id;}
  function pieceAt(p){const x=(p.x-68)/64,y=(p.y-68)/64;return model.pieces.find(b=>!b.out&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)?.id;}
  function selectNode(id){const node=model.nodes[id];if(!node)return;if(selected!=null&&selected!==id){if(model.send(selected,id,ratio)){$('#game-message').textContent=`${selected+1}. bölgeden ${id+1}. bölgeye güç gönderildi.`;beep();selected=null;return;}}if(node.owner===1){selected=id;$('#game-message').textContent='Hedef bölgeyi seç.';}else{$('#game-message').textContent='Önce mavi bölgelerinden birini seç.';selected=null;}}
  function moveBlock(dir){if(!canPlay()||!selected)return;if(model.move(selected,dir)){beep();const p=model.pieces.find(x=>x.id===selected);if(p.out){selected=model.pieces.find(x=>!x.out)?.id||null;$('#game-message').textContent='Blok doğru çıkışa ulaştı.';}syncBlockSelect();}else $('#game-message').textContent='Bu yönde yol kapalı veya çıkış eşleşmiyor.';draw();updateHud();checkEnd();}
  function syncBlockSelect(){const s=$('#block-select');if(!s)return;s.innerHTML=model.pieces.filter(p=>!p.out).map(p=>`<option value="${p.id}">${p.name} · ${p.id}</option>`).join('');s.value=selected||'';}
  function bindPointer(){
    canvas.addEventListener('pointerdown',e=>{if(!canPlay())return;e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);const p=point(e);drag={...p,id:e.pointerId,node:null,moved:false};
      if(active.id==='hole')model.target=p;
      if(active.id==='wood')brush={...p,down:true};
      if(active.id==='blocks'){const id=pieceAt(p);if(id){selected=id;syncBlockSelect();draw();}}
      if(active.id==='territory'){drag.node=nodeAt(p);if(drag.node!=null&&model.nodes[drag.node].owner===1){drag.previous=selected;selected=drag.node;}}
    });
    canvas.addEventListener('pointermove',e=>{if(!canPlay()||!drag||e.pointerId!==drag.id)return;e.preventDefault();const p=point(e);if(active.id==='hole')model.target=p;if(active.id==='wood')brush={...p,down:true};if(Math.hypot(p.x-drag.x,p.y-drag.y)>12)drag.moved=true;
      if(active.id==='blocks'){let dx=p.x-drag.x,dy=p.y-drag.y;if(Math.max(Math.abs(dx),Math.abs(dy))>=48){const horizontal=Math.abs(dx)>Math.abs(dy),dir=horizontal?(dx>0?1:3):(dy>0?2:0);const steps=Math.min(6,Math.floor(Math.max(Math.abs(dx),Math.abs(dy))/48)),moving=selected;for(let i=0;i<steps&&canPlay()&&selected===moving;i++)moveBlock(dir);if(drag){drag.x=p.x;drag.y=p.y;}}}
    });
    const up=e=>{if(!drag||e.pointerId!==drag.id)return;const p=point(e);if(active?.id==='territory'&&canPlay()){const id=nodeAt(p);if(id!=null){if(drag.node!=null&&id===drag.node&&!drag.moved&&drag.previous!=null&&drag.previous!==id)selected=drag.previous;selectNode(id);}}brush.down=false;drag=null;};
    canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',()=>{brush.down=false;drag=null;});canvas.addEventListener('lostpointercapture',()=>{brush.down=false;drag=null;});
  }
  function updateHud(){if(!active||!model)return;let parts=[];
    switch(active.id){case'castle':parts=[['Kalan atış',model.shots],['Blok',`${model.hits}/${model.total}`],['Rüzgâr',model.wind===0?'Sakin':`${model.wind>0?'→':'←'} ${Math.abs(model.wind)}`]];if($('#fire'))$('#fire').disabled=!!model.ball||!canPlay();break;
      case'arrows':parts=[['Kalan',model.cells.filter(x=>x!=null).length],['Hak','●'.repeat(model.lives)||'—'],['Hamle',model.moves]];break;
      case'wood':parts=[['Uyum','%'+model.accuracy()],['Hedef','%80+'],['Renk',['Doğal','Ceviz','Mavi'][model.stain]]];break;
      case'hole':parts=[['Toplanan',`${model.collected}/${model.total}`],['Süre',Math.ceil(model.time)+' sn'],['Boyut',Math.round(model.hole.r)]];break;
      case'territory':parts=[['Sen',model.nodes.filter(n=>n.owner===1).length+' bölge'],['Rakip',model.nodes.filter(n=>n.owner===2).length+' bölge'],['Süre',Math.floor(model.time)+' sn']];model.nodes.forEach(n=>{const b=$(`[data-node="${n.id}"]`);if(b){b.textContent=`${n.id+1} · ${Math.floor(n.power)}`;b.style.borderColor=['#647590','#64baff','#f78394'][n.owner];b.setAttribute('aria-label',`${n.id+1}. bölge, ${['tarafsız','senin','rakip'][n.owner]}, ${Math.floor(n.power)} güç`);b.setAttribute('aria-pressed',String(n.id===selected));}});break;
      case'blocks':parts=[['Çıkış',`${model.pieces.filter(p=>p.out).length}/${model.pieces.length}`],['Hamle',model.moves],['Seçili',selected||'—']];break;}
    $('#hud').innerHTML=parts.map(([a,b])=>`<span>${a}<b>${esc(b)}</b></span>`).join('');$('#undo').disabled=!model.history?.length||model.status==='won';
  }
  function overlay(title,text,symbol,actions){paused=true;keys.clear();brush.down=false;drag=null;cancelAnimationFrame(raf);$('#result-title').textContent=title;$('#result-text').textContent=text;$('#result-symbol').textContent=symbol;$('#result-actions').innerHTML='';for(const [label,action] of actions){const b=document.createElement('button');b.textContent=label;b.onclick=action;$('#result-actions').appendChild(b);}$('#overlay').hidden=false;$('#result-actions button')?.focus();}
  function resume(){if(!active)return;paused=false;$('#overlay').hidden=true;keys.clear();last=performance.now();if(active.id==='arrows')renderArrows();raf=requestAnimationFrame(frame);canvas?.focus({preventScroll:true});}
  function pause(help=false){if(!canPlay())return;overlay(help?'Nasıl oynanır?':'Mola zamanı',help?active.help:'Hazır olduğunda kaldığın yerden devam edebilirsin.','Ⅱ',[['Devam et',resume],['Oyun listesi',goLobby]]);}
  function checkEnd(){if(!model||settled||model.status==='playing')return;settled=true;const won=model.status==='won';let text;
    if(won){const p=progress.games[active.id];p.wins++;p.best=Math.max(p.best,model.score());p.unlocked=Math.min(active.levels,Math.max(p.unlocked,level+1));const saved=save();beep(true);text=`${model.score().toLocaleString('tr-TR')} puan. ${level===active.levels?'Tüm bölümleri tamamladın!':saved?'Yeni bölüm açıldı.':'Yeni bölüm bu oturumda açıldı; cihaz kaydı başarısız.'}`;}
    else text=active.id==='castle'?'Atışların bitti. Açı ve gücü değiştirip tekrar dene.':active.id==='hole'?'Süre doldu. Küçük parçalardan başlayarak yeniden dene.':active.id==='territory'?'Mavi bölgeler bitti. Gücünü biriktirip tekrar dene.':'Hakların bitti. Son hamleyi geri alabilir veya baştan başlayabilirsin.';
    const id=active.id,current=level,actions=[];if(won&&level<active.levels)actions.push(['Sonraki bölüm',()=>start(id,current+1)]);if(!won&&model.history?.length)actions.push(['Son hamleyi geri al',undo]);actions.push(['Tekrar oyna',()=>start(id,current)],['Oyun listesi',goLobby]);overlay(won?'Bölüm tamam!':'Bir daha deneyelim',text,won?'✦':'↻',actions);
  }
  function undo(){if(!model?.undo||model.status==='won')return;if(model.undo()){settled=false;paused=false;$('#overlay').hidden=true;hint=-1;if(active.id==='arrows')renderArrows();else{selected=model.pieces.find(p=>!p.out)?.id;syncBlockSelect();}$('#game-message').textContent='Son hamle geri alındı.';draw();updateHud();cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(frame);}}
  function goLobby(){history.pushState(null,'',location.pathname);lobby();}
  $('#game-list').addEventListener('click',e=>{const b=e.target.closest('[data-start]');if(b)start(b.dataset.start,document.querySelector(`[data-level="${b.dataset.start}"]`).value);});
  $('#back').onclick=()=>{if(canPlay())overlay('Oyundan çıkılsın mı?','Bu bölüm baştan başlar. Tamamlanan bölümler ve rekorlar korunur.','↶',[['Oyuna dön',resume],['Listeye dön',goLobby]]);else goLobby();};
  $('#pause').onclick=()=>pause();$('#help').onclick=()=>pause(true);$('#undo').onclick=undo;
  $('#restart').onclick=()=>{if(!active||model.status!=='playing')return;const id=active.id,l=level;overlay('Bölüm yeniden başlasın mı?','Yalnız bu bölümdeki hamleler sıfırlanır.','↻',[['Yeniden başla',()=>start(id,l)],['Vazgeç',resume]]);};
  $('#sound').onclick=()=>{sound=!sound;if(sound){try{audioContext||=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();}catch{sound=false;}}$('#sound').textContent=sound?'Ses açık':'Ses kapalı';$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').setAttribute('aria-label',sound?'Oyun sesini kapat':'Oyun sesini aç');beep();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});addEventListener('blur',()=>{keys.clear();brush.down=false;if(canPlay())pause();});
  addEventListener('keydown',e=>{if(!active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape'||e.key.toLowerCase()==='p'){e.preventDefault();if(paused&&model.status==='playing')resume();else pause();return;}if(!canPlay())return;const dir=({ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3})[e.key];if(dir!=null||['w','a','s','d',' '].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());if(active.id==='blocks'&&dir!=null)moveBlock(dir);if(active.id==='castle'&&e.key===' ')$('#fire')?.click();}});
  addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  addEventListener('popstate',()=>{const id=location.hash.slice(1);if(E.catalog.some(g=>g.id===id))start(id);else lobby();});
  function frame(time){if(!canPlay())return;const dt=Math.min(.033,Math.max(0,(time-last)/1000));last=time;
    const dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),dy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);
    if(active.id==='hole'&&(dx||dy))model.target={x:model.hole.x+dx*50,y:model.hole.y+dy*50};
    if(active.id==='wood'){brush.x=E.clamp(brush.x+dx*140*dt,130,394);brush.y=E.clamp(brush.y+dy*200*dt,55,465);if(brush.down||keys.has(' ')){model.cut((brush.y-55)/410*(model.rows-1),Math.abs(brush.x-260),dt);}}
    model.update?.(dt);draw();if(time-hudAt>130){updateHud();hudAt=time;}checkEnd();if(canPlay()&&!['arrows','blocks'].includes(active.id))raf=requestAnimationFrame(frame);
  }
  function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
  function circle(x,y,r,fill,stroke,width=2){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function text(str,x,y,size=16,color='#eaf2ff',align='center'){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(str),x,y);}
  function line(x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function draw(){if(!ctx||!active||!model)return;ctx.clearRect(0,0,E.W,E.H);ctx.fillStyle='#0d1a2c';ctx.fillRect(0,0,E.W,E.H);({castle:drawCastle,wood:drawWood,hole:drawHole,territory:drawTerritory,blocks:drawBlocks})[active.id]?.();}
  function drawCastle(){
    for(let y=70;y<450;y+=60)line(25,y,495,y,'#182942',1);rect(0,480,520,40,0,'#192d40');line(0,480,520,480,'#4b6078',2);
    for(const p of model.blocks)if(p.hp>0){rect(p.x,p.y,p.w,p.h,4,p.hp===2?'#9185cc':'#72a2d3','#c2d8ee');line(p.x+5,p.y+6,p.x+p.w-5,p.y+6,'#ffffff40',2);if(p.hp===2)text('Ⅱ',p.x+p.w/2,p.y+p.h/2,14);}
    const angle=aim.angle*Math.PI/180,ox=55,oy=444;circle(ox,oy,19,'#8ab7d9');line(ox,oy,ox+Math.cos(angle)*40,oy-Math.sin(angle)*40,'#c9e5ef',14);circle(ox,oy,7,'#173953');
    if(!model.ball&&model.shots>0){const speed=aim.power*3.2+100;for(let t=.1;t<2.5;t+=.12){const x=ox+Math.cos(angle)*speed*t+model.wind*t*t/2,y=oy-Math.sin(angle)*speed*t+130*t*t;if(y>475||x>515)break;circle(x,y,2.5,'#e6d89888');}}
    if(model.ball){const b=model.ball;if(!reduced)b.trail.forEach(([x,y],i)=>circle(x,y,2+i/6,'#e9d79c44'));circle(b.x,b.y,9,'#f5dd96','#fff1c5');}
    if(!reduced)for(const p of model.particles){ctx.globalAlpha=Math.max(0,p.life);rect(p.x,p.y,5,5,1,'#aacaf2');}ctx.globalAlpha=1;text('BLOK ALANI',399,42,12,'#8ca4bf');
  }
  function drawWood(){
    const start=55,span=410,cx=260,stains=[['#624128','#e0ac70','#946034'],['#271e24','#b2876d','#45302d'],['#173957','#73c4e2','#265778']],c=stains[model.stain];
    rect(226,22,68,32,6,'#41546b');rect(226,467,68,32,6,'#41546b');const grad=ctx.createLinearGradient(120,0,400,0);grad.addColorStop(0,c[0]);grad.addColorStop(.47,c[1]);grad.addColorStop(1,c[2]);ctx.beginPath();model.profile.forEach((r,i)=>{const x=cx-r,y=start+i/(model.rows-1)*span;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});for(let i=model.rows-1;i>=0;i--)ctx.lineTo(cx+model.profile[i],start+i/(model.rows-1)*span);ctx.closePath();ctx.fillStyle=grad;ctx.fill();ctx.save();ctx.clip();for(let i=0;i<28;i++){const y=start+i*17;ctx.beginPath();ctx.ellipse(cx+(reduced?0:Math.sin(model.seconds*3)*3),y,130,6,0,0,Math.PI*2);ctx.strokeStyle='#57362033';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
    ctx.setLineDash([5,5]);for(const side of[-1,1]){ctx.beginPath();model.target.forEach((r,i)=>{const x=cx+side*r,y=start+i/(model.rows-1)*span;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle='#f4f1dce0';ctx.lineWidth=2;ctx.stroke();}ctx.setLineDash([]);
    circle(brush.x,brush.y,9,'#def7ff33','#b6edf6',2);line(brush.x-14,brush.y,brush.x+14,brush.y,'#d5faff',1);text('HEDEF',439,37,12,'#d6d8c4');text('Kesikli çizgiye yaklaş',260,511,12,'#9fadc3');
  }
  function drawHole(){
    for(let x=25;x<520;x+=38)for(let y=25;y<520;y+=38)circle(x,y,1,'#21344e');const h=model.hole;circle(h.x,h.y,h.r+7,'#8062b044');circle(h.x,h.y,h.r,'#030711','#bd96f5',5);circle(h.x-3,h.y+3,Math.max(3,h.r-8),'#050817','#293046',1);
    const colors=['#8adcc7','#c9dc89','#70b4ee','#d5a2e9','#f2b189'];for(const o of model.items)if(!o.taken){if(o.shape)rect(o.x-o.r,o.y-o.r,o.r*2,o.r*2,Math.min(o.r,7),colors[o.tier],'#ffffff35');else circle(o.x,o.y,o.r,colors[o.tier],'#ffffff35',1);if(o.r>h.r)text('·',o.x,o.y,18,'#17223b');}text('Önce küçük parçalar',260,18,12,'#8199b7');
  }
  function drawTerritory(){
    const colors=['#71839a','#67baff','#f17f96'];for(let i=0;i<model.nodes.length;i++)for(let j=i+1;j<model.nodes.length;j++){const a=model.nodes[i],b=model.nodes[j];if(Math.hypot(a.x-b.x,a.y-b.y)<250)line(a.x,a.y,b.x,b.y,'#203450',1);}
    for(const f of model.fleets){const a=model.nodes[f.from],b=model.nodes[f.to],x=a.x+(b.x-a.x)*f.progress,y=a.y+(b.y-a.y)*f.progress;line(a.x,a.y,b.x,b.y,colors[f.owner]+'44',2);circle(x,y,11,colors[f.owner]);text(f.count,x,y,10,'#0a1b30');}
    for(const n of model.nodes){if(n.id===selected)circle(n.x,n.y,40,null,'#e5efff',2);circle(n.x,n.y,31,colors[n.owner]+'28',colors[n.owner],3);text(Math.floor(n.power),n.x,n.y,22,n.owner===0?'#c7d1dd':'#fff');text(n.id+1,n.x,n.y+45,12,colors[n.owner]);}text('SEN: MAVİ',68,22,12,'#8fcfff');text('RAKİP: KIRMIZI',424,22,12,'#ef9bad');
  }
  function drawBlocks(){
    const o=68,c=64;rect(52,52,416,416,17,'#142338','#30415e');for(let x=0;x<6;x++)for(let y=0;y<6;y++)rect(o+x*c+2,o+y*c+2,c-4,c-4,8,'#1a2b43');
    for(const p of model.pieces){const horizontal=p.exit%2===1,len=horizontal?p.h:p.w;let x,y,w,h;if(horizontal){x=p.exit===1?459:36;y=o+p.lane*c;w=25;h=len*c;}else{x=o+p.lane*c;y=p.exit===2?459:36;w=len*c;h=25;}rect(x,y,w,h,7,p.out?'#3b4b50':p.color,p.id===selected?'#fff':null);text(p.id,x+w/2,y+h/2,14,p.out?'#9dabac':'#172237');}
    for(const p of model.pieces)if(!p.out){const x=o+p.x*c+5,y=o+p.y*c+5,w=p.w*c-10,h=p.h*c-10;rect(x,y+3,w,h,10,'#0005');rect(x,y,w,h,10,p.color,p.id===selected?'#fff':'#ffffff44');text(p.id,x+w/2,y+h/2,23,'#162337');if(p.id===selected){ctx.setLineDash([4,4]);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x-3,y-3,w+6,h+6);ctx.setLineDash([]);}}text('HARFİ EŞLEŞEN ÇIKIŞA KAYDIR',260,18,12,'#9fb4cc');
  }
  $('#export-progress').onclick=()=>{const blob=new Blob([JSON.stringify(progress,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='YEA_Oyun_Ilerleme_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('#import-progress').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>100000)throw new Error('Yedek 100 KB sınırını aşıyor.');const raw=JSON.parse(await file.text());if(raw.version!==1||!raw.games||typeof raw.games!=='object')throw new Error('Geçerli bir YEA oyun yedeği değil.');const next=normalize(raw);for(const g of E.catalog){const a=progress.games[g.id],b=next.games[g.id];for(const field of['unlocked','best','plays','wins'])a[field]=Math.max(a[field],b[field]);}if(save())$('#storage-message').textContent='Yedek birleştirildi. Daha ileri bölüm ve yüksek rekorlar korundu.';lobby();}catch(err){$('#storage-message').textContent='Yedek açılamadı: '+err.message;}};
  if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js',{scope:'../'}).catch(()=>{$('#storage-message').textContent='Çevrimdışı hazırlık tamamlanamadı; oyunları internet bağlantısıyla kullanabilirsin.';});
  lobby();const first=location.hash.slice(1);if(E.catalog.some(g=>g.id===first))start(first);
})();
