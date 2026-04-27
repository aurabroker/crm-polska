import { useState } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company, ContactHistory, Reminder } from '../data/companies';
import { PIPELINE_STAGES } from '../data/companies';

import { formatRevenue, formatDateTime, formatDate, HISTORY_TYPE_LABELS, HISTORY_TYPE_ICONS } from '../lib/utils2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CompanyDrawerProps {
  company: Company;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  kontakt: 'bg-blue-100 text-blue-700',
  oferta: 'bg-amber-100 text-amber-700',
  negocjacje: 'bg-purple-100 text-purple-700',
  zamkniety: 'bg-emerald-100 text-emerald-700',
  stracony: 'bg-red-100 text-red-700',
};

export function CompanyDrawer({ company, onClose }: CompanyDrawerProps) {
  const { addHistory, addReminder, toggleReminder, deleteReminder, updateCompanyStatus } = useCRMStore();
  const [tab, setTab] = useState<'info' | 'historia' | 'przypomnienia'>('info');
  const [histType, setHistType] = useState<ContactHistory['type']>('notatka');
  const [histNote, setHistNote] = useState('');
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  const handleAddHistory = () => {
    if (!histNote.trim()) return;
    const entry: ContactHistory = {
      id: crypto.randomUUID(),
      type: histType,
      date: new Date().toISOString(),
      note: histNote.trim(),
      author: 'Jan Kowalski',
    };
    addHistory(company.id, entry);
    setHistNote('');
  };

  const handleAddReminder = () => {
    if (!reminderText.trim() || !reminderDate) return;
    const r: Reminder = {
      id: crypto.randomUUID(),
      date: reminderDate,
      text: reminderText.trim(),
      done: false,
    };
    addReminder(company.id, r);
    setReminderText('');
    setReminderDate('');
  };

  const activeReminders = company.reminders.filter(r => !r.done).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[520px] bg-white h-full flex flex-col shadow-2xl border-l border-zinc-200">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-4">
              <div className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Karta firmy</div>
              <h2 className="font-bold text-lg leading-tight">{company.company}</h2>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none mt-1">✕</button>
          </div>
          <div className="flex items-center gap-3">
            <Select value={company.status} onValueChange={v => updateCompanyStatus(company.id, v as any)}>
              <SelectTrigger className={`h-7 w-36 text-xs rounded-none border-0 font-medium ${STATUS_COLORS[company.status]} focus:ring-0`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {PIPELINE_STAGES.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-zinc-400 text-sm font-mono">{formatRevenue(company.revenue)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50">
          {(['info', 'historia', 'przypomnienia'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-medium uppercase tracking-widest transition-colors ${tab === t ? 'bg-white text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              {t === 'historia' ? `Historia` : t === 'przypomnienia' ? `Przypomnienia${activeReminders ? ` (${activeReminders})` : ''}` : 'Informacje'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'info' && (
            <div className="p-5 space-y-4">
              <Section title="Dane firmy">
                <Row label="Branża" value={company.industry} />
                <Row label="Miasto" value={`${company.city}, ${company.state}`} />
                <Row label="Przychód" value={formatRevenue(company.revenue)} mono />
                <Row label="Pracownicy" value={company.employees || '—'} mono />
                <Row label="WWW" value={company.url ? <a href={company.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-sm">{company.url.replace('http://', '')}</a> : '—'} />
              </Section>
              {company.contact && (
                <Section title="Kontakt">
                  <Row label="Imię i nazwisko" value={company.contact} />
                  {company.title && <Row label="Stanowisko" value={company.title} />}
                  {company.phone && <Row label="Telefon" value={<a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">{company.phone}</a>} />}
                  {company.email && <Row label="E-mail" value={<a href={`mailto:${company.email}`} className="text-blue-600 hover:underline text-sm">{company.email}</a>} />}
                </Section>
              )}
              {company.assignedTo && (
                <Section title="CRM">
                  <Row label="Opiekun" value={company.assignedTo} />
                </Section>
              )}
            </div>
          )}

          {tab === 'historia' && (
            <div className="p-5">
              {/* Add history entry */}
              <div className="border border-zinc-200 p-4 mb-6 bg-zinc-50">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Dodaj wpis</div>
                <div className="flex gap-2 mb-3">
                  {(['notatka', 'telefon', 'email', 'spotkanie'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setHistType(t)}
                      className={`flex-1 py-1.5 text-xs border transition-colors ${histType === t ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-900'}`}
                    >
                      {HISTORY_TYPE_ICONS[t]} {HISTORY_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Treść wpisu..."
                  value={histNote}
                  onChange={e => setHistNote(e.target.value)}
                  rows={2}
                  className="text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900 mb-2 resize-none"
                />
                <button
                  onClick={handleAddHistory}
                  disabled={!histNote.trim()}
                  className="w-full py-2 bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Zapisz wpis
                </button>
              </div>

              {/* Timeline */}
              {company.history.length === 0 ? (
                <div className="text-center text-zinc-400 text-sm py-8">Brak historii kontaktów</div>
              ) : (
                <div className="space-y-0">
                  {company.history.map((entry, i) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center text-sm flex-shrink-0">
                          {HISTORY_TYPE_ICONS[entry.type]}
                        </div>
                        {i < company.history.length - 1 && <div className="w-px flex-1 bg-zinc-200 my-1" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-zinc-700">{HISTORY_TYPE_LABELS[entry.type]}</span>
                          <span className="text-xs text-zinc-400">{formatDateTime(entry.date)}</span>
                        </div>
                        <p className="text-sm text-zinc-700 bg-white border border-zinc-100 p-3">{entry.note}</p>
                        <div className="text-xs text-zinc-400 mt-1">— {entry.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'przypomnienia' && (
            <div className="p-5">
              {/* Add reminder */}
              <div className="border border-zinc-200 p-4 mb-6 bg-zinc-50">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Nowe przypomnienie</div>
                <Input
                  placeholder="Treść przypomnienia..."
                  value={reminderText}
                  onChange={e => setReminderText(e.target.value)}
                  className="mb-2 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"
                />
                <Input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  className="mb-2 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"
                />
                <button
                  onClick={handleAddReminder}
                  disabled={!reminderText.trim() || !reminderDate}
                  className="w-full py-2 bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Dodaj przypomnienie
                </button>
              </div>

              {/* Reminders list */}
              {company.reminders.length === 0 ? (
                <div className="text-center text-zinc-400 text-sm py-8">Brak przypomnień</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Aktywne</div>
                  {company.reminders.filter(r => !r.done).map(r => (
                    <ReminderCard key={r.id} reminder={r} companyId={company.id} onToggle={toggleReminder} onDelete={deleteReminder} />
                  ))}
                  {company.reminders.some(r => r.done) && (
                    <>
                      <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-4 mb-3">Wykonane</div>
                      {company.reminders.filter(r => r.done).map(r => (
                        <ReminderCard key={r.id} reminder={r} companyId={company.id} onToggle={toggleReminder} onDelete={deleteReminder} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">{title}</div>
      <div className="border border-zinc-100 divide-y divide-zinc-100">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center px-3 py-2">
      <span className="text-xs text-zinc-400 w-32 flex-shrink-0">{label}</span>
      <span className={`text-sm text-zinc-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function ReminderCard({
  reminder, companyId, onToggle, onDelete
}: {
  reminder: Reminder;
  companyId: number;
  onToggle: (cId: number, rId: string) => void;
  onDelete: (cId: number, rId: string) => void;
}) {
  const isPast = new Date(reminder.date) < new Date() && !reminder.done;
  return (
    <div className={`flex items-start gap-3 p-3 border ${reminder.done ? 'border-zinc-100 bg-zinc-50 opacity-60' : isPast ? 'border-red-200 bg-red-50' : 'border-zinc-200 bg-white'}`}>
      <input
        type="checkbox"
        checked={reminder.done}
        onChange={() => onToggle(companyId, reminder.id)}
        className="mt-0.5 accent-zinc-900"
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${reminder.done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>{reminder.text}</div>
        <div className={`text-xs mt-0.5 ${isPast && !reminder.done ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
          {isPast && !reminder.done ? '⚠ Przeterminowane — ' : ''}{formatDate(reminder.date)}
        </div>
      </div>
      <button onClick={() => onDelete(companyId, reminder.id)} className="text-zinc-300 hover:text-red-500 text-sm">✕</button>
    </div>
  );
}
