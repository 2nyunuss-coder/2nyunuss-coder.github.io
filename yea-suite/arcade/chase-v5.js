/* Original third-person follow rig. No dependency on a rendering engine. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YeaChase=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
  class Rig{
    constructor(){this.yaw=0;this.heading=0;this.mode=0;this.position={x:0,y:3.5,z:5.4};this.look={x:0,y:.1,z:-1.25};this.initialized=false;this.inputBasis=null;this.pitchOffset=0;}
    beginInput(){this.inputBasis=this.yaw;}
    endInput(){this.inputBasis=null;}
    move(x,y){
      const yaw=this.inputBasis??this.yaw,length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
      // Hold the gesture's reference frame: a sustained stick direction stays straight
      // even as the camera moves behind the player, instead of producing circles.
      return {x:Math.cos(yaw)*x-Math.sin(yaw)*y,y:Math.sin(yaw)*x+Math.cos(yaw)*y};
    }
    update(hole,dt,snap=false){
      dt=clamp(Number(dt)||0,0,.05);const speed=Math.hypot(hole.vx,hole.vy),r=hole.r/40,x=(hole.x-260)/40,z=(hole.y-260)/40;
      if(speed>18)this.heading=Math.atan2(hole.vx,-hole.vy);
      this.yaw=angle(this.yaw+angle(this.heading-this.yaw)*(1-Math.exp(-dt*3.4)));
      const forward={x:Math.sin(this.yaw),z:-Math.cos(this.yaw)},distance=[4.8,3.7,6.6][this.mode]+r*1.65,height=[2.75,2.1,4.1][this.mode]+r*.78+this.pitchOffset;
      const desired={x:x-forward.x*distance,y:height,z:z-forward.z*distance},look={x:x+forward.x*(2+r*.9),y:.08,z:z+forward.z*(2+r*.9)},blend=snap||!this.initialized?1:1-Math.exp(-dt*8);
      for(const k of ['x','y','z']){this.position[k]+=(desired[k]-this.position[k])*blend;this.look[k]+=(look[k]-this.look[k])*blend;}
      this.initialized=true;return this;
    }
    setMode(mode){this.mode=clamp(Math.round(mode),0,2);}
    hint(item,hole){if(!item)return 'Meydan tamamlanıyor';const a=angle(Math.atan2(item.x-hole.x,-(item.y-hole.y))-this.yaw),direction=Math.abs(a)<.55?'önünde':Math.abs(a)>2.35?'arkanda':a>0?'sağında':'solunda';return item.kind+' · '+direction;}
  }
  return {Rig,angle};
});
