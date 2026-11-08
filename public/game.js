// Mosha Mara: swat the Dhaka mosquitoes before dusk ends. A small example of every Ikirmikir SDK 1.0 call.
// Look for "SDK:" comments. The game plays the same with or without Ikirmikir: outside it, the SDK runs in local mode.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const ROUND_SECONDS = 30;

let ik;                      // the SDK, once init resolves
let state = "loading";       // loading, menu, playing, paused, over
let mosquitoes = [], splats = [], score = 0, best = 0, timeLeft = ROUND_SECONDS, last = 0, skyline = [];
let audio, muted = false;

main();

async function main() {
  resize();
  addEventListener("resize", resize);
  requestAnimationFrame(frame);

  // SDK: start it early, during loading. It never rejects.
  ik = await Ikirmikir.init({ gameId: "mosha-mara" });
  muted = ik.muted;                                                        // SDK: Ikirmikir's sound switch wins
  ik.on("mute", m => { muted = m });
  ik.on("pause", () => { if (state === "playing") { state = "paused"; ik.game.gameplayStop() } });   // SDK: player left
  ik.on("resume", () => { if (state === "paused") { state = "playing"; last = performance.now(); ik.game.gameplayStart() } });

  // A pretend asset load in steps, so the loading bar has something to show.
  const steps = [buildSkyline, loadBest, () => wait(250), () => wait(250)];
  for (let i = 0; i < steps.length; i++) {
    await steps[i]();
    ik.game.loadingProgress(Math.round(((i + 1) / steps.length) * 100)); // SDK: real loading progress, 0 to 100
  }
  ik.game.loadingDone();                                                   // SDK: Ikirmikir hides its loader
  state = "menu";

  canvas.addEventListener("pointerdown", tap);
  addEventListener("keydown", e => { if (e.code === "Space" && state !== "playing") start() });
}

function start() {
  score = 0; timeLeft = ROUND_SECONDS; mosquitoes = []; splats = []; last = performance.now();
  state = "playing";
  ik.game.gameplayStart();                                                 // SDK: someone is really playing
}

function end() {
  state = "over";
  ik.game.gameplayStop();                                                  // SDK: play stopped
  if (score > best) { best = score; try { localStorage.setItem("mosha-best", String(best)) } catch {} }
}

async function tap(e) {
  if (!audio) audio = new AudioContext();                                  // browsers start sound only after a tap
  const x = e.clientX, y = e.clientY;
  if (state === "menu") return start();
  if (state === "over") {
    if (ik.has("share") && inside(x, y, shareButton())) return ik.share(); // SDK: share the game's link
    return start();
  }
  if (state !== "playing") return;
  for (let i = mosquitoes.length - 1; i >= 0; i--) {
    const m = mosquitoes[i];
    if (Math.hypot(m.x - x, m.y - y) < m.r * 2.4) {
      mosquitoes.splice(i, 1); splats.push({ x: m.x, y: m.y, t: 0 }); score++;
      return slap();
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  if (state === "playing") update(dt);
  draw();
  requestAnimationFrame(frame);
}

function update(dt) {
  timeLeft -= dt;
  if (timeLeft <= 0) return end();
  const rate = 1.2 + (ROUND_SECONDS - timeLeft) / 8;                       // more mosquitoes as dusk falls
  if (Math.random() < rate * dt) mosquitoes.push(spawn());
  for (const m of mosquitoes) {
    m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt + Math.sin(m.t * 9) * 0.8;
    if (m.x < 0 || m.x > innerWidth) m.vx *= -1;
    if (m.y < 40 || m.y > innerHeight - 40) m.vy *= -1;
  }
  splats = splats.filter(s => (s.t += dt) < 0.6);
  if (Math.random() < 3 * dt && mosquitoes.length) buzz();
}

function spawn() {
  const side = Math.random() < 0.5;
  return { x: side ? 10 : innerWidth - 10, y: 80 + Math.random() * (innerHeight - 200), vx: (side ? 1 : -1) * (60 + Math.random() * 90),
    vy: (Math.random() - 0.5) * 80, r: Math.max(6, Math.min(innerWidth, innerHeight) / 70), t: Math.random() * 5 };
}

function draw() {
  const w = innerWidth, h = innerHeight;
  const dusk = state === "playing" || state === "paused" ? 1 - timeLeft / ROUND_SECONDS : 0;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, mix("#ff9e5e", "#241a4a", dusk)); sky.addColorStop(1, mix("#ffd27a", "#3b2a63", dusk));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1b1430";
  for (const b of skyline) ctx.fillRect(b.x * w, h - b.h * h, b.w * w, b.h * h);

  for (const s of splats) { ctx.globalAlpha = 1 - s.t / 0.6; dot(s.x, s.y, 14, "#c0392b"); ctx.globalAlpha = 1 }
  for (const m of mosquitoes) drawMosquito(m);

  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const big = Math.min(48, w / 12), small = Math.min(20, w / 26);
  if (state === "loading") text("Loading…", w / 2, h / 2, big);
  if (state === "menu") {
    text("Mosha Mara", w / 2, h / 2 - big, big * 1.3);
    text("Tap the mosquitoes before dark. Tap to start.", w / 2, h / 2 + big * 0.4, small);
    // SDK: player context, shown here only to demonstrate it.
    text(`${ik.env === "ikirmikir" ? "On Ikirmikir" : "Running on its own"} · ${ik.context.device} · language ${ik.context.language}`, w / 2, h - 40, small * 0.8);
  }
  if (state === "playing" || state === "paused") {
    ctx.textAlign = "left"; text(`Swatted ${score}`, 20, 32, small * 1.2);
    ctx.textAlign = "right"; text(`${Math.ceil(timeLeft)}s`, w - 20, 32, small * 1.2);
    ctx.textAlign = "center";
    if (state === "paused") text("Paused", w / 2, h / 2, big);
  }
  if (state === "over") {
    text(`You swatted ${score}`, w / 2, h / 2 - big, big);
    text(`Best ${best} · tap to play again`, w / 2, h / 2 + small, small);
    if (ik.has("share")) {
      const b = shareButton();
      ctx.fillStyle = "#c6f432"; roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill();
      ctx.fillStyle = "#1a2300"; text("Share", b.x + b.w / 2, b.y + b.h / 2, small);
    }
  }
}

function drawMosquito(m) {
  const flap = Math.sin(m.t * 60) * m.r * 0.8;
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); ctx.ellipse(m.x - m.r * 0.6, m.y - m.r * 0.6, m.r * 0.9, Math.abs(flap) + 1, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(m.x + m.r * 0.6, m.y - m.r * 0.6, m.r * 0.9, Math.abs(flap) + 1, 0.6, 0, Math.PI * 2); ctx.fill();
  dot(m.x, m.y, m.r * 0.7, "#2b1d14");
  ctx.strokeStyle = "#2b1d14"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.sign(m.vx) * m.r * 1.6, m.y + m.r * 0.4); ctx.stroke();
}

// Sounds are made in code, so the example needs no asset files. Both stay silent while Ikirmikir's sound is off.
function buzz() { tone(520 + Math.random() * 120, 0.12, 0.015, "sawtooth") }
function slap() { tone(140, 0.08, 0.2, "square") }
function tone(freq, length, volume, type) {
  if (!audio || muted) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(volume, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + length);
  o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + length);
}

function buildSkyline() {
  skyline = [];
  for (let x = 0; x < 1; x += 0.06 + Math.random() * 0.05) skyline.push({ x, w: 0.05 + Math.random() * 0.06, h: 0.12 + Math.random() * 0.22 });
}
function loadBest() { try { best = Number(localStorage.getItem("mosha-best")) || 0 } catch {} }
function shareButton() { const w = 160, h = 48; return { x: innerWidth / 2 - w / 2, y: innerHeight / 2 + 60, w, h } }
function inside(x, y, b) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h }
function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
function dot(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() }
function text(s, x, y, size) { ctx.font = `700 ${size}px system-ui, sans-serif`; ctx.fillText(s, x, y) }
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }
function resize() { const d = devicePixelRatio || 1; canvas.width = innerWidth * d; canvas.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0) }
function mix(a, b, t) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
}
