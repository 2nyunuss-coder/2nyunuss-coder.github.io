const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Input=require('../yea-suite/arcade/input-v4.js'),Audio=require('../yea-suite/arcade/audio-v4.js');
test('visible focus changes and touch capture do not pause an active game',()=>{
  const win=new EventTarget(),doc=new EventTarget();doc.hidden=false;let pauses=0,clears=0,focuses=0,captures=0;
  const dispose=Input.bindLifecycle(win,doc,{background:()=>pauses++,clearKeyboard:()=>clears++});
  const canvas={focus(){focuses++;win.dispatchEvent(new Event('blur'));},setPointerCapture(){captures++;}};
  for(let i=0;i<25;i++){Input.capture(canvas,{pointerType:'touch',pointerId:i});win.dispatchEvent(new Event('blur'));doc.dispatchEvent(new Event('visibilitychange'));}
  assert.equal(pauses,0);assert.equal(focuses,0);assert.equal(captures,25);assert.equal(clears,25);
  Input.capture(canvas,{pointerType:'mouse',pointerId:100});assert.equal(focuses,1);assert.equal(pauses,0);dispose();
});
test('actual background transitions still pause, and pointer capture failures are recoverable',()=>{
  const win=new EventTarget(),doc=new EventTarget();doc.hidden=false;let pauses=0;
  const dispose=Input.bindLifecycle(win,doc,{background:()=>pauses++,clearKeyboard(){}});doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));win.dispatchEvent(new Event('pagehide'));win.dispatchEvent(new Event('yea:background'));assert.equal(pauses,3);
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(pauses,3);dispose();win.dispatchEvent(new Event('pagehide'));assert.equal(pauses,3);
  assert.equal(Input.capture({setPointerCapture(){throw Error('capture unavailable');}},{pointerType:'touch',pointerId:1}),false);
});
function audioHost(){
  const stats={started:0,stopped:0,intervals:new Map()},param=()=>({value:0,setValueAtTime(){},setTargetAtTime(v){this.value=v;},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),Q:param(),delayTime:param(),start(){stats.started++;},stop(){stats.stopped++;this.onended?.();}});
  class Context{constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=24000;this.destination=node();}resume(){this.state='running';return Promise.resolve();}close(){this.state='closed';}createGain(){return node();}createDelay(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}createOscillator(){return node();}createBuffer(ch,n){return{getChannelData:()=>new Float32Array(n)};}}
  let id=0;return{stats,host:{AudioContext:Context,document:{hidden:false},setInterval(fn){stats.intervals.set(++id,fn);return id;},clearInterval(i){stats.intervals.delete(i);},localStorage:{getItem(){return null;},setItem(){}}}};
}
test('six original scores have finite bounded notes and distinct arrangements',()=>{
  const patterns=new Set();for(const id of Object.keys(Audio.tracks)){let count=0;for(let step=0;step<64;step++){const notes=Audio.notesAt(id,step);count+=notes.length;for(const n of notes){assert.ok(n.duration>0&&n.duration<3);assert.ok(n.gain>0&&n.gain<.3);if(n.midi!=null)assert.ok(n.midi>=28&&n.midi<=100);}}assert.ok(count>35);patterns.add(JSON.stringify(Audio.tracks[id]));}assert.equal(patterns.size,6);
});
test('music starts after audio unlock, uses one scheduler and stops in the background',async()=>{
  const {host,stats}=audioHost(),p=new Audio.Player(host);p.play('hole');assert.equal(stats.started,0);assert.equal(stats.intervals.size,0);assert.equal(await p.unlock(),true);assert.ok(stats.started>0);assert.equal(stats.intervals.size,1);
  p.play('hole');await p.unlock();assert.equal(stats.intervals.size,1);p.setMusic(false);assert.equal(stats.intervals.size,0);assert.equal(p.voices.size,0);p.setMusic(true);assert.equal(stats.intervals.size,1);
  const count=stats.started;p.pause(true);assert.equal(stats.intervals.size,0);assert.equal(p.master.gain.value,0);p.effect('win');assert.equal(stats.started,count);
  p.play('wood');await p.unlock();assert.equal(stats.intervals.size,1);p.setEffects(false);const now=stats.started;p.effect('tap');assert.equal(stats.started,now);p.setVolume(50);assert.equal(p.volume,.7);p.dispose();assert.equal(stats.intervals.size,0);assert.equal(p.voices.size,0);
});
test('a late audio unlock cannot restart music after the document becomes hidden',async()=>{
  const {host,stats}=audioHost(),p=new Audio.Player(host);p.play('blocks');const pending=p.unlock();host.document.hidden=true;p.pause(true);assert.equal(await pending,false);assert.equal(stats.intervals.size,0);assert.equal(p.master.gain.value,0);p.dispose();
});
test('all six remastered scenes preserve 3D picking and camera navigation',()=>{
  global.window=global;try{global.THREE=require('../yea-suite/arcade/node_modules/three');}catch{global.THREE=require('../yea-suite/arcade/vendor/three.min.js');}global.YeaArcadeEngine=require('../yea-suite/arcade/engine.js');global.YeaStudio=require('../yea-suite/arcade/studio-models-v3.js');const Castle=require('../yea-suite/arcade/castle3d.js');
  global.document={createElement(){return{getContext(){return{clearRect(){},strokeText(){},fillText(){}};}};}};
  require('../yea-suite/arcade/world3d.js');require('../yea-suite/arcade/studio-worlds-v3.js');require('../yea-suite/arcade/worlds-v4.js');
  const canvas={getBoundingClientRect:()=>({left:0,top:0,width:520,height:520})};
  for(const game of YeaArcadeEngine.catalog){const C=game.id==='castle'?Castle:game.id==='wood'?YeaStudio.WoodStudio:game.id==='hole'?YeaStudio.HoleWorld:game.Model,m=new C(1),w=new YeaArcadeWorldV4({domElement:canvas},game.id,m),state={target:{x:0,y:1,z:1.7},brush:{x:370,y:260},selected:null,hint:-1};
    for(let i=0;i<90;i++)w.update(1/60,state);let meshes=0;w.scene.traverse(o=>{if(!o.isMesh)return;meshes++;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});assert.ok(meshes<180,game.id+' scene budget');
    if(game.id==='blocks'){for(const p of m.pieces){const b=w.objects.get(p.id);assert.equal(b.position.y,1.02);b.geometry.computeBoundingBox();assert.ok(b.geometry.boundingBox.max.x-b.geometry.boundingBox.min.x<p.w*1.6,'pieces do not visually overlap adjacent cells');}}
    for(let view=0;view<3;view++){w.setCamera(view);w.update(1/60,state);w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);const p=w.coordinates(260,260);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
      if(game.id==='arrows'){const index=m.cells.findIndex(v=>v!=null),o=w.objects.get(index),point=o.position.clone();point.y+=.2;const v=point.project(w.camera),pick=w.coordinates((v.x+1)*260,(1-v.y)*260);assert.equal(pick.hit?.arrow,index,'raised arrow can be picked from camera '+view);}
    }
    const old=w.camera.position.clone();w.rotateCamera(24,-12);assert.ok(w.camera.position.distanceTo(old)>.01);w.update(1/60,state);assert.ok(Number.isFinite(w.camera.position.x));w.dispose();assert.equal(w.scene.children.length,0);
  }
});
test('updated entries, worker and native application package the input, music and scene changes',()=>{
  const root=path.resolve(__dirname,'..'),arcade=path.join(root,'yea-suite/arcade'),gradle=fs.readFileSync(path.join(root,'native/android/app/build.gradle'),'utf8'),sw=fs.readFileSync(path.join(arcade,'sw.js'),'utf8');
  for(const page of ['v2.html','v3.html','v4.html']){const html=fs.readFileSync(path.join(arcade,page),'utf8');for(const n of ['worlds-v4.js','input-v4.js','audio-v4.js','app3d-v4.js','arcade-v4.css']){assert.ok(html.includes(n));assert.ok(gradle.includes(n));assert.ok(sw.includes(n));assert.ok(fs.existsSync(path.join(arcade,n)));}assert.ok(html.includes('id="orbit"'));assert.ok(html.includes('id="audio-volume"'));}
  assert.ok(!gradle.includes('vendor/'));const app=fs.readFileSync(path.join(arcade,'app3d-v4.js'),'utf8');assert.ok(!/addEventListener\('blur'.*pause\(/.test(app));assert.ok(app.includes('bindLifecycle(window,document'));
});
