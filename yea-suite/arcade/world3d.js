/* All visible game pieces are live 3D meshes. No prerendered gameplay. */
(function(root){
  'use strict';
  const T=root.THREE,E=root.YeaArcadeEngine,PI=Math.PI;
  const palette={blue:0x3097ff,red:0xff5c73,gold:0xffcf4d,mint:0x43d4a0,ink:0x203759};
  const xyz=(x,y)=>new T.Vector3((x-260)/40,0,(y-260)/40);
  const mat=(color,roughness=.38,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
  function box(w,h,d,color,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),typeof color==='number'||typeof color==='string'?mat(color):color,x,y,z);}
  function rounded(w,h,d,color,r=.13){const s=new T.Shape(),x=-w/2,y=-h/2; r=Math.min(r,w/3,h/3,d/3);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r,bevelThickness:r,curveSegments:3});g.translate(0,0,-(d-2*r)/2);return mesh(g,typeof color==='number'||typeof color==='string'?mat(color):color);}
  function sphere(r,color,x=0,y=0,z=0){return mesh(new T.SphereGeometry(r,18,12),typeof color==='number'||typeof color==='string'?mat(color):color,x,y,z);}
  function cylinder(r1,r2,h,color,x=0,y=0,z=0,n=32){return mesh(new T.CylinderGeometry(r1,r2,h,n),typeof color==='number'||typeof color==='string'?mat(color):color,x,y,z);}
  function ring(r,color){const o=mesh(new T.TorusGeometry(r,.045,8,48),mat(color));o.rotation.x=-PI/2;return o;}
  function label(value,size=1.2,color='#ffffff'){
    const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const o=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));o.scale.set(size,size/2,1);o.renderOrder=3;
    o.userData.write=v=>{if(o.userData.value===String(v))return;o.userData.value=String(v);ctx.clearRect(0,0,256,128);ctx.font='800 76px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=8;ctx.strokeStyle='#173354';ctx.strokeText(String(v),128,68);ctx.fillStyle=color;ctx.fillText(String(v),128,68);texture.needsUpdate=true;};o.userData.write(value);return o;
  }
  function woodTexture(){const w=256,h=512,data=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const wave=Math.sin(x*.21+Math.sin(y*.014)*4+Math.sin(x*.045+y*.007)*5),fine=Math.sin(x*1.7+y*.028);const f=.79+.12*wave+.035*fine;const k=(y*w+x)*4;data[k]=232*f;data[k+1]=180*f;data[k+2]=115*f;data[k+3]=255;}const t=new T.DataTexture(data,w,h);t.needsUpdate=true;t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;return t;}
  function eye(parent,x,y,z,s=.13){parent.add(sphere(s,0xffffff,x,y,z));parent.add(sphere(s*.5,0x193047,x,y,z+s*.82));}
  function makeToy(tier,r,index){
    const g=new T.Group(),s=r/40;
    if(tier===0){g.add(sphere(s,0xffc746,0,s,0));g.add(sphere(s*.4,0xffec9a,-s*.25,s*1.5,s*.55));}
    else if(tier===1){const b=rounded(s*1.6,s*1.6,s*1.6,[0xff8260,0x58bde8,0x936feb][index%3],s*.16);b.position.y=s;g.add(b);g.add(box(s*.18,s*1.72,s*1.7,0xffecc0,0,s,0));}
    else if(tier===2){g.add(cylinder(s*.18,s*.25,s*1.9,0xb77a48,0,s*.95,0,10));g.add(sphere(s*.9,0x36b78f,0,s*2,0));g.add(sphere(s*.62,0x68d39c,-s*.35,s*2.65,0));}
    else if(tier===3){const b=rounded(s*1.75,s*.65,s*1.12,[0xff677e,0x76d0f5][index%2],s*.13);b.position.y=s*.55;g.add(b);g.add(box(s*.8,s*.55,s*.94,0xe0f7ff,-s*.06,s*1.04,0));for(const x of [-.58,.58])for(const z of [-.62,.62])g.add(sphere(s*.25,0x253c57,s*x,s*.27,s*z));}
    else{g.add(box(s*1.35,s*1.5,s*1.3,0xffecd0,0,s*.75,0));const roof=mesh(new T.ConeGeometry(s*1.25,s*.85,4),mat([0xf28b65,0x786fe5][index%2]),0,s*1.9,0);roof.rotation.y=PI/4;g.add(roof);g.add(box(s*.4,s*.65,.04,0x55bde7,0,s*.7,s*.66));}
    return g;
  }
  class World{
    constructor(renderer,id,model,preview=false){
      this.renderer=renderer;this.id=id;this.model=model;this.preview=preview;this.time=0;this.objects=new Map();this.pickables=[];this.textures=[];this.scene=new T.Scene();this.scene.background=new T.Color(({castle:0xa6def3,wood:0xcedde8,hole:0xa3cbe6,territory:0x9cd8ed,blocks:0x52638c,arrows:0xb8e7db})[id]);
      this.camera=new T.PerspectiveCamera(39,1,.1,130);this.scene.add(new T.HemisphereLight(0xffffff,0x7799bc,2.2));const sun=new T.DirectionalLight(0xfff3de,3.2);sun.position.set(-6,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.5,far:50});sun.shadow.normalBias=.045;sun.shadow.bias=-.0002;this.scene.add(sun);this.sun=sun;
      this.raycaster=new T.Raycaster();this.boardPlane=new T.Plane(new T.Vector3(0,1,0),0);this.frontPlane=new T.Plane(new T.Vector3(0,0,1),0);this.focus=new T.Vector3();this.camera.position.set(0,17,11);this.camera.lookAt(this.focus);this['build_'+id]();
    }
    add(o){this.scene.add(o);return o;}
    ground(color,w=15,d=15){const o=box(w,.45,d,color,0,-.28,0);this.add(o);return o;}
    pick(object,data){object.traverse(o=>{if(o.isMesh){o.userData.pick=data;this.pickables.push(o);}});return object;}
    build_castle(){
      this.focus.set(0,1.8,1);this.camera.position.set(11,9.4,17);this.camera.lookAt(this.focus);
      this.ground(0x48bace,90,90);this.add(cylinder(8.2,8.6,.9,0xd6bd8e,0,-.55,0,64));this.add(cylinder(8.2,8.1,.22,0x89bd81,0,-.04,0,64));
      const tones=[0xffdfb2,0xf1bf82,0xffe4ba,0xeac497,0xf8d5a3];const stone=tones.map(c=>mat(c,.75));
      this.model.blocks.forEach((b,i)=>{const o=box(b.w,b.h,b.d,stone[b.tower]);o.position.copy(b.body.position);o.quaternion.copy(b.body.quaternion);this.add(this.pick(o,{block:i}));this.objects.set(b,o);if(i%12===0){const inset=box(b.w*.3,b.h*.55,.012,0x584d53,0,0,b.d/2+.01);o.add(inset);}});
      for(const tower of [0,1]){const top=this.model.blocks.filter(b=>b.tower===tower).sort((a,b)=>b.body.position.y-a.body.position.y)[0],holder=this.objects.get(top);holder.add(cylinder(.035,.035,1.35,0x9e785c,0,.82,0));holder.add(box(.65,.4,.025,tower===0?palette.red:palette.blue,.31,1.25,0));}
      const cannon=new T.Group();cannon.position.copy(this.model.origin);this.add(cannon);this.cannon=cannon;cannon.add(sphere(.54,0x268fa9));const barrel=cylinder(.29,.43,1.45,mat(0x24758c,.28,.65));barrel.rotation.x=PI/2;barrel.position.z=-.7;cannon.add(barrel);const trim=cylinder(.32,.32,.15,mat(palette.gold,.23,.45));trim.rotation.x=PI/2;trim.position.z=-1.42;cannon.add(trim);for(const x of [-.65,.65]){const wheel=cylinder(.52,.52,.26,0x283e51);wheel.rotation.z=PI/2;wheel.position.set(x,-.52,.15);cannon.add(wheel);}
      this.reticle=new T.Group();for(const [x,y,w,h] of [[-.22,0,.1,.55],[.22,0,.1,.55],[0,-.22,.55,.1],[0,.22,.55,.1]])this.reticle.add(box(w,h,.03,0xffffff,x,y,0));this.reticle.scale.setScalar(.7);this.add(this.reticle);
      this.trajectory=new T.Group();for(let i=0;i<17;i++)this.trajectory.add(sphere(.055,0xfff7c5));this.add(this.trajectory);this.dust=new T.InstancedMesh(new T.IcosahedronGeometry(.1,0),mat(0xffe6b3,.8),40);this.dust.visible=false;this.dust.frustumCulled=false;this.add(this.dust);this.dustTransform=new T.Object3D();
    }
    build_wood(){
      this.camera.position.set(0,1.8,16);this.camera.lookAt(0,0,0);this.ground(0xadc1d1,30,30).position.y=-5.2;
      this.add(box(1.9,1.1,2,mat(0x2c7186,.3,.5),0,4.6,0));this.add(box(2.5,1.05,2.5,mat(0x2c7186,.3,.5),0,-4.6,0));
      this.add(cylinder(.63,.63,.4,mat(0x718c9e,.25,.85),0,3.95,0));this.add(cylinder(.63,.63,.4,mat(0x718c9e,.25,.85),0,-3.95,0));
      this.woodMap=woodTexture();this.textures.push(this.woodMap);this.woodMat=mat(0xffffff,.45);this.woodMat.map=this.woodMap;
      const points=this.model.profile.map((r,i)=>new T.Vector2(r/44,-3.8+i/(this.model.rows-1)*7.6));this.wood=mesh(new T.LatheGeometry(points,64),this.woodMat);this.add(this.wood);
      this.targetLines=[];for(const side of [-1,1]){const pts=this.model.target.map((r,i)=>new T.Vector3(side*r/44,3.8-i/(this.model.rows-1)*7.6,.02));const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineDashedMaterial({color:0xffffff,dashSize:.12,gapSize:.08,depthTest:false}));line.computeLineDistances();line.renderOrder=4;this.add(line);this.targetLines.push(line);}
      const ghostPoints=this.model.target.slice().reverse().map((r,i)=>new T.Vector2(r/44,-3.8+i/(this.model.rows-1)*7.6));this.ghost=mesh(new T.LatheGeometry(ghostPoints,24),new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.08,wireframe:true,depthWrite:false}));this.add(this.ghost);
      this.tool=new T.Group();this.tool.add(box(1.5,.18,.25,mat(0xc6d7df,.2,.75),.9,0,0));this.tool.add(cylinder(.18,.18,1.1,0xf2a65f,2,0,0));this.tool.children[1].rotation.z=PI/2;this.add(this.tool);this.tool.position.set(3.2,0,0);
      this.chips=new T.Group();this.add(this.chips);for(let i=0;i<35;i++){const o=box(.055,.018,.12,0xd79c61);o.visible=false;this.chips.add(o);}
    }
    build_hole(){
      this.camera.position.set(0,17,12);this.camera.lookAt(0,0,0);this.ground(0x6387ae,22,22);
      const uniforms={holeAt:{value:new T.Vector2(0,0)},holeSize:{value:.4}};this.holeUniforms=uniforms;
      const floorMat=mat(0xf6e5c8,.78);floorMat.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='varying vec3 holeWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nholeWorld=(modelMatrix*vec4(position,1.0)).xyz;');shader.fragmentShader='varying vec3 holeWorld; uniform vec2 holeAt; uniform float holeSize;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(distance(holeWorld.xz,holeAt)<holeSize)discard;');};
      const floor=mesh(new T.PlaneGeometry(13,13),floorMat);floor.rotation.x=-PI/2;floor.position.y=.02;this.add(floor);
      for(let i=-6;i<=6;i+=2){const stripe=box(.035,.007,13,0xe2cfb0,i,.027,0);stripe.material.onBeforeCompile=floorMat.onBeforeCompile;this.add(stripe);const cross=box(13,.007,.035,0xe2cfb0,0,.027,i);cross.material.onBeforeCompile=floorMat.onBeforeCompile;this.add(cross);}
      this.hole=new T.Group();const disk=mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:0x091629}));disk.rotation.x=-PI/2;disk.position.y=-.04;this.hole.add(disk);const rim=mesh(new T.TorusGeometry(1,.065,10,64),mat(0x8463fa,.3,.25));rim.rotation.x=-PI/2;rim.position.y=.06;this.hole.add(rim);this.add(this.hole);
      this.model.items.forEach((o,i)=>{const toy=makeToy(o.tier,o.r,i);toy.position.copy(xyz(o.x,o.y));toy.userData.fall=0;this.add(toy);this.objects.set(o,toy);});
      for(const x of [-6.8,6.8])this.add(box(.3,.45,13.8,0xffffff,x,.05,0));for(const z of [-6.8,6.8])this.add(box(13.8,.45,.3,0xffffff,0,.05,z));
    }
    build_blocks(){
      this.camera.position.set(0,16,10.3);this.camera.lookAt(0,0,0);this.ground(0x293e66,15,15);this.add(box(10,.55,10,0xdbe8f5,0,-.02,0));
      for(let x=0;x<6;x++)for(let y=0;y<6;y++){const p=xyz(100+x*64,100+y*64);this.add(box(1.52,.06,1.52,(x+y)%2?0xb3c9dd:0xbcd2e4,p.x,.29,p.z));}
      this.model.pieces.forEach(p=>{
        const horizontal=p.exit%2===1;const gx=horizontal?(p.exit===1?5.08:-5.08):(68+p.lane*64+p.w*32-260)/40;const gz=horizontal?(68+p.lane*64+p.h*32-260)/40:(p.exit===2?5.08:-5.08);
        const gate=rounded(horizontal?.32:p.w*1.6,.22,horizontal?p.h*1.6:.32,p.color,.06);gate.position.set(gx,.4,gz);this.add(gate);const tag=label(p.id,.66);tag.position.set(gx,.83,gz);this.add(tag);
        const b=rounded(p.w*1.6-.18,.68,p.h*1.6-.18,p.color,.18);b.position.copy(xyz(68+p.x*64+p.w*32,68+p.y*64+p.h*32));b.position.y=.77;this.pick(b,{piece:p.id});const letter=label(p.id,.68);letter.position.set(0,.6,.15);b.add(letter);
        eye(b,-.24,.22,p.h*.8-.03,.1);eye(b,.24,.22,p.h*.8-.03,.1);this.add(b);b.userData.out=0;this.objects.set(p.id,b);
      });
    }
    build_arrows(){
      this.camera.position.set(0,16,8.5);this.camera.lookAt(0,0,0);this.ground(0x5ea895,15,15);this.add(box(11,.5,11,0xe5f4ef,0,-.05,0));
      const n=this.model.n,step=9.5/n;this.arrowStep=step;this.model.cells.forEach((d,i)=>{const x=(i%n-(n-1)/2)*step,z=(Math.floor(i/n)-(n-1)/2)*step;
        this.add(box(step*.93,.06,step*.93,0xcbded5,x,.22,z));const g=new T.Group();g.position.set(x,.48,z);g.rotation.y=-d*PI/2;
        const stem=rounded(step*.18,.18,step*.47,0x244c60,.04);stem.position.z=step*.12;g.add(stem);const arrow=mesh(new T.ConeGeometry(step*.23,step*.32,3),mat(0x244c60));arrow.rotation.x=-PI/2;arrow.position.z=-step*.24;g.add(arrow);
        this.pick(g,{arrow:i});g.userData.base=new T.Vector3(x,.48,z);g.userData.direction=d;g.userData.fly=0;this.add(g);this.objects.set(i,g);
      });
    }
    build_territory(){
      this.camera.position.set(0,18,12);this.camera.lookAt(0,0,0);this.ground(0x78c4da,35,35);this.nodeGroups=[];const colors=[0xd4dacd,palette.blue,palette.red];
      // Convex Voronoi cells form a continuous map; a raised border separates regions.
      this.model.nodes.forEach(n=>{let poly=[[-6.25,-6.25],[6.25,-6.25],[6.25,6.25],[-6.25,6.25]],p=xyz(n.x,n.y);for(const other of this.model.nodes){if(other===n)continue;const q=xyz(other.x,other.y),a=q.x-p.x,b=q.z-p.z,c=(q.x*q.x+q.z*q.z-p.x*p.x-p.z*p.z)/2,next=[];for(let i=0;i<poly.length;i++){const u=poly[i],v=poly[(i+1)%poly.length],du=a*u[0]+b*u[1]-c,dv=a*v[0]+b*v[1]-c;if(du<=0)next.push(u);if((du<=0)!==(dv<=0)){const t=du/(du-dv);next.push([u[0]+t*(v[0]-u[0]),u[1]+t*(v[1]-u[1])]);}}poly=next;}
        const shape=new T.Shape();poly.forEach(([x,z],i)=>{x=p.x+(x-p.x)*.976;z=p.z+(z-p.z)*.976;if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z);});shape.closePath();const area=mesh(new T.ExtrudeGeometry(shape,{depth:.27,bevelEnabled:true,bevelSegments:1,bevelSize:.05,bevelThickness:.04,steps:1}),mat(colors[n.owner],.68));area.rotation.x=-PI/2;this.add(this.pick(area,{node:n.id}));
        const tower=new T.Group();tower.position.copy(p);tower.position.y=.4;tower.add(cylinder(.47,.63,.3,0xf5f5e7,0,.1,0));tower.add(cylinder(.36,.43,.65,colors[n.owner],0,.56,0));tower.add(sphere(.17,0xffe092,0,1.05,0));this.add(this.pick(tower,{node:n.id}));const number=label(Math.floor(n.power),1.3);number.position.set(p.x,1.85,p.z);this.add(number);const selection=ring(.91,0xffffff);selection.position.set(p.x,.4,p.z);selection.visible=false;this.add(selection);this.nodeGroups.push({area,tower,number,selection});
      });
      this.fleetGroup=new T.Group();this.add(this.fleetGroup);this.fleetGeometry=new T.SphereGeometry(.095,6,4);this.fleetMaterial=[null,mat(palette.blue),mat(palette.red)];this.fleetPool=[];
    }
    coordinates(clientX,clientY){const r=this.renderer.domElement.getBoundingClientRect();this.raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),this.camera);const hits=this.raycaster.intersectObjects(this.pickables,false);const at=new T.Vector3();this.raycaster.ray.intersectPlane(this.id==='wood'?this.frontPlane:this.boardPlane,at);return {hit:hits[0]?.object.userData.pick,world:hits[0]?.point||at,plane:at,x:at.x*40+260,y:at.z*40+260};}
    update(dt,state={}){
      this.time+=dt;const m=this.model,s=state;const blend=1-Math.exp(-dt*18);
      if(this.id==='castle'){
        for(const b of m.blocks){const o=this.objects.get(b);o.position.copy(b.body.position);o.quaternion.copy(b.body.quaternion);}
        for(const b of m.balls){let o=this.objects.get(b);if(!o){o=this.add(sphere(.38,mat(0x25394c,.24,.75)));this.objects.set(b,o);}o.position.copy(b.body.position);}
        for(const [b,o] of this.objects)if(b.age>7){this.scene.remove(o);o.geometry.dispose();o.material.dispose();this.objects.delete(b);}
        const effect=m.effects.at(-1);this.dust.visible=!!effect;if(effect){const t=1-effect.life,o=this.dustTransform;for(let i=0;i<40;i++){o.position.set(effect.x+Math.sin(i*8)*t*2,effect.y+Math.cos(i*6)*t*2+t-t*t*3,effect.z+Math.sin(i*3)*t*2);o.scale.setScalar(effect.life*(.7+i%4*.4));o.rotation.set(t*i,t*7,0);o.updateMatrix();this.dust.setMatrixAt(i,o.matrix);}this.dust.instanceMatrix.needsUpdate=true;}
        const target=s.target||m.target;this.reticle.position.set(target.x,target.y,target.z+.53);this.reticle.quaternion.copy(this.camera.quaternion);this.reticle.visible=!m.cooldown;this.cannon.lookAt(target.x,target.y,target.z);this.cannon.rotateY(PI);
        const origin=m.origin,dx=target.x-origin.x,dz=target.z-origin.z,t=Math.hypot(dx,dz)/24,vy=(target.y-origin.y+4.91*t*t)/t;this.trajectory.visible=m.cooldown===0;this.trajectory.children.forEach((o,i)=>{const tt=t*i/17;o.position.set(origin.x+dx/t*tt,origin.y+vy*tt-4.91*tt*tt,origin.z+dz/t*tt);});
      }else if(this.id==='wood'){
        const a=this.wood.geometry.attributes.position,rows=m.rows;for(let i=0;i<a.count;i++){const row=i%rows,theta=Math.floor(i/rows)/64*PI*2,r=m.profile[rows-1-row]/44;a.setXYZ(i,r*Math.sin(theta),-3.8+row/(rows-1)*7.6,r*Math.cos(theta));}a.needsUpdate=true;this.wood.geometry.computeVertexNormals();this.wood.rotation.y=this.time*3.4;
        this.woodMat.color.set([0xffffff,0xa98576,0x69c4ef][m.stain]);const brush=s.brush||{x:390,y:260};this.tool.position.set(Math.abs(brush.x-260)/44,3.8-(brush.y-55)/410*7.6,.25);this.tool.visible=true;
        this.chips.children.forEach((o,i)=>{o.visible=!!brush.down;if(o.visible){const t=(this.time*1.6+i/35)%1;o.position.copy(this.tool.position);o.position.x+=t*(1+(i%5)*.35);o.position.y-=t*t*3;o.position.z+=Math.sin(i*13)*t*2;o.rotation.set(t*9,i,t*14);}});
      }else if(this.id==='hole'){
        const p=xyz(m.hole.x,m.hole.y),r=m.hole.r/40;this.hole.position.copy(p);this.hole.scale.set(r,1,r);this.holeUniforms.holeAt.value.set(p.x,p.z);this.holeUniforms.holeSize.value=r;
        for(const [o,g] of this.objects){if(o.taken){g.userData.fall=Math.min(1,g.userData.fall+dt*2.6);const t=g.userData.fall;g.position.y=-t*t*2;g.rotation.z=t*.65;g.scale.setScalar(Math.max(.001,1-t));g.visible=t<1;}else g.rotation.y=Math.sin(o.x)*.2;}
      }else if(this.id==='blocks'){
        for(const p of m.pieces){const o=this.objects.get(p.id),dest=xyz(68+p.x*64+p.w*32,68+p.y*64+p.h*32);dest.y=p.id===s.selected ? .9 : .77;
          if(p.out){o.userData.out=Math.min(1,o.userData.out+dt*2.5);const dir=E.DIRS[p.exit];dest.x+=dir[0]*o.userData.out*4;dest.z+=dir[1]*o.userData.out*4;o.scale.setScalar(Math.max(.001,1-o.userData.out));o.visible=o.userData.out<1;}else{o.userData.out=0;o.visible=true;o.scale.setScalar(1);}
          o.position.lerp(dest,blend);o.material.emissive.set(p.id===s.selected?0x222222:0x000000);
        }
      }else if(this.id==='arrows'){
        for(const [i,o] of this.objects){const base=o.userData.base;if(m.cells[i]==null){o.userData.fly=Math.min(1,o.userData.fly+dt*1.9);const dir=E.DIRS[o.userData.direction],f=o.userData.fly;o.position.set(base.x+dir[0]*f*12,base.y+f*.6,base.z+dir[1]*f*12);o.visible=f<1;}else{o.userData.fly=0;o.position.copy(base);o.visible=true;o.traverse(p=>{if(p.material)p.material.color.set(i===s.hint?0xf2b729:0x244c60);});}}
      }else if(this.id==='territory'){
        const colors=[0xd4dacd,palette.blue,palette.red];m.nodes.forEach(n=>{const g=this.nodeGroups[n.id];g.area.material.color.lerp(new T.Color(colors[n.owner]),blend);g.tower.children[1].material.color.set(colors[n.owner]);g.number.userData.write(Math.floor(n.power));g.selection.visible=s.selected===n.id;g.selection.rotation.z=this.time;});
        let used=0;for(const f of m.fleets){const a=xyz(m.nodes[f.from].x,m.nodes[f.from].y),b=xyz(m.nodes[f.to].x,m.nodes[f.to].y),n=Math.min(24,f.count);for(let i=0;i<n;i++){let o=this.fleetPool[used];if(!o){o=mesh(this.fleetGeometry,this.fleetMaterial[f.owner]);o.castShadow=false;this.fleetGroup.add(o);this.fleetPool.push(o);}o.visible=true;o.material=this.fleetMaterial[f.owner];const t=Math.max(0,f.progress-i*.006);o.position.copy(a).lerp(b,t);o.position.y=.55+Math.sin(t*PI)*.23;o.position.x+=Math.sin(i*4)*.18;o.position.z+=Math.cos(i*4)*.18;used++;}}this.fleetPool.forEach((o,i)=>{if(i>=used)o.visible=false;});
      }
    }
    render(){this.renderer.render(this.scene,this.camera);}
    dispose(){const geo=new Set(),materials=new Set(),textures=new Set(this.textures);this.scene.traverse(o=>{if(o.geometry)geo.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);if(m.map)textures.add(m.map);}});for(const t of textures)t.dispose();for(const g of geo)g.dispose();for(const m of materials)m.dispose();this.sun.shadow.map?.dispose();this.scene.clear();this.objects.clear();this.pickables=[];}
  }
  root.YeaWorld3D={World,createRenderer(canvas){const r=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false,preserveDrawingBuffer:true});r.setPixelRatio(Math.min(devicePixelRatio||1,1.7));r.setSize(520,520,false);r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.12;return r;}};
})(window);
