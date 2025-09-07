
var JSZip = function(){ this.files=[]; this._name=''; };
JSZip.prototype.folder=function(name){ var f=new JSZip(); f._name=name; this.files.push(f); return f; };
JSZip.prototype.file=function(name,content){ this.files.push({name:(this._name?this._name+'/':'')+name, content: content}); };
JSZip.prototype._collect=function(prefix){ var out=[]; this.files.forEach(function(it){ if(it instanceof JSZip){ out=out.concat(it._collect(prefix?(prefix+'/'+it._name):it._name)); } else { out.push({name:(prefix?prefix+'/':'')+it.name, content:it.content}); } }); return out; };
JSZip.prototype.generateAsync=function(opts){ var self=this;
  function crc32(buf){ var table = window._crcTable || (window._crcTable=(function(){var c,t=[];for(var n=0;n<256;n++){c=n;for(var k=0;k<8;k++) c = ((c&1)?(0xEDB88320^(c>>>1)):(c>>>1)); t[n]=c>>>0;} return t;})()); var crc=-1; for(var i=0;i<buf.length;i++){ crc = (crc>>>8) ^ table[(crc ^ buf[i]) & 0xFF]; } return (crc^(-1))>>>0; }
  function enc(s){ return new TextEncoder().encode(s); }
  var files=self._collect('');
  var chunks=[]; var central=[]; var offset=0;
  files.forEach(function(f){
    var data = (typeof f.content==='string')? enc(f.content) : (f.content instanceof Uint8Array? f.content : enc(String(f.content||'')));
    var nameBytes = enc(f.name);
    var crc = crc32(data); var size = data.length;
    function p16(n){ chunks.push(new Uint8Array([n&255,(n>>8)&255])); }
    function p32(n){ chunks.push(new Uint8Array([n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255])); }
    chunks.push(new Uint8Array([0x50,0x4b,0x03,0x04, 10,0, 0,0, 0,0, 0,0]));
    p32(crc); p32(size); p32(size);
    p16(nameBytes.length); p16(0);
    chunks.push(nameBytes); chunks.push(data);
    var cen=[]; function c16(n){ cen.push(n&255,(n>>8)&255); } function c32(n){ cen.push(n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255); }
    var nb=nameBytes.length;
    var cenEntry=[0x50,0x4b,0x01,0x02, 0,0, 10,0, 0,0, 0,0, 0,0];
    cen.push.apply(cen, cenEntry); c32(crc); c32(size); c32(size); c16(nb); c16(0); c16(0); c16(0); c16(0); c32(0);
    for(var i=0;i<nb;i++) cen.push(nameBytes[i]);
    central.push(new Uint8Array(cen));
    offset += 30 + nb + size;
  });
  var cenSize=central.reduce((a,c)=>a+c.length,0); var cenStart=offset;
  var outLen=offset+cenSize+22; var out=new Uint8Array(outLen); var pos=0;
  function append(arr){ out.set(arr,pos); pos+=arr.length; }
  chunks.forEach(append); central.forEach(append);
  append(new Uint8Array([0x50,0x4b,0x05,0x06, 0,0, 0,0]));
  var count=files.length; append(new Uint8Array([count&255,(count>>8)&255])); append(new Uint8Array([count&255,(count>>8)&255]));
  append(new Uint8Array([cenSize&255,(cenSize>>8)&255,(cenSize>>16)&255,(cenSize>>24)&255]));
  append(new Uint8Array([cenStart&255,(cenStart>>8)&255,(cenStart>>16)&255,(cenStart>>24)&255])); append(new Uint8Array([0,0]));
  return Promise.resolve(new Blob([out], {type:"application/zip"}));
};


var saveAs = saveAs || (function(view) {
"use strict"; return function(blob, name){ var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href=url; a.download=name||"download"; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 100); }; }(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content));

(function(){
  var SIZES=[
    {key:'300x250',w:300,h:250},{key:'336x280',w:336,h:280},
    {key:'300x600',w:300,h:600},{key:'160x600',w:160,h:600},
    {key:'250x250',w:250,h:250},{key:'200x200',w:200,h:200},
    {key:'728x90',w:728,h:90},{key:'970x90',w:970,h:90},
    {key:'320x50',w:320,h:50},{key:'320x100',w:320,h:100}
  ];
  function el(id){ return document.getElementById(id); }
  function px(n){ return n+'px'; }
  function activeSizes(){
    var a=[]; document.querySelectorAll('#sizes input[type=checkbox]').forEach(function(cb){
      if(cb.checked){ var s=SIZES.find(x=>x.key===cb.dataset.size); if(s) a.push(s); }
    });
    if(!a.length) a.push(SIZES[0]);
    return a;
  }
  function isWide(key){ return ['728x90','970x90','320x50','320x100'].includes(key); }

  var state={};
  SIZES.forEach(function(s){
    state[s.key]={ bgUrl:'',logoUrl:'', bgX:0,bgY:0,bgScale:1, logoX:0,logoY:0,logoScale:1, h:{x:0,y:0,size:28}, s:{x:0,y:0,size:16}, c:{x:0,y:0,size:16} };
  });
  var isPlaying=false;

  function animNodes(){ return document.querySelectorAll('.banner .headline,.banner .subline,.banner .cta'); }
  function presetCss(name, dur){
    dur = parseFloat(dur)||2;
    if(name==='fade') return '.banner .headline,.banner .subline,.banner .cta{animation:fade '+dur+'s ease both} @keyframes fade{0%{opacity:0}100%{opacity:1}}';
    if(name==='slideUp') return '.banner .headline,.banner .subline,.banner .cta{animation:up '+dur+'s ease both} @keyframes up{0%{opacity:0; transform:translate(-50%,-30%)}100%{opacity:1; transform:translate(-50%,-50%)}}';
    if(name==='slideSide') return '.banner .headline,.banner .subline,.banner .cta{animation:side '+dur+'s ease both} @keyframes side{0%{opacity:0; left:0%}100%{opacity:1; left:50%}}';
    if(name==='pop') return '.banner .headline,.banner .subline,.banner .cta{animation:pop '+dur+'s ease both} @keyframes pop{0%{opacity:0; transform:translate(-50%,-50%) scale(.8)}100%{opacity:1; transform:translate(-50%,-50%) scale(1)}}';
    if(name==='combo') return '.banner .headline{animation:up '+dur+'s ease both}.banner .subline{animation:fade '+dur+'s .2s ease both}.banner .cta{animation:pop '+dur+'s .4s ease both}@keyframes up{0%{opacity:0; transform:translate(-50%,-30%)}100%{opacity:1; transform:translate(-50%,-50%)}}@keyframes fade{0%{opacity:0}100%{opacity:1}}@keyframes pop{0%{opacity:0; transform:translate(-50%,-50%) scale(.8)}100%{opacity:1; transform:translate(-50%,-50%) scale(1)}}';
    return '';
  }
  function ensureAnimStyle(){
    var style = document.getElementById('animStyle');
    if(!style){ style=document.createElement('style'); style.id='animStyle'; document.head.appendChild(style); }
    style.textContent = presetCss(el('animPreset').value, el('animDur').value);
  }
  function playAnimations(){ isPlaying=true; animNodes().forEach(n=> n.style.animationPlayState='running'); var t=el('animToggle'); if(t) t.textContent='Pause'; var h=document.getElementById('animToggleHdr'); if(h) h.textContent='Pause'; }
  function pauseAnimations(){ isPlaying=false; animNodes().forEach(n=> n.style.animationPlayState='paused'); var t=el('animToggle'); if(t) t.textContent='Play'; var h=document.getElementById('animToggleHdr'); if(h) h.textContent='Play'; }
  function resetAnimations(){
    var nodes=animNodes(); nodes.forEach(n=>{ n.style.animation='none'; n.style.animationPlayState='paused'; n.style.animationIterationCount=''; });
    void document.body.offsetWidth;
    var loops = Math.min(3, parseInt(el('animLoops').value,10) || 1);
    nodes.forEach(n=>{ n.style.animation=''; n.style.animationIterationCount=String(loops); n.style.animationPlayState = isPlaying?'running':'paused'; });
  }
  function applyPreviewAnim(){ ensureAnimStyle(); resetAnimations(); }

  function readFileAsDataURL(file){
    return new Promise(function(res, rej){
      var fr = new FileReader();
      fr.onload = function(){ res(fr.result); };
      fr.onerror = function(){ rej(fr.error || new Error('read error')); };
      fr.readAsDataURL(file);
    });
  }

  function render(){
    var grid=el('preview'); grid.innerHTML='';
    var gridWide=el('previewWide'); if(gridWide) gridWide.innerHTML='';
    var H=el('headline').value||''; var S=el('subline').value||''; var C=el('cta').value||'';
    var hColor=el('hColor').value; var sColor=el('sColor').value; var cTxt=el('cTextColor').value; var cBg=el('cBgColor').value;

    activeSizes().forEach(function(s){
      var st=state[s.key];
      st.logoUrl = el('logoUrl').value||st.logoUrl;
      st.bgUrl = el('bgUrl').value||st.bgUrl;

      var card=document.createElement('div'); card.className='previewCard';
      var head=document.createElement('div'); head.className='mini'; head.textContent=s.key; card.appendChild(head);
      var canvas=document.createElement('div'); canvas.className='canvas'; canvas.style.width=px(s.w); canvas.style.height=px(s.h); card.appendChild(canvas);
      var banner=document.createElement('div'); banner.className='banner'; banner.dataset.sizeKey=s.key; banner.style.background= st.bgUrl ? ('url(\"'+st.bgUrl+'\") center/cover') : 'linear-gradient(180deg,#17324F,#0A1A2B)'; canvas.appendChild(banner);

      if(st.logoUrl){ var li=document.createElement('img'); li.className='logoImg'; li.src=st.logoUrl; li.style.transform='translate('+st.logoX+'px,'+st.logoY+'px) scale('+st.logoScale+')'; li.dataset.type='logo'; banner.appendChild(li); }

      var hl=document.createElement('div'); hl.className='headline'; hl.textContent=H; hl.style.color=hColor; hl.style.fontSize=px(st.h.size||28); hl.style.transform='translate(calc(-50% + '+(st.h.x||0)+'px), calc(-50% + '+(st.h.y||0)+'px))'; hl.dataset.type='h'; banner.appendChild(hl);
      var sl=document.createElement('div'); sl.className='subline'; sl.textContent=S; sl.style.color=sColor; sl.style.fontSize=px(st.s.size||16); sl.style.transform='translate(calc(-50% + '+(st.s.x||0)+'px), calc(-50% + '+(st.s.y||0)+'px))'; sl.dataset.type='s'; banner.appendChild(sl);
      var ct=document.createElement('div'); ct.className='cta'; ct.textContent=C; ct.style.color=cTxt; ct.style.background=cBg; ct.style.fontSize=px(st.c.size||16); ct.style.transform='translate(calc(-50% + '+(st.c.x||0)+'px), calc(-50% + '+(st.c.y||0)+'px))'; ct.dataset.type='c'; banner.appendChild(ct);

      if(isWide(s.key) && gridWide){ gridWide.appendChild(card); } else { grid.appendChild(card); }
    });

    applyPreviewAnim();
    renderPerSize();
    validate();
  }

  // Dragging
  var dragging=null;
  function onDragStart(e){
    var t=e.target;
    var banner=t.closest('.banner'); if(!banner) return;
    var key=banner.dataset.sizeKey;
    var st=state[key];
    var type=t.dataset.type;
    if(!type){ type='bg'; }
    dragging={key:key,type:type, startX:e.clientX, startY:e.clientY, el:t};
    e.preventDefault();
  }
  function onDragMove(e){
    if(!dragging) return;
    var dx=e.clientX-dragging.startX, dy=e.clientY-dragging.startY;
    var st=state[dragging.key];
    if(dragging.type==='h'){ st.h.x += dx; st.h.y += dy; }
    else if(dragging.type==='s'){ st.s.x += dx; st.s.y += dy; }
    else if(dragging.type==='c'){ st.c.x += dx; st.c.y += dy; }
    else if(dragging.type==='logo'){ st.logoX += dx; st.logoY += dy; }
    else if(dragging.type==='bg'){ st.bgX += dx; st.bgY += dy; }
    dragging.startX=e.clientX; dragging.startY=e.clientY;
    render();
  }
  function onDragEnd(){ dragging=null; }

  document.addEventListener('pointerdown', function(e){
    var t=e.target;
    if(t.classList.contains('headline')||t.classList.contains('subline')||t.classList.contains('cta')){
      t.dataset.type = t.classList.contains('headline')?'h': t.classList.contains('subline')?'s':'c';
      onDragStart(e);
    }else if(t.classList.contains('logoImg')){ t.dataset.type='logo'; onDragStart(e); }
    else if(t.closest('.banner')){ onDragStart(e); }
  });
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd);

  // Double click reset
  document.addEventListener('dblclick', function(e){
    var b=e.target.closest('.banner'); if(!b) return;
    var st=state[b.dataset.sizeKey];
    if(e.target.classList.contains('headline')) st.h={x:0,y:0,size:28};
    else if(e.target.classList.contains('subline')) st.s={x:0,y:0,size:16};
    else if(e.target.classList.contains('cta')) st.c={x:0,y:0,size:16};
    else if(e.target.classList.contains('logoImg')){ st.logoX=0; st.logoY=0; st.logoScale=1; }
    else { st.bgX=0; st.bgY=0; st.bgScale=1; }
    render();
  });

  // Per-size sliders
  function perSizeRow(key, st){
    var wrap=document.createElement('div'); wrap.className='card';
    wrap.innerHTML = '<div class="mini" style="margin-bottom:6px">'+key+'</div>\
      <div class="per-size">\
        <div class="row">Logo: X <input type="range" min="-200" max="200" value="'+st.logoX+'" data-k="'+key+'" data-f="logoX"> Y <input type="range" min="-200" max="200" value="'+st.logoY+'" data-k="'+key+'" data-f="logoY"> Scale <input type="range" min="0.2" max="3" step="0.05" value="'+st.logoScale+'" data-k="'+key+'" data-f="logoScale"></div>\
        <div class="row">BG: X <input type="range" min="-300" max="300" value="'+st.bgX+'" data-k="'+key+'" data-f="bgX"> Y <input type="range" min="-300" max="300" value="'+st.bgY+'" data-k="'+key+'" data-f="bgY"> Scale <input type="range" min="0.2" max="3" step="0.05" value="'+st.bgScale+'" data-k="'+key+'" data-f="bgScale"></div>\
        <div class="row">H: X <input type="range" min="-300" max="300" value="'+(st.h.x||0)+'" data-k="'+key+'" data-f="h.x"> Y <input type="range" min="-300" max="300" value="'+(st.h.y||0)+'" data-k="'+key+'" data-f="h.y"> Size <input type="range" min="10" max="80" value="'+(st.h.size||28)+'" data-k="'+key+'" data-f="h.size"></div>\
        <div class="row">S: X <input type="range" min="-300" max="300" value="'+(st.s.x||0)+'" data-k="'+key+'" data-f="s.x"> Y <input type="range" min="-300" max="300" value="'+(st.s.y||0)+'" data-k="'+key+'" data-f="s.y"> Size <input type="range" min="8" max="60" value="'+(st.s.size||16)+'" data-k="'+key+'" data-f="s.size"></div>\
        <div class="row">CTA: X <input type="range" min="-300" max="300" value="'+(st.c.x||0)+'" data-k="'+key+'" data-f="c.x"> Y <input type="range" min="-300" max="300" value="'+(st.c.y||0)+'" data-k="'+key+'" data-f="c.y"> Size <input type="range" min="10" max="60" value="'+(st.c.size||16)+'" data-k="'+key+'" data-f="c.size"></div>\
      </div>';
    return wrap;
  }
  function renderPerSize(){
    var box=el('perSize'); box.innerHTML='';
    activeSizes().forEach(function(s){ box.appendChild(perSizeRow(s.key, state[s.key])); });
    box.querySelectorAll('input[type=range]').forEach(function(r){
      r.addEventListener('input', function(){
        var k=this.dataset.k, f=this.dataset.f, st=state[k];
        if(f==='logoX') st.logoX=parseFloat(this.value);
        else if(f==='logoY') st.logoY=parseFloat(this.value);
        else if(f==='logoScale') st.logoScale=parseFloat(this.value);
        else if(f==='bgX') st.bgX=parseFloat(this.value);
        else if(f==='bgY') st.bgY=parseFloat(this.value);
        else if(f==='bgScale') st.bgScale=parseFloat(this.value);
        else if(f==='h.x') st.h.x=parseFloat(this.value);
        else if(f==='h.y') st.h.y=parseFloat(this.value);
        else if(f==='h.size') st.h.size=parseFloat(this.value);
        else if(f==='s.x') st.s.x=parseFloat(this.value);
        else if(f==='s.y') st.s.y=parseFloat(this.value);
        else if(f==='s.size') st.s.size=parseFloat(this.value);
        else if(f==='c.x') st.c.x=parseFloat(this.value);
        else if(f==='c.y') st.c.y=parseFloat(this.value);
        else if(f==='c.size') st.c.size=parseFloat(this.value);
        render();
      });
    });
  }

  // Uploads
  var lf=document.getElementById('logoFile'); if(lf){ lf.addEventListener('change', async function(e){ var f=e.target.files&&e.target.files[0]; if(!f) return; try{ var d=await readFileAsDataURL(f); var u=document.getElementById('logoUrl'); if(u){ u.value=d; render(); } }catch(_){}}); }
  var bf=document.getElementById('bgFile'); if(bf){ bf.addEventListener('change', async function(e){ var f=e.target.files&&e.target.files[0]; if(!f) return; try{ var d=await readFileAsDataURL(f); var u=document.getElementById('bgUrl'); if(u){ u.value=d; render(); } }catch(_){}}); }
  var lu=document.getElementById('logoUrl'); if(lu){ lu.addEventListener('input', render); }
  var bu=document.getElementById('bgUrl'); if(bu){ bu.addEventListener('input', render); }

  // Anim controls
  document.getElementById('animToggle').addEventListener('click', function(){ if(isPlaying) pauseAnimations(); else { applyPreviewAnim(); playAnimations(); } });
  var hdrBtn=document.getElementById('animToggleHdr'); if(hdrBtn){ hdrBtn.addEventListener('click', function(){ if(isPlaying) pauseAnimations(); else { applyPreviewAnim(); playAnimations(); } }); }
  var replay=document.getElementById('replayAll'); if(replay){ replay.addEventListener('click', function(){ applyPreviewAnim(); if(isPlaying) playAnimations(); }); }
  document.getElementById('animPreset').addEventListener('change', function(){ applyPreviewAnim(); });
  document.getElementById('animDur').addEventListener('change', function(){ applyPreviewAnim(); });
  document.getElementById('animLoops').addEventListener('change', function(){ applyPreviewAnim(); });

  // Export ZIP (single zip, all sizes)
  function exportZip(){
    var clickUrl = el('clickUrl').value || 'https://example.com';
    var zip = new JSZip();

    activeSizes().forEach(function(s){
      var st=state[s.key];
      var folder=zip.folder(s.key);
      var html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="ad.size" content="width=${s.w},height=${s.h}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${s.key}</title>
  <style>
    html,body{margin:0;padding:0}
    .wrap{position:relative;width:${s.w}px;height:${s.h}px;overflow:hidden;background:${st.bgUrl?'url('+st.bgUrl+') center/cover':'linear-gradient(180deg,#17324F,#0A1A2B)'};font-family:Arial,Helvetica,sans-serif;color:#fff}
    .logo{position:absolute;left:0;top:0;transform:translate(${st.logoX}px,${st.logoY}px) scale(${st.logoScale});max-width:40%;max-height:40%}
    .h{position:absolute;left:50%;top:40%;transform:translate(calc(-50% + ${st.h.x}px), calc(-50% + ${st.h.y}px));color:${el('hColor').value};font-weight:800;font-size:${st.h.size||28}px;white-space:nowrap}
    .s{position:absolute;left:50%;top:55%;transform:translate(calc(-50% + ${st.s.x}px), calc(-50% + ${st.s.y}px));color:${el('sColor').value};font-weight:600;font-size:${st.s.size||16}px;white-space:nowrap}
    .c{position:absolute;left:50%;top:75%;transform:translate(calc(-50% + ${st.c.x}px), calc(-50% + ${st.c.y}px));color:${el('cTextColor').value};background:${el('cBgColor').value};font-weight:700;border-radius:20px;padding:8px 14px;font-size:${st.c.size||16}px}
    a.click{position:absolute;inset:0;display:block;text-decoration:none}
  </style>
</head>
<body>
  <div class="wrap">
    ${st.logoUrl?'<img class="logo" src="'+st.logoUrl+'" alt="logo">':''}
    <div class="h">${escapeHtml(el('headline').value||'')}</div>
    <div class="s">${escapeHtml(el('subline').value||'')}</div>
    <div class="c">${escapeHtml(el('cta').value||'')}</div>
    <a class="click" href="javascript:window.open(window.clickTag)"></a>
  </div>
  <script>window.clickTag="${clickUrl.replace('"','%22')}";</script>
</body>
</html>`;
      folder.file("index.html", html);
    });

    zip.generateAsync({type:"blob"}).then(function(content){
      saveAs(content, "ads_all_sizes_html5.zip");
    });
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function validate(){ var badge=el('badge'); badge.className='badge ok'; badge.textContent='OK — připraveno k exportu'; }
  function on(id,ev,fn){ var x=document.getElementById(id); if(x) x.addEventListener(ev,fn); }
  on('exportZip','click', exportZip); on('exportZipTop','click', exportZip);

  document.addEventListener('DOMContentLoaded', function(){ render(); pauseAnimations(); }, false);

  on('newProject','click', function(){
    Object.keys(state).forEach(function(k){
      state[k]={ bgUrl:'',logoUrl:'', bgX:0,bgY:0,bgScale:1, logoX:0,logoY:0,logoScale:1, h:{x:0,y:0,size:28}, s:{x:0,y:0,size:16}, c:{x:0,y:0,size:16} };
    });
    el('headline').value='Teplo do mrazu'; el('subline').value='Funkční vrstvy 24/7'; el('cta').value='Zjistit více';
    el('logoUrl').value=''; el('bgUrl').value=''; render();
  });
})();