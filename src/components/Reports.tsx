import { useMemo } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Status } from '../data/companies';
import { PIPELINE_STAGES } from '../data/companies';
import { formatRevenue } from '../lib/utils2';

export function Reports() {
  const { companies, role } = useCRMStore();

  const visible = role === 'Admin'
    ? companies
    : companies.filter(c => c.assignedTo === role || !c.assignedTo);

  const byStage = useMemo(() => PIPELINE_STAGES.map(s => ({
    ...s,
    companies: visible.filter(c => c.status === s.key),
    revenue: visible.filter(c => c.status === s.key).reduce((sum, c) => sum + c.revenue, 0),
  })), [visible]);

  const maxRev = Math.max(...byStage.map(s => s.revenue), 1);

  const byCity = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    visible.forEach(c => {
      if (!map[c.city]) map[c.city] = { count: 0, revenue: 0 };
      map[c.city].count++;
      map[c.city].revenue += c.revenue;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);
  }, [visible]);

  const byIndustry = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    visible.forEach(c => {
      if (!map[c.industry]) map[c.industry] = { count: 0, revenue: 0 };
      map[c.industry].count++;
      map[c.industry].revenue += c.revenue;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);
  }, [visible]);

  const maxCityRev = Math.max(...byCity.map(c => c[1].revenue), 1);
  const maxIndRev = Math.max(...byIndustry.map(c => c[1].revenue), 1);

  const totalRevenue = visible.reduce((s, c) => s + c.revenue, 0);
  const closedRevenue = visible.filter(c => c.status === 'zamkniety').reduce((s, c) => s + c.revenue, 0);
  const conversionRate = visible.length > 0
    ? ((visible.filter(c => c.status === 'zamkniety').length / visible.length) * 100).toFixed(1)
    : '0';

  const totalHistory = visible.reduce((s, c) => s + c.history.length, 0);
  const totalReminders = visible.reduce((s, c) => s + c.reminders.length, 0);

  const STAGE_COLORS: Record<Status, string> = {
    lead: 'bg-gray-400',
    kontakt: 'bg-blue-400',
    oferta: 'bg-amber-400',
    negocjacje: 'bg-purple-400',
    zamkniety: 'bg-emerald-400',
    stracony: 'bg-red-400',
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Łączny przychód', value: formatRevenue(totalRevenue), sub: 'wszystkie firmy' },
          { label: 'Zamknięty przychód', value: formatRevenue(closedRevenue), sub: `${visible.filter(c => c.status === 'zamkniety').length} firm` },
          { label: 'Konwersja', value: `${conversionRate}%`, sub: 'lead → zamknięty' },
          { label: 'Aktywności', value: totalHistory.toString(), sub: `${totalReminders} przypomnień` },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-zinc-200 p-4">
            <div className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold font-mono text-zinc-900 mb-1">{kpi.value}</div>
            <div className="text-xs text-zinc-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline chart */}
      <div className="bg-white border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-widest">Pipeline wg etapu</h3>
        </div>
        <div className="space-y-3">
          {byStage.map(s => (
            <div key={s.key} className="flex items-center gap-4">
              <div className="w-28 text-xs text-zinc-600 text-right flex-shrink-0">{s.label}</div>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 bg-zinc-100 h-6 relative">
                  <div
                    className={`h-full ${STAGE_COLORS[s.key]} transition-all`}
                    style={{ width: `${(s.revenue / maxRev) * 100}%`, minWidth: s.revenue > 0 ? '2px' : '0' }}
                  />
                </div>
                <div className="w-24 text-xs font-mono text-zinc-700 text-right">{formatRevenue(s.revenue)}</div>
                <div className="w-12 text-xs font-mono text-zinc-400 text-right">{s.companies.length} firm</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* City + Industry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 p-5">
          <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-widest mb-4">Top miasta</h3>
          <div className="space-y-2">
            {byCity.map(([city, data]) => (
              <div key={city} className="flex items-center gap-3">
                <div className="w-24 text-xs text-zinc-600 truncate flex-shrink-0">{city}</div>
                <div className="flex-1 bg-zinc-100 h-5 relative">
                  <div className="h-full bg-zinc-900 transition-all" style={{ width: `${(data.revenue / maxCityRev) * 100}%` }} />
                </div>
                <div className="w-20 text-xs font-mono text-zinc-700 text-right">{formatRevenue(data.revenue)}</div>
                <div className="w-8 text-xs text-zinc-400 text-right">{data.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-5">
          <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-widest mb-4">Top branże</h3>
          <div className="space-y-2">
            {byIndustry.map(([ind, data]) => (
              <div key={ind} className="flex items-center gap-3">
                <div className="w-36 text-xs text-zinc-600 truncate flex-shrink-0" title={ind}>{ind}</div>
                <div className="flex-1 bg-zinc-100 h-5 relative">
                  <div className="h-full bg-amber-400 transition-all" style={{ width: `${(data.revenue / maxIndRev) * 100}%` }} />
                </div>
                <div className="w-20 text-xs font-mono text-zinc-700 text-right">{formatRevenue(data.revenue)}</div>
                <div className="w-8 text-xs text-zinc-400 text-right">{data.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white border border-zinc-200 p-5">
        <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-widest mb-4">Aktywność — top 10 firm</h3>
        <div className="space-y-2">
          {[...visible]
            .sort((a, b) => (b.history.length + b.reminders.length) - (a.history.length + a.reminders.length))
            .slice(0, 10)
            .map(c => (
              <div key={c.id} className="flex items-center gap-4 py-1">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-800 truncate">{c.company}</div>
                  <div className="text-xs text-zinc-400">{c.city} · {c.industry}</div>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500 flex-shrink-0">
                  <span className="font-mono">{c.history.length} wpis{c.history.length === 1 ? '' : c.history.length < 5 ? 'y' : 'ów'}</span>
                  <span className="font-mono">{c.reminders.length} przyp.</span>
                  <span className="font-mono font-medium text-zinc-900">{formatRevenue(c.revenue)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
