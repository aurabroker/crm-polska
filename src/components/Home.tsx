import { useMemo } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company } from '../data/companies';

interface HomeProps { onSelectCompany: (c: Company) => void; }

function fmtDT(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pl-PL',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit',weekday:'short'});
}

export function Home({ onSelectCompany }: HomeProps) {
  const { companies, events, currentUser } = useCRMStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Dzień dobry' : 'Dobry wieczór';

  const now   = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate()-1); yesterday.setHours(0,0,0,0);
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const tomorrowEnd = new Date(now); tomorrowEnd.setDate(now.getDate()+1); tomorrowEnd.setHours(23,59,59,999);

  // Stats
  const lastHistory = useMemo(() =>
    companies.flatMap(c => c.history.map(h => ({ ...h, company: c })))
      .sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5)
  , [companies]);

  const recentCompanies = useMemo(() =>
    [...companies].sort((a,b) => b.id - a.id).slice(0,5)
  , [companies]);

  // Tasks = reminders for yesterday/today/tomorrow
  const taskDays = useMemo(() => {
    const all = companies.flatMap(c => c.reminders.filter(r => !r.done).map(r => ({ ...r, company: c })));
    const yd = all.filter(r => { const d=new Date(r.date); return d>=yesterday && d<todayStart; });
    const td = all.filter(r => { const d=new Date(r.date); return d>=todayStart && d<new Date(todayStart.getTime()+86400000); });
    const tm = all.filter(r => { const d=new Date(r.date); return d>=new Date(todayStart.getTime()+86400000) && d<=tomorrowEnd; });
    return { yesterday: yd, today: td, tomorrow: tm };
  }, [companies]);

  // Upcoming events today
  const todayEvents = events.filter(e => !e.done && e.dateStart.slice(0,10) === now.toISOString().slice(0,10))
    .sort((a,b) => a.dateStart.localeCompare(b.dateStart));

  const totalTasks = taskDays.yesterday.length + taskDays.today.length + taskDays.tomorrow.length;

  return (
    <div className="h-full overflow-y-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900">
          {greeting}, <span className="text-amber-500">{currentUser?.name?.split(' ')[0] ?? 'użytkowniku'}</span>! 👋
        </h1>
        <div className="text-zinc-500 text-sm mt-1">
          {now.toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · {companies.length} firm w CRM
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── ZADANIA NA 3 DNI (biggest) ── */}
        <div className="col-span-5 bg-white border border-zinc-200 flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Zadania (3 dni)</div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">{totalTasks} aktywnych</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {(['yesterday','today','tomorrow'] as const).map(day => {
              const items = taskDays[day];
              const label = day==='yesterday'?'Wczoraj':day==='today'?'Dziś':'Jutro';
              const color = day==='yesterday'?'text-red-500':day==='today'?'text-zinc-900':'text-zinc-400';
              return (
                <div key={day}>
                  <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 ${color}`}>{label}</div>
                  {items.length === 0
                    ? <div className="px-4 py-2 text-xs text-zinc-300">Brak zadań</div>
                    : items.map(r => (
                      <div key={r.id} className="px-4 py-2 flex items-start gap-2 hover:bg-zinc-50 cursor-pointer" onClick={() => onSelectCompany(r.company)}>
                        <span className={`text-base flex-shrink-0 ${day==='yesterday'?'opacity-50':''}`}>
                          {day==='yesterday'?'⚠️':day==='today'?'🔔':'📅'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-zinc-800 leading-tight truncate">{r.text}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{r.company.company} · {fmtDate(r.date)}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-7 grid grid-cols-2 gap-4">

          {/* Kalendarz dziś */}
          <div className="col-span-2 bg-white border border-zinc-200">
            <div className="px-4 py-3 border-b border-zinc-100">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dzisiaj w kalendarzu</div>
            </div>
            {todayEvents.length === 0
              ? <div className="px-4 py-3 text-xs text-zinc-400">Brak zaplanowanych zdarzeń</div>
              : <div className="divide-y divide-zinc-100">
                  {todayEvents.map(e => (
                    <div key={e.id} className="px-4 py-2 flex items-center gap-3">
                      <span className="text-base">{e.type==='spotkanie'?'🤝':e.type==='call'?'📞':'📅'}</span>
                      <div>
                        <div className="text-sm font-medium text-zinc-800">{e.title}</div>
                        <div className="text-xs text-zinc-400">{new Date(e.dateStart).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}{e.location&&` · ${e.location}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Ostatnie kontakty */}
          <div className="bg-white border border-zinc-200">
            <div className="px-4 py-3 border-b border-zinc-100">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ostatnie kontakty</div>
            </div>
            <div className="divide-y divide-zinc-100">
              {lastHistory.length===0
                ? <div className="px-4 py-3 text-xs text-zinc-400">Brak</div>
                : lastHistory.map(h => (
                  <div key={h.id} className="px-4 py-2 cursor-pointer hover:bg-zinc-50" onClick={() => onSelectCompany(h.company)}>
                    <div className="text-xs text-zinc-800 font-medium truncate">{h.company.company}</div>
                    <div className="text-xs text-zinc-400 truncate">{h.note.slice(0,60)}{h.note.length>60?'...':''}</div>
                    <div className="text-[10px] text-zinc-300 mt-0.5">{fmtDT(h.date)}</div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Ostatnio dodane firmy */}
          <div className="bg-white border border-zinc-200">
            <div className="px-4 py-3 border-b border-zinc-100">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ostatnio dodane firmy</div>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentCompanies.length===0
                ? <div className="px-4 py-3 text-xs text-zinc-400">Brak</div>
                : recentCompanies.map(c => (
                  <div key={c.id} className="px-4 py-2 cursor-pointer hover:bg-zinc-50" onClick={()=>onSelectCompany(c)}>
                    <div className="text-xs font-medium text-zinc-800 truncate">{c.company}</div>
                    <div className="text-[10px] text-zinc-400">{c.city||'—'} · {c.industry||'—'}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
