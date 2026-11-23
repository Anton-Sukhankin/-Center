// Проверка в чистом профиле; настройки пользователя и данные прототипа не затрагиваются.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.AISHTAB_URL || 'http://127.0.0.1:5174/';
const out = process.argv[2];
if (out) fs.mkdirSync(out, { recursive: true });

(async () => {
 const browser = await chromium.launch({channel:'msedge'});
 try {
  const context = await browser.newContext({viewport:{width:1440,height:960},colorScheme:'light',reducedMotion:'reduce'});
  const page = await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(45000);
  const css=(selector,prop)=>page.locator(selector).first().evaluate((el,p)=>getComputedStyle(el)[p],prop);
  const shot=async(name)=>{if(out)await page.screenshot({path:path.join(out,name+'.png')})};
  const load=async()=>{await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.event-card').first().waitFor();assert.equal(await page.title(),'AIShtab');assert.equal(await page.locator('vite-error-overlay').count(),0)};
  const theme=()=>page.locator('html').getAttribute('data-theme');
  await context.addInitScript(()=>localStorage.setItem('aishtab.theme.v1','light'));
  // До загрузки React и даже при светлой системной теме первый кадр уже графитовый.
  const firstFrame=await context.newPage();
  await firstFrame.route('**/react/main.jsx*',route=>route.abort());
  await firstFrame.goto(base,{waitUntil:'domcontentloaded'});
  assert.deepEqual(await firstFrame.evaluate(()=>[document.documentElement.dataset.theme,getComputedStyle(document.documentElement).backgroundColor,document.querySelector('#root').childElementCount]),['dark','rgb(23, 24, 27)',0]);
  await firstFrame.close();await page.bringToFront();
  await load();assert.equal(await theme(),'dark');
  const assistant=page.getByRole('button',{name:'AI ассистент',exact:true});
  assert.equal(await page.locator('.top-navbar button').count(),1);assert(await assistant.isVisible());
  assert.equal(await css('html','colorScheme'),'dark');
  const card=page.locator('.event-card').first(),rect=await card.boundingBox();
  await card.hover();assert.match(await css('.event-card','boxShadow'),/rgb\(134, 184, 255\)/);
  assert.deepEqual(await card.boundingBox(),rect);await shot('01-lenta');
  await load();assert.equal(await theme(),'dark');
  await card.click();await page.locator('#event-drawer').waitFor();
  assert.equal(await css('#event-create-task','backgroundColor'),'rgb(32, 33, 37)');
  await shot('02-event');
  await page.locator('.metric-impact-trigger').click();await page.getByRole('button',{name:'Траектория',exact:true}).click();await page.getByRole('button',{name:'С прогнозом'}).click();
  await page.locator('.bi-forecast-period').waitFor();await page.locator('.metric-bi-chart').hover();await page.locator('.metric-bi-tooltip').waitFor();
  await page.locator('.metric-bi-header h2').hover();await page.locator('.metric-bi-tooltip').waitFor({state:'hidden'});
  assert(await page.locator('.bi-forecast-period').isVisible());await shot('03-chart');
  await page.keyboard.press('Escape');await page.locator('.metric-bi-dialog').waitFor({state:'detached'});
  await page.getByRole('button',{name:'Создать задачу',exact:true}).first().click();await page.locator('#task-title').fill('Проверка темы');assert.notEqual(await css('#task-title','backgroundColor'),'rgb(255, 255, 255)');
  assert.equal(await css('#event-drawer-footer [data-task-action="submit-task"]','backgroundColor'),'rgb(36, 90, 154)');
  await load();await page.getByRole('button',{name:'Фильтры',exact:true}).click();await page.locator('.fd-nav').waitFor();await shot('04-filters');
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Аналитика',exact:true}).click();await page.locator('.analysis-placeholder').waitFor();
  await page.locator('.analysis-page').waitFor();await page.locator('.fd-nav button').nth(1).click();await shot('05-analytics');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Метрики',exact:true}).click();await page.locator('.metrics-kpi-card').first().waitFor();await shot('06-metrics');
  await page.getByRole('tab',{name:'Закупки',exact:true}).click();await page.locator('.procurement-budget-map').waitFor();await shot('07-procurement');
  assert.equal(await theme(),'dark');
  await page.locator('#open-metric-tree').click();await page.locator('.metric-tree-row').first().waitFor();await page.keyboard.press('Escape');
  await page.locator('#open-scenter-ai-chat').click();await page.locator('.ac-panel').waitFor();assert.equal(await css('.ac-panel','backgroundColor'),'rgb(38, 39, 45)');
  // Сохранённые экраны не получают новых пользовательских маршрутов.
  for(const [view,selector] of [['objects','#objects-root'],['digital-chessboard-summary','#digital-chessboard-summary-root']]){
   const screen=await context.newPage();
   await screen.route('**/react/app/App.jsx*',async route=>{
    const response=await route.fetch(),original=await response.text(),body=original.replace(/view\s*=\s*['"]dashboard['"]/,'view = "'+view+'"');
    assert.notEqual(original,body);await route.fulfill({response,body});
   });
   await screen.goto(base,{waitUntil:'domcontentloaded'});await screen.locator(selector).waitFor();
   assert.equal(await screen.locator('html').getAttribute('data-theme'),'dark');
   assert.equal(await screen.locator('.top-navbar button').count(),1);await screen.close();
  }
  await load();await page.setViewportSize({width:390,height:844});assert(await assistant.isVisible());assert((await assistant.boundingBox()).x>=0);await shot('08-mobile');
  assert.deepEqual(errors,[]);console.log('PASS: dark-only startup and reload with saved light preference, header, hover, event, chart, tasks, filters, analytics, metrics, procurement, metric tree, assistant, narrow header.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
