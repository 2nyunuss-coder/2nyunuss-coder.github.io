/* Original sculpted game boards and movable perspective cameras. */
(function(root){
  'use strict';
  const T=root.THREE,PI=Math.PI;
  const mat=(c,r=.4,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m?.isMaterial?m:mat(m));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;return o;}
  const box=(w,h,d,c,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z);
  const ball=(r,c,x=0,y=0,z=0)=>mesh(new T.SphereGeometry(r,16,10),c,x,y,z);
  const cyl=(a,b,h,c,x=0,y=0,z=0,n=32)=>mesh(new T.CylinderGeometry(a,b,h,n),c,x,y,z);
  function soft(w,h,d,c,x=0,y=0,z=0,r=.13){
    r=Math.min(r,w/5,h/5,d/3);w-=2*r;h-=2*r;const s=new T.Shape(),a=-w/2,b=-h/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
    const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,curveSegments:5,steps:1});g.translate(0,0,-(d-2*r)/2);return mesh(g,c,x,y,z);
  }
  function ring(r,t,c,x=0,y=0,z=0){const o=mesh(new T.TorusGeometry(r,t,8,48),c,x,y,z);o.rotation.x=-PI/2;return o;}
  function textLabel(value,size=1){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,256,128);ctx.font='800 80px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=8;ctx.strokeStyle='#21313d';ctx.strokeText(String(value),128,67);ctx.fillStyle='#ffffff';ctx.fillText(String(value),128,67);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:t,depthTest:false}));s.scale.set(size,size/2,1);s.renderOrder=3;return s;}
  function dataTexture(w,h,fn){const a=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const rgb=fn(x,y),i=(y*w+x)*4;a[i]=rgb[0];a[i+1]=rgb[1];a[i+2]=rgb[2];a[i+3]=255;}const t=new T.DataTexture(a,w,h);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
  function skyEnvironment(){const t=dataTexture(128,64,(x,y)=>{const light=(x>15&&x<30&&y>8&&y<27)||(x>83&&x<101&&y>10&&y<30),n=light?250:100+(1-y/64)*110;return[n,n,Math.min(255,n*1.04)];});t.mapping=T.EquirectangularReflectionMapping;return t;}
  class World extends root.YeaStudioWorld{
    constructor(renderer,id,model,preview=false){
      super(renderer,id,model,preview);this.freeCamera=false;this.viewStep=0;
      if(!['wood','hole'].includes(id)){const env=skyEnvironment();this.scene.environment=env;this.textures.push(env);this.sun.intensity=2.6;this.scene.children[0].intensity=1.65;this.scene.children[0].groundColor.set(0x527184);const fill=new T.DirectionalLight(0xcfe7ff,.9);fill.position.set(8,6,-4);this.add(fill);}
      if(['arrows','blocks','territory'].includes(id)){this.camera.fov=42;this.camera.updateProjectionMatrix();this.setCamera(0);}
    }
    ocean(color,y=-1.6,size=65,z=0){
      const tex=dataTexture(128,128,(x,y)=>{const ripple=Math.sin(x*.36+Math.sin(y*.13)*2)*Math.sin(y*.22+x*.08),n=217+ripple*23;return[n,n,255];});tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(7,7);this.textures.push(tex);
      const m=mat(color,.3,.18);m.map=tex;const u={value:0};m.onBeforeCompile=s=>{s.uniforms.seaTime=u;s.vertexShader='uniform float seaTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(position.x*0.7+seaTime)*cos(position.y*0.65+seaTime*0.6)*0.035;');};
      const o=mesh(new T.PlaneGeometry(size,size,24,24),m,0,y,z);o.rotation.x=-PI/2;o.castShadow=false;this.add(o);this.waterEffects||=[];this.waterEffects.push({uniform:u,texture:tex});
    }
    deck(accent){
      this.scene.background=new T.Color(0x99cada);this.scene.fog=new T.Fog(0x99cada,32,80);this.ocean(0x338ca5,-1.65);
      this.add(cyl(7.8,6.8,1.1,mat(0x667e96,.8),0,-.7,0,8));this.add(cyl(7.9,7.9,.12,mat(accent,.32,.25),0,-.14,0,8));
      this.add(soft(11.5,.48,11.5,mat(0xe9eff0,.45),0,.06,0,.14));this.add(soft(10.6,.1,10.6,mat(0x798ca2,.6),0,.34,0,.05));
      for(const x of [-6.2,6.2])for(const z of [-4.6,4.6]){this.add(cyl(.2,.3,.42,mat(0x364d6b,.6),x,.05,z,12));this.add(ball(.13,new T.MeshBasicMaterial({color:accent}),x,.32,z));}
      for(let i=0;i<8;i++){const a=i*PI/4,rock=mesh(new T.DodecahedronGeometry(.7+i%2*.3,0),mat(0x638797,.85),Math.sin(a)*11,-1.5,Math.cos(a)*11);rock.scale.y=.7;this.add(rock);}
    }
    build_arrows(){
      this.deck(0x5de0b4);const n=this.model.n,step=9.5/n;this.arrowStep=step;
      const tiles=[mat(0xd2e7df,.64),mat(0xc0d8d0,.64)];
      this.model.cells.forEach((d,i)=>{const x=(i%n-(n-1)/2)*step,z=(Math.floor(i/n)-(n-1)/2)*step;this.add(soft(step*.94,.14,step*.94,tiles[(Math.floor(i/n)+i%n)%2],x,.44,z,.06));
        const shape=new T.Shape(),points=[[-.105,-.39],[.105,-.39],[.105,.03],[.29,.03],[0,.4],[-.29,.03],[-.105,.03]];points.forEach(([a,b],j)=>j?shape.lineTo(a*step,b*step):shape.moveTo(a*step,b*step));shape.closePath();
        const g=new T.Group();g.position.set(x,.63,z);g.rotation.y=-d*PI/2;const arrow=mesh(new T.ExtrudeGeometry(shape,{depth:.21,bevelEnabled:true,bevelSegments:3,bevelSize:.04,bevelThickness:.045,steps:1}),new T.MeshPhysicalMaterial({color:0x244c60,roughness:.24,metalness:.15,clearcoat:.7}));arrow.rotation.x=-PI/2;g.add(arrow);this.pick(g,{arrow:i});g.userData.base=new T.Vector3(x,.63,z);g.userData.direction=d;g.userData.fly=0;this.add(g);this.objects.set(i,g);
      });
    }
    build_blocks(){
      this.deck(0xb39af4);const colors=[mat(0xc1ccde,.59),mat(0xb3c2d9,.59)];
      for(let x=0;x<6;x++)for(let y=0;y<6;y++)this.add(soft(1.5,.09,1.5,colors[(x+y)%2],(100+x*64-260)/40,.43,(100+y*64-260)/40,.035));
      this.model.pieces.forEach(p=>{
        const horizontal=p.exit%2===1,gx=horizontal?(p.exit===1?5.3:-5.3):(68+p.lane*64+p.w*32-260)/40,gz=horizontal?(68+p.y*64+p.h*32-260)/40:(p.exit===2?5.3:-5.3);
        const laneZ=horizontal?(68+p.lane*64+p.h*32-260)/40:gz,width=(horizontal?p.h:p.w)*1.6;
        const gate=new T.Group();gate.position.set(gx,0,laneZ);gate.rotation.y=horizontal?PI/2:0;const frame=mat(p.color,.3,.3);gate.add(soft(.16,1.05,.26,frame,-width/2+.05,.75,0,.05));gate.add(soft(.16,1.05,.26,frame,width/2-.05,.75,0,.05));gate.add(soft(width,.2,.28,frame,0,1.3,0,.07));gate.add(box(width,.045,.32,new T.MeshBasicMaterial({color:p.color}),0,.52,0));this.add(gate);const tag=textLabel(p.id,.72);tag.position.set(gx,1.7,laneZ);this.add(tag);
        const body=soft(p.w*1.6-.18,.95,p.h*1.6-.18,new T.MeshPhysicalMaterial({color:p.color,roughness:.28,clearcoat:.85,clearcoatRoughness:.18}),0,0,0,.18);body.position.set((68+p.x*64+p.w*32-260)/40,1.02,(68+p.y*64+p.h*32-260)/40);this.pick(body,{piece:p.id});
        const badge=textLabel(p.id,.87);badge.position.set(0,.7,.05);body.add(badge);
        for(const x of [-.24,.24]){body.add(ball(.12,0xffffff,x,.18,p.h*.8-.045));body.add(ball(.063,0x21384b,x,.18,p.h*.8+.055));}
        this.add(body);body.userData.out=0;this.objects.set(p.id,body);
      });
    }
    build_territory(){
      super.build_territory();this.scene.background=new T.Color(0xa5d8e5);this.scene.fog=new T.Fog(0xa5d8e5,32,85);
      const old=this.scene.children.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.width===35);if(old){this.scene.remove(old);old.geometry.dispose();old.material.dispose();}
      this.ocean(0x3b9bb4,-.36);this.add(cyl(9.5,8.3,.65,mat(0x607d75,.88),0,-.28,0,12));
      this.nodeGroups.forEach((g,i)=>{g.area.scale.z=2.5;g.tower.position.y=.88;g.number.position.y=2.9;g.selection.position.y=.77;
        const top=mesh(new T.ConeGeometry(.49,.42,6),mat(0xf3e6bf,.32,.15),0,1.12,0);g.tower.add(top);g.tower.add(ring(.59,.04,mat(0xf6d394,.3,.2),0,.08,0));
        for(let k=0;k<3;k++){const a=k*2.1+i,o=mesh(new T.DodecahedronGeometry(.12,0),mat(0x80a68b,.9),Math.sin(a)*.76,.03,Math.cos(a)*.76);g.tower.add(o);}
      });
      for(let i=0;i<9;i++){const a=i*2.39,rock=mesh(new T.IcosahedronGeometry(.8+i%3*.2,0),mat(0x809b86,.93),Math.sin(a)*11,-.28,Math.cos(a)*11);rock.scale.y=.5;this.add(rock);}
    }
    build_castle(){
      super.build_castle();this.scene.background=new T.Color(0x92c8e6);this.scene.fog=new T.Fog(0x92c8e6,37,105);
      const old=this.scene.children.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.width===90);if(old){this.scene.remove(old);old.geometry.dispose();old.material.dispose();}this.ocean(0x3296b4,-.34,95);
      const wallMap=dataTexture(128,128,(x,y)=>{const joint=y%32<2||(x+(Math.floor(y/32)%2)*32)%64<2,n=joint?188:231+Math.sin(x*7+y*13)*10;return[n,n-7,n-19];});wallMap.wrapS=wallMap.wrapT=T.RepeatWrapping;this.textures.push(wallMap);
      for(const b of this.model.blocks){const o=this.objects.get(b);o.material.map=wallMap;o.material.roughness=.83;o.material.needsUpdate=true;}
      for(let i=0;i<14;i++){const a=i*2.4,rock=mesh(new T.DodecahedronGeometry(.5+i%3*.35,0),mat([0x567f8b,0x6c9195,0x8eaaa1][i%3],.93),Math.sin(a)*9.6,-.3,Math.cos(a)*9.6);rock.scale.y=.65;this.add(rock);}
      for(let i=0;i<5;i++){const hill=mesh(new T.ConeGeometry(4+i%2,4+i%3,7),mat([0x75a6b3,0x84b7c0][i%2],1),-23+i*11,1,-27-i%2*4);this.add(hill);}
      this.castlePennants=[];for(const x of [-6.4,6.4]){const pole=cyl(.035,.04,2.1,mat(0xad8a59,.45,.5),x,1.1,1.7,10);this.add(pole);const flag=mesh(new T.PlaneGeometry(.74,.42,6,2),mat(x<0?0xff7792:0x58aaf3),x+.37,1.9,1.7);flag.material.side=T.DoubleSide;this.add(flag);this.castlePennants.push(flag);}
    }
    build_wood(){
      super.build_wood();this.sun.position.set(-5,8,10);this.scene.background.set(0x60736d);this.brush3D=new T.Group();const pad=cyl(.24,.24,.07,mat(0xe5cc93,.8));pad.rotation.x=PI/2;this.brush3D.add(pad);this.brush3D.add(ball(.1,mat(0xe8e0c6,.3),0,0,.05));this.brush3D.visible=false;this.add(this.brush3D);
    }
    build_hole(){
      super.build_hole();if((this.model.level-1)%3===0)this.ocean(0x559fba,-.21,27,20);this.sun.position.set(-9,15,8);this.scene.children[0].intensity=1.45;
    }
    update(dt,state={}){
      const before=this.freeCamera?this.camera.position.clone():null,focus=this.freeCamera?this.focus.clone():null;super.update(dt,state);
      if(before){this.camera.position.copy(before);this.camera.lookAt(focus);}
      for(const water of this.waterEffects||[]){water.uniform.value=this.time;water.texture.offset.x=this.time*.006;water.texture.offset.y=this.time*.003;}
      if(this.id==='blocks')for(const p of this.model.pieces){const b=this.objects.get(p.id);b.position.y=p.id===state.selected?1.18:1.02;}
      if(this.id==='territory')for(const p of this.fleetPool)if(p.visible)p.position.y+=.64;
      if(this.id==='wood'){this.brush3D.visible=!!state.brush?.down&&this.model.phase!=='display';this.brush3D.position.copy(this.cursor.position);this.brush3D.rotation.z=Math.sin(this.time*4)*.12;this.brush3D.scale.setScalar(this.model.phase==='shape'?.55:1.15);}
      for(const f of this.castlePennants||[]){const a=f.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.sin(this.time*3+a.getX(i)*5)*.065*(a.getX(i)+.37));a.needsUpdate=true;f.geometry.computeVertexNormals();}
    }
    fitBoard(){
      const corners=[[-6.1,0,-6.1],[6.1,0,-6.1],[-6.1,0,6.1],[6.1,0,6.1],[0,2.7,0]];
      for(let step=0;step<14;step++){this.camera.updateMatrixWorld(true);let extent=0;for(const p of corners){const v=new T.Vector3(...p).project(this.camera);extent=Math.max(extent,Math.abs(v.x),Math.abs(v.y));}if(extent<.9)break;this.camera.position.sub(this.focus).multiplyScalar(1.035).add(this.focus);this.camera.lookAt(this.focus);}
    }
    setCamera(step){
      this.freeCamera=false;this.viewStep=step;
      if(['wood','hole'].includes(this.id)){super.setCamera(step);return;}
      if(this.id==='castle'){this.focus.set(0,1.8,1);this.camera.position.set([11,0,-11][step],[9.4,11,9.4][step],[17,21,17][step]);}
      else{this.focus.set(0,.4,0);this.camera.position.set([7.3,-7.3,0][step],[14.8,14.8,21][step],[11.8,11.8,.2][step]);}
      this.camera.lookAt(this.focus);if(this.id!=='castle')this.fitBoard();
    }
    rotateCamera(dx,dy){
      this.freeCamera=true;if(this.id==='hole')this.cameraMode=3;
      const delta=this.camera.position.clone().sub(this.focus),s=new T.Spherical().setFromVector3(delta);s.theta-=dx*.007;s.phi=Math.max(this.id==='wood'?.95:.3,Math.min(this.id==='wood'?1.58:1.25,s.phi+dy*.005));if(this.id==='wood')s.theta=Math.max(-.8,Math.min(.8,s.theta));
      this.camera.position.copy(new T.Vector3().setFromSpherical(s).add(this.focus));this.camera.lookAt(this.focus);if(['arrows','blocks','territory'].includes(this.id))this.fitBoard();
    }
  }
  root.YeaArcadeWorldV4=World;
})(window);
