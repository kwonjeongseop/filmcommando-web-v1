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
    'https://filmcommando.com/CaseDetail.dc.html',
    {waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(2500);
  await pg.screenshot({
    path:path.join(SS,ts+'_casedetail-fs_pass.png'),
    fullPage:false });
  const r = await pg.evaluate(()=>({
    titleExists: !!document.getElementById('cd-title'),
    factsExists: !!document.getElementById('cd-facts'),
    roomsExists: !!document.getElementById('cd-rooms'),
    logExists:   !!document.getElementById('cd-log'),
    scForGone:   !document.querySelector('sc-for'),
    notFoundMsg: document.getElementById('cd-title')
      ?.textContent?.includes('찾을 수 없'),
  }));
  r.consoleErrors = errors.slice(0,5);
  console.log(JSON.stringify(r,null,2));
  fs.writeFileSync(
    path.join(LOG,ts+'_casedetail-fs-verify.json'),
    JSON.stringify(r,null,2),'utf8');
  console.log('스크린샷:',SS);
  await br.close();
})().catch(e => {
  console.error('[DOM FAIL]', e.message || e);
  process.exit(1);
});
