import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessagesSquare, Minimize, Maximize, PanelTopClose, RotateCcw, SendHorizontal } from 'lucide-react';
import Icon from '../ui/Icon.jsx';
import { dialogMotionTiming } from '../ui/dialogMotionTiming.js';
import { requestDemoReply } from './demoReply.js';
import { usePanelGeometry } from './usePanelGeometry.js';
import './assistant.css';

function createSnapshot({ context, entity, events, allEvents, metrics, activeMetricId, constructionMetrics, filters }) {
    const node = entity || context?.entity;
    const nodeName = node?.name || context?.name || context?.id || 'Контекст не выбран';
    const contextName = context?.type === 'queue' && context.parentProject?.name
        ? `${context.parentProject.name} / ${nodeName}` : nodeName;
    const applied = {
        period: filters.period || '',
        sources: filters.sources || [],
        priority: filters.priority || 'all',
        metrics: filters.metrics || []
    };
    const hasFilters = applied.period || applied.sources.length || applied.priority !== 'all' || applied.metrics.length;

    return {
        contextType: context?.type,
        contextId: context?.id,
        contextName,
        projectTitle: contextName,
        projectIds: context?.projectIds || [],
        queueIds: context?.queueIds || [],
        activeTab: filters.activeTab || 'today',
        priorityView: filters.priorityView || 'high',
        mode: hasFilters ? 'filtered-selection' : 'event-feed',
        filters: applied,
        searchQuery: '',
        visibleEventIds: events.map(event => event.id),
        activeEventsPreview: events.slice(0, 30),
        excludedEventIds: allEvents.filter(event => event.excluded).map(event => event.id),
        pinnedEventIds: allEvents.filter(event => event.pinned && !event.excluded).map(event => event.id),
        entity: node,
        metrics,
        activeMetricId,
        constructionMetrics,
        allEvents
    };
}

function InlineText({ text }) {
    const tokens = text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g);
    return tokens.map((token, index) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return <strong key={index}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
            const value = token.slice(1, -1);
            return <code key={index} className={`chat-inline-code${/ошибка|🔴/i.test(value) ? ' is-error-token' : ''}`}>{value}</code>;
        }
        return token;
    });
}

function messageBlocks(text) {
    const blocks = [];
    for (const line of text.split(/\r?\n/)) {
        const heading = /^###\s+(.+)$/.exec(line);
        const listItem = /^[-*]\s+(.+)$/.exec(line);
        const last = blocks.at(-1);
        if (heading) blocks.push({ kind: 'heading', lines: [heading[1]] });
        else if (listItem) {
            if (last?.kind === 'list') last.lines.push(listItem[1]);
            else blocks.push({ kind: 'list', lines: [listItem[1]] });
        } else if (line.trim()) {
            if (last?.kind === 'paragraph') last.lines.push(line);
            else blocks.push({ kind: 'paragraph', lines: [line] });
        } else if (last && last.kind !== 'spacer') blocks.push({ kind: 'spacer' });
    }
    return blocks;
}

function ReplyText({ text }) {
    return messageBlocks(text).map((block, index) => {
        if (block.kind === 'heading') return <h5 key={index} className="chat-message-h5"><InlineText text={block.lines[0]} /></h5>;
        if (block.kind === 'list') return (
            <ul key={index} className="chat-message-ul">
                {block.lines.map((line, lineIndex) => <li key={lineIndex} className="chat-message-li"><InlineText text={line} /></li>)}
            </ul>
        );
        if (block.kind === 'spacer') return <br key={index} />;
        return (
            <div key={index} className="assistant-reply-paragraph">
                {block.lines.map((line, lineIndex) => (
                    <Fragment key={lineIndex}>{lineIndex > 0 ? <br /> : null}<InlineText text={line} /></Fragment>
                ))}
            </div>
        );
    });
}

const modes = [{id:'assistant',label:'Ассистент'},{id:'solution',label:'Подобрать решение'}];

function ModePicker({mode, setMode, menu, setMenu, project}) {
    const wrap=useRef(null), trigger=useRef(null), items=useRef([]);
    const restore=()=>{setMenu(false);trigger.current?.focus();};
    useLayoutEffect(()=>{
        if(!menu)return;
        items.current[modes.findIndex(item=>item.id===mode)]?.focus();
        const outside=e=>{if(!wrap.current?.contains(e.target))setMenu(false);};
        document.addEventListener('pointerdown',outside);
        return ()=>document.removeEventListener('pointerdown',outside);
    },[menu,mode,setMenu]);
    return <div className="ac-picker" ref={wrap} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setMenu(false);}}>
        <button ref={trigger} type="button" className="ac-mode" aria-haspopup="menu" aria-expanded={menu}
            onClick={()=>setMenu(!menu)} onKeyDown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();setMenu(true);}}}>
            {modes.find(item=>item.id===mode).label}<Icon name={menu?'chevron-up':'chevron-down'} size={14}/>
        </button>
        {menu && <div role="menu" aria-label="Режим ответа" className="ac-menu" onKeyDown={e=>{
            if(e.key==='Escape'){e.preventDefault();e.stopPropagation();restore();return;}
            const index=items.current.indexOf(document.activeElement);
            const dest={ArrowDown:(index+1)%2,ArrowUp:(index+1)%2,Home:0,End:1}[e.key];
            if(dest!=null){e.preventDefault();items.current[dest].focus();}
        }}>{modes.map((item,i)=><button type="button" key={item.id} ref={node=>{items.current[i]=node;}}
            role="menuitemradio" aria-checked={mode===item.id} tabIndex={-1}
            onClick={()=>{setMode(item.id);restore();}}>
            <span>{item.id===mode && <Icon name="check" size={14}/>}</span><span><b>{item.label}</b><small>
            {i===0?`Вопросы о работе в ${project}`:'Помощь с подбором для клиента'}</small></span>
        </button>)}</div>}
    </div>;
}

const launchButton=host=>host?.querySelector('.plan-chat') || document.getElementById('open-scenter-ai-chat');
export default function Assistant({open,portalHost,context,entity,events=[],allEvents=events,metrics,activeMetricId,constructionMetrics,filters={},onClose,provider=requestDemoReply}) {
    const [draft,setDraft]=useState(''),[turns,setTurns]=useState([]),[mode,setMode]=useState('assistant');
    const [menu,setMenu]=useState(false),[present,setPresent]=useState(open);
    const panel=useRef(null), field=useRef(null), list=useRef(null), pending=useRef(null), lastQuestion=useRef(null);
    const geometry=usePanelGeometry(open);
    const project=context?.parentProject?.name || entity?.name || context?.name || 'AIShtab';
    const waiting=turns.at(-1)?.pending;
    const close=()=>{onClose();queueMicrotask(()=>launchButton(portalHost)?.focus({preventScroll:true}));};
    useEffect(()=>()=>pending.current?.abort(),[]);
    useLayoutEffect(()=>{
        if(!open || !geometry.full)return;
        const shell=document.querySelector('.app-shell');
        if(!shell)return;
        const wasInert=shell.inert;
        shell.inert=true;
        return ()=>{shell.inert=wasInert;};
    },[open,geometry.full]);
    useLayoutEffect(()=>{
        if(open && !present){setPresent(true);return;}
        if(!present || !panel.current)return;
        const node=panel.current, r=node.getBoundingClientRect(), trigger=launchButton(portalHost)?.getBoundingClientRect();
        const dx=(trigger?trigger.left+trigger.width/2:innerWidth)-(r.left+r.width/2);
        const dy=(trigger?trigger.top+trigger.height/2:0)-(r.top+r.height/2);
        const small={transform:`translate(${dx}px,${dy}px) scale(.08)`,opacity:0};
        const normal={transform:'none',opacity:1};
        const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
        const anim=node.animate(open?[small,normal]:[normal,small],{duration:reduce?0:open?dialogMotionTiming.open:dialogMotionTiming.close,easing:dialogMotionTiming.easing,fill:'backwards'});
        if(open)field.current?.focus({preventScroll:true});
        else {setMenu(false);anim.onfinish=()=>setPresent(false);}
        return ()=>{anim.onfinish=null;anim.cancel();};
    },[open,present,portalHost]);
    useLayoutEffect(()=>{
        if(!open || !field.current)return;
        const input=field.current;input.style.height='40px';input.style.height=Math.max(40,Math.min(input.scrollHeight,78))+'px';
    },[open,present,draft,geometry.style.width]);
    useLayoutEffect(()=>{
        if(open && list.current && lastQuestion.current)
            list.current.scrollTop+=lastQuestion.current.getBoundingClientRect().top-list.current.getBoundingClientRect().top-12;
    },[open,present,turns]);
    useEffect(()=>{
        if(!open)return;
        const keyboard=e=>{
            if(e.defaultPrevented)return;
            if(e.key==='Escape'){e.preventDefault();if(menu){setMenu(false);panel.current.querySelector('.ac-mode')?.focus();}else close();}
            if(e.key==='Tab' && geometry.full){
                const controls=[...panel.current.querySelectorAll('button:not(:disabled),textarea')].filter(n=>n.tabIndex>=0);
                const first=controls[0],last=controls.at(-1);
                if(!panel.current.contains(document.activeElement)||(e.shiftKey?document.activeElement===first:document.activeElement===last)){
                    e.preventDefault();(e.shiftKey?last:first)?.focus();
                }
            }
        };
        document.addEventListener('keydown',keyboard);
        return ()=>document.removeEventListener('keydown',keyboard);
    },[open,menu,geometry.full,onClose]);
    async function send(e){
        e?.preventDefault();
        const question=draft.trim();
        if(!question || pending.current)return;
        const req=new AbortController();pending.current=req;
        const id=crypto.randomUUID(), snapshot=createSnapshot({context,entity,events,allEvents,metrics,activeMetricId,constructionMetrics,filters});
        setTurns(prev=>[...prev,{id,question,pending:true,mode}]);setDraft('');setMenu(false);field.current?.focus();
        const finish=(answer,failed=false)=>{if(!req.signal.aborted)setTurns(prev=>prev.map(turn=>turn.id===id?{...turn,pending:false,answer,failed}:turn));};
        try{const result=await provider({text:question,context:snapshot,mode,signal:req.signal});finish((typeof result==='string'?result:result?.text)||'Ответ не содержит текста.');}
        catch{finish('Не удалось получить ответ. Попробуйте отправить вопрос ещё раз.',true);}
        finally{if(pending.current===req)pending.current=null;}
    }
    if(!present)return null;
    const content = <section id="ai-drawer" role="dialog" aria-modal={geometry.full && open || undefined} aria-labelledby="ai-drawer-title"
        className="ac-panel" ref={panel} inert={!open} data-full={geometry.full} data-moving={geometry.moving} style={geometry.style}>
        <header className="ac-head" onPointerDown={e=>geometry.start(e,'move')} {...geometry.events}>
            <span className="ac-mark"><Icon name="sparkle" size={19}/></span>
            <div className="ac-heading"><h2 id="ai-drawer-title">AI-ассистент</h2><p title={'Помощь в работе с '+project}>Помощь в работе с {project}</p></div>
            <div className="ac-tools">
                <button type="button" disabled={geometry.full} aria-label={geometry.custom?'Вернуть исходную геометрию':'Уменьшить высоту'} title={geometry.custom?'Вернуть исходную геометрию':'Уменьшить высоту'} onClick={geometry.compact}>{geometry.custom?<RotateCcw/>:<PanelTopClose/>}</button>
                <button type="button" aria-label={geometry.full?'Выйти из полноэкранного режима':'Развернуть панель'} title={geometry.full?'Вернуть размер панели':'Развернуть панель'} onClick={()=>{setMenu(false);geometry.toggleFull();}}>{geometry.full?<Minimize/>:<Maximize/>}</button>
                <i aria-hidden="true"/><button type="button" aria-label="Закрыть" title="Закрыть" onClick={close}><Icon name="x"/></button>
            </div>
        </header>
        <div ref={list} className="ac-thread" role="log" aria-label="Переписка" aria-live="polite">
            {!turns.length?<div className="ac-empty"><span><MessagesSquare size={29}/></span><strong>Начните чат</strong><p>Задайте вопрос о работе в {project}</p></div>:
            turns.map((t,i)=><div className="ac-turn" key={t.id} ref={i===turns.length-1?lastQuestion:undefined}>
                <div className="ac-question">{t.question}</div>
                <div className="ac-answer"><b>AI-ассистент</b>{t.pending?<div className="ac-pending" role="status">Готовлю ответ<span aria-hidden="true"><i/><i/><i/></span></div>:
                <><div role={t.failed?'alert':undefined}><ReplyText text={t.answer}/></div>{!t.failed && provider===requestDemoReply && <small>Демо-ответ</small>}</>}</div>
            </div>)}
        </div>
        <form className="ac-composer" onSubmit={send}>
            <textarea id="ai-chat-input" ref={field} rows={2} placeholder="Напишите вопрос" aria-label="Напишите вопрос" value={draft} onChange={e=>setDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
            <div className="ac-actions"><ModePicker mode={mode} setMode={setMode} menu={menu} setMenu={setMenu} project={project}/>
                <button className="ac-send" type="submit" aria-label="Отправить сообщение" disabled={waiting || !draft.trim()}><SendHorizontal size={20}/></button>
            </div>
        </form>
        {!geometry.full && ['n','s','w','nw'].map(edge=><div key={edge} className={'ac-handle ac-'+edge} aria-hidden="true"
            onPointerDown={e=>geometry.start(e,edge)} {...geometry.events}/>)}
    </section>;
    return portalHost ? createPortal(content, portalHost) : content;
}
