// Assemble the self-contained web bundle in www/ for Capacitor (iOS / Android).
//
// The app's JSX is PRECOMPILED to plain JavaScript here, at build time, so the
// device never loads or runs Babel. The compiler is loaded from the committed
// vendor/babel.js (the same @babel/standalone UMD the web app vendors), so this
// build needs NO npm packages — only Node itself. That keeps `npx cap sync`
// working on a fresh checkout without `npm install` pulling build-only deps.
//
// Also downloads the editorial fonts so the app renders them fully offline.
// Run before `npx cap sync`:  ./build-www.sh && npx cap sync
import fs from 'fs';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
process.chdir(ROOT);

// --- Load Babel from the vendored UMD bundle (no node_modules needed) ---
function loadBabel() {
  const src = fs.readFileSync('vendor/babel.js', 'utf8');
  const mod = { exports: {} };
  const win = {};
  // @babel/standalone is a UMD bundle: with module/exports present it assigns module.exports.
  new Function('module', 'exports', 'window', 'self', 'global', src)(mod, mod.exports, win, win, win);
  const Babel = (mod.exports && mod.exports.transform) ? mod.exports : win.Babel;
  if (!Babel || !Babel.transform) throw new Error('Could not load Babel from vendor/babel.js');
  return Babel;
}
const Babel = loadBabel();

const html = fs.readFileSync('index.html', 'utf8');

// --- 1. Extract and precompile the inline JSX ---
const OPEN = '<script type="text/babel" data-presets="react">';
const start = html.indexOf(OPEN);
if (start === -1) { console.error('Could not find the text/babel script block.'); process.exit(1); }
const bodyStart = start + OPEN.length;
const end = html.indexOf('</script>', bodyStart);
const jsx = html.slice(bodyStart, end);
const fullBlock = html.slice(start, end + '</script>'.length);

const { code } = Babel.transform(jsx, { presets: ['react'], compact: false });

// --- 2. Fresh www/ tree ---
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www/vendor', { recursive: true });
fs.mkdirSync('www/assets/icons', { recursive: true });
fs.mkdirSync('www/assets/fonts', { recursive: true });

fs.writeFileSync('www/app.js', code);
for (const f of ['react.js', 'react-dom.js']) fs.copyFileSync(`vendor/${f}`, `www/vendor/${f}`);
for (const f of fs.readdirSync('assets/icons')) if (f.endsWith('.png')) fs.copyFileSync(`assets/icons/${f}`, `www/assets/icons/${f}`);
fs.copyFileSync('manifest.json', 'www/manifest.json');

// --- 3. Rewrite index.html for the bundle ---
let out = html
  .replace('<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>', '<script src="vendor/react.js"></script>')
  .replace('<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>', '<script src="vendor/react-dom.js"></script>')
  .replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n', '')
  .replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>', '')
  .replace(fullBlock, '<script src="app.js"></script>');

// --- 4. Vendor the editorial fonts (needs internet at build time) ---
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Hanken+Grotesk:wght@500;600&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
try {
  const res = await fetch(FONT_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('css HTTP ' + res.status);
  let css = await res.text();
  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^ )]+\.woff2/g) || [])];
  let i = 0;
  for (const u of urls) {
    const r = await fetch(u);
    if (!r.ok) continue;
    const fn = `f${i++}.woff2`;
    fs.writeFileSync(`www/assets/fonts/${fn}`, Buffer.from(await r.arrayBuffer()));
    css = css.split(u).join(`fonts/${fn}`);
  }
  fs.writeFileSync('www/assets/fonts.css', css);
  out = out.replace(/https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]*/, 'assets/fonts.css');
  console.log(`Fonts vendored: ${i} file(s).`);
} catch (e) {
  console.warn('WARNING: could not fetch fonts (offline?). Using Google Fonts online / system fallback:', e.message);
}

fs.writeFileSync('www/index.html', out);

const kb = (n) => Math.round(n / 1024);
console.log(`Precompiled app.js: ${kb(Buffer.byteLength(code))} KB (no runtime Babel).`);
console.log('Built www/ — now run: npx cap sync');
