import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// State 4 — happy emoji with pink cheeks (same as app)
const EMOJI_SVG = `<svg width="353" height="353" viewBox="0 0 353 353" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="176.5" cy="176.5" r="176.5" fill="#D9D9D9"/><path d="M63 217C100.167 254.333 197.8 306.6 291 217C257.333 265.667 164.6 333.8 63 217Z" fill="black"/><ellipse cx="69.5" cy="195" rx="45.5" ry="34" fill="url(#ck0)"/><ellipse cx="275.5" cy="195" rx="45.5" ry="34" fill="url(#ck1)"/><path d="M49 154C63.8333 132.116 101.4 101.478 133 154C117.667 141.348 79.4 123.636 49 154Z" fill="black"/><path d="M217 154C231.833 132.116 269.4 101.478 301 154C285.667 141.348 247.4 123.636 217 154Z" fill="black"/><defs><linearGradient id="ck0" x1="69.5" y1="161" x2="69.5" y2="229" gradientUnits="userSpaceOnUse"><stop stop-color="#FDA6B8"/><stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/></linearGradient><linearGradient id="ck1" x1="275.5" y1="161" x2="275.5" y2="229" gradientUnits="userSpaceOnUse"><stop stop-color="#FDA6B8"/><stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/></linearGradient></defs></svg>`;

const BAYER8 = [
   0,32, 8,40, 2,34,10,42,
  48,16,56,24,50,18,58,26,
  12,44, 4,36,14,46, 6,38,
  60,28,52,20,62,30,54,22,
   3,35,11,43, 1,33, 9,41,
  51,19,59,27,49,17,57,25,
  15,47, 7,39,13,45, 5,37,
  63,31,55,23,61,29,53,21,
];

const html = `<!DOCTYPE html><html><head><style>
  * { margin:0; padding:0; }
  body { background: #F7F6F3; }
  canvas { display: block; }
</style></head><body>
<canvas id="c" width="1024" height="1024"></canvas>
<script>
const BAYER8 = ${JSON.stringify(BAYER8)};
const DITH_CHARS = [' ','·','∘','○','+','*','✦','●'];
const G = 24;
const SZ = 1024;
const EMOJI = \`${EMOJI_SVG}\`;

async function render() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const N = DITH_CHARS.length;
  const cell = SZ / G;
  const fsize = Math.floor(cell * 0.86);

  // Render SVG → pixel maps at G×G
  const blob = new Blob([EMOJI], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = await new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
  });

  // Gray map (white background)
  const oc = document.createElement('canvas');
  oc.width = oc.height = G;
  const ox = oc.getContext('2d');
  ox.fillStyle = '#fff'; ox.fillRect(0,0,G,G);
  ox.drawImage(img, 0,0,G,G);
  const px = ox.getImageData(0,0,G,G).data;

  // Raw map for pink detection
  const oc2 = document.createElement('canvas');
  oc2.width = oc2.height = G;
  const ox2 = oc2.getContext('2d');
  ox2.drawImage(img, 0,0,G,G);
  const px2 = ox2.getImageData(0,0,G,G).data;
  URL.revokeObjectURL(url);

  const gray = new Float32Array(G*G);
  const pink = new Float32Array(G*G);
  for (let i = 0; i < G*G; i++) {
    const a = px[i*4+3]/255;
    gray[i] = ((0.299*px[i*4] + 0.587*px[i*4+1] + 0.114*px[i*4+2])/255)*a + (1-a);
    const r2=px2[i*4], g2=px2[i*4+1], b2=px2[i*4+2], a2=px2[i*4+3]/255;
    if (r2>200 && r2>g2+35 && b2>130 && a2>0.1) pink[i] = a2;
  }

  // Draw
  ctx.fillStyle = '#F7F6F3';
  ctx.fillRect(0,0,SZ,SZ);
  ctx.font = fsize + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pinkCells = [];
  ctx.fillStyle = '#111110';
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const i = y*G+x;
      const bayer = BAYER8[(y&7)*8+(x&7)] / 64;
      const darkness = 1 - gray[i];
      const level = Math.max(0, Math.min(N-1, Math.floor(darkness*N + bayer - 0.5)));
      const ch = DITH_CHARS[level];
      if (ch === ' ') continue;
      if (pink[i] > 0.08) {
        const pl = Math.max(0, Math.min(N-1, Math.floor((Math.max(darkness, pink[i]*0.55))*N + bayer - 0.5)));
        pinkCells.push(x, y, DITH_CHARS[pl]);
      } else {
        ctx.fillText(ch, (x+0.5)*cell, (y+0.5)*cell);
      }
    }
  }
  ctx.fillStyle = '#F0608A';
  for (let k = 0; k < pinkCells.length; k+=3)
    ctx.fillText(pinkCells[k+2], (pinkCells[k]+0.5)*cell, (pinkCells[k+1]+0.5)*cell);

  window.__done = true;
}
render().catch(e => { window.__err = e.message; });
</script></body></html>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.waitForFunction(() => window.__done || window.__err, { timeout: 10000 });
const err = await page.evaluate(() => window.__err);
if (err) throw new Error(err);

const buf = await page.screenshot({ clip: { x:0,y:0,width:1024,height:1024 }, omitBackground: false });
writeFileSync(join(ROOT, 'assets/icon-1024.png'), buf);
console.log('Written assets/icon-1024.png', buf.length, 'bytes');
await browser.close();
