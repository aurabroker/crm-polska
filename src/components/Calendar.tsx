import { useState, useEffect } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company, CRMEvent } from '../data/companies';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CalendarProps { onSelectCompany: (c: Company) => void; }

type CalView = 'day'|'workweek'|'month';
const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_SHORT = ['Pon','Wt','Śr','Czw','Pt','Sob','Nd'];
const TYPE_COLORS: Record<string,string> = { spotkanie:'bg-blue-100 border-blue-300 text-blue-800', call:'bg-emerald-100 border-emerald-300 text-emerald-800', event:'bg-purple-100 border-purple-300 text-purple-800' };
const TYPE_ICONS: Record<string,string>  = { spotkanie:'🤝', call:'📞', event:'📅' };
const HOURS = Array.from({length:24},(_,i)=>i);

function sow(d: Date): Date { const r=new Date(d); r.setHours(0,0,0,0); const day=r.getDay(); r.setDate(r.getDate()-(day===0?6:day-1)); return r; }
function addDays(d: Date, n: number): Date { const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function isSameDay(a: Date, b: Date) { return a.toISOString().slice(0,10)===b.toISOString().slice(0,10); }
function fmtTime(s: string) { if(!s)return''; return new Date(s).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}); }
function fmtDate(d: Date) { return d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'}); }

export function Calendar({ onSelectCompany }: CalendarProps) {
  const { companies, events, addEvent, updateEvent, deleteEvent, currentUser } = useCRMStore();
  const [view, setView]       = useState<CalView>('workweek');
  const [anchor, setAnchor]   = useState(() => { const d=new Date(); d.setHours(0,0,0,0); return d; });
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CRMEvent|null>(null);
  const [evForm, setEvForm]   = useState({ title:'', type:'spotkanie' as CRMEvent['type'], dateStart:'', dateEnd:'', location:'', notes:'' });

  // Alert — migający pasek
  const [alertEvent, setAlertEvent] = useState<CRMEvent|null>(null);
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const firing = events.find(e => !e.done && Math.abs(new Date(e.dateStart).getTime()-now) < 5*60*1000);
      setAlertEvent(firing ?? null);
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [events]);

  // Days for current view
  const viewDays = (): Date[] => {
    if (view==='day')      return [anchor];
    if (view==='workweek') return Array.from({length:5},(_,i)=>addDays(sow(anchor),i));
    // month
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = sow(first);
    return Array.from({length:42},(_,i)=>addDays(start,i));
  };

  const days = viewDays();

  const eventsForDay = (day: Date) => {
    const ds = day.toISOString().slice(0,10);
    const evts = events.filter(e => e.dateStart.slice(0,10)===ds && !e.done);
    const rems = companies.flatMap(c => c.reminders.filter(r => r.date.slice(0,10)===ds && !r.done).map(r=>({ _isReminder:true, id:r.id, title:r.text, type:'event' as CRMEvent['type'], dateStart:r.date, done:r.done, companyId:c.id, _company:c })));
    return [...evts, ...rems].sort((a,b)=>a.dateStart.localeCompare(b.dateStart));
  };

  const navigate = (dir: number) => {
    if (view==='day')       setAnchor(addDays(anchor, dir));
    else if(view==='workweek') setAnchor(addDays(anchor, dir*7));
    else {
      const d = new Date(anchor); d.setMonth(d.getMonth()+dir); setAnchor(d);
    }
  };

  const openForm = (ev?: CRMEvent, dateStr?: string) => {
    if (ev) {
      setEditingEvent(ev);
      setEvForm({ title:ev.title, type:ev.type, dateStart:ev.dateStart.slice(0,16), dateEnd:ev.dateEnd?.slice(0,16)??'', location:ev.location, notes:ev.notes });
    } else {
      setEditingEvent(null);
      const def = dateStr ? `${dateStr}T09:00` : new Date().toISOString().slice(0,16);
      setEvForm({ title:'', type:'spotkanie', dateStart:def, dateEnd:'', location:'', notes:'' });
    }
    setShowForm(true);
  };

  const saveEvent = async () => {
    if (!evForm.title.trim()||!evForm.dateStart) return;
    if (editingEvent) {
      await updateEvent(editingEvent.id, { title:evForm.title, type:evForm.type, dateStart:new Date(evForm.dateStart).toISOString(), dateEnd:evForm.dateEnd?new Date(evForm.dateEnd).toISOString():undefined, location:evForm.location, notes:evForm.notes });
    } else {
      await addEvent({ title:evForm.title, type:evForm.type, dateStart:new Date(evForm.dateStart).toISOString(), dateEnd:evForm.dateEnd?new Date(evForm.dateEnd).toISOString():undefined, location:evForm.location, notes:evForm.notes, done:false, createdBy:currentUser?.name??'' });
    }
    setShowForm(false);
  };

  const EF = (k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setEvForm(p=>({...p,[k]:e.target.value}));

  const today = new Date(); today.setHours(0,0,0,0);

  const headerLabel = () => {
    if (view==='day') return anchor.toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    if (view==='workweek') { const e=addDays(sow(anchor),4); return `${fmtDate(sow(anchor))} — ${fmtDate(e)} ${e.getFullYear()}`; }
    return `${MONTHS_PL[anchor.getMonth()]} ${anchor.getFullYear()}`;
  };

  const EventChip = ({ ev, small }: { ev: CRMEvent & { _isReminder?: boolean; _company?: Company }; small?: boolean }) => (
    <div className={`border text-xs px-1.5 py-0.5 mb-0.5 cursor-pointer hover:opacity-80 transition-opacity truncate ${ev._isReminder ? 'bg-amber-100 border-amber-300 text-amber-800' : TYPE_COLORS[ev.type]}`}
      onClick={e => { e.stopPropagation(); if(ev._company) onSelectCompany(ev._company); else openForm(ev as CRMEvent); }}>
      {small ? '' : TYPE_ICONS[ev.type||'event']+' '}{fmtTime(ev.dateStart)} {ev.title}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Alert bar */}
      {alertEvent && (
        <div className="mb-2 px-4 py-2 bg-red-600 text-white text-sm font-medium flex items-center justify-between animate-pulse">
          <span>🔔 Zaraz zaczyna się: <strong>{alertEvent.title}</strong> o {fmtTime(alertEvent.dateStart)}</span>
          <button onClick={() => setAlertEvent(null)} className="text-white/70 hover:text-white">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-0.5 border border-zinc-200">
          {(['day','workweek','month'] as CalView[]).map(v => (
            <button key={v} onClick={()=>{ setView(v); }} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view===v?'bg-zinc-900 text-white':'text-zinc-600 hover:bg-zinc-100'}`}>
              {v==='day'?'Dzień':v==='workweek'?'Tydzień roboczy':'Miesiąc'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={()=>navigate(-1)} className="px-2 py-1.5 text-sm border border-zinc-200 hover:border-zinc-900 transition-colors">←</button>
          <button onClick={()=>setAnchor(new Date(today))} className="px-3 py-1.5 text-xs border border-zinc-200 hover:border-zinc-900 transition-colors">Dziś</button>
          <button onClick={()=>navigate(1)} className="px-2 py-1.5 text-sm border border-zinc-200 hover:border-zinc-900 transition-colors">→</button>
        </div>
        <span className="text-sm font-medium text-zinc-700">{headerLabel()}</span>
        <button onClick={()=>openForm()} className="ml-auto h-8 px-4 text-xs bg-zinc-900 text-white hover:bg-zinc-700 transition-colors">+ Dodaj zdarzenie</button>
      </div>

      {/* ── DAY / WORKWEEK — hourly grid ── */}
      {(view==='day'||view==='workweek') && (
        <div className="flex-1 overflow-auto border border-zinc-200 bg-white">
          {/* Header row */}
          <div className={`grid sticky top-0 z-10 bg-white border-b border-zinc-200`} style={{gridTemplateColumns:`56px repeat(${days.length},1fr)`}}>
            <div className="border-r border-zinc-100"/>
            {days.map((d,i) => {
              const isT = isSameDay(d,today);
              return (
                <div key={i} className={`text-center py-2 border-r border-zinc-100 ${isT?'bg-zinc-900 text-white':'text-zinc-700'}`}>
                  <div className="text-[10px] uppercase tracking-widest">{DAYS_SHORT[(d.getDay()+6)%7]}</div>
                  <div className={`text-lg font-bold font-mono ${isT?'text-white':'text-zinc-900'}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          {/* Hourly rows */}
          {HOURS.map(h => (
            <div key={h} className="grid border-b border-zinc-100 min-h-[52px]" style={{gridTemplateColumns:`56px repeat(${days.length},1fr)`}}>
              <div className="text-[10px] text-zinc-400 font-mono text-right pr-2 pt-1 border-r border-zinc-100 flex-shrink-0">{String(h).padStart(2,'0')}:00</div>
              {days.map((d,di) => {
                const isT = isSameDay(d,today);
                const allItems = eventsForDay(d).filter(e => { const eh=new Date(e.dateStart).getHours(); return eh===h; });
                return (
                  <div key={di} className={`border-r border-zinc-100 px-1 pt-0.5 min-h-[52px] cursor-pointer hover:bg-zinc-50 transition-colors ${isT?'bg-amber-50/30':''}`}
                    onClick={()=>openForm(undefined, `${d.toISOString().slice(0,10)}T${String(h).padStart(2,'0')}:00`)}>
                    {allItems.map(e => <EventChip key={e.id} ev={e as CRMEvent & {_isReminder?:boolean;_company?:Company}} small/>)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── MONTH ── */}
      {view==='month' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 border-t border-l border-zinc-200">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center py-2 text-xs font-medium uppercase tracking-widest text-zinc-500 border-b border-r border-zinc-200 bg-zinc-50">{d}</div>
            ))}
            {days.map((d,i) => {
              const isT   = isSameDay(d,today);
              const inMon = d.getMonth()===anchor.getMonth();
              const items = eventsForDay(d);
              return (
                <div key={i} onClick={()=>openForm(undefined,d.toISOString().slice(0,10))}
                  className={`border-b border-r border-zinc-200 p-1 min-h-[90px] cursor-pointer hover:bg-zinc-50 transition-colors ${!inMon?'bg-zinc-50/60':''}`}>
                  <div className={`text-xs font-mono mb-1 w-6 h-6 flex items-center justify-center ${isT?'bg-zinc-900 text-white rounded-full':'text-zinc-500'} ${!inMon?'opacity-40':''}`}>{d.getDate()}</div>
                  {items.slice(0,3).map(e => <EventChip key={e.id} ev={e as CRMEvent & {_isReminder?:boolean;_company?:Company}}/>)}
                  {items.length>3 && <div className="text-[10px] text-zinc-400">+{items.length-3} więcej</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD/EDIT FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
          <div className="bg-white w-[500px] shadow-2xl border border-zinc-200">
            <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-widest">{editingEvent?'Edytuj zdarzenie':'Nowe zdarzenie'}</span>
              <button onClick={()=>setShowForm(false)} className="text-zinc-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Tytuł *</div>
                <Input value={evForm.title} onChange={EF('title')} placeholder="np. Spotkanie z klientem" className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Typ</div>
                <div className="flex gap-1">
                  {(['spotkanie','call','event'] as const).map(t => (
                    <button key={t} onClick={()=>setEvForm(p=>({...p,type:t}))}
                      className={`flex-1 py-1.5 text-xs border transition-colors ${evForm.type===t?'bg-zinc-900 text-white border-zinc-900':'border-zinc-200 text-zinc-600 hover:border-zinc-900'}`}>
                      {TYPE_ICONS[t]} {t==='spotkanie'?'Spotkanie':t==='call'?'Call':'Event'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Początek *</div>
                  <Input type="datetime-local" value={evForm.dateStart} onChange={EF('dateStart')} className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Koniec</div>
                  <Input type="datetime-local" value={evForm.dateEnd} onChange={EF('dateEnd')} className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Lokalizacja</div>
                <Input value={evForm.location} onChange={EF('location')} placeholder="np. Warszawa, ul. Marszałkowska 1" className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Notatki</div>
                <Textarea value={evForm.notes} onChange={EF('notes')} rows={2} className="text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900 resize-none"/>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-between">
              {editingEvent
                ? <button onClick={()=>{deleteEvent(editingEvent.id);setShowForm(false);}} className="px-3 py-2 text-sm border border-red-200 text-red-500 hover:bg-red-600 hover:text-white transition-colors">Usuń</button>
                : <div/>}
              <div className="flex gap-2">
                <button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-900">Anuluj</button>
                <button onClick={saveEvent} disabled={!evForm.title.trim()||!evForm.dateStart} className="px-4 py-2 text-sm bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40">Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
