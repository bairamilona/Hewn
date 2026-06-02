// Hewn Widget — small & medium
// Place in Scriptable, choose "HewnWidget" when adding the widget

const BASE   = "https://ewn-mauve.vercel.app";
const KEY    = "hewn_data";
const BG     = new Color("#F7F6F3");
const INK    = new Color("#111110");
const MUTE   = new Color("#11111055");
const FAINT  = new Color("#11111012");
const family = config.widgetFamily;

// ── data ────────────────────────────────────────────────────────────────────
let saved = { p: 0, pTarget: 40, m: 0, mTarget: 30, date: "" };
try { if (Keychain.contains(KEY)) saved = JSON.parse(Keychain.get(KEY)); } catch(e) {}

const today  = new Date().toISOString().split("T")[0];
const p      = saved.date === today ? saved.p : 0;
const m      = saved.date === today ? saved.m : 0;
const pPct   = Math.min(1, p / (saved.pTarget || 120));
const mPct   = Math.min(1, m / (saved.mTarget || 30));
const avg    = (pPct + mPct) / 2;
const idx    = Math.min(5, Math.floor(avg * 6)) + 1;

// ── emoji image ─────────────────────────────────────────────────────────────
let emojiImg = null;
try {
  const req = new Request(`${BASE}/assets/emojis/state${idx}.png`);
  req.timeoutInterval = 4;
  emojiImg = await req.loadImage();
} catch(e) {}

// ── widget ──────────────────────────────────────────────────────────────────
const w = new ListWidget();
w.backgroundColor = BG;
w.url = BASE;

if (family === "medium") renderMedium(w);
else                     renderSmall(w);

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  family === "medium" ? await w.presentMedium() : await w.presentSmall();
}
Script.complete();

// ── small (2×2) ─────────────────────────────────────────────────────────────
function renderSmall(w) {
  w.setPadding(14, 14, 14, 14);

  const dateRow = w.addStack();
  dateRow.layoutHorizontally();
  const dl = dateRow.addText(
    new Date().toLocaleDateString("en", { weekday: "short", day: "numeric" }).toUpperCase()
  );
  dl.font = new Font("Helvetica Neue", 9);
  dl.textColor = MUTE;

  w.addSpacer();

  if (emojiImg) {
    const img = w.addImage(emojiImg);
    img.centerAlignImage();
    img.imageSize = new Size(74, 74);
  }

  w.addSpacer(8);

  addBar(w, "P", pPct, `${Math.round(p)}g`);
  w.addSpacer(5);
  addBar(w, "M", mPct, `${Math.round(m)}min`);
}

// ── medium (4×2) ─────────────────────────────────────────────────────────────
function renderMedium(w) {
  w.setPadding(16, 16, 16, 16);

  const outer = w.addStack();
  outer.layoutHorizontally();
  outer.spacing = 14;

  // left — emoji
  const left = outer.addStack();
  left.layoutVertically();
  left.size = new Size(100, -1);

  left.addSpacer();
  if (emojiImg) {
    const img = left.addImage(emojiImg);
    img.centerAlignImage();
    img.imageSize = new Size(96, 96);
  }
  left.addSpacer(6);
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
  addMetric(right, "PROTEIN",  pPct, Math.round(p), saved.pTarget || 120, "g");
  addMetric(right, "MOVEMENT", mPct, Math.round(m), saved.mTarget || 30,  "min");
  right.addSpacer();
}

// ── helpers ──────────────────────────────────────────────────────────────────
function addMetric(parent, label, pct, val, target, unit) {
  const s = parent.addStack();
  s.layoutVertically();
  s.spacing = 5;

  const row = s.addStack();
  row.layoutHorizontally();

  const l = row.addText(label);
  l.font   = new Font("Helvetica Neue", 9);
  l.textColor = MUTE;

  row.addSpacer();

  const v = row.addText(`${val} / ${target} ${unit}`);
  v.font      = new Font("Helvetica Neue", 9);
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
  bg.addRoundedRect(new Rect(0, 0, W, h), h / 2, h / 2);
  ctx.addPath(bg); ctx.fillPath();

  if (pct > 0) {
    ctx.setFillColor(INK);
    const fg = new Path();
    fg.addRoundedRect(new Rect(0, 0, W * pct, h), h / 2, h / 2);
    ctx.addPath(fg); ctx.fillPath();
  }

  const img = ctx.getImage();
  const imgW = new ListWidget().addImage(img);   // throw-away — just to return image
  return img;
}
