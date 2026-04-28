import { useState, useEffect, useMemo } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company } from '../data/companies';

interface HomeProps { onSelectCompany: (c: Company) => void; }

const ZONES = [
  { label: 'Warszawa',   tz: 'Europe/Warsaw' },
  { label: 'Londyn',     tz: 'Europe/London' },
  { label: 'Nowy Jork',  tz: 'America/New_York' },
  { label: 'Singapur',   tz: 'Asia/Singapore' },
];

function WorldClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setNow(new Date()), 1000); return ()=>clearInterval(t); }, []);
  return (
    <div className="flex items-center gap-4">
      {ZONES.map(z => {
        const time = now.toLocaleTimeString('pl-PL', { timeZone: z.tz, hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
        const [h,m,s] = time.split(':');
        return (
          <div key={z.tz} className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs uppercase tracking-widest hidden xl:block">{z.label}</span>
            <div className="flex items-center font-mono">
              {[h,m,s].map((seg,i) => (
                <span key={i} className="flex items-center">
                  <span className="inline-flex">
                    {seg.split('').map((ch,j) => (
                      <span key={j} className="inline-block bg-zinc-800 text-amber-400 text-xs font-bold px-1 py-0.5 mx-px leading-tight min-w-[14px] text-center">{ch}</span>
                    ))}
                  </span>
                  {i<2 && <span className="text-zinc-500 text-xs mx-0.5 font-bold">:</span>}
                </span>
              ))}
            </div>
            <span className="text-zinc-500 text-xs uppercase tracking-widest xl:hidden">{z.label.slice(0,3)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Daily call tracker — stored in localStorage
function useCallTracker() {
  const DAILY_TARGET = 10;
  const KEY = 'crm-call-tracker';

  const [data, setData] = useState<{ date: string; count: number; debt: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; }
  });

  const today = new Date().toISOString().slice(0,10);
  const todayEntry = data.find(d=>d.date===today);
  const todayCount = todayEntry?.count ?? 0;

  // Calculate accumulated debt
  const totalDebt = useMemo(() => {
    const days = data.filter(d=>d.date<today);
    return days.reduce((acc,d) => acc + Math.max(0, DAILY_TARGET - d.count), 0);
  }, [data, today]);

  const todayTarget = DAILY_TARGET + totalDebt;
  const isOnTrack   = todayCount >= DAILY_TARGET;

  const addCall = () => {
    setData(prev => {
      const existing = prev.find(d=>d.date===today);
      const updated = existing
        ? prev.map(d => d.date===today ? {...d, count:d.count+1} : d)
        : [...prev, { date:today, count:1, debt:totalDebt }];
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const reset = () => {
    const updated = data.filter(d=>d.date!==today);
    localStorage.setItem(KEY, JSON.stringify(updated));
    setData(updated);
  };

  return { todayCount, todayTarget, totalDebt, isOnTrack, addCall, reset, DAILY_TARGET, data: data.slice(-7) };
}

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
  const tracker = useCallTracker();

  // Random suggestion — new leads never contacted
  const callSuggestion = useMemo(() => {
    const newLeads = companies.filter(c => c.status==='lead' && c.history.length===0 && c.phone);
    if (newLeads.length===0) return null;
    return newLeads[Math.floor(Math.random()*newLeads.length)];
  }, [companies]);

  const [suggestion, setSuggestion] = useState(callSuggestion);
  const refreshSuggestion = () => {
    const newLeads = companies.filter(c => c.status==='lead' && c.history.length===0 && c.phone);
    if (newLeads.length>0) setSuggestion(newLeads[Math.floor(Math.random()*newLeads.length)]);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Dzień dobry' : 'Dobry wieczór';
  const now = new Date();
  const yesterday  = new Date(now); yesterday.setDate(now.getDate()-1); yesterday.setHours(0,0,0,0);
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const tomorrowEnd = new Date(now); tomorrowEnd.setDate(now.getDate()+1); tomorrowEnd.setHours(23,59,59,999);

  const lastHistory = useMemo(() =>
    companies.flatMap(c=>c.history.map(h=>({...h,company:c})))
      .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5)
  ,[companies]);

  const recentCompanies = useMemo(() => [...companies].sort((a,b)=>b.id-a.id).slice(0,5), [companies]);

  const taskDays = useMemo(() => {
    const all = companies.flatMap(c=>c.reminders.filter(r=>!r.done).map(r=>({...r,company:c})));
    return {
      yesterday: all.filter(r=>{ const d=new Date(r.date); return d>=yesterday&&d<todayStart; }),
      today:     all.filter(r=>{ const d=new Date(r.date); return d>=todayStart&&d<new Date(todayStart.getTime()+86400000); }),
      tomorrow:  all.filter(r=>{ const d=new Date(r.date); return d>=new Date(todayStart.getTime()+86400000)&&d<=tomorrowEnd; }),
    };
  }, [companies]);

  const todayEvents = events.filter(e=>!e.done&&e.dateStart.slice(0,10)===now.toISOString().slice(0,10))
    .sort((a,b)=>a.dateStart.localeCompare(b.dateStart));

  const totalTasks = taskDays.yesterday.length+taskDays.today.length+taskDays.tomorrow.length;
  const progress   = Math.min(100, Math.round(tracker.todayCount/tracker.todayTarget*100));

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">
            {greeting}, <span className="text-amber-500">{currentUser?.name?.split(' ')[0]??'użytkowniku'}</span>! 👋
          </h1>
          <div className="text-zinc-500 text-sm mt-0.5">
            {now.toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · {companies.length} firm
          </div>
        </div>
        <WorldClock/>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-3 mb-3">

        {/* Zadania 3 dni */}
        <div className="col-span-5 bg-white border border-zinc-200 flex flex-col" style={{maxHeight:'340px'}}>
          <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Zadania · 3 dni</div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">{totalTasks}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(['yesterday','today','tomorrow'] as const).map(day => {
              const items = taskDays[day];
              const label = day==='yesterday'?'Wczoraj':day==='today'?'Dziś':'Jutro';
              const color = day==='yesterday'?'text-red-500 bg-red-50':day==='today'?'text-zinc-900 bg-amber-50':'text-zinc-400 bg-zinc-50';
              const icon  = day==='yesterday'?'⚠️':day==='today'?'🔔':'📅';
              return (
                <div key={day}>
                  <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${color}`}>{label} · {items.length}</div>
                  {items.length===0
                    ? <div className="px-4 py-1.5 text-xs text-zinc-300">Brak zadań</div>
                    : items.map(r=>(
                      <div key={r.id} className="px-4 py-1.5 flex items-start gap-2 hover:bg-zinc-50 cursor-pointer border-b border-zinc-50" onClick={()=>onSelectCompany(r.company)}>
                        <span className="text-sm flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-zinc-800 leading-tight truncate">{r.text}</div>
                          <div className="text-[10px] text-zinc-400">{r.company.company} · {fmtDate(r.date)}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col */}
        <div className="col-span-7 grid grid-cols-2 gap-3">
          {/* Kalendarz dziś */}
          <div className="col-span-2 bg-white border border-zinc-200">
            <div className="px-4 py-2.5 border-b border-zinc-100 text-xs font-bold uppercase tracking-widest text-zinc-500">Dzisiaj</div>
            {todayEvents.length===0
              ? <div className="px-4 py-3 text-xs text-zinc-400">Brak zaplanowanych zdarzeń</div>
              : <div className="divide-y divide-zinc-100">{todayEvents.map(e=>(
                  <div key={e.id} className="px-4 py-2 flex items-center gap-3">
                    <span>{e.type==='spotkanie'?'🤝':e.type==='call'?'📞':'📅'}</span>
                    <div>
                      <div className="text-sm font-medium text-zinc-800">{e.title}</div>
                      <div className="text-xs text-zinc-400">{new Date(e.dateStart).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}{e.location&&` · ${e.location}`}</div>
                    </div>
                  </div>
                ))}</div>}
          </div>
          {/* Ostatnie kontakty */}
          <div className="bg-white border border-zinc-200">
            <div className="px-4 py-2.5 border-b border-zinc-100 text-xs font-bold uppercase tracking-widest text-zinc-500">Ostatnie kontakty</div>
            <div className="divide-y divide-zinc-100">
              {lastHistory.length===0
                ? <div className="px-4 py-3 text-xs text-zinc-400">Brak</div>
                : lastHistory.map(h=>(
                  <div key={h.id} className="px-4 py-2 cursor-pointer hover:bg-zinc-50" onClick={()=>onSelectCompany(h.company)}>
                    <div className="text-xs font-medium text-zinc-800 truncate">{h.company.company}</div>
                    <div className="text-xs text-zinc-400 truncate">{h.note.slice(0,50)}{h.note.length>50?'...':''}</div>
                    <div className="text-[10px] text-zinc-300 mt-0.5">{fmtDT(h.date)}</div>
                  </div>
                ))}
            </div>
          </div>
          {/* Ostatnio dodane firmy */}
          <div className="bg-white border border-zinc-200">
            <div className="px-4 py-2.5 border-b border-zinc-100 text-xs font-bold uppercase tracking-widest text-zinc-500">Ostatnio dodane firmy</div>
            <div className="divide-y divide-zinc-100">
              {recentCompanies.length===0
                ? <div className="px-4 py-3 text-xs text-zinc-400">Brak</div>
                : recentCompanies.map(c=>(
                  <div key={c.id} className="px-4 py-2 cursor-pointer hover:bg-zinc-50" onClick={()=>onSelectCompany(c)}>
                    <div className="text-xs font-medium text-zinc-800 truncate">{c.company}</div>
                    <div className="text-[10px] text-zinc-400">{c.city||'—'} · {c.industry||'—'}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* CALL TRACKER */}
      <div className={`border-2 p-4 ${tracker.isOnTrack ? 'border-emerald-400 bg-emerald-50' : tracker.totalDebt>0 ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`text-sm font-bold uppercase tracking-widest ${tracker.isOnTrack?'text-emerald-700':tracker.totalDebt>0?'text-red-700':'text-amber-700'}`}>
                📞 Do wykonania dzisiaj
              </div>
              <div className={`text-xs px-2 py-0.5 font-bold ${tracker.isOnTrack?'bg-emerald-500 text-white':tracker.totalDebt>0?'bg-red-500 text-white':'bg-amber-400 text-zinc-900'}`}>
                {tracker.isOnTrack ? '✓ Na bieżąco' : `Obsuwka: ${tracker.totalDebt} telefonów`}
              </div>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-5xl font-black font-mono ${tracker.isOnTrack?'text-emerald-700':'text-red-700'}`}>{tracker.todayCount}</span>
              <span className="text-zinc-400 text-xl font-mono mb-1">/ {tracker.todayTarget}</span>
              <span className="text-zinc-500 text-sm mb-1.5">telefonów do nowych rekordów</span>
            </div>
            {/* Progress bar */}
            <div className="w-64 bg-white border border-zinc-200 h-3 mb-3">
              <div className={`h-full transition-all ${tracker.isOnTrack?'bg-emerald-500':'bg-red-500'}`} style={{width:`${progress}%`}}/>
            </div>
            {/* Last 7 days */}
            <div className="flex items-end gap-1">
              {tracker.data.map(d => {
                const ok = d.count >= tracker.DAILY_TARGET;
                return (
                  <div key={d.date} className="flex flex-col items-center">
                    <div className={`w-6 text-center text-[9px] mb-0.5 font-mono ${ok?'text-emerald-600':'text-red-500'}`}>{d.count}</div>
                    <div className={`w-6 ${ok?'bg-emerald-400':'bg-red-400'}`} style={{height:`${Math.max(4,Math.round(d.count/tracker.DAILY_TARGET*24))}px`}}/>
                    <div className="text-[9px] text-zinc-400 mt-0.5">{new Date(d.date).toLocaleDateString('pl-PL',{weekday:'short'}).slice(0,2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: suggestion + buttons */}
          <div className="flex flex-col gap-2 min-w-[280px]">
            {suggestion && (
              <div className="bg-white border border-zinc-200 p-3">
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">💡 Zadzwoń teraz do:</div>
                <div className="font-bold text-zinc-900 text-sm">{suggestion.company}</div>
                {suggestion.contact && <div className="text-xs text-zinc-600">{suggestion.contact}</div>}
                <a href={`tel:${suggestion.phone}`} className="text-blue-600 font-mono text-sm hover:underline">{suggestion.phone}</a>
                <div className="flex gap-2 mt-2">
                  <button onClick={()=>{ tracker.addCall(); refreshSuggestion(); }}
                    className="flex-1 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-medium">
                    ✓ Wykonano telefon
                  </button>
                  <button onClick={refreshSuggestion}
                    className="px-3 py-1.5 text-xs border border-zinc-200 text-zinc-600 hover:border-zinc-900">
                    ↻ Inna firma
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={tracker.addCall} className="flex-1 h-9 text-xs border-2 border-zinc-900 text-zinc-900 font-bold hover:bg-zinc-900 hover:text-white transition-colors">
                + Dodaj telefon
              </button>
              {tracker.todayCount > 0 && (
                <button onClick={tracker.reset} className="px-3 h-9 text-xs border border-zinc-200 text-zinc-400 hover:border-red-300 hover:text-red-500 transition-colors">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
