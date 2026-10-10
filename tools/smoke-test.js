/* ทดสอบเล่นผ่านอัตโนมัติ: หน้าเริ่ม → เลือกระดับ → คอมมิค → เก็บของ 60 วิ → วันที่ 1 → รีบูตถึงวันที่ 3
   ที่จอแนวนอน 844x390 และ 667x375 แล้วรายงาน error ใน console/หน้าเว็บ
   วิธีใช้:  npm i --no-save playwright  แล้ว  node tools/smoke-test.js  (ใช้เวลาราว 1-2 นาที)
   ถ้ามี chromium อยู่แล้วที่อื่น ตั้ง CHROMIUM=/path/to/chromium ได้ */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.woff2':'font/woff2', '.txt':'text/plain' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let f = decodeURIComponent(req.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
      const p = path.join(ROOT, path.normalize(f));
      if (!p.startsWith(ROOT) || !fs.existsSync(p)) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, () => res(srv));
  });
}

async function play(browser, url, w, h){
  const ctx = await browser.newContext({ viewport:{ width:w, height:h }, hasTouch:true, isMobile:true });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push('console: ' + m.text()); });
  const click = async sel => { const el = await p.$(sel); if (el) { await el.click(); await p.waitForTimeout(300); return true; } return false; };
  await p.goto(url); await p.waitForTimeout(600);
  await click('[data-act=startmenu]'); await click('[data-act=pickdiff]'); await click('[data-act=startdiff] >> nth=1');
  for (let i = 0; i < 8 && await click('#comic:not([hidden]) .cfoot .def'); i++);
  for (let i = 0; i < 8 && await click('#coach:not([hidden]) [data-coach=next]'); i++);
  await p.waitForFunction(() => document.querySelector('[data-act=day1]'), null, { timeout: 90000 });
  await click('[data-act=day1]'); await p.waitForTimeout(800);
  for (let day = 1; day <= 3; day++) {
    for (let i = 0; i < 8 && await click('#coach:not([hidden]) [data-coach=next]'); i++);
    for (let step = 0; step < 8; step++) {
      await click('[data-ch]:not([disabled])');
      if (await click('[data-act=endday]')) break;
      await click('[data-nav="1"]:not([disabled])');
    }
    await p.waitForTimeout(2200);
    if (await p.$('#scr-end:not([hidden])')) break;
  }
  await ctx.close();
  return errs;
}

(async () => {
  const srv = await serve(), url = `http://localhost:${srv.address().port}/`;
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  let bad = 0;
  for (const [w, h] of [[844, 390], [667, 375]]) {
    const errs = await play(browser, url, w, h);
    console.log(`${w}x${h}: ${errs.length ? 'พบ error' : 'ผ่าน'}`); errs.forEach(e => console.log('  ' + e)); bad += errs.length;
  }
  await browser.close(); srv.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
