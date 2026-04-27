import { useState } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company, Status } from '../data/companies';
import { PIPELINE_STAGES } from '../data/companies';

import { formatRevenue } from '../lib/utils2';

interface PipelineProps {
  onSelectCompany: (company: Company) => void;
}

export function Pipeline({ onSelectCompany }: PipelineProps) {
  const { companies, role, updateCompanyStatus } = useCRMStore();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  const visibleCompanies = role === 'Admin'
    ? companies
    : companies.filter(c => c.assignedTo === role || !c.assignedTo);

  const byStage = (stage: Status) => visibleCompanies.filter(c => c.status === stage);

  const stageRevenue = (stage: Status) =>
    byStage(stage).reduce((s, c) => s + c.revenue, 0);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: Status) => {
    e.preventDefault();
    if (dragId !== null) {
      updateCompanyStatus(dragId, stage);
    }
    setDragId(null);
    setDragOver(null);
  };

  const STAGE_BG: Record<Status, string> = {
    lead: 'border-t-gray-400',
    kontakt: 'border-t-blue-400',
    oferta: 'border-t-amber-400',
    negocjacje: 'border-t-purple-400',
    zamkniety: 'border-t-emerald-400',
    stracony: 'border-t-red-400',
  };

  const STAGE_BADGE: Record<Status, string> = {
    lead: 'bg-gray-100 text-gray-700',
    kontakt: 'bg-blue-100 text-blue-700',
    oferta: 'bg-amber-100 text-amber-700',
    negocjacje: 'bg-purple-100 text-purple-700',
    zamkniety: 'bg-emerald-100 text-emerald-700',
    stracony: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {PIPELINE_STAGES.map(stage => {
        const cards = byStage(stage.key);
        const isOver = dragOver === stage.key;
        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-60 flex flex-col"
            onDragOver={e => { e.preventDefault(); setDragOver(stage.key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, stage.key)}
          >
            {/* Column header */}
            <div className={`bg-white border border-zinc-200 border-t-4 p-3 mb-2 ${STAGE_BG[stage.key]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-zinc-900">{stage.label}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 ${STAGE_BADGE[stage.key]}`}>{cards.length}</span>
              </div>
              <div className="text-xs font-mono text-zinc-500">{formatRevenue(stageRevenue(stage.key))}</div>
            </div>

            {/* Cards */}
            <div className={`flex-1 overflow-y-auto space-y-2 min-h-20 p-1 transition-colors rounded ${isOver ? 'bg-amber-50 ring-2 ring-amber-300 ring-inset' : ''}`}>
              {cards.map(company => (
                <div
                  key={company.id}
                  draggable
                  onDragStart={e => handleDragStart(e, company.id)}
                  onDragEnd={() => { setDragId(null); setDragOver(null); }}
                  onClick={() => onSelectCompany(company)}
                  className={`bg-white border border-zinc-200 p-3 cursor-pointer hover:border-zinc-900 hover:shadow-sm transition-all select-none ${dragId === company.id ? 'opacity-40' : ''}`}
                >
                  <div className="font-medium text-xs text-zinc-900 leading-tight mb-1 line-clamp-2">{company.company}</div>
                  {company.contact && (
                    <div className="text-xs text-zinc-400 mb-2">{company.contact}</div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-zinc-700">{formatRevenue(company.revenue)}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{company.city}</div>
                  {company.reminders.filter(r => !r.done).length > 0 && (
                    <div className="mt-2 text-xs text-amber-600 font-medium">
                      🔔 {company.reminders.filter(r => !r.done).length} przypomnienie
                    </div>
                  )}
                </div>
              ))}
              {cards.length === 0 && (
                <div className={`flex items-center justify-center h-16 text-xs text-zinc-300 border border-dashed border-zinc-200 ${isOver ? 'border-amber-300 text-amber-400' : ''}`}>
                  {isOver ? 'Upuść tutaj' : 'Brak firm'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
