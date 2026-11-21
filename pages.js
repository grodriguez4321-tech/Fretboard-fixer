// Hash routes keep each view bookmarkable on the static Netlify site.
(() => {
  const panels={practice:$('practicePage'),exercise:$('studio'),songs:$('songsPage'),tools:$('toolsPage'),journal:$('journal')};
  const headings={practice:$('practiceTitle'),exercise:$('lessonTitle'),songs:$('songsTitle'),tools:$('toolsTitle'),journal:$('journalTitle')};
  let current='',applying=false,lastDay=dayKey(),feedback='',returnTo='',undo=null;
  function decodeRoute(){
    const hash=location.hash.slice(1);
    if(hash.startsWith('exercise/') && lessonById(hash.slice(9)))return hash;
    if(hash==='studio')return 'exercise/'+active.id;
    return hash==='tools'||hash==='songs'||hash==='journal' ? hash : 'practice';
  }
  function display(route,focus){
    const page=route.split('/')[0];
    for(const [name,panel] of Object.entries(panels))panel.hidden=name!==page;
    const origin=songLessons.has(active.id)?'songs':'practice';
    $('backChecklist').href='#'+origin;
    $('backChecklist').textContent=origin==='songs'?'← My song lessons':'← Today’s practice';
    for(const a of document.querySelectorAll('.brandbar nav a')){
      if(a.hash==='#'+(page==='exercise'?origin:page))a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    }
    current=route;
    document.title=headings[page].textContent+' · Fretboard Fixer';
    if(page!=='practice' && page!=='songs'){undo=null;$('undoDone').hidden=true}
    if(page==='songs'){render();if(feedback)$('abcStatus').textContent=feedback;feedback=''}
    if(page==='practice'){
      $('finishNotice').textContent=feedback;render();feedback='';
    }
    if(focus){
      const row=(page==='practice'||page==='songs') && returnTo ? document.querySelector('.exercise-row[data-lesson="'+returnTo+'"]') : null;
      if(row){row.focus({preventScroll:true});row.scrollIntoView({block:'nearest'});}
      else{window.scrollTo(0,0);headings[page].focus({preventScroll:true})}
    }
    returnTo='';
  }
  function stopPage(){
    document.dispatchEvent(new Event('leavepracticepage'));
    if(timerRunning){tick();pauseTimer()}
    haltPlayback();stopMetro();
    for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
    if(document.body.classList.contains('practice-focus'))setPracticeFocus(false);
  }
  function apply(focus=true){
    const route=decodeRoute();
    if(route===current)return;
    const previous=current;
    if(previous)stopPage();
    applying=true;
    try{
      if(route.startsWith('exercise/'))openLesson(lessonById(route.slice(9)));
      else if((route==='practice'||route==='songs') && previous.startsWith('exercise/'))returnTo=previous.slice(9);
      display(route,focus);
    }finally{applying=false}
  }
  function navigate(route,replace=false){
    if(location.hash!=='#'+route)history[replace?'replaceState':'pushState'](null,'','#'+route);
    apply();
  }
  // Riff saves, phrase reviews and short sessions can enter a selected lesson
  // with their own tempo and range. Keep that transport state intact.
  document.addEventListener('lessonopened',()=>{
    if(applying)return;
    const route='exercise/'+active.id;
    if(route===current)return;
    history[current.startsWith('exercise/')?'replaceState':'pushState'](null,'','#'+route);
    display(route,true);
  });
  $('complete').onclick=()=>{
    stopPage();
    const day=dayKey();
    store.dailyDone??={};
    const today=store.dailyDone[day]??={};
    undo=today[active.id] ? null : {id:active.id,day,previous:store.done[active.id],practiceDay:store.days[day]};
    $('undoDone').hidden=!undo;
    $('undoSong').hidden=!undo;
    today[active.id]=true;
    store.done[active.id]=true;store.days[day]=true;save();
    feedback=active.name+' completed.';navigate(songLessons.has(active.id)?'songs':'practice',true);
  };
  $('undoDone').onclick=()=>{
    if(!undo || undo.day!==dayKey())return;
    delete store.dailyDone[undo.day][undo.id];
    if(undo.previous===undefined)delete store.done[undo.id];else store.done[undo.id]=undo.previous;
    if(!undo.practiceDay && !Object.keys(store.dailyDone[undo.day]).length)delete store.days[undo.day];
    const id=undo.id;undo=null;$('undoDone').hidden=true;$('undoSong').hidden=true;save();render();
    $(current==='songs'?'abcStatus':'finishNotice').textContent='Completion undone.';
    document.querySelector('.exercise-row[data-lesson="'+id+'"]')?.focus({preventScroll:true});
  };
  $('undoSong').onclick=$('undoDone').onclick;
  function refreshDate(){
    if(dayKey()===lastDay)return;
    lastDay=dayKey();undo=null;$('undoDone').hidden=true;$('undoSong').hidden=true;$('finishNotice').textContent='';render();
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate()});
  window.addEventListener('pageshow',refreshDate);
  function nextMidnight(){
    const tomorrow=new Date();tomorrow.setHours(24,0,0,0);
    setTimeout(()=>{refreshDate();nextMidnight()},tomorrow-Date.now()+100);
  }
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#songbook='))importLink();else apply()});
  const status=$('abcStatus');
  async function loadSongs(texts){
    const count=await importAbcFiles(texts);
    status.textContent=count+' song lesson'+(count===1?'':'s')+' ready on this device.';
  }
  $('abcFiles').onchange=async event=>{
    try{
      const files=Array.from(event.target.files);
      if(!files.length)return;
      if(files.length>32 || files.some(f=>f.size>24000))throw Error('Choose up to 32 short ABC excerpts.');
      await loadSongs(await Promise.all(files.map(f=>f.text())));
    }catch(e){status.textContent=e.message}finally{event.target.value=''}
  };
  async function importLink(){
    const encoded=location.hash.slice('#songbook='.length);
    history.replaceState(null,'','#songs');apply(false);
    try{
      if(encoded.length>24000 || !/^[A-Za-z0-9_-]+$/.test(encoded))throw Error('Invalid songbook.');
      const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
      const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
      const decoder=new TextDecoder();let content='',size=0;
      while(true){
        const {value,done}=await reader.read();if(done)break;
        size+=value.length;if(size>96000){await reader.cancel();throw Error('Songbook is too large.')}
        content+=decoder.decode(value,{stream:true});
      }
      await loadSongs(JSON.parse(content+decoder.decode()));
    }catch(e){status.textContent='Could not open this songbook. Select the ABC files below. '+e.message}
  }
  if(location.hash.startsWith('#songbook='))importLink();else apply(false);
  nextMidnight();
})();
