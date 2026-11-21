// Six strings, open notes and four frets per window keep every target thumb-sized.
function fretPicker(onPick){
  const root=element('section',null,'position-picker');
  const ranges=element('div',null,'neck-windows'),neck=element('div',null,'touch-neck');
  ranges.setAttribute('role','group');ranges.setAttribute('aria-label','Fret range');
  neck.setAttribute('role','group');neck.setAttribute('aria-label','Choose a string and fret');
  let start=1, selected=[], available=null, alternatives=[];
  const cells=[],windowButtons=[],headers=[];
  for(let n=1;n<=24;n+=4){
    const button=lab.button(n+'–'+(n+3),()=>{start=n;paint()});
    button.setAttribute('aria-label','Frets '+n+' to '+(n+3));ranges.append(button);windowButtons.push(button);
  }
  neck.append(element('span'));
  for(let i=0;i<5;i++){const header=element('b');headers.push(header);neck.append(header)}
  for(let string=1;string<=6;string++){
    const tag=element('b', ['e','B','G','D','A','E'][string-1],'string-name');
    tag.title=stringNames[string-1]+' string';neck.append(tag);
    for(let col=0;col<5;col++){
      const button=lab.button('',()=>onPick({string,fret:Number(button.dataset.fret)}),'touch-fret');
      button.append(element('span'));cells.push({string,col,button});neck.append(button);
    }
  }
  function paint(){
    headers.forEach((el,i)=>el.textContent=i===0?'Open':start+i-1);
    windowButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(start===1+4*i)));
    for(const {string,col,button} of cells){
      const fret=col===0?0:start+col-1, has=(p)=>p.string===string && p.fret===fret;
      const selectedHere=selected.some(has),possible=available===null || available.some(has);
      const pitch=pitchAt(string,fret);
      button.firstChild.textContent=pitch.name;
      button.dataset.fret=fret;button.dataset.string=string;
      button.dataset.mark=selectedHere?'selected':(available && possible || alternatives.some(has))?'available':'';
      button.disabled=!possible;button.setAttribute('aria-pressed',String(selectedHere));
      button.setAttribute('aria-label',stringNames[string-1]+' string fret '+fret+', '+pitch.name+pitch.octave);
    }
  }
  root.append(neck,ranges);
  return {root, update(marked,allowed=null,showFret,otherPlaces=[]){
    selected=marked;available=allowed;alternatives=otherPlaces;
    if(showFret>0)start=1+4*Math.floor((showFret-1)/4);
    paint();
  }};
}
