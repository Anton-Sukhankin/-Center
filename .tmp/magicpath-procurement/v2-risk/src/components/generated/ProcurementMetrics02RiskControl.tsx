import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  Layers3,
  PackageSearch,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  UserRoundX,
  UsersRound,
  WalletCards,
} from 'lucide-react';

type RiskStatus = 'Критично' | 'Внимание' | 'Контроль';
type Category = 'Работы' | 'Материалы';
type RiskRow = {
  id: string;
  subject: string;
  category: Category;
  cost: string;
  required: string;
  forecast: string;
  reserve: number;
  status: RiskStatus;
  owner: string;
  reason: string;
  nextAction: string;
};

const risks: RiskRow[] = [
  { id: 'T-15234', subject: 'Минеральная вата', category: 'Материалы', cost: '14,2 млн ₽', required: '18.08.2024', forecast: '25.08.2024', reserve: -7, status: 'Критично', owner: 'Мария Громова', reason: 'Не подтверждён производственный слот поставщика', nextAction: 'Зафиксировать резервного поставщика до 12:00' },
  { id: 'T-15411', subject: 'Лифтовое оборудование', category: 'Материалы', cost: '48,7 млн ₽', required: '12.09.2024', forecast: '10.09.2024', reserve: 2, status: 'Внимание', owner: 'Алексей Панов', reason: 'Согласование технической части затянуто на 4 дня', nextAction: 'Эскалировать согласование главному инженеру' },
  { id: 'T-15562', subject: 'Бетон и смеси', category: 'Материалы', cost: '32,1 млн ₽', required: '05.09.2024', forecast: '28.08.2024', reserve: 8, status: 'Контроль', owner: 'Ирина Лаврова', reason: 'Срок стабилизирован, контроль цены до контракта', nextAction: 'Подтвердить финальную цену на комитете' },
  { id: 'T-15603', subject: 'Фасадные панели', category: 'Работы', cost: '26,5 млн ₽', required: '20.08.2024', forecast: '22.08.2024', reserve: -2, status: 'Внимание', owner: 'Олег Михайлов', reason: 'Повторный запрос коммерческих предложений', nextAction: 'Закрыть сбор предложений сегодня' },
  { id: 'T-15677', subject: 'Электрощитовое оборудование', category: 'Материалы', cost: '19,8 млн ₽', required: '03.09.2024', forecast: '05.09.2024', reserve: -2, status: 'Внимание', owner: 'Сергей Миронов', reason: 'Изменение спецификации после публикации', nextAction: 'Подписать новую спецификацию' },
  { id: 'T-15702', subject: 'Окна ПВХ', category: 'Работы', cost: '12,4 млн ₽', required: '15.08.2024', forecast: '19.08.2024', reserve: -4, status: 'Критично', owner: 'Анна Орлова', reason: 'Единственный участник не подтвердил срок', nextAction: 'Запустить переговоры с альтернативой' },
  { id: 'T-15745', subject: 'Инженерные трубы', category: 'Материалы', cost: '9,5 млн ₽', required: '25.09.2024', forecast: '26.09.2024', reserve: 1, status: 'Контроль', owner: 'Дмитрий Волков', reason: 'Минимальный запас до требуемой даты', nextAction: 'Контрольный звонок поставщику 10.06' },
];

const workDrivers = [
  { name: 'Монолитные работы', budget: '4 200', contract: '4 460', delta: '+260 млн ₽', percent: '+6,2%', width: 92 },
  { name: 'Отделочные работы', budget: '1 850', contract: '2 020', delta: '+170 млн ₽', percent: '+9,2%', width: 70 },
  { name: 'Фасадные работы', budget: '1 100', contract: '1 010', delta: '−90 млн ₽', percent: '−8,2%', width: 48 },
];

const materialDrivers = [
  { name: 'Фасадные материалы', budget: '820', contract: '1 040', delta: '+220 млн ₽', percent: '+26,8%', width: 92 },
  { name: 'Лифтовое оборудование', budget: '580', contract: '700', delta: '+120 млн ₽', percent: '+20,7%', width: 68 },
  { name: 'Кабельно-проводниковая продукция', budget: '330', contract: '400', delta: '+70 млн ₽', percent: '+21,2%', width: 46 },
];

const efficiency = [
  { label: 'Средний срок тендера', value: '18 дней', norm: '14 дней', fact: 82, target: 64, icon: Clock3, bad: true },
  { label: 'Участников на лот', value: '4,2', norm: '3,1', fact: 78, target: 58, icon: UsersRound, bad: false },
  { label: 'Лотов на тендер', value: '4,8', norm: '3,0', fact: 80, target: 50, icon: Layers3, bad: false },
  { label: 'Лотов с одним участником', value: '18%', norm: '10%', fact: 72, target: 40, icon: UserRoundX, bad: true },
];

const statusClass: Record<RiskStatus, string> = {
  Критично: 'bg-[#fff0f1] text-[#b91c1c]',
  Внимание: 'bg-amber-50 text-amber-800',
  Контроль: 'bg-[#ecf9f1] text-[#12683c]',
};

const selectClass = 'h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium text-[#344054] outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]';

function Heading({ icon: Icon, title, caption, tone = 'blue' }: { icon: typeof WalletCards; title: string; caption: string; tone?: 'blue' | 'red' | 'green' | 'violet' }) {
  const tones = { blue: 'bg-[#eaf2ff] text-[#0b6bff]', red: 'bg-[#fff0f1] text-[#dc2626]', green: 'bg-[#ecf9f1] text-[#17834b]', violet: 'bg-[#f1eaff] text-[#7c3aed]' };
  return <div className="flex min-w-0 items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon size={18} aria-hidden="true" /></span><div className="min-w-0"><h2 className="text-[15px] font-semibold leading-5 text-[#111827]">{title}</h2><p className="mt-0.5 text-xs text-[#667085]">{caption}</p></div></div>;
}

export const GeneratedComponent = () => {
  const [period, setPeriod] = useState('Текущий квартал');
  const [category, setCategory] = useState('Все закупки');
  const [status, setStatus] = useState('Все статусы');
  const [selectedId, setSelectedId] = useState('T-15234');
  const [driverMode, setDriverMode] = useState<'Работы' | 'Материалы'>('Работы');
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const filtered = useMemo(() => risks.filter((row) => (category === 'Все закупки' || row.category === category) && (status === 'Все статусы' || row.status === status)), [category, status]);
  const selected = risks.find((row) => row.id === selectedId) ?? filtered[0] ?? risks[0];
  const drivers = driverMode === 'Работы' ? workDrivers : materialDrivers;

  const reset = () => { setPeriod('Текущий квартал'); setCategory('Все закупки'); setStatus('Все статусы'); setSelectedId('T-15234'); setDriverMode('Работы'); };
  const acknowledge = () => setAcknowledged((items) => items.includes(selected.id) ? items.filter((id) => id !== selected.id) : [...items, selected.id]);

  return (
    <main className="min-h-screen w-full bg-[#f7f9fc] font-[Inter,Arial,sans-serif] text-[#111827]">
      <div className="mx-auto w-full max-w-[1440px]">
        <nav className="overflow-x-auto border-b border-[#e3e8ef] bg-white px-5" aria-label="Разделы метрик"><div className="flex min-w-max items-end gap-1">{['Общие','Закупки','Проектирование','Тендеры и контрактация','Продажи','СМР','Приёмка и заселение'].map((tab) => <button key={tab} type="button" aria-current={tab === 'Закупки' ? 'page' : undefined} className={`relative h-12 px-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Закупки' ? 'font-semibold text-[#111827]' : 'font-medium text-[#667085] hover:text-[#111827]'}`}>{tab}{tab === 'Закупки' && <span className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-[#0b6bff]" />}</button>)}</div></nav>

        <div className="space-y-4 p-5">
          <header className="flex flex-col gap-3 rounded-2xl border border-[#e3e8ef] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0f1] text-[#dc2626]"><ShieldAlert size={21} /></span><div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">Метрики закупок · контроль рисков</h1><span className="rounded-full bg-[#f1eaff] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6d28d9]">Демо</span></div><p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]"><Database size={12} />Обновлено 08.06.2025 в 09:15</p></div></div>
            <div className="flex flex-wrap items-center gap-2" aria-label="Контекстные фильтры"><SlidersHorizontal size={16} className="text-[#667085]" /><label className="sr-only" htmlFor="risk-period">Период</label><select id="risk-period" value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass}><option>Текущий квартал</option><option>Текущий месяц</option><option>Год</option></select><label className="sr-only" htmlFor="risk-category">Тип закупки</label><select id="risk-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}><option>Все закупки</option><option>Работы</option><option>Материалы</option></select><label className="sr-only" htmlFor="risk-status">Статус</label><select id="risk-status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}><option>Все статусы</option><option>Критично</option><option>Внимание</option><option>Контроль</option></select><button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7dee8] px-3 text-xs font-medium transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><RotateCcw size={14} />Сбросить</button></div>
          </header>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white" aria-labelledby="risk-title">
            <div className="flex flex-col gap-3 border-b border-[#e3e8ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div id="risk-title"><Heading icon={ShieldAlert} title="Риски и действия" caption="7 тендеров под риском · 1,23 млрд ₽" tone="red" /></div><div className="flex gap-2 text-[11px]"><span className="rounded-full bg-[#fff0f1] px-2.5 py-1 font-semibold text-[#b91c1c]">2 критичных</span><span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">3 требуют внимания</span></div></div>
            <div className="grid min-[1000px]:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <div className="min-w-0 overflow-x-auto border-b border-[#e3e8ef] min-[1000px]:border-b-0 min-[1000px]:border-r"><table className="w-full min-w-[850px] border-collapse text-left text-xs"><thead className="bg-[#f8fafc] text-[10px] font-semibold uppercase tracking-wide text-[#667085]"><tr><th className="px-4 py-2.5">Тендер</th><th className="px-3 py-2.5">Предмет</th><th className="px-3 py-2.5">Стоимость</th><th className="px-3 py-2.5">Требуется / прогноз</th><th className="px-3 py-2.5">Запас</th><th className="px-4 py-2.5">Статус</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} tabIndex={0} onClick={() => setSelectedId(row.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(row.id); } }} className={`cursor-pointer border-t border-[#edf0f4] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${selected.id === row.id ? 'bg-[#f1f6ff]' : 'hover:bg-[#f8fbff]'}`}><td className="px-4 py-3 font-semibold text-[#0b6bff]">{row.id}</td><td className="px-3 py-3"><span className="block font-medium">{row.subject}</span><span className="text-[10px] text-[#667085]">{row.category}</span></td><td className="px-3 py-3 font-medium">{row.cost}</td><td className="px-3 py-3"><span className="block">{row.required}</span><span className="text-[10px] text-[#667085]">прогноз {row.forecast}</span></td><td className="px-3 py-3"><div className="flex items-center gap-2"><span className={`w-6 font-semibold ${row.reserve < 0 ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{row.reserve > 0 ? '+' : ''}{row.reserve}</span><span className="h-1.5 w-10 overflow-hidden rounded-full bg-[#edf0f4]"><span className={`block h-full rounded-full ${row.reserve < 0 ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${Math.min(100, Math.abs(row.reserve) * 12)}%` }} /></span></div></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass[row.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{row.status}</span></td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-[#667085]"><PackageSearch size={22} className="mx-auto mb-2" />Рисков по фильтрам не найдено</td></tr>}</tbody></table></div>
              <aside className="flex min-h-[310px] flex-col p-5" aria-label="Карточка выбранного риска"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Выбранный тендер</p><h3 className="mt-1 text-lg font-semibold">{selected.id}</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[selected.status]}`}>{selected.status}</span></div><p className="mt-3 text-xl font-medium">{selected.subject}</p><p className="mt-1 text-sm text-[#667085]">{selected.category} · {selected.cost}</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f8fafc] p-3"><p className="text-[10px] text-[#667085]">Требуемая дата</p><p className="mt-1 text-sm font-semibold">{selected.required}</p></div><div className="rounded-xl bg-[#f8fafc] p-3"><p className="text-[10px] text-[#667085]">Прогноз</p><p className="mt-1 text-sm font-semibold">{selected.forecast}</p></div></div><div className="mt-4 rounded-xl border border-[#e3e8ef] p-3"><p className="flex items-center gap-1.5 text-xs font-semibold"><AlertTriangle size={14} className="text-amber-600" />Причина</p><p className="mt-1.5 text-xs leading-5 text-[#667085]">{selected.reason}</p></div><div className="mt-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Следующее действие</p><p className="mt-1.5 text-sm font-medium leading-5">{selected.nextAction}</p><p className="mt-1 text-xs text-[#667085]">Ответственный: {selected.owner}</p></div><div className="mt-auto flex gap-2 pt-4"><button type="button" onClick={acknowledge} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] ${acknowledged.includes(selected.id) ? 'bg-[#ecf9f1] text-[#12683c]' : 'bg-[#111827] text-white hover:bg-[#243044]'}`}>{acknowledged.includes(selected.id) ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}{acknowledged.includes(selected.id) ? 'Взято в работу' : 'Взять в работу'}</button><button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-[#d7dee8] text-[#0b6bff] transition hover:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]" aria-label="Открыть карточку тендера"><ChevronRight size={17} /></button></div></aside>
            </div>
            <div className="flex items-center justify-between border-t border-[#e3e8ef] px-5 py-2.5 text-[10px] text-[#667085]"><span>Показано {filtered.length} из 7 процедур</span><span>Строка меняет фокус справа</span></div>
          </section>

          <div className="grid gap-4 min-[1000px]:grid-cols-[1.08fr_.92fr]">
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-labelledby="budget-title"><div id="budget-title"><Heading icon={WalletCards} title="Бюджет и контрактация" caption="Покрытие бюджета договорами и открытыми процедурами" /></div><div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]"><div><p className="text-xs text-[#667085]">Общий бюджет закупок</p><p className="mt-1 text-[30px] font-normal leading-none tracking-[-0.03em]">24,0 млрд ₽</p><div className="mt-3 flex gap-3 text-xs text-[#667085]"><span>Работы <b className="text-[#111827]">14,1</b></span><span>Материалы <b className="text-[#111827]">9,9</b></span></div></div><div><div className="flex justify-between text-xs"><span className="font-medium">Структура покрытия</span><span className="text-[#667085]">24,0 млрд ₽</span></div><div className="mt-3 flex h-8 overflow-hidden rounded-lg bg-[#eef1f5]" aria-label="Законтрактовано 72%, открытые тендеры 16%, остаток 12%"><span className="grid bg-[#0b6bff] text-[10px] font-semibold text-white" style={{ width: '72%', placeItems: 'center' }}>72%</span><span className="grid bg-[#7c3aed] text-[10px] font-semibold text-white" style={{ width: '16%', placeItems: 'center' }}>16%</span><span className="grid text-[10px] font-semibold text-[#475467]" style={{ width: '12%', placeItems: 'center' }}>12%</span></div><div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[#667085]"><span>● Договоры 17,3 млрд ₽</span><span className="text-[#7c3aed]">● Открытые 3,9 млрд ₽</span><span>● Остаток 2,8 млрд ₽</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{[['Работы','10,2 / 14,1 млрд ₽'],['Материалы','7,1 / 9,9 млрд ₽']].map(([label,value]) => <div key={label} className="rounded-xl bg-[#f8fafc] p-2.5"><div className="flex justify-between text-[11px]"><span className="font-medium">{label}</span><b>72%</b></div><div className="mt-2 h-1.5 rounded-full bg-[#e6eaf0]"><div className={`h-full w-[72%] rounded-full ${label === 'Работы' ? 'bg-[#0b6bff]' : 'bg-[#7c3aed]'}`} /></div><p className="mt-1.5 text-[10px] text-[#667085]">{value}</p></div>)}</div></div></div></section>

            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-labelledby="eff-title"><div id="eff-title"><Heading icon={BriefcaseBusiness} title="Эффективность и конкуренция" caption="Факт относительно проектной нормы" tone="green" /></div><div className="mt-4 space-y-2">{efficiency.map((item) => { const Icon = item.icon; return <div key={item.label} className="flex items-center gap-2.5 rounded-xl bg-[#f8fafc] p-2.5"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${item.bad ? 'bg-[#fff0f1] text-[#dc2626]' : 'bg-[#ecf9f1] text-[#17834b]'}`}><Icon size={14} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-[11px]"><span className="truncate font-medium">{item.label}</span><b className={item.bad ? 'text-[#dc2626]' : 'text-[#17834b]'}>{item.value}</b></div><div className="relative mt-1.5 h-1.5 rounded-full bg-[#e6eaf0]"><span className={`absolute inset-y-0 left-0 rounded-full ${item.bad ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${item.fact}%` }} /><span className="absolute -top-1 h-3.5 w-0.5 bg-[#111827]" style={{ left: `${item.target}%` }} /></div><p className="mt-1 text-[9px] text-[#667085]">Норма: {item.norm}</p></div></div>; })}</div></section>
          </div>

          <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-labelledby="finance-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div id="finance-title"><Heading icon={TrendingUp} title="Финансовый результат" caption="Отклонение договоров от бюджета и ключевые драйверы" tone="red" /></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-[10px] text-[#667085]">Превышение</p><p className="text-lg font-medium text-[#dc2626]">+1,15 млрд ₽ · +4,8%</p></div><div className="flex rounded-lg bg-[#f2f4f7] p-0.5" role="tablist" aria-label="Тип финансовых драйверов">{(['Работы','Материалы'] as const).map((mode) => <button key={mode} type="button" role="tab" aria-selected={driverMode === mode} onClick={() => setDriverMode(mode)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold transition ${driverMode === mode ? 'bg-white text-[#111827] shadow-sm' : 'text-[#667085] hover:text-[#344054]'}`}>{mode}</button>)}</div></div></div><div className="mt-4 grid gap-2 lg:grid-cols-3">{drivers.map((driver) => <button key={driver.name} type="button" className="rounded-xl border border-[#e3e8ef] p-3 text-left transition hover:border-[#f1b7bd] hover:bg-[#fffafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><div className="flex justify-between gap-3 text-xs"><span className="truncate font-semibold">{driver.name}</span><span className={`font-semibold ${driver.delta.startsWith('+') ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{driver.percent}</span></div><div className="mt-3 relative h-2 rounded-full bg-[#edf0f4]"><span className={`absolute inset-y-0 left-0 rounded-full ${driver.delta.startsWith('+') ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${driver.width}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-[#667085]"><span>{driver.budget} → {driver.contract} млн ₽</span><b className="font-semibold text-[#344054]">{driver.delta}</b></div></button>)}</div></section>

          <footer className="flex flex-col gap-1 px-1 text-[10px] text-[#667085] sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-1.5"><Database size={12} />Демонстрационные данные — не промышленный расчёт</span><span className="flex items-center gap-1.5"><CalendarDays size={12} />Период: {period}</span></footer>
        </div>
      </div>
    </main>
  );
};
