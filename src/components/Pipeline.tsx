import { useState } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company, Status } from '../data/companies';

interface PipelineProps { onSelectCompany: (c: Company) => void; }

export function Pipeline({ onSelectCompany }: PipelineProps) {
  const { companies, stages, currentUser, updateCompanyStatus } = useCRMStore();
  const [dragId, setDragId] = useState<number|null>(null);
  const [dragOver, setDragOver] = useState<Status|null>(null);

  const visible = currentUser?.role==='admin' ? companies : companies.filter(c=>!c.assignedTo||c.assignedTo===currentUser?.name);
  const byStage = (key:Status) => visible.filter(c=>c.status===key);

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {stages.map(stage => {
        const cards = byStage(stage.key);
        const isOver = dragOver===stage.key;
        const totalEmp = cards.reduce((s,c)=>s+(parseInt(c.employees||'0')||0),0);
        return (
          <div key={stage.key} className="flex-shrink-0 w-56 flex flex-col"
            onDragOver={e=>{e.preventDefault();setDragOver(stage.key);}}
            onDragLeave={()=>setDragOver(null)}
            onDrop={e=>{e.preventDefault();if(dragId!==null)updateCompanyStatus(dragId,stage.key);setDragId(null);setDragOver(null);}}>
            {/* Column header */}
            <div className="bg-white border border-zinc-200 p-3 mb-2" style={{ borderTopWidth:3, borderTopColor:stage.color }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-zinc-900">{stage.label}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 text-white" style={{ backgroundColor:stage.color }}>{cards.length}</span>
              </div>
              {totalEmp>0&&<div className="text-xs text-zinc-400 font-mono">👥 {totalEmp.toLocaleString('pl-PL')}</div>}
            </div>
            {/* Cards */}
            <div className={`flex-1 overflow-y-auto space-y-2 min-h-16 p-1 transition-colors ${isOver?'bg-amber-50 ring-2 ring-amber-300 ring-inset ring-rounded':''}`}>
              {cards.map(company=>(
                <div key={company.id} draggable
                  onDragStart={e=>{setDragId(company.id);e.dataTransfer.effectAllowed='move';}}
                  onDragEnd={()=>{setDragId(null);setDragOver(null);}}
                  onClick={()=>onSelectCompany(company)}
                  className={`bg-white border border-zinc-200 p-3 cursor-pointer hover:border-zinc-900 hover:shadow-sm transition-all select-none ${dragId===company.id?'opacity-40':''}`}>
                  <div className="font-medium text-xs text-zinc-900 leading-tight mb-1 line-clamp-2">{company.company}</div>
                  {company.contact&&<div className="text-xs text-zinc-400 mb-1.5">{company.contact}</div>}
                  {company.employees&&(
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-400">👥</span>
                      <span className="text-sm font-mono font-bold text-zinc-800">{Number(company.employees).toLocaleString('pl-PL')}</span>
                    </div>
                  )}
                  <div className="text-xs text-zinc-400 mt-1">{company.city}</div>
                  {company.reminders.filter(r=>!r.done).length>0&&(
                    <div className="mt-1.5 text-xs text-amber-600 font-medium">🔔 {company.reminders.filter(r=>!r.done).length}</div>
                  )}
                </div>
              ))}
              {cards.length===0&&(
                <div className={`flex items-center justify-center h-14 text-xs border border-dashed ${isOver?'border-amber-300 text-amber-400':'border-zinc-200 text-zinc-300'}`}>
                  {isOver?'Upuść tutaj':'—'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
