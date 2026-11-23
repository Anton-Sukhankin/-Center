// Изолированный документ полигона: стили и состояние не попадают в приложение.
import '../../react/main.jsx';
import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import MetricChart from '../../react/bi/MetricChart.jsx';
import './palette.css';
document.documentElement.dataset.theme=window.parent===window?'dark':window.parent.document.documentElement.dataset.theme;
const kind=new URLSearchParams(location.search).get('screen');
function when(selector,callback){const find=()=>document.querySelector(selector);if(find())return callback(find());
 const watcher=new MutationObserver(()=>{const el=find();if(el){watcher.disconnect();callback(el)}});watcher.observe(document.body,{childList:true,subtree:true});}
if(parent!==window)document.addEventListener('click',event=>{
 if(event.target.closest('.theme-switch')){event.stopPropagation();parent.document.querySelector('#theme').click()}
},true);
if(kind==='detail')when('.event-card.priority-high,.event-card.priority-critical',el=>el.click());
if(kind==='chart'){
 const row=window.SCenterProcurementMetricsData.getForContext({type:'project',id:'proj-nova'}).efficiency.find(r=>r.id==='average-tender-duration');
 const host=document.createElement('div');host.id='lab-chart';document.body.append(host);
 const metric={id:row.id,name:row.label+' · дни',plan:parseFloat(row.norm),fact:parseFloat(row.value)};
 // Без источника прогноза штатная демонстрационная модель продолжает последний факт.
 const chart=createRoot(host),show=()=>chart.render(createElement(MetricChart,{metric,onClose:()=>chart.render(createElement('button',{className:'lab-reopen',onClick:show},'Открыть график закупок'))}));
 show();when('.bi-toolbar',el=>{for(const button of el.querySelectorAll('button'))if(['Траектория','С прогнозом'].includes(button.textContent.trim()))button.click()});
}
