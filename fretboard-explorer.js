const fretAtlas=(()=>{
  const dialog=$('atlas'),scroll=$('verticalScroll'),track=$('verticalTrack'),mode=$('atlasMode'),labels=$('atlasLabels');
  const scales={
    'Major pentatonic':[0,2,4,7,9],'Minor pentatonic':[0,3,5,7,10],'Major':[0,2,4,5,7,9,11],
    'Natural minor':[0,2,3,5,7,8,10],'Blues':[0,3,5,6,7,10],'Dorian':[0,2,3,5,7,9,10],
    'Mixolydian':[0,2,4,5,7,9,10],'Harmonic minor':[0,2,3,5,7,8,11]
  };
  const cells=[],rootNames=['C','C♯ / D♭','D','E♭ / D♯','E','F','F♯ / G♭','G','A♭ / G♯','A','B♭ / A♯','B'];
  let chosen=null,variation=0,picked={string:2,fret:10},activeKey;
  for(const [i,n] of rootNames.entries())$('scaleRoot').add(new Option(n,i));
  for(const name of Object.keys(scales))$('scaleType').add(new Option(name,name));
  for(let i=1;i<=21;i++)$('handBase').add(new Option('Fret '+i,i));
  $('scaleRoot').value=9;$('scaleType').value='Minor pentatonic';$('handBase').value=5;
  const fingerAt=f=>f===0?'○':f>=Number($('handBase').value)&&f<Number($('handBase').value)+4?String(1+f-Number($('handBase').value)):'';
  function reveal(fret){
    const cell=cells[fret*6];if(!cell)return;
    scroll.scrollTop=Math.max(0,cell.offsetTop-track.offsetTop-scroll.clientHeight*.28);
  }
  function markFocus(cell){
    if(activeKey)activeKey.tabIndex=-1;
    cell.tabIndex=0;activeKey=cell;
  }
  function build(){
    if(cells.length)return;
    track.style.gridTemplateRows=fretWidths.map(w=>w+'px').join(' ');
    for(let fret=0;fret<=24;fret++){
      track.append(element('span',fret===0?'0':fret,'atlas-fret'));
      for(let string=6;string>=1;string--){
        const key=element('button',null,'atlas-cell');key.tabIndex=-1;
        key.dataset.fret=fret;key.dataset.string=string;key.append(element('span'));
        key.onfocus=()=>markFocus(key);
        key.onclick=()=>{
          picked={string,fret};silence();audition(note(string,fret,null));paint();
        };
        key.onkeydown=e=>{
          const move={ArrowLeft:[1,0],ArrowRight:[-1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
          if(!move)return;e.preventDefault();
          const s=string+move[0],f=fret+move[1];if(s>=1&&s<=6&&f>=0&&f<=24)cells[f*6+6-s].focus();
        };
        cells.push(key);track.append(key);
      }
    }
    markFocus(cells[0]);
  }
  function paint(){
    const m=mode.value,scale=m==='scale',chord=m==='chord',same=m==='same',showHand=!chord&&labels.value==='fingers';
    $('rootField').hidden=$('scaleField').hidden=!scale;$('handField').hidden=!showHand;
    $('atlasChordControls').hidden=!chord;$('atlasVoicing').disabled=!chosen||chosen.shapes.length<2;
    const shape=chosen?.shapes[variation],root=Number($('scaleRoot').value),pattern=scales[$('scaleType').value];
    const target=tuning[picked.string-1]+picked.fret;
    for(const cell of cells){
      const s=Number(cell.dataset.string),f=Number(cell.dataset.fret),midi=tuning[s-1]+f,interval=(midi-root+120)%12;
      const match=scale?pattern.includes(interval):chord?shape?.frets[6-s]===f:same?midi===target:true;
      const selected=picked.string===s && picked.fret===f;
      cell.dataset.lit=match?'yes':'no';cell.dataset.root=String(scale && interval===0);
      cell.dataset.picked=String(selected && (same || m==='notes'));
      const finger=chord?(f===0?'○':shape?.fingers[6-s]):fingerAt(f);
      const name=midiName(midi);
      cell.firstChild.textContent=match?(labels.value==='notes'?pitches[midi%12]:labels.value==='fingers'?finger||'':''):'';
      cell.setAttribute('aria-label',stringNames[s-1]+' string fret '+f+', '+name+(match&&m!=='notes'?', in overlay':'')+(match&&labels.value==='fingers'&&finger?', '+(f===0?'open':'finger '+finger):''));
    }
    let caption=scale?rootNames[root]+' '+$('scaleType').value+' · Gold marks the root.':chord?
      (shape?chordLibrary.pretty(chordLibrary.symbol(chosen))+' · Shape '+(variation+1)+' of '+chosen.shapes.length+' · '+shape.frets.map(f=>f<0?'×':f).join(' '):'Choose a chord from the library.'):
      same?midiName(target)+' · '+pitchPositions(target).length+' matching positions. Tap a string to change the target.':
      midiName(target)+' · '+locationName(picked);
    if(showHand)caption+=' Fingers cover frets '+$('handBase').value+'–'+(Number($('handBase').value)+3)+'.';
    $('atlasCaption').textContent=caption;
  }
  async function refreshMode(){
    if(mode.value==='chord' && !chosen){
      try{chosen=(await chordLibrary.load()).find(c=>chordLibrary.symbol(c)==='Am')}catch{paint();return}
    }
    paint();
    if(mode.value==='chord' && chosen)reveal(Math.min(...chosen.shapes[variation].frets.filter(f=>f>=0)));
    if(mode.value==='same')reveal(picked.fret);
  }
  function open(){
    haltPlayback();stopMetro();pauseTimer();build();
    labels.value=$('names').value;dialog.showModal();document.body.classList.add('atlas-open');
    refreshMode();
  }
  function openChord(c,index){chosen=c;variation=index;mode.value='chord';open()}
  document.querySelectorAll('[data-open-atlas]').forEach(b=>b.onclick=open);
  $('atlasClose').onclick=()=>dialog.close();dialog.onclose=()=>{document.body.classList.remove('atlas-open');haltPlayback()};
  $('chooseChord').onclick=()=>{dialog.close();location.hash='chords';$('chordSearch').focus()};
  $('atlasVoicing').onclick=()=>{variation=(variation+1)%chosen.shapes.length;refreshMode()};
  mode.onchange=refreshMode;
  for(const id of ['scaleRoot','scaleType'])$(id).onchange=paint;
  $('handBase').onchange=()=>{paint();reveal(Number($('handBase').value))};
  labels.onchange=()=>{$('names').value=labels.value;$('names').onchange();paint()};
  return {openChord};
})();
