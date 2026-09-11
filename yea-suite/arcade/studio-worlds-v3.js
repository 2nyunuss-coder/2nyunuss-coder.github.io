/* Original procedural scenes for YEA's workshop and collection games. */
(function(root){
  'use strict';
  const T=root.THREE,Base=root.YeaWorld3D.World,PI=Math.PI;
  const material=(c,r=.5,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m?.isMaterial?m:material(m));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;return o;}
  const box=(w,h,d,c,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z);
  const ball=(r,c,x=0,y=0,z=0)=>mesh(new T.SphereGeometry(r,20,14),c,x,y,z);
  const cyl=(r1,r2,h,c,x=0,y=0,z=0,n=32)=>mesh(new T.CylinderGeometry(r1,r2,h,n),c,x,y,z);
  function soft(w,h,d,c,x=0,y=0,z=0,r=.09){
    r=Math.min(r,w/3,h/3,d/3);const s=new T.Shape(),a=-w/2,b=-h/2;
    s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
    const g=new T.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,curveSegments:4,steps:1});g.translate(0,0,-(d-r*2)/2);return mesh(g,c,x,y,z);
  }
  function torus(r,t,c,x=0,y=0,z=0){const o=mesh(new T.TorusGeometry(r,t,8,48),c,x,y,z);o.rotation.x=PI/2;return o;}
  // Bake original, untextured decorations into one draw call per movable prop.
  function bake(group,shiny=false){
    group.updateMatrixWorld(true);const pos=[],norm=[],rgb=[],v=new T.Vector3(),n=new T.Vector3(),normal=new T.Matrix3(),geometries=new Set(),materials=new Set();
    group.traverse(o=>{if(!o.isMesh)return;const raw=o.geometry,g=raw.index?raw.toNonIndexed():raw,p=g.attributes.position,a=g.attributes.normal,c=g.attributes.color,color=o.material.color;normal.getNormalMatrix(o.matrixWorld);
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);n.fromBufferAttribute(a,i).applyMatrix3(normal).normalize();pos.push(v.x,v.y,v.z);norm.push(n.x,n.y,n.z);rgb.push(color.r*(c?c.getX(i):1),color.g*(c?c.getY(i):1),color.b*(c?c.getZ(i):1));}
      if(g!==raw)g.dispose();geometries.add(raw);materials.add(o.material);
    });
    group.clear();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new T.Float32BufferAttribute(rgb,3));geometry.computeBoundingSphere();
    const m=shiny?new T.MeshPhysicalMaterial({vertexColors:true,roughness:.32,clearcoat:.8,clearcoatRoughness:.2}):new T.MeshStandardMaterial({vertexColors:true,roughness:.77});group.add(mesh(geometry,m));return group;
  }
  function texture(w,h,pixel,color=true){const data=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const rgb=pixel(x/w,y/h,x,y),k=(y*w+x)*4;data[k]=rgb[0];data[k+1]=rgb[1];data[k+2]=rgb[2];data[k+3]=255;}const t=new T.DataTexture(data,w,h);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
  function woodMaps(){
    const grain=(u,v)=>{const a=u*PI*2,knot=Math.exp(-(((u-.31)*13)**2)-((v-.64)*9)**2),warp=Math.sin(v*9)*.24+Math.sin(v*31)*.035+knot*2.3;const ring=Math.sin(a*35+warp*7+Math.sin(a*6)*1.5),fine=Math.sin(a*193+v*27)*.022;return .76+ring*.105+fine-knot*.21+Math.sin(a*11+v*5)*.045;};
    const color=texture(256,512,(u,v)=>{const f=grain(u,v);return [235*f,174*f,108*f];});
    const bump=texture(256,512,(u,v)=>{const n=128+70*(grain(u,v)-.7);return[n,n,n];},false);
    const end=texture(256,256,(u,v)=>{const x=u-.48,y=v-.53,a=Math.atan2(y,x),r=Math.hypot(x,y),grain=Math.sin(r*195+Math.sin(a*4)*.8),f=.79+grain*.1+Math.sin(r*435)*.035;return [232*f,171*f,105*f];});
    for(const t of [color,bump])t.wrapS=T.RepeatWrapping;return {color,bump,end};
  }
  function environment(){const t=texture(256,128,(u,v)=>{const a=Math.max(0,1-v),panel=((u>.1&&u<.19)||(u>.58&&u<.65))&&v>.16&&v<.54,f=panel?255:65+a*115;return[f,Math.min(255,f*.97),Math.min(255,f*.9)];});t.mapping=T.EquirectangularReflectionMapping;return t;}
  function prop(o){
    const g=new T.Group(),r=o.r/40,accent=[0xeaa069,0x4d9c98,0xbd6f6a][o.variant];
    if(o.tier===0){
      const fruit=ball(r,material(0xf39a32,.7),0,r,0);fruit.scale.y=.9;g.add(fruit);g.add(cyl(r*.07,r*.09,r*.18,0x6c5037,0,r*1.88,0,8));const leaf=ball(r*.35,0x4e8750,r*.2,r*1.82,0);leaf.scale.set(1,.2,.5);leaf.rotation.z=.4;g.add(leaf);
    }else if(o.tier===1){
      g.add(ball(r,material(accent,.3),0,r,0));for(let i=0;i<3;i++){const stripe=torus(r*1.004,r*.022,0xf5ebcd,0,r,0);stripe.rotation.set(i*PI/3,0,i*PI/3);g.add(stripe);}
    }else if(o.tier===2){
      g.add(cyl(r*.65,r*.45,r*.95,material(0xb96f4e,.86),0,r*.48,0,24));g.add(torus(r*.65,r*.07,0xcc835e,0,r*.98,0));g.add(cyl(r*.58,r*.58,.025,0x514038,0,r*.97,0));
      for(let i=0;i<7;i++){const a=i*2.4,leaf=ball(r*.58,[0x4d8059,0x6d9867,0x8caa73][i%3],Math.sin(a)*r*.3,r*(1.23+i*.075),Math.cos(a)*r*.3);leaf.scale.set(.38,1,.16);leaf.rotation.set(Math.cos(a)*.55,0,Math.sin(a)*.55);g.add(leaf);}
    }else if(o.tier===3){
      const wood=material(0xc89a64,.78);g.add(box(r*1.55,r*.12,r*1.32,wood,0,r*.08,0));
      for(let k=0;k<3;k++)for(const z of [-r*.66,r*.66])g.add(soft(r*1.65,r*.19,r*.08,wood,0,r*(.35+k*.29),z));
      for(const x of [-r*.78,r*.78])for(let k=0;k<3;k++)g.add(box(r*.09,r*.2,r*1.3,wood,x,r*(.35+k*.29),0));
      for(const x of [-r*.74,r*.74])for(const z of [-r*.61,r*.61])g.add(box(r*.11,r*1.1,r*.11,0xa57647,x,r*.6,z));
      for(let i=0;i<5;i++)g.add(ball(r*.24,[0xecac45,0x92a85d][i%2],Math.sin(i*4)*r*.45,r*.72,Math.cos(i*4)*r*.32));
    }else if(o.tier===4){
      const timber=material(0xae8058,.7);g.add(soft(r*1.45,r*.15,r*1.3,timber,0,r*1.33,0));
      for(const x of [-.52,.52])for(const z of [-.46,.46])g.add(cyl(r*.07,r*.09,r*1.22,0x455855,r*x,r*.62,r*z,10));
      g.add(box(r*1.12,r*.09,r*.09,0x455855,0,r*.45,r*.46));g.add(box(r*1.12,r*.09,r*.09,0x455855,0,r*.45,-r*.46));
    }else if(o.tier===5){
      const paint=new T.MeshPhysicalMaterial({color:accent,roughness:.27,clearcoat:.9,clearcoatRoughness:.18});
      g.add(soft(r*1.64,r*.49,r*.95,paint,0,r*.57,0,r*.12));g.add(soft(r*.79,r*.43,r*.86,0xa5ccd2,-r*.08,r*.99,0,r*.12));g.add(soft(r*.67,r*.065,r*.85,paint,-r*.08,r*1.24,0));
      for(const x of [-.53,.53])for(const z of [-.5,.5]){const wheel=cyl(r*.24,r*.24,r*.13,material(0x293335,.92),r*x,r*.26,r*z,20);wheel.rotation.x=PI/2;g.add(wheel);const hub=cyl(r*.11,r*.11,r*.142,material(0xb8bfc0,.3,.72),r*x,r*.26,r*z,16);hub.rotation.x=PI/2;g.add(hub);}
      for(const z of [-r*.31,r*.31]){g.add(soft(r*.035,r*.15,r*.2,0xffedb4,r*.84,r*.64,z));g.add(soft(r*.035,r*.12,r*.19,0xa34439,-r*.84,r*.64,z));}g.add(box(r*.08,r*.075,r*.78,0xc1c4bb,r*.84,r*.39,0));
    }else{
      g.add(cyl(r*.18,r*.25,r*1.9,material(0x947354,.94),0,r*.95,0,14));
      for(let i=0;i<8;i++){const a=i*2.4,leaf=mesh(new T.IcosahedronGeometry(r*(.51+i%3*.09),2),material([0x527d57,0x709063,0x88a372][i%3],.95),Math.sin(a)*r*.43,r*(1.78+i%3*.31),Math.cos(a)*r*.39);g.add(leaf);}
      g.add(cyl(r*.76,r*.66,r*.23,0x9f9381,0,r*.115,0,24));g.add(cyl(r*.65,r*.65,.02,0x625c43,0,r*.24,0));
    }
    return bake(g,o.tier===5);
  }
  class StudioWorld extends Base{
    build_wood(){
      this.camera.position.set(0,1.4,17.2);this.camera.lookAt(0,-.1,0);this.scene.background=new T.Color(0x626c66);this.scene.fog=new T.Fog(0x626c66,24,45);
      this.sun.position.set(-5,10,9);this.sun.intensity=2.4;this.scene.children[0].intensity=1.2;this.scene.children[0].groundColor.set(0x665447);
      const fill=new T.DirectionalLight(0xc2e7f1,1.4);fill.position.set(6,2,-3);this.add(fill);const env=environment();this.textures.push(env);this.scene.environment=env;
      this.maps=woodMaps();this.textures.push(...Object.values(this.maps));
      const timber=material(0xaa8261,.75);timber.map=this.maps.color;
      this.add(box(28,.3,25,0x6c675b,0,-5.8,0));this.add(box(24,17,.25,0x81877a,0,1,-6));
      for(let x=-12;x<13;x+=1.3)this.add(box(.03,17,.03,0x737d72,x,1,-5.84));
      const windowFrame=material(0xd5d0b9,.75);this.add(soft(6.4,5.3,.18,windowFrame,-6,3,-5.7));this.add(box(5.95,4.85,.09,new T.MeshBasicMaterial({color:0xd4e2d9}),-6,3,-5.55));
      for(const x of [-8,-6,-4])this.add(box(.08,4.85,.08,windowFrame,x,3,-5.44));this.add(box(5.95,.1,.09,windowFrame,-6,3,-5.42));
      this.add(soft(14,.42,7,timber,0,-4.55,0,.14));for(const x of [-5.6,5.6])this.add(soft(.5,2,4.6,0x3b504c,x,-5.4,0));
      this.add(soft(7,.15,4.2,0x53635d,0,-4.3,.3));this.plinth=this.add(cyl(2.5,2.65,.26,material(0x364e4e,.33,.5),0,-4.07,0,64));this.add(torus(2.52,.027,0xd8b27b,0,-3.92,0));
      // Background display shelf and original sample silhouettes.
      this.add(soft(5,.16,1.8,timber,6.2,.8,-4.3));this.add(soft(5,.16,1.8,timber,6.2,4,-4.3));
      for(let j=0;j<5;j++){const profile=root.YeaStudio.designs[j][1].slice().reverse().map((r,i)=>new T.Vector2(r/230,i/8*1.5));const sample=mesh(new T.LatheGeometry(profile,24),material([0xc29b72,0x9d7660,0x678e87][j%3]),4.5+(j%3)*1.55,j<3?.9:4.1,-4.3);this.add(sample);}
      for(let j=0;j<3;j++){const jar=cyl(.31,.31,.8,material([0xb77d52,0x3d7d77,0x435768][j],.35),4+j*.85,-3.93,1.15);this.add(jar);this.add(cyl(.34,.34,.1,0xd8c6a3,4+j*.85,-3.48,1.15));}
      this.woodMat=new T.MeshPhysicalMaterial({map:this.maps.color,bumpMap:this.maps.bump,bumpScale:.055,roughness:.79,clearcoat:0,clearcoatRoughness:.2,vertexColors:true,envMapIntensity:.75});
      const p=[new T.Vector2(0,-3.8),...this.model.profile.slice().reverse().map((r,i)=>new T.Vector2(r/44,-3.8+i/(this.model.rows-1)*7.6)),new T.Vector2(0,3.8)];
      this.wood=mesh(new T.LatheGeometry(p,80),this.woodMat);this.wood.geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(this.wood.geometry.attributes.position.count*3).fill(1),3));this.add(this.wood);
      const capmat=new T.MeshPhysicalMaterial({map:this.maps.end,roughness:.7,clearcoat:.1});this.cap=mesh(new T.CircleGeometry(1,80),capmat,0,3.803,0);this.cap.rotation.x=-PI/2;this.add(this.cap);
      this.guide=new T.Group();this.add(this.guide);
      for(const side of [-1,1]){const pts=this.model.target.map((r,i)=>new T.Vector3(side*r/44,3.8-i/(this.model.rows-1)*7.6,3.08));const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineDashedMaterial({color:0xffe6a4,dashSize:.1,gapSize:.08,depthTest:false,transparent:true,opacity:.8}));line.computeLineDistances();line.renderOrder=5;this.guide.add(line);}
      this.cursor=new T.Group();this.cursor.add(mesh(new T.TorusGeometry(.18,.018,8,32),new T.MeshBasicMaterial({color:0xffe6a4,depthTest:false})));this.cursor.children[0].renderOrder=6;this.add(this.cursor);
      this.chips=new T.InstancedMesh(new T.BoxGeometry(.05,.015,.13),material(0xc69c6c,.86),64);this.chips.instanceMatrix.setUsage(T.DynamicDrawUsage);this.chips.frustumCulled=false;this.add(this.chips);this.chipTransform=new T.Object3D();this.chipAges=new Float32Array(64).fill(10);this.chipOrigins=Array.from({length:64},()=>new T.Vector3());this.chipHead=0;this.chipCarry=0;
      this.lastRevision=-1;this.lastSurface=-1;this.lastStain=-1;
    }
    build_hole(){
      const m=this.model;this.cameraMode=0;this.camera.position.set(0,20.6,14.2);this.camera.lookAt(0,0,0);this.scene.background=new T.Color(m.theme.sky);this.scene.fog=new T.Fog(m.theme.sky,32,65);this.sun.position.set(-8,16,6);this.sun.intensity=2.6;this.scene.children[0].intensity=1.7;
      const env=environment();this.textures.push(env);this.scene.environment=env;
      this.holeUniforms={holeAt:{value:new T.Vector2()},holeSize:{value:.45}};
      const pavement=texture(256,256,(u,v,x,y)=>{const mortar=x%64<2||y%32<2,noise=Math.sin(x*83+y*71)*2.5,f=mortar?.83:1;const c=new T.Color(m.theme.floor);return[c.r*255*f+noise,c.g*255*f+noise,c.b*255*f+noise];});pavement.wrapS=pavement.wrapT=T.RepeatWrapping;pavement.repeat.set(4,4);this.textures.push(pavement);
      const floorMat=material(0xffffff,.93);floorMat.map=pavement;const uniforms=this.holeUniforms;
      floorMat.onBeforeCompile=s=>{Object.assign(s.uniforms,uniforms);s.vertexShader='varying vec3 holeWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nholeWorld=(modelMatrix*vec4(position,1.0)).xyz;');s.fragmentShader='varying vec3 holeWorld; uniform vec2 holeAt; uniform float holeSize;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat holeDistance=distance(holeWorld.xz,holeAt); if(holeDistance<holeSize)discard;');s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>','gl_FragColor.rgb*=mix(0.68,1.0,smoothstep(holeSize,holeSize+0.13,holeDistance));\n#include <dithering_fragment>');};
      const floor=mesh(new T.PlaneGeometry(14.4,14.4),floorMat);floor.rotation.x=-PI/2;floor.position.y=.015;floor.castShadow=false;this.add(floor);
      // A genuine opening with inner walls and a bottom, no object shrinking.
      this.hole=this.add(new T.Group());const wall=mesh(new T.CylinderGeometry(1,.72,4,64,1,true),material(0x233138,.97),0,-2,0);wall.material.side=T.BackSide;wall.castShadow=false;this.hole.add(wall);const bottom=mesh(new T.CircleGeometry(.75,64),new T.MeshBasicMaterial({color:0x080f15}),0,-3.99,0);bottom.rotation.x=-PI/2;this.hole.add(bottom);
      this.rim=torus(1,.045,new T.MeshPhysicalMaterial({color:0x6de3cd,roughness:.2,metalness:.42,clearcoat:1}),0,.025,0);this.hole.add(this.rim);const inner=torus(.972,.021,0x344648,0,-.045,0);this.hole.add(inner);
      const bed=box(24,.5,24,0x627b80,0,-4.4,0);this.add(bed);const decorStart=this.scene.children.length;
      for(const x of [-7.4,7.4])this.add(soft(.36,.16,15.1,0xebe6d8,x,-.01,0));for(const z of [-7.4,7.4])this.add(soft(15.1,.16,.36,0xebe6d8,0,-.01,z));
      this.add(box(24,.12,5,0x77898a,0,-.08,-10));for(let x=-10;x<11;x+=2)this.add(box(1,.016,.09,0xded9c5,x,-.005,-9.5));
      this.add(box(24,.1,4,0x899a87,0,-.12,9.5));
      for(let i=0;i<5;i++){
        const x=-9+i*4.5,h=2.9+i%3*.7,facade=[0xe9c19c,0xa9c4ba,0xe0ac9c,0xc6bdd0,0xcfc9ad][i];
        this.add(soft(3.9,h,2.8,facade,x,h/2,-12));this.add(soft(4.05,.18,3,0xf1e9d8,x,h+.06,-12));
        for(const wx of [-1.02,0,1.02]){this.add(soft(.76,1.05,.06,0xeae5d2,x+wx,h-.88,-10.56));this.add(soft(.6,.87,.06,material(0x688c97,.22,.1),x+wx,h-.88,-10.51));}
        this.add(soft(1.2,1.66,.07,0x718b84,x,.83,-10.52));const awning=box(3.5,.1,1.1,m.theme.accent,x,1.95,-10.04);awning.rotation.x=.13;this.add(awning);
        for(let s=0;s<7;s+=2)this.add(box(.25,.11,1.08,0xf0e6cb,x-1.48+s*.49,1.96,-10.04));
      }
      for(const x of [-8.3,8.3])for(const z of [-5,1,6]){
        const planter=prop({r:42,tier:6,variant:0});planter.position.set(x,0,z);this.add(planter);
      }
      for(const x of [-6.8,6.8]){this.add(cyl(.065,.08,3.1,material(0x46595b,.4,.6),x,1.55,-7.1));this.add(cyl(.18,.24,.15,0x435457,x,3.12,-7.1));const lamp=ball(.2,new T.MeshBasicMaterial({color:0xffe9b1}),x,3,-7.1);this.add(lamp);}
      if((m.level-1)%3===0){const water=material(0x65a6b4,.25,.15);this.add(box(28,.04,9,water,0,-.27,16));for(let z=12;z<19;z+=.6)this.add(box(23,.008,.025,0x8bc0c5,0,-.24,z));for(let x=-10;x<=10;x+=1.4)this.add(cyl(.045,.045,.65,0xe5ddd0,x,.2,11.2,8));this.add(box(21,.06,.06,0xe5ddd0,0,.5,11.2));}
      const decor=new T.Group();for(const o of this.scene.children.slice(decorStart))decor.add(o);this.add(bake(decor));
      const shadeTex=texture(32,32,()=>[255,255,255],false); // alpha set below for soft contact shadows
      for(let y=0;y<32;y++)for(let x=0;x<32;x++)shadeTex.image.data[(y*32+x)*4+3]=Math.max(0,(1-Math.hypot((x-15.5)/16,(y-15.5)/16))**2)*90;
      shadeTex.needsUpdate=true;this.textures.push(shadeTex);
      this.contact=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadeTex,color:0x313c31,transparent:true,depthWrite:false}),m.total);this.contact.frustumCulled=false;this.contact.instanceMatrix.setUsage(T.DynamicDrawUsage);this.add(this.contact);this.contactTransform=new T.Object3D();
      this.model.items.forEach(o=>{const g=prop(o);this.add(g);this.objects.set(o,g);});
      this.particles=new T.InstancedMesh(new T.SphereGeometry(.035,6,4),new T.MeshBasicMaterial({color:0xffdfa2}),80);this.particles.frustumCulled=false;this.add(this.particles);this.effectTransform=new T.Object3D();
      this.destination=torus(.18,.015,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65}),0,.03,0);this.add(this.destination);
    }
    update(dt,s={}){
      if(!['wood','hole'].includes(this.id)){super.update(dt,s);return;}
      this.time+=dt;
      if(this.id==='wood')this.updateWood(dt,s);else this.updateHole(dt);
    }
    updateWood(dt,s){
      const m=this.model,g=this.wood.geometry,positions=g.attributes.position,rows=m.rows+2,colors=g.attributes.color;
      if(this.lastRevision!==m.revision){
        for(let i=0;i<positions.count;i++){const j=i%rows,theta=Math.floor(i/rows)/80*PI*2,row=Math.max(0,Math.min(m.rows-1,m.rows-j)),r=j===0||j===rows-1?0:m.profile[row]/44,y=j===0?-3.8:j===rows-1?3.8:-3.8+(j-1)/(m.rows-1)*7.6;positions.setXYZ(i,r*Math.sin(theta),y,r*Math.cos(theta));}
        positions.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();this.cap.scale.setScalar(m.profile[0]/44);this.lastRevision=m.revision;
      }
      if(this.lastSurface!==m.surfaceRevision||this.lastStain!==m.stain){
        const stain=new T.Color([0xffffff,0x896044,0xf2c382,0x46aaa3,0x697589][m.stain]),base=new T.Color();
        for(let i=0;i<positions.count;i++){const row=Math.max(0,Math.min(m.rows-1,m.rows-i%rows));base.setRGB(1,1,1);base.lerp(stain,m.coated[row]*.85);colors.setXYZ(i,base.r,base.g,base.b);}colors.needsUpdate=true;
        this.woodMat.roughness=.83-m.smoothness()/100*.4-m.coverage()/100*.2;this.woodMat.bumpScale=.055-m.smoothness()/100*.04;this.woodMat.clearcoat=m.coverage()/100*.92;this.cap.material.color.copy(stain);this.cap.material.clearcoat=this.woodMat.clearcoat;this.lastSurface=m.surfaceRevision;this.lastStain=m.stain;
      }
      this.wood.rotation.y+=dt*(m.phase==='display'?.35:1.5);this.cap.rotation.z=-this.wood.rotation.y;this.guide.visible=m.phase==='shape';
      const b=s.brush||{x:394,y:260,down:false},row=Math.max(0,Math.min(m.rows-1,Math.round((b.y-55)/410*(m.rows-1)))),radius=m.profile[row]/44,x=Math.abs(b.x-260)/44;
      this.cursor.position.set(Math.min(x,radius+.2),3.8-row/(m.rows-1)*7.6,Math.sqrt(Math.max(.04,radius*radius-Math.min(x,radius)**2))+.05);this.cursor.visible=!!b.down&&m.phase!=='display';this.cursor.scale.setScalar(m.phase==='shape'?1:2.4);
      this.chipCarry+=m.activity>.02&&m.phase==='shape'?dt*65:0;
      while(this.chipCarry>=1){const i=this.chipHead++%64;this.chipAges[i]=0;this.chipOrigins[i].copy(this.cursor.position);this.chipCarry--;}
      const t=this.chipTransform;for(let i=0;i<64;i++){this.chipAges[i]+=dt;const a=this.chipAges[i],visible=a<1.05;t.position.copy(this.chipOrigins[i]);t.position.x+=a*(.7+i%5*.25);t.position.y+=a*.7-a*a*4;t.position.z+=Math.sin(i*7)*a*1.4;t.rotation.set(a*7,i,a*9);t.scale.setScalar(visible?Math.max(.1,1-a*.6):0);t.updateMatrix();this.chips.setMatrixAt(i,t.matrix);}this.chips.instanceMatrix.needsUpdate=true;
      if(m.phase==='display'){const t=1-Math.exp(-dt*2);this.camera.position.lerp(new T.Vector3(5,3,16.4),t);this.camera.lookAt(0,-.2,0);}
    }
    updateHole(dt){
      const m=this.model,h=m.hole,x=(h.x-260)/40,z=(h.y-260)/40,r=h.r/40;
      this.hole.position.set(x,0,z);this.hole.scale.set(r,1,r);this.holeUniforms.holeAt.value.set(x,z);this.holeUniforms.holeSize.value=r;this.rim.material.emissive.setRGB(.03,m.growth*.17,m.growth*.1);
      for(const [o,g] of this.objects){g.visible=!o.taken;g.position.set((o.x-260)/40,o.z/40,(o.y-260)/40);g.rotation.set(Math.sin(o.axis)*o.tilt,o.angle,Math.cos(o.axis)*o.tilt);const shade=this.contactTransform;shade.position.set(g.position.x,.021,g.position.z);shade.rotation.x=-PI/2;shade.scale.setScalar(o.phase==='ground'?o.r/40*2.5:0);shade.updateMatrix();this.contact.setMatrixAt(o.id,shade.matrix);}this.contact.instanceMatrix.needsUpdate=true;
      this.destination.position.set((m.target.x-260)/40,.025,(m.target.y-260)/40);this.destination.visible=Math.hypot(m.target.x-h.x,m.target.y-h.y)>35;
      if(this.cameraMode===1){const f=1-Math.exp(-dt*5),focus=new T.Vector3(x*.65,0,z*.65);this.focus.lerp(focus,f);this.camera.position.lerp(new T.Vector3(this.focus.x,14.2+h.r/40,this.focus.z+9.8),f);this.camera.lookAt(this.focus);}
      const t=this.effectTransform;for(let i=0;i<80;i++){const e=m.effects[Math.floor(i/4)],age=e?.life?1-e.life/.8:1,a=(i%4)*PI/2+this.time*1.2;t.scale.setScalar(e?e.life*1.5:0);if(e)t.position.set((e.x-260)/40+Math.sin(a)*age*.9,.1+Math.sin(age*PI)*.55,(e.y-260)/40+Math.cos(a)*age*.9);t.updateMatrix();this.particles.setMatrixAt(i,t.matrix);}this.particles.instanceMatrix.needsUpdate=true;
    }
    setCamera(step){
      if(this.id==='wood'){this.camera.position.set([0,3.5,-3.5][step],1.4,17.2);this.camera.lookAt(0,-.1,0);}
      else if(this.id==='hole'){this.cameraMode=step;this.focus.set(0,0,0);if(step!==1){this.camera.position.set(0,step===2?24:20.6,step===2?1:14.2);this.camera.lookAt(0,0,0);}}
    }
  }
  root.YeaStudioWorld=StudioWorld;
})(window);
