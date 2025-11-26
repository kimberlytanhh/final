/* Kiss Cam — FULLY UPDATED script.js (drop-in replacement) */

const video = document.getElementById('video');
const canvas = document.getElementById('cameraCanvas');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

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

/* Resize canvas exactly to the heart wrapper size (handles DPR) */
function resizeCanvas(){
  const wrapper = document.getElementById('cameraHeart');
  if(!wrapper || !canvas) return;

  const rect = wrapper.getBoundingClientRect();
  const DPR = window.devicePixelRatio || 1;

  // Set CSS size
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  // Set actual pixel size for crisp rendering
  canvas.width  = Math.max(1, Math.floor(rect.width * DPR));
  canvas.height = Math.max(1, Math.floor(rect.height * DPR));
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
  // small delay on orientation change to let layout settle
  setTimeout(resizeCanvas, 120);
});

/* Also call resize after DOM is ready just in case */
window.addEventListener('DOMContentLoaded', resizeCanvas);

/* Start camera and ensure resize after video metadata ready */
async function startCamera(){
  if(!video) return;
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;

    // When metadata loads we know videoWidth/videoHeight -> resize canvas
    video.addEventListener('loadedmetadata', () => {
      resizeCanvas();
    }, { once: true });

    await video.play();
  }catch(e){
    console.error("Camera error:", e);
    return;
  }

  // Make sure canvas fits final layout after camera started
  resizeCanvas();
  requestAnimationFrame(drawLoop);
}

/* Draw camera feed into the canvas with rotation + scale */
function drawLoop(){
  // continue loop
  requestAnimationFrame(drawLoop);

  if(!video || !ctx) return;
  if(video.readyState < 2) return; // not enough data yet

  const DPR = window.devicePixelRatio || 1;
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  // Reset transform and clear (working in device pixels)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(DPR, DPR);                  // scale to CSS pixels
  ctx.translate(w / 2, h / 2);         // origin to center of canvas
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.scale(currentScale, currentScale);

  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;

  // Fill the canvas while preserving aspect ratio (cover)
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;

  // draw centered
  ctx.drawImage(video, -dw / 2, -dh / 2, dw, dh);

  ctx.restore();
}

/* Helper: distance between two pointer events */
function dist(a, b){
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/* Pointer (touch/mouse) handling for pinch zoom */
document.addEventListener('pointerdown', e => {
  pointerMap.set(e.pointerId, e);
  // Capture pointer so we receive move/up events
  try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  if(pointerMap.size === 2){
    const [p1, p2] = Array.from(pointerMap.values());
    startDist = dist(p1, p2);
    lastScale = currentScale;
  }
});

document.addEventListener('pointermove', e => {
  if(!pointerMap.has(e.pointerId)) return;
  pointerMap.set(e.pointerId, e);
  if(pointerMap.size === 2 && startDist){
    const [p1, p2] = Array.from(pointerMap.values());
    const factor = dist(p1, p2) / startDist;
    currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale * factor));
  }
});

function endPointer(e){
  pointerMap.delete(e.pointerId);
  // release pointer capture if set
  try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
  if(pointerMap.size < 2) startDist = null;
}

document.addEventListener('pointerup', endPointer);
document.addEventListener('pointercancel', endPointer);
document.addEventListener('pointerout', endPointer);
document.addEventListener('pointerleave', endPointer);

/* Double-tap (touch) to reset scale */
let lastTap = 0;
document.addEventListener('touchend', (ev) => {
  const now = Date.now();
  if(now - lastTap < 300){
    currentScale = 1;
    lastScale = 1;
  }
  lastTap = now;
});

/* Particles (hearts) */
function createHeart(x, y){
  if(!particles) return;
  const el = document.createElement('div');
  el.className = 'heartParticle';
  el.style.position = 'absolute';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.width = '40px';
  el.style.height = '40px';
  el.style.pointerEvents = 'none';
  el.innerHTML = `<svg viewBox="0 0 32 29" width="100%" height="100%"><path d="M23.6 2.6c-2.4 0-4.6 1.3-5.6 3.3-1-2-3.2-3.3-5.6-3.3C5.4 2.6 2 6 2 10.1c0 6.1 10.6 12.1 14 16.9 3.4-4.8 14-10.8 14-16.9 0-4.1-3.4-7.5-6.4-7.5z" fill="#ff2a2a"/></svg>`;
  particles.appendChild(el);

  // animate
  requestAnimationFrame(() => {
    el.style.transition = "transform 1.2s ease-out, opacity 1.4s";
    el.style.transform = `translate(${(Math.random() - 0.5) * 200}px, -200px) rotate(${Math.random() * 360}deg)`;
    el.style.opacity = "1";
  });

  setTimeout(() => el.remove(), 1600);
}

function burstHearts(){
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for(let i = 0; i < 30; i++) createHeart(cx, cy);
}

/* Buttons behavior */
function setSearching(){
  if(particles) particles.innerHTML = '';
  if(message) message.textContent = 'Who shall be the lucky couple?';
}
function doKiss(){
  if(particles) particles.innerHTML = '';
  if(message) message.textContent = 'KISS!';
  burstHearts();
}

/* Rotation select (safe, only if present in DOM) */
if(rotationSelect){
  rotationSelect.addEventListener('change', () => {
    rotationDeg = parseInt(rotationSelect.value, 10) || 0;
  });
} else {
  // default no rotation
  rotationDeg = 0;
}

/* Button event binding (safety checks) */
if(searchBtn) searchBtn.addEventListener('click', setSearching);
if(kissBtn) kissBtn.addEventListener('click', doKiss);

/* Start everything */
startCamera();
setSearching();