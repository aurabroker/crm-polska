import { useState, useMemo } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company } from '../data/companies';

interface PipelineProps { onSelectCompany: (c: Company) => void; }

const STATUS_BG: Record<string,string> = {
  lead:'bg-gray-50', kontakt:'bg-blue-50', oferta:'bg-amber-50',
  negocjacje:'bg-purple-50', zamkniety:'bg-emerald-50', stracony:'bg-red-50',
};
const STATUS_HEADER: Record<string,string> = {
  lead:'bg-gray-600', kontakt:'bg-blue-600', oferta:'bg-amber-500',
  negocjacje:'bg-purple-600', zamkniety:'bg-emerald-600', stracony:'bg-red-600',
};

export function Pipeline({ onSelectCompany }: PipelineProps) {
  const { companies, stages, updateCompanyStatus } = useCRMStore();
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState<number|null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c =>
      c.company.toLowerCase().includes(q) ||
      (c.contact??'').toLowerCase().includes(q) ||
      (c.nip??'').includes(q) ||
      (c.city??'').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const byStage = (key: string) => filtered.filter(c => c.status === key);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj w pipeline..."
            className="w-64 h-9 border-2 border-zinc-300 px-3 pl-8 text-sm focus:outline-none focus:border-zinc-900 bg-white"/>
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs">✕</button>}
        </div>
        <span className="text-xs text-zinc-500">{filtered.length} firm</span>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-max">
          {stages.map(stage => {
            const cards = byStage(stage.key);
            return (
              <div key={stage.key} className={`flex flex-col w-64 rounded-none border border-zinc-200 ${STATUS_BG[stage.key]}`}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragging != null) { updateCompanyStatus(dragging, stage.key as Company['status']); setDragging(null); } }}>
                <div className={`px-3 py-2.5 text-white flex items-center justify-between ${STATUS_HEADER[stage.key]}`}>
                  <span className="text-xs font-bold uppercase tracking-widest">{stage.label}</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 font-mono">{cards.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {cards.map(c => (
                    <div key={c.id} draggable
                      onDragStart={() => setDragging(c.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => onSelectCompany(c)}
                      className="bg-white border border-zinc-200 p-3 cursor-pointer hover:border-zinc-400 hover:shadow-sm transition-all select-none">
                      <div className="font-semibold text-zinc-900 text-sm leading-tight mb-1">{c.company}</div>
                      {c.contact && <div className="text-xs text-zinc-500 mb-1">{c.contact}</div>}
                      <div className="flex gap-2 text-[10px] text-zinc-400 flex-wrap">
                        {c.city && <span>{c.city}</span>}
                        {c.industry && <span>· {c.industry}</span>}
                        {c.employees && <span>· {c.employees} os.</span>}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && <div className="text-xs text-zinc-300 text-center py-6">Brak firm</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
