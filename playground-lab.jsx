import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {data} from './react/app/data.js';
import Icon from './react/construction/ConstructionIcon.jsx';
import {CloseButton} from './react/ui/LightlineButton.jsx';
import './src/styles/global.css';
import './playground-lab.css';

const tree=data.projectStructureData.getProjectStructure();
function projectsOf(nodes){return nodes.flatMap(n=>n.type==='project'?[n]:projectsOf(n.children||[]))}
const projects=projectsOf(tree);
const signed=n=>(n>0?'+':'')+n;
function Overlay({title,children,close}){
    const ref=useRef(null);
    useEffect(()=>{const dialog=ref.current;dialog.showModal();return ()=>dialog.close()},[]);
    return <dialog ref={ref} aria-labelledby="lab-dialog-title" onCancel={close} onClick={e=>{if(e.target===ref.current)close()}}>
        <div className="dialog-head"><h2 id="lab-dialog-title">{title}</h2><CloseButton onClick={close}/></div>{children}
    </dialog>;
}
function Summary({model:m,projectId,selectProject}){
    const [filter,filterBy]=useState(''),[panel,setPanel]=useState(null);
    const w=m.weeklySummary;
    const issues=m.attentionItems.filter(i=>!filter||i.objectId===filter).slice().sort((a,b)=>Number(b.tone==='critical')-Number(a.tone==='critical'));
    const period=m.period.from+' — '+m.period.to;
    const updates=w?.insights.slice(1)||[];
    const objectName=id=>m.objects.find(o=>o.id===id)?.name;
    const risk=(item)=><span className={'risk '+(item.tone==='critical'?'urgent':'warning')}><Icon name="circle-alert" size={14}/>{item.tone==='critical'?'Критично':'Внимание'}</span>;
    const issueRows=(items)=>items.map(i=><li key={i.id}>{risk(i)}<div>{i.title}<small>{objectName(i.objectId)}</small></div><b>{i.count}</b></li>);
    return <><header className="brandbar"><strong><Icon name="building-2" size={20}/> AIShtab</strong><span aria-current="page">Сводка</span></header>
      <main><header className="ctx"><div><h1><select aria-label="Проект сводки" value={projectId} onChange={e=>selectProject(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></h1>
        <p>Отчётная неделя <strong>{period}</strong></p></div>
        <div className="actions"><button onClick={()=>setPanel({type:'archive'})}><Icon name="archive"/>Архив</button><button onClick={()=>window.print()}><Icon name="printer"/>Печать</button></div></header>
      <section className="kpis" aria-label="Сводные показатели">{m.kpis.map(k=><article key={k.id}>
        <div className={'icon '+(k.tone==='red'?'adverse':'')}><Icon name={k.icon} size={20}/></div>
        <span>{k.label}</span><div className="value">{k.value}{Number.isFinite(k.delta)&&<small>{signed(k.delta)} п. п.</small>}</div>
      </article>)}</section>
      <div className="panels"><section className="panel"><header><h2>Требуют внимания</h2><select aria-label="Фильтр проблем по объекту" value={filter} onChange={e=>filterBy(e.target.value)}><option value="">Все объекты</option>{m.objects.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></header>
        {issues.length?<ul className="issues">{issueRows(issues.slice(0,3))}</ul>:<p>Нет проблем по выбранному объекту.</p>}
        {issues.length>0&&<button className="link" onClick={()=>setPanel({type:'issues'})}>Все категории проблем ({issues.length}) <Icon name="arrow-right"/></button>}</section>
      <section className="panel"><header><h2>Динамика за неделю</h2><Icon name="calendar-days" size={18}/></header>
        {w?<><div className="weekly"><span>Строительная готовность</span><div>{w.from}% <Icon name="arrow-right"/> {w.to}% <small>{signed(w.to-w.from)} п. п.</small></div></div>
        <ul className="updates">{updates.slice(0,2).map(s=><li key={s}>{s}</li>)}</ul><button className="link" onClick={()=>setPanel({type:'weekly'})}>Недельный отчёт <Icon name="arrow-right"/></button></>:<p>Нет данных за неделю.</p>}</section></div>
      <section className="panel registry"><header><h2>Объекты строительства <small>{m.objects.length}</small></h2></header>
        <table><thead><tr><th>Объект</th><th>Готовность</th><th className="wide">За неделю</th><th>Риски</th><th className="wide">Обновлено</th><th aria-label="Детали"/></tr></thead>
        <tbody>{m.objects.map(o=><tr key={o.id}><th scope="row">{o.name}<small>{o.typeLabel}</small></th><td>{o.readinessPercent}% <progress max="100" value={o.readinessPercent} aria-label={'Готовность: '+o.name}/></td><td className="wide">{signed(o.weeklyDeltaPercent)}%</td><td><span className={o.risk.count?'risk-number':'muted'}>{o.risk.count||'Нет'}</span></td><td className="wide">{o.lastUpdatedAt}</td><td><button className="open" aria-label={'Открыть: '+o.name} onClick={()=>setPanel({type:'object',o})}><Icon name="chevron-right"/></button></td></tr>)}</tbody></table>
      </section></main>
      {panel&&<Overlay close={()=>setPanel(null)} title={{archive:'Архив сводок',issues:'Категории проблем',weekly:'Недельный отчёт',object:panel.o?.name}[panel.type]}>
        <p>{m.project.name} · {panel.type==='archive'?'Архивные периоды':period}</p>
        {panel.type==='archive'&&<ul className="updates">{m.archive.map(s=><li key={s.id}>{s.title}<small>{s.period}</small></li>)}</ul>}
        {panel.type==='issues'&&<ul className="issues">{issueRows(issues)}</ul>}
        {panel.type==='weekly'&&<><p>Готовность: {w.from}% → {w.to}% ({signed(w.to-w.from)} п. п.)</p><ul className="updates">{updates.map(s=><li key={s}>{s}</li>)}</ul></>}
        {panel.type==='object'&&<><p>{panel.o.detail}</p><dl>{Object.entries({'Готовность':panel.o.readinessPercent+'%','За неделю':signed(panel.o.weeklyDeltaPercent)+'%','Риски':panel.o.risk.count,'Обновлено':panel.o.lastUpdatedAt}).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></>}
      </Overlay>}</>;
}
function Lab(){const [id,setId]=useState('proj-nova');const context=data.projectStructureData.getContextScope('project',id,tree);return <Summary key={id} model={data.digitalChessboardSummaryData.getForContext(context)} projectId={id} selectProject={setId}/>;}
createRoot(document.getElementById('lab')).render(<Lab/>);
