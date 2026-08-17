import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness, Building2,
  CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Database, FileBarChart2, Folder, FolderOpen, LayoutDashboard, Layers3, Menu,
  MessageCircle, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, ShieldAlert,
  TrendingUp, UserRound, UserRoundX, UsersRound, WalletCards, X,
} from 'lucide-react';

type Driver = { name: string; budget: number; contract: number; delta: string; percent: string };
type Risk = {
  id: string; subject: string; type: 'Работы' | 'Материалы'; cost: string;
  required: string; forecast: string; reserve: number;
  status: 'Критично' | 'Внимание' | 'Контроль'; owner: string;
};

const projects = ['Nova', 'Алхимово', 'Молжаниново', 'Новый квартал', 'Кольские Огни', 'Дмитров дом', 'Цветочный'];
const workDrivers: Driver[] = [
  { name: 'Монолитные работы', budget: 4200, contract: 4460, delta: '+260 млн ₽', percent: '+6,2%' },
  { name: 'Отделочные работы', budget: 1850, contract: 2020, delta: '+170 млн ₽', percent: '+9,2%' },
  { name: 'Фасадные работы', budget: 1100, contract: 1010, delta: '−90 млн ₽', percent: '−8,2%' },
];
const materialDrivers: Driver[] = [
  { name: 'Фасадные материалы', budget: 820, contract: 1040, delta: '+220 млн ₽', percent: '+26,8%' },
  { name: 'Лифтовое оборудование', budget: 580, contract: 700, delta: '+120 млн ₽', percent: '+20,7%' },
  { name: 'Кабельно-проводниковая продукция', budget: 330, contract: 400, delta: '+70 млн ₽', percent: '+21,2%' },
];
const efficiency = [
  { label: 'Средний срок тендера', value: '18 дней', norm: '14 дней', fact: 82, target: 64, Icon: CalendarDays, positive: false },
  { label: 'Участников на лот', value: '4,2', norm: '3,1', fact: 78, target: 58, Icon: UsersRound, positive: true },
  { label: 'Лотов на тендер', value: '4,8', norm: '3,0', fact: 80, target: 50, Icon: Layers3, positive: true },
  { label: 'Лотов с одним участником', value: '18%', norm: '10%', fact: 72, target: 40, Icon: UserRoundX, positive: false },
];
const risks: Risk[] = [
  { id: 'T-15234', subject: 'Минеральная вата', type: 'Материалы', cost: '14,2 млн ₽', required: '18.08.2024', forecast: '25.08.2024', reserve: -7, status: 'Критично', owner: 'Анна Белова' },
  { id: 'T-15411', subject: 'Лифтовое оборудование', type: 'Материалы', cost: '48,7 млн ₽', required: '12.09.2024', forecast: '10.09.2024', reserve: 2, status: 'Внимание', owner: 'Илья Орлов' },
  { id: 'T-15562', subject: 'Бетон и смеси', type: 'Материалы', cost: '32,1 млн ₽', required: '05.09.2024', forecast: '28.08.2024', reserve: 8, status: 'Контроль', owner: 'Антон Сергеев' },
  { id: 'T-15603', subject: 'Фасадные панели', type: 'Работы', cost: '26,5 млн ₽', required: '20.08.2024', forecast: '22.08.2024', reserve: -2, status: 'Внимание', owner: 'Мария Соколова' },
  { id: 'T-15677', subject: 'Электрощитовое оборудование', type: 'Материалы', cost: '19,8 млн ₽', required: '03.09.2024', forecast: '05.09.2024', reserve: -2, status: 'Внимание', owner: 'Павел Елисеев' },
  { id: 'T-15702', subject: 'Окна ПВХ', type: 'Работы', cost: '12,4 млн ₽', required: '15.08.2024', forecast: '19.08.2024', reserve: -4, status: 'Критично', owner: 'Ольга Васина' },
  { id: 'T-15745', subject: 'Инженерные трубы', type: 'Материалы', cost: '9,5 млн ₽', required: '25.09.2024', forecast: '26.09.2024', reserve: 1, status: 'Контроль', owner: 'Денис Юдин' },
];
const statusClass = {
  Критично: 'bg-[#fff0f1] text-[#b91c1c]',
  Внимание: 'bg-amber-50 text-amber-800',
  Контроль: 'bg-[#ecf9f1] text-[#12683c]',
};

function SectionTitle({ icon: Icon, title, note, tone = 'blue' }: {
  icon: typeof WalletCards; title: string; note: string; tone?: 'blue' | 'red' | 'green';
}) {
  const color = tone === 'red' ? 'bg-[#fff0f1] text-[#dc2626]' : tone === 'green' ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#eaf2ff] text-[#0b6bff]';
  return <div className="flex min-w-0 items-start gap-2.5">
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${color}`}><Icon size={16} aria-hidden="true" /></span>
    <div className="min-w-0"><h2 className="text-[14px] font-semibold leading-4 text-[#111827]">{title}</h2><p className="mt-1 text-[11px] text-[#667085]">{note}</p></div>
  </div>;
}

function BudgetLine({ label, value, percent, violet = false }: { label: string; value: string; percent: number; violet?: boolean }) {
  return <div className="rounded-xl bg-[#f8fafc] p-2.5">
    <div className="flex items-center justify-between gap-3 text-[11px]"><span className="font-medium">{label}</span><span className="font-semibold">{percent}%</span></div>
    <div className="mt-1.5 h-1.5 rounded-full bg-[#e7ebf0]"><div className={`h-full rounded-full ${violet ? 'bg-[#7c3aed]' : 'bg-[#0b6bff]'}`} style={{ width: `${percent}%` }} /></div>
    <p className="mt-1 text-[9px] text-[#667085]">{value}</p>
  </div>;
}

export const GeneratedComponent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [activeProject, setActiveProject] = useState('Новый квартал');
  const [period, setPeriod] = useState('Текущий квартал');
  const [type, setType] = useState('Все закупки');
  const [status, setStatus] = useState('Все статусы');
  const [driverType, setDriverType] = useState<'Работы' | 'Материалы'>('Работы');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [toast, setToast] = useState('');
  const drivers = driverType === 'Работы' ? workDrivers : materialDrivers;
  const filteredProjects = projects.filter(project => project.toLowerCase().includes(search.toLowerCase()));
  const filteredRisks = useMemo(() => risks.filter(risk => (type === 'Все закупки' || risk.type === type) && (status === 'Все статусы' || risk.status === status)), [type, status]);

  const notify = (message = 'Раздел вне рамок концепта') => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };
  const reset = () => { setPeriod('Текущий квартал'); setType('Все закупки'); setStatus('Все статусы'); setDriverType('Работы'); setSelectedRisk(null); };
  const selectProject = (project: string) => setActiveProject(project);

  const topNav = [
    { label: 'Сводный дашборд', Icon: LayoutDashboard, active: true },
    { label: 'Цифровая шахматка', Icon: Layers3 },
    { label: 'Трекер задач', Icon: Menu },
    { label: 'ГПР и Расписание', Icon: CalendarDays },
    { label: 'Процессные отчеты', Icon: FileBarChart2 },
  ];
  const projectTabs = ['Общие', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение', 'Метрики'];
  const metricTabs = ['Общие', 'Закупки', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение'];

  return <main className="h-screen min-h-[720px] w-full overflow-hidden bg-[#f7f9fc] font-[Inter,Arial,sans-serif] text-[#111827]">
    <header className="flex h-16 items-center bg-[#071a35] text-white">
      <div className="flex h-full w-64 shrink-0 items-center gap-2 border-r border-white/5 px-5">
        <Building2 size={20} className="text-[#90b9ff]" /><span className="text-sm font-semibold tracking-wide">ЛК ПК | AIShtab</span>
      </div>
      <nav className="flex min-w-0 flex-1 self-stretch" aria-label="Основная навигация">
        {topNav.map(({ label, Icon, active }) => <button key={label} type="button" onClick={() => !active && notify()} className={`relative flex h-full items-center gap-2 px-4 text-[12px] font-medium transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5b9cff] ${active ? 'bg-[#0b2345] text-white' : 'text-[#c8d3e3]'}`}>
          <Icon size={16} />{label}{active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0b6bff]" />}
        </button>)}
      </nav>
      <div className="ml-auto flex h-full shrink-0 items-center gap-3 px-5">
        <button type="button" aria-label="Уведомления" onClick={() => notify('Новых уведомлений нет')} className="grid h-9 w-9 place-items-center rounded-lg text-[#c8d3e3] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9cff]"><Bell size={17} /></button>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1769e0] text-xs font-semibold">ИИ</span>
        <div className="leading-tight"><p className="text-xs font-semibold">Иван Иванов</p><p className="mt-0.5 text-[10px] text-[#9eacc0]">Руководитель проекта</p></div><ChevronDown size={15} className="text-[#9eacc0]" />
      </div>
    </header>

    <div className="flex h-[calc(100vh-64px)] min-h-0">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} relative shrink-0 border-r border-[#e3e8ef] bg-white transition-[width] duration-200`}>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-14 items-center gap-2 border-b border-[#edf0f4] p-3">
            {sidebarOpen && <label className="relative min-w-0 flex-1"><span className="sr-only">Поиск проекта</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск" className="h-9 w-full rounded-lg border border-[#dce2ea] pl-9 pr-3 text-xs outline-none focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]" /></label>}
            <button type="button" onClick={() => setSidebarOpen(value => !value)} aria-label={sidebarOpen ? 'Свернуть панель' : 'Развернуть панель'} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dce2ea] text-[#667085] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">{sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-3">
            {sidebarOpen ? <>
              <button type="button" onClick={() => notify()} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[11px] font-semibold text-[#475467] hover:bg-[#f8fafc]"><Folder size={15} className="text-[#0b6bff]" />БИЗНЕС-ЮНИТ «САМОЛЕТ ОБРАЗОВАНИЕ»</button>
              <div className="mt-1">
                <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-[#344054]"><FolderOpen size={15} className="text-[#0b6bff]" />БИЗНЕС-ЮНИТ МОСКВА<ChevronDown size={13} className="ml-auto" /></div>
                <div className="pl-3">{filteredProjects.map(project => <button key={project} type="button" onClick={() => selectProject(project)} className={`flex w-full items-center gap-2 rounded-l-lg px-4 py-2 text-left text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${activeProject === project ? 'bg-[#eaf2ff] font-semibold text-[#174e9b]' : 'text-[#344054] hover:bg-[#f8fafc]'}`}><Folder size={14} className={activeProject === project ? 'text-[#0b6bff]' : 'text-[#98a2b3]'} />{project}</button>)}</div>
              </div>
              {['БИЗНЕС-ЮНИТ «ДОМ»', 'БИЗНЕС-ЮНИТ «САМОЛЕТ БАНК»', 'БИЗНЕС-ЮНИТ «САМОЛЕТ ПЛЮС»', 'БИЗНЕС-ЮНИТ «ГОСТЕПРИИМСТВО»'].map(unit => <button key={unit} type="button" onClick={() => notify()} className="mt-1 flex w-full items-center gap-2 truncate px-4 py-2 text-left text-[11px] font-semibold text-[#475467] hover:bg-[#f8fafc]"><Folder size={15} className="shrink-0 text-[#0b6bff]" /><span className="truncate">{unit}</span></button>)}
            </> : <div className="space-y-2 px-3">{projects.slice(0, 6).map((project, index) => <button key={project} type="button" title={project} onClick={() => selectProject(project)} className={`grid h-10 w-10 place-items-center rounded-lg ${activeProject === project ? 'bg-[#eaf2ff] text-[#0b6bff]' : 'text-[#98a2b3] hover:bg-[#f8fafc]'}`}><Folder size={16} /><span className="sr-only">{project}</span>{index === 3 && <span className="absolute" />}</button>)}</div>}
          </div>
          <div className="flex items-center gap-2 border-t border-[#edf0f4] p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#dc3545] text-[10px] font-semibold text-white">АС</span>{sidebarOpen && <><span className="truncate text-xs font-medium">Антон Суханкин</span><ChevronRight size={14} className="ml-auto text-[#98a2b3]" /></>}</div>
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto bg-[#f7f9fc]">
        <div className="sticky top-0 z-20 bg-white">
          <div className="flex min-h-[92px] items-center gap-4 border-b border-[#edf0f4] px-6 py-4">
            <img src="/assets/building.jpg" alt="Проект Новый квартал" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><h1 className="truncate text-[19px] font-semibold tracking-[-0.01em]">{activeProject}</h1><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#667085]"><span><b className="text-[#344054]">Стадия:</b> Проектирование</span><span><b className="text-[#344054]">БЮ:</b> МОСКОВСКИЙ УРБАН</span><span><b className="text-[#344054]">Кластер:</b> Комфорт / Москва</span><span><b className="text-[#344054]">РП:</b> Петров А.В.</span></div></div>
            <button type="button" onClick={() => setQuestionOpen(true)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#dce2ea] bg-white px-3 text-xs font-medium transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><MessageCircle size={15} />Задать вопрос</button>
          </div>
          <nav className="flex h-12 items-end overflow-x-auto border-b border-[#e3e8ef] px-5" aria-label="Разделы проекта">
            {projectTabs.map(tab => <button key={tab} type="button" onClick={() => tab !== 'Метрики' && notify()} className={`relative h-full shrink-0 px-3 text-[12px] font-medium transition hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Метрики' ? 'text-[#111827]' : 'text-[#7a8699]'}`}>{tab}{tab === 'Метрики' && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[#0b6bff]" />}</button>)}
          </nav>
          <nav className="flex h-11 items-end overflow-x-auto border-b border-[#e3e8ef] bg-white px-5" aria-label="Вкладки раздела Метрики">
            {metricTabs.map(tab => <button key={tab} type="button" onClick={() => tab !== 'Закупки' && notify()} aria-current={tab === 'Закупки' ? 'page' : undefined} className={`relative h-full shrink-0 px-3 text-[12px] font-medium transition hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Закупки' ? 'font-semibold text-[#111827]' : 'text-[#667085]'}`}>{tab}{tab === 'Закупки' && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[#0b6bff]" />}</button>)}
          </nav>
        </div>

        <div className="space-y-3 p-4 xl:p-5">
          {activeProject !== 'Новый квартал' && <div className="flex items-center justify-between gap-4 rounded-xl border border-[#cfe0ff] bg-[#f2f7ff] px-4 py-3 text-xs text-[#174e9b]"><span><b>Демо-значения привязаны к Новому кварталу.</b> Для выбранного проекта показана только контекстная оболочка.</span><button type="button" onClick={() => setActiveProject('Новый квартал')} className="shrink-0 rounded-lg border border-[#b8d2ff] bg-white px-3 py-2 font-semibold hover:bg-[#eaf2ff]">Вернуться к демо</button></div>}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e3e8ef] bg-white p-3" aria-label="Контекстные фильтры закупок">
            <div className="mr-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#eaf2ff] text-[#0b6bff]"><BarChart3 size={16} /></span><div><p className="text-xs font-semibold">Закупки</p><p className="flex items-center gap-1 text-[9px] text-[#667085]"><Database size={10} />Демо · обновлено 08.06.2025, 09:15</p></div></div>
            {[{ label: 'Период', value: period, set: setPeriod, options: ['Текущий квартал', 'Текущий месяц', 'Год'] }, { label: 'Тип закупки', value: type, set: setType, options: ['Все закупки', 'Работы', 'Материалы'] }, { label: 'Статус процедуры', value: status, set: setStatus, options: ['Все статусы', 'Критично', 'Внимание', 'Контроль'] }].map(filter => <label key={filter.label}><span className="sr-only">{filter.label}</span><select value={filter.value} onChange={e => filter.set(e.target.value)} className="h-8 rounded-lg border border-[#d7dee8] bg-white px-2.5 text-[11px] font-medium outline-none focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]">{filter.options.map(option => <option key={option}>{option}</option>)}</select></label>)}
            <button type="button" onClick={reset} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d7dee8] px-2.5 text-[11px] font-medium text-[#344054] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><RotateCcw size={13} />Сбросить</button>
          </div>

          <section className="rounded-2xl border border-[#e3e8ef] bg-white p-4" aria-label="Бюджет и контрактация">
            <SectionTitle icon={WalletCards} title="Бюджет и контрактация" note="Масштаб портфеля и покрытие обязательствами" />
            <div className="mt-3 grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
              <div><p className="text-[11px] text-[#667085]">Общий бюджет закупок</p><p className="mt-1 text-[27px] font-normal leading-none tracking-[-0.03em]">24,0 млрд ₽</p><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[#e3e8ef] p-2"><p className="text-[9px] text-[#667085]">Работы</p><p className="mt-1 text-xs font-semibold">14,1 млрд ₽</p></div><div className="rounded-xl border border-[#e3e8ef] p-2"><p className="text-[9px] text-[#667085]">Материалы</p><p className="mt-1 text-xs font-semibold">9,9 млрд ₽</p></div></div></div>
              <div className="min-w-0"><div className="flex items-end justify-between"><div><p className="text-[10px] text-[#667085]">Структура покрытия</p><p className="mt-0.5 text-xs font-semibold">17,3 млрд ₽ законтрактовано · 72%</p></div><span className="text-[10px] text-[#667085]">24,0 млрд ₽</span></div><div className="mt-2 flex h-7 overflow-hidden rounded-lg bg-[#e7ebf0]"><div className="grid place-items-center bg-[#0b6bff] text-[9px] font-semibold text-white" style={{ width: '72%' }}>72%</div><div className="grid place-items-center bg-[#7c3aed] text-[9px] font-semibold text-white" style={{ width: '16%' }}>16%</div><div className="grid place-items-center text-[9px] font-semibold text-[#475467]" style={{ width: '12%' }}>12%</div></div><div className="mt-1.5 flex gap-4 text-[9px] text-[#667085]"><span>● <i className="not-italic text-[#0b6bff]">Договоры</i></span><span>● <i className="not-italic text-[#7c3aed]">Открытые тендеры · 3,9 млрд ₽</i></span><span>● Остаток</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><BudgetLine label="Законтрактовано работ" value="10,2 / 14,1 млрд ₽" percent={72} /><BudgetLine label="Законтрактовано материалов" value="7,1 / 9,9 млрд ₽" percent={72} violet /></div></div>
            </div>
          </section>

          <div className="grid gap-3 min-[1080px]:grid-cols-12">
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-4 min-[1080px]:col-span-7" aria-label="Финансовый результат">
              <div className="flex flex-wrap items-start justify-between gap-2"><SectionTitle icon={TrendingUp} title="Финансовый результат" note="Отклонение договоров от бюджета" tone="red" /><div className="text-right"><p className="text-[9px] text-[#667085]">Превышение</p><p className="text-xl text-[#dc2626]">+1,15 млрд ₽ <span className="text-xs font-semibold">↑ +4,8%</span></p></div></div>
              <div className="mt-3 flex items-center justify-between"><p className="text-[9px] font-semibold uppercase tracking-wide text-[#667085]">TOP-3 драйверов</p><div className="flex rounded-lg bg-[#f2f4f7] p-0.5" role="tablist">{(['Работы', 'Материалы'] as const).map(mode => <button key={mode} type="button" role="tab" aria-selected={driverType === mode} onClick={() => setDriverType(mode)} className={`rounded-md px-2.5 py-1 text-[9px] font-semibold transition ${driverType === mode ? 'bg-white text-[#111827] shadow-sm' : 'text-[#667085]'}`}>{mode}</button>)}</div></div>
              <div className="mt-1.5 space-y-1">{drivers.map(driver => { const positive = driver.contract > driver.budget; const max = Math.max(driver.budget, driver.contract) * 1.08; return <button key={driver.name} type="button" className="w-full rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-[#e3e8ef] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><span className="flex items-center justify-between gap-3 text-[10px]"><b className="truncate font-medium">{driver.name}</b><span className={`font-semibold ${positive ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{driver.delta} · {driver.percent}</span></span><span className="mt-1.5 grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2 text-[8px] text-[#667085]"><span>Бюджет</span><span className="h-1 rounded-full bg-[#e8ecf1]"><i className="block h-full rounded-full bg-[#9aa5b5]" style={{ width: `${driver.budget / max * 100}%` }} /></span></span><span className="mt-1 grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2 text-[8px] text-[#667085]"><span>Договор</span><span className="h-1 rounded-full bg-[#e8ecf1]"><i className={`block h-full rounded-full ${positive ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${driver.contract / max * 100}%` }} /></span></span></button>; })}</div>
            </section>
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-4 min-[1080px]:col-span-5" aria-label="Эффективность и конкуренция">
              <SectionTitle icon={BriefcaseBusiness} title="Эффективность и конкуренция" note="Факт относительно проектной нормы" tone="green" />
              <div className="mt-2 space-y-0.5">{efficiency.map(({ label, value, norm, fact, target, Icon, positive }) => <button key={label} type="button" className="flex w-full items-center gap-2 rounded-xl border border-transparent p-1.5 text-left transition hover:border-[#e3e8ef] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><span className={`grid h-6 w-6 place-items-center rounded-lg ${positive ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#fff0f1] text-[#dc2626]'}`}><Icon size={12} /></span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2 text-[9px]"><b className="truncate font-medium">{label}</b><strong className={positive ? 'text-[#17834b]' : 'text-[#dc2626]'}>{value}</strong></span><span className="relative mt-1 block h-1 rounded-full bg-[#edf0f4]"><i className={`block h-full rounded-full ${positive ? 'bg-[#17834b]' : 'bg-[#dc2626]'}`} style={{ width: `${fact}%` }} /><i className="absolute -top-1 h-3 w-0.5 bg-[#111827]" style={{ left: `${target}%` }} /></span><span className="mt-0.5 block text-[8px] text-[#667085]">Норма: {norm}</span></span></button>)}</div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white" aria-label="Риски и действия">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e8ef] px-4 py-3"><SectionTitle icon={ShieldAlert} title="Риски и действия" note="7 тендеров под риском · 1,23 млрд ₽" tone="red" /><span className="hidden items-center gap-1 text-[9px] text-[#667085] sm:flex"><AlertTriangle size={12} className="text-[#dc2626]" />Выберите строку для подробностей</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left text-[10px]"><thead className="bg-[#f8fafc] text-[9px] font-semibold uppercase tracking-wide text-[#667085]"><tr><th className="px-4 py-2">Тендер</th><th className="px-3 py-2">Предмет / тип</th><th className="px-3 py-2">Стоимость</th><th className="px-3 py-2">Требуется</th><th className="px-3 py-2">Прогноз</th><th className="px-3 py-2">Запас</th><th className="px-3 py-2">Статус</th><th className="px-4 py-2 text-right">Действие</th></tr></thead><tbody>{filteredRisks.map(risk => <tr key={risk.id} tabIndex={0} onClick={() => setSelectedRisk(risk)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedRisk(risk); }} className="cursor-pointer border-t border-[#edf0f4] transition hover:bg-[#f7faff] focus-visible:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff]"><td className="px-4 py-2 font-semibold text-[#0b6bff]">{risk.id}</td><td className="px-3 py-2"><b className="font-medium">{risk.subject}</b><span className="ml-1.5 text-[8px] text-[#667085]">{risk.type}</span></td><td className="px-3 py-2 font-medium">{risk.cost}</td><td className="px-3 py-2 text-[#475467]">{risk.required}</td><td className="px-3 py-2 text-[#475467]">{risk.forecast}</td><td className={`px-3 py-2 font-semibold ${risk.reserve < 0 ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{risk.reserve > 0 ? '+' : ''}{risk.reserve}</td><td className="px-3 py-2"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold ${statusClass[risk.status]}`}>{risk.status === 'Контроль' ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}{risk.status}</span></td><td className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 font-semibold text-[#0b6bff]">Подробнее<ChevronRight size={12} /></span></td></tr>)}</tbody></table></div>
            <div className="flex items-center justify-between border-t border-[#e3e8ef] px-4 py-2 text-[9px] text-[#667085]"><span>Показано {filteredRisks.length} из 7 процедур</span><span>Демонстрационные данные · не промышленный расчёт</span></div>
          </section>
        </div>
      </section>
    </div>

    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-medium text-white shadow-lg">{toast}</div>}
    {questionOpen && <div className="fixed inset-0 z-40 flex justify-end bg-[#111827]/20" onMouseDown={e => { if (e.target === e.currentTarget) setQuestionOpen(false); }}><aside role="dialog" aria-modal="true" aria-label="Задать вопрос" className="h-full w-full max-w-sm border-l border-[#e3e8ef] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Задать вопрос</p><p className="mt-1 text-[10px] text-[#667085]">Метрики → Закупки → {activeProject}</p></div><button type="button" aria-label="Закрыть" onClick={() => setQuestionOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f2f4f7]"><X size={16} /></button></div><textarea autoFocus placeholder="Опишите, что нужно уточнить…" className="mt-6 h-36 w-full resize-none rounded-xl border border-[#dce2ea] p-3 text-xs outline-none focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]" /><button type="button" onClick={() => { setQuestionOpen(false); notify('Вопрос сохранён как черновик'); }} className="mt-3 w-full rounded-xl bg-[#0b6bff] px-4 py-3 text-xs font-semibold text-white hover:bg-[#095bd8]">Сохранить черновик</button></aside></div>}
    {selectedRisk && <div className="fixed inset-0 z-40 flex justify-end bg-[#111827]/20" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedRisk(null); }}><aside role="dialog" aria-modal="true" aria-label={`Подробности тендера ${selectedRisk.id}`} className="h-full w-full max-w-sm overflow-y-auto border-l border-[#e3e8ef] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[selectedRisk.status]}`}>{selectedRisk.status}</span><button type="button" aria-label="Закрыть подробности" onClick={() => setSelectedRisk(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f2f4f7]"><X size={16} /></button></div><p className="mt-7 text-[10px] font-semibold text-[#0b6bff]">{selectedRisk.id}</p><h2 className="mt-2 text-xl font-semibold">{selectedRisk.subject}</h2><p className="mt-2 text-xs text-[#667085]">{selectedRisk.type} · {selectedRisk.owner}</p><dl className="mt-6 grid grid-cols-2 gap-2">{[['Стоимость', selectedRisk.cost], ['Запас', `${selectedRisk.reserve > 0 ? '+' : ''}${selectedRisk.reserve} дней`], ['Требуемая дата', selectedRisk.required], ['Прогноз', selectedRisk.forecast]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f8fafc] p-3"><dt className="text-[9px] text-[#667085]">{label}</dt><dd className="mt-1 text-xs font-semibold">{value}</dd></div>)}</dl><div className="mt-5 rounded-xl border border-[#f7c7ca] bg-[#fff8f8] p-4"><p className="text-[10px] font-semibold text-[#b91c1c]">Следующее действие</p><p className="mt-2 text-xs leading-5 text-[#475467]">Проверить срок поставки и зафиксировать план восстановления даты.</p></div><button type="button" className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-xs font-semibold text-white">Открыть карточку тендера<ArrowUpRight size={15} /></button></aside></div>}
  </main>;
};
