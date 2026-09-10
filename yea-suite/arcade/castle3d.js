/* Original castle game. Cannon.js provides rigid-body contacts and gravity. */
(function(root,factory){
  if(typeof module==='object'&&module.exports){let cannon;try{cannon=require('cannon');}catch{cannon=require('./vendor/cannon.min.js');}module.exports=factory(cannon);}
  else root.YeaCastle3D=factory(root.CANNON);
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
  'use strict';
  class Castle3D{
    constructor(level){
      this.level=level;this.status='playing';this.shots=9+Math.floor(level/5);this.hits=0;this.clock=0;this.cooldown=0;this.fired=false;this.blocks=[];this.balls=[];this.effects=[];this.target={x:0,y:2,z:1};this.origin=new C.Vec3(0,1.25,10.5);
      this.world=new C.World();this.world.gravity.set(0,-9.82,0);this.world.broadphase=new C.NaiveBroadphase();this.world.solver.iterations=12;this.world.allowSleep=true;
      const stone=new C.Material('stone'),ground=new C.Material('ground');
      this.world.addContactMaterial(new C.ContactMaterial(stone,stone,{friction:.42,restitution:.03}));
      this.world.addContactMaterial(new C.ContactMaterial(stone,ground,{friction:.5,restitution:.08}));
      const floor=new C.Body({mass:0,material:ground});floor.addShape(new C.Plane());floor.quaternion.setFromEuler(-Math.PI/2,0,0);this.world.addBody(floor);
      this.stone=stone;const rows=3+(level-1)%3;
      const add=(x,y,z,w=.94,h=.67,d=.94,tower=0)=>{const body=new C.Body({mass:1.6,material:stone,position:new C.Vec3(x,y,z),linearDamping:.12,angularDamping:.18,sleepSpeedLimit:.12,sleepTimeLimit:.6});body.addShape(new C.Box(new C.Vec3(w/2,h/2,d/2)));this.world.addBody(body);this.blocks.push({body,origin:body.position.clone(),w,h,d,tower,hit:false});};
      for(const [tx,tz,ti] of [[-2.2,-1.7,0],[2.2,-1.7,1],[-2.2,1.7,2],[2.2,1.7,3]]){
        for(let r=0;r<rows;r++)for(let x=0;x<2;x++)for(let z=0;z<2;z++)add(tx+(x-.5)*.96,.345+r*.69,tz+(z-.5)*.96,.94,.67,.94,ti);
        for(const [x,z] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]])add(tx+x*.96,.345+rows*.69,tz+z*.96,.56,.54,.56,ti);
      }
      for(let r=0;r<rows-1;r++)for(let x=-1;x<=1;x++)add(x*.82,.345+r*.69,-1.7,.8,.67,.7,4);
      for(const tx of [-2.2,2.2])for(let r=0;r<rows-1;r++)for(let z=-1;z<=1;z++)add(tx,.345+r*.69,z*.66,.7,.67,.64,4);
      this.total=this.blocks.length;this.goal=Math.ceil(this.total*.8);
      for(let i=0;i<60;i++)this.world.step(1/120);
      this.blocks.forEach(b=>b.origin.copy(b.body.position));
    }
    fire(target=this.target){
      if(this.status!=='playing'||this.shots<=0||this.cooldown>0)return false;
      this.target={x:Math.max(-4,Math.min(4,target.x)),y:Math.max(.35,Math.min(5,target.y)),z:Math.max(-3,Math.min(3,target.z))};
      const p=this.origin,dx=this.target.x-p.x,dz=this.target.z-p.z,speed=24,flight=Math.hypot(dx,dz)/speed;
      const body=new C.Body({mass:10,material:this.stone,position:p.clone(),linearDamping:.005});body.addShape(new C.Sphere(.38));body.velocity.set(dx/flight,(this.target.y-p.y+.5*9.82*flight*flight)/flight,dz/flight);
      const ball={body,age:0,burst:false};
      body.addEventListener('collide',e=>{if(ball.burst||!this.blocks.some(b=>b.body===e.body))return;ball.burst=true;const at=body.position.clone();this.effects.push({x:at.x,y:at.y,z:at.z,life:1});for(const b of this.blocks){const v=b.body.position.vsub(at),distance=v.length();if(distance<3.3){v.normalize();const strength=(3.3-distance)*7;b.body.wakeUp();b.body.applyImpulse(new C.Vec3(v.x*strength,Math.max(2.8,v.y*strength+3),v.z*strength-1),b.body.position);}}});
      this.world.addBody(body);this.balls.push(ball);this.shots--;this.cooldown=1.7;this.fired=true;return true;
    }
    update(dt){
      if(this.status!=='playing')return;dt=Math.min(.04,Math.max(0,dt));this.clock+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.world.step(1/120,dt,6);
      for(const b of this.balls)b.age+=dt;
      this.balls=this.balls.filter(b=>{if(b.age<7)return true;this.world.removeBody(b.body);return false;});
      this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
      if(this.fired){for(const b of this.blocks){if(b.body.position.distanceTo(b.origin)>.62||Math.abs(b.body.quaternion.w)<.8)b.hit=true;}this.hits=this.blocks.filter(b=>b.hit).length;}
      if(this.hits>=this.goal&&this.cooldown<.7)this.status='won';
      else if(this.shots===0&&this.cooldown===0&&this.balls.every(b=>b.age>4.2))this.status='lost';
    }
    score(){return this.hits*25+this.shots*200;}
  }
  return Castle3D;
});
