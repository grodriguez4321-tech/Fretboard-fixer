// Hash routes keep each view bookmarkable on the static Netlify site.
(() => {
  const panels={practice:$('practicePage'),exercise:$('studio'),tools:$('toolsPage'),journal:$('journal')};
  const headings={practice:$('practiceTitle'),exercise:$('lessonTitle'),tools:$('toolsTitle'),journal:$('journalTitle')};
  let current='',applying=false,lastDay=dayKey(),feedback='',returnTo='';
  function decodeRoute(){
    const hash=location.hash.slice(1);
    if(hash.startsWith('exercise/') && lessonById(hash.slice(9)))return hash;
    if(hash==='studio')return 'exercise/'+active.id;
    return hash==='tools'||hash==='journal' ? hash : 'practice';
  }
  function display(route,focus){
    const page=route.split('/')[0];
    for(const [name,panel] of Object.entries(panels))panel.hidden=name!==page;
    for(const a of document.querySelectorAll('.brandbar nav a')){
      if(a.hash==='#'+(page==='exercise'?'practice':page))a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    }
    current=route;
    document.title=headings[page].textContent+' · Fretboard Fixer';
    if(page==='practice'){
      $('finishNotice').textContent=feedback;render();feedback='';
    }
    if(focus){
      const row=page==='practice' && returnTo ? document.querySelector('.exercise-row[data-lesson="'+returnTo+'"]') : null;
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
      else if(route==='practice' && previous.startsWith('exercise/'))returnTo=previous.slice(9);
      display(route,focus);
    }finally{applying=false}
  }
  function navigate(route,replace=false){
    if(location.hash!=='#'+route)history[replace?'replaceState':'pushState'](null,'','#'+route);
    apply();
  }
  document.addEventListener('click',event=>{
    const a=event.target.closest('a[href^="#"]');
    if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();navigate(a.hash.slice(1));
  });
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
    const day=dayKey();
    store.dailyDone??={};
    (store.dailyDone[day]??={})[active.id]=true;
    store.done[active.id]=true;store.days[day]=true;save();
    feedback=active.name+' completed.';navigate('practice',true);
  };
  function refreshDate(){
    if(dayKey()===lastDay)return;
    lastDay=dayKey();$('finishNotice').textContent='';render();
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate()});
  window.addEventListener('pageshow',refreshDate);
  function nextMidnight(){
    const tomorrow=new Date();tomorrow.setHours(24,0,0,0);
    setTimeout(()=>{refreshDate();nextMidnight()},tomorrow-Date.now()+100);
  }
  window.addEventListener('popstate',()=>apply());
  window.addEventListener('hashchange',()=>apply());
  apply(false);nextMidnight();
})();
