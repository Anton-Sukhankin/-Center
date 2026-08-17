import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  ChevronRight,
  CircleAlert,
  Clock3,
  Crosshair,
  Database,
  FileSearch,
  Layers3,
  PackageSearch,
  Pin,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  UserRoundX,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';

type FocusTone = 'blue' | 'red' | 'green' | 'violet' | 'amber';
type FocusItem = {
  eyebrow: string;
  title: string;
  value: string;
  description: string;
  action: string;
  tone: FocusTone;
};

type RiskRow = {
  id: string;
  subject: string;
  category: 'Работы' | 'Материалы';
  cost: string;
  required: string;
  forecast: string;
  reserve: number;
  status: 'Критично' | 'Внимание' | 'Контроль';
};

const workDrivers = [
  { name: 'Монолитные работы', budget: '4 200', contract: '4 460', delta: '+260 млн ₽', percent: '+6,2%', width: 94 },
  { name: 'Отделочные работы', budget: '1 850', contract: '2 020', delta: '+170 млн ₽', percent: '+9,2%', width: 72 },
  { name: 'Фасадные работы', budget: '1 100', contract: '1 010', delta: '−90 млн ₽', percent: '−8,2%', width: 52 },
];

const materialDrivers = [
  { name: 'Фасадные материалы', budget: '820', contract: '1 040', delta: '+220 млн ₽', percent: '+26,8%', width: 94 },
  { name: 'Лифтовое оборудование', budget: '580', contract: '700', delta: '+120 млн ₽', percent: '+20,7%', width: 72 },
  { name: 'Кабельно-проводниковая продукция', budget: '330', contract: '400', delta: '+70 млн ₽', percent: '+21,2%', width: 52 },
];

const efficiency = [
  { label: 'Средний срок тендера', value: '18 дней', norm: '14 дней', fact: 82, target: 64, icon: Clock3, bad: true },
  { label: 'Участников на лот', value: '4,2', norm: '3,1', fact: 78, target: 58, icon: UsersRound, bad: false },
  { label: 'Лотов на тендер', value: '4,8', norm: '3,0', fact: 80, target: 50, icon: Layers3, bad: false },
  { label: 'Лотов с одним участником', value: '18%', norm: '10%', fact: 72, target: 40, icon: UserRoundX, bad: true },
];

const risks: RiskRow[] = [
  { id: 'T-15234', subject: 'Минеральная вата', category: 'Материалы', cost: '14,2 млн ₽', required: '18.08.2024', forecast: '25.08.2024', reserve: -7, status: 'Критично' },
  { id: 'T-15411', subject: 'Лифтовое оборудование', category: 'Материалы', cost: '48,7 млн ₽', required: '12.09.2024', forecast: '10.09.2024', reserve: 2, status: 'Внимание' },
  { id: 'T-15562', subject: 'Бетон и смеси', category: 'Материалы', cost: '32,1 млн ₽', required: '05.09.2024', forecast: '28.08.2024', reserve: 8, status: 'Контроль' },
  { id: 'T-15603', subject: 'Фасадные панели', category: 'Работы', cost: '26,5 млн ₽', required: '20.08.2024', forecast: '22.08.2024', reserve: -2, status: 'Внимание' },
  { id: 'T-15677', subject: 'Электрощитовое оборудование', category: 'Материалы', cost: '19,8 млн ₽', required: '03.09.2024', forecast: '05.09.2024', reserve: -2, status: 'Внимание' },
  { id: 'T-15702', subject: 'Окна ПВХ', category: 'Работы', cost: '12,4 млн ₽', required: '15.08.2024', forecast: '19.08.2024', reserve: -4, status: 'Критично' },
  { id: 'T-15745', subject: 'Инженерные трубы', category: 'Материалы', cost: '9,5 млн ₽', required: '25.09.2024', forecast: '26.09.2024', reserve: 1, status: 'Контроль' },
];

const focusInitial: FocusItem = {
  eyebrow: 'Общий контекст',
  title: 'Портфель закупок',
  value: '7 тендеров под риском',
  description: 'Выберите сегмент диаграммы, финансовый драйвер, показатель эффективности или строку риска — фокус обновится без потери контекста экрана.',
  action: 'Перейти к рискам',
  tone: 'blue',
};

const toneStyles: Record<FocusTone, { icon: string; badge: string; border: string }> = {
  blue: { icon: 'bg-[#eaf2ff] text-[#0b6bff]', badge: 'bg-[#eaf2ff] text-[#075bd8]', border: 'border-l-[#0b6bff]' },
  red: { icon: 'bg-[#fff0f1] text-[#dc2626]', badge: 'bg-[#fff0f1] text-[#b91c1c]', border: 'border-l-[#dc2626]' },
  green: { icon: 'bg-[#ecf9f1] text-[#17834b]', badge: 'bg-[#ecf9f1] text-[#12683c]', border: 'border-l-[#17834b]' },
  violet: { icon: 'bg-[#f1eaff] text-[#7c3aed]', badge: 'bg-[#f1eaff] text-[#6d28d9]', border: 'border-l-[#7c3aed]' },
  amber: { icon: 'bg-amber-50 text-amber-700', badge: 'bg-amber-50 text-amber-800', border: 'border-l-amber-500' },
};

const statusStyles = {
  'Критично': 'bg-[#fff0f1] text-[#b91c1c]',
  'Внимание': 'bg-amber-50 text-amber-800',
  'Контроль': 'bg-[#ecf9f1] text-[#12683c]',
};

function SectionTitle({ icon: Icon, title, caption, tone = 'blue' }: { icon: typeof WalletCards; title: string; caption: string; tone?: FocusTone }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneStyles[tone].icon}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-5 text-[#111827]">{title}</h2>
          <p className="mt-0.5 text-xs leading-4 text-[#667085]">{caption}</p>
        </div>
      </div>
    </div>
  );
}

export const GeneratedComponent = () => {
  const [period, setPeriod] = useState('Текущий квартал');
  const [category, setCategory] = useState('Все закупки');
  const [status, setStatus] = useState('Все статусы');
  const [driverMode, setDriverMode] = useState<'Работы' | 'Материалы'>('Работы');
  const [focus, setFocus] = useState<FocusItem>(focusInitial);
  const [focusPinned, setFocusPinned] = useState(true);

  const filteredRisks = useMemo(() => risks.filter((row) => {
    const categoryMatch = category === 'Все закупки' || row.category === category;
    const statusMatch = status === 'Все статусы' || row.status === status;
    return categoryMatch && statusMatch;
  }), [category, status]);

  const drivers = driverMode === 'Работы' ? workDrivers : materialDrivers;

  const resetFilters = () => {
    setPeriod('Текущий квартал');
    setCategory('Все закупки');
    setStatus('Все статусы');
    setDriverMode('Работы');
    setFocus(focusInitial);
  };

  const selectBudget = (name: string, value: string, description: string, tone: FocusTone) => {
    setFocus({ eyebrow: 'Бюджет и контрактация', title: name, value, description, action: 'Открыть состав бюджета', tone });
  };

  const selectDriver = (driver: typeof workDrivers[number]) => {
    setFocus({
      eyebrow: `Финансовый результат · ${driverMode.toLowerCase()}`,
      title: driver.name,
      value: driver.delta,
      description: `Бюджет ${driver.budget} млн ₽, договоры ${driver.contract} млн ₽. Отклонение ${driver.percent}; показатель выбран как финансовый драйвер.`,
      action: 'Открыть договоры',
      tone: driver.delta.startsWith('+') ? 'red' : 'green',
    });
  };

  const selectEfficiency = (item: typeof efficiency[number]) => {
    setFocus({
      eyebrow: 'Эффективность и конкуренция',
      title: item.label,
      value: item.value,
      description: `Нормативное значение — ${item.norm}. ${item.bad ? 'Требует управленческого внимания и проверки причин отклонения.' : 'Показатель выше ориентира и поддерживает конкурентность процедуры.'}`,
      action: 'Посмотреть динамику',
      tone: item.bad ? 'red' : 'green',
    });
  };

  const selectRisk = (row: RiskRow) => {
    setFocus({
      eyebrow: `Риск · ${row.id}`,
      title: row.subject,
      value: `${row.reserve > 0 ? '+' : ''}${row.reserve} дней`,
      description: `${row.category}, ${row.cost}. Требуемая дата ${row.required}, прогноз ${row.forecast}. Статус: ${row.status.toLowerCase()}.`,
      action: 'Открыть карточку тендера',
      tone: row.status === 'Критично' ? 'red' : row.status === 'Внимание' ? 'amber' : 'green',
    });
  };

  return (
    <main className="procurement-canvas min-h-screen w-full bg-[#f7f9fc] text-[#111827]">
      <div className="mx-auto w-full max-w-[1440px]">
        <nav className="overflow-x-auto border-b border-[#e3e8ef] bg-white px-5" aria-label="Разделы метрик">
          <div className="flex min-w-max items-end gap-1">
            {['Общие', 'Закупки', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение'].map((tab) => (
              <button
                key={tab}
                type="button"
                aria-current={tab === 'Закупки' ? 'page' : undefined}
                className={`relative h-12 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] focus-visible:ring-inset ${tab === 'Закупки' ? 'font-semibold text-[#111827]' : 'text-[#667085] hover:text-[#111827]'}`}
              >
                {tab}
                {tab === 'Закупки' && <span className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-[#0b6bff]" />}
              </button>
            ))}
          </div>
        </nav>

        <div className="px-5 py-4">
          <header className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#e3e8ef] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf2ff] text-[#0b6bff]">
                <BarChart3 size={21} aria-hidden="true" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-[-0.01em]">Метрики закупок</h1>
                  <span className="rounded-full bg-[#f1eaff] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6d28d9]">Демо</span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]"><Database size={12} aria-hidden="true" />Данные обновлены 08.06.2025 в 09:15</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2" aria-label="Контекстные фильтры">
              <SlidersHorizontal size={16} className="mr-1 text-[#667085]" aria-hidden="true" />
              <label className="sr-only" htmlFor="period">Период</label>
              <select id="period" value={period} onChange={(event) => { setPeriod(event.target.value); setFocus({ ...focusInitial, eyebrow: `Период · ${event.target.value}` }); }} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]">
                <option>Текущий квартал</option><option>Текущий месяц</option><option>Год</option>
              </select>
              <label className="sr-only" htmlFor="category">Тип закупки</label>
              <select id="category" value={category} onChange={(event) => { setCategory(event.target.value); setFocus({ ...focusInitial, eyebrow: `Тип закупки · ${event.target.value}` }); }} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]">
                <option>Все закупки</option><option>Работы</option><option>Материалы</option>
              </select>
              <label className="sr-only" htmlFor="status">Статус процедуры</label>
              <select id="status" value={status} onChange={(event) => { setStatus(event.target.value); setFocus({ ...focusInitial, eyebrow: `Статус · ${event.target.value}` }); }} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]">
                <option>Все статусы</option><option>Критично</option><option>Внимание</option><option>Контроль</option>
              </select>
              <button type="button" onClick={resetFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium text-[#344054] transition hover:border-[#aeb8c7] hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">
                <RotateCcw size={14} aria-hidden="true" />Сбросить
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-[minmax(0,2.05fr)_minmax(300px,0.95fr)]">
            <div className="grid min-w-0 gap-4">
              <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-labelledby="budget-title">
                <div id="budget-title"><SectionTitle icon={WalletCards} title="Бюджет и контрактация" caption="Масштаб портфеля и покрытие обязательствами" /></div>
                <div className="mt-4 grid gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
                  <div>
                    <p className="text-xs text-[#667085]">Общий бюджет закупок</p>
                    <p className="mt-1 text-[30px] font-normal leading-none tracking-[-0.03em]">24,0 млрд ₽</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <button type="button" onClick={() => selectBudget('Бюджет работ', '14,1 млрд ₽', '59% общего бюджета закупок приходится на работы.', 'blue')} className="rounded-xl border border-[#e3e8ef] p-2.5 text-left transition hover:border-[#b8cdf4] hover:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">
                        <span className="block text-[#667085]">Работы</span><strong className="mt-0.5 block font-semibold">14,1 млрд ₽</strong>
                      </button>
                      <button type="button" onClick={() => selectBudget('Бюджет материалов', '9,9 млрд ₽', '41% общего бюджета закупок приходится на материалы.', 'violet')} className="rounded-xl border border-[#e3e8ef] p-2.5 text-left transition hover:border-[#d2bff8] hover:bg-[#fbf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">
                        <span className="block text-[#667085]">Материалы</span><strong className="mt-0.5 block font-semibold">9,9 млрд ₽</strong>
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-end justify-between gap-3">
                      <div><p className="text-xs text-[#667085]">Структура покрытия бюджета</p><p className="mt-1 text-sm font-semibold">17,3 млрд ₽ законтрактовано · 72%</p></div>
                      <span className="text-xs font-medium text-[#667085]">24,0 млрд ₽</span>
                    </div>
                    <div className="mt-3 flex h-8 overflow-hidden rounded-lg bg-[#eef1f5]" role="group" aria-label="Структура бюджета">
                      <button type="button" style={{ width: '72%' }} onClick={() => selectBudget('Законтрактовано', '17,3 млрд ₽ · 72%', 'Основная часть бюджета уже обеспечена договорами.', 'blue')} className="h-full bg-[#0b6bff] text-[10px] font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white" aria-label="Законтрактовано 72 процента">72%</button>
                      <button type="button" style={{ width: '16%' }} onClick={() => selectBudget('Открытые тендеры', '3,9 млрд ₽ · 16%', 'Средства находятся в активных закупочных процедурах.', 'violet')} className="h-full bg-[#7c3aed] text-[10px] font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white" aria-label="Открытые тендеры 16 процентов">16%</button>
                      <button type="button" style={{ width: '12%' }} onClick={() => selectBudget('Остаток бюджета', '2,8 млрд ₽ · 12%', 'Бюджет пока не распределён в договоры или открытые тендеры.', 'amber')} className="h-full bg-[#dfe4eb] text-[10px] font-semibold text-[#475467] transition hover:bg-[#cfd6df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#667085]" aria-label="Остаток 12 процентов">12%</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667085]"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#0b6bff]" />Договоры</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#7c3aed]" />Открытые тендеры</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#dfe4eb]" />Остаток</span></div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {[['Работы', '10,2 / 14,1 млрд ₽', 72], ['Материалы', '7,1 / 9,9 млрд ₽', 72]].map(([label, value, percent]) => (
                        <button key={String(label)} type="button" onClick={() => selectBudget(`Законтрактовано: ${label}`, String(value), 'Покрытие бюджета договорами составляет 72%.', label === 'Работы' ? 'blue' : 'violet')} className="rounded-xl bg-[#f8fafc] p-2.5 text-left transition hover:bg-[#f1f5f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">
                          <span className="flex justify-between text-[11px]"><b className="font-medium text-[#344054]">{label}</b><span className="font-semibold">{percent}%</span></span>
                          <span className="mt-2 block h-1.5 rounded-full bg-[#e6eaf0]"><span className={`block h-full rounded-full ${label === 'Работы' ? 'bg-[#0b6bff]' : 'bg-[#7c3aed]'}`} style={{ width: `${percent}%` }} /></span>
                          <span className="mt-1.5 block text-[10px] text-[#667085]">{value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <section className="min-w-0 rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-labelledby="finance-title">
                  <div id="finance-title"><SectionTitle icon={TrendingUp} title="Финансовый результат" caption="Отклонение договоров от бюджета" tone="red" /></div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fff8f8] px-3 py-2.5">
                    <div><p className="text-[11px] text-[#667085]">Превышение бюджета</p><p className="mt-0.5 text-xl font-normal text-[#dc2626]">+1,15 млрд ₽</p></div>
                    <span className="rounded-full bg-[#fff0f1] px-2.5 py-1 text-xs font-semibold text-[#b91c1c]">↑ +4,8%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#667085]">TOP-3 драйверов</p>
                    <div className="flex rounded-lg bg-[#f2f4f7] p-0.5" role="tablist" aria-label="Тип финансовых драйверов">
                      {(['Работы', 'Материалы'] as const).map((mode) => <button key={mode} type="button" role="tab" aria-selected={driverMode === mode} onClick={() => setDriverMode(mode)} className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${driverMode === mode ? 'bg-white text-[#111827] shadow-sm' : 'text-[#667085] hover:text-[#344054]'}`}>{mode}</button>)}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {drivers.map((driver) => (
                      <button key={driver.name} type="button" onClick={() => selectDriver(driver)} className="group w-full rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-[#e3e8ef] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">
                        <span className="flex items-center justify-between gap-3 text-[11px]"><span className="truncate font-medium">{driver.name}</span><span className={`shrink-0 font-semibold ${driver.delta.startsWith('+') ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{driver.percent}</span></span>
                        <span className="mt-1 flex items-center gap-2"><span className="relative block h-1.5 flex-1 rounded-full bg-[#edf0f4]"><span className={`absolute inset-y-0 left-0 rounded-full ${driver.delta.startsWith('+') ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${driver.width}%` }} /></span><span className="w-[72px] text-right text-[10px] text-[#667085]">{driver.delta}</span></span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="min-w-0 rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-labelledby="efficiency-title">
                  <div id="efficiency-title"><SectionTitle icon={BriefcaseBusiness} title="Эффективность и конкуренция" caption="Факт относительно проектной нормы" tone="green" /></div>
                  <div className="mt-3 space-y-1">
                    {efficiency.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.label} type="button" onClick={() => selectEfficiency(item)} className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent p-2 text-left transition hover:border-[#e3e8ef] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]">
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${item.bad ? 'bg-[#fff0f1] text-[#dc2626]' : 'bg-[#ecf9f1] text-[#17834b]'}`}><Icon size={14} aria-hidden="true" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2 text-[11px]"><b className="truncate font-medium">{item.label}</b><span className={item.bad ? 'font-semibold text-[#dc2626]' : 'font-semibold text-[#17834b]'}>{item.value}</span></span>
                            <span className="relative mt-1.5 block h-1.5 rounded-full bg-[#edf0f4]">
                              <span className={`absolute inset-y-0 left-0 rounded-full ${item.bad ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${item.fact}%` }} />
                              <span className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-[#111827]" style={{ left: `${item.target}%` }} aria-label={`Норма ${item.norm}`} />
                            </span>
                            <span className="mt-1 block text-[9px] text-[#667085]">Норма: {item.norm}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            <aside className="min-w-0 min-[1000px]:sticky min-[1000px]:top-4 min-[1000px]:self-start" aria-labelledby="focus-title">
              <div className={`overflow-hidden rounded-2xl border border-[#e3e8ef] border-l-4 bg-white ${toneStyles[focus.tone].border}`}>
                <div className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-8 w-8 place-items-center rounded-xl ${toneStyles[focus.tone].icon}`}><Crosshair size={16} aria-hidden="true" /></span>
                    <div><h2 id="focus-title" className="text-[15px] font-semibold">Фокус руководителя</h2><p className="text-[10px] text-[#667085]">Контекст меняется по клику</p></div>
                  </div>
                  <button type="button" aria-label={focusPinned ? 'Открепить фокус' : 'Закрепить фокус'} onClick={() => setFocusPinned(!focusPinned)} className={`grid h-8 w-8 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] ${focusPinned ? 'bg-[#eaf2ff] text-[#0b6bff]' : 'bg-[#f2f4f7] text-[#667085] hover:text-[#111827]'}`}><Pin size={15} className={focusPinned ? 'fill-current' : ''} /></button>
                </div>
                <div className="p-5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${toneStyles[focus.tone].badge}`}>{focus.eyebrow}</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em]">{focus.title}</h3>
                  <p className="mt-2 text-[28px] font-normal leading-none tracking-[-0.03em]">{focus.value}</p>
                  <p className="mt-4 text-sm leading-5 text-[#667085]">{focus.description}</p>
                  <div className="mt-5 rounded-xl bg-[#f8fafc] p-3">
                    <div className="flex items-start gap-2"><FileSearch size={15} className="mt-0.5 shrink-0 text-[#667085]" /><p className="text-xs leading-4 text-[#475467]">Фокус не скрывает исходный блок: руководитель сохраняет одновременно контекст, причину и действие.</p></div>
                  </div>
                  <button type="button" className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243044] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] focus-visible:ring-offset-2">
                    {focus.action}<ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                  {focus !== focusInitial && <button type="button" onClick={() => setFocus(focusInitial)} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-[#667085] transition hover:bg-[#f2f4f7] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><X size={13} />Очистить фокус</button>}
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white" aria-labelledby="risk-title">
            <div className="flex flex-col gap-3 border-b border-[#e3e8ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div id="risk-title"><SectionTitle icon={ShieldAlert} title="Риски и действия" caption="7 тендеров под риском · 1,23 млрд ₽" tone="red" /></div>
              <div className="flex items-center gap-2 text-[11px] text-[#667085]"><CircleAlert size={14} className="text-[#dc2626]" /><span>Нажмите на строку, чтобы передать риск в фокус</span></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left text-xs">
                <thead className="bg-[#f8fafc] text-[10px] font-semibold uppercase tracking-wide text-[#667085]">
                  <tr><th className="px-5 py-2.5">Тендер</th><th className="px-3 py-2.5">Предмет / тип</th><th className="px-3 py-2.5">Стоимость</th><th className="px-3 py-2.5">Требуется</th><th className="px-3 py-2.5">Прогноз</th><th className="px-3 py-2.5">Запас дней</th><th className="px-3 py-2.5">Статус</th><th className="px-5 py-2.5 text-right">Действие</th></tr>
                </thead>
                <tbody>
                  {filteredRisks.map((row) => (
                    <tr key={row.id} onClick={() => selectRisk(row)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectRisk(row); } }} tabIndex={0} className="cursor-pointer border-t border-[#edf0f4] transition hover:bg-[#f7faff] focus-visible:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff]">
                      <td className="px-5 py-2.5 font-semibold text-[#0b6bff]">{row.id}</td>
                      <td className="px-3 py-2.5"><span className="block font-medium text-[#111827]">{row.subject}</span><span className="mt-0.5 block text-[10px] text-[#667085]">{row.category}</span></td>
                      <td className="px-3 py-2.5 font-medium">{row.cost}</td><td className="px-3 py-2.5 text-[#475467]">{row.required}</td><td className="px-3 py-2.5 text-[#475467]">{row.forecast}</td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className={`w-8 font-semibold ${row.reserve < 0 ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{row.reserve > 0 ? '+' : ''}{row.reserve}</span><span className="h-1.5 w-12 overflow-hidden rounded-full bg-[#edf0f4]"><span className={`block h-full rounded-full ${row.reserve < 0 ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${Math.min(100, Math.abs(row.reserve) * 11)}%` }} /></span></div></td>
                      <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[row.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{row.status}</span></td>
                      <td className="px-5 py-2.5 text-right"><span className="inline-flex items-center gap-1 font-semibold text-[#0b6bff]">В фокус<ChevronRight size={14} /></span></td>
                    </tr>
                  ))}
                  {filteredRisks.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-[#667085]"><PackageSearch size={22} className="mx-auto mb-2" />По выбранным фильтрам рисков нет.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#e3e8ef] px-5 py-2.5 text-[10px] text-[#667085]"><span>Показано {filteredRisks.length} из 7 процедур</span><span>Демонстрационные данные · не промышленный расчёт</span></div>
          </section>
        </div>
      </div>
    </main>
  );
};
