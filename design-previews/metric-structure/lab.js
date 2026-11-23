import '../../src/data/app-data.js';
import '../../src/data/project-structure.js';
import { createMetricSeries, makeChart, formatMetricValue as value } from '../../react/bi/chartModel.js';

const ps = window.projectStructureData;
const context = ps.getContextScope('project', 'proj-nova', ps.getProjectStructure());
const root = window.appData.getMetricsForContext(context);
const byId = new Map(), parents = new Map();
function index(node, parent) {
    byId.set(node.id, node);
    if (parent) parents.set(node.id, parent);
    (node.children || []).forEach(child => index(child, node));
}
index(root);
const moduleDialog = document.querySelector('#module'), chart = document.querySelector('#chart');
const content = document.querySelector('#content'), launcher = document.querySelector('#open');
const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg = (path, cls='arrow') => '<svg aria-hidden="true" class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';
const right = svg('m9 5 7 7-7 7'), down = svg('m5 9 7 7 7-7');
document.querySelectorAll('.close').forEach(btn => btn.innerHTML = svg('m6 6 12 12m0-12L6 18'));
const collapsed = new Set();
let mode = 'tree';
const search = document.querySelector('#register-query');
const normalize = s => s.trim().toLocaleLowerCase('ru').replaceAll('ё','е');
function filterRegister() {
    const query = normalize(search.value);
    let count = 0;
    for (const row of content.querySelectorAll('tbody tr')) {
        row.hidden = !normalize(byId.get(row.querySelector('[data-id]').dataset.id).name).includes(query);
        if (!row.hidden) count++;
    }
    document.querySelector('#register-status').textContent = count ? '' : 'Метрики не найдены. Попробуйте другое название.';
    content.scrollTop = 0;
}
search.addEventListener('input', filterRegister);
const sign = m => m === root ? '' : m.budgetImpact === '-' ? '<i class="sign minus" aria-label="Вычитается">−</i>' : '<i class="sign plus" aria-label="Прибавляется">+</i>';
const attrs = (action,m) => 'data-action="'+action+'" data-id="'+esc(m.id)+'"';
const graphLabel = m => 'aria-label="Открыть график: '+esc(m.name)+'"';
function treeNode(m) {
    const branch = Boolean(m.children?.length), open = !collapsed.has(m.id);
    const toggle = branch ? '<button class="toggle" '+attrs('toggle',m)+' aria-expanded="'+open+'" aria-label="'+(open?'Свернуть':'Развернуть')+': '+esc(m.name)+'">'+(open?down:right)+'</button>' : '<span class="spacer"></span>';
    return '<li><div class="row '+(m===root?'is-root':'')+'">'+toggle+'<button class="name" '+attrs('chart',m)+' '+graphLabel(m)+'>'+sign(m)+esc(m.name)+'</button></div>'+
        (branch && open ? '<ul class="branch">'+m.children.map(treeNode).join('')+'</ul>' : '')+'</li>';
}
function treeView() {
    return '<div class="section-top"><h3>Иерархия показателей</h3><button class="soft" data-action="all">'+(collapsed.has(root.id)?'Развернуть всё':'Свернуть всё')+'</button></div><ul class="branch">'+treeNode(root)+'</ul>';
}
function registerView() {
    return '<table class="table"><thead><tr><th scope="col">Показатель</th><th scope="col">План</th><th scope="col">Факт</th></tr></thead><tbody>'+
        [...byId.values()].map(m=>'<tr><td><button class="metric-link" '+attrs('chart',m)+' '+graphLabel(m)+'>'+sign(m)+esc(m.name)+'</button><small class="parent">'+esc(parents.get(m.id)?.name||'Итог проекта')+'</small></td><td>'+value(m.plan)+'</td><td>'+value(m.fact)+'</td></tr>').join('')+'</tbody></table><p id="register-status" role="status"></p>';
}
function draw() {
    document.querySelector('.register-search').hidden = mode !== 'register';
    content.innerHTML = mode === 'tree' ? treeView() : registerView();
    if (mode === 'register') filterRegister();
    document.querySelectorAll('[data-mode]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.mode===mode)));
}
function showChart(m) {
    const series=createMetricSeries(m), plot=makeChart(series);
    document.querySelector('#chart-title').textContent=m.name;
    const grid=plot.grid.map(({y,value:v})=>'<line x1="70" x2="1000" y1="'+y+'" y2="'+y+'" stroke="#42454c"/><text x="64" y="'+(y+6)+'" text-anchor="end" font-size="18" fill="#b2b5bd">'+value(v)+'</text>').join('');
    document.querySelector('#chart-body').innerHTML='<div class="keys"><span>План</span><span>Факт</span><span>Прогноз</span></div><svg viewBox="0 0 1040 410" role="img" aria-label="Демонстрационная динамика: план, факт и прогноз">'+grid+'<g transform="translate(70) scale(.93 1)">'+['plan','fact','forecast'].map(k=>'<path d="'+plot[k]+'" fill="none" stroke="'+(k==='plan'?'#b2b5bd':'#86b8ff')+'" vector-effect="non-scaling-stroke" stroke-width="'+(k==='plan'?1.5:2.5)+'" '+(k==='fact'?'':'stroke-dasharray="5 4"')+'/>').join('')+'</g></svg><div class="months"><span>Январь</span><span>Декабрь</span></div>';
    chart.showModal();
}
moduleDialog.addEventListener('click',event=>{
    const btn=event.target.closest('button');if(!btn)return;
    if(btn.dataset.mode){mode=btn.dataset.mode;draw();content.scrollTop=0;return;}
    const action=btn.dataset.action, m=byId.get(btn.dataset.id);
    if(action==='chart'){showChart(m);return;}

    if(action==='toggle'){if(collapsed.has(m.id))collapsed.delete(m.id);else collapsed.add(m.id);}
    else if(action==='all'){const close=!collapsed.has(root.id);collapsed.clear();if(close)for(const n of byId.values())if(n.children?.length)collapsed.add(n.id);}
    else return;
    draw();content.querySelector(action==='all'?'[data-action="all"]':'[data-action="toggle"][data-id="'+CSS.escape(m.id)+'"]').focus();
});
for(const d of [moduleDialog,chart]){
    d.querySelector('[data-close]').addEventListener('click',()=>d.close());
    d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});
}
moduleDialog.addEventListener('close',()=>launcher.focus());
launcher.addEventListener('click',()=>moduleDialog.showModal());
draw();moduleDialog.showModal();
