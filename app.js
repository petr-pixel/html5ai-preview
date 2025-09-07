(function(){
  'use strict';
  // -------------------------- Config --------------------------
  var SIZES=[
    {key:'300x250', w:300, h:250},
    {key:'970x250', w:970, h:250},
    {key:'970x90',  w:970, h:90},
    {key:'300x600', w:300, h:600},
    {key:'160x600', w:160, h:600}
  ];
  var state={}; SIZES.forEach(function(s){ state[s.key]={bgX:0,bgY:0,bgScale:1, logoX:0,logoY:0,logoScale:1}; });
  function el(id){ return document.getElementById(id); }
  function on(id,evt,fn){ var x=typeof id==='string'?el(id):id; x&&x.addEventListener(evt,fn,false); }

  // -------------------------- Helpers --------------------------
  function readFileToUrl(input, cb){
    var f = input.files && input.files[0]; if(!f) return;
    var r = new FileReader(); r.onload = function(){ cb(r.result); };
    r.readAsDataURL(f);
  }
  function px(n){ return n+'px'; }

  // -------------------------- Preview DOM (no iframes) --------------------------
  function render(){
    var grid = el('preview'); grid.innerHTML='';
    var headline = el('headline').value, subline = el('subline').value, cta = el('cta').value;
    var click = el('clickUrl').value;
    var bg = el('bg').value, fg = el('fg').value, ctaBg = el('ctaBg').value;
    var logoUrl = el('logoUrl').value, bgUrl = el('bgUrl').value;

    SIZES.forEach(function(s){
      var card = document.createElement('div'); card.className='previewCard';
      var lab = document.createElement('div'); lab.className='previewLabel'; lab.textContent = s.key.replace('x','×');
      card.appendChild(lab);

      var canvas = document.createElement('div'); canvas.className='canvas'; canvas.style.width=px(s.w); canvas.style.height=px(s.h);
      var banner = document.createElement('div'); banner.className='banner'; banner.style.background = bg; banner.style.color=fg;
      canvas.appendChild(banner);

      // BG image
      var tr = state[s.key];
      if(bgUrl){
        var bgImg = document.createElement('img');
        bgImg.alt='bg'; bgImg.style.left='50%'; bgImg.style.top='50%';
        bgImg.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')';
        bgImg.style.transformOrigin='center center';
        bgImg.style.height='110%'; bgImg.style.minWidth='110%'; bgImg.style.opacity='.95'; bgImg.src = bgUrl;
        banner.appendChild(bgImg);
      }
      // Headline/Subline
      var fH=Math.max(14,Math.round(s.w/12));
      var fS=Math.max(10,Math.round(s.w/20));
      var fC=Math.max(10,Math.round(s.w/22));
      var H = document.createElement('div'); H.className='headline'; H.style.fontSize=px(fH); H.textContent=headline; banner.appendChild(H);
      var S = document.createElement('div'); S.className='subline'; S.style.fontSize=px(fS); S.textContent=subline; banner.appendChild(S);
      var C = document.createElement('div'); C.className='cta'; C.style.bottom = px(Math.max(8, Math.round(s.h*0.05)));
      C.style.padding = px(Math.max(4,Math.round(s.h*0.04)))+' '+px(Math.max(8,Math.round(s.w*0.04)));
      C.style.background = ctaBg; C.style.color = '#061123'; C.style.fontSize = px(fC); C.textContent=cta; banner.appendChild(C);

      // Logo
      if(logoUrl){
        var logo = document.createElement('img');
        logo.alt='logo'; logo.style.left='10px'; logo.style.top='10px';
        logo.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')';
        logo.style.height = px(Math.round(s.h*0.12)); logo.style.width='auto'; logo.style.opacity='.95'; logo.src = logoUrl;
        banner.appendChild(logo);
      }

      grid.appendChild(card); card.appendChild(canvas);
    });
    validate();
  }

  // -------------------------- Per-size controls --------------------------
  function renderPerSize(){
    var wrap = el('perSize'); wrap.innerHTML='';
    SIZES.forEach(function(s){
      var tr = state[s.key];
      var box = document.createElement('div'); box.className='card'; box.style.marginTop='10px';
      box.innerHTML = '<div class=\"mini\" style=\"margin-bottom:6px\">'+s.key.replace('x','×')+'</div>\
      <div class=\"grid2\">\
        <div>\
          <label>BG X</label><input type=\"range\" min=\"-'+Math.max(s.w,s.h)+'\" max=\"'+Math.max(s.w,s.h)+'\" value=\"'+tr.bgX+'\" data-k=\"'+s.key+'\" data-t=\"bg\" data-f=\"x\">\
          <label>BG Y</label><input type=\"range\" min=\"-'+Math.max(s.w,s.h)+'\" max=\"'+Math.max(s.w,s.h)+'\" value=\"'+tr.bgY+'\" data-k=\"'+s.key+'\" data-t=\"bg\" data-f=\"y\">\
          <label>BG Scale</label><input type=\"range\" min=\"50\" max=\"250\" value=\"'+Math.round(tr.bgScale*100)+'\" data-k=\"'+s.key+'\" data-t=\"bg\" data-f=\"s\">\
        </div>\
        <div>\
          <label>Logo X</label><input type=\"range\" min=\"-'+Math.max(s.w,s.h)+'\" max=\"'+Math.max(s.w,s.h)+'\" value=\"'+tr.logoX+'\" data-k=\"'+s.key+'\" data-t=\"logo\" data-f=\"x\">\
          <label>Logo Y</label><input type=\"range\" min=\"-'+Math.max(s.w,s.h)+'\" max=\"'+Math.max(s.w,s.h)+'\" value=\"'+tr.logoY+'\" data-k=\"'+s.key+'\" data-t=\"logo\" data-f=\"y\">\
          <label>Logo Scale</label><input type=\"range\" min=\"50\" max=\"250\" value=\"'+Math.round(tr.logoScale*100)+'\" data-k=\"'+s.key+'\" data-t=\"logo\" data-f=\"s\">\
        </div>\
      </div>';
      wrap.appendChild(box);
    });
    wrap.querySelectorAll('input[type=range]').forEach(function(r){
      r.addEventListener('input', function(e){
        var t=e.target, k=t.getAttribute('data-k'), type=t.getAttribute('data-t'), f=t.getAttribute('data-f'), v=parseInt(t.value,10);
        var tr=state[k];
        if(type==='bg'){ if(f==='x') tr.bgX=v; else if(f==='y') tr.bgY=v; else tr.bgScale=v/100; }
        else { if(f==='x') tr.logoX=v; else if(f==='y') tr.logoY=v; else tr.logoScale=v/100; }
        render();
      }, false);
    });
  }

  // -------------------------- HTML exporter --------------------------
  function bannerHTMLString(w,h, opts){
    var fH=Math.max(14,Math.round(w/12)), fS=Math.max(10,Math.round(w/20)), fC=Math.max(10,Math.round(w/22));
    var tr=state[w+'x'+h];
    var logoImg = opts.logoUrl ? '<img src=\"'+opts.logoUrl+'\" alt=\"logo\" style=\"position:absolute;left:10px;top:10px;transform: translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+');height:'+Math.round(h*0.12)+'px;width:auto;opacity:.95;z-index:3;\"/>' : '';
    var bgImg   = opts.bgUrl   ? '<img src=\"'+opts.bgUrl+'\" alt=\"bg\" style=\"position:absolute;left:50%;top:50%;transform: translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+');transform-origin:center center;height:110%;min-width:110%;opacity:.95;z-index:0;\"/>' : '';
    return '<!DOCTYPE html><html><head><meta charset=\"UTF-8\">'+
      '<meta name=\"ad.size\" content=\"width='+w+',height='+h+'\">'+
      '<title>banner</title>'+
      '<style>:root{--w:'+w+'px;--h:'+h+'px;--bg:'+opts.bg+';--fg:'+opts.fg+';--cta:'+opts.ctaBg+';}*{box-sizing:border-box}html,body{margin:0;width:var(--w);height:var(--h);overflow:hidden}.banner{position:relative;width:var(--w);height:var(--h);background:var(--bg);color:var(--fg);font-family:Arial,Helvetica,sans-serif;overflow:hidden}.headline{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);width:calc(var(--w) - 40px);text-align:center;font-weight:800;line-height:1.1;font-size:'+fH+'px;opacity:0;animation:fade .6s ease-out .1s forwards;z-index:2}.subline{position:absolute;left:50%;top:65%;transform:translate(-50%,-50%);width:calc(var(--w) - 50px);text-align:center;font-weight:500;line-height:1.2;font-size:'+fS+'px;opacity:0;animation:rise .6s ease-out .4s forwards;z-index:2}.cta{position:absolute;left:50%;bottom:'+Math.max(8,Math.round(h*0.05))+'px;transform:translateX(-50%);padding:'+Math.max(4,Math.round(h*0.04))+'px '+Math.max(8,Math.round(w*0.04))+'px;border-radius:999px;background:var(--cta);color:#061123;font-weight:800;font-size:'+fC+'px;letter-spacing:.2px;box-shadow:0 6px 14px rgba(0,0,0,.22);opacity:0;animation:pop .35s ease-out .8s forwards;z-index:2}@keyframes fade{from{opacity:0;transform:translate(-50%,-56%)}to{opacity:1;transform:translate(-50%,-50%)}}@keyframes rise{from{opacity:0;transform:translate(-50%,-36%)}to{opacity:1;transform:translate(-50%,-50%)}}@keyframes pop{from{transform:translateX(-50%) scale(.92);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}</style>'+
      '<script>window.clickTag='+JSON.stringify(opts.clickUrl)+';<\\/script></head><body>'+
      '<a href=\"javascript:window.open(window.clickTag)\" style=\"text-decoration:none\"><div class=\"banner\">'+
      bgImg+
      '<div class=\"headline\">'+opts.headline+'</div>'+
      '<div class=\"subline\">'+opts.subline+'</div>'+
      '<div class=\"cta\">'+opts.cta+'</div>'+
      logoImg+
      '</div></a></body></html>';
  }

  // -------------------------- Minimal ZIP (stored, no compression) --------------------------
  // Based on PKWARE .ZIP AppNote (local file header + central directory). STORED only.
  function crc32(buf){
    var table = (function(){
      var c, table = new Uint32Array(256);
      for (var n=0; n<256; n++){
        c = n;
        for (var k=0; k<8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
      }
      return table;
    })();
    var crc = 0 ^ (-1), i;
    for(i=0;i<buf.length;i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    return (crc ^ (-1)) >>> 0;
  }
  function strToU8(str){ return new TextEncoder().encode(str); }
  function numToLE(n, bytes){
    var arr = new Uint8Array(bytes);
    for (var i=0;i<bytes;i++) arr[i] = (n >>> (8*i)) & 0xFF;
    return arr;
  }
  function concat(chunks){
    var total=0; chunks.forEach(function(c){ total+=c.length; });
    var out=new Uint8Array(total), off=0;
    chunks.forEach(function(c){ out.set(c, off); off+=c.length; });
    return out;
  }
  function makeZip(files){
    // files: [{name, data: Uint8Array}]
    var localParts=[], centralParts=[], offset=0, dosTime=0x0000, dosDate=0x0000;
    files.forEach(function(f){
      var nameU8 = strToU8(f.name);
      var crc = crc32(f.data);
      var size = f.data.length;
      // local file header
      var localHeader = concat([
        strToU8('PK\x03\x04'),
        numToLE(20,2), // version needed
        numToLE(0,2),  // flags
        numToLE(0,2),  // compression (0 = stored)
        numToLE(dosTime,2), numToLE(dosDate,2),
        numToLE(crc,4), numToLE(size,4), numToLE(size,4),
        numToLE(nameU8.length,2), numToLE(0,2) // extra len
      ]);
      var local = concat([localHeader, nameU8, f.data]);
      localParts.push(local);
      // central dir header
      var centralHeader = concat([
        strToU8('PK\x01\x02'),
        numToLE(20,2), numToLE(20,2), // version made by / needed
        numToLE(0,2), // flags
        numToLE(0,2), // compression
        numToLE(dosTime,2), numToLE(dosDate,2),
        numToLE(crc,4), numToLE(size,4), numToLE(size,4),
        numToLE(nameU8.length,2), numToLE(0,2), numToLE(0,2), // extra/comment
        numToLE(0,2), numToLE(0,2), // disk/start attrs
        numToLE(0,4), // external attrs
        numToLE(offset,4) // local header offset
      ]);
      centralParts.push(concat([centralHeader, nameU8]));
      offset += local.length;
    });
    var central = concat(centralParts);
    var locals = concat(localParts);
    var end = concat([
      strToU8('PK\x05\x06'),
      numToLE(0,2), numToLE(0,2), // disk nums
      numToLE(files.length,2), numToLE(files.length,2),
      numToLE(central.length,4),
      numToLE(locals.length,4),
      numToLE(0,2) // comment len
    ]);
    return new Blob([locals, central, end], {type: 'application/zip'});
  }

  function exportZip(){
    var opts = {
      headline: el('headline').value, subline: el('subline').value, cta: el('cta').value,
      clickUrl: el('clickUrl').value,
      bg: el('bg').value, fg: el('fg').value, ctaBg: el('ctaBg').value,
      logoUrl: el('logoUrl').value, bgUrl: el('bgUrl').value
    };
    var files = SIZES.map(function(s){
      var html = bannerHTMLString(s.w, s.h, opts);
      return { name: s.w+'x'+s.h+'/index.html', data: strToU8(html) };
    });
    var blob = makeZip(files);
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='html5ai-banners.zip'; a.click();
  }

  // -------------------------- Validator --------------------------
  function validate(){
    var assets=[], lu=el('logoUrl').value, bu=el('bgUrl').value; if(lu) assets.push(lu); if(bu) assets.push(bu);
    var http=0, bytes=0; assets.forEach(function(a){
      if(String(a).indexOf('data:')===0){ var b64=String(a).split(',')[1]||''; bytes+=Math.ceil(b64.length*3/4); }
      else http++;
    });
    bytes += 8000*SIZES.length; var kb=Math.round(bytes/1024); var issues=[];
    if(http>100) issues.push({level:'error',msg:'Více než 100 HTTP požadavků.'});
    if(kb>5120) issues.push({level:'warn',msg:'Odhad ZIPu nad 5 MB — zvaž kompresi obrázků.'});
    var badge=el('badge'), list=el('issues'); list.innerHTML='';
    if(issues.length===0){ badge.className='badge ok'; badge.textContent='OK — připraveno k exportu'; }
    else{ var hasErr=issues.some(function(i){return i.level==='error'}); badge.className='badge '+(hasErr?'err':'warn'); badge.textContent=hasErr?'Problémy — zkontroluj níže':'Varování — zvážení před exportem'; issues.forEach(function(i){ var li=document.createElement('li'); li.textContent='['+i.level.toUpperCase()+'] '+i.msg; list.appendChild(li); }); }
  }

  // -------------------------- AI copy demo --------------------------
  document.addEventListener('click', function(e){
    var t=e.target; if(!t || !t.getAttribute) return;
    var type=t.getAttribute('data-copy'); if(!type) return;
    var chat=el('chat');
    var add=function(cls,txt){ var d=document.createElement('div'); d.className='msg '+cls; d.textContent=txt; chat.appendChild(d); chat.scrollTop=chat.scrollHeight; };
    add('user','Chci variantu: '+type);
    var v={h:'',s:'',c:''};
    if(type==='short') v={h:'Zimní výbava', s:'Lehké a teplé', c:'Prohlédnout'};
    if(type==='warm') v={h:'Teplo do mrazu', s:'Funkční vrstvy 24/7', c:'Zjistit více'};
    if(type==='promo') v={h:'Sleva až 50 %', s:'Jen tento týden', c:'Nakoupit teď'};
    add('ai','Headline: '+v.h+' • Subline: '+v.s+' • CTA: '+v.c);
    el('headline').value=v.h; el('subline').value=v.s; el('cta').value=v.c;
    render();
  }, false);

  // -------------------------- Events --------------------------
  ['headline','subline','cta','clickUrl','bg','fg','ctaBg','logoUrl','bgUrl'].forEach(function(id){
    on(id,'input', render);
  });
  on('logoFile','change', function(e){ readFileToUrl(e.target, function(url){ el('logoUrl').value=url; render(); }); });
  on('bgFile','change', function(e){ readFileToUrl(e.target, function(url){ el('bgUrl').value=url; render(); }); });
  on('importUrl','click', function(){ smartExtract(el('brandUrl').value||''); });
  on('exportZip','click', exportZip);
  on('exportZipTop','click', exportZip);

  
  // -------------------------- Drag & Drop in preview --------------------------
  (function setupDrag(){
    var dragging=null;
    var grid = document.getElementById('preview');
    grid.addEventListener('pointerdown', function(e){
      var t=e.target;
      if(!(t && t.tagName==='IMG')) return;
      var parentCard = t.closest('.previewCard');
      if(!parentCard) return;
      // Determine type and size key by checking if it's first img (bg) or later (logo)
      var cardLabel = parentCard.querySelector('.previewLabel').textContent.replace('×','x');
      var key = cardLabel;
      var isLogo = (t.alt === 'logo');
      var isBg = (t.alt === 'bg');
      if(!isLogo && !isBg) return;
      dragging = { key, type: isLogo?'logo':'bg', startX: e.clientX, startY: e.clientY };
      e.preventDefault();
      grid.setPointerCapture && grid.setPointerCapture(e.pointerId);
    }, false);
    grid.addEventListener('pointermove', function(e){
      if(!dragging) return;
      var dx = e.clientX - dragging.startX;
      var dy = e.clientY - dragging.startY;
      var tr = state[dragging.key];
      if(dragging.type==='bg'){ tr.bgX += dx; tr.bgY += dy; }
      else { tr.logoX += dx; tr.logoY += dy; }
      dragging.startX = e.clientX; dragging.startY = e.clientY;
      render();
    }, false);
    grid.addEventListener('pointerup', function(){ dragging=null; }, false);
    grid.addEventListener('pointercancel', function(){ dragging=null; }, false);
  })();

  // -------------------------- Smart Extract from URL (CORS-safe fallbacks) --------------------------
  async function smartExtract(rawUrl){
    try{
      if(!rawUrl) return;
      var u = new URL(rawUrl);
      // 1) set click URL
      el('clickUrl').value = rawUrl;

      // 2) Try common logo paths (no fetch needed beyond <img> load)
      var origins = [u.origin];
      var candidatesLogo = ['/favicon.ico','/apple-touch-icon.png','/logo.png','/assets/logo.png','/static/logo.png'];
      var foundLogo = await firstImage(origsToUrls(origins, candidatesLogo));
      if(foundLogo) el('logoUrl').value = foundLogo;

      // 3) Try common hero/og image paths
      var candidatesHero = ['/og-image.jpg','/og-image.png','/og_image.jpg','/og_image.png','/social.jpg','/banner.jpg','/banner.png'];
      var foundHero = await firstImage(origsToUrls(origins, candidatesHero));
      if(foundHero) el('bgUrl').value = foundHero;

      // 4) Heuristic CTA color
      var cta = '#E4572E';
      if(u.hostname.includes('nordblanc')) cta = '#E4572E';
      if(u.hostname.includes('columbia')) cta = '#2BA3FF';
      el('ctaBg').value = cta;

      render();
    }catch(e){
      console.warn('smartExtract error', e);
      render();
    }
  }
  function origsToUrls(origins, paths){
    var arr=[]; origins.forEach(function(o){ paths.forEach(function(p){ arr.push(o+p); }); }); return arr;
  }
  function firstImage(urls){
    return new Promise(function(resolve){
      var i=0;
      (function next(){
        if(i>=urls.length) return resolve(null);
        var img = new Image();
        img.crossOrigin = 'anonymous'; // best-effort
        img.onload = function(){ resolve(urls[i]); };
        img.onerror = function(){ i++; next(); };
        img.src = urls[i];
      })();
    });
  }

  // -------------------------- Init --------------------------
  document.addEventListener('DOMContentLoaded', function(){ render(); renderPerSize(); validate(); }, false);
})();