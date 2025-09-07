
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

    for (const s of activeSizes()){
      var st=state[s.key];
      var folder=zip.folder(s.key);

      // Prepare assets (compress if data URLs)
      var q = strict ? 0.65 : 0.8;
      var bgUrlOut = st.bgUrl;
      var logoUrlOut = st.logoUrl;
      if(isDataUrl(st.bgUrl)){
        try{ bgUrlOut = await compressDataUrl(st.bgUrl, {maxW: s.w*2, maxH: s.h*2, mime:'image/jpeg', quality:q}); }catch(_){}
      }
      if(isDataUrl(st.logoUrl)){
        try{ logoUrlOut = await compressDataUrl(st.logoUrl, {maxW: Math.round(s.w*0.6), maxH: Math.round(s.h*0.6), mime:'image/png', quality:0.82}); }catch(_){}
      }

      var html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="ad.size" content="width=${s.w},height=${s.h}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${s.key}</title>
  <style>
    html,body{margin:0;padding:0}
    .wrap{position:relative;width=${s.w}px;height=${s.h}px;overflow:hidden;background:${bgUrlOut?('url('+bgUrlOut+') center/cover'):'linear-gradient(180deg,#17324F,#0A1A2B)'};font-family:Arial,Helvetica,sans-serif;color:#fff}
    .logo{position:absolute;left:0;top:0;transform:translate(${st.logoX}px,${st.logoY}px) scale(${st.logoScale});max-width:40%;max-height:40%}
    .h{position:absolute;left:50%;top:40%;transform:translate(calc(-50% + ${st.h.x}px), calc(-50% + ${st.h.y}px));color:${el('hColor').value};font-weight:800;font-size:${st.h.size||28}px;white-space:nowrap}
    .s{position:absolute;left:50%;top:55%;transform:translate(calc(-50% + ${st.s.x}px), calc(-50% + ${st.s.y}px));color:${el('sColor').value};font-weight:600;font-size:${st.s.size||16}px;white-space:nowrap}
    .c{position:absolute;left:50%;top:75%;transform:translate(calc(-50% + ${st.c.x}px), calc(-50% + ${st.c.y}px));color:${el('cTextColor').value};background:${el('cBgColor').value};font-weight:700;border-radius:20px;padding:8px 14px;font-size:${st.c.size||16}px}
    a.click{position:absolute;inset:0;display:block;text-decoration:none}
  </style>
</head>
<body>
  <div class="wrap">
    ${logoUrlOut?'<img class="logo" src="'+logoUrlOut+'" alt="logo">':''}
    <div class="h">${escapeHtml(el('headline').value||'')}</div>
    <div class="s">${escapeHtml(el('subline').value||'')}</div>
    <div class="c">${escapeHtml(el('cta').value||'')}</div>
    <a class="click" href="javascript:window.open(window.clickTag)"></a>
  </div>
  <script>window.clickTag="${'${clickUrl}'.replace('"','%22')}";</script>
  ${(!isDataUrl(st.bgUrl)&&st.bgUrl)?'<!-- POZOR: Externí BG URL; pro 100% validaci nahraj obrázek jako soubor, aby byl inline. -->':''}
</body>
</html>`;

      folder.file("index.html", html);
      totalBytes += byteLen(html);
    }

    zip.generateAsync({type:"blob"}).then(function(content){
      var name = (totalBytes > 5*1024*1024) ? "ads_all_sizes_html5_OVER_5MB.zip" : "ads_all_sizes_html5.zip";
      saveAs(content, name);
    });
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function validate(){ var badge=el('badge'); badge.className='badge ok'; badge.textContent='OK — připraveno k exportu'; }
  function on(id,ev,fn){ var x=document.getElementById(id); if(x) x.addEventListener(ev,fn); }
  on('exportZip','click', exportZip); on('exportZipTop','click', exportZip);
  on('perSizeToggle','click', function(){ var w=document.getElementById('perSizeWrapper'); var b=document.getElementById('perSizeToggle'); if(!w||!b) return; w.classList.toggle('is-hidden'); b.textContent = w.classList.contains('is-hidden') ? 'Ukázat panel' : 'Skrýt panel'; });

  document.addEventListener('DOMContentLoaded', function(){ render(); pauseAnimations(); }, false);

  on('newProject','click', function(){
    Object.keys(state).forEach(function(k){
      state[k]={ bgUrl:'',logoUrl:'', bgX:0,bgY:0,bgScale:1, logoX:0,logoY:0,logoScale:1, h:{x:0,y:0,size:28}, s:{x:0,y:0,size:16}, c:{x:0,y:0,size:16} };
    });
    el('headline').value='Teplo do mrazu'; el('subline').value='Funkční vrstvy 24/7'; el('cta').value='Zjistit více';
    el('logoUrl').value=''; el('bgUrl').value=''; render();
  });
})();