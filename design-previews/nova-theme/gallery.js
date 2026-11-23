const scenes=[
 ['feed','Лента Nova','Различимы ли выбранный проект, активный сегмент и карточка под курсором?'],
 ['detail','Карточка события','Видна ли граница панели и считывается ли высокий статус в реестре?'],
 ['chart','График закупок','Средний срок тендера. Месяцы и прогноз смоделированы для проверки палитры.']
];
const root=document.documentElement, gallery=document.querySelector('.gallery'), theme=document.querySelector('#theme');
let view='all';
const frames=scenes.map(([key,name,caption],i)=>{
 const section=document.createElement('section'); section.innerHTML='<h2></h2><p></p><div class="frame"><iframe></iframe><button class="expand"></button></div>';
 section.querySelector('h2').textContent=(i+1)+'. '+name;
 section.querySelector('p').textContent=caption;
 const frame=section.querySelector('iframe'),expand=section.querySelector('button');
 frame.title=name;frame.src='./design-previews/nova-theme/scene.html?screen='+key;
 expand.setAttribute('aria-label','Рассмотреть: '+name);expand.addEventListener('click',()=>select(key));
 frame.addEventListener('load',()=>{frame.contentDocument.documentElement.dataset.theme=root.dataset.theme});
 gallery.append(section);return {section,frame,expand,key};
});
function size(){for(const {section,frame} of frames){if(section.hidden)continue;const box=frame.parentElement,w=box.clientWidth;if(!w)continue;
 const fw=view==='all'?1200:w,fh=view==='all'?830:Math.max(580,Math.min(900,innerHeight*.77));frame.style.width=fw+'px';frame.style.height=fh+'px';frame.style.transform='scale('+w/fw+')';box.style.height=Math.ceil(fh*w/fw+2)+'px';}}
function select(next){view=next;gallery.className='gallery '+(next==='all'?'overview':'single');
 for(const {section,frame,expand,key} of frames){section.hidden=next!=='all'&&next!==key;expand.hidden=next!=='all';frame.inert=next==='all';frame.tabIndex=next==='all'?-1:0}
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(next===b.dataset.view)));size();}
function displayTheme(){const dark=root.dataset.theme==='dark',label=dark?'Тёмная тема. Переключить на светлую':'Светлая тема. Переключить на тёмную';theme.title=label;theme.setAttribute('aria-label',label);
 theme.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+(dark?'<path d="M20.4 14a8.6 8.6 0 0 1-10.6-10.4A8.8 8.8 0 1 0 20.4 14Z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/>')+'</svg>';
 for(const {frame} of frames){if(frame.contentDocument)frame.contentDocument.documentElement.dataset.theme=root.dataset.theme}}
theme.onclick=()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';displayTheme()};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>select(b.dataset.view));
new ResizeObserver(size).observe(gallery);window.addEventListener('resize',size);select('all');displayTheme();
