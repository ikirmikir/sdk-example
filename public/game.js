// Mosha Mara: swat the Dhaka mosquitoes before dark. A small example of the Ikirmikir SDK 1.3.1, in Ikirmikir's paper
// and pencil look. Look for "SDK:" comments. The game plays the same with or without Ikirmikir: outside it, the SDK
// runs in local mode (saves in this browser, no leaderboard).
// A round starts only from the Start or Play again button (Maruf, 2026-11-12: stray taps kept starting new games).

const $ = id => document.getElementById(id);
const canvas = $("game"), ctx = canvas.getContext("2d");
const ROUND_SECONDS = 30, BOARD = "mosquitoes";            // BOARD: Mosha Mara's leaderboard on Ikirmikir
const INK = "#1E1E24", PENCIL = "#8d8d96", RED = "#b42318", YELLOW = "#FFD60A", PAPER = "#FCFBF6";

let ik;                                                    // the SDK, once init resolves
let state = "loading";                                     // loading, menu, playing, paused, over
let mosquitoes = [], splats = [], score = 0, best = 0, timeLeft = ROUND_SECONDS, last = 0;
let roofs = null, hatch = [];                              // the skyline, drawn once per size; dusk's pencil shading
let audio, muted = false;

main();

async function main() {
  resize();
  addEventListener("resize", resize);
  requestAnimationFrame(frame);

  ik = await Ikirmikir.init({ gameId: "mosha-mara" });    // SDK: start it early, during loading. It never rejects.
  muted = ik.muted;                                        // SDK: Ikirmikir's sound switch wins
  ik.on("mute", m => { muted = m });
  ik.on("pause", () => { if (state === "playing") { state = "paused"; ik.game.gameplayStop(); show() } });   // SDK: player left
  ik.on("resume", () => { if (state === "paused") { state = "playing"; last = performance.now(); ik.game.gameplayStart(); show() } });

  ik.game.loadingProgress(40);                             // SDK: loading progress, 0 to 100
  await document.fonts.ready.catch(() => {});
  const me = await ik.player.get().catch(() => null);      // SDK 1.3: the player; a name when signed in on Ikirmikir
  if (me?.name) $("hello").textContent = `Hi, ${me.name}.`;
  best = await loadBest();
  ik.game.loadingProgress(100);
  ik.game.loadingDone();                                   // SDK: Ikirmikir hides its loader

  canvas.addEventListener("pointerdown", tap);
  $("start").onclick = start;
  $("again").onclick = start;
  $("share").onclick = () => ik.share({ score: { board: BOARD, value: score } }); // SDK 1.3.1: a score card with the game's link
  for (const b of document.querySelectorAll(".btn")) b.addEventListener("pointerdown", () => { wake(); ik.sound.play("click") }); // SDK: Ikirmikir's click
  state = "menu"; show();
}

function start() {
  wake();
  score = 0; timeLeft = ROUND_SECONDS; mosquitoes = []; splats = []; last = performance.now();
  state = "playing"; show();
  ik.game.gameplayStart();                                 // SDK: someone is really playing
}

async function end() {
  state = "over";
  ik.game.gameplayStop();                                  // SDK: play stopped
  const fresh = score > best;
  if (fresh) { best = score; ik.data.set("best", best) }  // SDK 1.3: saves stay with the player on Ikirmikir
  $("final").textContent = score;
  $("bestLine").textContent = fresh && score > 0 ? "A new best!" : `Your best: ${best}`;
  $("place").textContent = "";
  $("share").hidden = !ik.has("share");
  // a moment before Play again works, so taps still landing on mosquitoes don't start the next round
  $("again").disabled = true; setTimeout(() => { $("again").disabled = false }, 900);
  show();
  if (score > 0) {
    await ik.scores.submit(BOARD, score).catch(() => null); // SDK 1.3: the leaderboard (signed-in players are listed)
    const r = await ik.scores.rank(BOARD, score).catch(() => null); // SDK 1.3: where this round places; null on its own
    if (state === "over" && r?.week) $("place").textContent = `${ordinal(r.week.place)} this week` + (r.week.beat !== null ? `, better than ${r.week.beat}% of players` : "");
  }
}

function tap(e) {
  if (state !== "playing") return;                         // only the buttons start a round
  const x = e.clientX, y = e.clientY;
  for (let i = mosquitoes.length - 1; i >= 0; i--) {
    const m = mosquitoes[i];
    if (Math.hypot(m.x - x, m.y - y) < m.r * 2.6) {
      mosquitoes.splice(i, 1); splats.push(splat(m.x, m.y)); score++;
      $("score").textContent = score;
      return slap();
    }
  }
}

// which parts of the page show for each state
function show() {
  $("menu").hidden = state !== "menu";
  $("over").hidden = state !== "over";
  $("hud").hidden = state !== "playing" && state !== "paused";
  $("paused").hidden = state !== "paused";
  $("score").textContent = score;
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
  if (timeLeft <= 0) { timeLeft = 0; return void end() }
  $("time").textContent = Math.ceil(timeLeft);
  $("timeChip").classList.toggle("late", timeLeft <= 5);
  const rate = 1.2 + (ROUND_SECONDS - timeLeft) / 8;      // more mosquitoes as dusk falls
  if (Math.random() < rate * dt) mosquitoes.push(spawn());
  const top = 70, bottom = innerHeight * 0.72;
  for (const m of mosquitoes) {
    m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt + Math.sin(m.t * 9) * 0.8;
    if (m.x < 0 || m.x > innerWidth) m.vx *= -1;
    if (m.y < top || m.y > bottom) m.vy *= -1;
  }
  splats = splats.filter(s => (s.t += dt) < 0.8);
  if (Math.random() < 3 * dt && mosquitoes.length) buzz();
}

function spawn() {
  const side = Math.random() < 0.5;
  return { x: side ? 10 : innerWidth - 10, y: 90 + Math.random() * (innerHeight * 0.6 - 90), vx: (side ? 1 : -1) * (60 + Math.random() * 90),
    vy: (Math.random() - 0.5) * 80, r: Math.max(7, Math.min(innerWidth, innerHeight) / 60), t: Math.random() * 5 };
}

// ---------- drawing: paper, pencil and a little colour ----------
function draw() {
  const w = innerWidth, h = innerHeight;
  const dusk = state === "playing" || state === "paused" ? 1 - timeLeft / ROUND_SECONDS : state === "over" ? 1 : 0;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  // the sun, a yellow pencil circle, sinks behind the roofs; then graphite shading creeps down the sky
  const sy = h * (0.2 + dusk * 0.55), sr = Math.min(w, h) * 0.09;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h * 0.78); ctx.clip();
  ctx.globalAlpha = 0.9; ctx.strokeStyle = YELLOW; ctx.lineWidth = 3;
  for (let i = -sr; i < sr; i += 5) { const half = Math.sqrt(sr * sr - i * i); line(w * 0.72 - half, sy + i, w * 0.72 + half, sy + i - 3) }
  ctx.globalAlpha = 1; ctx.strokeStyle = "#c79a00"; ctx.lineWidth = 1.6; circle(w * 0.72, sy, sr);
  ctx.restore();
  ctx.strokeStyle = PENCIL; ctx.lineWidth = 1;
  const reach = Math.floor(hatch.length * dusk);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < reach; i++) { const l = hatch[i]; line(l[0], l[1], l[2], l[3]) }
  ctx.globalAlpha = 1;
  if (roofs) ctx.drawImage(roofs, 0, 0, w, h);

  for (const s of splats) drawSplat(s);
  for (const m of mosquitoes) drawMosquito(m);
  if (state === "loading") { ctx.fillStyle = INK; ctx.font = `700 32px Kalam, cursive`; ctx.textAlign = "center"; ctx.fillText("Loading…", w / 2, h / 2) }
}

// a mosquito in pencil: a thin body, a long nose, dangling legs and two flapping wings
function drawMosquito(m) {
  const r = m.r, dir = Math.sign(m.vx) || 1, flap = Math.abs(Math.sin(m.t * 60));
  ctx.strokeStyle = PENCIL; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(m.x - r * 0.3 * dir, m.y - r * 0.9, r * 1.1, r * (0.25 + flap * 0.45), -0.5 * dir, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(m.x + r * 0.3 * dir, m.y - r * 0.9, r * 1.1, r * (0.25 + flap * 0.45), 0.5 * dir, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineCap = "round";
  for (let k = -1; k <= 1; k++) { ctx.lineWidth = 1; line(m.x + k * r * 0.5, m.y + r * 0.2, m.x + k * r * 0.9 - dir * r * 0.2, m.y + r * 1.6) }
  ctx.lineWidth = r * 0.55; line(m.x - dir * r * 0.9, m.y + r * 0.15, m.x + dir * r * 0.3, m.y - r * 0.05);
  ctx.lineWidth = r * 0.6; line(m.x + dir * r * 0.55, m.y - r * 0.1, m.x + dir * r * 0.6, m.y - r * 0.12);
  ctx.lineWidth = 1.2; line(m.x + dir * r * 0.7, m.y - r * 0.1, m.x + dir * r * 1.9, m.y + r * 0.35);
}

// a hit: a quick red pencil scribble that fades
function splat(x, y) { return { x, y, t: 0, pts: Array.from({ length: 9 }, () => [(Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26]) } }
function drawSplat(s) {
  ctx.globalAlpha = 1 - s.t / 0.8; ctx.strokeStyle = RED; ctx.lineWidth = 2.2; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(s.x + s.pts[0][0], s.y + s.pts[0][1]);
  for (const p of s.pts.slice(1)) ctx.lineTo(s.x + p[0], s.y + p[1]);
  ctx.stroke();
  ctx.fillStyle = RED; ctx.font = "700 20px Kalam, cursive"; ctx.textAlign = "center"; ctx.fillText("+1", s.x, s.y - 18 - s.t * 30);
  ctx.globalAlpha = 1;
}

// Dhaka rooftops in pencil along the bottom: blocks of flats with windows, water tanks, antennas and a washing line.
// Drawn once for each screen size, a little differently by hand each time.
function buildRoofs() {
  const w = innerWidth, h = innerHeight, d = devicePixelRatio || 1;
  roofs = document.createElement("canvas"); roofs.width = w * d; roofs.height = h * d;
  const c = roofs.getContext("2d"); c.scale(d, d); c.lineCap = "round"; c.lineJoin = "round";
  const wob = (n = 1.2) => (Math.random() * 2 - 1) * n;
  const pen = (pts, close) => { for (let pass = 0; pass < 2; pass++) { c.beginPath(); pts.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](x + wob(), y + wob())); if (close) c.closePath(); c.stroke() } };
  const base = h * 0.8;
  c.fillStyle = PAPER; c.fillRect(0, base, w, h - base);
  let x = -10;
  while (x < w + 10) {
    const bw = 50 + Math.random() * 60, bh = h * (0.12 + Math.random() * 0.2), top = base - bh;
    c.fillStyle = PAPER; c.fillRect(x, top, bw, bh);
    c.strokeStyle = INK; c.lineWidth = 1.8; pen([[x, base], [x, top], [x + bw, top], [x + bw, base]]);
    c.strokeStyle = PENCIL; c.lineWidth = 1; pen([[x - 2, top + 6], [x + bw + 2, top + 6]]);   // the roof's parapet
    for (let wy = top + 18; wy < base - 16; wy += 22) for (let wx = x + 10; wx < x + bw - 16; wx += 18) {
      if (Math.random() < 0.25) continue;
      c.strokeStyle = PENCIL; pen([[wx, wy], [wx + 9, wy], [wx + 9, wy + 11], [wx, wy + 11]], true);
      if (Math.random() < 0.4) { c.strokeStyle = YELLOW; c.lineWidth = 2; for (let k = 2; k < 11; k += 3) { c.beginPath(); c.moveTo(wx + 1, wy + k); c.lineTo(wx + 8, wy + k - 2); c.stroke() } c.lineWidth = 1 }
    }
    if (Math.random() < 0.6) { const tx = x + 8 + Math.random() * (bw - 30); c.strokeStyle = INK; c.lineWidth = 1.4; pen([[tx, top], [tx, top - 14], [tx + 18, top - 14], [tx + 18, top]]); pen([[tx - 1, top - 14], [tx + 19, top - 14]]) } // water tank
    if (Math.random() < 0.4) { const ax = x + bw - 12; c.strokeStyle = INK; c.lineWidth = 1.2; pen([[ax, top], [ax, top - 26]]); pen([[ax - 8, top - 20], [ax + 8, top - 20]]); pen([[ax - 5, top - 14], [ax + 5, top - 14]]) } // antenna
    if (Math.random() < 0.3) { const lx = x + 6, ly = top - 8; c.strokeStyle = PENCIL; c.lineWidth = 1; c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + bw / 2, ly + 8, lx + bw - 12, ly); c.stroke(); // a washing line
      for (const k of [0.3, 0.55]) { c.strokeStyle = k < 0.5 ? RED : "#2F6BFF"; c.lineWidth = 2; pen([[lx + bw * k, ly + 4], [lx + bw * k, ly + 14], [lx + bw * k + 9, ly + 14], [lx + bw * k + 9, ly + 4]]) } }
    x += bw + Math.random() * 6;
  }
  c.strokeStyle = INK; c.lineWidth = 2; pen([[0, base], [w, base]]);
  // dusk's pencil shading: diagonal strokes over the sky, shown a few more each moment
  hatch = [];
  for (let k = -h; k < w; k += 9) hatch.push([k, 0, k + h * 0.55, h * 0.55]);
  hatch.sort(() => Math.random() - 0.5);
}

// Sounds are made in code, so the example needs no asset files. They stay silent while Ikirmikir's sound is off.
function wake() { try { if (!audio) audio = new AudioContext(); if (audio.state === "suspended") audio.resume() } catch {} }
function buzz() { tone(520 + Math.random() * 120, 0.12, 0.015, "sawtooth") }
function slap() { tone(140, 0.08, 0.2, "square") }
function tone(freq, length, volume, type) {
  if (!audio || muted) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(volume, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + length);
  o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + length);
}

// the best count: kept with ik.data (SDK 1.3), which survives new versions; an older version kept it in localStorage
async function loadBest() {
  let b = Number(await ik.data.get("best").catch(() => null)) || 0;
  try { const old = Number(localStorage.getItem("mosha-best")) || 0; if (old > b) { b = old; ik.data.set("best", b) } } catch {}
  return b;
}
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");
function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke() }
function resize() { const d = devicePixelRatio || 1; canvas.width = innerWidth * d; canvas.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); buildRoofs() }
