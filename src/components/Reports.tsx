import { useMemo } from 'react';
import { useCRMStore } from '../store/useCRMStore';

function fmtRevenue(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`;
  return String(n);
}

export function Reports() {
  const { companies } = useCRMStore();

  const stats = useMemo(() => {
    const total = companies.length;
    const byStatus = companies.reduce((acc, c) => { acc[c.status]=(acc[c.status]||0)+1; return acc; }, {} as Record<string,number>);
    const byIndustry = companies.reduce((acc, c) => { if(c.industry){acc[c.industry]=(acc[c.industry]||0)+1;} return acc; }, {} as Record<string,number>);
    const byCity = companies.reduce((acc, c) => { if(c.city){acc[c.city]=(acc[c.city]||0)+1;} return acc; }, {} as Record<string,number>);
    const withHistory = companies.filter(c=>c.history.length>0).length;
    const withReminders = companies.filter(c=>c.reminders.some(r=>!r.done)).length;
    const avgEmp = Math.round(companies.filter(c=>parseInt(c.employees||'0')>0).reduce((s,c)=>s+parseInt(c.employees||'0'),0) / companies.filter(c=>parseInt(c.employees||'0')>0).length || 0);
    const totalRevenue = companies.reduce((s,c)=>s+c.revenue,0);
    const topIndustries = Object.entries(byIndustry).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const topCities = Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,8);

    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
    const thisMonth = companies.filter(c=>c.history.some(h=>{ const d=new Date(h.date); return d.getMonth()===m&&d.getFullYear()===y; })).length;
    const histByType = companies.flatMap(c=>c.history).reduce((acc,h)=>{ acc[h.type]=(acc[h.type]||0)+1; return acc; },{} as Record<string,number>);

    return { total, byStatus, topIndustries, topCities, withHistory, withReminders, avgEmp, totalRevenue, thisMonth, histByType };
  }, [companies]);

  const STATUS_LABELS: Record<string,string> = { lead:'Lead', kontakt:'Kontakt', oferta:'Oferta', negocjacje:'Negocjacje', zamkniety:'Klient', stracony:'Stracony' };
  const STATUS_COLORS: Record<string,string> = { lead:'bg-gray-400', kontakt:'bg-blue-500', oferta:'bg-amber-500', negocjacje:'bg-purple-500', zamkniety:'bg-emerald-500', stracony:'bg-red-400' };

  const Bar = ({ value, max, color='bg-zinc-900' }: { value: number; max: number; color?: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-100 h-4 relative">
        <div className={`h-full ${color} transition-all`} style={{ width: `${max>0?(value/max)*100:0}%` }}/>
      </div>
      <span className="text-xs font-mono text-zinc-600 w-8 text-right">{value}</span>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-zinc-900">Raporty i statystyki</h2>
        <div className="text-sm text-zinc-500">{stats.total} firm w bazie</div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label:'Wszystkich firm', value: stats.total, color:'text-zinc-900' },
          { label:'Z historią kontaktów', value: stats.withHistory, color:'text-blue-600' },
          { label:'Z aktywnymi zadaniami', value: stats.withReminders, color:'text-amber-600' },
          { label:'Kontaktowanych w tym miesiącu', value: stats.thisMonth, color:'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-zinc-200 p-4">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">{k.label}</div>
            <div className={`text-3xl font-black font-mono ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Pipeline</div>
          <div className="space-y-2">
            {Object.entries(stats.byStatus).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-zinc-700 font-medium">{STATUS_LABELS[k]??k}</span>
                  <span className="text-zinc-400">{Math.round(v/stats.total*100)}%</span>
                </div>
                <Bar value={v} max={stats.total} color={STATUS_COLORS[k]??'bg-zinc-400'}/>
              </div>
            ))}
          </div>
        </div>

        {/* Top branże */}
        <div className="bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Top branże</div>
          <div className="space-y-2">
            {stats.topIndustries.map(([k,v])=>(
              <div key={k}>
                <div className="text-xs text-zinc-700 mb-0.5 truncate">{k}</div>
                <Bar value={v} max={stats.topIndustries[0]?.[1]??1}/>
              </div>
            ))}
          </div>
        </div>

        {/* Top miasta */}
        <div className="bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Top miasta</div>
          <div className="space-y-2">
            {stats.topCities.map(([k,v])=>(
              <div key={k}>
                <div className="text-xs text-zinc-700 mb-0.5">{k}</div>
                <Bar value={v} max={stats.topCities[0]?.[1]??1}/>
              </div>
            ))}
          </div>
        </div>

        {/* Aktywność */}
        <div className="bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Typy kontaktów (łącznie)</div>
          <div className="space-y-2">
            {Object.entries(stats.histByType).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
              <div key={k}>
                <div className="text-xs text-zinc-700 mb-0.5 capitalize">{k}</div>
                <Bar value={v} max={Math.max(...Object.values(stats.histByType))}/>
              </div>
            ))}
            {Object.keys(stats.histByType).length===0 && <div className="text-xs text-zinc-400">Brak wpisów w historii</div>}
          </div>
        </div>

        {/* Inne KPI */}
        <div className="bg-white border border-zinc-200 p-4 col-span-2">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Pozostałe wskaźniki</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Średnia liczba pracowników', value: stats.avgEmp || '—' },
              { label:'Sumaryczny przychód', value: stats.totalRevenue>0 ? fmtRevenue(stats.totalRevenue)+' zł' : '—' },
              { label:'Konwersja lead→klient', value: stats.total>0 ? Math.round((stats.byStatus['zamkniety']||0)/stats.total*100)+'%' : '—' },
              { label:'Firmy bez kontaktu', value: stats.total-stats.withHistory },
              { label:'Aktywne follow-upy', value: stats.withReminders },
              { label:'Porzucone (Stracony)', value: stats.byStatus['stracony']||0 },
            ].map(k=>(
              <div key={k.label} className="bg-zinc-50 border border-zinc-100 p-3">
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">{k.label}</div>
                <div className="text-xl font-black font-mono text-zinc-900">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
