(function(){
  // --- sizes
  var SIZES=[{key:'300x250',w:300,h:250},{key:'336x280',w:336,h:280},{key:'300x600',w:300,h:600},{key:'728x90',w:728,h:90},{key:'970x90',w:970,h:90}];
  function el(id){ return document.getElementById(id); }
  function px(n){ return n+'px'; }
  function activeSizes(){
    var a=[]; document.querySelectorAll('#sizes input[type=checkbox]').forEach(function(cb){
      if(cb.checked){
        var s = SIZES.find(x=>x.key===cb.dataset.size);
        if(s) a.push(s);
      }
    });
    if(!a.length) a.push(SIZES[0]);
    return a;
  }
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
  function render(){
    var grid=el('preview'); grid.innerHTML='';
    var H=el('headline').value||''; var S=el('subline').value||''; var C=el('cta').value||'';
    var hSize=parseInt(el('hSize').value,10)||28; var sSize=parseInt(el('sSize').value,10)||16; var cSize=parseInt(el('cSize').value,10)||16;
    var hColor=el('hColor').value; var sColor=el('sColor').value; var cTxt=el('cTextColor').value; var cBg=el('cBgColor').value;
    var bgCss=el('bg').value||'linear-gradient(180deg,#17324F,#0A1A2B)';
    activeSizes().forEach(function(s){
      var card=document.createElement('div'); card.className='previewCard';
      var head=document.createElement('div'); head.className='mini'; head.textContent=s.key; card.appendChild(head);
      var canvas=document.createElement('div'); canvas.className='canvas'; canvas.style.width=px(s.w); canvas.style.height=px(s.h); card.appendChild(canvas);
      var banner=document.createElement('div'); banner.className='banner'; banner.style.background=bgCss; canvas.appendChild(banner);
      var hl=document.createElement('div'); hl.className='headline'; hl.textContent=H; hl.style.color=hColor; hl.style.fontSize=px(hSize); banner.appendChild(hl);
      var sl=document.createElement('div'); sl.className='subline'; sl.textContent=S; sl.style.color=sColor; sl.style.fontSize=px(sSize); banner.appendChild(sl);
      var ct=document.createElement('div'); ct.className='cta'; ct.textContent=C; ct.style.color=cTxt; ct.style.background=cBg; ct.style.fontSize=px(cSize); banner.appendChild(ct);
      grid.appendChild(card);
    });
    ensureAnimStyle();
    pauseAnimations(); // default = static
  }
  function playAnimations(){ isPlaying=true; animNodes().forEach(n=> n.style.animationPlayState='running'); var t=el('animToggle'); if(t) t.textContent='Pause'; }
  function pauseAnimations(){ isPlaying=false; animNodes().forEach(n=> n.style.animationPlayState='paused'); var t=el('animToggle'); if(t) t.textContent='Play'; }
  function resetAnimations(){
    var nodes=animNodes(); nodes.forEach(n=>{ n.style.animation='none'; n.style.animationPlayState='paused'; n.style.animationIterationCount=''; });
    void document.body.offsetWidth;
    var loops = Math.min(3, parseInt(el('animLoops').value,10) || 1);
    nodes.forEach(n=>{ n.style.animation=''; n.style.animationIterationCount=String(loops); n.style.animationPlayState = isPlaying?'running':'paused'; });
  }

  // events
  ['headline','subline','cta','hSize','sSize','cSize','hColor','sColor','cTextColor','cBgColor','bg'].forEach(function(id){
    var x=el(id); if(x) x.addEventListener('input', render);
  });
  document.querySelectorAll('#sizes input[type=checkbox]').forEach(function(cb){ cb.addEventListener('change', render); });
  el('animPreset').addEventListener('change', function(){ ensureAnimStyle(); resetAnimations(); });
  el('animDur').addEventListener('change', function(){ ensureAnimStyle(); resetAnimations(); });
  el('animLoops').addEventListener('change', function(){ resetAnimations(); });
  el('animToggle').addEventListener('click', function(){ if(isPlaying) pauseAnimations(); else { ensureAnimStyle(); resetAnimations(); playAnimations(); } });

  document.addEventListener('DOMContentLoaded', function(){ render(); });
})();