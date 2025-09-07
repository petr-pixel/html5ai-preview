function el(id){return document.getElementById(id)}
function play(){document.querySelectorAll('.banner').forEach(b=>b.classList.remove('paused'))}
function pause(){document.querySelectorAll('.banner').forEach(b=>b.classList.add('paused'))}
function replay(){document.querySelectorAll('.banner').forEach(b=>{b.classList.remove('anim-fade','anim-slide');void b.offsetWidth;b.classList.add('anim-fade')})}
// Minimal demo render
document.addEventListener('DOMContentLoaded',()=>{
  const app=document.getElementById('app');
  app.innerHTML='<div class="previewCard"><div class="canvas" style="width:300px;height:250px"><div class="banner anim-fade"><div class="headline" data-part="h">Teplo do mrazu</div><div class="subline" data-part="s">Funkční vrstvy 24/7</div><div class="cta" data-part="c">Zjistit více</div></div></div></div><button onclick="play()">Play</button><button onclick="pause()">Pause</button><button onclick="replay()">Replay</button>';
});