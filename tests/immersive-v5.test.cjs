const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Rig,angle}=require('../yea-suite/arcade/chase-v5.js'),S=require('../yea-suite/arcade/studio-models-v3.js');
const close=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} ≈ ${b}`);
test('follow rig starts behind the hole, follows its heading, and backs off with growth',()=>{
  const rig=new Rig(),h={x:260,y:260,r:18,vx:0,vy:0};rig.update(h,0);
  assert.ok(rig.position.z>5&&rig.position.y<3.5);assert.ok(rig.look.z<0);
  h.vx=110;h.x=380;for(let i=0;i<240;i++)rig.update(h,1/60);
  close(rig.yaw,Math.PI/2,.00001);assert.ok(rig.position.x<(h.x-260)/40);assert.ok(rig.look.x>(h.x-260)/40);
  const distance=Math.hypot(rig.position.x-3,rig.position.z);h.r=82;for(let i=0;i<180;i++)rig.update(h,1/60);
  assert.ok(Math.hypot(rig.position.x-3,rig.position.z)>distance+2);assert.ok(rig.position.y<4.5);
  rig.yaw=3.12;h.vx=-2;h.vy=110;const before=rig.yaw;rig.update(h,.016);assert.ok(Math.abs(angle(rig.yaw-before))<.03,'shortest turn across ±π');
});
test('a held joystick gesture stays straight as the chase camera turns',()=>{
  const rig=new Rig();rig.beginInput();const first=rig.move(1,0);rig.yaw=Math.PI/2;assert.deepEqual(rig.move(1,0),first);
  rig.endInput();rig.beginInput();const forward=rig.move(0,-1);close(forward.x,1);close(forward.y,0);
  for(const [x,y] of [[1,1],[-7,3],[0,0],[.2,.3]]){const v=rig.move(x,y);assert.ok(Math.hypot(v.x,v.y)<=1.000001);}
  close(Math.hypot(...Object.values(rig.move(.2,0))),.2);
});
test('camera-relative steering can collect every item without teleporting or changing game rules',()=>{
  for(const level of [1,7,20]){
    const m=new S.HoleWorld(level),rig=new Rig();rig.update(m.hole,0);let frames=0;
    while(m.status==='playing'&&frames<10000){
      const h=m.hole,o=m.items.filter(o=>o.phase==='ground'&&m.canTake(o)).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
      if(o){const dx=(o.x-h.x)/32,dy=(o.y-h.y)/32,c=Math.cos(rig.yaw),s=Math.sin(rig.yaw);rig.beginInput();const v=rig.move(c*dx+s*dy,-s*dx+c*dy);m.target={x:h.x+v.x*32,y:h.y+v.y*32};rig.endInput();}
      // Growth can move an edge-bound hole inward; compare movement after that clamp.
      const edge=h.r+8,clamp=n=>Math.max(edge,Math.min(520-edge,n)),old={x:clamp(h.x),y:clamp(h.y)};m.update(1/60);rig.update(h,1/60);assert.ok(Math.hypot(h.x-old.x,h.y-old.y)<3.50001);frames++;
    }
    assert.equal(m.status,'won','level '+level);assert.equal(m.collected,m.total);assert.ok(m.time>0);
  }
});
function setup(){
  global.window=global;try{global.THREE=require('../yea-suite/arcade/node_modules/three');}catch{global.THREE=require('../yea-suite/arcade/vendor/three.min.js');}
  global.YeaArcadeEngine=require('../yea-suite/arcade/engine.js');global.YeaStudio=S;global.YeaChase={Rig,angle};
  for(const file of ['world3d','studio-worlds-v3','worlds-v4','immersive-v5'])require('../yea-suite/arcade/'+file+'.js');
}
function world(id,level=1){const m=new(id==='wood'?S.WoodStudio:S.HoleWorld)(level),w=new YeaImmersiveWorld({domElement:{getBoundingClientRect:()=>({left:0,top:0,width:400,height:500})}},id,m);w.camera.aspect=.8;w.camera.updateProjectionMatrix();w.update(1/60,{});w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);return{m,w};}
function screen(w,p){const q=p.clone().project(w.camera);return{x:(q.x+1)*200,y:(1-q.y)*250};}
test('portrait follow camera keeps the hole below center and its growing rim inside the frame',()=>{
  setup();const {m,w}=world('hole');
  for(const radius of [18,44,82])for(const position of [[260,260],[100,100],[420,420]])for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    Object.assign(m.hole,{x:position[0],y:position[1],r:radius,vx:0,vy:0});w.rig.yaw=w.rig.heading=yaw;w.rig.update(m.hole,0,true);w.applyChase();w.camera.updateMatrixWorld(true);
    const center=new THREE.Vector3((m.hole.x-260)/40,.02,(m.hole.y-260)/40),p=center.clone().project(w.camera);assert.ok(p.y<-.1&&p.y>-.55);close(p.x,0);
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,q=center.clone().add(new THREE.Vector3(Math.sin(a)*radius/40,0,Math.cos(a)*radius/40)).project(w.camera);assert.ok(Math.abs(q.x)<.98&&Math.abs(q.y)<.98,'visible rim');}
  }
  w.rotateCamera(30,0);assert.equal(w.freeCamera,true);w.returnToPlay();assert.equal(w.freeCamera,false);w.dispose();
});
test('close-up scenes have finite volumetric geometry, local surface maps and bounded mesh count',()=>{
  setup();for(const id of ['hole','wood'])for(const level of [1,2,3]){
    const {m,w}=world(id,level);for(let i=0;i<90;i++)w.update(1/60,{brush:{x:340,y:220,down:true}});
    let count=0;w.scene.traverse(o=>{if(!o.isMesh)return;count++;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});assert.ok(count<100,id+' budget');
    if(id==='hole'){assert.ok(w.scene.background.isTexture);assert.ok(w.backdrop);for(const o of w.occluders)assert.ok(o.object.children[0].material.opacity>=.2&&o.object.children[0].material.opacity<=1);}
    else{assert.equal(w.woodMat.roughnessMap,w.surfaceMap);assert.equal(w.woodMat.clearcoatMap,w.coatMap);assert.ok(Math.abs(w.camera.position.x)>4);assert.ok(w.camera.position.length()<15);}
    w.dispose();assert.equal(w.scene.children.length,0);
  }
});
test('wood shaping coordinates map both sides correctly from each oblique camera',()=>{
  setup();const {m,w}=world('wood');
  for(let view=0;view<3;view++)for(const side of [-1,1]){
    w.setCamera(view);w.camera.updateMatrixWorld(true);const yaw=Math.atan2(w.camera.position.x,w.camera.position.z),point=new THREE.Vector3(Math.cos(yaw)*side*1.8,1.3,-Math.sin(yaw)*side*1.8),p=screen(w,point),b=w.brushCoordinates(p.x,p.y);
    close(b.x,260+1.8*44);close(b.y,55+(3.8-1.3)/7.6*410);assert.equal(b.side,side);
    const old=m.profile.slice();m.endStroke();m.cut((b.y-55)/410*(m.rows-1),Math.abs(b.x-260),1/60);assert.ok(m.profile.some((n,i)=>n<old[i]));
  }
  w.dispose();
});
test('polishing touches the actual 3D surface and only changes the selected rows',()=>{
  setup();const {m,w}=world('wood');m.phase='sand';w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);
  const b=w.brushCoordinates(200,220);assert.equal(b.down,true);assert.ok(b.point?.isVector3);const projected=screen(w,b.point);close(projected.x,200);close(projected.y,220);
  const row=Math.round((b.y-55)/410*(m.rows-1)),far=row<64?115:10;
  for(let i=0;i<40;i++)m.cut(row,Math.abs(b.x-260),1/60);w.update(1/60,{brush:b});
  const pixel=i=>(m.rows-1-i)*2*4;assert.ok(w.surfaceMap.image.data[pixel(row)]<w.surfaceMap.image.data[pixel(far)]);
  m.endStroke();m.phase='finish';for(let i=0;i<40;i++)m.cut(row,Math.abs(b.x-260),1/60);w.update(1/60,{brush:b});
  assert.ok(w.coatMap.image.data[pixel(row)]>200);assert.equal(w.coatMap.image.data[pixel(far)],0);assert.equal(w.brushCoordinates(-300,-300).down,false);
  const version=w.surfaceMap.version;w.update(1/60,{});assert.equal(w.surfaceMap.version,version,'unchanged surface is not uploaded each frame');w.dispose();
});
test('tall objects between the camera and player fade without changing game collisions',()=>{
  setup();const {m,w}=world('hole'),o=m.items.find(o=>o.tier===6),g=w.objects.get(o),oldRadius=o.r;
  o.x=m.hole.x;o.y=m.hole.y+80;o.phase='ground';o.taken=false;
  for(let i=0;i<60;i++)w.update(1/60,{});assert.ok(g.children[0].material.opacity<.4);assert.equal(o.r,oldRadius);assert.equal(m.canTake(o),false);
  o.x+=200;for(let i=0;i<60;i++)w.update(1/60,{});assert.ok(g.children[0].material.opacity>.99);w.dispose();
});
test('v5 entrypoints, offline cache and Android package load the new experience while preserving input and music',()=>{
  const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),sw=read('yea-suite/arcade/sw.js'),gradle=read('native/android/app/build.gradle'),controller=read('yea-suite/arcade/app3d-v5.js');
  for(const version of [2,3,4,5]){const html=read(`yea-suite/arcade/v${version}.html`);for(const name of ['chase-v5.js','immersive-v5.js','immersive-v5.css','app3d-v5.js','input-v4.js','audio-v4.js']){assert.ok(html.includes(name));assert.ok(sw.includes(name));assert.ok(gradle.includes(name));}assert.ok(!html.includes('src="./app3d-v4.js"'));assert.ok(html.indexOf('chase-v5.js')<html.indexOf('immersive-v5.js'));}
  assert.ok(read('yea-suite/arcade/immersive-v5.css').includes('aspect-ratio:4/5'));assert.ok(controller.includes('renderer.setSize(520,tall?650:520,false)'));assert.ok(controller.includes("['hole','wood'].includes(id)?window.YeaImmersiveWorld:window.YeaArcadeWorldV4"));
  assert.ok(controller.includes('bindLifecycle(window,document'));assert.ok(controller.includes('YeaGameInput.capture(canvas,e)'));assert.ok(controller.includes("KEY='yea_arcade_progress_v1'"));assert.ok(!gradle.includes('vendor/'));
  assert.ok(gradle.includes("versionCode 193; versionName '1.9.3'"));assert.ok(read('native/android/app/src/main/java/com/yea/mobile/MainActivity.java').includes('arcade/v5.html'));assert.ok(read('yea-suite/arcade/manifest.webmanifest').includes('v5.html'));
});
