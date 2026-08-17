import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Layers3,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  UserRoundX,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';

type Driver = { name: string; budget: number; contract: number; delta: string; percent: string };
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
  { label: 'Средний срок тендера', value: '18 дней', norm: '14 дней', fact: 82, target: 64, Icon: Clock3, positive: false },
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

function SectionTitle({ icon: Icon, title, note, tone = 'blue' }: { icon: typeof WalletCards; title: string; note: string; tone?: 'blue' | 'red' | 'green' }) {
  const color = tone === 'red' ? 'bg-[#fff0f1] text-[#dc2626]' : tone === 'green' ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#eaf2ff] text-[#0b6bff]';
  return (
    <div className="flex items-start gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={18} aria-hidden="true" /></span>
      <div><h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2><p className="mt-0.5 text-xs text-[#667085]">{note}</p></div>
    </div>
  );
}

function BudgetLine({ label, value, percent, violet = false }: { label: string; value: string; percent: number; violet?: boolean }) {
  return (
    <div className="rounded-xl bg-[#f8fafc] p-3">
      <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium">{label}</span><span className="font-semibold">{percent}%</span></div>
      <div className="mt-2 h-1.5 rounded-full bg-[#e7ebf0]"><div className={`h-full rounded-full ${violet ? 'bg-[#7c3aed]' : 'bg-[#0b6bff]'}`} style={{ width: `${percent}%` }} /></div>
      <p className="mt-1.5 text-[10px] text-[#667085]">{value}</p>
    </div>
  );
}

export const GeneratedComponent = () => {
  const [period, setPeriod] = useState('Текущий квартал');
  const [type, setType] = useState('Все закупки');
  const [status, setStatus] = useState('Все статусы');
  const [driverType, setDriverType] = useState<'Работы' | 'Материалы'>('Работы');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const drivers = driverType === 'Работы' ? workDrivers : materialDrivers;
  const filteredRisks = useMemo(() => risks.filter((risk) =>
    (type === 'Все закупки' || risk.type === type) && (status === 'Все статусы' || risk.status === status)
  ), [type, status]);

  const reset = () => {
    setPeriod('Текущий квартал'); setType('Все закупки'); setStatus('Все статусы'); setDriverType('Работы'); setSelectedRisk(null);
  };

  return (
    <main className="min-h-screen w-full bg-[#f7f9fc] font-[Inter,Arial,sans-serif] text-[#111827]">
      <div className="mx-auto w-full max-w-[1440px]">
        <nav className="overflow-x-auto border-b border-[#e3e8ef] bg-white px-5" aria-label="Вкладки раздела Метрики">
          <div className="flex min-w-max">
            {['Общие', 'Закупки', 'Проектирование', 'Тендеры и контрактация', 'Продажи', 'СМР', 'Приёмка и заселение'].map((tab) => (
              <button key={tab} type="button" aria-current={tab === 'Закупки' ? 'page' : undefined} className={`relative h-12 px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff] ${tab === 'Закупки' ? 'font-semibold text-[#111827]' : 'font-medium text-[#667085] hover:text-[#111827]'}`}>
                {tab}{tab === 'Закупки' && <span className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-[#0b6bff]" />}
              </button>
            ))}
          </div>
        </nav>

        <div className="space-y-4 p-5">
          <header className="flex flex-col gap-3 rounded-2xl border border-[#e3e8ef] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#0b6bff]"><BarChart3 size={21} /></span>
              <div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">Метрики закупок</h1><span className="rounded-full bg-[#f1eaff] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6d28d9]">Демо</span></div><p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]"><Database size={12} />Обновлено 08.06.2025 в 09:15</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2" aria-label="Контекстные фильтры">
              <CalendarRange size={16} className="text-[#667085]" />
              {[
                { label: 'Период', value: period, set: setPeriod, options: ['Текущий квартал', 'Текущий месяц', 'Год'] },
                { label: 'Тип закупки', value: type, set: setType, options: ['Все закупки', 'Работы', 'Материалы'] },
                { label: 'Статус процедуры', value: status, set: setStatus, options: ['Все статусы', 'Критично', 'Внимание', 'Контроль'] },
              ].map((filter) => <label key={filter.label} className="text-[0px]"><span className="sr-only">{filter.label}</span><select value={filter.value} onChange={(e) => filter.set(e.target.value)} className="h-9 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-medium outline-none transition focus:border-[#0b6bff] focus:ring-2 focus:ring-[#eaf2ff]">{filter.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}
              <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7dee8] px-3 text-xs font-medium text-[#344054] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><RotateCcw size={14} />Сбросить</button>
            </div>
          </header>

          <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5" aria-label="Бюджет и контрактация">
            <SectionTitle icon={WalletCards} title="Бюджет и контрактация" note="Масштаб портфеля и покрытие обязательствами" />
            <div className="mt-4 grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
              <div><p className="text-xs text-[#667085]">Общий бюджет закупок</p><p className="mt-1 text-[32px] font-normal leading-none tracking-[-0.03em]">24,0 млрд ₽</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[#e3e8ef] p-3"><p className="text-[10px] text-[#667085]">Работы</p><p className="mt-1 text-sm font-semibold">14,1 млрд ₽</p></div><div className="rounded-xl border border-[#e3e8ef] p-3"><p className="text-[10px] text-[#667085]">Материалы</p><p className="mt-1 text-sm font-semibold">9,9 млрд ₽</p></div></div></div>
              <div className="min-w-0">
                <div className="flex items-end justify-between"><div><p className="text-xs text-[#667085]">Структура покрытия</p><p className="mt-1 text-sm font-semibold">17,3 млрд ₽ законтрактовано · 72%</p></div><span className="text-xs text-[#667085]">24,0 млрд ₽</span></div>
                <div className="mt-3 flex h-8 overflow-hidden rounded-lg bg-[#e7ebf0]" aria-label="Законтрактовано 72%, открытые тендеры 16%, остаток 12%"><div className="grid place-items-center bg-[#0b6bff] text-[10px] font-semibold text-white" style={{ width: '72%' }}>72%</div><div className="grid place-items-center bg-[#7c3aed] text-[10px] font-semibold text-white" style={{ width: '16%' }}>16%</div><div className="grid place-items-center text-[10px] font-semibold text-[#475467]" style={{ width: '12%' }}>12%</div></div>
                <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-[#667085]"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#0b6bff]" />Договоры</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#7c3aed]" />Открытые тендеры · 3,9 млрд ₽</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#dfe4eb]" />Остаток</span></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2"><BudgetLine label="Законтрактовано работ" value="10,2 / 14,1 млрд ₽" percent={72} /><BudgetLine label="Законтрактовано материалов" value="7,1 / 9,9 млрд ₽" percent={72} violet /></div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 min-[1000px]:grid-cols-12">
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 min-[1000px]:col-span-7" aria-label="Финансовый результат">
              <div className="flex flex-wrap items-start justify-between gap-3"><SectionTitle icon={TrendingUp} title="Финансовый результат" note="Отклонение стоимости договоров от бюджета" tone="red" /><div className="text-right"><p className="text-[11px] text-[#667085]">Превышение</p><p className="mt-0.5 text-2xl font-normal text-[#dc2626]">+1,15 млрд ₽ <span className="text-sm font-semibold">↑ +4,8%</span></p></div></div>
              <div className="mt-4 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-wide text-[#667085]">TOP-3 драйверов</p><div className="flex rounded-lg bg-[#f2f4f7] p-0.5" role="tablist">{(['Работы', 'Материалы'] as const).map((mode) => <button key={mode} type="button" role="tab" aria-selected={driverType === mode} onClick={() => setDriverType(mode)} className={`rounded-md px-3 py-1 text-[10px] font-semibold transition ${driverType === mode ? 'bg-white text-[#111827] shadow-sm' : 'text-[#667085] hover:text-[#111827]'}`}>{mode}</button>)}</div></div>
              <div className="mt-2 space-y-1.5">{drivers.map((driver) => {
                const positive = driver.contract > driver.budget;
                const max = Math.max(driver.budget, driver.contract) * 1.08;
                return <button key={driver.name} type="button" className="w-full rounded-xl border border-transparent p-2.5 text-left transition hover:border-[#e3e8ef] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><span className="flex items-center justify-between gap-3 text-xs"><b className="truncate font-medium">{driver.name}</b><span className={`font-semibold ${positive ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{driver.delta} · {driver.percent}</span></span><span className="mt-2 grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2 text-[9px] text-[#667085]"><span>Бюджет</span><span className="h-1.5 rounded-full bg-[#e8ecf1]"><i className="block h-full rounded-full bg-[#9aa5b5]" style={{ width: `${driver.budget / max * 100}%` }} /></span></span><span className="mt-1 grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2 text-[9px] text-[#667085]"><span>Договор</span><span className="h-1.5 rounded-full bg-[#e8ecf1]"><i className={`block h-full rounded-full ${positive ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${driver.contract / max * 100}%` }} /></span></span></button>;
              })}</div>
            </section>

            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 min-[1000px]:col-span-5" aria-label="Эффективность и конкуренция">
              <SectionTitle icon={BriefcaseBusiness} title="Эффективность и конкуренция" note="Факт относительно проектной нормы" tone="green" />
              <div className="mt-3 space-y-1">{efficiency.map(({ label, value, norm, fact, target, Icon, positive }) => <button key={label} type="button" className="flex w-full items-center gap-2.5 rounded-xl border border-transparent p-2 text-left transition hover:border-[#e3e8ef] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><span className={`grid h-7 w-7 place-items-center rounded-lg ${positive ? 'bg-[#ecf9f1] text-[#17834b]' : 'bg-[#fff0f1] text-[#dc2626]'}`}><Icon size={14} /></span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2 text-[11px]"><b className="truncate font-medium">{label}</b><strong className={positive ? 'text-[#17834b]' : 'text-[#dc2626]'}>{value}</strong></span><span className="relative mt-1.5 block h-1.5 rounded-full bg-[#edf0f4]"><i className={`block h-full rounded-full ${positive ? 'bg-[#17834b]' : 'bg-[#dc2626]'}`} style={{ width: `${fact}%` }} /><i className="absolute -top-1 h-3.5 w-0.5 bg-[#111827]" style={{ left: `${target}%` }} /></span><span className="mt-1 block text-[9px] text-[#667085]">Норма: {norm}</span></span></button>)}</div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white" aria-label="Риски и действия">
            <div className="flex flex-col gap-3 border-b border-[#e3e8ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><SectionTitle icon={ShieldAlert} title="Риски и действия" note="7 тендеров под риском · 1,23 млрд ₽" tone="red" /><span className="inline-flex items-center gap-1.5 text-[11px] text-[#667085]"><AlertTriangle size={14} className="text-[#dc2626]" />Выберите строку для подробностей</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-xs"><thead className="bg-[#f8fafc] text-[10px] font-semibold uppercase tracking-wide text-[#667085]"><tr><th className="px-5 py-2.5">Тендер</th><th className="px-3 py-2.5">Предмет / тип</th><th className="px-3 py-2.5">Стоимость</th><th className="px-3 py-2.5">Требуется</th><th className="px-3 py-2.5">Прогноз</th><th className="px-3 py-2.5">Запас дней</th><th className="px-3 py-2.5">Статус</th><th className="px-5 py-2.5 text-right">Действие</th></tr></thead><tbody>{filteredRisks.map((risk) => <tr key={risk.id} tabIndex={0} onClick={() => setSelectedRisk(risk)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRisk(risk); }} className="cursor-pointer border-t border-[#edf0f4] transition hover:bg-[#f7faff] focus-visible:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6bff]"><td className="px-5 py-2.5 font-semibold text-[#0b6bff]">{risk.id}</td><td className="px-3 py-2.5"><b className="font-medium">{risk.subject}</b><span className="mt-0.5 block text-[10px] text-[#667085]">{risk.type}</span></td><td className="px-3 py-2.5 font-medium">{risk.cost}</td><td className="px-3 py-2.5 text-[#475467]">{risk.required}</td><td className="px-3 py-2.5 text-[#475467]">{risk.forecast}</td><td className="px-3 py-2.5"><span className={`font-semibold ${risk.reserve < 0 ? 'text-[#dc2626]' : 'text-[#17834b]'}`}>{risk.reserve > 0 ? '+' : ''}{risk.reserve}</span><span className="ml-2 inline-block h-1.5 w-10 overflow-hidden rounded-full bg-[#edf0f4]"><i className={`block h-full rounded-full ${risk.reserve < 0 ? 'bg-[#dc2626]' : 'bg-[#17834b]'}`} style={{ width: `${Math.min(100, Math.abs(risk.reserve) * 12)}%` }} /></span></td><td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass[risk.status]}`}>{risk.status === 'Контроль' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}{risk.status}</span></td><td className="px-5 py-2.5 text-right"><span className="inline-flex items-center gap-1 font-semibold text-[#0b6bff]">Подробнее<ChevronRight size={14} /></span></td></tr>)}</tbody></table></div>
            <div className="flex items-center justify-between border-t border-[#e3e8ef] px-5 py-2.5 text-[10px] text-[#667085]"><span>Показано {filteredRisks.length} из 7 процедур</span><span>Демонстрационные данные · не промышленный расчёт</span></div>
          </section>
        </div>
      </div>

      {selectedRisk && <div className="fixed inset-0 z-40 flex justify-end bg-[#111827]/25" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedRisk(null); }}><aside role="dialog" aria-modal="true" aria-label={`Подробности тендера ${selectedRisk.id}`} className="h-full w-full max-w-md overflow-y-auto border-l border-[#e3e8ef] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[selectedRisk.status]}`}>{selectedRisk.status}</span><button type="button" aria-label="Закрыть подробности" onClick={() => setSelectedRisk(null)} className="grid h-9 w-9 place-items-center rounded-lg text-[#667085] transition hover:bg-[#f2f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff]"><X size={18} /></button></div><p className="mt-8 text-xs font-semibold text-[#0b6bff]">{selectedRisk.id}</p><h2 className="mt-2 text-2xl font-semibold">{selectedRisk.subject}</h2><p className="mt-2 text-sm text-[#667085]">{selectedRisk.type} · ответственный {selectedRisk.owner}</p><dl className="mt-8 grid grid-cols-2 gap-3">{[['Стоимость', selectedRisk.cost], ['Запас', `${selectedRisk.reserve > 0 ? '+' : ''}${selectedRisk.reserve} дней`], ['Требуемая дата', selectedRisk.required], ['Прогноз', selectedRisk.forecast]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f8fafc] p-3"><dt className="text-[10px] text-[#667085]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl><div className="mt-6 rounded-xl border border-[#f7c7ca] bg-[#fff8f8] p-4"><p className="text-xs font-semibold text-[#b91c1c]">Следующее действие</p><p className="mt-2 text-sm leading-5 text-[#475467]">Проверить срок поставки с ответственным и зафиксировать план восстановления даты.</p></div><button type="button" className="mt-6 inline-flex w-full items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243044] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6bff] focus-visible:ring-offset-2">Открыть карточку тендера<ArrowUpRight size={16} /></button></aside></div>}
    </main>
  );
};
