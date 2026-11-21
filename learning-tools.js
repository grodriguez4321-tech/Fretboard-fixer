// A single active audio tool owns its timers, voices, and input stream.
const lab = (() => {
  const tools=new Map(), body=$('labBody'), dialog=$('labDialog');
  let cleanup=()=>{}, version=0, current='';
  function stop(){
    version++;cleanup();cleanup=()=>{};haltPlayback();
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
      for(const [key,t] of tools){
        const b=button(t.name,()=>open(key));
        b.append(element('small',t.summary));menu.append(b);
      }
      body.append(menu);
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
      const tile=button(name,()=>open(id));tile.append(element('small',summary));$('toolTiles').append(tile);
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
