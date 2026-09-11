/* Original close-up workshop and behind-the-hole collection experience. */
(function(root){
  'use strict';
  const T=root.THREE,PI=Math.PI;
  const mat=(color,roughness=.6,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  function mesh(geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;}
  function texture(w,h,pixel,color=true){const a=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const rgb=pixel(x,y),i=(y*w+x)*4;a[i]=rgb[0];a[i+1]=rgb[1];a[i+2]=rgb[2];a[i+3]=255;}const t=new T.DataTexture(a,w,h);t.magFilter=T.LinearFilter;t.minFilter=T.LinearFilter;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;return t;}
  class World extends root.YeaArcadeWorldV4{
    constructor(renderer,id,model,preview=false){
      super(renderer,id,model,preview);
      if(id==='hole'){this.rig=new root.YeaChase.Rig();this.camera.fov=59;this.cameraMode=3;this.freeCamera=false;this.rig.update(model.hole,0,true);this.applyChase();}
      if(id==='wood'){this.camera.fov=44;this.setCamera(0);}
      this.camera.updateProjectionMatrix();
    }
    build_hole(){
      super.build_hole();this.camera.near=.06;
      const sky=texture(256,128,(x,y)=>{const v=y/127,horizon=Math.exp(-(((v-.52)*8)**2)),cloud=Math.max(0,Math.sin(x*.08+Math.sin(y*.13)*3)*Math.sin(y*.22+x*.04))**7*(v>.48?0:1);return[99+80*horizon+cloud*26,170+42*horizon+cloud*14,210+22*horizon+cloud*13];});sky.mapping=T.EquirectangularReflectionMapping;this.scene.background=sky;this.textures.push(sky);this.scene.fog=new T.Fog(0xb3dce5,20,52);
      this.occluders=[];const props=new Set(this.objects.values());
      for(const [o,g] of this.objects){g.children[0].geometry.computeBoundingBox();g.userData.height=g.children[0].geometry.boundingBox.max.y;g.children[0].material.transparent=true;g.children[0].material.needsUpdate=true;this.occluders.push({object:g,item:o});}
      this.backdrop=this.scene.children.find(g=>g.isGroup&&!props.has(g)&&g.children.length===1&&g.children[0].isMesh&&g.children[0].geometry.attributes.color);
      if(this.backdrop){this.backdrop.children[0].material.transparent=true;this.backdrop.children[0].material.needsUpdate=true;}
      const floor=this.scene.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.material.onBeforeCompile.toString().includes('holeDistance'));
      if(floor){const pavement=texture(256,256,(x,y)=>{const seam=x%64<2||y%32<2,n=Math.sin(x*27+y*89)*2.2,t=seam?.77:1;return[228*t+n,218*t+n,195*t+n];});pavement.wrapS=pavement.wrapT=T.RepeatWrapping;pavement.repeat.set(5,5);floor.material.map=pavement;floor.material.roughness=.92;this.textures.push(pavement);}
      // Landmarks around the playable plaza give the low camera an actual horizon.
      for(let i=0;i<9;i++){const a=i*2.4,r=22+i%3*4,h=2.3+i%3*.65,m=mesh(new T.ConeGeometry(4.5,h,7),mat([0x91b8bb,0x9abfc0,0x85abae][i%3],1),Math.sin(a)*r,h/2-.4,Math.cos(a)*r);m.scale.x=1.4;this.add(m);}
      this.beacon=new T.Group();const ring=mesh(new T.TorusGeometry(.35,.026,8,48),new T.MeshBasicMaterial({color:0xffeb9a}));ring.rotation.x=-PI/2;this.beacon.add(ring);this.beaconRing=ring;const marker=mesh(new T.ConeGeometry(.095,.18,3),new T.MeshBasicMaterial({color:0xffedb3}),0,.55,0);marker.rotation.z=PI;this.beacon.add(marker);this.beaconMarker=marker;this.add(this.beacon);this.nearest=null;
      const chevron=new T.Shape();chevron.moveTo(-.11,.08);chevron.lineTo(0,-.09);chevron.lineTo(.11,.08);chevron.lineTo(0,.025);chevron.closePath();this.headingMark=mesh(new T.ShapeGeometry(chevron),new T.MeshBasicMaterial({color:0xcbfff2,side:T.DoubleSide}));this.headingMark.rotation.x=-PI/2;this.add(this.headingMark);
      this.rim.material.color.set(0x68f0d0);this.rim.material.roughness=.16;
    }
    build_wood(){
      super.build_wood();this.sun.position.set(-5,9,8);this.sun.intensity=2.7;this.scene.children[0].intensity=1.05;
      this.woodMat.envMapIntensity=1.1;this.woodMat.clearcoatRoughness=.12;
      this.surfaceMap=texture(2,this.model.rows,()=>[210,210,210],false);this.coatMap=texture(2,this.model.rows,()=>[0,0,0],false);this.textures.push(this.surfaceMap,this.coatMap);this.woodMat.roughnessMap=this.surfaceMap;this.woodMat.clearcoatMap=this.coatMap;this.woodMat.needsUpdate=true;this.lastLocalSurface=-1;
      this.workshopFacing=new T.Vector3(0,0,1);this.workshopRight=new T.Vector3(1,0,0);this.workshopPlane=new T.Plane();
      this.targetBands=new T.Group();this.add(this.targetBands);
      for(let i=6;i<this.model.rows-6;i+=10){const ring=mesh(new T.TorusGeometry(this.model.target[i]/44+.016,.013,6,64),new T.MeshBasicMaterial({color:0x9ef3ca,transparent:true,opacity:.6}));ring.rotation.x=-PI/2;ring.position.y=3.8-i/(this.model.rows-1)*7.6;this.targetBands.add(ring);}
      this.surfaceSweep=mesh(new T.TorusGeometry(1,.02,6,80),new T.MeshBasicMaterial({color:0xffe5a8,transparent:true,opacity:.65}));this.surfaceSweep.rotation.x=-PI/2;this.add(this.surfaceSweep);
      this.toolMarker=new T.Group();const sponge=mesh(new T.SphereGeometry(.26,20,12),mat(0xe5c99a,.9));sponge.scale.set(.8,.62,.3);this.toolMarker.add(sponge);const handle=mesh(new T.CapsuleGeometry(.05,.4,4,10),mat(0xeadac0,.4),.23,-.2,.08);handle.rotation.z=-.65;this.toolMarker.add(handle);this.add(this.toolMarker);
      this.guide.children.forEach(line=>{line.material.depthTest=true;line.material.opacity=.18;});
      this.chipDirections=Array.from({length:64},()=>new T.Vector3(1,0,0));
    }
    setCamera(step){
      if(this.id==='hole'&&this.rig){this.freeCamera=false;this.cameraMode=3;this.rig.setMode(step);this.rig.update(this.model.hole,.016);this.applyChase();return;}
      if(this.id==='wood'){this.freeCamera=false;this.viewStep=step;this.focus.set(0,-.15,0);this.camera.position.set([5.2,-4.6,6.4][step],[2.45,2.3,3.7][step],[12.3,12.3,14.2][step]);this.camera.lookAt(this.focus);return;}
      super.setCamera(step);
    }
    returnToPlay(){if(this.id==='hole'){this.freeCamera=false;this.cameraMode=3;}if(this.id==='wood')this.setCamera(this.viewStep||0);}
    beginSteering(){this.rig?.beginInput();}
    endSteering(){this.rig?.endInput();}
    steer(x,y){return this.rig?this.rig.move(x,y):{x,y};}
    applyChase(){if(!this.rig)return;const p=this.rig.position,q=this.rig.look;this.camera.position.set(p.x,p.y,p.z);this.focus.set(q.x,q.y,q.z);this.camera.lookAt(this.focus);}
    targetHint(){return this.rig?.hint(this.nearest,this.model.hole)||'';}
    coordinates(x,y){const p=super.coordinates(x,y);if(this.id==='hole'){const hit=this.raycaster.ray.intersectPlane(this.boardPlane,new T.Vector3());p.validGround=!!hit&&hit.distanceTo(this.camera.position)<50;}return p;}
    brushCoordinates(clientX,clientY){
      const r=this.renderer.domElement.getBoundingClientRect(),yaw=Math.atan2(this.camera.position.x,this.camera.position.z);this.workshopFacing.set(Math.sin(yaw),0,Math.cos(yaw));this.workshopRight.set(Math.cos(yaw),0,-Math.sin(yaw));this.workshopPlane.set(this.workshopFacing,0);this.raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),this.camera);
      if(this.model.phase!=='shape'){
        this.wood.updateMatrixWorld(true);const hit=this.raycaster.intersectObject(this.wood,false)[0];
        if(!hit)return{x:394,y:260,down:false};
        const p=hit.point,radial=p.dot(this.workshopRight);return{x:260+Math.hypot(p.x,p.z)*44,y:55+(3.8-p.y)/7.6*410,side:radial<0?-1:1,point:p.clone(),down:true};
      }
      const p=new T.Vector3();if(!this.raycaster.ray.intersectPlane(this.workshopPlane,p))return null;const radial=p.dot(this.workshopRight);return{x:260+Math.abs(radial)*44,y:55+(3.8-p.y)/7.6*410,side:radial<0?-1:1,down:true};
    }
    updateWood(dt,state){
      super.updateWood(dt,state);const m=this.model,b=state.brush||{x:394,y:260},row=Math.max(0,Math.min(m.rows-1,Math.round((b.y-55)/410*(m.rows-1)))),radius=m.profile[row]/44;
      const yaw=Math.atan2(this.camera.position.x,this.camera.position.z),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),front=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw)),x=Math.min(Math.abs(b.x-260)/44,radius),depth=Math.sqrt(Math.max(.001,radius*radius-x*x));
      this.cursor.position.copy(right.multiplyScalar(x*(b.side||1))).add(front.multiplyScalar(depth+.045));this.cursor.position.y=3.8-row/(m.rows-1)*7.6;
      if(b.point&&m.phase!=='shape')this.cursor.position.copy(b.point).addScaledVector(this.workshopFacing,.035);
      this.guide.visible=false;this.targetBands.visible=m.phase==='shape';this.surfaceSweep.visible=!!b.down&&m.phase!=='display';this.surfaceSweep.position.set(0,this.cursor.position.y,0);this.surfaceSweep.scale.setScalar(radius+.025);
      this.toolMarker.visible=!!b.down&&m.phase!=='display';this.toolMarker.position.copy(this.cursor.position);this.toolMarker.rotation.y=yaw;this.toolMarker.scale.setScalar(m.phase==='shape'?.55:1.1);
      const transform=this.chipTransform;
      for(let i=0;i<64;i++){const a=this.chipAges[i];if(a<=dt+.00001){this.chipOrigins[i].copy(this.cursor.position);this.chipDirections[i].set(Math.cos(yaw)*(b.side||1),0,-Math.sin(yaw)*(b.side||1));}transform.position.copy(this.chipOrigins[i]).addScaledVector(this.chipDirections[i],a*(.7+i%5*.25));transform.position.y+=a*.7-a*a*4;transform.position.z+=Math.sin(i*7)*a*.45;transform.rotation.set(a*7,i,a*9);transform.scale.setScalar(a<1.05?Math.max(.1,1-a*.6):0);transform.updateMatrix();this.chips.setMatrixAt(i,transform.matrix);}this.chips.instanceMatrix.needsUpdate=true;
      if(this.lastLocalSurface!==m.surfaceRevision){
        const a=this.surfaceMap.image.data,c=this.coatMap.image.data;
        for(let y=0;y<m.rows;y++){const row=m.rows-1-y,rough=Math.round((.88-m.sanded[row]*.34-m.coated[row]*.36)*255),coat=Math.round(m.coated[row]*255);for(let x=0;x<2;x++){const k=(y*2+x)*4;a[k]=a[k+1]=a[k+2]=rough;c[k]=c[k+1]=c[k+2]=coat;}}
        this.surfaceMap.needsUpdate=this.coatMap.needsUpdate=true;this.lastLocalSurface=m.surfaceRevision;
      }
      this.woodMat.roughness=1;this.woodMat.clearcoat=1;this.woodMat.clearcoatRoughness=.12;
      if(m.phase==='display'&&!this.freeCamera){this.camera.position.lerp(new T.Vector3(5.7,3.2,12.4),1-Math.exp(-dt*2));this.camera.lookAt(0,-.1,0);}
    }
    update(dt,state={}){
      super.update(dt,state);
      if(this.id==='wood'){this.brush3D.visible=false;this.cursor.visible=false;return;}
      if(this.id!=='hole')return;
      const m=this.model,h=m.hole;if(!this.freeCamera){this.rig.update(h,dt);this.applyChase();}
      const hx=(h.x-260)/40,hz=(h.y-260)/40,dx=hx-this.camera.position.x,dz=hz-this.camera.position.z,len=dx*dx+dz*dz,blend=1-Math.exp(-dt*10);
      for(const {object:g,item:o} of this.occluders){const mat=g.children[0].material,t=Math.max(0,Math.min(1,((g.position.x-this.camera.position.x)*dx+(g.position.z-this.camera.position.z)*dz)/(len||1))),x=this.camera.position.x+t*dx,z=this.camera.position.z+t*dz,y=this.camera.position.y*(1-t)+.1*t,occludes=!o.taken&&t>.05&&t<.91&&Math.hypot(g.position.x-x,g.position.z-z)<o.r/40+.17&&g.userData.height+g.position.y>y-.1;const goal=occludes?.2:1;mat.opacity+=(goal-mat.opacity)*blend;mat.depthWrite=mat.opacity>.95;}
      if(this.backdrop){const mat=this.backdrop.children[0].material,outside=Math.max(Math.abs(this.camera.position.x),Math.abs(this.camera.position.z))>8.7;mat.opacity+=((outside?.28:1)-mat.opacity)*blend;mat.depthWrite=mat.opacity>.95;}
      this.nearest=m.items.filter(o=>o.phase==='ground'&&m.canTake(o)).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0]||null;
      this.beacon.visible=!!this.nearest;if(this.nearest){const o=this.nearest;this.beacon.position.set((o.x-260)/40,.035,(o.y-260)/40);this.beaconRing.scale.setScalar((o.r/40+.12)/.35);this.beaconMarker.position.y=o.r/40*2.2+.3+Math.sin(this.time*3)*.045;}
      this.headingMark.position.set(hx+Math.sin(this.rig.heading)*(h.r/40+.18),.026,hz-Math.cos(this.rig.heading)*(h.r/40+.18));this.headingMark.rotation.z=PI-this.rig.heading;
    }
  }
  root.YeaImmersiveWorld=World;
})(window);
