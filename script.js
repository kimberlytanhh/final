/* Kiss Cam — FINAL WORKING HEART CAMERA */
const video = document.getElementById('video');
const canvas = document.getElementById('cameraCanvas');
const ctx = canvas.getContext('2d');

const searchBtn = document.getElementById('searchBtn');
const kissBtn = document.getElementById('kissBtn');
const message = document.getElementById('message');
const particles = document.getElementById('particles');
const rotationSelect = document.getElementById('rotationSelect');

let rotationDeg = 0;
let currentScale = 1;
let lastScale = 1;
let startDist = null;
const pointerMap = new Map();
const MIN_SCALE = 1;
const MAX_SCALE = 4;

/* FIXED: Resize canvas exactly to heart wrapper */
function resizeCanvas(){
  const rect = document.getElementById('cameraHeart').getBoundingClientRect();
  const DPR = window.devicePixelRatio || 1;

  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  canvas.width  = rect.width * DPR;
  canvas.height = rect.height * DPR;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* Start camera */
async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:"environment" },
      audio:false
    });
    video.srcObject = stream;
    await video.play();
  }catch(e){
    console.error("Camera error:", e);
  }
  requestAnimationFrame(drawLoop);
}

/* Draw camera feed */
function drawLoop(){
  requestAnimationFrame(drawLoop);
  if(video.readyState < 2) return;

  const DPR = window.devicePixelRatio || 1;
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.scale(DPR, DPR);

  ctx.translate(w/2, h/2);
  ctx.rotate(rotationDeg * Math.PI / 180);
  ctx.scale(currentScale, currentScale);

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;

  ctx.drawImage(video, -dw/2, -dh/2, dw, dh);

  ctx.restore();
}

/* Pinch Zoom */
function dist(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }

document.addEventListener('pointerdown', e=>{
  pointerMap.set(e.pointerId, e);
  if(pointerMap.size===2){
    const [p1,p2]=Array.from(pointerMap.values());
    startDist = dist(p1,p2);
    lastScale = currentScale;
  }
});

document.addEventListener('pointermove', e=>{
  if(pointerMap.has(e.pointerId)){
    pointerMap.set(e.pointerId, e);
    if(pointerMap.size===2 && startDist){
      const [p1,p2]=Array.from(pointerMap.values());
      const factor = dist(p1,p2)/startDist;
      currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale * factor));
    }
  }
});

document.addEventListener('pointerup', e=>{
  pointerMap.delete(e.pointerId);
  if(pointerMap.size < 2) startDist=null;
});

/* Double tap reset */
let lastTap=0;
document.addEventListener('touchend', ()=>{
  const now=Date.now();
  if(now-lastTap<300) currentScale=1;
  lastTap=now;
});

/* Particles */
function createHeart(x,y){
  const el=document.createElement('div');
  el.className='heartParticle';
  el.style.left=x+'px';
  el.style.top=y+'px';
  el.style.width='40px';
  el.style.height='40px';
  el.innerHTML=`<svg viewBox="0 0 32 29" width="100%" height="100%">
    <path d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9 3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z"
      fill="#ff2a2a"/></svg>`;
  particles.appendChild(el);

  requestAnimationFrame(()=>{
    el.style.transition="transform 1.2s ease-out, opacity 1.4s";
    el.style.transform=`translate(${(Math.random()-0.5)*200}px, -200px) rotate(${Math.random()*360}deg)`;
    el.style.opacity="1";
  });

  setTimeout(()=>el.remove(),1500);
}

function burstHearts(){
  const cx=window.innerWidth/2;
  const cy=window.innerHeight/2;
  for(let i=0;i<30;i++) createHeart(cx,cy);
}

/* Buttons */
function setSearching(){
  particles.innerHTML='';
  message.textContent='Who shall be the lucky couple?';
}
function doKiss(){
  particles.innerHTML='';
  message.textContent='KISS!';
  burstHearts();
}

/* Rotation */
rotationSelect.addEventListener('change', ()=>{
  rotationDeg=parseInt(rotationSelect.value,10)||0;
});

searchBtn.addEventListener('click', setSearching);
kissBtn.addEventListener('click', doKiss);

startCamera();
setSearching();
