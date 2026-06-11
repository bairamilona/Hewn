/**
 * Generates Hewn app icons using the dithering-character aesthetic.
 * Renders the emoji face (state6.png) as dithered text symbols on cream background.
 * Run: node gen-icons.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import sharp from 'sharp';

const ROOT = '/home/user/Hewn';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/icon.html';
  const filePath = join(ROOT, urlPath);
  if (!existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const BASE = `http://127.0.0.1:${port}`;

// Write the icon rendering page to disk temporarily
const iconHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; }
html, body { width: 512px; height: 512px; overflow: hidden; background: #F7F6F3; }
</style>
</head>
<body>
<canvas id="c" width="512" height="512" style="display:block"></canvas>
<script>
const DITH_CHARS = [' ', '·', '∘', '○', '+', '*', '✦', '●'];
const BAYER8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

const G = 24;
const SIZE = 512;
const INK = '#111110';
const BASE_BG = '#F7F6F3';
const PINK = '#F0608A';

async function render() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = '/assets/emojis/state6.png';
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

  // Downsample emoji into G×G grid.
  // Zoom in 8% so the face fills the cells with minimal dead corners.
  const off = document.createElement('canvas');
  off.width = G; off.height = G;
  const octx = off.getContext('2d');
  const crop = 0.08; // fraction to crop from each edge
  const srcSz = img.naturalWidth;
  const s0 = Math.round(srcSz * crop);
  const sLen = srcSz - s0 * 2;
  octx.drawImage(img, s0, s0, sLen, sLen, 0, 0, G, G);
  const data = octx.getImageData(0, 0, G, G).data;

  const alphaMap = new Float32Array(G * G);
  const grayMap  = new Float32Array(G * G);
  const pinkMap  = new Float32Array(G * G);

  for (let i = 0; i < G * G; i++) {
    const r = data[i*4]   / 255;
    const g = data[i*4+1] / 255;
    const b = data[i*4+2] / 255;
    const a = data[i*4+3] / 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    alphaMap[i] = a;
    // For opaque face pixels, preserve luminance; transparent → treat as white (background)
    grayMap[i] = a > 0.05 ? lum : 1.0;
    // Pink: red-dominant, not white, opaque
    const isPink = a > 0.15 && r > g * 1.10 && r > b * 1.06 && lum < 0.90;
    pinkMap[i]  = isPink ? Math.min(1, (r - (g + b) / 2) * 3.0) * a : 0;
  }

  // Fill cream background
  ctx.fillStyle = BASE_BG;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const cell = SIZE / G;
  const fsize = Math.floor(cell * 0.82);
  const N = DITH_CHARS.length;
  ctx.font = fsize + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;

  const pinkCells = [];

  // The emoji faces are always circles centered in the square image.
  // Use a circle mask to separate face from background corners.
  const cx = (G - 1) / 2;
  const cy = (G - 1) / 2;
  const faceR = G * 0.46; // face radius ≈ 92% of half-width

  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const i = y * G + x;
      const bayer = BAYER8[(y & 7) * 8 + (x & 7)] / 64;
      const dist  = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const inFace = dist <= faceR;
      const darkness = 1 - grayMap[i];
      const pinkV = pinkMap[i];

      if (!inFace) {
        // Outside face circle: very sparse background shimmer
        if (bayer > 0.88) ctx.fillText('·', (x + 0.5) * cell, (y + 0.5) * cell);
        continue;
      }

      if (pinkV > 0.05) {
        // Pink cheek cell
        const pl = Math.max(0, Math.min(N-1,
          Math.floor((Math.max(darkness, pinkV * 0.65)) * N + bayer - 0.3)
        ));
        pinkCells.push(x, y, DITH_CHARS[pl]);
      } else {
        // Face body — always show at least '·' so the circle reads as a shape
        const minLevel = 1; // '·'
        const level = Math.max(minLevel, Math.min(N-1,
          Math.floor(darkness * N + bayer - 0.5)
        ));
        ctx.fillText(DITH_CHARS[level], (x + 0.5) * cell, (y + 0.5) * cell);
      }
    }
  }

  if (pinkCells.length > 0) {
    ctx.fillStyle = PINK;
    for (let k = 0; k < pinkCells.length; k += 3)
      ctx.fillText(pinkCells[k+2], (pinkCells[k]+0.5)*cell, (pinkCells[k+1]+0.5)*cell);
  }

  document.title = 'done';
}

render().catch(e => { document.title = 'error:' + e.message; });
</script>
</body>
</html>`;

writeFileSync(join(ROOT, 'icon.html'), iconHtml);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

// Wait for render to complete (title changes to 'done')
await page.waitForFunction(() => document.title === 'done' || document.title.startsWith('error:'), { timeout: 10000 });

const title = await page.title();
if (title.startsWith('error:')) {
  console.error('Render error:', title);
  process.exit(1);
}
if (errors.length) console.warn('JS warnings:', errors);

// Screenshot the canvas
const iconBuf512 = await page.screenshot({
  clip: { x: 0, y: 0, width: 512, height: 512 },
  type: 'png',
  omitBackground: false,
});

console.log('Rendered 512px icon');
await browser.close();
server.close();

// Save 512
writeFileSync(join(ROOT, 'assets/icons/icon-512.png'), iconBuf512);
console.log('Saved icon-512.png');

// Resize to 192
const buf192 = await sharp(iconBuf512)
  .resize(192, 192, { kernel: 'lanczos3' })
  .png()
  .toBuffer();
writeFileSync(join(ROOT, 'assets/icons/icon-192.png'), buf192);
console.log('Saved icon-192.png');

// Resize to 180 (apple touch icon)
const buf180 = await sharp(iconBuf512)
  .resize(180, 180, { kernel: 'lanczos3' })
  .png()
  .toBuffer();
writeFileSync(join(ROOT, 'assets/icons/icon-180.png'), buf180);
console.log('Saved icon-180.png');

// Also update logo.png used in the app if it exists
const buf1024 = await sharp(iconBuf512)
  .resize(1024, 1024, { kernel: 'lanczos3' })
  .png()
  .toBuffer();
writeFileSync(join(ROOT, 'assets/icon-1024.png'), buf1024);
console.log('Saved icon-1024.png');

// Clean up temp file
import { unlinkSync } from 'fs';
unlinkSync(join(ROOT, 'icon.html'));

console.log('Done. All icons updated.');
