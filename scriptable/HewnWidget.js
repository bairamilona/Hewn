// Hewn Widget — small & medium
// Place in Scriptable, choose "HewnWidget" when adding the widget

const BASE = "https://hewn-mauve.vercel.app";
const KEY  = "hewn_data";
const BG   = new Color("#F7F6F3");
const INK  = new Color("#111110");
const MUTE = new Color("#11111055");
const FAINT= new Color("#11111012");

// ── data ──────────────────────────────────────────────────────────────────────
let saved = { p: 0, pTarget: 40, m: 0, mTarget: 30, date: "" };
try { if (Keychain.contains(KEY)) saved = JSON.parse(Keychain.get(KEY)); } catch(e) {}

const today = new Date().toISOString().split("T")[0];
const p     = saved.date === today ? saved.p : 0;
const m     = saved.date === today ? saved.m : 0;
const pPct  = Math.min(1, p / (saved.pTarget || 40));
const mPct  = Math.min(1, m / (saved.mTarget || 30));
const idx   = Math.min(4, Math.floor(((pPct + mPct) / 2) * 5));

// ── SVG emoji (5 states) ──────────────────────────────────────────────────────
const SVGS = [
  // state 0 — x eyes, flat mouth
  `<svg width="353" height="353" viewBox="0 0 353 353" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="176.5" cy="176.5" r="176.5" fill="#D9D9D9"/><path d="M114 261C137.333 253.454 195.2 242.889 240 261H114Z" fill="black"/><rect x="102.574" y="132" width="77.0315" height="12.1253" transform="rotate(45 102.574 132)" fill="black"/><rect x="211.574" y="132" width="77.0315" height="12.1253" transform="rotate(45 211.574 132)" fill="black"/><rect x="157.045" y="141.079" width="77.0315" height="12.1253" transform="rotate(135 157.045 141.079)" fill="black"/><rect x="266.045" y="141.079" width="77.0315" height="12.1253" transform="rotate(135 266.045 141.079)" fill="black"/></svg>`,
  // state 1 — half-circle eyes, smirk
  `<svg width="353" height="353" viewBox="0 0 353 353" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="176.5" cy="176.5" r="176.5" fill="#D9D9D9"/><path d="M96.5 261.5C110.333 227.5 161.9 169.7 257.5 210.5C224.167 204.166 145.3 205.5 96.5 261.5Z" fill="black"/><path d="M162 132C158.889 156.813 137.913 176 112.5 176C87.0873 176 66.1114 156.813 63 132H162Z" fill="black"/><path d="M307 132C303.889 156.813 282.913 176 257.5 176C232.087 176 211.111 156.813 208 132H307Z" fill="black"/></svg>`,
  // state 2 — oval eyes, small smile
  `<svg width="353" height="353" viewBox="0 0 353 353" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="176.5" cy="176.5" r="176.5" fill="#D9D9D9"/><path d="M224 251C190.222 232.889 146.593 243.454 129 251C129 251 157.75 258 176.5 258C195.25 258 224 251 224 251Z" fill="black"/><path d="M234.5 120C247.479 120 258 142.386 258 170C258 176.481 257.42 182.675 256.365 188.358C250.271 181.853 242.701 178 234.5 178C226.299 178 218.728 181.853 212.634 188.358C211.579 182.675 211 176.481 211 170C211 142.386 221.521 120 234.5 120Z" fill="black"/><path d="M118.5 120C131.479 120 142 142.386 142 170C142 176.481 141.42 182.675 140.365 188.358C134.271 181.853 126.701 178 118.5 178C110.299 178 102.728 181.853 96.6338 188.358C95.5788 182.675 95 176.481 95 170C95 142.386 105.521 120 118.5 120Z" fill="black"/></svg>`,
  // state 3 — ellipse eyes, wide smile
  `<svg width="353" height="353" viewBox="0 0 353 353" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="176.5" cy="176.5" r="176.5" fill="#D9D9D9"/><path d="M111 251C134.333 263.074 192.2 279.978 237 251H111Z" fill="black"/><ellipse cx="119.5" cy="146" rx="23.5" ry="50" fill="black"/><ellipse cx="235.5" cy="146" rx="23.5" ry="50" fill="black"/></svg>`,
  // state 4 — big eyes, cheeks, big smile
  `<svg width="353" height="353" viewBox="0 0 353 353" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="176.5" cy="176.5" r="176.5" fill="#D9D9D9"/><path d="M63 217C100.167 254.333 197.8 306.6 291 217C257.333 265.667 164.6 333.8 63 217Z" fill="black"/><ellipse cx="69.5" cy="195" rx="45.5" ry="34" fill="url(#ck0)"/><ellipse cx="275.5" cy="195" rx="45.5" ry="34" fill="url(#ck1)"/><path d="M49 154C63.8333 132.116 101.4 101.478 133 154C117.667 141.348 79.4 123.636 49 154Z" fill="black"/><path d="M217 154C231.833 132.116 269.4 101.478 301 154C285.667 141.348 247.4 123.636 217 154Z" fill="black"/><defs><linearGradient id="ck0" x1="69.5" y1="161" x2="69.5" y2="229" gradientUnits="userSpaceOnUse"><stop stop-color="#FDA6B8"/><stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/></linearGradient><linearGradient id="ck1" x1="275.5" y1="161" x2="275.5" y2="229" gradientUnits="userSpaceOnUse"><stop stop-color="#FDA6B8"/><stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/></linearGradient></defs></svg>`,
];

// ── render SVG → PNG via WebView canvas ───────────────────────────────────────
async function svgToImage(svgStr, size) {
  const svg = svgStr
    .replace('width="353"', `width="${size}"`)
    .replace('height="353"', `height="${size}"`);
  const wv = new WebView();
  await wv.loadHTML("<html><body></body></html>");
  const b64 = await wv.evaluateJavaScript(`
    new Promise(function(resolve) {
      var s = ${JSON.stringify(svg)};
      var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
      var img = new Image();
      img.onload = function() {
        var c = document.createElement("canvas");
        c.width = ${size}; c.height = ${size};
        var x = c.getContext("2d");
        x.fillStyle = "#F7F6F3";
        x.fillRect(0, 0, ${size}, ${size});
        x.drawImage(img, 0, 0, ${size}, ${size});
        resolve(c.toDataURL("image/png").replace("data:image/png;base64,", ""));
      };
      img.onerror = function() { resolve(""); };
      img.src = url;
    })
  `);
  if (!b64) return null;
  return Image.fromData(Data.fromBase64String(b64));
}

const isMedium = config.widgetFamily === "medium";
const emojiSize = isMedium ? 110 : 130;
const emojiImg = await svgToImage(SVGS[idx], emojiSize);

// ── widget ────────────────────────────────────────────────────────────────────
const w = new ListWidget();
w.backgroundColor = BG;
w.url = BASE;
w.setPadding(14, 14, 14, 14);

if (isMedium) renderMedium(w);
else          renderSmall(w);

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  isMedium ? await w.presentMedium() : await w.presentSmall();
}
Script.complete();

// ── small (2×2) ───────────────────────────────────────────────────────────────
function renderSmall(w) {
  const dl = w.addText(
    new Date().toLocaleDateString("en", { weekday: "short", day: "numeric" }).toUpperCase()
  );
  dl.font = new Font("Helvetica Neue", 9);
  dl.textColor = MUTE;

  w.addSpacer();

  if (emojiImg) {
    const img = w.addImage(emojiImg);
    img.centerAlignImage();
    img.imageSize = new Size(emojiSize, emojiSize);
  }

  w.addSpacer(6);

  addBar(w, "P+", pPct, `${Math.round(p)}g`);
  w.addSpacer(4);
  addBar(w, "M",  mPct, `${Math.round(m)}min`);
}

// ── medium (4×2) ──────────────────────────────────────────────────────────────
function renderMedium(w) {
  const outer = w.addStack();
  outer.layoutHorizontally();
  outer.spacing = 16;

  // left — emoji + date
  const left = outer.addStack();
  left.layoutVertically();
  left.size = new Size(emojiSize + 8, -1);
  left.addSpacer();

  if (emojiImg) {
    const img = left.addImage(emojiImg);
    img.centerAlignImage();
    img.imageSize = new Size(emojiSize, emojiSize);
  }

  left.addSpacer(4);
  const ds = left.addText(
    new Date().toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })
  );
  ds.font = new Font("Helvetica Neue", 10);
  ds.textColor = MUTE;
  ds.centerAlignText();
  left.addSpacer();

  // right — metrics
  const right = outer.addStack();
  right.layoutVertically();
  right.spacing = 14;
  right.addSpacer();
  addMetric(right, "PROTEIN +",  pPct, Math.round(p), saved.pTarget || 40,  "g");
  addMetric(right, "MOVEMENT",   mPct, Math.round(m), saved.mTarget || 30,   "min");
  right.addSpacer();
}

// ── helpers ───────────────────────────────────────────────────────────────────
function addMetric(parent, label, pct, val, target, unit) {
  const s = parent.addStack();
  s.layoutVertically();
  s.spacing = 5;

  const row = s.addStack();
  row.layoutHorizontally();

  const l = row.addText(label);
  l.font = new Font("Helvetica Neue", 9);
  l.textColor = MUTE;
  row.addSpacer();

  const v = row.addText(`${val} / ${target} ${unit}`);
  v.font = new Font("Helvetica Neue", 9);
  v.textColor = INK;

  s.addImage(progressBar(pct, 3));
}

function addBar(parent, label, pct, valStr) {
  const s = parent.addStack();
  s.layoutVertically();
  s.spacing = 3;

  const row = s.addStack();
  row.layoutHorizontally();

  const l = row.addText(label);
  l.font = new Font("Helvetica Neue", 8);
  l.textColor = MUTE;
  row.addSpacer();

  const v = row.addText(valStr);
  v.font = new Font("Helvetica Neue", 8);
  v.textColor = INK;

  parent.addImage(progressBar(pct, 3));
}

function progressBar(pct, h) {
  const W = 300;
  const ctx = new DrawContext();
  ctx.size = new Size(W, h);
  ctx.opaque = false;

  ctx.setFillColor(FAINT);
  const bg = new Path();
  bg.addRoundedRect(new Rect(0, 0, W, h), h/2, h/2);
  ctx.addPath(bg); ctx.fillPath();

  if (pct > 0) {
    ctx.setFillColor(INK);
    const fg = new Path();
    fg.addRoundedRect(new Rect(0, 0, W * Math.min(1, pct), h), h/2, h/2);
    ctx.addPath(fg); ctx.fillPath();
  }

  return ctx.getImage();
}
