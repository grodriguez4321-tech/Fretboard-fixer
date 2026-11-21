// All diagrams use the same string numbering, pitches and beat values as playback.
const toolVisual = (() => {
  const mint='#b7efc0', amber='#ffd184', pale='#e6eee6', grid='#537266', dim='#afc1b6';
  const svgNS='http://www.w3.org/2000/svg';
  function mark(parent,tag,attrs,text){
    const el=document.createElementNS(svgNS,tag);
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
    if(text!=null)el.textContent=text;
    parent.append(el);return el;
  }
  const line=(s,x1,y1,x2,y2,color=grid,width=1)=>mark(s,'line',{x1,y1,x2,y2,stroke:color,'stroke-width':width});
  const dot=(s,x,y,r,color=mint)=>mark(s,'circle',{cx:x,cy:y,r,fill:color});
  const rect=(s,x,y,w,h,color,r=3)=>mark(s,'rect',{x,y,width:w,height:h,rx:r,fill:color});
  const label=(s,x,y,value,color=dim,size=13,anchor='middle')=>mark(s,'text',{x,y,fill:color,'font-size':size,'text-anchor':anchor},value);
  function panel(kind){
    const surface=element('div',null,'tool-visual visual-'+kind);
    const heading=element('div',null,'visual-heading');
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('role','img');surface.append(heading,svg);
    function reset(title,description,height){
      if(heading.textContent!==title)heading.textContent=title;
      svg.setAttribute('aria-label',description);
      svg.setAttribute('viewBox','0 0 300 '+height);
      svg.replaceChildren();return svg;
    }
    return {surface,reset};
  }
  function meter(view,cents=null,heard=''){
    const reading=heard+':'+cents;
    if(view.surface.dataset.reading===reading)return;
    view.surface.dataset.reading=reading;
    const s=view.reset('Pitch meter',heard?heard+' at '+cents+' cents relative to its nearest note':'Waiting for a detected pitch',83);
    rect(s,18,29,264,7,grid);rect(s,137,29,26,7,mint);
    for(let i=0;i<=20;i++){const x=18+i*13.2;line(s,x,27,x,i%5===0?16:22,i===10?mint:dim)}
    label(s,18,60,'Flat',dim,14,'start');label(s,150,60,'In tune');label(s,282,60,'Sharp',dim,14,'end');
    if(cents!==null){const x=150+Math.max(-50,Math.min(50,cents))*2.64;
      mark(s,'path',{d:'M '+(x-6)+' 39 l 6 -9 l 6 9 Z',fill:amber});dot(s,x,32,4,amber)}
  }
  // Cards show a crop of the same instrument used when the tool opens.
  function neckTile(view,positions){
    const s=view.reset('Fretting positions','Guitar fingerboard',132);
    s.setAttribute('viewBox','0 0 200 132');
    mark(s,'image',{x:0,y:0,width:fretEdges.at(-1)/2,height:132,href:'rosewood-neck.webp'});
    for(const p of positions){
      const x=(fretEdges[p.fret]+fretWidths[p.fret]/2)/2,y=(p.string-.5)*22;
      dot(s,x,y,8,mint);label(s,x,y+3,p.fret,'#18281d',10);
    }
  }
  function rhythm(view,beats,step=-1,hits=[]){
    const s=view.reset('Beat grid','Count 1 and 2 and 3 and 4 and. Play at '+beats.map(b=>b+1).join(', ')+(hits.length?'. '+hits.length+(hits.length===1?' tap recorded':' taps recorded'):''),94);
    const x=b=>20+35*b*2;
    for(let i=0;i<8;i++){
      const beat=i/2, on=beats.includes(beat);
      if(i===step)rect(s,x(beat)-13,6,26,74,'#395a4c',6);
      label(s,x(beat),22,i%2?'&':1+beat,i%2?dim:pale,14);
      line(s,x(beat),30,x(beat),70);
      if(on)dot(s,x(beat),43,6,mint);else line(s,x(beat)-4,43,x(beat)+4,43,dim,1);
    }
    for(const b of hits)dot(s,Math.max(6,Math.min(294,x(b))),63,4,amber);
    label(s,7,88,'● Pattern',mint,12,'start');label(s,292,88,'● Your taps',amber,12,'end');
  }
  function melody(view,length,phrase=[],found=0,hint=-1,playing=-1){
    const s=view.reset('Phrase memory',found+' of '+length+' notes found'+(playing>=0?'. Listening to note '+(playing+1):''),83);
    const cell=276/length;
    for(let i=0;i<length;i++){
      const x=12+i*cell, revealed=phrase[i]&&(i<found||i===hint);
      rect(s,x,10,cell-5,53,i<found?'#365949':'#243e34',7);
      if(i===playing||i===found&&phrase.length)rect(s,x+4,58,cell-13,3,i===playing?amber:mint,1);
      label(s,x+(cell-5)/2,32,revealed?midiName(tuning[phrase[i].string-1]+phrase[i].fret):'?',revealed?mint:dim,19);
      label(s,x+(cell-5)/2,51,i+1,dim,12);
    }
  }
  function sections(view,events,first,last,records=[]){
    const total=events.reduce((v,e)=>v+e.beats,0)||1;
    const bounds=[];let time=0;
    for(const e of events){bounds.push({i:e.sourceIndex,x:12+276*time/total,w:276*e.beats/total,bar:e.bar});time+=e.beats}
    const s=view.reset('Section timeline','Notes '+(first+1)+' through '+(last+1)+' selected. '+records.length+' saved sections.',89);
    for(const b of bounds)rect(s,b.x,24,Math.max(.65,b.w-.8),20,b.i>=first&&b.i<=last?mint:grid,1);
    let seen=-1;for(const b of bounds){if(b.bar!==seen){line(s,b.x,17,b.x,47,amber);seen=b.bar}}
    for(const r of records){
      const a=bounds.find(v=>v.i===r.first),b=bounds.filter(v=>v.i===r.last).at(-1);
      if(a&&b)rect(s,a.x,53,Math.max(1,b.x+b.w-a.x),5,amber,1);
    }
    label(s,12,77,'Selected notes',mint,12,'start');label(s,288,77,'Saved range',amber,12,'end');
  }
  return {panel,meter,neckTile,rhythm,melody,sections};
})();
