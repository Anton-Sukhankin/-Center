import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Database, FileBarChart2, Folder, FolderOpen, Grid2X2, LayoutDashboard, Layers3, ListChecks, MessageCircleQuestion, RotateCcw, Search, Send, ShieldAlert, SlidersHorizontal, TrendingUp, UserRoundX, UsersRound, WalletCards, X } from 'lucide-react';
type Driver = {
  name: string;
  budget: number;
  contract: number;
  delta: string;
  percent: string;
};
type Risk = {
  id: string;
  subject: string;
  type: 'Работы' | 'Материалы';
  cost: string;
  required: string;
  forecast: string;
  reserve: number;
  status: 'Критично' | 'Внимание' | 'Контроль';
  owner: string;
};
const projects = ['Nova', 'Алхимово', 'Молжаниново', 'Новый квартал', 'Кольские Огни', 'Дмитров дом', 'Цветочный'];
const workDrivers: Driver[] = [{
  name: 'Монолитные работы',
  budget: 4200,
  contract: 4460,
  delta: '+260 млн ₽',
  percent: '+6,2%'
}, {
  name: 'Отделочные работы',
  budget: 1850,
  contract: 2020,
  delta: '+170 млн ₽',
  percent: '+9,2%'
}, {
  name: 'Фасадные работы',
  budget: 1100,
  contract: 1010,
  delta: '−90 млн ₽',
  percent: '−8,2%'
}];
const materialDrivers: Driver[] = [{
  name: 'Фасадные материалы',
  budget: 820,
  contract: 1040,
  delta: '+220 млн ₽',
  percent: '+26,8%'
}, {
  name: 'Лифтовое оборудование',
  budget: 580,
  contract: 700,
  delta: '+120 млн ₽',
  percent: '+20,7%'
}, {
  name: 'Кабельно-проводниковая продукция',
  budget: 330,
  contract: 400,
  delta: '+70 млн ₽',
  percent: '+21,2%'
}];
const efficiency = [{
  label: 'Средний срок проведения тендера',
  value: '18 дней',
  norm: '14 дней',
  delta: '+4 дня',
  status: 'Выше нормы',
  Icon: CalendarDays,
  positive: false
}, {
  label: 'Среднее количество участников на лот',
  value: '4,2',
  norm: '3,1',
  delta: '+1,1',
  status: 'Достаточная конкуренция',
  Icon: UsersRound,
  positive: true
}, {
  label: 'Среднее количество лотов на тендер',
  value: '4,8',
  norm: '3,0',
  delta: '+1,8',
  status: 'Выше нормы',
  Icon: Layers3,
  positive: false
}, {
  label: 'Доля лотов с одним участником',
  value: '18%',
  norm: '10%',
  delta: '+8 п.п.',
  status: 'Выше нормы',
  Icon: UserRoundX,
  positive: false
}];
const risks: Risk[] = [{
  id: 'T-15234',
  subject: 'Минеральная вата',
  type: 'Материалы',
  cost: '14,2 млн ₽',
  required: '18.08.2024',
  forecast: '25.08.2024',
  reserve: -7,
  status: 'Критично',
  owner: 'Анна Белова'
}, {
  id: 'T-15411',
  subject: 'Лифтовое оборудование',
  type: 'Материалы',
  cost: '48,7 млн ₽',
  required: '12.09.2024',
  forecast: '10.09.2024',
  reserve: 2,
  status: 'Внимание',
  owner: 'Илья Орлов'
}, {
  id: 'T-15562',
  subject: 'Бетон и смеси',
  type: 'Материалы',
  cost: '32,1 млн ₽',
  required: '05.09.2024',
  forecast: '28.08.2024',
  reserve: 8,
  status: 'Контроль',
  owner: 'Антон Сергеев'
}, {
  id: 'T-15603',
  subject: 'Фасадные панели',
  type: 'Работы',
  cost: '26,5 млн ₽',
  required: '20.08.2024',
  forecast: '22.08.2024',
  reserve: -2,
  status: 'Внимание',
  owner: 'Мария Соколова'
}, {
  id: 'T-15677',
  subject: 'Электрощитовое оборудование',
  type: 'Материалы',
  cost: '19,8 млн ₽',
  required: '03.09.2024',
  forecast: '05.09.2024',
  reserve: -2,
  status: 'Внимание',
  owner: 'Павел Елисеев'
}, {
  id: 'T-15702',
  subject: 'Окна ПВХ',
  type: 'Работы',
  cost: '12,4 млн ₽',
  required: '15.08.2024',
  forecast: '19.08.2024',
  reserve: -4,
  status: 'Критично',
  owner: 'Ольга Васина'
}, {
  id: 'T-15745',
  subject: 'Инженерные трубы',
  type: 'Материалы',
  cost: '9,5 млн ₽',
  required: '25.09.2024',
  forecast: '26.09.2024',
  reserve: 1,
  status: 'Контроль',
  owner: 'Денис Юдин'
}];
const statusClass = {
  Критично: 'bg-[#fff0f1] text-[#b91c1c]',
  Внимание: 'bg-amber-50 text-amber-800',
  Контроль: 'bg-[#ecf9f1] text-[#12683c]'
};
function SectionTitle({
  icon: Icon,
  title,
  note,
  tone = 'blue'
}: {
  icon: typeof WalletCards;
  title: string;
  note: string;
  tone?: 'blue' | 'red' | 'green';
}) {
  const color = tone === 'red' ? 'bg-[#fff0f1] text-[#dc2626]' : tone === 'green' ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#eaf2ff] text-[#0b6bff]';
  return <div className="flex min-w-0 items-start gap-2.5">
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${color}`}><Icon size={16} aria-hidden="true" /></span>
    <div className="min-w-0"><h2 className="text-[14px] font-semibold leading-4 text-[#111827]">{title}</h2><p className="mt-1 text-[11px] text-[#667085]">{note}</p></div>
  </div>;
}
function SummaryMetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof WalletCards;
  tone?: 'neutral' | 'danger' | 'success';
}) {
  const styles = {
    neutral: {
      icon: 'bg-[#eaf2ff] text-[#0b6bff]',
      value: 'text-[#111827]'
    },
    danger: {
      icon: 'bg-[#fff0f1] text-[#dc2626]',
      value: 'text-[#dc2626]'
    },
    success: {
      icon: 'bg-[#ecf9f1] text-[#17834b]',
      value: 'text-[#17834b]'
    }
  }[tone];
  return <article className="min-w-0 overflow-hidden rounded-xl border border-[#e3e8ef] bg-white">
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${styles.icon}`}><Icon size={15} aria-hidden="true" /></span>
      <div className="flex min-w-0 flex-col gap-1"><p className="text-[10px] font-medium leading-4 text-[#667085]">{label}</p><p className={`whitespace-nowrap text-lg font-semibold leading-none ${styles.value}`}>{value}</p></div>
    </div>
    <div className="border-t border-[#e3e8ef] bg-white px-3 py-1.5"><p className="truncate text-[9px] leading-4 text-[#667085]" title={note}>{note}</p></div>
  </article>;
}
function CircularMetric({
  label,
  value,
  budget,
  accent = 'blue'
}: {
  label: string;
  value: string;
  budget: string;
  accent?: 'blue' | 'violet';
}) {
  const color = accent === 'violet' ? '#7c3aed' : '#0b6bff';
  return <article className="flex h-full min-w-0 items-center gap-3 rounded-xl border border-[#e3e8ef] bg-[#fbfcfe] p-3">
    <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full" style={{
      background: `conic-gradient(${color} 0 72%, #e7ebf0 72% 100%)`
    }} role="img" aria-label={`${label}: 72 процента`}>
      <span className="absolute inset-[10px] rounded-full bg-white" />
      <strong className="relative text-xl font-semibold text-[#111827]">72%</strong>
    </div>
    <div className="h-[92px] min-w-0"><p className="text-[10px] font-medium leading-4 text-[#667085]">{label}</p><p className="mt-1 text-base font-medium leading-6 text-[#111827]">{value}</p><p className="mt-1 text-[9px] text-[#667085]">из бюджета {budget}</p></div>
  </article>;
}
function BudgetStructureCircle() {
  return <article className="flex h-full min-w-0 items-center gap-3 rounded-xl border border-[#e3e8ef] bg-[#fbfcfe] p-3">
    <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full" style={{
      background: 'conic-gradient(#0b6bff 0 72%, #7c3aed 72% 88%, #d8dee7 88% 100%)'
    }} role="img" aria-label="Структура покрытия бюджета: 72 процента договоры, 16 процентов открытые тендеры, 12 процентов остаток">
      <span className="absolute inset-[10px] rounded-full bg-white" />
      <strong className="relative text-xl font-semibold leading-none">72%</strong>
    </div>
    <div className="h-[92px] min-w-0"><p className="text-[10px] font-medium leading-4 text-[#667085]">Структура покрытия</p><p className="mt-1 text-base font-semibold leading-6">Состояние бюджета</p><div className="mt-2 space-y-1 text-[8px]"><p className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#0b6bff]" /><span className="font-semibold">17,3 млрд ₽</span><span className="text-[#667085]">договоры</span></p><p className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#7c3aed]" /><span className="font-semibold">3,9 млрд ₽</span><span className="text-[#667085]">тендеры</span></p><p className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d8dee7]" /><span className="font-semibold">2,8 млрд ₽</span><span className="text-[#667085]">остаток</span></p></div></div>
  </article>;
}
function DriverComparison({
  title,
  items
}: {
  title: string;
  items: Driver[];
}) {
  const max = Math.max(...items.flatMap(item => [item.budget, item.contract]));
  return <div className="rounded-xl border border-[#e3e8ef] bg-[#fbfcfe] p-3">
    <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold text-[#344054]">{title}</p><div className="flex items-center gap-3 text-[8px] text-[#667085]"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-[#a7b0bf]" />Бюджет</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-[#dc2626]" />Договор</span></div></div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {items.map(item => {
        const overrun = item.contract > item.budget;
        return <button key={item.name} type="button" className="group min-w-0 rounded-lg px-1 py-1 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]" aria-label={`${item.name}: бюджет ${item.budget} млн рублей, договор ${item.contract} млн рублей, отклонение ${item.delta}`}>
          <span className="flex h-[76px] items-end justify-center gap-1.5 border-b border-[#d7dee8] pb-1">
            <i className="w-4 rounded-t bg-[#a7b0bf] transition-colors group-hover:bg-[#8792a3]" style={{
              height: `${Math.max(22, item.budget / max * 68)}px`
            }} />
            <i className={`w-4 rounded-t transition-colors ${overrun ? 'bg-[#ef4444] group-hover:bg-[#dc2626]' : 'bg-[#22a060] group-hover:bg-[#17834b]'}`} style={{
              height: `${Math.max(22, item.contract / max * 68)}px`
            }} />
          </span>
          <span className="mt-1.5 block truncate text-center text-[9px] font-medium text-[#344054]" title={item.name}>{item.name}</span>
          <span className={`mt-0.5 block text-center text-[9px] font-semibold ${overrun ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{item.delta}</span>
        </button>;
      })}
    </div>
  </div>;
}
export const ProcurementMetrics03ThreeCircularCards = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [activeProject, setActiveProject] = useState('Новый квартал');
  const [period, setPeriod] = useState('Текущий квартал');
  const [type, setType] = useState('Все закупки');
  const [status, setStatus] = useState('Все статусы');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState('');
  const visibleProjects = projects.filter(project => project.toLowerCase().includes(query.toLowerCase()));
  const filteredRisks = useMemo(() => risks.filter(risk => (type === 'Все закупки' || risk.type === type) && (status === 'Все статусы' || risk.status === status)), [type, status]);
  const notify = (message = 'Раздел вне рамок концепта') => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };
  const reset = () => {
    setPeriod('Текущий квартал');
    setType('Все закупки');
    setStatus('Все статусы');
    setSelectedRisk(null);
  };
  const selectProject = (project: string) => setActiveProject(project);
  const topNav = [['Сводный дашборд', LayoutDashboard], ['Цифровая шахматка', Grid2X2], ['Трекер задач', ListChecks], ['ГПР и Расписание', CalendarDays], ['Процессные отчеты', FileBarChart2]] as const;
  const projectTabs = ['Общие', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение', 'Метрики'];
  const metricTabs = ['Общие', 'Закупки', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение'];
  return <div className="h-screen min-h-[760px] w-full overflow-hidden bg-[#f7f9fc] font-[Inter,Arial,sans-serif] text-[#111827]">
    <header className="flex h-16 items-center bg-[#07182f] text-white">
      <button type="button" onClick={() => notify('Главная страница продукта')} className="flex h-full w-64 shrink-0 items-center gap-3 border-r border-white/5 px-5 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#67a4ff]">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[#7fb2ff]"><Building2 size={18} /></span><span className="text-sm font-semibold tracking-wide">ЛК ПК | AIShtab</span>
      </button>
      <nav className="flex h-full min-w-0 flex-1 items-stretch" aria-label="Глобальная навигация">
        {topNav.map(([label, Icon], index) => <button key={label} type="button" onClick={() => index === 0 ? undefined : notify('Раздел вне рамок концепта')} className={`flex min-w-0 items-center gap-2 px-4 text-xs font-medium transition hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#67a4ff] ${index === 0 ? 'border-b-2 border-[#3b8cff] bg-[#0c2443]' : 'text-white/75'}`}><Icon size={16} className="shrink-0 text-[#8fbaff]" /><span className="truncate">{label}</span></button>)}
      </nav>
      <button type="button" onClick={() => notify('Профиль пользователя')} className="flex h-full shrink-0 items-center gap-3 px-5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#67a4ff]">
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
            <button type="button" onClick={() => notify('Раздел вне рамок концепта')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-medium hover:bg-[#f5f7fa]"><Folder size={15} className="text-[#0b6bff]" />БИЗНЕС-ЮНИТ «САМОЛЕТ ОБРАЗОВАНИЕ»</button>
            <div className="mt-1"><div className="flex items-center gap-2 px-2 py-2 font-semibold"><ChevronDown size={14} /><FolderOpen size={15} className="text-[#0b6bff]" />БИЗНЕС-ЮНИТ МОСКВА</div>
              <div className="ml-3 border-l border-[#e3e8ef] pl-2">{visibleProjects.map(project => <button key={project} type="button" onClick={() => selectProject(project)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] ${activeProject === project ? 'bg-[#eef5ff] font-semibold text-[#0b6bff]' : 'hover:bg-[#f5f7fa]'}`}><Building2 size={14} className="shrink-0" /><span className="truncate">{project}</span></button>)}{visibleProjects.length === 0 && <p className="px-3 py-5 text-center text-[#98a2b3]">Ничего не найдено</p>}</div>
            </div>
            {['БИЗНЕС-ЮНИТ «ДОМ»', 'БИЗНЕС-ЮНИТ «САМОЛЕТ БАНК»', 'БИЗНЕС-ЮНИТ «САМОЛЕТ ПЛЮС»'].map(unit => <button key={unit} type="button" onClick={() => notify('Раздел вне рамок концепта')} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-medium hover:bg-[#f5f7fa]"><ChevronRight size={14} /><Folder size={15} className="text-[#0b6bff]" /><span className="truncate">{unit}</span></button>)}
          </>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto" aria-label="Метрики проекта">
        <div className="min-w-[920px] bg-white">
          <section className="flex items-center gap-4 px-6 pb-3 pt-4">
            <img src="https://storage.googleapis.com/storage.magicpath.ai/component-assets/438634382102786048/438638099099185152/2f1bcc5c24303ca25dcead382dd241950ae43a787ec6ed1fe031ee2e9f37a311.jpg" alt="Новый квартал" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><h1 className="text-xl font-semibold">{activeProject}</h1><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#667085]"><span><b className="text-[#344054]">Стадия:</b> Проектирование</span><span><b className="text-[#344054]">БЮ:</b> МОСКОВСКИЙ УРБАН</span><span><b className="text-[#344054]">Кластер:</b> Комфорт / Москва</span><span><b className="text-[#344054]">РП:</b> Петров А.В.</span></div></div>
          </section>
          <div className="flex items-end justify-between border-b border-[#e3e8ef] px-5">
            <nav className="flex min-w-max items-end" aria-label="Разделы проекта">{projectTabs.map(tab => <button key={tab} type="button" onClick={() => tab !== 'Метрики' && notify('Раздел вне рамок концепта')} className={`relative h-11 px-3 text-xs font-medium transition hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Метрики' ? 'text-[#111827]' : 'text-[#667085]'}`}>{tab}{tab === 'Метрики' && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#0b6bff]" />}</button>)}</nav>
            <button type="button" onClick={() => setDrawer(true)} className="mb-2 inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7dee8] px-3 text-xs font-medium transition hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><MessageCircleQuestion size={15} />Задать вопрос</button>
          </div>
          <nav className="overflow-x-auto border-b border-[#e3e8ef] bg-white px-5" aria-label="Разделы метрик"><div className="flex min-w-max items-end">{metricTabs.map(tab => <button key={tab} type="button" onClick={() => tab !== 'Закупки' && notify('Раздел вне рамок концепта')} className={`relative h-11 px-4 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Закупки' ? 'font-semibold text-[#111827]' : 'font-medium text-[#667085] hover:text-[#111827]'}`}>{tab}{tab === 'Закупки' && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[#0b6bff]" />}</button>)}</div></nav>
        </div>

        <div className="space-y-4 p-5">
          {activeProject !== 'Новый квартал' && <div className="flex items-center justify-between rounded-xl border border-[#d6e5ff] bg-[#f5f9ff] px-4 py-3 text-xs"><span>Демо-значения закупочных метрик привязаны к проекту «Новый квартал».</span><button type="button" onClick={() => setActiveProject('Новый квартал')} className="font-semibold text-[#0b6bff] hover:underline">Вернуться к проекту</button></div>}
          <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e3e8ef] bg-white p-4" aria-label="Фильтры метрик закупок">
            <SlidersHorizontal size={16} className="mr-1 text-[#667085]" /><span className="mr-2 text-xs font-semibold">Фильтры</span>
            <label className="sr-only" htmlFor="balance-period">Период</label><select id="balance-period" value={period} onChange={e => setPeriod(e.target.value)} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium text-[#344054] outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]"><option>Текущий квартал</option><option>Текущий месяц</option><option>Год</option></select>
            <label className="sr-only" htmlFor="balance-category">Тип закупки</label><select id="balance-category" value={type} onChange={e => setType(e.target.value)} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium text-[#344054] outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]"><option>Все закупки</option><option>Работы</option><option>Материалы</option></select>
            <label className="sr-only" htmlFor="balance-status">Статус</label><select id="balance-status" value={status} onChange={e => setStatus(e.target.value)} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium text-[#344054] outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]"><option>Все статусы</option><option>Критично</option><option>Внимание</option><option>Контроль</option></select>
            <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7dee8] px-3 text-xs font-medium transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><RotateCcw size={14} />Сбросить</button>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[#667085]"><Database size={12} />Демо · обновлено 08.06.2025, 09:15</span>
          </section>

          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6" aria-label="Ключевые показатели закупок">
            <SummaryMetricCard label="Бюджет закупок" value="24,0 млрд ₽" note="Работы 14,1 · Материалы 9,9" icon={WalletCards} />
            <SummaryMetricCard label="Законтрактовано" value="17,3 млрд ₽" note="72% общего бюджета" icon={BriefcaseBusiness} />
            <SummaryMetricCard label="Отклонение от бюджета" value="+4,8%" note="Стоимость договоров · +1,15 млрд ₽" icon={TrendingUp} tone="danger" />
            <SummaryMetricCard label="Срок проведения тендера" value="18 дней" note="Демо-норма · 14 дней" icon={CalendarDays} tone="danger" />
            <SummaryMetricCard label="Участников на лот" value="4,2" note="Среднее · демо-норма 3,1" icon={UsersRound} tone="success" />
            <SummaryMetricCard label="Закупки под риском" value="7 тендеров" note="Демо-сумма · 1,23 млрд ₽" icon={ShieldAlert} tone="danger" />
          </section>

          <section className="rounded-2xl border border-[#e3e8ef] bg-white p-4" aria-label="Контрактация бюджета">
            <SectionTitle icon={WalletCards} title="Контрактация бюджета" note="Бюджет закупок и покрытие действующими договорами" />
            <div className="mt-3 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
              <article className="flex h-full flex-col justify-between rounded-xl bg-[#f8fafc] p-4"><div><p className="text-[10px] text-[#667085]">Общий бюджет закупок</p><p className="mt-1 text-[27px] font-normal leading-none tracking-[-0.03em]">24,0 млрд ₽</p></div><div className="mt-4 grid grid-cols-2 divide-x divide-[#dfe5ec] rounded-lg bg-white px-2 py-2"><div className="pr-2"><p className="text-[9px] text-[#667085]">Работы</p><p className="mt-1 text-xs font-semibold">14,1 млрд ₽</p></div><div className="pl-2"><p className="text-[9px] text-[#667085]">Материалы</p><p className="mt-1 text-xs font-semibold">9,9 млрд ₽</p></div></div></article>
              <div className="grid auto-rows-fr gap-3 sm:grid-cols-3"><BudgetStructureCircle /><CircularMetric label="Контрактация работ" value="10,2 млрд ₽" budget="14,1 млрд ₽" /><CircularMetric label="Контрактация материалов" value="7,1 млрд ₽" budget="9,9 млрд ₽" accent="violet" /></div>
            </div>
          </section>

          <div className="grid gap-3 min-[1080px]:grid-cols-12">
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-4 min-[1080px]:col-span-7" aria-label="Финансовый эффект закупок">
              <div className="flex flex-wrap items-start justify-between gap-2"><SectionTitle icon={TrendingUp} title="Финансовый эффект закупок" note="Отклонение стоимости договоров от бюджета" tone="red" /><div className="text-right"><p className="text-[9px] text-[#667085]">Сумма превышения / экономии бюджета</p><p className="text-xl text-[#dc2626]">+1,15 млрд ₽ <span className="text-xs font-semibold">↑ +4,8%</span></p></div></div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2"><DriverComparison title="Наибольшие отклонения · работы" items={workDrivers} /><DriverComparison title="Наибольшие отклонения · материалы" items={materialDrivers} /></div>
              <p className="mt-2 text-[9px] text-[#667085]">Столбцы сравнивают бюджет и стоимость договора. TOP-позиции показывают основные отклонения, но не полный состав итоговых +1,15 млрд ₽.</p>
            </section>
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-4 min-[1080px]:col-span-5" aria-label="Эффективность закупочного процесса">
              <SectionTitle icon={BriefcaseBusiness} title="Эффективность закупочного процесса" note="Факт относительно демонстрационной нормы" />
              <div className="mt-3 grid grid-cols-2 gap-2">{efficiency.map(({
                  label,
                  value,
                  norm,
                  delta,
                  status,
                  Icon,
                  positive
                }) => <button key={label} type="button" onClick={() => notify(`${label}: факт ${value}, норма ${norm}`)} className="min-w-0 rounded-xl border border-[#e3e8ef] bg-[#fbfcfe] p-3 text-left transition hover:border-[#b9c8dc] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><span className="flex items-start justify-between gap-2"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${positive ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#fff0f1] text-[#dc2626]'}`}><Icon size={13} /></span><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${positive ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#fff0f1] text-[#dc2626]'}`}>{status}</span></span><span className="mt-2 block min-h-7 text-[9px] font-medium leading-3.5 text-[#475467]">{label}</span><span className="mt-2 flex items-end justify-between gap-2"><span><strong className={`block text-xl font-semibold leading-none ${positive ? 'text-[#17834b]' : 'text-[#dc2626]'}`}>{value}</strong><span className="mt-1 block text-[8px] text-[#667085]">Норма {norm}</span></span><span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${positive ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#fff0f1] text-[#dc2626]'}`}>{delta}</span></span></button>)}</div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white" aria-label="Закупки под риском">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e8ef] px-4 py-3"><SectionTitle icon={ShieldAlert} title="Закупки под риском" note="7 тендеров · демонстрационная сумма 1,23 млрд ₽" tone="red" /><span className="hidden items-center gap-1 text-[9px] text-[#667085] sm:flex"><AlertTriangle size={12} className="text-[#dc2626]" />Выберите строку для подробностей</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left text-[10px]"><thead className="bg-[#f8fafc] text-[9px] font-semibold uppercase tracking-wide text-[#667085]"><tr><th className="px-4 py-2">Тендер</th><th className="px-3 py-2">Предмет / тип</th><th className="px-3 py-2">Стоимость</th><th className="px-3 py-2">Требуется</th><th className="px-3 py-2">Прогноз</th><th className="px-3 py-2">Запас</th><th className="px-3 py-2">Статус</th><th className="px-4 py-2 text-right">Действие</th></tr></thead><tbody>{filteredRisks.map(risk => <tr key={risk.id} tabIndex={0} onClick={() => setSelectedRisk(risk)} onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedRisk(risk);
                  }} className="cursor-pointer border-t border-[#edf0f4] transition hover:bg-[#f7faff] focus-visible:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff]"><td className="px-4 py-2 font-semibold text-[#0b6bff]">{risk.id}</td><td className="px-3 py-2"><b className="font-medium">{risk.subject}</b><span className="ml-1.5 text-[8px] text-[#667085]">{risk.type}</span></td><td className="px-3 py-2 font-medium">{risk.cost}</td><td className="px-3 py-2 text-[#475467]">{risk.required}</td><td className="px-3 py-2 text-[#475467]">{risk.forecast}</td><td className={`px-3 py-2 font-semibold ${risk.reserve < 0 ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{risk.reserve > 0 ? '+' : ''}{risk.reserve}</td><td className="px-3 py-2"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold ${statusClass[risk.status]}`}>{risk.status === 'Контроль' ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}{risk.status}</span></td><td className="px-4 py-2 text-right"><span className="inline-flex items-center gap-1 font-semibold text-[#0b6bff]">Подробнее<ChevronRight size={12} /></span></td></tr>)}</tbody></table></div>
            <div className="flex items-center justify-between border-t border-[#e3e8ef] px-4 py-2 text-[9px] text-[#667085]"><span>Показано {filteredRisks.length} из 7 процедур</span><span>Демонстрационные данные · не промышленный расчёт</span></div>
          </section>
        </div>
      </main>
    </div>

    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-medium text-white shadow-lg">{toast}</div>}
    {drawer && <div className="fixed inset-0 z-40 bg-[#07182f]/20" onMouseDown={() => setDrawer(false)}><aside className="absolute inset-y-0 right-0 flex w-[380px] flex-col bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-[#e3e8ef] p-5"><div><p className="text-xs text-[#667085]">Контекст вопроса</p><h2 className="mt-1 font-semibold">Метрики → Закупки → {activeProject}</h2></div><button type="button" onClick={() => setDrawer(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#f5f7fa]" aria-label="Закрыть"><X size={18} /></button></div><div className="flex-1 p-5"><div className="rounded-xl bg-[#f5f8fc] p-4 text-xs leading-5 text-[#475467]">Вопрос будет дополнен текущими фильтрами: {period}, {type}, {status}.</div><label className="mt-5 block text-xs font-semibold" htmlFor="question">Ваш вопрос</label><textarea id="question" placeholder="Например: почему выросло отклонение по фасадным материалам?" className="mt-2 h-32 w-full resize-none rounded-xl border border-[#d7dee8] p-3 text-sm outline-none focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]" /></div><div className="border-t border-[#e3e8ef] p-5"><button type="button" onClick={() => {
            setDrawer(false);
            notify('Вопрос отправлен в демо-режиме');
          }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6bff] px-4 py-3 text-xs font-semibold text-white hover:bg-[#095cdd]"><Send size={15} />Отправить вопрос</button></div></aside></div>}
    {selectedRisk && <div className="fixed inset-0 z-40 flex justify-end bg-[#111827]/20" onMouseDown={e => {
      if (e.target === e.currentTarget) setSelectedRisk(null);
    }}><aside role="dialog" aria-modal="true" aria-label={`Подробности тендера ${selectedRisk.id}`} className="h-full w-full max-w-sm overflow-y-auto border-l border-[#e3e8ef] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[selectedRisk.status]}`}>{selectedRisk.status}</span><button type="button" aria-label="Закрыть подробности" onClick={() => setSelectedRisk(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f2f4f7]"><X size={16} /></button></div><p className="mt-7 text-[10px] font-semibold text-[#0b6bff]">{selectedRisk.id}</p><h2 className="mt-2 text-xl font-semibold">{selectedRisk.subject}</h2><p className="mt-2 text-xs text-[#667085]">{selectedRisk.type} · {selectedRisk.owner}</p><dl className="mt-6 grid grid-cols-2 gap-2">{[['Стоимость', selectedRisk.cost], ['Запас', `${selectedRisk.reserve > 0 ? '+' : ''}${selectedRisk.reserve} дней`], ['Требуемая дата', selectedRisk.required], ['Прогноз', selectedRisk.forecast]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f8fafc] p-3"><dt className="text-[9px] text-[#667085]">{label}</dt><dd className="mt-1 text-xs font-semibold">{value}</dd></div>)}</dl><div className="mt-5 rounded-xl border border-[#f7c7ca] bg-[#fff8f8] p-4"><p className="text-[10px] font-semibold text-[#b91c1c]">Следующее действие</p><p className="mt-2 text-xs leading-5 text-[#475467]">Проверить срок поставки и зафиксировать план восстановления даты.</p></div><button type="button" className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-xs font-semibold text-white">Открыть карточку тендера<ArrowUpRight size={15} /></button></aside></div>}
  </div>;
};