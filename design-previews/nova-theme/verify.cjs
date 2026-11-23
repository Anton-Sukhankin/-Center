// Диагностика отдельного полигона; требует доступных Playwright и браузера Edge.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const dir=process.argv[2];if(dir)fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'});try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
 const base=process.env.PILOT_URL||'http://127.0.0.1:5174/';
 await p.goto(new URL('playground.html',base).href,{waitUntil:'domcontentloaded'});
 const scene=key=>p.frames().find(f=>f.url().endsWith('screen='+key));
 await p.frameLocator('iframe[title="График закупок"]').locator('.bi-forecast-period').waitFor();
 const feed=scene('feed'),detail=scene('detail'),chart=scene('chart');
 await detail.locator('.event-status-high').first().waitFor();
 const sample=async(f,entries)=>Object.fromEntries(await Promise.all(entries.map(async([s,prop])=>[s+' '+prop,await f.locator(s).first().evaluate((e,k)=>getComputedStyle(e)[k],prop)])));
 const galleryShot=async(name)=>{if(dir){await p.waitForTimeout(350);await p.screenshot({path:path.join(dir,name+'.png')})}};
 const take=async(mode)=>{
 await p.locator('[data-view=feed]').click();
 const fc=feed.locator('.event-card').first();
 const feedData=await sample(feed,[['.dashboard-workspace','backgroundColor'],['.event-card','backgroundColor'],['.event-card-title','color'],['.event-timestamp-text','color'],['.tree-item.selected','backgroundColor'],['.seg-tab.active','backgroundColor'],['.seg-tab.active .tab-badge','backgroundColor']]);
 const before=await fc.boundingBox(),accent='rgb(134, 184, 255)';
 await fc.hover();await p.waitForTimeout(240);feedData.hover=await fc.locator('h3').evaluate(e=>getComputedStyle(e).color);
 const shadow=()=>fc.evaluate(e=>getComputedStyle(e).boxShadow);
 assert.equal((await shadow()).includes(accent),mode==='dark');assert.deepEqual(await fc.boundingBox(),before);
 if(mode==='dark'&&dir)await fc.screenshot({path:path.join(dir,'nova-dark-event-hover.png')});
 await p.locator('[data-view=feed]').hover();await p.waitForTimeout(240);assert(!(await shadow()).includes(accent));
 await fc.focus();await p.keyboard.press('Tab');feedData.focus=await feed.evaluate(()=>getComputedStyle(document.activeElement).outlineColor);
 await p.locator('[data-view=detail]').click();
 const detailData=await sample(detail,[['#event-drawer .drawer-header','backgroundColor'],['.event-detail-body','backgroundColor'],['.event-params-register','backgroundColor'],['.event-params-register dt','color'],['.event-status-high','color']]);
 await p.locator('[data-view=chart]').click();
 const graphData=await sample(chart,[['.metric-bi-dialog','backgroundColor'],['.metric-bi-legend span','color'],['.bi-forecast-period','backgroundColor'],['.bi-forecast-bracket','borderTopColor'],['.metric-bi-highlight','backgroundColor'],['.metric-bi-svg path[stroke="#0b6bff"]','stroke']]);
 console.log(mode,JSON.stringify({feedData,detailData,graphData}));return {feedData,detailData,graphData};};
 const dark=await take('dark');
 const plot=chart.locator('.metric-bi-chart'),bb=await plot.boundingBox();await p.mouse.move(bb.x+bb.width*.72,bb.y+bb.height*.52);await chart.locator('.metric-bi-tooltip').waitFor();
 await p.locator('h1').hover();await chart.locator('.metric-bi-tooltip').waitFor({state:'hidden'});assert(await chart.locator('.bi-forecast-period').isVisible());
 await chart.getByRole('button',{name:'По факту',exact:true}).click();assert.equal(await chart.locator('.bi-forecast-period').count(),0);
 await chart.getByRole('button',{name:'С прогнозом',exact:true}).click();
 await galleryShot('nova-chart');await p.locator('[data-view=all]').click();await galleryShot('nova-overview');
 await p.locator('#theme').click();const light=await take('light');assert.notEqual(light.feedData.hover,dark.feedData.hover);assert.notEqual(light.graphData['.bi-forecast-period backgroundColor'],dark.graphData['.bi-forecast-period backgroundColor']);
 await p.setViewportSize({width:390,height:844});await p.locator('[data-view=all]').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await galleryShot('nova-mobile');
 assert.deepEqual(errors,[]);console.log('PASS · gallery, both themes, three original components, chart hover and forecast, narrow viewport.');}finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
