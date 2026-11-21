// Recall records share the existing device-local progress store and JSON export.
(() => {
  const DAY = 24 * 60 * 60 * 1000;
  const dialog = $('recallDialog');
  const repair = {
    chromatic: 'Step to the first uneven note. Play it and the note before it with alternate strokes.',
    alternate: 'Play the two notes around the mistake. Say “down, up” and keep that order when the frets reverse.',
    legato: 'Keep your index at fret 5. Pick once, hammer fret 7, then release back to 5. Listen for three distinct notes.',
    slides: 'Play the landing fret alone to hear the target. Slide into it with the same finger, then compare.',
    emam: 'Form the destination chord. Pick its strings individually, then go back and practice the change.',
    amc: 'Keep index on B1 and middle on D2. Move only the ring finger between G2 and A3, then strum.',
    strum: 'Mute the strings and count “1 and 2 and 3 and 4 and.” Put downstrokes on numbers and upstrokes on “and.”',
    stretch: 'Play the last note before the shift and the first one after it. Move your whole hand into position.',
    song: 'Step to the first hesitation. Play the note before it and the landing note, then put those beats back into the bar.',
    ear: 'Sing the second pitch after the first. Play the pair slowly and listen for the direction.',
    findnotes: 'Say the note name and string aloud. Find it again on the other string, then compare the pitches.'
  };
  let study = null, cleanPasses = 0, pendingReview = null;
  let clickTimer = null, clickRequest = 0;
  if (!store.phraseReviews || typeof store.phraseReviews !== 'object' || Array.isArray(store.phraseReviews)) {
    store.phraseReviews = {};
  }

  const keyOf = t => [t.lesson,t.level,t.phrase].join('/');
  const lessonOf = t => lessonById(t.lesson);
  function targetName(t) {
    const level = t.lesson === 'chromatic' ? ' · '+chromaticLevels[t.level].name : '';
    return lessonOf(t).name + level + ' · ' + (t.phrase==='all' && ['emam','amc'].includes(t.lesson) ? 'both bars' : phraseName(t.phrase));
  }
  function chooseTarget() {
    const phrase = $('phrase').value;
    const pair = ['emam','amc'].includes(active.id);
    return {lesson:active.id,level:active.id === 'chromatic' ? levelNumber() : 0,
      phrase:phrase === 'all' && !pair ? String(sequence[cursor].bar) : phrase, bpm:tempo()};
  }
  function refreshQueue() {
    const records = Object.values(store.phraseReviews).filter(t => t && lessonOf(t) &&
      (t.lesson !== 'chromatic' || chromaticLevels[t.level]) && Number.isFinite(t.due));
    records.sort((a,b)=>a.due-b.due);
    const due = records.filter(t => t.due <= Date.now());
    pendingReview = due[0] || null;
    $('reviewQueue').hidden = !records.length;
    if (!records.length) return;
    $('reviewTitle').textContent = due.length ? 'Ready for a memory check' : 'Next memory check';
    const t = records[0];
    const date = new Date(t.due).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    $('reviewDetail').textContent = targetName(t)+' · '+t.bpm+' BPM'+(due.length ? ' · '+due.length+' due' : ' · '+date);
    $('startReview').hidden = !due.length;
  }
  function stopClick() {
    clickRequest++;
    clearInterval(clickTimer);
    clickTimer = null;
  }
  function action(label, handler, primary=false) {
    const button = element('button',label,primary ? 'primary' : '');
    button.onclick = handler;
    $('recallActions').append(button);
    return button;
  }
  function screen(t,title,prompt) {
    haltPlayback(); stopMetro(); stopClick();
    $('recallTarget').textContent = targetName(t)+' · '+t.bpm+' BPM';
    $('recallTitle').textContent = title;
    $('recallPrompt').textContent = prompt;
    $('recallFeedback').textContent = '';
    $('recallActions').replaceChildren();
    if (!dialog.open) dialog.showModal();
    $('recallTitle').tabIndex = -1;
    $('recallTitle').focus();
  }
  function addClick(t) {
    const button = action('Start click',async () => {
      if (clickTimer !== null) {
        stopClick(); button.textContent='Start click'; return;
      }
      const request = ++clickRequest;
      const ready = await enableAudio();
      if (request !== clickRequest || !dialog.open) return;
      if (!ready) { $('recallFeedback').textContent='Audio unavailable. Count four steady beats aloud.'; return; }
      let beat = 0;
      const pulse = () => {clickSound(beat===0);beat=(beat+1)%4};
      pulse();clickTimer=setInterval(pulse,60000/t.bpm);
      button.textContent='Stop click';
    });
    button.id='recallClick';
  }
  function finishStudy(message='Learn a phrase with the tab, then try it from memory.') {
    study=null;cleanPasses=0;
    $('coachHint').textContent=message;
    $('coachStart').hidden=false;
    $('repControls').hidden=true;
  }
  function beginStudy(t,restore=false) {
    if (restore) {
      if (t.lesson==='chromatic') {store.chromaticLevel=t.level;save()}
      openLesson(lessonOf(t));setBpm(t.bpm);
    }
    selectPhrase(t.phrase);
    rebuildPhrase();
    study={...t};cleanPasses=0;
    $('coachStart').hidden=true;$('repControls').hidden=false;
    $('coachHint').textContent=targetName(t)+' · '+t.bpm+' BPM';
    $('repStatus').textContent='Listen once. Play twice on your guitar with every note clear and the beat steady. Tap Clean pass after each accurate run.';
  }
  function switchTask(t) {
    const rhythm=['strum','emam','amc'].includes(t.lesson);
    screen(t,'Switch tasks for two bars',rhythm ?
      'Pick the open B and high E strings in turn, one note on each beat. Count to four twice, then come back to your phrase.' :
      'Rest your fretting fingers lightly across the strings. Play four muted downstrokes, one per beat. Repeat once.');
    action('Try original phrase from memory',()=>memoryTest(t,false),true);
    addClick(t);
  }
  function memoryTest(t,delayed) {
    screen(t,delayed ? 'First try of this review' : 'Play it from memory',
      'Count four beats, then play the saved phrase once without the guide. Listen for the right strings and frets, clear notes, and a steady pulse.');
    action('Played it cleanly',()=>record(t,delayed,true),true);
    action('Needed a cue',()=>record(t,delayed,false));
    addClick(t);
  }
  function record(t,delayed,clean) {
    const key=keyOf(t), old=store.phraseReviews[key];
    const streak=delayed && clean ? (old?.streak || 0)+1 : 0;
    const days=streak===0 ? 1 : streak===1 ? 3 : 7;
    store.phraseReviews[key]={...t,streak,due:Date.now()+days*DAY,
      reviews:(old?.reviews || 0)+Number(delayed),lastResult:clean ? 'clean' : 'needed-cue'};
    store.days[new Date().toLocaleDateString('en-CA')]=true;
    save();updateStats();refreshQueue();
    screen(t,clean?'Clean recall logged':'Cue needed',
      (clean?'Try the same phrase again':'Revisit the tricky change, then try again')+' in '+(days===1?'24 hours.':days+' days.'));
    if (!clean) {
      $('recallFeedback').textContent=(repair[t.lesson] || repair.song);
      action('Practice this phrase',()=>{
        dialog.close(); beginStudy(t,true); $('repClean').focus();
      },true);
    }
    finishStudy('Memory check saved. Your next review appears above the lesson.');
  }
  $('coachStart').onclick=()=>beginStudy(chooseTarget());
  $('coachEnd').onclick=()=>finishStudy('Reopen phrase practice whenever you are ready.');
  $('repClean').onclick=()=>{
    if (!study) return;
    cleanPasses++;
    if (cleanPasses===2) {
      const t=study;finishStudy();switchTask(t);
    } else $('repStatus').textContent='One clean pass. Play the same phrase once more at this tempo.';
  };
  $('repMiss').onclick=()=>{
    if (!study) return;
    cleanPasses=0;
    $('repStatus').textContent=(repair[study.lesson] || repair.song)+' Lower the tempo if needed, then try two clean passes.';
  };
  $('startReview').onclick=()=>{
    refreshQueue();
    if (!pendingReview) return;
    const t={...pendingReview};
    finishStudy();pauseTimer();memoryTest(t,true);
  };
  $('closeRecall').onclick=()=>dialog.close();
  dialog.addEventListener('close',stopClick);
  document.addEventListener('practicephrasechange',()=>finishStudy());
  document.addEventListener('practicetempochange',()=>{
    if (!study || study.bpm===tempo()) return;
    study.bpm=tempo();cleanPasses=0;
    $('coachHint').textContent=targetName(study)+' · '+study.bpm+' BPM';
    $('repStatus').textContent='New tempo. Play two clean passes here.';
  });
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) {
      stopClick();if ($('recallClick')) $('recallClick').textContent='Start click';
    } else refreshQueue();
  });
  window.addEventListener('pageshow',refreshQueue);
  window.addEventListener('focus',refreshQueue);
  setInterval(refreshQueue,60000);
  refreshQueue();
})();
