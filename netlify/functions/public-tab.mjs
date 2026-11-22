const LIMIT=2_000_000;
export function tabURL(input){
  let u;
  try{u=new URL(input)}catch{return null}
  if(u.protocol!=='https:' || !['tabs.ultimate-guitar.com','www.ultimate-guitar.com','ultimate-guitar.com'].includes(u.hostname) || u.port || u.username || u.password)return null;
  if(!/^\/tab\/(?:[a-z0-9_-]+\/)?[a-z0-9_-]+-\d+\/?$/i.test(u.pathname))return null;
  return 'https://tabs.ultimate-guitar.com'+u.pathname.replace(/\/$/,'');
}
function decode(text){
  const named={quot:'"',apos:"'",amp:'&',lt:'<',gt:'>',nbsp:' '};
  return text.replace(/&(quot|apos|amp|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi,(s,k)=>{
    if(k[0]!=='#')return named[k.toLowerCase()]??s;
    const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):Number(k.slice(1));
    return n>0 && n<=0x10ffff?String.fromCodePoint(n):s;
  });
}
export function parseTab(html,url){
  const tag=html.match(/<div\b(?=[^>]*\bclass\s*=\s*["'][^"']*\bjs-store\b)[^>]*>/i)?.[0];
  const data=tag?.match(/\bdata-content\s*=\s*(["'])([\s\S]*?)\1/i)?.[2];
  if(!data)throw Error('The public page did not provide a readable arrangement.');
  const page=JSON.parse(decode(data))?.store?.page?.data;
  const tab=page?.tab,view=page?.tab_view;
  if(!tab || String(tab.id)!==url.match(/-(\d+)$/)[1])throw Error('Could not verify the arrangement on this page.');
  if(!['Chords','Tab'].includes(tab.type))throw Error('Choose a public text tab or chord sheet.');
  const content=view?.wiki_tab?.content;
  if(typeof content!=='string'||!content.trim())throw Error('The public page did not include arrangement text.');
  if(content.length>120000)throw Error('This arrangement exceeds the import size limit.');
  const meta=view.meta||{};
  const tuning=typeof meta.tuning?.value==='string'?'Tuning '+meta.tuning.value:'';
  const capo=meta.capo && /^\d{1,2}$/.test(String(meta.capo))?'Capo '+meta.capo:'';
  return {url,setup:[tuning,capo].filter(Boolean).join(' · ').slice(0,150),title:String(tab.song_name||'Untitled arrangement').slice(0,180),artist:String(tab.artist_name||'').slice(0,180),type:tab.type,content};
}
export default async function handler(req){
  const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
  if(req.method!=='GET')return reply({error:'Use GET.'},405);
  const url=tabURL(new URL(req.url).searchParams.get('url'));
  if(!url)return reply({error:'Paste an HTTPS link to a specific Ultimate Guitar arrangement.'},400);
  try{
    const res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'text/html','User-Agent':'FretboardFixer/1.0 (public tab preview)'}});
    if(!res.ok||!res.body)return reply({error:'Ultimate Guitar did not return a public arrangement.'},422);
    const reader=res.body.getReader(),decoder=new TextDecoder();let size=0,html='';
    for(;;){
      const {value,done}=await reader.read();if(done)break;
      size+=value.length;if(size>LIMIT){await reader.cancel();return reply({error:'The source page is too large.'},422)}
      html+=decoder.decode(value,{stream:true});
    }
    return reply(parseTab(html+decoder.decode(),url));
  }catch(err){
    const msg=err instanceof SyntaxError?'The public page format was unreadable.':err.message;
    return reply({error:msg||'The source page could not be read.'},422);
  }
}
