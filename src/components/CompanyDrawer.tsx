import { useState } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company, ContactHistory, OrgContact } from '../data/companies';
import { DEPARTMENTS } from '../data/companies';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatRevenue, formatDateTime, formatDate, HISTORY_TYPE_LABELS, HISTORY_TYPE_ICONS } from '../lib/utils2';

const STATUS_COLORS: Record<string,string> = {
  lead:'bg-gray-100 text-gray-700', kontakt:'bg-blue-100 text-blue-700',
  oferta:'bg-amber-100 text-amber-700', negocjacje:'bg-purple-100 text-purple-700',
  zamkniety:'bg-emerald-100 text-emerald-700', stracony:'bg-red-100 text-red-700',
};

type Tab = 'info'|'kontakty'|'historia'|'przypomnienia';

export function CompanyDrawer({ company, onClose }: { company: Company; onClose: () => void }) {
  const { stages, addHistory, addReminder, toggleReminder, deleteReminder,
          updateCompanyStatus, updateCompany, addOrgContact, updateOrgContact, deleteOrgContact, currentUser } = useCRMStore();
  const [tab, setTab] = useState<Tab>('info');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company:'', contact:'', title:'', phone:'', email:'', city:'', state:'', industry:'', revenue:'', employees:'', url:'', nip:'', regon:'', notes:'' });

  const startEdit = () => {
    setEditForm({ company: company.company, contact: company.contact, title: company.title, phone: company.phone, email: company.email, city: company.city, state: company.state, industry: company.industry, revenue: String(company.revenue||''), employees: company.employees, url: company.url, nip: company.nip??'', regon: company.regon??'', notes: company.notes??'' });
    setEditing(true);
  };
  const saveEdit = async () => {
    await updateCompany(company.id, { ...editForm, revenue: Number(editForm.revenue)||0 } as Partial<Company>);
    setEditing(false);
  };

  // Org contacts
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<OrgContact|null>(null);
  const [contactForm, setContactForm] = useState({ name:'', title:'', phone:'', email:'', department:'', notes:'' });

  const openContactForm = (c?: OrgContact) => {
    if (c) { setEditingContact(c); setContactForm({ name:c.name, title:c.title, phone:c.phone, email:c.email, department:c.department, notes:c.notes }); }
    else   { setEditingContact(null); setContactForm({ name:'', title:'', phone:'', email:'', department:'', notes:'' }); }
    setShowContactForm(true);
  };
  const saveContact = async () => {
    if (!contactForm.name.trim()) return;
    if (editingContact) {
      await updateOrgContact(company.id, { ...editingContact, ...contactForm });
    } else {
      await addOrgContact(company.id, { id: crypto.randomUUID(), ...contactForm });
    }
    setShowContactForm(false);
  };

  // History
  const [histType, setHistType] = useState<ContactHistory['type']>('notatka');
  const [histNote, setHistNote] = useState('');
  const [histDate, setHistDate] = useState(() => new Date().toISOString().slice(0,16));

  const handleAddHistory = () => {
    if (!histNote.trim()) return;
    const entry: ContactHistory = {
      id: crypto.randomUUID(), type: histType,
      date: new Date(histDate).toISOString(),
      note: histNote.trim(),
      author: currentUser?.name ?? 'Nieznany', // ← zawsze zalogowany użytkownik
    };
    addHistory(company.id, entry);
    setHistNote('');
    setHistDate(new Date().toISOString().slice(0,16));
  };

  // Reminders
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  const handleAddReminder = () => {
    if (!reminderText.trim() || !reminderDate) return;
    addReminder(company.id, { id: crypto.randomUUID(), date: reminderDate, text: reminderText.trim(), done: false });
    setReminderText(''); setReminderDate('');
  };

  const activeReminders = company.reminders.filter(r => !r.done).length;

  const EF = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setEditForm(p => ({ ...p, [k]: e.target.value }));
  const CF = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setContactForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose}/>
      {/* 900px drawer */}
      <div className="w-[900px] bg-white h-full flex flex-col shadow-2xl border-l border-zinc-200">

        {/* Header */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-4">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Karta firmy</div>
              <h2 className="font-bold text-xl leading-tight">{company.company}</h2>
              {company.contact && <div className="text-zinc-400 text-sm mt-0.5">{company.contact}{company.title && ` · ${company.title}`}</div>}
            </div>
            <div className="flex items-center gap-2">
              {!editing && <button onClick={startEdit} className="text-xs px-3 py-1.5 border border-zinc-600 text-zinc-300 hover:border-white hover:text-white transition-colors">✏ Edytuj</button>}
              <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl ml-2">✕</button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={company.status} onValueChange={v => updateCompanyStatus(company.id, v as Company['status'])}>
              <SelectTrigger className={`h-7 w-36 text-xs rounded-none border-0 font-medium ${STATUS_COLORS[company.status]} focus:ring-0`}><SelectValue/></SelectTrigger>
              <SelectContent className="rounded-none">{stages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-zinc-400 text-sm font-mono">{formatRevenue(company.revenue)}</span>
            {company.nip && <span className="text-zinc-500 text-xs font-mono">NIP: {company.nip}</span>}
            {company.regon && <span className="text-zinc-500 text-xs font-mono">REGON: {company.regon}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 flex-shrink-0">
          {(['info','kontakty','historia','przypomnienia'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-medium uppercase tracking-widest transition-colors ${tab===t ? 'bg-white text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
              {t==='kontakty' ? `Kontakty org.${company.contacts.length ? ` (${company.contacts.length})` : ''}`
               : t==='historia' ? `Historia${company.history.length ? ` (${company.history.length})` : ''}`
               : t==='przypomnienia' ? `Przypomnienia${activeReminders ? ` (${activeReminders})` : ''}`
               : 'Informacje'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── INFO / EDYCJA ── */}
          {tab === 'info' && (
            <div className="p-6">
              {editing ? (
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Edycja danych firmy</div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {([['Nazwa firmy','company'],['Kontakt','contact'],['Stanowisko','title'],['Telefon','phone'],['E-mail','email'],['NIP','nip'],['REGON','regon'],['Miasto','city'],['Województwo','state'],['Branża','industry'],['Pracownicy','employees'],['Przychód','revenue'],['WWW','url']] as [string,string][]).map(([lbl,key]) => (
                      <div key={key}>
                        <div className="text-xs text-zinc-500 mb-1">{lbl}</div>
                        <Input value={(editForm as Record<string,string>)[key]} onChange={EF(key)} className="h-8 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                      </div>
                    ))}
                    <div className="col-span-3">
                      <div className="text-xs text-zinc-500 mb-1">Notatki</div>
                      <Textarea value={editForm.notes} onChange={EF('notes')} rows={3} className="text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900 resize-none"/>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-900">Anuluj</button>
                    <button onClick={saveEdit} className="px-4 py-2 text-sm bg-zinc-900 text-white hover:bg-zinc-700">Zapisz zmiany</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <Sec title="Dane firmy">
                      <Row label="Branża"      value={company.industry||'—'}/>
                      <Row label="Miasto"      value={[company.city, company.state].filter(Boolean).join(', ')||'—'}/>
                      <Row label="NIP"         value={company.nip||'—'} mono/>
                      <Row label="REGON"       value={company.regon||'—'} mono/>
                      <Row label="Pracownicy"  value={company.employees||'—'} mono/>
                      <Row label="Przychód"    value={formatRevenue(company.revenue)} mono/>
                      {company.url && <Row label="WWW" value={<a href={company.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-sm">{company.url.replace(/https?:\/\//,'')}</a>}/>}
                    </Sec>
                  </div>
                  <div className="space-y-4">
                    {company.contact && (
                      <Sec title="Główny kontakt">
                        <Row label="Imię i nazwisko" value={company.contact}/>
                        {company.title && <Row label="Stanowisko" value={company.title}/>}
                        {company.phone && <Row label="Telefon" value={<a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">{company.phone}</a>}/>}
                        {company.email && <Row label="E-mail" value={<a href={`mailto:${company.email}`} className="text-blue-600 hover:underline text-xs">{company.email}</a>}/>}
                      </Sec>
                    )}
                    {company.assignedTo && <Sec title="CRM"><Row label="Opiekun" value={company.assignedTo}/></Sec>}
                    {company.notes && (
                      <Sec title="Notatki">
                        <div className="px-3 py-2 text-sm text-zinc-600 whitespace-pre-wrap">{company.notes}</div>
                      </Sec>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── KONTAKTY ORG ── */}
          {tab === 'kontakty' && (
            <div className="p-6">
              {!showContactForm ? (
                <button onClick={() => openContactForm()}
                  className="w-full mb-4 py-2.5 border-2 border-dashed border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors text-sm font-medium">
                  + Dodaj osobę z organizacji
                </button>
              ) : (
                <div className="border border-zinc-200 p-5 bg-zinc-50 mb-4">
                  <div className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4">
                    {editingContact ? 'Edytuj kontakt' : 'Nowy kontakt'}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="col-span-2">
                      <Lbl>Imię i nazwisko *</Lbl>
                      <Input value={contactForm.name} onChange={CF('name')} placeholder="Jan Kowalski" className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                    </div>
                    <div>
                      <Lbl>Stanowisko</Lbl>
                      <Input value={contactForm.title} onChange={CF('title')} placeholder="np. Dyrektor HR" className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                    </div>
                    <div>
                      <Lbl>Dział / odpowiedzialność</Lbl>
                      <select value={contactForm.department} onChange={CF('department')}
                        className="w-full h-9 text-sm border border-zinc-200 px-2 bg-white focus:outline-none focus:border-zinc-900">
                        <option value="">— wybierz —</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <Lbl>Telefon</Lbl>
                      <Input value={contactForm.phone} onChange={CF('phone')} className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                    </div>
                    <div>
                      <Lbl>E-mail</Lbl>
                      <Input value={contactForm.email} onChange={CF('email')} type="email" className="h-9 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                    </div>
                    <div className="col-span-2">
                      <Lbl>Notatki</Lbl>
                      <Textarea value={contactForm.notes} onChange={CF('notes')} rows={2} className="text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900 resize-none"/>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowContactForm(false)} className="px-4 py-2 text-sm border border-zinc-200 text-zinc-600">Anuluj</button>
                    <button onClick={saveContact} disabled={!contactForm.name.trim()} className="px-4 py-2 text-sm bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40">Zapisz</button>
                  </div>
                </div>
              )}
              {company.contacts.length === 0 && !showContactForm && (
                <div className="text-center text-zinc-400 text-sm py-8">Brak dodatkowych kontaktów w organizacji</div>
              )}
              <div className="space-y-2">
                {company.contacts.map(c => (
                  <div key={c.id} className="border border-zinc-200 p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-zinc-900">{c.name}</span>
                          {c.department && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 font-medium">{c.department}</span>}
                        </div>
                        {c.title && <div className="text-xs text-zinc-500 mb-1">{c.title}</div>}
                        <div className="flex gap-4 text-sm">
                          {c.phone && <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline text-xs">{c.phone}</a>}
                          {c.email && <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline text-xs">{c.email}</a>}
                        </div>
                        {c.notes && <div className="text-xs text-zinc-400 mt-1 italic">{c.notes}</div>}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => openContactForm(c)} className="text-xs px-2 py-1 border border-zinc-200 text-zinc-500 hover:border-zinc-900 transition-colors">Edytuj</button>
                        <button onClick={() => deleteOrgContact(company.id, c.id)} className="text-xs px-2 py-1 border border-red-200 text-red-400 hover:bg-red-600 hover:text-white transition-colors">Usuń</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HISTORIA ── */}
          {tab === 'historia' && (
            <div className="p-6">
              <div className="border border-zinc-200 p-4 mb-5 bg-zinc-50">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Dodaj wpis</div>
                <div className="flex gap-1 mb-3">
                  {(['notatka','telefon','email','spotkanie'] as const).map(t => (
                    <button key={t} onClick={() => setHistType(t)}
                      className={`flex-1 py-1.5 text-xs border transition-colors ${histType===t ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-900'}`}>
                      {HISTORY_TYPE_ICONS[t]} {HISTORY_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                {/* Data zdarzenia */}
                <div className="mb-2">
                  <div className="text-xs text-zinc-500 mb-1">Data zdarzenia</div>
                  <Input type="datetime-local" value={histDate} onChange={e => setHistDate(e.target.value)}
                    className="h-8 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                </div>
                <Textarea placeholder="Treść wpisu..." value={histNote} onChange={e => setHistNote(e.target.value)}
                  rows={2} className="text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900 mb-2 resize-none"/>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Autor: <strong>{currentUser?.name ?? '—'}</strong></span>
                  <button onClick={handleAddHistory} disabled={!histNote.trim()}
                    className="px-4 py-1.5 bg-zinc-900 text-white text-sm hover:bg-zinc-700 disabled:opacity-40">Zapisz wpis</button>
                </div>
              </div>
              {company.history.length === 0
                ? <div className="text-center text-zinc-400 text-sm py-8">Brak historii kontaktów</div>
                : <div>{company.history.map((e, i) => (
                    <div key={e.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center text-sm flex-shrink-0">{HISTORY_TYPE_ICONS[e.type]}</div>
                        {i < company.history.length-1 && <div className="w-px flex-1 bg-zinc-200 my-1"/>}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-zinc-700">{HISTORY_TYPE_LABELS[e.type]}</span>
                          <span className="text-xs text-zinc-400">{formatDateTime(e.date)}</span>
                          {e.author && <span className="text-xs text-zinc-400">· {e.author}</span>}
                        </div>
                        <p className="text-sm text-zinc-700 bg-white border border-zinc-100 p-3 whitespace-pre-wrap">{e.note}</p>
                      </div>
                    </div>
                  ))}</div>
              }
            </div>
          )}

          {/* ── PRZYPOMNIENIA ── */}
          {tab === 'przypomnienia' && (
            <div className="p-6">
              <div className="border border-zinc-200 p-4 mb-5 bg-zinc-50">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Nowe przypomnienie</div>
                <Input placeholder="Treść..." value={reminderText} onChange={e => setReminderText(e.target.value)}
                  className="mb-2 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                <Input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                  className="mb-2 text-sm rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-900"/>
                <button onClick={handleAddReminder} disabled={!reminderText.trim()||!reminderDate}
                  className="w-full py-2 bg-zinc-900 text-white text-sm hover:bg-zinc-700 disabled:opacity-40">Dodaj</button>
              </div>
              {company.reminders.length === 0
                ? <div className="text-center text-zinc-400 text-sm py-8">Brak przypomnień</div>
                : <div className="space-y-2">
                    {[...company.reminders].sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime()).map(r => {
                      const isPast = new Date(r.date) < new Date() && !r.done;
                      return (
                        <div key={r.id} className={`flex items-start gap-3 p-3 border ${r.done ? 'border-zinc-100 bg-zinc-50 opacity-60' : isPast ? 'border-red-200 bg-red-50' : 'border-zinc-200 bg-white'}`}>
                          <input type="checkbox" checked={r.done} onChange={() => toggleReminder(company.id, r.id)} className="mt-0.5 accent-zinc-900"/>
                          <div className="flex-1">
                            <div className={`text-sm ${r.done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>{r.text}</div>
                            <div className={`text-xs mt-0.5 ${isPast&&!r.done ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
                              {isPast&&!r.done ? '⚠ Przeterminowane — ' : ''}{formatDate(r.date)}
                            </div>
                          </div>
                          <button onClick={() => deleteReminder(company.id, r.id)} className="text-zinc-300 hover:text-red-500 text-sm">✕</button>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-1.5">{title}</div>
      <div className="border border-zinc-100 divide-y divide-zinc-100">{children}</div>
    </div>
  );
}
function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start px-3 py-2 gap-2">
      <span className="text-xs text-zinc-400 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-zinc-800 flex-1 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
function Lbl({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-zinc-500 mb-1">{children}</div>;
}
