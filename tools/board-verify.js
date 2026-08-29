const { chromium } = require("playwright");
const fs   = require("fs");
const path = require("path");
const SS  = process.env.CI
  ? path.join(__dirname, '../test-results/screenshots/')
  : "C:\\claude\\test-results\\screenshots\\";
const LOG = process.env.CI
  ? path.join(__dirname, '../test-results/logs/')
  : "C:\\claude\\test-results\\logs\\";
[SS, LOG].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});
const ts  = new Date().toISOString()
  .replace(/[:.]/g,"-").slice(0,19);
(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage();
  const errors = [];
  pg.on('console', m => {
    if(m.type()==='error') errors.push(m.text()); });
  await pg.setViewportSize({width:1440,height:900});
  await pg.goto(
    'https://filmcommando.com/Board.dc.html',
    {waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(3000);
  await pg.screenshot({
    path:path.join(SS,ts+'_board-init_pass.png'),
    fullPage:false });
  const r = await pg.evaluate(()=>({
    title:      document.title,
    listExists: !!document.getElementById('bd-list'),
    h1Text:     document.querySelector('h1')
                  ?.textContent?.trim().slice(0,20),
    writeBtnHidden:
      document.getElementById('bd-write-btn')
        ?.style.display === 'none',
  }));
  r.consoleErrors = errors.slice(0,5);
  console.log(JSON.stringify(r,null,2));
  fs.writeFileSync(
    path.join(LOG,ts+'_board-verify.json'),
    JSON.stringify(r,null,2),'utf8');
  console.log('스크린샷:',SS);
  console.log('로그:',LOG+ts+'_board-verify.json');
  await br.close();
})().catch(e => {
  console.error('[DOM FAIL]', e.message || e);
  process.exit(1);
});
