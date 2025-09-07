(function(){
  const SIZES=[
    {key:'300x250',w:300,h:250},{key:'336x280',w:336,h:280},
    {key:'300x600',w:300,h:600},{key:'160x600',w:160,h:600},
    {key:'250x250',w:250,h:250},{key:'200x200',w:200,h:200},
    {key:'728x90',w:728,h:90},{key:'970x90',w:970,h:90},
    {key:'320x50',w:320,h:50},{key:'320x100',w:320,h:100},
  ];
  const WIDE=new Set(['728x90','970x90']);
  const state={}; SIZES.forEach(s=>state[s.key]={logo:'',bg:''});

  const el=id=>document.getElementById(id);
  const $=sel=>document.querySelector(sel);
  function isWide(k){return WIDE.has(k);}
  function mountSizes(){
    const box=el('sizes'); box.innerHTML='';
    SIZES.forEach(s=>{
      const lab=document.createElement('label');
      const checked=['300x250','336x280','300x600','728x90','970x90'].includes(s.key)?'checked':'';
      lab.innerHTML=`<input type="checkbox" data-size="${s.key}" ${checked}/> ${s.key}`;
      box.appendChild(lab);
    });
    box.addEventListener('change',()=>{render();updateExportEnabled();});
  }
  mountSizes();
  function activeSizes(){
    const a=[]; document.querySelectorAll('#sizes input[type=checkbox]').forEach(cb=>{
      if(cb.checked){ const k=(cb.dataset.size||'').replace('×','x'); const s=SIZES.find(x=>x.key===k); if(s) a.push(s); }
    });
    if(!a.length) a.push(SIZES[0]);
    return a;
  }
  function updateExportEnabled(){
    const any=activeSizes().length>0;
    ['exportDisplay','exportDisplayTop','exportPmax','exportPmaxTop','exportPmaxHtml','exportPmaxHtmlTop'].forEach(id=>{
      const b=el(id); if(b) b.disabled=!any;
    });
  }

  function readFileAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);});}
  el('logoFile').addEventListener('change', async e=>{const f=e.target.files[0]; if(!f) return; const d=await readFileAsDataURL(f); Object.keys(state).forEach(k=>state[k].logo=d); render();});
  el('bgFile').addEventListener('change', async e=>{const f=e.target.files[0]; if(!f) return; const d=await readFileAsDataURL(f); Object.keys(state).forEach(k=>state[k].bg=d); render();});

  function render(){
    const pv=el('preview'); const pw=el('previewWide'); pv.innerHTML=''; pw.innerHTML='';
    const H=el('headline').value||''; const S=el('subline').value||''; const C=el('cta').value||'';
    const hc=el('hColor').value, sc=el('sColor').value, ctc=el('cTextColor').value, cbc=el('cBgColor').value;
    activeSizes().forEach(s=>{
      const card=document.createElement('div'); card.className='previewCard';
      card.innerHTML=`<div class="mini">${s.key}</div><div class="canvas" style="width:${s.w}px;height:${s.h}px"><div class="banner"></div></div>`;
      const b=card.querySelector('.banner');
      if(state[s.key].bg) b.style.background=`url(${state[s.key].bg}) center/cover`;
      if(state[s.key].logo){ const img=document.createElement('img'); img.className='logoImg'; img.src=state[s.key].logo; b.appendChild(img); }
      const h=document.createElement('div'); h.className='headline'; h.textContent=H; h.style.color=hc; h.style.fontSize=(s.h*0.18>28?28:Math.max(14,Math.round(s.h*0.14)))+'px';
      const sb=document.createElement('div'); sb.className='subline'; sb.textContent=S; sb.style.color=sc; sb.style.fontSize=(s.h*0.12>18?18:Math.max(10,Math.round(s.h*0.1)))+'px';
      const cta=document.createElement('div'); cta.className='cta'; cta.textContent=C; cta.style.background=cbc; cta.style.color=ctc; cta.style.fontSize=Math.max(10,Math.round(s.h*0.1))+'px';
      b.appendChild(h); b.appendChild(sb); b.appendChild(cta);
      (isWide(s.key)?pw:pv).appendChild(card);
    });
    updateExportEnabled();
  }
  render();

  async function loadImg(url){return new Promise(r=>{const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>r(i); i.onerror=()=>r(null); i.src=url;});}
  async function toWebP(dataUrl, maxW, maxH, q){
    try{ const img=await loadImg(dataUrl); if(!img) return dataUrl;
      const scale=Math.min(1, maxW/img.width, maxH/img.height);
      const w=Math.max(1, Math.round(img.width*scale)), h=Math.max(1, Math.round(img.height*scale));
      const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      return c.toDataURL('image/webp', Math.max(0.35, Math.min(0.95, q||0.8)));
    }catch(e){ return dataUrl; }
  }
  function byteLen(str){ return new TextEncoder().encode(str).length; }

  // ---- Builders ----
  function buildHtmlForSize(s, clickUrl, colors, assets, extraMeta){
    const metaExtra = extraMeta||'';
    const bg = assets.bg?`url(${assets.bg}) center/cover`:'linear-gradient(180deg,#17324F,#0A1A2B)';
    const logo = assets.logo?`<img class="logo" src="${assets.logo}" alt="logo">`:'';
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="ad.size" content="width=${s.w},height=${s.h}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${metaExtra}
  <title>${s.key}</title>
  <style>
    html,body{margin:0;padding:0}
    .wrap{position:relative;width:${s.w}px;height:${s.h}px;overflow:hidden;background:${bg};font-family:Arial,Helvetica,sans-serif;color:#fff}
    .logo{position:absolute;left:10px;top:10px;max-width:40%;max-height:40%}
    .h{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-weight:800;font-size:${Math.max(14,Math.round(s.h*0.14))}px;color:${colors.h};white-space:nowrap}
    .s{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);font-weight:600;font-size:${Math.max(10,Math.round(s.h*0.1))}px;color:${colors.s};white-space:nowrap}
    .c{position:absolute;left:50%;top:75%;transform:translate(-50%,-50%);font-weight:700;font-size:${Math.max(10,Math.round(s.h*0.1))}px;color:${colors.ctaText};background:${colors.ctaBg};border-radius:20px;padding:8px 14px;white-space:nowrap}
    a.click{position:absolute;inset:0;display:block;text-decoration:none}
  </style>
</head>
<body>
  <div class="wrap">
    ${logo}
    <div class="h">${escapeHtml(el('headline').value||'')}</div>
    <div class="s">${escapeHtml(el('subline').value||'')}</div>
    <div class="c">${escapeHtml(el('cta').value||'')}</div>
    <a class="click" href="javascript:window.open(window.clickTag)"></a>
  </div>
  <script>window.clickTag="${(el('clickUrl').value||'https://example.com').replace('"','%22')}";</script>
</body>
</html>`;
  }
  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ---- Export: Display (HTML5 per size) ----
  async function exportDisplay(){
    const clickUrl=el('clickUrl').value||'https://example.com';
    const colors={h:el('hColor').value,s:el('sColor').value,ctaText:el('cTextColor').value,ctaBg:el('cBgColor').value};
    const master=new JSZip();
    for(const s of activeSizes()){
      let bg = state[s.key].bg, logo = state[s.key].logo;
      const z=new JSZip();
      const html=buildHtmlForSize(s, clickUrl, colors, {bg,logo});
      z.file('index.html', html);
      const blob=await z.generateAsync({type:'blob'});
      saveAs(blob, s.key+'.zip');
      master.file(s.key+'.zip', await blob.arrayBuffer());
    }
    const all=await master.generateAsync({type:'blob'});
    saveAs(all, 'display_all_sizes.zip');
  }

  // ---- Export: P-Max (PNG/JPG pack) ----
  async function exportPmaxPNGs(){
    const strict=el('strictExport').checked;
    const colors={h:el('hColor').value,s:el('sColor').value,ctaText:el('cTextColor').value,ctaBg:el('cBgColor').value};
    const pack=new JSZip();
    for(const s of activeSizes()){
      const c=document.createElement('canvas'); c.width=s.w; c.height=s.h; const ctx=c.getContext('2d');
      // background
      if(state[s.key].bg){ const img=await loadImg(state[s.key].bg);
        if(img){ const scale=Math.max(s.w/img.width, s.h/img.height); const dw=img.width*scale, dh=img.height*scale, dx=(s.w-dw)/2, dy=(s.h-dh)/2; ctx.drawImage(img,dx,dy,dw,dh); }
      }else{ const g=ctx.createLinearGradient(0,0,0,s.h); g.addColorStop(0,'#17324F'); g.addColorStop(1,'#0A1A2B'); ctx.fillStyle=g; ctx.fillRect(0,0,s.w,s.h); }
      // logo
      if(state[s.key].logo){ const li=await loadImg(state[s.key].logo); if(li){ const mw=s.w*0.4, mh=s.h*0.4; const scale=Math.min(mw/li.width, mh/li.height); ctx.drawImage(li,10,10, li.width*scale, li.height*scale); } }
      // texts
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=colors.h; ctx.font='800 '+Math.max(14,Math.round(s.h*0.14))+'px Arial'; ctx.fillText(el('headline').value||'', s.w/2, s.h*0.40);
      ctx.fillStyle=colors.s; ctx.font='600 '+Math.max(10,Math.round(s.h*0.1))+'px Arial'; ctx.fillText(el('subline').value||'', s.w/2, s.h*0.55);
      // CTA rounded
      const txt=el('cta').value||''; ctx.font='700 '+Math.max(10,Math.round(s.h*0.1))+'px Arial';
      const tw=ctx.measureText(txt).width, th=Math.max(10,Math.round(s.h*0.1)), padX=14,padY=8, bw=tw+padX*2, bh=th+padY*2;
      const bx=s.w/2, by=s.h*0.75, r=Math.min(20,bh/2);
      ctx.fillStyle=colors.ctaBg; ctx.beginPath();
      ctx.moveTo(bx-bw/2+r,by-bh/2); ctx.arcTo(bx+bw/2,by-bh/2,bx+bw/2,by+bh/2,r); ctx.arcTo(bx+bw/2,by+bh/2,bx-bw/2,by+bh/2,r); ctx.arcTo(bx-bw/2,by+bh/2,bx-bw/2,by-bh/2,r); ctx.arcTo(bx-bw/2,by-bh/2,bx+bw/2,by-bh/2,r); ctx.closePath(); ctx.fill();
      ctx.fillStyle=colors.ctaText; ctx.fillText(txt, bx, by+1);
      const mime = strict ? 'image/jpeg' : 'image/png';
      const data=c.toDataURL(mime, strict?0.85:1.0);
      const b64=data.split(',')[1]; const bin=Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
      pack.file(s.key+(strict?'.jpg':'.png'), bin);
    }
    const out=await pack.generateAsync({type:'blob'});
    saveAs(out,'pmax_images.zip');
  }

  // ---- Export: P-Max HTML5 (<=600kB/ad, metas) ----
  async function exportPmaxHTML5(){
    const colors={h:el('hColor').value,s:el('sColor').value,ctaText:el('cTextColor').value,ctaBg:el('cBgColor').value};
    const LIMIT=600*1024;
    const metas = '<meta name="productType" content="dynamic">\\n  <meta name="vertical" content="RETAIL">\\n  <meta name="responsive" content="true">';
    for(const s of activeSizes()){
      let p={bgScale:2.0, logoScale:0.6, qBg:0.75, qLogo:0.85};
      const min={bgScale:1.0, logoScale:0.4, qBg:0.35, qLogo:0.6};
      const step={bgScale:0.9, logoScale:0.95, qBg:0.9, qLogo:0.92};
      async function buildOnce(){
        let bg=state[s.key].bg, logo=state[s.key].logo;
        if(bg) bg = await toWebP(bg, Math.round(s.w*p.bgScale), Math.round(s.h*p.bgScale), p.qBg);
        if(logo) logo = await toWebP(logo, Math.round(s.w*p.logoScale), Math.round(s.h*p.logoScale), p.qLogo);
        const html = buildHtmlForSize(s, el('clickUrl').value||'https://example.com', colors, {bg,logo}, metas);
        return {html, len: byteLen(html)};
      }
      let built=null;
      for(let i=0;i<7;i++){
        built=await buildOnce();
        if(built.len<=LIMIT) break;
        p.qBg=Math.max(min.qBg, p.qBg*step.qBg);
        p.qLogo=Math.max(min.qLogo, p.qLogo*step.qLogo);
        p.bgScale=Math.max(min.bgScale, p.bgScale*step.bgScale);
        p.logoScale=Math.max(min.logoScale, p.logoScale*step.logoScale);
      }
      const z=new JSZip(); z.file('index.html', built.html);
      const blob=await z.generateAsync({type:'blob'});
      saveAs(blob, s.key+'_pmax.html5.zip');
    }
  }

  // wire buttons
  function wire(){
    ['exportDisplay','exportDisplayTop'].forEach(id=>{const b=el(id); if(b) b.addEventListener('click', exportDisplay);});
    ['exportPmax','exportPmaxTop'].forEach(id=>{const b=el(id); if(b) b.addEventListener('click', exportPmaxPNGs);});
    ['exportPmaxHtml','exportPmaxHtmlTop'].forEach(id=>{const b=el(id); if(b) b.addEventListener('click', exportPmaxHTML5);});
    updateExportEnabled();
  }
  document.addEventListener('DOMContentLoaded', wire);
})();