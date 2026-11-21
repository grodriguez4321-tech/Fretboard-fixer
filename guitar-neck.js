// These column widths align the controls with the fret wires in rosewood-neck.webp.
const fretWidths=[48,80,78,76,73,71,69,67,65,63,62,60,58,57,55,53,52,50,49,48,46,45,44,44,44];
const fretEdges=[0];
for(const width of fretWidths)fretEdges.push(fretEdges.at(-1)+width);

function guitarNeck(label,onPick,cellLabel){
  const root=element('div',null,'guitar-neck');
  const frame=element('div',null,'neck-frame'),rail=element('div',null,'tuning-rail');
  rail.setAttribute('aria-hidden','true');
  rail.append(element('span'));
  for(const symbol of stringSymbols)rail.append(element('b',symbol));

  const scroll=element('div',null,'neck-scroll');
  scroll.setAttribute('role','group');scroll.setAttribute('aria-label',label);
  const grid=element('div',null,'neck-track');
  grid.style.gridTemplateColumns=fretWidths.map(w=>w+'px').join(' ');
  for(let f=0;f<=24;f++)grid.append(element('span',f===0?'Open':f,'neck-number'));
  const cells=[];
  for(let string=1;string<=6;string++){
    for(let fret=0;fret<=24;fret++){
      const pitch=pitchAt(string,fret),p={string,fret};
      const key=element(onPick?'button':'span',null,'neck-cell');
      key.dataset.string=string;key.dataset.fret=fret;key.dataset.pitch=pitch.name;
      key.append(element('span',pitch.name,'note-cap'));
      const description=cellLabel?cellLabel(p):stringNames[string-1]+' string fret '+fret+', '+pitch.name+pitch.octave;
      if(onPick){
        key.type='button';key.tabIndex=-1;key.setAttribute('aria-label',description);
        key.onclick=()=>onPick(p,key);
      }else key.setAttribute('aria-hidden','true');
      cells.push(key);grid.append(key);
    }
  }
  const cellAt=(s,f)=>cells[(s-1)*25+f];
  let tabStop;
  function setTabStop(key){
    if(!onPick || !key || key.disabled)return;
    if(tabStop)tabStop.tabIndex=-1;
    tabStop=key;key.tabIndex=0;
  }
  if(onPick){
    setTabStop(cells[0]);
    grid.onfocusin=e=>{if(e.target.matches('button'))setTabStop(e.target)};
    grid.onkeydown=e=>{
      const move={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowDown:[1,0],ArrowUp:[-1,0]}[e.key];
      if(!move || !e.target.matches('button'))return;
      e.preventDefault();
      let s=Number(e.target.dataset.string),f=Number(e.target.dataset.fret);
      while(true){
        s+=move[0];f+=move[1];
        if(s<1 || s>6 || f<0 || f>24)return;
        const key=cellAt(s,f);
        if(!key.disabled){reveal(f);key.focus({preventScroll:true});return}
      }
    };
  }
  // Touch and trackpads use native scrolling. Mouse drags must not play notes on release.
  let drag=null,suppressClick=false;
  scroll.addEventListener('pointerdown',e=>{
    suppressClick=false;
    if(e.pointerType==='mouse' && e.button===0)drag={x:e.clientX,left:scroll.scrollLeft,id:e.pointerId};
  },true);
  scroll.onpointermove=e=>{
    if(!drag || e.pointerId!==drag.id)return;
    if(!e.buttons){drag=null;return}
    const delta=e.clientX-drag.x;
    if(!suppressClick && Math.abs(delta)<5)return;
    suppressClick=true;scroll.setPointerCapture(e.pointerId);scroll.scrollLeft=drag.left-delta;
  };
  scroll.onpointerup=scroll.onpointercancel=scroll.onlostpointercapture=()=>{drag=null};
  scroll.addEventListener('click',e=>{if(suppressClick && e.detail){e.stopPropagation();e.preventDefault()}suppressClick=false},true);
  scroll.append(grid);frame.append(rail,scroll);
  const footer=element('div',null,'neck-navigation'),range=document.createElement('input');
  range.type='range';range.min=0;range.max=1000;range.value=0;
  range.setAttribute('aria-label','Scroll '+label);
  const readout=element('span');
  function sync(){
    const max=grid.offsetWidth-scroll.clientWidth;
    if(!scroll.clientWidth)return;
    const left=scroll.scrollLeft,right=left+scroll.clientWidth;
    const first=fretWidths.findIndex((_,i)=>fretEdges[i+1]>left+1);
    const last=fretWidths.findLastIndex((_,i)=>fretEdges[i]<right-1);
    range.value=max>0?Math.round(1000*left/max):0;
    const visible='Frets '+Math.max(0,first)+'–'+Math.max(0,last);
    readout.textContent=visible;range.setAttribute('aria-valuetext',visible);
  }
  range.oninput=()=>{scroll.scrollLeft=(grid.offsetWidth-scroll.clientWidth)*Number(range.value)/1000;sync()};
  scroll.onscroll=sync;
  scroll.addEventListener('neckresize',sync);
  footer.append(readout,range);
  root.append(frame,footer);
  function reveal(fret){
    if(!Number.isInteger(fret) || fret<0 || fret>24)return;
    const adjust=()=>{
      const w=scroll.clientWidth;
      if(!w)return;
      if(fretEdges[fret]<scroll.scrollLeft || fretEdges[fret+1]>scroll.scrollLeft+w){
        scroll.scrollLeft=Math.max(0,fretEdges[fret]-(w-fretWidths[fret])/2);
      }
      sync();
    };
    if(scroll.clientWidth)adjust();else requestAnimationFrame(adjust);
  }
  requestAnimationFrame(sync);
  return {root,cells,cellAt,reveal,sync,setTabStop};
}

window.addEventListener('resize',()=>{
  for(const scroll of document.querySelectorAll('.neck-scroll'))scroll.dispatchEvent(new Event('neckresize'));
});
