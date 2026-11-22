// Shapes are stored in chart order: low E through high E, with absolute frets.
const chordLibrary=(()=>{
  const roots=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const aliases={'Db':'C#','D#':'Eb','Gb':'F#','G#':'Ab','A#':'Bb','Cb':'B','B#':'C','E#':'F','Fb':'E'};
  const basics=['C','G','D','A','E','Am','Em','Dm','F'];
  let data,loading,root='Essentials',limit=24,results=[];
  const symbol=c=>c.root+(c.quality==='major'?'':c.quality==='minor'?'m':c.quality);
  const pretty=s=>s.replace(/#/g,'♯').replace(/b/g,'♭');
  function normalize(text){
    const clean=text.trim().replace(/♯/g,'#').replace(/♭/g,'b').replace(/\s/g,'')
      .replace(/^([a-g][#b]?)M(?=\d)/i,(whole,root)=>whole.endsWith('M')?root+'maj':whole)
      .replace(/6\/9/g,'69').replace(/Major(?=\d)/ig,'maj').replace(/minor/ig,'m').replace(/major$/i,'').replace(/maj$/,'').replace(/min(?=\d|$)/i,'m');
    return clean.replace(/(^|\/)([a-gA-G])([#b]?)/g,(_,prefix,n,acc)=>{
      const pitch=n.toUpperCase()+acc;return prefix+(aliases[pitch]||pitch);
    });
  }
  async function load(){
    if(!loading)loading=fetch('chord-shapes.json').then(r=>{
      if(!r.ok)throw Error('Chord library unavailable');return r.json();
    }).then(rows=>data=rows).catch(err=>{loading=null;throw err});
    return loading;
  }
  function chart(shape,name){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    function draw(tag,attrs,text){
      const el=document.createElementNS(ns,tag);
      for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
      if(text!=null)el.textContent=text;svg.append(el);
    }
    const played=shape.frets.filter(f=>f>0),high=Math.max(4,...played),base=high<=4?1:Math.min(...played);
    const rows=Math.max(4,high-base+1),x=i=>35+i*21,y=f=>34+(f-base+.5)*24;
    svg.setAttribute('viewBox','0 0 171 '+(52+rows*24));svg.setAttribute('role','img');
    svg.setAttribute('aria-label',name+', low E to high E: '+shape.frets.map((f,i)=>f<0?'skip':f===0?'open':'fret '+f+' finger '+shape.fingers[i]).join(', '));
    for(let j=0;j<=rows;j++)draw('line',{x1:x(0),x2:x(5),y1:34+j*24,y2:34+j*24,stroke:'currentColor','stroke-width':j===0&&base===1?5:1});
    if(base>1)draw('text',{x:14,y:y(base)+4},base);
    for(let i=0;i<6;i++){
      draw('line',{x1:x(i),x2:x(i),y1:34,y2:34+rows*24,stroke:'currentColor','stroke-width':1.5-i*.13});
      draw('text',{x:x(i),y:48+rows*24},'EADGBe'[i]);
      if(shape.frets[i]<=0)draw('text',{x:x(i),y:23},shape.frets[i]?'×':'○');
    }
    for(const finger of [1,2,3,4]){
      const strings=shape.fingers.flatMap((v,i)=>v===finger && shape.frets[i]>0?[i]:[]);
      if(strings.length>1 && strings.every(i=>shape.frets[i]===shape.frets[strings[0]]))
        draw('line',{x1:x(strings[0]),x2:x(strings.at(-1)),y1:y(shape.frets[strings[0]]),y2:y(shape.frets[strings[0]]),stroke:'var(--accent)','stroke-width':9,'stroke-linecap':'round'});
    }
    shape.frets.forEach((f,i)=>{if(f<=0)return;
      draw('circle',{cx:x(i),cy:y(f),r:9,fill:'var(--accent)'});
      draw('text',{x:x(i),y:y(f)+4,fill:'var(--card)'},shape.fingers[i]);
    });
    return svg;
  }
  function card(c){
    let index=0;
    const el=element('article',null,'card chord-card'),title=element('h2',pretty(symbol(c)));
    const diagram=element('div'),caption=element('p',null,'hint');
    const actions=element('div',null,'chord-actions');
    function paint(){
      diagram.replaceChildren(chart(c.shapes[index],symbol(c)));
      caption.textContent=(c.quality==='major'?'Major · ':c.quality==='minor'?'Minor · ':'')+'Shape '+(index+1)+' of '+c.shapes.length;
    }
    const hear=element('button','Listen');hear.onclick=()=>{
      haltPlayback();stopMetro();
      const positions=c.shapes[index].frets.flatMap((f,i)=>f<0?[]:[{string:6-i,fret:f}]).reverse();
      audition({positions,chord:symbol(c),action:'Strum'});
    };
    const next=element('button','Next shape');next.disabled=c.shapes.length===1;
    next.onclick=()=>{index=(index+1)%c.shapes.length;paint()};
    const open=element('button','Show on fretboard');open.onclick=()=>fretAtlas.openChord(c,index);
    actions.append(hear,next,open);el.append(title,caption,diagram,actions);paint();return el;
  }
  const buttons=[];
  for(const key of ['Essentials',...roots]){
    const b=element('button',pretty(key));b.onclick=()=>{root=key;$('chordSearch').value='';limit=24;render()};
    buttons.push([key,b]);$('chordRoots').append(b);
  }
  function render(){
    if(!data)return;
    const query=normalize($('chordSearch').value);
    for(const [key,b] of buttons)b.setAttribute('aria-pressed',String(!query && key===root));
    if(query){
      results=data.filter(c=>normalize(symbol(c)).toLowerCase().startsWith(query.toLowerCase()));
      results.sort((a,b)=>Number(normalize(symbol(b))===query)-Number(normalize(symbol(a))===query));
    }else results=root==='Essentials'?basics.map(name=>data.find(c=>symbol(c)===name)):data.filter(c=>c.root===root);
    $('chordCards').replaceChildren(...results.slice(0,limit).map(card));
    $('chordCount').textContent=results.length?Math.min(limit,results.length)+' of '+results.length+' chords':'No matching chord. Try a root such as C or a symbol such as Am7.';
    $('moreChords').hidden=results.length<=limit;
  }
  $('chordSearch').oninput=()=>{limit=24;render()};
  $('moreChords').onclick=()=>{const first=limit;limit+=24;render();const h=$('chordCards').children[first]?.querySelector('h2');if(h){h.tabIndex=-1;h.focus()}};
  async function show(){
    if(data){render();return}
    $('chordCount').textContent='Loading chords…';
    try{await load();render()}catch{$('chordCount').textContent='Could not load chord charts. ';const retry=element('button','Retry');retry.onclick=show;$('chordCount').append(retry)}
  }
  return {load,show,symbol,pretty};
})();
