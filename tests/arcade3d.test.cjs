const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../yea-suite/arcade/engine.js'),Castle=require('../yea-suite/arcade/castle3d.js');
try{global.THREE=require('../yea-suite/arcade/node_modules/three');}catch{global.THREE=require('../yea-suite/arcade/vendor/three.min.js');}global.window=global;global.YeaArcadeEngine=E;
// A texture-only canvas stub: tests scene construction/math, not browser rendering.
global.document={createElement(){return {getContext(){return {clearRect(){},strokeText(){},fillText(){}};}};}};
require('../yea-suite/arcade/world3d.js');
test('all six 3D scenes build, update and dispose with finite geometry',()=>{
  for(const g of E.catalog){const m=g.id==='castle'?new Castle(1):new g.Model(1),w=new YeaWorld3D.World({domElement:{getBoundingClientRect:()=>({left:0,top:0,width:520,height:520})}},g.id,m);w.update(.016,{target:{x:0,y:1,z:1.7},brush:{x:385,y:260,down:true},selected:g.id==='blocks'?'R':0,hint:0});let meshes=0;w.scene.traverse(o=>{if(o.isMesh){meshes++;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v),g.id+' finite position');}});assert.ok(meshes>10,g.id+' contains volumetric pieces');w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);const c=w.coordinates(260,260);assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));w.dispose();assert.equal(w.scene.children.length,0);}
});
test('wood cutting changes the actual mesh radius at the corresponding height',()=>{const m=new E.Wood(1),w=new YeaWorld3D.World({},'wood',m);m.cut(10,80,1);w.update(.01,{});const attr=w.wood.geometry.attributes.position,index=m.rows-1-10;assert.ok(Math.abs(Math.hypot(attr.getX(index),attr.getZ(index))-m.profile[10]/44)<.001);w.dispose();});
test('castle starts settled and projectiles physically displace blocks',()=>{const m=new Castle(1);for(let i=0;i<60;i++)m.update(1/60);assert.equal(m.hits,0);assert.equal(m.fire({x:-2.2,y:.7,z:1.7}),true);assert.equal(m.fire(),false);for(let i=0;i<240;i++)m.update(1/60);assert.ok(m.hits>0);assert.ok(m.blocks.some(b=>b.body.position.distanceTo(b.origin)>.65));assert.ok(m.blocks.every(b=>Number.isFinite(b.body.position.x)));});
test('worker offline manifests only reference existing local files',()=>{
  for(const file of ['yea-suite/sw.js','yea-suite/arcade/sw.js']){let core;const src=fs.readFileSync(path.join(__dirname,'..',file),'utf8');vm.runInNewContext(src+';capture(CORE);',{self:{addEventListener(){}},capture(v){core=v;}});for(const p of core){const local=path.resolve(__dirname,'..',path.dirname(file),p.split('?')[0]);assert.ok(fs.existsSync(local),file+' -> '+p);} }
});
test('3D entry and PWA manifests reference available scripts and icons',()=>{
  for(const file of ['yea-suite/arcade/v2.html','yea-suite/v19.html','yea-suite/apps/index.html']){const src=fs.readFileSync(path.join(__dirname,'..',file),'utf8');for(const match of src.matchAll(/(?:src|href)="([^"#?]+)"/g)){if(/^(https?:|data:)/.test(match[1]))continue;assert.ok(fs.existsSync(path.resolve(__dirname,'..',path.dirname(file),match[1])),file+' -> '+match[1]);}}
  const suite=JSON.parse(fs.readFileSync(path.join(__dirname,'../yea-suite/manifest.webmanifest'))),arcade=JSON.parse(fs.readFileSync(path.join(__dirname,'../yea-suite/arcade/manifest.webmanifest')));assert.notEqual(suite.id,arcade.id);for(const m of [suite,arcade])assert.ok(m.icons.some(i=>i.sizes==='512x512'));
});
