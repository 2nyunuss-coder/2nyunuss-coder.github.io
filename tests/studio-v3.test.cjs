const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../yea-suite/arcade/studio-models-v3.js');
function sweep(m,count=1){for(let s=0;s<count;s++){for(let row=0;row<m.rows;row++)m.cut(row,24,1/60);m.endStroke();}}
test('12 original wood designs are distinct and complete all three interactive phases',()=>{
  const profiles=new Set();for(let l=1;l<=12;l++){const m=new S.WoodStudio(l);profiles.add(JSON.stringify(m.target));assert.equal(m.advance(),false);sweep(m,32);assert.equal(m.accuracy(),100);assert.ok(m.profile.every((r,i)=>r>=m.target[i]));assert.equal(m.advance(),true);assert.equal(m.phase,'sand');assert.equal(m.advance(),false);const shape=m.profile.slice();sweep(m,8);assert.deepEqual(m.profile,shape);assert.equal(m.smoothness(),100);assert.ok(m.advance());assert.equal(m.phase,'finish');assert.equal(m.advance(),false);sweep(m,8);assert.equal(m.coverage(),100);assert.ok(m.advance());assert.equal(m.phase,'display');for(let i=0;i<150;i++)m.update(1/60);assert.equal(m.status,'won');assert.equal(m.stars(),3);assert.equal(m.score(),2800);}
  assert.equal(profiles.size,12);
});
test('wood strokes are local, independent between gestures, and never add material',()=>{
  const m=new S.WoodStudio(1);m.cut(30,60,.05);assert.ok(m.profile[30]<134);assert.equal(m.profile[90],134);m.endStroke();m.cut(90,60,.05);assert.equal(m.profile[60],134);const before=m.profile.slice();m.cut(90,180,.05);assert.deepEqual(m.profile,before);m.cut(NaN,60,.05);m.cut(20,NaN,.05);m.cut(20,60,NaN);assert.ok(m.profile.every(Number.isFinite));
});
test('free-form mode can over-shape while target protection cannot',()=>{
  const m=new S.WoodStudio(1);sweep(m,32);m.assist=false;const old=m.profile[64];for(let i=0;i<120;i++)m.cut(64,24,1/60);assert.ok(m.profile[64]<old);assert.ok(m.accuracy()<100);
});
test('hole collectibles fall under gravity before counting and cannot count twice',()=>{
  const m=new S.HoleWorld(1),o=m.items[0];o.x=m.hole.x;o.y=m.hole.y;m.update(1/60);assert.equal(o.phase,'falling');assert.equal(m.collected,0);const z=o.z;m.update(1/60);assert.ok(o.z<z);assert.equal(o.taken,false);for(let i=0;i<80;i++)m.update(1/60);assert.equal(o.taken,true);const n=m.collected,score=m.points;m.collect(o);assert.equal(m.collected,n);assert.equal(m.points,score);
});
test('hole acceleration, size gating, edge bounds and mode lock behave consistently',()=>{
  const m=new S.HoleWorld(1),big=m.items.find(o=>o.tier===6);assert.equal(m.canTake(big),false);for(let i=0;i<100;i++)m.update(1/60);assert.equal(m.time,150);m.setRelaxed(true);m.target={x:-100,y:700};m.update(1/60);assert.ok(m.hole.vx<0&&m.hole.vy>0);assert.ok(Math.hypot(m.hole.x-260,m.hole.y-260)<5);m.setRelaxed(false);assert.equal(m.relaxed,true);for(let i=0;i<200;i++)m.update(1/60);assert.ok(m.hole.x>=m.hole.r+8);assert.ok(m.hole.y<=512-m.hole.r);assert.equal(m.time,150);assert.ok(m.items.every(o=>Number.isFinite(o.x)&&o.x>=o.r+7&&o.x<=513-o.r||o.phase!=='ground'));
});
test('all 20 new hole levels are solvable by normal movement inside the time limit',()=>{
  for(let l=1;l<=20;l++){const m=new S.HoleWorld(l);let frames=0;while(m.status==='playing'&&frames<10000){const o=m.items.filter(o=>o.phase==='ground'&&m.canTake(o)).sort((a,b)=>Math.hypot(a.x-m.hole.x,a.y-m.hole.y)-Math.hypot(b.x-m.hole.x,b.y-m.hole.y))[0];if(o)m.target={x:o.x,y:o.y};m.update(1/60);frames++;}assert.equal(m.status,'won','level '+l);assert.equal(m.collected,m.total);assert.ok(m.time>0);}
});
test('new scenes keep finite volumetric geometry and a mobile draw-call budget',()=>{
  global.window=global;try{global.THREE=require('../yea-suite/arcade/node_modules/three');}catch{global.THREE=require('../yea-suite/arcade/vendor/three.min.js');}global.YeaArcadeEngine=require('../yea-suite/arcade/engine.js');global.YeaStudio=S;
  require('../yea-suite/arcade/world3d.js');require('../yea-suite/arcade/studio-worlds-v3.js');
  for(const [id,C] of [['wood',S.WoodStudio],['hole',S.HoleWorld]])for(const level of [1,2,3]){
    const m=new C(level),w=new YeaStudioWorld({},id,m);w.update(.016,{brush:{x:360,y:260,down:true}});let meshes=0;w.scene.traverse(o=>{if(!o.isMesh)return;meshes++;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});assert.ok(meshes<90,id+' mesh budget');
    if(id==='wood'){m.cut(20,70,.05);w.update(.016,{});const a=w.wood.geometry.attributes.position,j=m.rows-20;assert.ok(Math.abs(Math.hypot(a.getX(j),a.getZ(j))-m.profile[20]/44)<1e-4);const version=a.version;w.update(.016,{});assert.equal(a.version,version,'unchanged geometry is not uploaded again');}
    else{const o=m.items[0],g=w.objects.get(o);o.x=m.hole.x;o.y=m.hole.y;m.update(.016);m.update(.016);w.update(.016,{});assert.equal(g.scale.x,1,'falling object does not shrink');assert.ok(g.position.y<0);const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <dithering_fragment>'};const floor=w.scene.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.material.onBeforeCompile.toString().includes('holeDistance'));floor.material.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('discard'));assert.ok(shader.uniforms.holeAt);}
    // Projection math only: not a browser, screenshot or GPU visual check.
    w.camera.updateMatrixWorld(true);const points=id==='wood'?[[-3.1,-3.8,0],[3.1,3.8,0]]:[[-6.5,0,-6.5],[6.5,0,-6.5],[-6.5,0,6.5],[6.5,0,6.5]];for(const p of points){const q=new THREE.Vector3(...p).project(w.camera);assert.ok(Math.abs(q.x)<1&&Math.abs(q.y)<1,id+' visible playfield');}
    w.dispose();assert.equal(w.scene.children.length,0);
  }
});
test('versioned entry, offline worker and Android asset whitelist include studio modules',()=>{
  const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'yea-suite/arcade/v3.html'),'utf8'),gradle=fs.readFileSync(path.join(root,'native/android/app/build.gradle'),'utf8'),sw=fs.readFileSync(path.join(root,'yea-suite/arcade/sw.js'),'utf8');
  for(const name of ['app3d-v5.js','studio-models-v3.js','studio-worlds-v3.js','studio-v3.css']){assert.ok(html.includes(name));assert.ok(gradle.includes(name));assert.ok(sw.includes(name));assert.ok(fs.existsSync(path.join(root,'yea-suite/arcade',name)));}
  assert.ok(!gradle.includes('vendor/'));assert.ok(html.includes('integrity="sha384-'));assert.ok(html.includes('id="studio-panel"'));assert.ok(html.includes('id="joystick"'));
});
