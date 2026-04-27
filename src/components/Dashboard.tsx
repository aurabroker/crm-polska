import { useState, useMemo } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company } from '../data/companies';
import { PIPELINE_STAGES } from '../data/companies';
import { formatRevenue } from '../lib/utils2';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardProps {
  onSelectCompany: (company: Company) => void;
}

type SortKey = 'revenue' | 'company' | 'employees';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  kontakt: 'bg-blue-100 text-blue-700',
  oferta: 'bg-amber-100 text-amber-700',
  negocjacje: 'bg-purple-100 text-purple-700',
  zamkniety: 'bg-emerald-100 text-emerald-700',
  stracony: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead', kontakt: 'Kontakt', oferta: 'Oferta',
  negocjacje: 'Negocjacje', zamkniety: 'Zamknięty', stracony: 'Stracony',
};

export function Dashboard({ onSelectCompany }: DashboardProps) {
  const { companies, role } = useCRMStore();
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const visibleCompanies = role === 'Admin'
    ? companies
    : companies.filter(c => c.assignedTo === role || !c.assignedTo);

  const cities = useMemo(() => ['all', ...Array.from(new Set(visibleCompanies.map(c => c.city))).sort()], [visibleCompanies]);
  const industries = useMemo(() => ['all', ...Array.from(new Set(visibleCompanies.map(c => c.industry))).sort()], [visibleCompanies]);

  const filtered = useMemo(() => {
    let r = visibleCompanies;
    if (search) r = r.filter(c =>
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
    );
    if (filterCity !== 'all') r = r.filter(c => c.city === filterCity);
    if (filterIndustry !== 'all') r = r.filter(c => c.industry === filterIndustry);
    if (filterStatus !== 'all') r = r.filter(c => c.status === filterStatus);
    return [...r].sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortKey === 'revenue') { va = a.revenue; vb = b.revenue; }
      else if (sortKey === 'employees') { va = parseInt(a.employees || '0'); vb = parseInt(b.employees || '0'); }
      else { va = a.company; vb = b.company; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [visibleCompanies, search, filterCity, filterIndustry, filterStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-xs opacity-50">
      {sortKey === k ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const totalRevenue = filtered.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Firm łącznie', value: filtered.length.toString() },
          { label: 'Łączny przychód', value: formatRevenue(totalRevenue) },
          { label: 'Aktywne szanse', value: filtered.filter(c => ['oferta','negocjacje'].includes(c.status)).length.toString() },
          { label: 'Zamknięte', value: filtered.filter(c => c.status === 'zamkniety').length.toString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-zinc-900 font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Szukaj firmy, kontaktu, miasta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"
        />
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-40 h-9 text-sm rounded-none border-zinc-200 focus:ring-0">
            <SelectValue placeholder="Miasto" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {cities.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Wszystkie miasta' : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterIndustry} onValueChange={setFilterIndustry}>
          <SelectTrigger className="w-52 h-9 text-sm rounded-none border-zinc-200 focus:ring-0">
            <SelectValue placeholder="Branża" />
          </SelectTrigger>
          <SelectContent className="rounded-none max-h-60">
            {industries.map(i => <SelectItem key={i} value={i}>{i === 'all' ? 'Wszystkie branże' : i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm rounded-none border-zinc-200 focus:ring-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || filterCity !== 'all' || filterIndustry !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterCity('all'); setFilterIndustry('all'); setFilterStatus('all'); }}
            className="h-9 px-3 text-sm text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-900 transition-colors"
          >
            Wyczyść
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-white sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">
                <button onClick={() => toggleSort('company')} className="flex items-center hover:text-zinc-300">
                  Firma <SortIcon k="company" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">Kontakt</th>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">Miasto</th>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">Branża</th>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">
                <button onClick={() => toggleSort('revenue')} className="flex items-center hover:text-zinc-300">
                  Przychód <SortIcon k="revenue" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">
                <button onClick={() => toggleSort('employees')} className="flex items-center hover:text-zinc-300">
                  Pracownicy <SortIcon k="employees" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">Status</th>
              {role === 'Admin' && <th className="text-left px-4 py-3 font-medium text-xs tracking-widest uppercase">Opiekun</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((company, i) => (
              <tr
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className={`cursor-pointer border-b border-zinc-100 hover:bg-amber-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 text-sm leading-tight">{company.company}</div>
                  {company.url && <div className="text-xs text-zinc-400 mt-0.5">{company.url.replace('http://', '')}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  <div>{company.contact || <span className="text-zinc-300">—</span>}</div>
                  {company.title && <div className="text-xs text-zinc-400">{company.title}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-600">{company.city}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{company.industry}</td>
                <td className="px-4 py-3 font-mono text-zinc-900 text-sm font-medium">{formatRevenue(company.revenue)}</td>
                <td className="px-4 py-3 font-mono text-zinc-500">{company.employees || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[company.status]}`}>
                    {STATUS_LABELS[company.status]}
                  </span>
                </td>
                {role === 'Admin' && (
                  <td className="px-4 py-3 text-xs text-zinc-500">{company.assignedTo || '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 text-zinc-400">Brak wyników dla podanych filtrów</div>
        )}
      </div>
      <div className="mt-2 text-xs text-zinc-400">Wyświetlono {filtered.length} z {visibleCompanies.length} firm</div>
    </div>
  );
}
