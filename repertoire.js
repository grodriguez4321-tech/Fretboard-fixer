(()=>{
  const dialog=$('ugDialog'),list=$('ugList'),reader=$('ugRead'),status=$('ugStatus');
  let request=0,draft=null;
  function sourceURL(raw){
    try{
      const u=new URL(raw.trim());
      if(u.protocol==='https:' && !u.username && !u.password && !u.port &&
        ['ultimate-guitar.com','www.ultimate-guitar.com','tabs.ultimate-guitar.com'].includes(u.hostname) &&
        /^\/tab\/(?:[a-z0-9_-]+\/)?[a-z0-9_-]+-\d+\/?$/i.test(u.pathname))
        return 'https://tabs.ultimate-guitar.com'+u.pathname.replace(/\/$/,'');
    }catch{}
    throw Error('Paste a link to an individual public Ultimate Guitar tab.');
  }
  const entries=()=>Array.isArray(store.ugRepertoire)?store.ugRepertoire:[];
  const id=item=>item.url.match(/-(\d+)$/)?.[1];
  function persist(items){
    const previous=store.ugRepertoire;store.ugRepertoire=items;
    try{save()}catch(e){store.ugRepertoire=previous;throw e}
  }
  function clear(){
    request++;draft=null;reader.replaceChildren();status.textContent='';
    $('ugSave').hidden=$('ugManual').hidden=true;
  }
  function showList(){
    list.replaceChildren();
    if(!entries().length)list.append(element('p','Your saved tab links and arrangements will appear here.','hint'));
    for(const item of entries()){
      const row=element('div',null,'ug-row'),open=element('button',item.title),remove=element('button','Remove');
      open.append(element('small',[item.artist,item.type].filter(Boolean).join(' · ')));
      open.onclick=()=>{
        clear();$('ugForm').hidden=true;$('ugHeading').textContent='Repertoire';dialog.showModal();show(item,false);
      };
      remove.setAttribute('aria-label','Remove '+item.title);
      remove.onclick=()=>{
        if(!confirm('Remove “'+item.title+'” from this device?'))return;
        try{persist(entries().filter(e=>id(e)!==id(item)));showList();$('ugNotice').textContent='Arrangement removed.'}
        catch{$('ugNotice').textContent='Could not save this change.'}
      };
      row.append(open,remove);list.append(row);
    }
  }
  const clean=text=>text.replace(/\[\/?(?:tab|ch)\]/gi,'').replace(/\r/g,'');
  function tabSteps(text){
    const lines=text.split('\n'),steps=[];
    const pattern=/^\s*([eEADGBadgb]?)\s*\|([\d\-~hpb/rxX|()^v\\ .<>:]+)/;
    for(let i=0;i<=lines.length-6;i++){
      const rows=lines.slice(i,i+6).map(line=>line.match(pattern));
      if(rows.some(r=>!r))continue;
      // Require aligned high-to-low string rows. Durations are absent in ASCII tab.
      if(rows.some((r,j)=>r[1] && r[1].toLowerCase()!=='ebgdae'[j]))continue;
      const columns=new Map();
      rows.forEach((row,j)=>{
        for(const match of row[2].matchAll(/\d+/g)){
          const fret=Number(match[0]);if(fret>24)continue;
          const x=match.index;
          if(!columns.has(x))columns.set(x,[]);
          columns.get(x).push(stringNames[j]+' '+(fret?'fret '+fret:'open'));
        }
      });
      steps.push(...[...columns].sort((a,b)=>a[0]-b[0]).map(c=>c[1].join(' + ')));i+=5;
    }
    return steps;
  }
  function youtubeId(value){
    try{
      const url=new URL(value);
      if(url.protocol!=='https:' || url.username || url.password || url.port)return null;
      let key;
      if(url.hostname==='youtu.be')key=url.pathname.slice(1);
      else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(url.hostname)){
        key=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)\/?$/)?.[1];
      }
      return typeof key==='string' && /^[A-Za-z0-9_-]{11}$/.test(key)?key:null;
    }catch{return null}
  }
  function videoExample(item){
    const panel=element('details',null,'ug-video');
    const summary=element('summary','Video example'),body=element('div');
    panel.append(summary,body);
    function render(editing=false){
      body.replaceChildren();
      if(!panel.open)return;
      const saved=entries().find(entry=>id(entry)===id(item))?.videoId;
      const video=typeof saved==='string' && /^[A-Za-z0-9_-]{11}$/.test(saved)?saved:null;
      function update(key){
        try{
          persist(entries().map(entry=>id(entry)===id(item)?{...entry,videoId:key}:entry));
          render();
        }catch{status.textContent='Could not save the video change on this device.'}
      }
      if(video && !editing){
        const player=element('iframe');
        player.title=item.title+' • YouTube example';player.allowFullscreen=true;
        player.allow='encrypted-media; picture-in-picture; fullscreen';
        player.referrerPolicy='strict-origin-when-cross-origin';
        player.src='https://www.youtube-nocookie.com/embed/'+video+'?playsinline=1';
        const open=element('a','Watch on YouTube'),edit=element('button','Change video'),remove=element('button','Remove video');
        open.href='https://www.youtube.com/watch?v='+video;open.target='_blank';open.rel='noopener';
        edit.onclick=()=>render(true);remove.onclick=()=>update(null);
        body.append(player,open,edit,remove);
      }else{
        const search=element('a','Find an example on YouTube');
        search.href='https://www.youtube.com/results?search_query='+encodeURIComponent([item.title,item.artist,'guitar tutorial'].filter(Boolean).join(' '));
        search.target='_blank';search.rel='noopener';
        const form=element('form'),label=element('label','YouTube video link'),input=element('input'),submit=element('button','Save video');
        input.type='url';input.required=true;input.placeholder='Paste a YouTube link';
        if(video)input.value='https://www.youtube.com/watch?v='+video;
        input.oninput=()=>input.setCustomValidity('');
        form.onsubmit=e=>{
          e.preventDefault();const key=youtubeId(input.value);
          if(key)update(key);
          else{input.setCustomValidity('Paste a link to one YouTube video.');input.reportValidity()}
        };
        label.append(input);form.append(label,submit);body.append(search,form);
        if(video){const cancel=element('button','Cancel');cancel.onclick=()=>render();body.append(cancel)}
      }
    }
    panel.ontoggle=()=>render();
    return panel;
  }
  function show(item,preview){
    reader.replaceChildren();const text=clean(item.content),title=element('h3',item.title);
    const source=element('a','Open source arrangement');source.href=sourceURL(item.url);source.target='_blank';source.rel='noopener noreferrer';
    reader.append(title,element('p',[item.artist,item.type,item.setup].filter(Boolean).join(' · '),'hint'),source);
    if(!preview)reader.append(videoExample(item));
    const chords=[...new Set([...item.content.matchAll(/\[ch\]([^\[\]\n]{1,18})\[\/ch\]/gi)].map(m=>m[1].trim()))];
    if(!chords.length){
      const chord=/^[A-G][#b♯♭]?(?:(?:maj|min|dim|aug|sus|add|m|M|[0-9#b()+-])*)(?:\/[A-G][#b♯♭]?)?$/;
      for(const line of text.split('\n')){
        const words=line.trim().split(/\s+/);if(words.every(w=>chord.test(w)))
          for(const w of words)if(!chords.includes(w))chords.push(w);
      }
    }
    const tools=element('div',null,'log-buttons');
    if(chords.length){
      reader.append(element('p','Tap a chord to look up its fingering.'),tools);
      for(const name of chords.slice(0,60)){
        const b=element('button',name);
        b.onclick=()=>{dialog.close();$('chordSearch').value=name;location.hash='chords';chordLibrary.show()};
        tools.append(b);
      }
    }
    const steps=tabSteps(text);
    if(steps.length){
      let n=0;const current=element('p'),prev=element('button','Previous note'),next=element('button','Next note');
      function paint(){current.textContent=(n+1)+' / '+steps.length+' · '+steps[n];prev.disabled=n===0;next.disabled=n===steps.length-1}
      prev.onclick=()=>{n--;paint()};next.onclick=()=>{n++;paint()};paint();
      reader.append(element('p','Step through the fret positions at your own pace.'),current,prev,next);
    }
    reader.append(element('pre',text,'ug-score'));
    if(preview){draft=item;$('ugSave').hidden=false;const exists=entries().some(e=>id(e)===id(item));$('ugSave').textContent=exists?'Update saved arrangement':'Save to repertoire'}
  }
  $('ugAdd').onclick=()=>{
    clear();$('ugForm').hidden=false;$('ugForm').reset();$('ugText').value=$('ugTitle').value='';$('ugHeading').textContent='Add an arrangement';dialog.showModal();$('ugUrl').focus();
  };
  $('ugClose').onclick=()=>dialog.close();dialog.addEventListener('close',clear);
  $('ugUrl').oninput=clear;
  $('ugForm').onsubmit=async e=>{
    e.preventDefault();clear();const token=request;let url;
    try{url=sourceURL($('ugUrl').value)}catch(err){status.textContent=err.message;return}
    status.textContent='Reading public arrangement…';
    try{
      const r=await fetch('/.netlify/functions/public-tab?url='+encodeURIComponent(url));
      const item=await r.json();if(token!==request)return;
      if(!r.ok || !item.content)throw Error(item.error||'Could not read the public arrangement.');
      show({...item,url},true);status.textContent='Preview ready.';
    }catch(err){
      if(token!==request)return;
      status.textContent='Could not import this public page automatically. You can paste your arrangement below.';
      $('ugManual').hidden=false;
    }
  };
  $('ugUseText').onclick=()=>{
    const title=$('ugTitle').value.trim(),content=$('ugText').value.trim();
    if(!title||!content){status.textContent='Enter a title and arrangement text.';return}
    show({title,content,url:sourceURL($('ugUrl').value),type:tabSteps(clean(content)).length?'Tab':'Chord sheet / text'},true);
    $('ugManual').hidden=true;status.textContent='Preview ready.';
  };
  $('ugSave').onclick=()=>{
    if(!draft)return;
    const item=draft,items=entries().slice(),at=items.findIndex(e=>id(e)===id(item));
    if(at<0)items.push(item);else items[at]={...items[at],...item};
    try{persist(items);showList();dialog.close();$('ugNotice').textContent=item.title+' saved to your repertoire.'}
    catch{status.textContent='Device storage is full. Your preview is still open.'}
  };
  showList();
})();
