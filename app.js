(function(){
  'use strict';
  // Sizes & state (bez AI Copy)
  var DEFAULT_SIZES=[
    {key:'300x250',w:300,h:250,on:true},
    {key:'320x50',w:320,h:50,on:false},
    {key:'320x100',w:320,h:100,on:false},
    {key:'250x250',w:250,h:250,on:false},
    {key:'200x200',w:200,h:200,on:false},
    {key:'336x280',w:336,h:280,on:false},
    {key:'728x90',w:728,h:90,on:false},
    {key:'970x90',w:970,h:90,on:false},
    {key:'160x600',w:160,h:600,on:false},
    {key:'300x600',w:300,h:600,on:true}
  ],sizes=JSON.parse(JSON.stringify(DEFAULT_SIZES)),state={},fontDataUrl=null,inlineLogo=null,inlineBg=null;
  sizes.forEach(s=>{state[s.key]={bgX:0,bgY:0,bgScale:1,logoX:0,logoY:0,logoScale:1,h:{x:0,y:0,size:28,color:'#fff',font:'Inter'},s:{x:0,y:0,size:16,color:'#cfe3ff',font:'Inter'},c:{x:0,y:0,size:16,textColor:'#061123',bgColor:'#E4572E',font:'Inter'}}});

  function el(id){return document.getElementById(id)} function on(id,ev,fn){var n=typeof id==='string'?el(id):id;n&&n.addEventListener(ev,fn,false)} function px(n){return n+'px'} function activeSizes(){return sizes.filter(s=>s.on)}

  // Animations (preview & export)
  function presetCss(p,d){d=parseFloat(d)||2;var delay=.2,css='';css+='@keyframes fadeIn{from{opacity:0}to{opacity:1}}';css+='@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';css+='@keyframes slideLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}';css+='@keyframes slideRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';css+='@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}';var h='.headline',s='.subline',c='.cta',l='img[alt=\"logo\"]';if('none'===p)return'';if('fade'===p)return h+','+s+','+c+','+l+'{animation:fadeIn '+d+'s ease both} '+s+'{animation-delay:'+delay+'s} '+c+'{animation-delay:'+2*delay+'s} '+l+'{animation-delay:'+3*delay+'s}';if('slideUp'===p)return h+','+s+','+c+','+l+'{animation:slideUp '+d+'s ease both} '+s+'{animation-delay:'+delay+'s} '+c+'{animation-delay:'+2*delay+'s} '+l+'{animation-delay:'+3*delay+'s}';if('slideSide'===p)return h+'{animation:slideLeft '+d+'s ease both} '+s+'{animation:slideLeft '+d+'s ease '+delay+'s both} '+c+'{animation:slideRight '+d+'s ease '+2*delay+'s both} '+l+'{animation:slideUp '+d+'s ease '+3*delay+'s both}';if('pop'===p)return h+','+s+','+c+','+l+'{animation:pop '+d+'s ease both} '+s+'{animation-delay:'+delay+'s} '+c+'{animation-delay:'+2*delay+'s} '+l+'{animation-delay:'+3*delay+'s}';return h+'{animation:slideLeft '+d+'s ease both} '+s+'{animation:slideRight '+d+'s ease '+delay+'s both} '+c+'{animation:slideUp '+d+'s ease '+2*delay+'s both} '+l+'{animation:fadeIn '+d+'s ease '+3*delay+'s both}'}
  function restartAnimations(scope){var nodes=scope.querySelectorAll('.headline,.subline,.cta,img');nodes.forEach(n=>n.style.animation='none');void scope.offsetWidth;nodes.forEach(n=>n.style.animation='')}
  function applyPreviewAnim(){var style=document.getElementById('animStyle');if(!style){style=document.createElement('style');style.id='animStyle';document.head.appendChild(style)}style.textContent=presetCss(el('animPreset').value,el('animDur').value);document.querySelectorAll('.previewCard .banner').forEach(function(b){restartAnimations(b);var loops=Math.min(3,parseInt(el('animLoops').value,10)||1);b.querySelectorAll('.headline,.subline,.cta,img').forEach(function(n){n.style.animationIterationCount=String(loops);n.style.animationPlayState='running'});var stop=Math.min(30,(loops*((parseFloat(el('animDur').value)||2)+.6)));setTimeout(function(){b.querySelectorAll('.headline,.subline,.cta,img').forEach(function(n){n.style.animationPlayState='paused'})},stop*1000)})}

  // Render (preview)
  function render(){
    var grid=el('preview'); grid.innerHTML='';
    var headline=el('headline').value, subline=el('subline').value, cta=el('cta').value, bgCss=el('bg').value;
    var logoUrl=el('logoUrl').value||inlineLogo, bgUrl=el('bgUrl').value||inlineBg;
    activeSizes().forEach(function(s){var st=state[s.key]; st.h.size=parseInt(el('hSize').value,10)||st.h.size; st.h.color=el('hColor').value||st.h.color; st.h.font=el('hFont').value||st.h.font; st.s.size=parseInt(el('sSize').value,10)||st.s.size; st.s.color=el('sColor').value||st.s.color; st.s.font=el('sFont').value||st.s.font; st.c.size=parseInt(el('cSize').value,10)||st.c.size; st.c.textColor=el('cTextColor').value||st.c.textColor; st.c.bgColor=el('cBgColor').value||st.c.bgColor; st.c.font=el('cFont').value||st.c.font; });
    activeSizes().forEach(function(s){
      var card=document.createElement('div'); card.className='previewCard';
      var lab=document.createElement('div'); lab.className='previewLabel'; lab.textContent=s.key.replace('x','×');
      var canvas=document.createElement('div'); canvas.className='canvas'; canvas.style.width=px(s.w); canvas.style.height=px(s.h);
      var banner=document.createElement('div'); banner.className='banner'; banner.style.background=bgCss; banner.dataset.sizeKey=s.key;
      var tr=state[s.key];
      if(bgUrl){var bg=document.createElement('img'); bg.alt='bg'; bg.style.left='50%'; bg.style.top='50%'; bg.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')'; bg.style.transformOrigin='center'; bg.style.height='110%'; bg.style.minWidth='110%'; bg.style.opacity='.95'; bg.src=bgUrl; banner.appendChild(bg)}
      var H=document.createElement('div'); H.className='headline'; H.textContent=headline; H.style.fontSize=px(tr.h.size); H.style.color=tr.h.color; H.style.fontFamily=tr.h.font; H.style.left='50%'; H.style.top='45%'; H.style.transform='translate(calc(-50% + '+tr.h.x+'px), calc(-50% + '+tr.h.y+'px))'; H.style.width='calc(100% - 40px)'; H.style.textAlign='center'; banner.appendChild(H);
      var S=document.createElement('div'); S.className='subline'; S.textContent=subline; S.style.fontSize=px(tr.s.size); S.style.color=tr.s.color; S.style.fontFamily=tr.s.font; S.style.left='50%'; S.style.top='63%'; S.style.transform='translate(calc(-50% + '+tr.s.x+'px), calc(-50% + '+tr.s.y+'px))'; S.style.width='calc(100% - 50px)'; S.style.textAlign='center'; banner.appendChild(S);
      var C=document.createElement('div'); C.className='cta'; C.textContent=cta; C.style.color=tr.c.textColor; C.style.background=tr.c.bgColor; C.style.fontFamily=tr.c.font; C.style.fontSize=px(tr.c.size); C.style.bottom=px(Math.max(8,Math.round(s.h*.05)-tr.c.y)); C.style.left='50%'; C.style.transform='translate(calc(-50% + '+tr.c.x+'px))'; C.style.padding=px(Math.max(4,Math.round(s.h*.04)))+' '+px(Math.max(8,Math.round(s.w*.04))); banner.appendChild(C);
      if(logoUrl){var L=document.createElement('img'); L.alt='logo'; L.style.left='10px'; L.style.top='10px'; L.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')'; L.style.height=px(Math.round(s.h*.12)); L.style.width='auto'; L.style.opacity='.95'; L.src=logoUrl; banner.appendChild(L)}
      card.appendChild(lab); card.appendChild(canvas); canvas.appendChild(banner); grid.appendChild(card);
    });
    applyPreviewAnim(); renderPerSize(); validate();
  }

  // Dragging
  (function(){
    var d=null;
    on('preview','pointerdown',function(e){
      var t=e.target,b=t.closest('.banner'); if(!b) return; var k=b.dataset.sizeKey,tp=null;
      if(t.alt==='bg') tp='bg'; else if(t.alt==='logo') tp='logo';
      else if(t.classList.contains('headline')) tp='h'; else if(t.classList.contains('subline')) tp='s'; else if(t.classList.contains('cta')) tp='c'; else return;
      d={key:k,type:tp,el:t,startX=e.clientX,startY=e.clientY}; e.preventDefault(); t.setPointerCapture && t.setPointerCapture(e.pointerId);
    });
    on('preview','pointermove',function(e){
      if(!d) return; var dx=e.clientX-d.startX,dy=e.clientY-d.startY,tr=state[d.key];
      if('bg'===d.type){tr.bgX+=dx; tr.bgY+=dy; d.el.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')';}
      else if('logo'===d.type){tr.logoX+=dx; tr.logoY+=dy; d.el.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')';}
      else if('h'===d.type){tr.h.x+=dx; tr.h.y+=dy; d.el.style.transform='translate(calc(-50% + '+tr.h.x+'px), calc(-50% + '+tr.h.y+'px))';}
      else if('s'===d.type){tr.s.x+=dx; tr.s.y+=dy; d.el.style.transform='translate(calc(-50% + '+tr.s.x+'px), calc(-50% + '+tr.s.y+'px))';}
      else if('c'===d.type){tr.c.x+=dx; tr.c.y-=dy; d.el.style.transform='translate(calc(-50% + '+tr.c.x+'px))';}
      d.startX=e.clientX; d.startY=e.clientY;
    });
    ['pointerup','pointercancel','pointerleave'].forEach(ev=> on('preview',ev,function(){ d=null; render(); }));
  })();

  // Per-size sliders
  function renderPerSize(){
    var w=el('perSize'); w.innerHTML='';
    activeSizes().forEach(function(s){
      var tr=state[s.key],mx=Math.max(s.w,s.h),d=document.createElement('div'); d.className='card'; d.style.marginTop='10px';
      d.innerHTML='<div class="mini" style="margin-bottom:6px">'+s.key.replace("x","×")+'</div>\
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
      </div>'; w.appendChild(d);
    });
    w.querySelectorAll('input[type=range]').forEach(function(r){
      r.addEventListener('input',function(e){
        var t=e.target,k=t.getAttribute('data-k'),type=t.getAttribute('data-t'),f=t.getAttribute('data-f'),v=parseInt(t.value,10),tr=state[k];
        if('bg'===type){if('x'===f)tr.bgX=v;else if('y'===f)tr.bgY=v;else tr.bgScale=v/100}
        else if('logo'===type){if('x'===f)tr.logoX=v;else if('y'===f)tr.logoY=v;else tr.logoScale=v/100}
        else if('h'===type){if('x'===f)tr.h.x=v;else tr.h.y=v}
        else if('s'===type){if('x'===f)tr.s.x=v;else tr.s.y=v}
        else if('c'===type){if('x'===f)tr.c.x=v;else tr.c.y=v}
        render();
      },false);
    });
  }

  // Sizes toggles
  (function(){document.getElementById('sizes').querySelectorAll('input[type=checkbox]').forEach(function(cb){cb.addEventListener('change',function(){var key=cb.getAttribute('data-size'),s=sizes.find(x=>x.key===key); if(s){s.on=cb.checked; render();}})})})();

  // ---------- Extract (logo + CTA barva) – robustnější ----------
  function showStatus(text, type){
    var pill = el('extractStatus'); pill.style.display='inline-flex';
    pill.textContent = text;
    pill.style.borderColor = type==='ok' ? 'rgba(16,185,129,.5)' : (type==='warn' ? 'rgba(245,158,11,.5)' : 'rgba(239,68,68,.5)');
    pill.style.background = type==='ok' ? 'rgba(16,185,129,.12)' : (type==='warn' ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)');
  }
  function urlsFrom(origin, paths){ return paths.map(p=> origin.replace(/\/$/,'') + p); }
  function tryLoadImage(url){ return new Promise(function(resolve){ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ resolve({ok:true,url, img}) }; img.onerror=function(){ resolve({ok:false,url}) }; img.src=url; }); }
  async function firstImage(cands){ for (var i=0;i<cands.length;i++){ var r=await tryLoadImage(cands[i]); if(r.ok) return r; } return null; }
  function dominantColor(img){
    try{
      var c=document.createElement('canvas'); var ctx=c.getContext('2d'); c.width=img.naturalWidth; c.height=img.naturalHeight;
      ctx.drawImage(img,0,0);
      var data=ctx.getImageData(0,0,c.width,c.height).data;
      var r=0,g=0,b=0,count=0; for(var i=0;i<data.length;i+=16){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
      r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
      return '#'+[r,g,b].map(x=>('0'+x.toString(16)).slice(-2)).join('');
    }catch(e){ return null; }
  }
  function hashColorFromHost(host){
    // CORS-safe fallback: generuj stabilní barvu z názvu domény
    var h=0; for(var i=0;i<host.length;i++){ h=(h*31 + host.charCodeAt(i))>>>0; }
    var r=(h & 0xFF), g=((h>>8)&0xFF), b=((h>>16)&0xFF);
    // přitlum barvu a posuň do CTA-friendly (vyšší sytost/kontrast vůči tmavému BG)
    r = Math.floor((r*0.6)+80); g = Math.floor((g*0.6)+80); b = Math.floor((b*0.6)+80);
    return '#'+[r,g,b].map(x=>('0'+x.toString(16)).slice(-2)).join('');
  }
  async function smartExtract(rawUrl){
    try{
      if(!rawUrl){ showStatus('Zadej URL domény (např. https://example.com)', 'warn'); return; }
      var u = new URL(rawUrl);
      el('clickUrl').value = rawUrl;
      showStatus('Hledám logo a barvy…', 'warn');

      // 1) Kandidáti přímo na webu
      var logos = urlsFrom(u.origin, ['/favicon.ico','/favicon.png','/apple-touch-icon.png','/logo.png','/assets/logo.png','/static/logo.png','/img/logo.png','/images/logo.png','/brand/logo.png']);
      var heros = urlsFrom(u.origin, ['/og-image.jpg','/og-image.png','/banner.jpg','/banner.png','/images/hero.jpg','/images/kv.jpg']);

      var L = await firstImage(logos);
      var H = await firstImage(heros);

      // 2) Fallback — Google favicon service (CORS-friendly)
      if(!L){
        var fav = 'https://www.google.com/s2/favicons?sz=128&domain=' + encodeURIComponent(u.hostname);
        var test = await tryLoadImage(fav);
        if(test && test.ok){ L = test; }
      }

      // Aplikuj logo (pokud něco máme)
      if(L && L.ok){
        el('logoUrl').value = L.url;
      }

      // Aplikuj pozadí (pokud něco máme)
      if(H && H.ok){
        el('bgUrl').value = H.url;
      }

      // 3) Barva CTA — zkus z loga, jinak fallback z hostu
      var dom = (L && L.ok) ? dominantColor(L.img) : null;
      if(dom){ el('cBgColor').value = dom; showStatus('Nalezeno logo + CTA barva z loga', 'ok'); }
      else { var hc=hashColorFromHost(u.hostname); el('cBgColor').value = hc; showStatus('Logo/OG bez CORS → CTA barva z domény', 'warn'); }

      render();
    }catch(e){
      console.warn('smartExtract error',e);
      showStatus('Nepodařilo se načíst. Zadej logo/pozadí ručně.', 'err');
      render();
    }
  }

  // Export (beze změn, zkráceně)
  function crc32(b){var t=function(){for(var c,t=new Uint32Array(256),n=0;n<256;n++){for(c=n,k=0;k<8;k++)c=c&1?3988292384^c>>>1:c>>>1;t[n]=c>>>0}return t}(),crc=0^-1;for(var i=0;i<b.length;i++)crc=crc>>>8^t[(crc^b[i])&255];return crc^-1>>>0} function s2u(s){return new TextEncoder().encode(s)} function le(n,b){var a=new Uint8Array(b);for(var i=0;i<b;i++)a[i]=n>>>8*i&255;return a} function cat(ch){var t=0;ch.forEach(c=>t+=c.length);var o=new Uint8Array(t),p=0;ch.forEach(c=>{o.set(c,p);p+=c.length});return o}
  function mkzip(files){var locals=[],centrals=[],off=0,t=0,d=0;files.forEach(function(f){var n=s2u(f.name),data=f.data,crc=crc32(data),sz=data.length,lh=cat([s2u('PK\\x03\\x04'),le(20,2),le(0,2),le(0,2),le(t,2),le(d,2),le(crc,4),le(sz,4),le(sz,4),le(n.length,2),le(0,2)]),local=cat([lh,n,data]);locals.push(local);var ch=cat([s2u('PK\\x01\\x02'),le(20,2),le(20,2),le(0,2),le(0,2),le(t,2),le(d,2),le(crc,4),le(sz,4),le(sz,4),le(n.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(off,4)]);centrals.push(cat([ch,n]));off+=local.length});var central=cat(centrals),localsCat=cat(locals),end=cat([s2u('PK\\x05\\x06'),le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(central.length,4),le(localsCat.length,4),le(0,2)]);return new Blob([localsCat,central,end],{type:'application/zip'})}
  function minify(s){return String(s).replace(/\n+/g,'').replace(/\s{2,}/g,' ')}
  function totalAnimDuration(){var loops=parseInt(el('animLoops').value,10)||1,d=parseFloat(el('animDur').value)||2;return loops*(d+.6)}
  function htmlForSize(w,h,o){var tr=state[w+'x'+h],anim=presetCss(o.animPreset,o.animDur),loops=Math.min(3,parseInt(o.animLoops,10)||1),stop=Math.min(30,(loops*((parseFloat(o.animDur)||2)+.6))),fontFace=o.fontDataUrl?'@font-face{font-family:CustomFont;src:url('+o.fontDataUrl+') format(\"'+(o.fontDataUrl.split(';')[0].endsWith('woff2')?'woff2':'woff')+'\");font-display:swap}':'';var hFont=o.hFont==='Inter'&&o.fontDataUrl?'CustomFont':o.hFont,sFont=o.sFont==='Inter'&&o.fontDataUrl?'CustomFont':o.sFont,cFont=o.cFont==='Inter'&&o.fontDataUrl?'CustomFont':o.cFont,html='<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"ad.size\" content=\"width='+w+',height='+h+'\"><title>banner</title><style>'+fontFace+':root{--w:'+w+'px;--h:'+h+'px}*{box-sizing:border-box}html,body{margin:0;width:var(--w);height:var(--h);overflow:hidden}.banner{position:relative;width:var(--w);height:var(--h);background:'+o.bgCss+';color:#fff} .headline{position:absolute;left:50%;top:45%;transform:translate(calc(-50% + '+tr.h.x+'px), calc(-50% + '+tr.h.y+'px));width:calc(var(--w) - 40px);text-align:center;font-weight:800;line-height:1.1;font-size:'+tr.h.size+'px;color:'+tr.h.color+';font-family:'+hFont+'}.subline{position:absolute;left:50%;top:63%;transform:translate(calc(-50% + '+tr.s.x+'px), calc(-50% + '+tr.s.y+'px));width:calc(var(--w) - 50px);text-align:center;font-size:'+tr.s.size+'px;color:'+tr.s.color+';font-family:'+sFont+'}.cta{position:absolute;left:50%;bottom:'+Math.max(8,Math.round(h*.05)-tr.c.y)+'px;transform:translate(calc(-50% + '+tr.c.x+'px));padding:'+Math.max(4,Math.round(h*.04))+'px '+Math.max(8,Math.round(w*.04))+'px;border-radius:999px;background:'+tr.c.bgColor+';color:'+tr.c.textColor+';font-weight:800;font-size:'+tr.c.size+'px;font-family:'+cFont+'} .logo{position:absolute;left:10px;top:10px;transform:translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+');height:'+Math.round(h*.12)+'px;width:auto;opacity:.95}'+(o.bgUrl?'.bg{position:absolute;left:50%;top:50%;transform:translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+');transform-origin:center;height:110%;min-width:110%;opacity:.95}':'')+anim+'</style><script>window.clickTag='+JSON.stringify(o.clickUrl)+';setTimeout(function(){var n=document.querySelectorAll(\".headline,.subline,.cta,img\");for(var i=0;i<n.length;i++)n[i].style.animationIterationCount=\"'+loops+'\";},0);setTimeout(function(){var n=document.querySelectorAll(\".headline,.subline,.cta,img\");for(var i=0;i<n.length;i++)n[i].style.animationPlayState=\"paused\";},'+Math.round(stop*1000)+');</'+'script></head><body><a href=\"javascript:window.open(window.clickTag)\"><div class=\"banner\">'+(o.bgUrl?'<img class=\"bg\" src=\"'+o.bgUrl+'\" alt=\"bg\"/>':'')+'<div class=\"headline\">'+o.headline+'</div><div class=\"subline\">'+o.subline+'</div><div class=\"cta\">'+o.cta+'</div>'+(o.logoUrl?'<img class=\"logo\" src=\"'+o.logoUrl+'\" alt=\"logo\"/>':'')+'</div></a></body></html>';return minify(html)}
  function exportZip(){var strict=el('strictExport').checked;var o={headline:el('headline').value,subline:el('subline').value,cta:el('cta').value,clickUrl:el('clickUrl').value,bgCss:el('bg').value,logoUrl:inlineLogo||el('logoUrl').value,bgUrl:inlineBg||el('bgUrl').value,animPreset:el('animPreset').value,animDur:el('animDur').value,animLoops:el('animLoops').value,fontDataUrl:fontDataUrl,hFont:el('hFont').value,sFont:el('sFont').value,cFont:el('cFont').value};if(strict){if(!(/^data:image/.test(o.logoUrl||''))&&o.logoUrl) return void alert('Strict: logo nahraj jako soubor (inline).');if(!(/^data:image/.test(o.bgUrl||''))&&o.bgUrl) return void alert('Strict: pozadí nahraj jako soubor (inline).');}var files=[];activeSizes().forEach(function(s){files.push({name:s.w+'x'+s.h+'/index.html',data:new TextEncoder().encode(htmlForSize(s.w,s.h,o))})});if(files.length>40)return void alert('Příliš mnoho souborů (>40).');var total=files.reduce((a,f)=>a+f.data.length,0);if(strict&&total>150*1024)return void alert('Strict: ZIP by měl ~'+Math.round(total/1024)+' kB (>150).');if(totalAnimDuration()>30)return void alert('Animace > 30 s. Uprav délku/loop.');var blob=mkzip(files),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='html5ai-banners.zip';a.click()}

  // Validator
  function validate(){var issues=[];if(totalAnimDuration()>30)issues.push({level:'error',msg:'Animace > 30 s'});var b=el('badge'),list=el('issues');list.innerHTML='';if(!issues.length){b.className='badge ok';b.textContent='OK — připraveno k exportu'}else{b.className='badge err';b.textContent='Problémy — zkontroluj níže';issues.forEach(function(i){var li=document.createElement('li');li.textContent='['+i.level.toUpperCase()+'] '+i.msg;list.appendChild(li)})}}

  // Events
  ;['headline','subline','cta','clickUrl','bg','hSize','hColor','hFont','sSize','sColor','sFont','cSize','cTextColor','cBgColor','cFont','animPreset','animDur','animLoops'].forEach(function(id){on(id,'input',render);on(id,'change',render)});
  on('logoFile','change',e=>{var f=e.target.files[0];if(!f)return;var r=new FileReader;r.onload=function(){inlineLogo=r.result;el('logoUrl').value=r.result;render()};r.readAsDataURL(f)});
  on('bgFile','change',e=>{var f=e.target.files[0];if(!f)return;var r=new FileReader;r.onload=function(){inlineBg=r.result;el('bgUrl').value=r.result;render()};r.readAsDataURL(f)});
  on('fontFile','change',e=>{var f=e.target.files[0];if(!f)return;var r=new FileReader;r.onload=function(){fontDataUrl=r.result;render()};r.readAsDataURL(f)});
  on('importUrl','click', function(){ smartExtract(el('brandUrl').value||''); });
  on('exportZip','click', exportZip); on('exportZipTop','click', exportZip);
  on('replayAll','click', function(){ applyPreviewAnim(); });
  document.addEventListener('DOMContentLoaded', function(){ render(); }, false);
})();