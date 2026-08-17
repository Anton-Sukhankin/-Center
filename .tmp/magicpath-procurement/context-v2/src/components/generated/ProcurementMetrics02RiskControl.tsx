import { useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleAlert,
  Clock3, Database, FileBarChart2, Folder, FolderOpen, Grid2X2, HelpCircle, LayoutDashboard,
  Layers3, ListChecks, Menu, MessageCircleQuestion, PackageSearch, RotateCcw, Search,
  Send, ShieldAlert, SlidersHorizontal, TrendingUp, UserRound, UserRoundX, UsersRound,
  WalletCards, X,
} from 'lucide-react';

type RiskStatus = 'Критично' | 'Внимание' | 'Контроль';
type Category = 'Работы' | 'Материалы';
type RiskRow = { id: string; subject: string; category: Category; cost: string; required: string; forecast: string; reserve: number; status: RiskStatus; owner: string; reason: string; nextAction: string };

const risks: RiskRow[] = [
  { id: 'T-15234', subject: 'Минеральная вата', category: 'Материалы', cost: '14,2 млн ₽', required: '18.08.2024', forecast: '25.08.2024', reserve: -7, status: 'Критично', owner: 'Мария Громова', reason: 'Не подтверждён производственный слот поставщика', nextAction: 'Зафиксировать резервного поставщика до 12:00' },
  { id: 'T-15411', subject: 'Лифтовое оборудование', category: 'Материалы', cost: '48,7 млн ₽', required: '12.09.2024', forecast: '10.09.2024', reserve: 2, status: 'Внимание', owner: 'Алексей Панов', reason: 'Согласование технической части затянуто на 4 дня', nextAction: 'Эскалировать согласование главному инженеру' },
  { id: 'T-15562', subject: 'Бетон и смеси', category: 'Материалы', cost: '32,1 млн ₽', required: '05.09.2024', forecast: '28.08.2024', reserve: 8, status: 'Контроль', owner: 'Ирина Лаврова', reason: 'Срок стабилизирован, контроль цены до контракта', nextAction: 'Подтвердить финальную цену на комитете' },
  { id: 'T-15603', subject: 'Фасадные панели', category: 'Работы', cost: '26,5 млн ₽', required: '20.08.2024', forecast: '22.08.2024', reserve: -2, status: 'Внимание', owner: 'Олег Михайлов', reason: 'Повторный запрос коммерческих предложений', nextAction: 'Закрыть сбор предложений сегодня' },
  { id: 'T-15677', subject: 'Электрощитовое оборудование', category: 'Материалы', cost: '19,8 млн ₽', required: '03.09.2024', forecast: '05.09.2024', reserve: -2, status: 'Внимание', owner: 'Сергей Миронов', reason: 'Изменение спецификации после публикации', nextAction: 'Подписать новую спецификацию' },
  { id: 'T-15702', subject: 'Окна ПВХ', category: 'Работы', cost: '12,4 млн ₽', required: '15.08.2024', forecast: '19.08.2024', reserve: -4, status: 'Критично', owner: 'Анна Орлова', reason: 'Единственный участник не подтвердил срок', nextAction: 'Запустить переговоры с альтернативой' },
  { id: 'T-15745', subject: 'Инженерные трубы', category: 'Материалы', cost: '9,5 млн ₽', required: '25.09.2024', forecast: '26.09.2024', reserve: 1, status: 'Контроль', owner: 'Дмитрий Волков', reason: 'Минимальный запас до требуемой даты', nextAction: 'Контрольный звонок поставщику 10.06' },
];

const projects = ['Nova', 'Алхимово', 'Молжениново', 'Новый квартал', 'Кольские Огни', 'Дмитров дом', 'Цветочный'];
const topNav = [
  ['Сводный дашборд', LayoutDashboard], ['Цифровая шахматка', Grid2X2], ['Трекер задач', ListChecks],
  ['ГПР и Расписание', CalendarDays], ['Процессные отчеты', FileBarChart2],
] as const;
const projectTabs = ['Общие', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение', 'Метрики'];
const metricTabs = ['Общие', 'Закупки', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение'];
type Driver = [string, string, string, string, string, number];
const workDrivers: Driver[] = [
  ['Монолитные работы', '4 200', '4 460', '+260 млн ₽', '+6,2%', 92],
  ['Отделочные работы', '1 850', '2 020', '+170 млн ₽', '+9,2%', 70],
  ['Фасадные работы', '1 100', '1 010', '−90 млн ₽', '−8,2%', 48],
];
const materialDrivers: Driver[] = [
  ['Фасадные материалы', '820', '1 040', '+220 млн ₽', '+26,8%', 92],
  ['Лифтовое оборудование', '580', '700', '+120 млн ₽', '+20,7%', 68],
  ['Кабельно-проводниковая продукция', '330', '400', '+70 млн ₽', '+21,2%', 46],
];
const efficiency = [
  ['Средний срок тендера', '18 дней', '14 дней', 82, 64, Clock3, true],
  ['Участников на лот', '4,2', '3,1', 78, 58, UsersRound, false],
  ['Лотов на тендер', '4,8', '3,0', 80, 50, Layers3, false],
  ['Лотов с одним участником', '18%', '10%', 72, 40, UserRoundX, true],
] as const;

const statusClass: Record<RiskStatus, string> = {
  Критично: 'bg-[#fff0f1] text-[#b91c1c]', Внимание: 'bg-amber-50 text-amber-800', Контроль: 'bg-[#ecf9f1] text-[#12683c]',
};
const control = 'h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium text-[#344054] outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]';

function SectionHeading({ icon: Icon, title, caption, tone = 'blue' }: { icon: typeof WalletCards; title: string; caption: string; tone?: 'blue' | 'red' | 'green' }) {
  const tones = { blue: 'bg-[#eaf2ff] text-[#0b6bff]', red: 'bg-[#fff0f1] text-[#dc2626]', green: 'bg-[#ecf9f1] text-[#17834b]' };
  return <div className="flex min-w-0 items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon size={18} aria-hidden /></span><div className="min-w-0"><h2 className="text-[15px] font-semibold leading-5 text-[#111827]">{title}</h2><p className="mt-0.5 text-xs text-[#667085]">{caption}</p></div></div>;
}

export const GeneratedComponent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [activeProject, setActiveProject] = useState('Новый квартал');
  const [toast, setToast] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [period, setPeriod] = useState('Текущий квартал');
  const [category, setCategory] = useState('Все закупки');
  const [status, setStatus] = useState('Все статусы');
  const [selectedId, setSelectedId] = useState('T-15234');
  const [driverMode, setDriverMode] = useState<'Работы' | 'Материалы'>('Работы');
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const visibleProjects = projects.filter(item => item.toLowerCase().includes(query.toLowerCase()));
  const filtered = useMemo(() => risks.filter(row => (category === 'Все закупки' || row.category === category) && (status === 'Все статусы' || row.status === status)), [category, status]);
  const selected = risks.find(row => row.id === selectedId) ?? filtered[0] ?? risks[0];
  const drivers = driverMode === 'Работы' ? workDrivers : materialDrivers;
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const reset = () => { setPeriod('Текущий квартал'); setCategory('Все закупки'); setStatus('Все статусы'); setSelectedId('T-15234'); setDriverMode('Работы'); };
  const selectProject = (project: string) => setActiveProject(project);

  return <div className="h-screen min-h-[760px] w-full overflow-hidden bg-[#f7f9fc] font-[Inter,Arial,sans-serif] text-[#111827]">
    <header className="flex h-16 items-center bg-[#07182f] text-white">
      <button type="button" onClick={() => showToast('Главная страница продукта')} className="flex h-full w-64 shrink-0 items-center gap-3 border-r border-white/5 px-5 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#67a4ff]">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[#7fb2ff]"><Building2 size={18} /></span><span className="text-sm font-semibold tracking-wide">ЛК ПК | AIShtab</span>
      </button>
      <nav className="flex h-full min-w-0 flex-1 items-stretch" aria-label="Глобальная навигация">
        {topNav.map(([label, Icon], index) => <button key={label} type="button" onClick={() => index === 0 ? undefined : showToast('Раздел вне рамок концепта')} className={`flex min-w-0 items-center gap-2 px-4 text-xs font-medium transition hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#67a4ff] ${index === 0 ? 'border-b-2 border-[#3b8cff] bg-[#0c2443]' : 'text-white/75'}`}><Icon size={16} className="shrink-0 text-[#8fbaff]" /><span className="truncate">{label}</span></button>)}
      </nav>
      <button type="button" onClick={() => showToast('Профиль пользователя')} className="flex h-full shrink-0 items-center gap-3 px-5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#67a4ff]">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#276ee8] text-xs font-semibold">ИИ</span><span className="hidden text-left xl:block"><b className="block text-xs">Иван Иванов</b><span className="block text-[10px] text-white/60">Руководитель проекта</span></span><ChevronDown size={15} className="text-white/70" />
      </button>
    </header>

    <div className="flex h-[calc(100vh-64px)] min-h-[696px]">
      <aside className={`relative shrink-0 border-r border-[#e3e8ef] bg-white transition-[width] duration-200 ${sidebarOpen ? 'w-64' : 'w-[68px]'}`} aria-label="Навигация по проектам">
        <div className="flex h-14 items-center gap-2 border-b border-[#edf0f4] px-3">
          {sidebarOpen && <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#d7dee8] px-3 text-[#667085]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>}
          <button type="button" onClick={() => setSidebarOpen(value => !value)} aria-label={sidebarOpen ? 'Свернуть панель' : 'Развернуть панель'} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#d7dee8] text-[#667085] transition hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">{sidebarOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}</button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-y-auto p-2 text-xs">
          {!sidebarOpen ? <div className="space-y-2 pt-1">{[Folder, FolderOpen, Building2, Building2, Building2].map((Icon, index) => <button key={index} type="button" onClick={() => index === 2 && setSidebarOpen(true)} className={`grid h-10 w-full place-items-center rounded-lg ${index === 2 ? 'bg-[#eef5ff] text-[#0b6bff]' : 'text-[#667085] hover:bg-[#f5f7fa]'}`}><Icon size={17} /></button>)}</div> : <>
            <button type="button" onClick={() => showToast('Раздел вне рамок концепта')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-medium hover:bg-[#f5f7fa]"><Folder size={15} className="text-[#0b6bff]" />БИЗНЕС-ЮНИТ «САМОЛЕТ ОБРАЗОВАНИЕ»</button>
            <div className="mt-1"><div className="flex items-center gap-2 px-2 py-2 font-semibold"><ChevronDown size={14} /><FolderOpen size={15} className="text-[#0b6bff]" />БИЗНЕС-ЮНИТ МОСКВА</div>
              <div className="ml-3 border-l border-[#e3e8ef] pl-2">{visibleProjects.map(project => <button key={project} type="button" onClick={() => selectProject(project)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] ${activeProject === project ? 'bg-[#eef5ff] font-semibold text-[#0b6bff]' : 'hover:bg-[#f5f7fa]'}`}><Building2 size={14} className="shrink-0" /><span className="truncate">{project}</span></button>)}{visibleProjects.length === 0 && <p className="px-3 py-5 text-center text-[#98a2b3]">Ничего не найдено</p>}</div>
            </div>
            {['БИЗНЕС-ЮНИТ «ДОМ»', 'БИЗНЕС-ЮНИТ «САМОЛЕТ БАНК»', 'БИЗНЕС-ЮНИТ «САМОЛЕТ ПЛЮС»'].map(unit => <button key={unit} type="button" onClick={() => showToast('Раздел вне рамок концепта')} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-medium hover:bg-[#f5f7fa]"><ChevronRight size={14} /><Folder size={15} className="text-[#0b6bff]" /><span className="truncate">{unit}</span></button>)}
          </>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto" aria-label="Метрики проекта">
        <div className="min-w-[920px] bg-white">
          <section className="flex items-center gap-4 px-6 pb-3 pt-4">
            <img src="/assets/building.jpg" alt="Новый квартал" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><h1 className="text-xl font-semibold">{activeProject}</h1><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#667085]"><span><b className="text-[#344054]">Стадия:</b> Проектирование</span><span><b className="text-[#344054]">БЮ:</b> МОСКОВСКИЙ УРБАН</span><span><b className="text-[#344054]">Кластер:</b> Комфорт / Москва</span><span><b className="text-[#344054]">РП:</b> Петров А.В.</span></div></div>
          </section>
          <div className="flex items-end justify-between border-b border-[#e3e8ef] px-5">
            <nav className="flex min-w-max items-end" aria-label="Разделы проекта">{projectTabs.map(tab => <button key={tab} type="button" onClick={() => tab !== 'Метрики' && showToast('Раздел вне рамок концепта')} className={`relative h-11 px-3 text-xs font-medium transition hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Метрики' ? 'text-[#111827]' : 'text-[#667085]'}`}>{tab}{tab === 'Метрики' && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#0b6bff]" />}</button>)}</nav>
            <button type="button" onClick={() => setDrawer(true)} className="mb-2 inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7dee8] px-3 text-xs font-medium transition hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><MessageCircleQuestion size={15} />Задать вопрос</button>
          </div>
          <nav className="overflow-x-auto border-b border-[#e3e8ef] bg-white px-5" aria-label="Разделы метрик"><div className="flex min-w-max items-end">{metricTabs.map(tab => <button key={tab} type="button" onClick={() => tab !== 'Закупки' && showToast('Раздел вне рамок концепта')} className={`relative h-11 px-4 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Закупки' ? 'font-semibold text-[#111827]' : 'font-medium text-[#667085] hover:text-[#111827]'}`}>{tab}{tab === 'Закупки' && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[#0b6bff]" />}</button>)}</div></nav>
        </div>

        <div className="space-y-4 p-5">
          {activeProject !== 'Новый квартал' && <div className="flex items-center justify-between rounded-xl border border-[#d6e5ff] bg-[#f5f9ff] px-4 py-3 text-xs"><span>Демо-значения закупочных метрик привязаны к проекту «Новый квартал».</span><button type="button" onClick={() => setActiveProject('Новый квартал')} className="font-semibold text-[#0b6bff] hover:underline">Вернуться к проекту</button></div>}
          <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e3e8ef] bg-white p-4" aria-label="Фильтры метрик закупок">
            <SlidersHorizontal size={16} className="mr-1 text-[#667085]" /><span className="mr-2 text-xs font-semibold">Фильтры</span>
            <label className="sr-only" htmlFor="risk-period">Период</label><select id="risk-period" value={period} onChange={e => setPeriod(e.target.value)} className={control}><option>Текущий квартал</option><option>Текущий месяц</option><option>Год</option></select>
            <label className="sr-only" htmlFor="risk-category">Тип закупки</label><select id="risk-category" value={category} onChange={e => setCategory(e.target.value)} className={control}><option>Все закупки</option><option>Работы</option><option>Материалы</option></select>
            <label className="sr-only" htmlFor="risk-status">Статус</label><select id="risk-status" value={status} onChange={e => setStatus(e.target.value)} className={control}><option>Все статусы</option><option>Критично</option><option>Внимание</option><option>Контроль</option></select>
            <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7dee8] px-3 text-xs font-medium transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><RotateCcw size={14} />Сбросить</button>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[#667085]"><Database size={12} />Демо · обновлено 08.06.2025, 09:15</span>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white" aria-labelledby="risk-title">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e8ef] px-5 py-4"><div id="risk-title"><SectionHeading icon={ShieldAlert} title="Риски и действия" caption="7 тендеров под риском · 1,23 млрд ₽" tone="red" /></div><div className="flex gap-2 text-[11px]"><span className="rounded-full bg-[#fff0f1] px-2.5 py-1 font-semibold text-[#b91c1c]">2 критичных</span><span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">3 требуют внимания</span></div></div>
            <div className="grid grid-cols-[minmax(650px,2fr)_minmax(285px,1fr)]">
              <div className="min-w-0 overflow-x-auto border-r border-[#e3e8ef]"><table className="w-full min-w-[760px] border-collapse text-left text-xs"><thead className="bg-[#f8fafc] text-[10px] font-semibold uppercase tracking-wide text-[#667085]"><tr><th className="px-4 py-2.5">Тендер</th><th className="px-3 py-2.5">Предмет</th><th className="px-3 py-2.5">Стоимость</th><th className="px-3 py-2.5">Требуется / прогноз</th><th className="px-3 py-2.5">Запас</th><th className="px-4 py-2.5">Статус</th></tr></thead><tbody>{filtered.slice(0, 5).map(row => <tr key={row.id} tabIndex={0} onClick={() => setSelectedId(row.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(row.id); } }} className={`cursor-pointer border-t border-[#edf0f4] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${selected.id === row.id ? 'bg-[#f1f6ff]' : 'hover:bg-[#f8fbff]'}`}><td className="px-4 py-3 font-semibold text-[#0b6bff]">{row.id}</td><td className="px-3 py-3"><span className="block font-medium">{row.subject}</span><span className="text-[10px] text-[#667085]">{row.category}</span></td><td className="px-3 py-3 font-medium">{row.cost}</td><td className="px-3 py-3"><span className="block">{row.required}</span><span className="text-[10px] text-[#667085]">прогноз {row.forecast}</span></td><td className={`px-3 py-3 font-semibold ${row.reserve < 0 ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{row.reserve > 0 ? '+' : ''}{row.reserve} дн.</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass[row.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{row.status}</span></td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-[#667085]"><PackageSearch size={22} className="mx-auto mb-2" />Рисков по фильтрам не найдено</td></tr>}</tbody></table></div>
              <aside className="flex min-h-[326px] flex-col p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Выбранный тендер</p><h3 className="mt-1 text-lg font-semibold">{selected.id}</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[selected.status]}`}>{selected.status}</span></div><p className="mt-2 text-lg font-medium">{selected.subject}</p><p className="mt-1 text-xs text-[#667085]">{selected.category} · {selected.cost}</p><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f8fafc] p-2.5"><p className="text-[10px] text-[#667085]">Требуется</p><p className="mt-1 text-xs font-semibold">{selected.required}</p></div><div className="rounded-xl bg-[#f8fafc] p-2.5"><p className="text-[10px] text-[#667085]">Прогноз</p><p className="mt-1 text-xs font-semibold">{selected.forecast}</p></div></div><div className="mt-3 rounded-xl border border-[#e3e8ef] p-3"><p className="flex items-center gap-1.5 text-xs font-semibold"><AlertTriangle size={14} className="text-amber-600" />Причина</p><p className="mt-1 text-xs leading-5 text-[#667085]">{selected.reason}</p></div><div className="mt-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Следующее действие</p><p className="mt-1 text-xs font-medium leading-5">{selected.nextAction}</p><p className="mt-1 text-[10px] text-[#667085]">Ответственный: {selected.owner}</p></div><button type="button" onClick={() => setAcknowledged(items => items.includes(selected.id) ? items.filter(id => id !== selected.id) : [...items, selected.id])} className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] ${acknowledged.includes(selected.id) ? 'bg-[#ecf9f1] text-[#12683c]' : 'bg-[#111827] text-white hover:bg-[#243044]'}`}>{acknowledged.includes(selected.id) ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}{acknowledged.includes(selected.id) ? 'Взято в работу' : 'Взять в работу'}</button></aside>
            </div>
            <div className="flex items-center justify-between border-t border-[#e3e8ef] px-5 py-2.5 text-[10px] text-[#667085]"><span>Показано {Math.min(filtered.length, 5)} из {filtered.length} процедур</span><span>Строка меняет фокус справа</span></div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5"><SectionHeading icon={WalletCards} title="Бюджет и контрактация" caption="Покрытие бюджета договорами и открытыми процедурами" /><div className="mt-4 grid gap-4 md:grid-cols-[170px_1fr]"><div><p className="text-xs text-[#667085]">Общий бюджет</p><p className="mt-1 text-[28px] font-normal leading-none">24,0 млрд ₽</p><p className="mt-3 text-[10px] text-[#667085]">Работы 14,1 · Материалы 9,9</p></div><div><div className="flex justify-between text-xs"><span className="font-medium">Структура покрытия</span><span className="text-[#667085]">24,0 млрд ₽</span></div><div className="mt-3 flex h-7 overflow-hidden rounded-lg bg-[#eef1f5]"><span className="grid bg-[#0b6bff] text-[10px] font-semibold text-white" style={{ width: '72%', placeItems: 'center' }}>72%</span><span className="grid bg-[#7c3aed] text-[10px] font-semibold text-white" style={{ width: '16%', placeItems: 'center' }}>16%</span><span className="grid text-[10px] font-semibold" style={{ width: '12%', placeItems: 'center' }}>12%</span></div><div className="mt-3 grid grid-cols-2 gap-2">{[['Работы', '10,2 / 14,1'], ['Материалы', '7,1 / 9,9']].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f8fafc] p-2.5"><div className="flex justify-between text-[10px]"><span>{label}</span><b>72%</b></div><div className="mt-2 h-1.5 rounded-full bg-[#e6eaf0]"><div className="h-full w-[72%] rounded-full bg-[#0b6bff]" /></div><p className="mt-1 text-[9px] text-[#667085]">{value} млрд ₽</p></div>)}</div></div></div></section>
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5"><SectionHeading icon={BriefcaseBusiness} title="Эффективность и конкуренция" caption="Факт относительно проектной нормы" tone="green" /><div className="mt-4 grid gap-2 sm:grid-cols-2">{efficiency.map(([label, value, norm, fact, target, Icon, bad]) => <div key={label} className="flex items-center gap-2.5 rounded-xl bg-[#f8fafc] p-2.5"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${bad ? 'bg-[#fff0f1] text-[#dc2626]' : 'bg-[#ecf9f1] text-[#17834b]'}`}><Icon size={14} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-[10px]"><span className="truncate font-medium">{label}</span><b className={bad ? 'text-[#dc2626]' : 'text-[#17834b]'}>{value}</b></div><div className="relative mt-1.5 h-1.5 rounded-full bg-[#e6eaf0]"><span className={`absolute inset-y-0 left-0 rounded-full ${bad ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${fact}%` }} /><span className="absolute -top-1 h-3.5 w-0.5 bg-[#111827]" style={{ left: `${target}%` }} /></div><p className="mt-1 text-[9px] text-[#667085]">Норма: {norm}</p></div></div>)}</div></section>
          </div>

          <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5"><div className="flex items-start justify-between gap-3"><SectionHeading icon={TrendingUp} title="Финансовый результат" caption="Отклонение договоров от бюджета и ключевые драйверы" tone="red" /><div className="flex items-center gap-3"><p className="text-right text-lg font-medium text-[#dc2626]">+1,15 млрд ₽ · +4,8%</p><div className="flex rounded-lg bg-[#f2f4f7] p-0.5">{(['Работы', 'Материалы'] as const).map(mode => <button key={mode} type="button" onClick={() => setDriverMode(mode)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold ${driverMode === mode ? 'bg-white shadow-sm' : 'text-[#667085]'}`}>{mode}</button>)}</div></div></div><div className="mt-4 grid grid-cols-3 gap-2">{drivers.map(([name, budget, contract, delta, percent, width]) => <button key={name} type="button" className="rounded-xl border border-[#e3e8ef] p-3 text-left transition hover:bg-[#fffafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><div className="flex justify-between text-xs"><span className="truncate font-semibold">{name}</span><span className={delta.startsWith('+') ? 'text-[#dc2626]' : 'text-[#17834b]'}>{percent}</span></div><div className="mt-3 h-2 rounded-full bg-[#edf0f4]"><div className={`h-full rounded-full ${delta.startsWith('+') ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${width}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-[#667085]"><span>{budget} → {contract} млн ₽</span><b>{delta}</b></div></button>)}</div></section>
          <footer className="flex justify-between px-1 pb-4 text-[10px] text-[#667085]"><span>Демонстрационные данные — не промышленный расчёт</span><span>Период: {period}</span></footer>
        </div>
      </main>
    </div>

    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-medium text-white shadow-lg">{toast}</div>}
    {drawer && <div className="fixed inset-0 z-40 bg-[#07182f]/20" onMouseDown={() => setDrawer(false)}><aside className="absolute inset-y-0 right-0 flex w-[380px] flex-col bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-[#e3e8ef] p-5"><div><p className="text-xs text-[#667085]">Контекст вопроса</p><h2 className="mt-1 font-semibold">Метрики → Закупки → {activeProject}</h2></div><button type="button" onClick={() => setDrawer(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#f5f7fa]" aria-label="Закрыть"><X size={18} /></button></div><div className="flex-1 p-5"><div className="rounded-xl bg-[#f5f8fc] p-4 text-xs leading-5 text-[#475467]">Вопрос будет дополнен текущими фильтрами: {period}, {category}, {status}.</div><label className="mt-5 block text-xs font-semibold" htmlFor="question">Ваш вопрос</label><textarea id="question" placeholder="Например: почему выросло отклонение по фасадным материалам?" className="mt-2 h-32 w-full resize-none rounded-xl border border-[#d7dee8] p-3 text-sm outline-none focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]" /></div><div className="border-t border-[#e3e8ef] p-5"><button type="button" onClick={() => { setDrawer(false); showToast('Вопрос отправлен в демо-режиме'); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6bff] px-4 py-3 text-xs font-semibold text-white hover:bg-[#095cdd]"><Send size={15} />Отправить вопрос</button></div></aside></div>}
  </div>;
};
