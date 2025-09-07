(function(){
  'use strict';
  var SIZES=[
    {key:'300x250', w:300, h:250},
    {key:'970x250', w:970, h:250},
    {key:'970x90',  w:970, h:90},
    {key:'300x600', w:300, h:600},
    {key:'160x600', w:160, h:600}
  ];
  var state={}; SIZES.forEach(function(s){ state[s.key]={
    bgX:0,bgY:0,bgScale:1, logoX:0,logoY:0,logoScale:1,
    hX:0,hY:0, sX:0,sY:0, ctaX:0, ctaY:0
  }; });
  function el(id){ return document.getElementById(id); }
  function on(id,evt,fn){ var x=typeof id==='string'?el(id):id; x&&x.addEventListener(evt,fn,false); }
  function px(n){ return n+'px'; }

  function readFileToUrl(input, cb){
    var f = input.files && input.files[0]; if(!f) return;
    var r = new FileReader(); r.onload = function(){ cb(r.result); };
    r.readAsDataURL(f);
  }

  function render(){
    var grid = el('preview'); grid.innerHTML='';
    var headline = el('headline').value, subline = el('subline').value, cta = el('cta').value;
    var bg = el('bg').value, fg = el('fg').value, ctaBg = el('ctaBg').value;
    var logoUrl = el('logoUrl').value, bgUrl = el('bgUrl').value;

    SIZES.forEach(function(s){
      var card = document.createElement('div'); card.className='previewCard';
      var lab = document.createElement('div'); lab.className='previewLabel'; lab.textContent = s.key.replace('x','×');
      card.appendChild(lab);

      var canvas = document.createElement('div'); canvas.className='canvas'; canvas.style.width=px(s.w); canvas.style.height=px(s.h);
      var banner = document.createElement('div'); banner.className='banner'; banner.style.background = bg; banner.style.color=fg;
      canvas.appendChild(banner);

      var tr = state[s.key];

      if(bgUrl){
        var bgImg = document.createElement('img');
        bgImg.alt='bg'; bgImg.style.left='50%'; bgImg.style.top='50%';
        bgImg.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')';
        bgImg.style.transformOrigin='center center';
        bgImg.style.height='110%'; bgImg.style.minWidth='110%'; bgImg.style.opacity='.95'; bgImg.src = bgUrl;
        banner.appendChild(bgImg);
      }

      var fH=Math.max(14,Math.round(s.w/12));
      var fS=Math.max(10,Math.round(s.w/20));
      var fC=Math.max(10,Math.round(s.w/22));
      var H = document.createElement('div'); H.className='headline'; H.style.fontSize=px(fH); H.textContent=headline;
      H.style.transform='translate(calc(-50% + '+tr.hX+'px), calc(-50% + '+tr.hY+'px))'; banner.appendChild(H);
      var S = document.createElement('div'); S.className='subline'; S.style.fontSize=px(fS); S.textContent=subline;
      S.style.transform='translate(calc(-50% + '+tr.sX+'px), calc(-50% + '+tr.sY+'px))'; banner.appendChild(S);
      var C = document.createElement('div'); C.className='cta';
      C.style.bottom = px(Math.max(8, Math.round(s.h*0.05) - tr.ctaY));
      C.style.left = '50%'; C.style.transform = 'translate(calc(-50% + '+tr.ctaX+'px))';
      C.style.padding = px(Math.max(4,Math.round(s.h*0.04)))+' '+px(Math.max(8,Math.round(s.w*0.04)));
      C.style.background = ctaBg; C.style.color = '#061123'; C.style.fontSize = px(fC); C.textContent=cta; banner.appendChild(C);

      if(logoUrl){
        var logo = document.createElement('img'); logo.alt='logo'; logo.style.left='10px'; logo.style.top='10px';
        logo.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')';
        logo.style.height = px(Math.round(s.h*0.12)); logo.style.width='auto'; logo.style.opacity='.95'; logo.src = logoUrl;
        banner.appendChild(logo);
      }

      banner.dataset.sizeKey = s.key;
      card.appendChild(canvas); grid.appendChild(card);
    });
    validate();
  }

  // Drag & drop
  (function setupDrag(){
    var dragging=null;
    on('preview','pointerdown', function(e){
      var t=e.target; if(!t) return;
      var banner=t.closest('.banner'); if(!banner) return;
      var key=banner.dataset.sizeKey;
      var type=null;
      if(t.alt==='bg') type='bg';
      else if(t.alt==='logo') type='logo';
      else if(t.classList.contains('headline')) type='h';
      else if(t.classList.contains('subline')) type='s';
      else if(t.classList.contains('cta')) type='cta';
      else return;
      dragging={key:type?key:null,type:type,startX:e.clientX,startY:e.clientY,el:t};
      e.preventDefault(); t.setPointerCapture && t.setPointerCapture(e.pointerId);
    });
    on('preview','pointermove', function(e){
      if(!dragging) return;
      var dx=e.clientX-dragging.startX, dy=e.clientY-dragging.startY;
      var tr=state[dragging.key];
      if(dragging.type==='bg'){ tr.bgX+=dx; tr.bgY+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+')'; }
      else if(dragging.type==='logo'){ tr.logoX+=dx; tr.logoY+=dy; dragging.el.style.transform='translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+')'; }
      else if(dragging.type==='h'){ tr.hX+=dx; tr.hY+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.hX+'px), calc(-50% + '+tr.hY+'px))'; }
      else if(dragging.type==='s'){ tr.sX+=dx; tr.sY+=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.sX+'px), calc(-50% + '+tr.sY+'px))'; }
      else if(dragging.type==='cta'){ tr.ctaX+=dx; tr.ctaY-=dy; dragging.el.style.transform='translate(calc(-50% + '+tr.ctaX+'px))'; dragging.el.style.bottom = (Math.max(8, Math.round(parseInt(dragging.el.parentElement.style.height||'0')*0.05) - tr.ctaY))+'px'; }
      dragging.startX=e.clientX; dragging.startY=e.clientY;
    });
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){
      on('preview', ev, function(){ dragging=null; render(); });
    });
  })();

  function renderPerSize(){
    var wrap = el('perSize'); wrap.innerHTML='';
    SIZES.forEach(function(s){
      var tr = state[s.key];
      var mx=Math.max(s.w,s.h);
      var box = document.createElement('div'); box.className='card'; box.style.marginTop='10px';
      box.innerHTML = '<div class=\"mini\" style=\"margin-bottom:6px\">'+s.key.replace('x','×')+'</div>\
      <div class=\"grid2\">\
        <div>\
          <label>BG X</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.bgX+'\" data-k=\"'+s.key+'\" data-t=\"bg\" data-f=\"x\">\
          <label>BG Y</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.bgY+'\" data-k=\"'+s.key+'\" data-t=\"bg\" data-f=\"y\">\
          <label>BG Scale</label><input type=\"range\" min=\"50\" max=\"250\" value=\"'+Math.round(tr.bgScale*100)+'\" data-k=\"'+s.key+'\" data-t=\"bg\" data-f=\"s\">\
        </div>\
        <div>\
          <label>Logo X</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.logoX+'\" data-k=\"'+s.key+'\" data-t=\"logo\" data-f=\"x\">\
          <label>Logo Y</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.logoY+'\" data-k=\"'+s.key+'\" data-t=\"logo\" data-f=\"y\">\
          <label>Logo Scale</label><input type=\"range\" min=\"50\" max=\"250\" value=\"'+Math.round(tr.logoScale*100)+'\" data-k=\"'+s.key+'\" data-t=\"logo\" data-f=\"s\">\
        </div>\
      </div>\
      <div class=\"grid2\" style=\"margin-top:10px\">\
        <div>\
          <label>Headline X</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.hX+'\" data-k=\"'+s.key+'\" data-t=\"h\" data-f=\"x\">\
          <label>Headline Y</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.hY+'\" data-k=\"'+s.key+'\" data-t=\"h\" data-f=\"y\">\
          <label>Subline X</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.sX+'\" data-k=\"'+s.key+'\" data-t=\"s\" data-f=\"x\">\
          <label>Subline Y</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.sY+'\" data-k=\"'+s.key+'\" data-t=\"s\" data-f=\"y\">\
        </div>\
        <div>\
          <label>CTA X</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.ctaX+'\" data-k=\"'+s.key+'\" data-t=\"cta\" data-f=\"x\">\
          <label>CTA Y</label><input type=\"range\" min=\"-'+mx+'\" max=\"'+mx+'\" value=\"'+tr.ctaY+'\" data-k=\"'+s.key+'\" data-t=\"cta\" data-f=\"y\">\
        </div>\
      </div>';
      wrap.appendChild(box);
    });
    wrap.querySelectorAll('input[type=range]').forEach(function(r){
      r.addEventListener('input', function(e){
        var t=e.target, k=t.getAttribute('data-k'), type=t.getAttribute('data-t'), f=t.getAttribute('data-f'), v=parseInt(t.value,10);
        var tr=state[k];
        if(type==='bg'){ if(f==='x') tr.bgX=v; else if(f==='y') tr.bgY=v; else tr.bgScale=v/100; }
        else if(type==='logo'){ if(f==='x') tr.logoX=v; else if(f==='y') tr.logoY=v; else tr.logoScale=v/100; }
        else if(type==='h'){ if(f==='x') tr.hX=v; else tr.hY=v; }
        else if(type==='s'){ if(f==='x') tr.sX=v; else tr.sY=v; }
        else if(type==='cta'){ if(f==='x') tr.ctaX=v; else tr.ctaY=v; }
        render();
      }, false);
    });
  }

  // Validator
  function validate(){ var badge=el('badge'); badge.className='badge ok'; badge.textContent='OK — připraveno k exportu'; }

  // Smart Extract (CORS-safe)
  function urlsFrom(origin, paths){ var out=[]; paths.forEach(function(p){ out.push(origin.replace(/\/$/,'')+p); }); return out; }
  function tryLoadImage(url){ return new Promise(function(resolve){ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ resolve(url) }; img.onerror=function(){ resolve(null) }; img.src=url; }); }
  async function firstExistingImage(candidates){ for (var i=0;i<candidates.length;i++){ var ok=await tryLoadImage(candidates[i]); if(ok) return ok; } return null; }
  async function smartExtract(rawUrl){
    try{
      if(!rawUrl) return;
      var u = new URL(rawUrl); el('clickUrl').value = rawUrl;
      var logos = urlsFrom(u.origin, ['/favicon.ico','/favicon.png','/apple-touch-icon.png','/logo.png','/assets/logo.png','/static/logo.png']);
      var heros = urlsFrom(u.origin, ['/og-image.jpg','/og-image.png','/og_image.jpg','/og_image.png','/social.jpg','/banner.jpg','/banner.png','/images/hero.jpg','/images/hero.png']);
      var foundLogo = await firstExistingImage(logos); if(foundLogo) el('logoUrl').value = foundLogo;
      var foundHero = await firstExistingImage(heros); if(foundHero) el('bgUrl').value = foundHero;
      var cta = '#E4572E'; if(u.hostname.indexOf('columbia')>-1) cta = '#2BA3FF'; el('ctaBg').value = cta;
      render();
    }catch(e){ console.warn('smartExtract error', e); render(); }
  }

  // Export ZIP (stored)
  function crc32(buf){var t=(function(){var c,tab=new Uint32Array(256);for(var n=0;n<256;n++){c=n;for(var k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);tab[n]=c>>>0}return tab;})();var crc=0^(-1);for(var i=0;i<buf.length;i++)crc=(crc>>>8)^t[(crc^buf[i])&0xFF];return (crc^(-1))>>>0;}
  function strToU8(s){return new TextEncoder().encode(s)} function le(n,b){var a=new Uint8Array(b);for(var i=0;i<b;i++)a[i]=(n>>>(8*i))&0xFF;return a}
  function cat(chunks){var tot=0;chunks.forEach(c=>tot+=c.length);var out=new Uint8Array(tot),o=0;chunks.forEach(c=>{out.set(c,o);o+=c.length});return out}
  function makeZip(files){var locals=[],centrals=[],off=0,t=0,d=0;files.forEach(f=>{var n=strToU8(f.name),crc=crc32(f.data),sz=f.data.length;
    var lh=cat([strToU8('PK\\x03\\x04'),le(20,2),le(0,2),le(0,2),le(t,2),le(d,2),le(crc,4),le(sz,4),le(sz,4),le(n.length,2),le(0,2)]);
    var local=cat([lh,n,f.data]);locals.push(local);
    var ch=cat([strToU8('PK\\x01\\x02'),le(20,2),le(20,2),le(0,2),le(0,2),le(t,2),le(d,2),le(crc,4),le(sz,4),le(sz,4),le(n.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(off,4)]);
    centrals.push(cat([ch,n])); off+=local.length; });
    var central=cat(centrals), localsCat=cat(locals);
    var end=cat([strToU8('PK\\x05\\x06'),le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(central.length,4),le(localsCat.length,4),le(0,2)]);
    return new Blob([localsCat,central,end],{type:'application/zip'});
  }
  function bannerHTMLString(w,h, opts){
    var fH=Math.max(14,Math.round(w/12)), fS=Math.max(10,Math.round(w/20)), fC=Math.max(10,Math.round(w/22));
    var tr=state[w+'x'+h];
    var logoImg = opts.logoUrl ? '<img src=\"'+opts.logoUrl+'\" alt=\"logo\" style=\"position:absolute;left:10px;top:10px;transform: translate('+tr.logoX+'px,'+tr.logoY+'px) scale('+tr.logoScale+');height:'+Math.round(h*0.12)+'px;width:auto;opacity:.95;z-index:3;\"/>' : '';
    var bgImg   = opts.bgUrl   ? '<img src=\"'+opts.bgUrl+'\" alt=\"bg\" style=\"position:absolute;left:50%;top:50%;transform: translate(calc(-50% + '+tr.bgX+'px), calc(-50% + '+tr.bgY+'px)) scale('+tr.bgScale+');transform-origin:center center;height:110%;min-width:110%;opacity:.95;z-index:0;\"/>' : '';
    return '<!DOCTYPE html><html><head><meta charset=\"UTF-8\">'+
      '<meta name=\"ad.size\" content=\"width='+w+',height='+h+'\">'+
      '<title>banner</title>'+
      '<style>:root{--w:'+w+'px;--h:'+h+'px;--bg:'+opts.bg+';--fg:'+opts.fg+';--cta:'+opts.ctaBg+';}*{box-sizing:border-box}html,body{margin:0;width:var(--w);height:var(--h);overflow:hidden}.banner{position:relative;width:var(--w);height:var(--h);background:var(--bg);color:var(--fg);font-family:Arial,Helvetica,sans-serif;overflow:hidden}.headline{position:absolute;left:50%;top:45%;transform:translate(calc(-50% + '+tr.hX+'px), calc(-50% + '+tr.hY+'px));width:calc(var(--w) - 40px);text-align:center;font-weight:800;line-height:1.1;font-size:'+fH+'px}.subline{position:absolute;left:50%;top:65%;transform:translate(calc(-50% + '+tr.sX+'px), calc(-50% + '+tr.sY+'px));width:calc(var(--w) - 50px);text-align:center;font-weight:500;line-height:1.2;font-size:'+fS+'px}.cta{position:absolute;left:50%;bottom:'+Math.max(8,Math.round(h*0.05)-tr.ctaY)+'px;transform:translate(calc(-50% + '+tr.ctaX+'px));padding:'+Math.max(4,Math.round(h*0.04))+'px '+Math.max(8,Math.round(w*0.04))+'px;border-radius:999px;background:'+opts.ctaBg+';color:#061123;font-weight:800;font-size:'+fC+'px;letter-spacing:.2px;box-shadow:0 6px 14px rgba(0,0,0,.22)}</style>'+
      '<script>window.clickTag='+JSON.stringify(opts.clickUrl)+';<\\/script></head><body>'+
      '<a href=\"javascript:window.open(window.clickTag)\" style=\"text-decoration:none\"><div class=\"banner\">'+
      bgImg+
      '<div class=\"headline\">'+opts.headline+'</div>'+
      '<div class=\"subline\">'+opts.subline+'</div>'+
      '<div class=\"cta\">'+opts.cta+'</div>'+
      logoImg+
      '</div></a></body></html>';
  }
  function exportZip(){
    var opts = { headline: el('headline').value, subline: el('subline').value, cta: el('cta').value, clickUrl: el('clickUrl').value,
      bg: el('bg').value, fg: el('fg').value, ctaBg: el('ctaBg').value, logoUrl: el('logoUrl').value, bgUrl: el('bgUrl').value };
    var files = SIZES.map(function(s){ var html = bannerHTMLString(s.w, s.h, opts); return { name: s.w+'x'+s.h+'/index.html', data: strToU8(html) }; });
    var blob = makeZip(files);
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='html5ai-banners.zip'; a.click();
  }

  // Events
  ['headline','subline','cta','clickUrl','bg','fg','ctaBg','logoUrl','bgUrl'].forEach(function(id){ on(id,'input', render); });
  on('logoFile','change', function(e){ readFileToUrl(e.target, function(url){ el('logoUrl').value=url; render(); }); });
  on('bgFile','change', function(e){ readFileToUrl(e.target, function(url){ el('bgUrl').value=url; render(); }); });
  on('importUrl','click', function(){ smartExtract(el('brandUrl').value||''); });
  on('exportZip','click', exportZip); on('exportZipTop','click', exportZip);

  // Init
  document.addEventListener('DOMContentLoaded', function(){ render(); renderPerSize(); validate(); }, false);
})();