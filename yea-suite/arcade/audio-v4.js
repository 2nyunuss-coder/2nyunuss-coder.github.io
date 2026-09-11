/* Original generative YEA score: synthesized notes and percussion, no recordings. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YeaGameAudio=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const tracks={
    castle:{bpm:92,root:55,voice:'triangle',bright:2300,beat:true,pattern:[0,-1,2,1,-1,3,2,-1,1,-1,0,2,-1,1,3,-1]},
    arrows:{bpm:88,root:60,voice:'sine',bright:1800,beat:false,pattern:[0,-1,1,-1,2,1,-1,3,-1,2,-1,1,0,-1,2,-1]},
    wood:{bpm:74,root:57,voice:'sine',bright:1200,beat:false,pattern:[0,-1,-1,1,-1,2,-1,-1,3,-1,2,-1,-1,1,-1,-1]},
    hole:{bpm:108,root:62,voice:'triangle',bright:2800,beat:true,pattern:[0,1,-1,2,1,-1,3,2,-1,0,1,-1,2,3,-1,1]},
    territory:{bpm:96,root:53,voice:'triangle',bright:1900,beat:true,pattern:[0,-1,0,2,-1,1,-1,3,2,-1,1,-1,0,2,-1,1]},
    blocks:{bpm:112,root:65,voice:'sine',bright:2600,beat:true,pattern:[0,2,-1,1,3,-1,2,1,-1,3,0,-1,1,2,-1,0]}
  };
  const harmony=[[0,4,7,12],[-3,0,4,9],[-7,-3,0,5],[-5,-1,2,7]],hz=midi=>440*Math.pow(2,(midi-69)/12);
  function notesAt(id,step){
    const t=tracks[id]||tracks.wood,chord=harmony[Math.floor(step/16)%4],p=t.pattern[step%16],notes=[];
    if(p>=0)notes.push({kind:'lead',midi:t.root+12+chord[p],duration:.36,gain:.12});
    if(step%8===0)notes.push({kind:'bass',midi:t.root-12+chord[0],duration:.9,gain:.15});
    if(step%16===0)for(const n of chord.slice(0,3))notes.push({kind:'pad',midi:t.root+n,duration:2.3,gain:.028});
    if(t.beat&&step%8===0)notes.push({kind:'kick',duration:.17,gain:.18});
    if(t.beat&&step%8===4)notes.push({kind:'hat',duration:.07,gain:.036});
    if(t.beat&&step%4===2)notes.push({kind:'hat',duration:.025,gain:.015});
    return notes;
  }
  class Player{
    constructor(host=globalThis){this.host=host;this.context=null;this.music=true;this.effects=true;this.volume=.35;this.paused=true;this.quiet=false;this.scene='wood';this.clock=null;this.step=0;this.next=0;this.voices=new Set();this.storageKey='yea_arcade_audio_v4';this.load();}
    load(){try{const p=JSON.parse(this.host.localStorage?.getItem(this.storageKey)||'null');if(p){this.music=p.music!==false;this.effects=p.effects!==false;this.volume=Math.min(.7,Math.max(0,Number.isFinite(p.volume)?p.volume:.35));}}catch{}}
    save(){try{this.host.localStorage?.setItem(this.storageKey,JSON.stringify({music:this.music,effects:this.effects,volume:this.volume}));}catch{}}
    async unlock(){
      try{
        if(!this.context){const C=this.host.AudioContext||this.host.webkitAudioContext;if(!C)return false;const c=this.context=new C();this.master=c.createGain();this.master.gain.value=this.volume;this.master.connect(c.destination);
          this.musicBus=c.createGain();this.musicBus.gain.value=.6;this.musicBus.connect(this.master);this.effectBus=c.createGain();this.effectBus.gain.value=.75;this.effectBus.connect(this.master);
          this.delay=c.createDelay(.6);this.delay.delayTime.value=.24;this.echo=c.createGain();this.echo.gain.value=.16;this.musicBus.connect(this.delay);this.delay.connect(this.echo);this.echo.connect(this.master);
          const data=c.createBuffer(1,Math.floor(c.sampleRate*.2),c.sampleRate),a=data.getChannelData(0);let seed=127;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=(seed/2147483648-1)*.6;}this.noise=data;
        }
        if(this.context.state!=='running')await this.context.resume();
        if(this.host.document?.hidden||this.quiet)return false;this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04);if(!this.paused)this.startClock();return this.context.state==='running';
      }catch{return false;}
    }
    play(scene){if(this.scene!==scene){this.stopClock();this.step=0;}this.scene=tracks[scene]?scene:'wood';this.paused=false;this.quiet=false;if(this.context?.state==='running'){this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04);this.startClock();}}
    pause(quiet=false){this.paused=true;this.quiet=quiet;this.stopClock();if(quiet&&this.context){this.master.gain.setTargetAtTime(0,this.context.currentTime,.015);for(const v of this.voices)try{v.source.stop();}catch{}}}
    setMusic(on){this.music=!!on;this.save();if(!this.music)this.stopClock();else if(!this.paused)this.startClock();}
    setEffects(on){this.effects=!!on;this.save();}
    setVolume(value){this.volume=Math.min(.7,Math.max(0,Number(value)||0));this.save();if(this.context&&!this.quiet)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.03);}
    startClock(){if(this.clock!==null||!this.music||this.paused||this.context?.state!=='running')return;this.next=this.context.currentTime+.045;this.schedule();this.clock=this.host.setInterval(()=>this.schedule(),40);}
    stopClock(){if(this.clock!==null)this.host.clearInterval(this.clock);this.clock=null;for(const v of this.voices)if(v.music)try{v.source.stop();}catch{}}
    schedule(){
      if(!this.music||this.paused||this.context?.state!=='running')return;const c=this.context,t=tracks[this.scene];
      if(this.next<c.currentTime-.15)this.next=c.currentTime+.03;
      let budget=6;while(this.next<c.currentTime+.13&&budget--){for(const n of notesAt(this.scene,this.step))this.note(n,this.next,t,true);this.step=(this.step+1)%64;this.next+=60/t.bpm/4;}
    }
    note(n,at,track,music){
      const c=this.context;if(!c||this.voices.size>64)return;const gain=c.createGain(),filter=c.createBiquadFilter();filter.type=n.kind==='hat'?'highpass':'lowpass';filter.frequency.value=n.kind==='hat'?5700:track.bright;filter.Q.value=.5;
      let source;if(n.kind==='hat'){source=c.createBufferSource();source.buffer=this.noise;}else{source=c.createOscillator();source.type=n.kind==='pad'||n.kind==='bass'||n.kind==='kick'?'sine':track.voice;source.frequency.setValueAtTime(n.kind==='kick'?145:hz(n.midi),at);if(n.kind==='kick')source.frequency.exponentialRampToValueAtTime(48,at+.12);}
      source.connect(filter);filter.connect(gain);gain.connect(music?this.musicBus:this.effectBus);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(n.gain,at+(n.kind==='pad'?.25:.008));gain.gain.exponentialRampToValueAtTime(.0001,at+n.duration);
      const voice={source,music};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+n.duration+.025);
    }
    effect(kind='tap'){
      if(!this.effects||this.quiet||this.context?.state!=='running')return;const at=this.context.currentTime,t={voice:'sine',bright:3000};
      if(kind==='win'){[0,4,7,12].forEach((n,i)=>this.note({kind:'lead',midi:72+n,duration:.32,gain:.11},at+i*.09,t,false));}
      else if(kind==='fire')this.note({kind:'kick',duration:.18,gain:.2},at,t,false);
      else this.note({kind:'lead',midi:kind==='collect'?84:76,duration:.13,gain:.08},at,t,false);
    }
    dispose(){this.pause(true);for(const v of this.voices)try{v.source.stop();}catch{}this.context?.close();this.context=null;}
  }
  return {Player,tracks,notesAt};
});
