(() => {
  const dialog=$('riffDialog');
  let draft=[],selected=-1,replacing=false,undo=[];
  function persistDraft() {
    store.riffDraft={name:$('riffName').value,events:draft};
    save();refreshPreview();
  }
  function entryLabel(e) {
    return (e.string ? stringNames[e.string-1]+' '+e.fret : 'Rest')+' · '+e.beats+(e.beats===1?' beat':' beats');
  }
  function drawRibbon(ribbon,events,selection,preview=false){
    ribbon.replaceChildren();
    const bars=compileRiff(events);
    ribbon.setAttribute('aria-label',events.length ? 'Riff rhythm: '+events.length+' events in '+bars.length+' bars' : 'Empty four-beat bar');
    for(const bar of (preview?bars.slice(0,2):bars)){
      const measure=element('div',null,'riff-measure');
      for(const part of bar){
        const p=part.positions[0],piece=element('span',part.continuation?'↳':p?pitchAt(p.string,p.fret).name:'Rest');
        piece.className=p?'tone':'rest';
        if(part.sourceIndex===selection)piece.classList.add('chosen');
        piece.style.gridColumn='span '+part.beats*2;measure.append(piece);
      }
      ribbon.append(measure);
    }
    if(!bars.length){
      const empty=element('div',null,'riff-measure empty');
      for(let i=1;i<=4;i++)empty.append(element('span',String(i)));
      ribbon.append(empty);
    }
  }
  function refreshPreview(){
    const events=store.riffDraft?.events;
    drawRibbon($('riffPreview'),Array.isArray(events)?events.filter(validRiffEvent):[],-1,true);
  }
  refreshPreview();
  function redraw(message) {
    const list=$('draftNotes');
    list.replaceChildren();
    drawRibbon($('riffRibbon'),draft,selected);
    draft.forEach((e,i)=>{
      const button=element('button',(i+1)+'. '+entryLabel(e));
      button.setAttribute('aria-pressed',String(i===selected));
      button.onclick=()=>{
        selected=selected===i ? -1 : i;replacing=false;
        if(selected>=0){$('riffLength').value=e.beats;$('riffFinger').value=e.finger || ''}
        redraw();
      };
      list.append(button);
    });
    $('noteEdit').hidden=selected<0;
    $('undoNote').disabled=!undo.length;
    $('saveRiff').disabled=!draft.length;
    $('draftStatus').textContent=message || (replacing ? 'Tap a fret or Add rest to replace note '+(selected+1)+'.' :
      draft.length ? draft.length+' events · '+draft.reduce((n,e)=>n+e.beats,0)+' beats' : 'Add your first note.');
  }
  function checkpoint() {
    undo.push(draft.slice());
    if(undo.length>40)undo.shift();
  }
  function add(string,fret) {
    if(draft.length>=128 && !replacing){redraw('This riff is full at 128 events.');return}
    const e={string,fret,beats:Number($('riffLength').value),
      finger:fret ? Number($('riffFinger').value)||null : 0};
    checkpoint();
    if(replacing)draft[selected]=e;else draft.push(e);
    selected=-1;replacing=false;
    haltPlayback();
    if(string)audition(note(string,fret,e.finger));
    persistDraft();redraw();
  }
  function drawEntryNeck() {
    const board=$('entryNeck');
    const start=Number($('riffWindow').value);
    const frets=[0,...Array.from({length:Math.min(5,25-start)},(_,i)=>start+i)];
    board.style.setProperty('--cols',frets.length);
    board.replaceChildren(element('span'));
    for(const fret of frets)board.append(element('b',fret));
    for(let string=1;string<=6;string++) {
      board.append(element('b',stringSymbols[string-1]));
      for(const fret of frets){
        const button=element('button',pitchAt(string,fret).name);
        button.setAttribute('aria-label','Add '+stringNames[string-1]+' string fret '+fret);
        button.onclick=()=>add(string,fret);board.append(button);
      }
    }
  }
  function openEditor(source) {
    haltPlayback();stopMetro();pauseTimer();
    const data=source || store.riffDraft;
    draft=Array.isArray(data?.events) ? data.events.filter(validRiffEvent).slice(0,128) : [];
    $('riffName').value=source ? source.name.slice(0,54)+' variation' : data?.name || '';
    selected=-1;replacing=false;undo=[];
    drawEntryNeck();redraw();dialog.showModal();
  }
  $('newRiff').onclick=()=>openEditor();
  $('copyRiff').onclick=()=>openEditor(store.riffs.find(r=>r.id===active.id));
  $('riffWindow').onchange=drawEntryNeck;
  $('riffName').oninput=persistDraft;
  $('addRest').onclick=()=>add(0,0);
  $('replaceNote').onclick=()=>{replacing=true;redraw()};
  $('deleteNote').onclick=()=>{checkpoint();draft.splice(selected,1);selected=-1;replacing=false;persistDraft();redraw()};
  $('undoNote').onclick=()=>{draft=undo.pop();selected=-1;replacing=false;persistDraft();redraw()};
  $('closeRiff').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{haltPlayback()});
  $('saveRiff').onclick=()=>{
    const name=$('riffName').value.trim();
    if(!name){redraw('Give your riff a name before saving.');$('riffName').focus();return}
    if(!draft.length)return;
    const riff={id:'riff-'+crypto.randomUUID(),name,bpm:tempo(),events:draft.slice()};
    const previousDraft=store.riffDraft;
    store.riffs.push(riff);delete store.riffDraft;
    try{save()}catch{
      store.riffs.pop();store.riffDraft=previousDraft;redraw('Device storage is full. Your draft is still open.');return;
    }
    refreshPreview();registerRiff(riff);refreshRiffPicker();dialog.close();openLesson(lessonById(riff.id));
    $('studio').scrollIntoView();$('lessonTitle').focus({preventScroll:true});
  };
})();
