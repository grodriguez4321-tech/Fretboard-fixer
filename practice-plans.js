if(!Array.isArray(store.songSections))store.songSections=[];
lab.add('sections','Song-section map','Save an intro, verse or chorus from a riff. Practice sections and the jump between them.',()=>{
  const maps=[lessonById('song'),...riffLessons.values()];
  const song=lab.select('Song or saved riff',maps.map(ex=>[ex.id,ex.name]),maps.some(ex=>ex.id===active.id)?active.id:'song');
  const title=document.createElement('input');title.maxLength=48;title.placeholder='Intro, verse, chorus…';
  const nameLabel=element('label','Section name');nameLabel.append(title);
  const first=lab.select('First note',[]),last=lab.select('Last note',[]);
  const speed=lab.select('Practice BPM',Array.from({length:29},(_,i)=>[40+5*i,40+5*i]),tempo());
  const msg=lab.status(),list=element('div');
  function openPart(id,phrase,bpm){
    lab.dialog.close();restorePractice({lesson:id,level:0,phrase,bpm,cursor:0});
    looping=true;$('loop').setAttribute('aria-pressed','true');paint();$('studio').scrollIntoView();
  }
  function renderList(){
    list.replaceChildren();
    const records=store.songSections.filter(s=>s.lesson===song.input.value).sort((a,b)=>a.first-b.first||a.last-b.last);
    for(const [i,s] of records.entries()){
      const phrase='notes-'+s.first+'-'+s.last;
      const best=store.bests[s.lesson+'-bar'+phrase];
      const panel=element('div',null,'lab-panel');
      panel.append(element('strong',s.name),element('p',phraseName(phrase)+' · '+s.bpm+' BPM'+(best?' · clean best '+best+' BPM':'')));
      const actions=lab.row(lab.button('Practice '+s.name,()=>openPart(s.lesson,phrase,s.bpm)));
      const next=records[i+1];
      if(next && next.first>s.last)actions.append(lab.button(s.name+' into '+next.name,()=>openPart(s.lesson,'join-'+s.last+'-'+next.first,Math.min(s.bpm,next.bpm))));
      actions.append(lab.button('Remove',()=>{
        if(!confirm('Remove “'+s.name+'” from this map?'))return;
        store.songSections=store.songSections.filter(entry=>entry.id!==s.id);save();renderList();
      }));
      panel.append(actions);list.append(panel);
    }
  }
  function loadNotes(){
    const events=makeSequence(scores[song.input.value].bars,'all').filter(e=>!e.continuation);
    for(const f of [first,last]){
      f.input.replaceChildren();for(const e of events)f.input.add(new Option((e.sourceIndex+1)+'. '+describe(e)[0]+' · bar '+(e.bar+1),e.sourceIndex));
    }
    last.input.value=String(events.at(-1).sourceIndex);renderList();msg.textContent='';
  }
  const add=lab.button('Save section',()=>{
    const name=title.value.trim(),a=Number(first.input.value),b=Number(last.input.value);
    if(!name || a>b){msg.textContent='Enter a name and choose a last note at or after the first.';return}
    store.songSections.push({id:crypto.randomUUID(),lesson:song.input.value,name,first:a,last:b,bpm:Number(speed.input.value)});
    save();title.value='';msg.textContent='Section saved on this device.';renderList();
  },'primary');
  lab.body.append(element('p','Map sections in one saved riff. A section join plays the last note of one section and the first note of the next.'),lab.fields(song.box,nameLabel),lab.fields(first.box,last.box,speed.box),add,msg,list);
  song.input.onchange=loadNotes;loadNotes();
});

// A session runs only while this page is visible. Persist the exact transport
// position separately from elapsed time so reloads never log time spent away.
(() => {
  const stages=[
    {title:'Recall',seconds:60,prompt:'Play a familiar phrase once from memory, then check the notes.'},
    {title:'Repair a change',seconds:120,prompt:'Work on these two notes. Listen for a clean landing on the second note, then raise the tempo only when ready.'},
    {title:'Play music',seconds:120,prompt:'Put the phrase into a longer passage. Keep the beat going through the change.'}
  ];
  let running=false,last=0,ticker,restored=false;
  const session=()=>store.quickSession;
  const panel=$('quickPanel');
  function draw(){
    const q=session();panel.hidden=!q;
    $('quickStart').textContent=q ? (running?'Current session':'Resume 5-minute session') : '5-minute session';
    if(!q)return;
    const stage=stages[q.stage];$('quickTitle').textContent=stage.title+' · '+(q.stage+1)+' of 3';
    $('quickPrompt').textContent=q.remaining>0 ? stage.prompt : 'Time for this activity is up. Continue when ready.';
    $('quickTime').textContent=fmt(q.remaining);
    $('quickPause').textContent=running?'Pause session':'Resume session';$('quickPause').disabled=q.remaining<=0;
    $('quickNext').textContent=q.stage===2?'Finish session':'Next activity';
    $('quickReview').hidden=q.stage!==0;
  }
  function account(){
    const q=session();if(!running || !q)return;
    const now=performance.now(),seconds=Math.min(q.remaining,Math.max(0,(now-last)/1000));last=now;
    q.remaining=Math.max(0,q.remaining-seconds);
    store.times[active.id]=(store.times[active.id]||0)+seconds;
    if(seconds)store.days[new Date().toLocaleDateString('en-CA')]=true;
    q.position=practiceSnapshot();save();updateStats();
    if(!q.remaining){running=false;clearInterval(ticker);haltPlayback();stopMetro()}
    draw();
  }
  function pause(){
    if(running){account();running=false;clearInterval(ticker);haltPlayback();stopMetro();draw()}
  }
  function run(){
    const q=session();if(!q || q.remaining<=0 || running)return;
    pauseTimer();last=performance.now();running=true;ticker=setInterval(account,1000);draw();
  }
  function create(){
    const records=Object.entries(store.phraseReviews||{}).filter(([,r])=>r && lessonById(r.lesson) && (r.lesson!=='chromatic' || chromaticLevels[r.level]));
    const due=records.filter(([,r])=>r.due<=Date.now()).sort((a,b)=>a[1].due-b[1].due)[0];
    const weak=records.filter(([,r])=>r.lastResult==='needed-cue').sort((a,b)=>a[1].due-b[1].due)[0];
    const here=practiceSnapshot();
    const familiar=due?.[1] || {...here,phrase:here.phrase==='all' ? String(sequence[cursor].bar) : here.phrase};
    const target=weak?.[1] || here;
    const targetScore=target.lesson==='chromatic'?chromaticLevels[target.level||0].score:scores[target.lesson];
    const allNotes=makeSequence(targetScore.bars,'all');
    const chosen=makeSequence(targetScore.bars,target.phrase);
    const index=chosen[target.cursor||0]?.sourceIndex ?? chosen[0]?.sourceIndex ?? 0;
    const end=allNotes.at(-1).sourceIndex;
    const first=Math.max(0,Math.min(index,end-1));
    const repair={...target,phrase:'notes-'+first+'-'+Math.min(first+1,end),cursor:0};
    const musicId=riffLessons.has(here.lesson)?here.lesson:riffLessons.has(target.lesson)?target.lesson:store.riffs.at(-1)?.id || 'song';
    const music={lesson:musicId,level:0,phrase:'all',bpm:lessonById(musicId)?.bpm||55,cursor:0};
    store.quickSession={stage:0,remaining:60,review:due?.[0]||null,plan:[{...familiar,cursor:0},repair,music],position:{...familiar,cursor:0}};
    save();
  }
  function review(){
    const key=session()?.review;
    document.dispatchEvent(new CustomEvent('openphrasereview',{detail:{key,target:session().plan[0]}}));
  }
  function enter(autoReview){
    const q=session();restorePractice(q.position);restored=true;draw();run();
    if(autoReview && q.stage===0)review();
    if(!$('recallDialog').open)panel.scrollIntoView({block:'start'});
  }
  $('quickStart').onclick=()=>{
    const fresh=!session();if(fresh)create();
    if(running){panel.scrollIntoView();return}
    enter(fresh || !restored);
  };
  $('quickPause').onclick=()=>{if(running)pause();else enter(!restored)};
  $('quickReview').onclick=review;
  $('quickNext').onclick=()=>{
    const q=session();if(!q)return;
    pause();haltPlayback();stopMetro();
    if(q.stage===2){delete store.quickSession;save();restored=false;draw();render();return}
    q.stage++;q.remaining=stages[q.stage].seconds;q.position={...q.plan[q.stage],cursor:0};
    save();enter(false);
  };
  // Timed exercise practice and the short session share one duration ledger.
  $('timerBtn').addEventListener('click',pause,true);
  document.addEventListener('learningtoolopen',pause);
  $('newRiff').addEventListener('click',pause,true);$('copyRiff').addEventListener('click',pause,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  window.addEventListener('pagehide',pause);
  if(session() && (!stages[session().stage] || !session().position || !Array.isArray(session().plan)))delete store.quickSession;
  draw();
})();
