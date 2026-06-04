import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function patchHtml(html, port) {
  // Replace CDN scripts with local vendor copies
  return html
    .replace('https://unpkg.com/react@18/umd/react.production.min.js', `/vendor/react.js`)
    .replace('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', `/vendor/react-dom.js`)
    .replace('https://unpkg.com/@babel/standalone/babel.min.js', `/vendor/babel.js`)
    // Patch Google Fonts link tag to be a no-op (avoid network call)
    .replace(/<link[^>]+fonts\.googleapis[^>]+>/g, '');
}

function serve() {
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      let p = req.url.split('?')[0];
      if (p === '/' || p === '') p = '/index.html';
      const file = join(ROOT, p);
      if (existsSync(file)) {
        const ext = extname(file);
        let body = readFileSync(file);
        if (ext === '.html') {
          body = Buffer.from(patchHtml(body.toString(), server.address().port));
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(body);
      } else {
        res.writeHead(404); res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
})();

function makeState(override = {}) {
  return JSON.stringify({
    date: TODAY,
    p: 0, m: 0,
    pTarget: 100, mTarget: 30,
    appearance: 'light',
    pLog: [], mLog: [],
    w: 0, note: '',
    shelf: [],
    ...override,
  });
}

// Five screenshot scenarios
const SCENARIOS = [
  {
    name: '01-morning',
    state: makeState({ p: 0, m: 0 }),
    action: async (page) => {
      // Wait for Babel to transpile and React to render
      await page.waitForSelector('canvas', { timeout: 20000 });
      await page.waitForTimeout(2500);
    },
  },
  {
    name: '02-mid-day',
    state: makeState({
      p: 42, m: 10,
      pLog: [
        { id: 1, name: 'Greek yogurt', amount: 15 },
        { id: 2, name: 'Egg', amount: 18 },
        { id: 3, name: 'Chicken', amount: 9 },
      ],
      mLog: [{ id: 4, name: 'Short walk', amount: 10 }],
      w: 3,
    }),
    action: async (page) => {
      await page.waitForSelector('canvas', { timeout: 20000 });
      await page.waitForTimeout(2500);
    },
  },
  {
    name: '03-add-protein',
    state: makeState({
      p: 42, m: 10,
      pLog: [
        { id: 1, name: 'Greek yogurt', amount: 15 },
        { id: 2, name: 'Egg', amount: 18 },
        { id: 3, name: 'Chicken', amount: 9 },
      ],
      mLog: [{ id: 4, name: 'Short walk', amount: 10 }],
      w: 3,
    }),
    action: async (page) => {
      await page.waitForSelector('canvas', { timeout: 20000 });
      await page.waitForTimeout(2000);
      // Find the "Add protein +" button — text is "Add protein +" with SVG icon
      const btns = page.locator('button');
      const count = await btns.count();
      let clicked = false;
      for (let i = 0; i < count; i++) {
        const btn = btns.nth(i);
        const txt = await btn.textContent().catch(() => '');
        if (/add protein/i.test(txt)) {
          await btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        // fallback: log all buttons for debugging
        for (let i = 0; i < count; i++) {
          const txt = await btns.nth(i).textContent().catch(() => '');
          console.log(`  btn[${i}]: "${txt.trim()}"`);
        }
      }
      await page.waitForTimeout(900);
    },
  },
  {
    name: '04-complete',
    state: makeState({
      p: 100, m: 32,
      pLog: [
        { id: 1, name: 'Greek yogurt', amount: 15 },
        { id: 2, name: 'Egg', amount: 18 },
        { id: 3, name: 'Protein shake', amount: 25 },
        { id: 4, name: 'Chicken', amount: 30 },
        { id: 5, name: 'Tuna', amount: 12 },
      ],
      mLog: [{ id: 6, name: 'Workout', amount: 32 }],
      w: 6,
    }),
    action: async (page) => {
      await page.waitForSelector('canvas', { timeout: 20000 });
      await page.waitForTimeout(2800);
    },
  },
  {
    name: '05-shelf',
    // Data in the FIRST 6 days of the 14-day window — visible without any scrolling
    state: makeState({
      p: 100, m: 32,
      pLog: [{ id: 1, name: 'Protein shake', amount: 25 }],
      mLog: [{ id: 6, name: 'Workout', amount: 32 }],
      w: 6,
      shelf: Array.from({ length: 13 }, (_, k) => {
        const n = k + 1; // prev(1) through prev(13)
        const vals = [95,100,72,100,88,100,90,78,100,85,100,92,97];
        const mins = [30,35,15,30,20,40,25,10,32,22,30,28,35];
        return { date: prev(n), p: vals[k], m: mins[k], pTarget: 100, mTarget: 30, w: Math.floor(Math.random()*5)+4, note: '' };
      }),
    }),
    action: async (page) => {
      await page.waitForSelector('canvas', { timeout: 20000 });
      // Wait for async SHELF_EMOJI_MAPS to load (SVG → canvas processing)
      await page.waitForTimeout(3500);
      // 1. open shelf
      const btns = page.locator('button');
      let count = await btns.count();
      for (let i = 0; i < count; i++) {
        const txt = await btns.nth(i).textContent().catch(() => '');
        if (/shelf/i.test(txt)) { await btns.nth(i).click(); break; }
      }
      await page.waitForTimeout(1000);
      // 2. enlarge tiles (tiles are now 72×72; scale up to 96×96 for screenshot)
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('div')) {
          if (el.style.width === '72px' && el.style.height === '72px') {
            el.style.width = '96px';
            el.style.height = '96px';
          }
        }
      });
      await page.waitForTimeout(600);
      // 3. click first tile with a canvas (ShelfTile = has data)
      const clicked = await page.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          if (btn.querySelector('canvas') && !btn.disabled) {
            btn.click();
            return btn.textContent.trim();
          }
        }
        return null;
      });
      if (!clicked) console.log('  no filled day tile found');
      else console.log(`  clicked day: ${clicked}`);
      await page.waitForTimeout(900);
    },
  },
];

function prev(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function run() {
  const { server, port } = await serve();
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Serving on ${url}`);

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // iPhone 14 Pro Max: 430×932 CSS → ×3 = 1290×2796
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  const outDir = join(ROOT, 'screenshots');

  for (const sc of SCENARIOS) {
    console.log(`Shooting ${sc.name}…`);
    const page = await ctx.newPage();

    await page.goto(url);
    // inject state before React reads it
    await page.evaluate((s) => {
      localStorage.setItem('hewn-v1', s);
    }, sc.state);

    // reload so app reads fresh state
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await sc.action(page);

    await page.screenshot({
      path: `${outDir}/${sc.name}.png`,
      fullPage: false,
    });
    console.log(`  → ${outDir}/${sc.name}.png`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
