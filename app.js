(function(){
  'use strict';
  // ---------------- Config ----------------
  var DEFAULT_SIZES = [
    {key:'300x250', w:300, h:250, on:true},
    {key:'320x50', w:320, h:50, on:false},
    {key:'320x100', w:320, h:100, on:false},
    {key:'250x250', w:250, h:250, on:false},
    {key:'200x200', w:200, h:200, on:false},
    {key:'336x280', w:336, h:280, on:false},
    {key:'728x90', w:728, h:90, on:false},
    {key:'970x90', w:970, h:90, on:false},
    {key:'160x600', w:160, h:600, on:false},
    {key:'300x600', w:300, h:600, on:true}
  ];
  var sizes = JSON.parse(JSON.stringify(DEFAULT_SIZES));
  var state = {};
  sizes.forEach(function(s){
    state[s.key] = {
      bgX:0,bgY:0,bgScale:1, logoX:0,logoY:0,logoScale:1,
      h:{x:0,y:0,size:28,color:'#ffffff',font:'Inter'},
      s:{x:0,y:0,size:16,color:'#cfe3ff',font:'Inter'},
      c:{x:0,y:0,size:16,textColor:'#061123',bgColor:'#E4572E',font:'Inter'}
    };
  });
  var fontDataUrl = null; // uploaded WOFF/WOFF2 as data URL
  var inlineLogoData = null, inlineBgData = null; // if uploaded → used for export strict
  var variants = []; // AI copy variants

  function el(id){ return document.getElementById(id); }
  function on(id,ev,fn){ var n=typeof id==='string'?el(id):id; n && n.addEventListener(ev,fn,false); }
  function px(n){ return n+'px'; }
  function parseSizeKey(k){ var a=k.split('x'); return {w:parseInt(a[0],10), h:parseInt(a[1],10)}; }

  // --------------- File helpers ---------------
  function readFileToUrl(input, cb){
    var f = input.files && input.files[0]; if(!f) return;
    var r = new FileReader(); r.onload=function(){ cb(r.result); }; r.readAsDataURL(f);
  }

  var isPlaying = false;
function animNodes(){ return document.querySelectorAll('.banner .headline,.banner .subline,.banner .cta,.banner img'); }
function resetAnimations(){
  var nodes = animNodes();
  nodes.forEach(function(n){ n.style.animation='none'; n.style.animationIterationCount=''; n.style.animationPlayState='paused'; });
  void document.body.offsetWidth;
  var loops = Math.min(3, parseInt(el('animLoops').value,10) || 1);
  nodes.forEach(function(n){ n.style.animation=''; n.style.animationIterationCount=String(loops); n.style.animationPlayState = isPlaying ? 'running' : 'paused'; });
}
function playAnimations(){ isPlaying = true; animNodes().forEach(n=> n.style.animationPlayState='running'); var t=el('animToggle'); if(t) t.textContent='Pause'; }
function pauseAnimations(){ isPlaying = false; animNodes().forEach(n=> n.style.animationPlayState='paused'); var t=el('animToggle'); if(t) t.textContent='Play'; }

// --------------- Animation CSS (preview + export shared) ---------------
  function presetCss(preset, dur){
    var d = parseFloat(dur)||2;
    var delay = 0.2;
    var css='';
    css += '@keyframes fadeIn{from{opacity:0}to{opacity:1}}';
    css += '@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
    css += '@keyframes slideLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}';
    css += '@keyframes slideRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    css += '@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}';
    var h='.headline', s='.subline', c='.cta', l='img[alt="logo"]';
    if(preset==='none') return '';
    if(preset==='fade'){
      return h+','+s+','+c+','+l+'{animation:fadeIn '+d+'s ease both} '+s+'{animation-delay:'+delay+'s} '+c+'{animation-delay:'+(delay*2)+'s} '+l+'{animation-delay:'+(delay*3)+'s}';
    }
    if(preset==='slideUp'){
      return h+','+s+','+c+','+l+'{animation:slideUp '+d+'s ease both} '+s+'{animation-delay:'+delay+'s} '+c+'{animation-delay:'+(delay*2)+'s} '+l+'{animation-delay:'+(delay*3)+'s}';
    }
    if(preset==='slideSide'){
      return h+'{animation:slideLeft '+d+'s ease both} '+s+'{animation:slideLeft '+d+'s ease '+delay+'s both} '+c+'{animation:slideRight '+d+'s ease '+(delay*2)+'s both} '+l+'{animation:slideUp '+d+'s ease '+(delay*3)+'s both}';
    }
    if(preset==='pop'){
      return h+','+s+','+c+','+l+'{animation:pop '+d+'s ease both} '+s+'{animation-delay:'+delay+'s} '+c+'{animation-delay:'+(delay*2)+'s} '+l+'{animation-delay:'+(delay*3)+'s}';
    }
    if(preset==='combo'){
      return h+'{animation:slideLeft '+d+'s ease both} '+s+'{animation:slideRight '+d+'s ease '+delay+'s both} '+c+'{animation:slideUp '+d+'s ease '+(delay*2)+'s both} '+l+'{animation:fadeIn '+d+'s ease '+(delay*3)+'s both}';
    }
    return '';
  }

  function applyPreviewAnim(){
  var style = document.getElementById('animStyle');
  if(!style){ style = document.createElement('style'); style.id='animStyle'; document.head.appendChild(style); }
  style.textContent = presetCss(el('animPreset').value, el('animDur').value);
  resetAnimations();
  if(isPlaying){
    var loops = Math.min(3, parseInt(el('animLoops').value,10) || 1);
    var dur = (parseFloat(el('animDur').value) || 2) + 0.6;
    var stopAfter = Math.min(30, loops * dur);
    setTimeout(function(){ if(isPlaying) pauseAnimations(); }, stopAfter*1000);
  }
}
    style.textContent = presetCss(el('animPreset').value, el('animDur').value);
    // set iteration counts and stop timer for preview
    var loops = Math.min(3, parseInt(el('animLoops').value,10)||1);
    var dur = (parseFloat(el('animDur').value)||2)+0.6;
    var stopAfter = Math.min(30, loops*dur);
    setTimeout(function(){
      document.querySelectorAll('.banner .headline,.banner .subline,.banner .cta,.banner img').forEach(function(n){
        n.style.animationIterationCount = String(loops);
      });
    },0);
    setTimeout(function(){
      document.querySelectorAll('.banner .headline,.banner .subline,.banner .cta,.banner img').forEach(function(n){
        n.style.animationPlayState='paused';
      });
    }, stopAfter*1000);
  }

  // --------------- Preview renderer ---------------
  function activeSizes(){ return sizes.filter(s=>s.on); }
  function render(){
    var grid = el('preview'); grid.innerHTML='';
    var headline=el('headline').value, subline=el('subline').value, cta=el('cta').value;
    var click=el('clickUrl').value, bgCss=el('bg').value;
    var logoUrl=el('logoUrl').value || inlineLogoData, bgUrl=el('bgUrl').value || inlineBgData;

    // sync typography settings to per-size (baseline)
    activeSizes().forEach(function(s){
      var st = state[s.key];
      st.h.size = parseInt(el('hSize').value,10)||st.h.size;
      st.h.color = el('hColor').value||st.h.color;
      st.h.font = el('hFont').value||st.h.font;
      st.s.size = parseInt(el('sSize').value,10)||st.s.size;
      st.s.color = el('sColor').value||st.s.color;
      st.s.font = el('sFont').value||st.s.font;
      st.c.size = parseInt(el('cSize').value,10)||st.c.size;
      st.c.textColor = el('cTextColor').value||st.c.textColor;
      st.c.bgColor = el('cBgColor').value||st.c.bgColor;
      st.c.font = el('cFont').value||st.c.font;
    });

    activeSizes().forEach(function(s){
      var card = document.createElement('div'); card.className='previewCard';
      var head = document.createElement('div'); head.className='previewHead';
      var lab = document.createElement('div'); lab.className='previewLabel'; lab.textContent=s.key.replace('x','×');
      var replay = document.createElement('button'); replay.className='btn ghost'; replay.textContent='↺'; replay.style.padding='4px 8px';
      replay.addEventListener('click', function(){ applyPreviewAnim(); render(); });
      head.appendChild(lab); head.appendChild(replay);

      var canvas = document.createElement('div'); canvas.className='canvas'; canvas.style.width=px(s.w); canvas.style.height=px(s.h);
      var banner = document.createElement('div'); banner.className='banner'; banner.style.background=bgCss; banner.dataset.sizeKey=s.key;

      var tr = state[s.key];
      // BG image
      if(bgUrl){
        var bgImg = document.createElement('img');
        bgImg.alt='bg'; bgImg.style.left='50%'; bgImg.style.top='50%';
        bgImg.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')';
        bgImg.style.transformOrigin='center center'; bgImg.style.height='110%'; bgImg.style.minWidth='110%'; bgImg.style.opacity='.95';
        bgImg.src=bgUrl; banner.appendChild(bgImg);
      }
      // Headline
      var H=document.createElement('div'); H.className='headline'; H.textContent=headline;
      H.style.fontSize=px(tr.h.size); H.style.color=tr.h.color; H.style.fontFamily=tr.h.font;
      H.style.left='50%'; H.style.top='45%'; H.style.transform='translate(calc(-50% + '+tr.h.x+'px), calc(-50% + '+tr.h.y+'px))'; H.style.width='calc(100% - 40px)'; H.style.textAlign='center'; H.style.fontWeight='800';
      // Subline
      var S=document.createElement('div'); S.className='subline'; S.textContent=subline;
      S.style.fontSize=px(tr.s.size); S.style.color=tr.s.color; S.style.fontFamily=tr.s.font;
      S.style.left='50%'; S.style.top='63%'; S.style.transform='translate(calc(-50% + '+tr.s.x+'px), calc(-50% + '+tr.s.y+'px))'; S.style.width='calc(100% - 50px)'; S.style.textAlign='center';
      // CTA
      var C=document.createElement('div'); C.className='cta'; C.textContent=cta;
      C.style.color=tr.c.textColor; C.style.background=tr.c.bgColor; C.style.fontFamily=tr.c.font; C.style.fontSize=px(tr.c.size);
      C.style.bottom=px(Math.max(8, Math.round(s.h*0.05) - tr.c.y)); C.style.left='50%'; C.style.transform='translate(calc(-50% + '+tr.c.x+'px))';
      C.style.padding=px(Math.max(4,Math.round(s.h*0.04)))+' '+px(Math.max(8,Math.round(s.w*0.04)));

      // Logo
      if(logoUrl){
        var L=document.createElement('img'); L.alt='logo'; L.style.left='10px'; L.style.top='10px';
        L.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')'; L.style.height=px(Math.round(s.h*0.12));
        L.style.width='auto'; L.style.opacity='.95'; L.src=logoUrl; banner.appendChild(L);
      }

      banner.appendChild(H); banner.appendChild(S); banner.appendChild(C);
      card.appendChild(head); card.appendChild(canvas); canvas.appendChild(banner); grid.appendChild(card);
    });
    applyPreviewAnim();
    renderPerSize(); validate();
  }

  // --------------- Drag & Drop ---------------
  (function setupDrag(){
    var dragging=null;
    on('preview','pointerdown',function(e){
      var t=e.target; var b=t.closest('.banner'); if(!b) return;
      var key=b.dataset.sizeKey; var type=null;
      if(t.alt==='bg') type='bg'; else if(t.alt==='logo') type='logo';
      else if(t.classList.contains('headline')) type='h';
      else if(t.classList.contains('subline')) type='s';
      else if(t.classList.contains('cta')) type='c'; else return;
      dragging={key:key,type:type,el:t,startX:e.clientX,startY:e.clientY}; e.preventDefault(); t.setPointerCapture && t.setPointerCapture(e.pointerId);
    });
    on('preview','pointermove',function(e){
      if(!dragging) return; var dx=e.clientX-dragging.startX, dy=e.clientY-dragging.startY; var tr=state[dragging.key];
      if(dragging.type==='bg'){ tr.bgX+=dx; tr.bgY+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')'; }
      else if(dragging.type==='logo'){ tr.logoX+=dx; tr.logoY+=dy; dragging.el.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')'; }
      else if(dragging.type==='h'){ tr.h.x+=dx; tr.h.y+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.h.x+'px), calc(-50% + '+tr.h.y+'px))'; }
      else if(dragging.type==='s'){ tr.s.x+=dx; tr.s.y+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.s.x+'px), calc(-50% + '+tr.s.y+'px))'; }
      else if(dragging.type==='c'){ tr.c.x+=dx; tr.c.y+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.c.x+'px))'; }
      dragging.startX=e.clientX; dragging.startY=e.clientY;
    });
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ on('preview',ev,function(){ dragging=null; render(); }); });
  })();

  // --------------- Per-size sliders ---------------
  function renderPerSize(){
    var wrap = el('perSize'); wrap.innerHTML='';
    activeSizes().forEach(function(s){
      var tr=state[s.key]; var mx=Math.max(s.w,s.h);
      var d=document.createElement('div'); d.className='card'; d.style.marginTop='10px';
      d.innerHTML = '<div class="mini" style="margin-bottom:6px">'+s.key.replace("x","×")+'</div>\
      <div class="grid2">\
        <div>\
          <label>BG X</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.bgX+'" data-k="'+s.key+'" data-t="bg" data-f="x">\
          <label>BG Y</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.bgY+'" data-k="'+s.key+'" data-t="bg" data-f="y">\
          <label>BG Scale</label><input type="range" min="50" max="250" value="'+Math.round(tr.bgScale*100)+'" data-k="'+s.key+'" data-t="bg" data-f="s">\
        </div>\
        <div>\
          <label>Logo X</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.logoX+'" data-k="'+s.key+'" data-t="logo" data-f="x">\
          <label>Logo Y</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.logoY+'" data-k="'+s.key+'" data-t="logo" data-f="y">\
          <label>Logo Scale</label><input type="range" min="50" max="250" value="'+Math.round(tr.logoScale*100)+'" data-k="'+s.key+'" data-t="logo" data-f="s">\
        </div>\
      </div>\
      <div class="grid2" style="margin-top:10px">\
        <div>\
          <label>Headline X</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.h.x+'" data-k="'+s.key+'" data-t="h" data-f="x">\
          <label>Headline Y</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.h.y+'" data-k="'+s.key+'" data-t="h" data-f="y">\
          <label>Subline X</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.s.x+'" data-k="'+s.key+'" data-t="s" data-f="x">\
          <label>Subline Y</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.s.y+'" data-k="'+s.key+'" data-t="s" data-f="y">\
        </div>\
        <div>\
          <label>CTA X</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.c.x+'" data-k="'+s.key+'" data-t="c" data-f="x">\
          <label>CTA Y</label><input type="range" min="'+(-mx)+'" max="'+mx+'" value="'+tr.c.y+'" data-k="'+s.key+'" data-t="c" data-f="y">\
        </div>\
      </div>';
      wrap.appendChild(d);
    });
    wrap.querySelectorAll('input[type=range]').forEach(function(r){
      r.addEventListener('input', function(e){
        var t=e.target, k=t.getAttribute('data-k'), type=t.getAttribute('data-t'), f=t.getAttribute('data-f'), v=parseInt(t.value,10);
        var tr=state[k];
        if(type==='bg'){ if(f==='x') tr.bgX=v; else if(f==='y') tr.bgY=v; else tr.bgScale=v/100; }
        else if(type==='logo'){ if(f==='x') tr.logoX=v; else if(f==='y') tr.logoY=v; else tr.logoScale=v/100; }
        else if(type==='h'){ if(f==='x') tr.h.x=v; else tr.h.y=v; }
        else if(type==='s'){ if(f==='x') tr.s.x=v; else tr.s.y=v; }
        else if(type==='c'){ if(f==='x') tr.c.x=v; else tr.c.y=v; }
        render();
      }, false);
    });
  }

  // --------------- Sizes toggles ---------------
  (function setupSizes(){
    var cont = document.getElementById('sizes');
    cont.querySelectorAll('input[type=checkbox]').forEach(function(cb){
      cb.addEventListener('change', function(){
        var key=cb.getAttribute('data-size'); var s = sizes.find(x=>x.key===key); if(s){ s.on=cb.checked; render(); }
      });
    });
  })();

  // --------------- Extract (logo + colors) ---------------
  function urlsFrom(origin, paths){ return paths.map(p=> origin.replace(/\/$/,'') + p); }
  function tryLoadImage(url){ return new Promise(function(resolve){ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ resolve({ok:true,url, img}) }; img.onerror=function(){ resolve({ok:false,url}) }; img.src=url; }); }
  async function firstImage(cands){ for (var i=0;i<cands.length;i++){ var r=await tryLoadImage(cands[i]); if(r.ok) return r; } return null; }
  function dominantColor(img){
    try{
      var c=document.createElement('canvas'); var ctx=c.getContext('2d'); c.width=img.naturalWidth; c.height=img.naturalHeight;
      ctx.drawImage(img,0,0); var data=ctx.getImageData(0,0,c.width,c.height).data;
      var r=0,g=0,b=0,count=0; for(var i=0;i<data.length;i+=16){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
      r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
      return '#'+[r,g,b].map(x=>('0'+x.toString(16)).slice(-2)).join('');
    }catch(e){ return null; }
  }
  async function smartExtract(rawUrl){
    try{
      if(!rawUrl) return;
      var u = new URL(rawUrl); el('clickUrl').value = rawUrl;
      var logos = urlsFrom(u.origin, ['/favicon.ico','/favicon.png','/apple-touch-icon.png','/logo.png','/assets/logo.png','/static/logo.png','/img/logo.png','/images/logo.png','/brand/logo.png']);
      var heros = urlsFrom(u.origin, ['/og-image.jpg','/og-image.png','/banner.jpg','/banner.png','/images/hero.jpg','/images/kv.jpg']);
      var L = await firstImage(logos); if(L && L.ok){ el('logoUrl').value=L.url; var dom=dominantColor(L.img); if(dom){ el('cBgColor').value=dom; } }
      var H = await firstImage(heros); if(H && H.ok){ el('bgUrl').value=H.url; }
      render();
    }catch(e){ console.warn('smartExtract error',e); render(); }
  }

  // --------------- AI Copy variants ---------------
  function addVariant(obj){
    variants.push(obj); renderVariants();
  }
  function renderVariants(){
    var v=el('variants'); v.innerHTML='';
    if(variants.length===0){
      // seed with 3 defaults based on current inputs
      addVariant({type:'brand', h: 'Teplo do mrazu', s:'Funkční vrstvy 24/7', c:'Zjistit více'});
      addVariant({type:'promo', h:'Sleva až 50 %', s:'Dnes doprava zdarma', c:'Nakoupit teď'});
      addVariant({type:'produkt', h:'Nepromokavé bundy', s:'Nová kolekce na horách', c:'Prohlédnout'});
      return;
    }
    variants.forEach(function(x,idx){
      var card=document.createElement('div'); card.className='vcard';
      card.innerHTML = '<div class="mini">'+x.type.toUpperCase()+'</div>\
        <div class="grid2">\
          <div><label>Headline</label><input data-i="'+idx+'" data-f="h" type="text" value="'+x.h+'"></div>\
          <div><label>Subline</label><input data-i="'+idx+'" data-f="s" type="text" value="'+x.s+'"></div>\
        </div>\
        <div class="grid2" style="margin-top:6px">\
          <div><label>CTA</label><input data-i="'+idx+'" data-f="c" type="text" value="'+x.c+'"></div>\
          <div class="row" style="align-items:flex-end;justify-content:flex-end"><button class="btn ghost" data-act="apply" data-i="'+idx+'">Použít</button><button class="btn" data-act="del" data-i="'+idx+'">Smazat</button></div>\
        </div>';
      v.appendChild(card);
    });
    v.querySelectorAll('input').forEach(function(inp){
      inp.addEventListener('input', function(e){
        var i=parseInt(e.target.getAttribute('data-i'),10); var f=e.target.getAttribute('data-f'); variants[i][f]=e.target.value;
      });
    });
    v.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(e){
        var act=e.target.getAttribute('data-act'); var i=parseInt(e.target.getAttribute('data-i'),10);
        if(act==='apply'){ el('headline').value=variants[i].h; el('subline').value=variants[i].s; el('cta').value=variants[i].c; render(); }
        if(act==='del'){ variants.splice(i,1); renderVariants(); }
      });
    });
  }
  function variantFromKw(kw){
    kw = (kw||'').toLowerCase();
    var hasSale = /sleva|-%|percent|akce/.test(kw);
    var hasTech = /nepromok|membr|softshell|gore|primaloft|hardshell|merino|outdoor/.test(kw);
    var product = /bunda|kalhot|mikina|boty|rukavic/.test(kw) ? kw.split(',')[0].trim() : 'Nová kolekce';
    var h = hasSale ? 'Sleva až 50 %' : (hasTech ? 'Spolehněte se na výkon' : product);
    var s = hasSale ? 'Jen dnes doprava zdarma' : (hasTech ? 'Sucho a teplo v každém kroku' : 'Styl a funkčnost na každý den');
    var c = hasSale ? 'Využít slevu' : (hasTech ? 'Zjistit víc' : 'Prohlédnout');
    return {type:'custom', h:h, s:s, c:c};
  }

  // --------------- Contrast check (CTA) ---------------
  function hexToRgb(hex){ var h=hex.replace('#',''); if(h.length===3){ h=h.split('').map(x=>x+x).join(''); } var n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  function luminance(r,g,b){ r/=255; g/=255; b/=255; [r,g,b]=[r,g,b].map(v=> v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return 0.2126*r+0.7152*g+0.0722*b; }
  function contrastRatio(hex1,hex2){ var a=luminance(...Object.values(hexToRgb(hex1))), b=luminance(...Object.values(hexToRgb(hex2))); var L1=Math.max(a,b)+0.05, L2=Math.min(a,b)+0.05; return L1/L2; }

  // --------------- Export ZIP ----------------
  function crc32(buf){ var table=(function(){var c,t=new Uint32Array(256);for(var n=0;n<256;n++){c=n;for(var k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t;})(); var crc=0^(-1);for(var i=0;i<buf.length;i++)crc=(crc>>>8)^table[(crc^buf[i])&0xFF];return (crc^(-1))>>>0; }
  function strToU8(s){return new TextEncoder().encode(s)}
  function le(n,b){var a=new Uint8Array(b);for(var i=0;i<b;i++)a[i]=(n>>>(8*i))&0xFF;return a}
  function cat(ch){var tot=0;ch.forEach(c=>tot+=c.length);var out=new Uint8Array(tot),o=0;ch.forEach(c=>{out.set(c,o);o+=c.length});return out}
  function makeZip(files){
    var locals=[],centrals=[],off=0,t=0,d=0;
    files.forEach(f=>{
      var name=strToU8(f.name); var data=f.data; var crc=crc32(data); var sz=data.length;
      var lh=cat([strToU8('PK\\x03\\x04'),le(20,2),le(0,2),le(0,2),le(t,2),le(d,2),le(crc,4),le(sz,4),le(sz,4),le(name.length,2),le(0,2)]);
      var local=cat([lh,name,data]); locals.push(local);
      var ch=cat([strToU8('PK\\x01\\x02'),le(20,2),le(20,2),le(0,2),le(0,2),le(t,2),le(d,2),le(crc,4),le(sz,4),le(sz,4),le(name.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(off,4)]);
      centrals.push(cat([ch,name])); off+=local.length;
    });
    var central=cat(centrals), localsCat=cat(locals);
    var end=cat([strToU8('PK\\x05\\x06'),le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(central.length,4),le(localsCat.length,4),le(0,2)]);
    return new Blob([localsCat,central,end],{type:'application/zip'});
  }
  function minify(str){ return String(str).replace(/\\n+/g,'').replace(/\\s{2,}/g,' '); }

  function int(n){ return Math.round(n); }
  function htmlForSize(w,h, opts){
    var tr=state[w+'x'+h];
    var anim = presetCss(opts.animPreset, opts.animDur);
    var loops = Math.min(3, parseInt(opts.animLoops,10)||1);
    var stopAfter = Math.min(30, (loops*((parseFloat(opts.animDur)||2)+0.6))); // seconds
    var fontFace = opts.fontDataUrl ? ('@font-face{font-family:CustomFont;src:url('+opts.fontDataUrl+') format(\"'+(opts.fontDataUrl.split(';')[0].endsWith('woff2')?'woff2':'woff')+'\");font-weight:normal;font-style:normal;font-display:swap}') : '';
    var hFont = (opts.hFont==='Inter'&&opts.fontDataUrl)?'CustomFont':opts.hFont;
    var sFont = (opts.sFont==='Inter'&&opts.fontDataUrl)?'CustomFont':opts.sFont;
    var cFont = (opts.cFont==='Inter'&&opts.fontDataUrl)?'CustomFont':opts.cFont;
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
      '<meta name="ad.size" content="width='+w+',height='+h+'">'+
      '<title>banner</title>'+
      '<style>'+fontFace+
      ':root{--w:'+w+'px;--h:'+h+'px}*{box-sizing:border-box}html,body{margin:0;width:var(--w);height:var(--h);overflow:hidden}'+
      '.banner{position:relative;width:var(--w);height:var(--h);background:'+opts.bgCss+';color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden}'+
      '.headline{position:absolute;left:50%;top:45%;transform:translate(calc(-50% + '+tr.h.x+'px), calc(-50% + '+tr.h.y+'px));width:calc(var(--w) - 40px);text-align:center;font-weight:800;line-height:1.1;font-size:'+tr.h.size+'px;color:'+tr.h.color+';font-family:'+hFont+'}'+
      '.subline{position:absolute;left:50%;top:63%;transform:translate(calc(-50% + '+tr.s.x+'px), calc(-50% + '+tr.s.y+'px));width:calc(var(--w) - 50px);text-align:center;font-weight:500;line-height:1.2;font-size:'+tr.s.size+'px;color:'+tr.s.color+';font-family:'+sFont+'}'+
      '.cta{position:absolute;left:50%;bottom:'+Math.max(8,int(h*0.05)-tr.c.y)+'px;transform:translate(calc(-50% + '+tr.c.x+'px));padding:'+Math.max(4,int(h*0.04))+'px '+Math.max(8,int(w*0.04))+'px;border-radius:999px;background:'+tr.c.bgColor+';color:'+tr.c.textColor+';font-weight:800;font-size:'+tr.c.size+'px;letter-spacing:.2px;font-family:'+cFont+';box-shadow:0 6px 14px rgba(0,0,0,.22)}'+
      '.logo{position:absolute;left:10px;top:10px;transform:translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+');height:'+int(h*0.12)+'px;width:auto;opacity:.95}'+
      (opts.bgUrl?'.bg{position:absolute;left:50%;top:50%;transform:translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+');transform-origin:center center;height:110%;min-width:110%;opacity:.95;z-index:0}':'')+
      anim+
      '</style><script>window.clickTag='+JSON.stringify(opts.clickUrl)+';setTimeout(function(){var b=document.querySelectorAll(\".headline,.subline,.cta,img\");for(var i=0;i<b.length;i++){b[i].style.animationIterationCount=\"'+loops+'\";}},0);setTimeout(function(){var b=document.querySelectorAll(\".headline,.subline,.cta,img\");for(var i=0;i<b.length;i++){b[i].style.animationPlayState=\"paused\";}},'+int(stopAfter*1000)+');<\/script></head><body>'+
      '<a href="javascript:window.open(window.clickTag)" style="text-decoration:none"><div class="banner">'+
      (opts.bgUrl?'<img class="bg" src="'+opts.bgUrl+'" alt="bg"/>':'')+
      '<div class="headline">'+opts.headline+'</div>'+
      '<div class="subline">'+opts.subline+'</div>'+
      '<div class="cta">'+opts.cta+'</div>'+
      (opts.logoUrl?'<img class="logo" src="'+opts.logoUrl+'" alt="logo"/>':'')+
      '</div></a></body></html>';
    return minify(html);
  }

  function totalAnimDuration(){
    var loops=parseInt(el('animLoops').value,10)||1;
    var d=parseFloat(el('animDur').value)||2;
    return loops*(d+0.6);
  }

  function buildFiles(opts){
    var files = [];
    activeSizes().forEach(function(s){
      var html = htmlForSize(s.w,s.h, opts);
      files.push({name: s.w+'x'+s.h+'/index.html', data: strToU8(html)});
    });
    return files;
  }

  function exportZip(){
    var strict = el('strictExport').checked;
    var cr = contrastRatio(el('cTextColor').value, el('cBgColor').value);
    if(cr < 3){ if(!confirm('Kontrast CTA text vs. pozadí je nízký (ratio '+cr.toFixed(2)+'). Pokračovat?')) return; }

    var opts = {
      headline: el('headline').value, subline: el('subline').value, cta: el('cta').value,
      clickUrl: el('clickUrl').value,
      bgCss: el('bg').value,
      logoUrl: inlineLogoData || el('logoUrl').value, bgUrl: inlineBgData || el('bgUrl').value,
      animPreset: el('animPreset').value, animDur: el('animDur').value, animLoops: el('animLoops').value,
      fontDataUrl: fontDataUrl,
      hFont: el('hFont').value, sFont: el('sFont').value, cFont: el('cFont').value
    };

    // Strict export: vyžaduj inline (data URL) pro logo/bg, jinak varuj
    if(strict){
      if(!(/^data:image/.test(opts.logoUrl||'')) && (opts.logoUrl||'').length>0){ alert('Strict export: nahraj logo jako soubor (aby bylo inline v ZIPu).'); return; }
      if(!(/^data:image/.test(opts.bgUrl||'')) && (opts.bgUrl||'').length>0){ alert('Strict export: nahraj pozadí/produkt jako soubor (inline).'); return; }
    }

    var files = buildFiles(opts);
    if(files.length>40){ alert('Překročeno 40 souborů v ZIPu. Zruš některé rozměry.'); return; }
    var total = files.reduce((a,f)=>a+f.data.length,0);
    if(strict && total>150*1024){ alert('Strict export: odhad ZIPu přesahuje 150 kB ('+Math.round(total/1024)+' kB). Zmenši obrázky nebo sniž počet rozměrů.'); return; }
    if(totalAnimDuration()>30){ alert('Celková doba animace by překročila 30 s. Uprav délku/počet loopů.'); return; }

    var blob = makeZip(files);
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='html5ai-banners.zip'; a.click();
  }

  // --------------- Validator ---------------
  function validate(){
    var issues=[];
    var animT=totalAnimDuration(); if(animT>30) issues.push({level:'error',msg:'Animace > 30 s'});
    var badge=el('badge');
    var list=el('issues'); list.innerHTML='';
    if(issues.length===0){ badge.className='badge ok'; badge.textContent='OK — připraveno k exportu'; }
    else{ var err=issues.some(i=>i.level==='error'); badge.className='badge '+(err?'err':'warn'); badge.textContent=err?'Problémy — zkontroluj níže':'Varování'; issues.forEach(function(i){ var li=document.createElement('li'); li.textContent='['+i.level.toUpperCase()+'] '+i.msg; list.appendChild(li); }); }
  }

  // --------------- Events ---------------
  ['headline','subline','cta','clickUrl','bg','hSize','hColor','hFont','sSize','sColor','sFont','cSize','cTextColor','cBgColor','cFont','animPreset','animDur','animLoops'].forEach(function(id){
    on(id,'input', function(){ render(); });
    on(id,'change', function(){ render(); });
  });
  on('logoFile','change', function(e){ readFileToUrl(e.target, function(url){ el('logoUrl').value=url; inlineLogoData=url; render(); }); });
  on('bgFile','change', function(e){ readFileToUrl(e.target, function(url){ el('bgUrl').value=url; inlineBgData=url; render(); }); });
  on('fontFile','change', function(e){ readFileToUrl(e.target, function(url){ fontDataUrl=url; render(); }); });
  on('importUrl','click', function(){ smartExtract(el('brandUrl').value||''); });
  on('exportZip','click', exportZip);
  on('exportZipTop','click', exportZip);
  on('animToggle','click', function(){ if(isPlaying) pauseAnimations(); else playAnimations(); });
  on('animPreset','change', function(){ applyPreviewAnim(); });
  on('animDur','change', function(){ applyPreviewAnim(); });
  on('animLoops','change', function(){ applyPreviewAnim(); });
  on('replayAll','click', function(){ applyPreviewAnim(); render(); });

  on('genKw','click', function(){
    var v = variantFromKw(el('kw').value||''); addVariant(v);
  });

  document.addEventListener('DOMContentLoaded', function(){ render(); renderVariants(); isPlaying=false; applyPreviewAnim(); pauseAnimations(); }, false);
})();