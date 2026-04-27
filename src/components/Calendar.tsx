import { useState } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company } from '../data/companies';

interface CalendarProps {
  onSelectCompany: (company: Company) => void;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const MONTHS_PL = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

export function Calendar({ onSelectCompany }: CalendarProps) {
  const { companies, toggleReminder } = useCRMStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const remindersForDay = (day: Date) => {
    const dateStr = day.toISOString().slice(0, 10);
    const result: Array<{ company: Company; reminderId: string; text: string; done: boolean; time: string }> = [];
    companies.forEach(company => {
      company.reminders.forEach(r => {
        if (r.date.startsWith(dateStr)) {
          result.push({
            company,
            reminderId: r.id,
            text: r.text,
            done: r.done,
            time: r.date.slice(11, 16),
          });
        }
      });
    });
    return result.sort((a, b) => a.time.localeCompare(b.time));
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const totalThisWeek = weekDays.reduce((s, d) => s + remindersForDay(d).length, 0);
  const doneThisWeek = weekDays.reduce((s, d) => s + remindersForDay(d).filter(r => r.done).length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">
            {weekStart.getDate()} {MONTHS_PL[weekStart.getMonth()]} — {weekEnd.getDate()} {MONTHS_PL[weekEnd.getMonth()]} {weekEnd.getFullYear()}
          </h2>
          <div className="text-sm text-zinc-500 mt-0.5">
            {totalThisWeek} przypomnień w tym tygodniu ({doneThisWeek} wykonanych)
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
          >
            Dziś
          </button>
          <button onClick={prevWeek} className="px-3 py-1.5 text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-900 transition-colors">← Wstecz</button>
          <button onClick={nextWeek} className="px-3 py-1.5 text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-900 transition-colors">Dalej →</button>
        </div>
      </div>

      {/* Week grid */}
      <div className="flex-1 grid grid-cols-7 gap-3 overflow-y-auto">
        {weekDays.map((day, i) => {
          const isToday = day.getTime() === today.getTime();
          const isPast = day < today;
          const reminders = remindersForDay(day);

          return (
            <div key={i} className={`flex flex-col border ${isToday ? 'border-zinc-900' : 'border-zinc-200'} bg-white`}>
              {/* Day header */}
              <div className={`px-3 py-2 border-b ${isToday ? 'bg-zinc-900 text-white border-zinc-900' : isPast ? 'bg-zinc-50 border-zinc-200' : 'bg-white border-zinc-200'}`}>
                <div className={`text-xs font-medium uppercase tracking-widest ${isToday ? 'text-zinc-400' : 'text-zinc-500'}`}>{DAYS_PL[i]}</div>
                <div className={`text-xl font-bold font-mono ${isToday ? 'text-white' : isPast ? 'text-zinc-400' : 'text-zinc-900'}`}>{day.getDate()}</div>
              </div>

              {/* Reminders */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                {reminders.length === 0 && (
                  <div className="text-xs text-zinc-200 text-center mt-4">—</div>
                )}
                {reminders.map(r => (
                  <div
                    key={r.reminderId}
                    className={`p-2 text-xs border cursor-pointer transition-all ${r.done ? 'border-zinc-100 bg-zinc-50 opacity-50' : 'border-amber-200 bg-amber-50 hover:border-amber-400'}`}
                  >
                    <div className="flex items-start gap-1.5">
                      <input
                        type="checkbox"
                        checked={r.done}
                        onChange={e => { e.stopPropagation(); toggleReminder(r.company.id, r.reminderId); }}
                        className="mt-0.5 accent-zinc-900 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        {r.time && <div className="font-mono text-zinc-500 text-[10px] mb-0.5">{r.time}</div>}
                        <div className={`leading-tight ${r.done ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>{r.text}</div>
                        <div
                          className="text-[10px] text-zinc-400 mt-1 truncate hover:text-blue-600 cursor-pointer"
                          onClick={() => onSelectCompany(r.company)}
                        >
                          {r.company.company}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
