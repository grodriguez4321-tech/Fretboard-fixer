// A single active audio tool owns its timers, voices, and input stream.
const lab = (() => {
  const tools=new Map(), body=$('labBody'), dialog=$('labDialog');
  let cleanup=()=>{}, version=0, current='';
  function stop(){
    version++;cleanup();cleanup=()=>{};haltPlayback();
  }
  const featured=id=>id==='fingers' || id==='sections';
  function tile(id,name,summary){
    const b=button(name,()=>open(id)),view=toolVisual.panel(id);
    const sample=[{string:2,fret:3},{string:3,fret:4}];
    switch(id){
      case 'mic':toolVisual.meter(view,-9,'A2');break;
      case 'fingers':toolVisual.neckTile(view,sample);break;
      case 'rhythm':toolVisual.rhythm(view,[0,1,1.5,2,3],2,[.03,1.05,1.46]);break;
      case 'earMelody':toolVisual.melody(view,4,[...sample,...sample],2);break;
      case 'harmony':toolVisual.neckTile(view,shapes.Am.map(([string,fret])=>({string,fret})));break;
      case 'sections':toolVisual.sections(view,Array.from({length:12},(_,i)=>({sourceIndex:i,bar:Math.floor(i/4),beats:1})),4,7,[{first:0,last:3}]);break;
    }
    view.surface.setAttribute('aria-hidden','true');
    b.prepend(view.surface);b.append(element('small',summary));return b;
  }
  function open(id=''){
    stop();haltPlayback();stopMetro();pauseTimer();document.dispatchEvent(new Event('learningtoolopen'));
    current=id;body.replaceChildren();
    const tool=tools.get(id);
    $('labTitle').textContent=tool ? tool.name : 'Learning tools';
    $('labBack').hidden=!tool;
    if(!dialog.open) dialog.showModal();
    if(tool) tool.render();
    else {
      const menu=element('div',null,'tool-menu');
      const extra=element('details',null,'more-tools'), other=element('div',null,'tool-menu');
      extra.append(element('summary','More tools'),other);
      for(const [key,t] of tools)(featured(key)?menu:other).append(tile(key,t.name,t.summary));
      body.append(menu,extra);
    }
  }
  function button(label,fn,cls){const b=element('button',label,cls);b.onclick=fn;return b}
  function select(label,choices,value){
    const box=element('label',label), input=element('select');
    for(const [v,text] of choices)input.add(new Option(text,String(v)));
    if(value!=null)input.value=String(value);
    box.append(input);return {box,input};
  }
  function row(...children){const r=element('div',null,'log-buttons');r.append(...children);return r}
  function fields(...children){const r=element('div',null,'riff-settings');r.append(...children);return r}
  function status(){const el=element('p');el.setAttribute('role','status');return el}
  async function audioReady(msg){
    const token=version;
    const ok=await enableAudio();
    if(token!==version || !dialog.open)return false;
    if(!ok)msg.textContent='Audio is unavailable. Try opening the trainer in your browser.';
    return ok;
  }
  $('exerciseTools').onclick=()=>open();$('labBack').onclick=()=>open();
  $('labClose').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{if(!dialog.open)stop()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && dialog.open)open(current)});
  window.addEventListener('pagehide',stop);
  return {body,dialog,open,stop,button,select,row,fields,status,audioReady,
    add:(id,name,summary,render)=>{
      tools.set(id,{name,summary,render});
      $(featured(id)?'toolTiles':'otherTiles').append(tile(id,name,summary));
    },
    onStop:fn=>{cleanup=fn},token:()=>version};
})();
function midiName(midi){return pitches[midi%12]+(Math.floor(midi/12)-1)}
function pitchPositions(midi){
  return tuning.flatMap((open,i)=>{
    const fret=midi-open;return fret>=0 && fret<=24 ? [{string:i+1,fret}] : [];
  });
}
function locationName(p){return stringNames[p.string-1]+' string · fret '+p.fret}
function practiceSnapshot(){
  return {lesson:active.id,level:levelNumber(),phrase:$('phrase').value,bpm:tempo(),cursor};
}
function restorePractice(s){
  const lesson=lessonById(s?.lesson);
  if(!lesson)return false;
  if(lesson.id==='chromatic')store.chromaticLevel=s.level;
  openLesson(lesson);
  const options=makeSequence(score().bars,s.phrase);
  selectPhrase(options.length ? s.phrase : 'all');
  rebuildPhrase();setBpm(s.bpm);
  seek(Math.min(Math.max(0,s.cursor||0),sequence.length-1));
  return true;
}
