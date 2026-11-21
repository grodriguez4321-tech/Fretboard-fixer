// YIN's cumulative normalized difference, evaluated on a downsampled mono frame.
function estimateGuitarHz(samples, sampleRate) {
  const stride=Math.max(1,Math.floor(sampleRate/12000)), rate=sampleRate/stride;
  const data=new Float32Array(Math.floor(samples.length/stride));
  let energy=0;
  for(let i=0;i<data.length;i++){
    let sum=0;for(let j=0;j<stride;j++)sum+=samples[i*stride+j];
    data[i]=sum/stride;energy+=data[i]*data[i];
  }
  if(energy/data.length<.000025)return null;
  const maxLag=Math.ceil(rate/73), minLag=Math.floor(rate/1490);
  const n=Math.min(512,data.length-maxLag);
  if(n<170)return null;
  const diff=new Float32Array(maxLag+1);let total=0;
  for(let lag=1;lag<=maxLag;lag++){
    let d=0;for(let i=0;i<n;i++){const delta=data[i]-data[i+lag];d+=delta*delta}
    total+=d;diff[lag]=total ? d*lag/total : 1;
    const k=lag-1;
    if(k>=minLag && diff[k]<.13 && diff[lag]>=diff[k] && diff[k-1]>diff[k]){
      const a=diff[k-1],b=diff[k],c=diff[lag];
      const offset=(a-c)/(2*(a-2*b+c));
      return rate/(k+offset);
    }
  }
  return null;
}

lab.add('mic','Acoustic note check','Play one note into your microphone. Match the pitch to advance.',()=>{
  const view=toolVisual.panel('mic');toolVisual.meter(view);
  const readout=element('p','Microphone off','lab-metric'), target=element('p');
  const msg=lab.status(), follow=lab.select('Mode',[
    ['wait','Wait for the right note'],['listen','Pitch display only']
  ],'wait');
  let stream,source,analyser,frame,pending=false,request=0,matched=null,stable=null,frames=0,quiet=0,lastFrame=0,done=false;
  const single=()=>{
    const e=sequence[cursor];
    return e.positions.length===1 && !e.continuation && !['Half-step bend','Slide'].includes(e.action);
  };
  function renderTarget(){
    if(follow.input.value==='listen'){target.textContent='Play one string at a time.';return}
    const e=sequence[cursor];
    if(done){target.textContent='Phrase complete.';return}
    target.textContent=single() ? 'Target · '+describe(e).join(' · ') : 'Manual step · '+e.action+' — use Skip.';
  }
  function advance(){
    if(cursor+1>=sequence.length){done=true;msg.textContent='You reached the end. Restart to try again.'}
    else seek(cursor+1);
    renderTarget();
  }
  function stopInput(){
    request++;pending=false;cancelAnimationFrame(frame);
    if(stream)for(const t of stream.getTracks())t.stop();
    source?.disconnect();analyser?.disconnect();stream=null;source=null;analyser=null;
    toolVisual.meter(view);toggle.textContent='Start microphone';readout.textContent='Microphone off';
    frames=quiet=0;matched=stable=null;
  }
  const toggle=lab.button('Start microphone',async()=>{
    if(stream || pending){stopInput();return}
    if(!navigator.mediaDevices?.getUserMedia){msg.textContent='Microphone access is unavailable in this browser.';return}
    const id=++request;pending=true;toggle.textContent='Cancel microphone';
    try{
      if(!await lab.audioReady(msg)){if(request===id)stopInput();return}
      if(id!==request)return;
      const input=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(id!==request){input.getTracks().forEach(t=>t.stop());return}
      stream=input;pending=false;
      source=audio.createMediaStreamSource(stream);analyser=audio.createAnalyser();analyser.fftSize=4096;
      source.connect(analyser);
      stream.getAudioTracks()[0]?.addEventListener('ended',()=>{if(stream===input){stopInput();msg.textContent='Microphone disconnected.'}});
      toggle.textContent='Stop microphone';msg.textContent='Pluck once. Mute briefly between repeated notes.';
      const data=new Float32Array(analyser.fftSize);
      function listen(now){
        if(id!==request)return;
        frame=requestAnimationFrame(listen);
        if(now-lastFrame<50)return;lastFrame=now;
        analyser.getFloatTimeDomainData(data);
        const hz=estimateGuitarHz(data,audio.sampleRate);
        if(!hz){
          stable=null;frames=0;if(++quiet===2){toolVisual.meter(view);matched=null;readout.textContent='Listening…'}return;
        }
        quiet=0;
        const raw=69+12*Math.log2(hz/440),midi=Math.round(raw),cents=Math.round(100*(raw-midi));
        if(midi!==stable){stable=midi;frames=0}
        if(++frames<2)return;
        toolVisual.meter(view,cents,midiName(midi));
        readout.textContent=midiName(midi)+' · '+(cents>0?'+':'')+cents+' cents';
        if(done || follow.input.value!=='wait' || !single())return;
        const pos=sequence[cursor].positions[0], wanted=tuning[pos.string-1]+pos.fret;
        if(midi!==wanted){matched=null;msg.textContent='Heard '+midiName(midi)+'. Aim for '+midiName(wanted)+'.';return}
        if(Math.abs(cents)<=35 && matched!==midi){
          matched=midi;msg.textContent='Matched '+midiName(midi)+'.';advance();
        }
      }
      frame=requestAnimationFrame(listen);
    }catch(err){
      if(id!==request)return;
      stopInput();msg.textContent=err.name==='NotAllowedError' ? 'Microphone permission was declined. You can enable it in your browser’s site settings.' : 'Could not open the microphone. Check the selected input and try again.';
    }
  },'primary');
  const skip=lab.button('Skip',()=>{if(!done){advance();matched=null}});
  const restart=lab.button('Restart phrase',()=>{seek(0);done=false;matched=stable=null;frames=0;renderTarget()});
  follow.input.onchange=renderTarget;renderTarget();
  lab.body.append(view.surface,element('p','The microphone checks pitch and octave. Audio stays on this device. Use the tab for the intended string and fingering.'),follow.box,target,readout,lab.row(toggle,skip,restart),msg);
  lab.onStop(stopInput);
});

lab.add('fingers','Alternate fingerings','Find the same pitch elsewhere or compare ways to fret two notes together.',()=>{
  const e=sequence[cursor], first=e.positions[0] || {string:1,fret:5};
  const second=e.positions[1] || sequence[cursor+1]?.positions[0] || {string:2,fret:3};
  let pair=false,slot=0;
  const picked=[first,second],out=element('div',null,'position-results');
  const positionsRow=lab.row(),one=lab.button('One note',()=>setMode(false)),two=lab.button('Two notes',()=>setMode(true));
  const slots=[0,1].map(i=>lab.button('',()=>{slot=i;refresh(picked[i].fret)}));
  positionsRow.append(...slots);
  const board=fretPicker(p=>{
    picked[slot]=p;silence();audition(note(p.string,p.fret,null));
    if(pair && slot===0)slot=1;
    refresh();
  });
  const view=toolVisual.panel('fingers');
  function setMode(on){pair=on;slot=on?1:0;refresh(picked[slot].fret)}
  function option(positions,text,selected){
    const b=lab.button(text,()=>{
      out.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===b)));
      toolVisual.neck(view,positions);silence();audition({positions,beats:1,action:'Pick'});
    });
    b.setAttribute('aria-pressed',String(selected));out.append(b);
    if(selected)toolVisual.neck(view,positions);
  }
  function refresh(showFret){
    one.setAttribute('aria-pressed',String(!pair));two.setAttribute('aria-pressed',String(pair));
    positionsRow.hidden=!pair;
    for(const [i,b] of slots.entries()){
      b.textContent='Note '+(i+1)+' · '+locationName(picked[i]);
      b.setAttribute('aria-pressed',String(slot===i));
    }
    out.replaceChildren();
    const targets=picked.map(p=>tuning[p.string-1]+p.fret);
    board.update(picked.slice(0,pair?2:1),null,showFret,pair?[]:pitchPositions(targets[0]));
    out.append(element('h3',pair ? targets.map(midiName).join(' + ') : midiName(targets[0])));
    if(!pair){
      for(const p of pitchPositions(targets[0]))option([p],locationName(p),p.string===picked[0].string);
      return;
    }
    const options=[];
    for(const p of pitchPositions(targets[0]))for(const q of pitchPositions(targets[1])){
      if(p.string===q.string || (targets[0]===targets[1] && p.string>q.string))continue;
      const fretted=[p.fret,q.fret].filter(f=>f>0);
      const span=fretted.length===2 ? Math.abs(p.fret-q.fret) : 0;
      options.push({p,q,span,high:Math.max(0,...fretted)});
    }
    options.sort((x,y)=>x.span-y.span || x.high-y.high);
    if(!options.length)toolVisual.neck(view,[]);
    if(!options.length)out.append(element('p','These pitches cannot sound simultaneously on separate strings within frets 0–24.'));
    for(const [i,{p,q,span}] of options.slice(0,5).entries())option([p,q],locationName(p)+' + '+locationName(q)+' · span '+span,i===0);
  }
  lab.body.append(lab.row(one,two),positionsRow,element('p','Tap where you play. Outlined notes show other places to play the same pitch in one-note mode.'),board.root,out,view.surface);
  refresh(first.fret);
});
