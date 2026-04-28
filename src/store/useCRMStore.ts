import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Company, ContactHistory, Reminder, CRMUser, PipelineStage, OrgContact, CRMEvent } from '../data/companies';
import { DEFAULT_STAGES } from '../data/companies';

function dbRowToCompany(row: Record<string,unknown>, history: ContactHistory[]=[], reminders: Reminder[]=[], contacts: OrgContact[]=[]): Company {
  return {
    id: row.id as number, company: row.company as string,
    contact: (row.contact as string) ?? '', title: (row.title as string) ?? '',
    phone: (row.phone as string) ?? '', email: (row.email as string) ?? '',
    city: (row.city as string) ?? '', state: (row.state as string) ?? '',
    industry: (row.industry as string) ?? '', revenue: (row.revenue as number) ?? 0,
    employees: (row.employees as string) ?? '', url: (row.url as string) ?? '',
    nip: (row.nip as string) ?? '', regon: (row.regon as string) ?? '',
    notes: (row.notes as string) ?? '',
    status: (row.status as Company['status']) ?? 'lead',
    assignedTo: (row.assigned_to as string) ?? '',
    assignedUserId: (row.assigned_user_id as string) ?? undefined,
    history, reminders, contacts,
  };
}

function dbRowToEvent(row: Record<string,unknown>): CRMEvent {
  return {
    id: row.id as string,
    companyId: row.company_id as number|undefined,
    title: (row.title as string) ?? '',
    type: ((row.type as string) ?? 'spotkanie') as CRMEvent['type'],
    dateStart: (row.date_start as string) ?? '',
    dateEnd: (row.date_end as string) ?? undefined,
    location: (row.location as string) ?? '',
    notes: (row.notes as string) ?? '',
    done: (row.done as boolean) ?? false,
    createdBy: (row.created_by as string) ?? '',
  };
}

interface CRMState {
  companies: Company[]; users: CRMUser[]; stages: PipelineStage[];
  events: CRMEvent[]; currentUser: CRMUser | null; loading: boolean;
  loadData: () => Promise<void>;
  setCurrentUser: (u: CRMUser) => void;
  addCompany: (d: Partial<Company>) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;
  updateCompany: (id: number, d: Partial<Company>) => Promise<void>;
  updateCompanyStatus: (id: number, status: Company['status']) => void;
  addHistory: (companyId: number, entry: ContactHistory) => void;
  addReminder: (companyId: number, r: Reminder) => void;
  toggleReminder: (companyId: number, reminderId: string) => void;
  deleteReminder: (companyId: number, reminderId: string) => void;
  addOrgContact: (companyId: number, c: OrgContact) => Promise<void>;
  updateOrgContact: (companyId: number, c: OrgContact) => Promise<void>;
  deleteOrgContact: (companyId: number, contactId: string) => Promise<void>;
  addEvent: (e: Omit<CRMEvent,'id'>) => Promise<void>;
  updateEvent: (id: string, d: Partial<CRMEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addUser: (d: Partial<CRMUser>) => Promise<void>;
  updateUser: (id: string, d: Partial<CRMUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateStages: (stages: PipelineStage[]) => Promise<void>;
  importCompanies: (rows: Partial<Company>[]) => Promise<{ imported: number; duplicates: { nip: string[]; regon: string[] }; errors: number }>;
}

export const useCRMStore = create<CRMState>()((set, get) => ({
  companies: [], users: [], stages: DEFAULT_STAGES, events: [],
  currentUser: null, loading: true,

  setCurrentUser: (user) => { localStorage.setItem('crm-user-id', user.id); set({ currentUser: user }); },

  loadData: async () => {
    set({ loading: true });
    const [{ data: cos }, { data: hist }, { data: rems }, { data: usrs }, { data: stgs }, { data: ctcs }, { data: evts }] = await Promise.all([
      supabase.from('crm_companies').select('*').order('company'),
      supabase.from('crm_history').select('*').order('created_at', { ascending: false }),
      supabase.from('crm_reminders').select('*').order('date'),
      supabase.from('crm_users').select('*').order('name'),
      supabase.from('crm_settings').select('*'),
      supabase.from('crm_contacts').select('*').order('name'),
      supabase.from('crm_events').select('*').order('date_start'),
    ]);
    const users: CRMUser[] = (usrs ?? []).map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, color: u.color, active: u.active }));
    const stages: PipelineStage[] = stgs?.find(s => s.key === 'pipeline_stages')?.value ?? DEFAULT_STAGES;
    const companies = (cos ?? []).map(row => {
      const history  = (hist ?? []).filter(h => h.company_id === row.id).map(h => ({ id: h.id, type: h.type, date: h.created_at, note: h.note, author: h.author }));
      const reminders = (rems ?? []).filter(r => r.company_id === row.id).map(r => ({ id: r.id, date: r.date, text: r.text, done: r.done }));
      const contacts  = (ctcs ?? []).filter(c => c.company_id === row.id).map(c => ({ id: c.id, name: c.name, title: c.title, phone: c.phone, email: c.email, department: c.department, notes: c.notes }));
      return dbRowToCompany(row, history, reminders, contacts);
    });
    const events: CRMEvent[] = (evts ?? []).map(e => dbRowToEvent(e as Record<string,unknown>));
    const savedId = localStorage.getItem('crm-user-id');
    const currentUser = users.find(u => u.id === savedId) ?? users.find(u => u.role === 'admin') ?? users[0] ?? null;
    set({ companies, users, stages, events, currentUser, loading: false });
  },

  addCompany: async (data) => {
    const row = { company: data.company??'', contact: data.contact??'', title: data.title??'', phone: data.phone??'', email: data.email??'', city: data.city??'', state: data.state??'', industry: data.industry??'', revenue: data.revenue??0, employees: data.employees??'', url: data.url??'', nip: (data as Record<string,unknown>).nip as string??'', regon: (data as Record<string,unknown>).regon as string??'', notes: (data as Record<string,unknown>).notes as string??'', status: data.status??'lead', assigned_to: data.assignedTo??'' };
    const { data: inserted, error } = await supabase.from('crm_companies').insert(row).select().single();
    if (!error && inserted) set(state => ({ companies: [...state.companies, dbRowToCompany(inserted as Record<string,unknown>)] }));
  },

  deleteCompany: async (id) => {
    await supabase.from('crm_companies').delete().eq('id', id);
    set(state => ({ companies: state.companies.filter(c => c.id !== id) }));
  },

  updateCompany: async (id, data) => {
    const dbFields: Record<string,unknown> = {};
    if (data.company    !== undefined) dbFields.company     = data.company;
    if (data.contact    !== undefined) dbFields.contact     = data.contact;
    if (data.title      !== undefined) dbFields.title       = data.title;
    if (data.phone      !== undefined) dbFields.phone       = data.phone;
    if (data.email      !== undefined) dbFields.email       = data.email;
    if (data.city       !== undefined) dbFields.city        = data.city;
    if (data.state      !== undefined) dbFields.state       = data.state;
    if (data.industry   !== undefined) dbFields.industry    = data.industry;
    if (data.revenue    !== undefined) dbFields.revenue     = data.revenue;
    if (data.employees  !== undefined) dbFields.employees   = data.employees;
    if (data.url        !== undefined) dbFields.url         = data.url;
    if ((data as Record<string,unknown>).nip   !== undefined) dbFields.nip   = (data as Record<string,unknown>).nip;
    if ((data as Record<string,unknown>).regon !== undefined) dbFields.regon = (data as Record<string,unknown>).regon;
    if ((data as Record<string,unknown>).notes !== undefined) dbFields.notes = (data as Record<string,unknown>).notes;
    if (data.assignedTo !== undefined) dbFields.assigned_to = data.assignedTo;
    if (data.status     !== undefined) dbFields.status      = data.status;
    await supabase.from('crm_companies').update(dbFields).eq('id', id);
    set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, ...data } : c) }));
  },

  updateCompanyStatus: (id, status) => {
    set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, status } : c) }));
    supabase.from('crm_companies').update({ status }).eq('id', id).then();
  },

  addHistory: (companyId, entry) => {
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, history: [entry, ...c.history] } : c) }));
    supabase.from('crm_history').insert({ id: entry.id, company_id: companyId, type: entry.type, note: entry.note, author: entry.author, created_at: entry.date }).then();
  },

  addReminder: (companyId, r) => {
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, reminders: [...c.reminders, r] } : c) }));
    supabase.from('crm_reminders').insert({ id: r.id, company_id: companyId, text: r.text, date: r.date, done: false }).then();
  },

  toggleReminder: (companyId, reminderId) => {
    const r = get().companies.find(c => c.id === companyId)?.reminders.find(r => r.id === reminderId);
    if (!r) return;
    const done = !r.done;
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, reminders: c.reminders.map(r => r.id === reminderId ? { ...r, done } : r) } : c) }));
    supabase.from('crm_reminders').update({ done }).eq('id', reminderId).then();
  },

  deleteReminder: (companyId, reminderId) => {
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, reminders: c.reminders.filter(r => r.id !== reminderId) } : c) }));
    supabase.from('crm_reminders').delete().eq('id', reminderId).then();
  },

  addOrgContact: async (companyId, contact) => {
    const { error } = await supabase.from('crm_contacts').insert({ id: contact.id, company_id: companyId, name: contact.name, title: contact.title, phone: contact.phone, email: contact.email, department: contact.department, notes: contact.notes });
    if (!error) set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, contacts: [...c.contacts, contact] } : c) }));
  },

  updateOrgContact: async (companyId, contact) => {
    await supabase.from('crm_contacts').update({ name: contact.name, title: contact.title, phone: contact.phone, email: contact.email, department: contact.department, notes: contact.notes }).eq('id', contact.id);
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, contacts: c.contacts.map(x => x.id === contact.id ? contact : x) } : c) }));
  },

  deleteOrgContact: async (companyId, contactId) => {
    await supabase.from('crm_contacts').delete().eq('id', contactId);
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, contacts: c.contacts.filter(x => x.id !== contactId) } : c) }));
  },

  addEvent: async (ev) => {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('crm_events').insert({ id, company_id: ev.companyId ?? null, title: ev.title, type: ev.type, date_start: ev.dateStart, date_end: ev.dateEnd ?? null, location: ev.location, notes: ev.notes, done: false, created_by: ev.createdBy });
    if (!error) set(state => ({ events: [...state.events, { ...ev, id }] }));
  },

  updateEvent: async (id, data) => {
    const db: Record<string,unknown> = {};
    if (data.title     !== undefined) db.title      = data.title;
    if (data.type      !== undefined) db.type       = data.type;
    if (data.dateStart !== undefined) db.date_start = data.dateStart;
    if (data.dateEnd   !== undefined) db.date_end   = data.dateEnd;
    if (data.location  !== undefined) db.location   = data.location;
    if (data.notes     !== undefined) db.notes      = data.notes;
    if (data.done      !== undefined) db.done       = data.done;
    await supabase.from('crm_events').update(db).eq('id', id);
    set(state => ({ events: state.events.map(e => e.id === id ? { ...e, ...data } : e) }));
  },

  deleteEvent: async (id) => {
    await supabase.from('crm_events').delete().eq('id', id);
    set(state => ({ events: state.events.filter(e => e.id !== id) }));
  },

  addUser: async (data) => {
    const { data: row, error } = await supabase.from('crm_users').insert({ name: data.name??'', email: data.email??'', role: data.role??'user', color: data.color??'#6b7280' }).select().single();
    if (!error && row) set(state => ({ users: [...state.users, row as CRMUser] }));
  },

  updateUser: async (id, data) => {
    await supabase.from('crm_users').update(data).eq('id', id);
    set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
  },

  deleteUser: async (id) => {
    await supabase.from('crm_users').delete().eq('id', id);
    set(state => ({ users: state.users.filter(u => u.id !== id) }));
  },

  updateStages: async (stages) => {
    set({ stages });
    await supabase.from('crm_settings').upsert({ key: 'pipeline_stages', value: stages as unknown as Record<string,unknown> });
  },

  importCompanies: async (rows) => {
    const existing = get().companies;
    const dupNips: string[] = [], dupRegons: string[] = [];
    let imported = 0, errors = 0;
    const existingNips   = new Set(existing.map(c => c.nip?.trim()).filter(Boolean));
    const existingRegons = new Set(existing.map(c => c.regon?.trim()).filter(Boolean));
    for (const row of rows) {
      if (!row.company?.trim()) continue;
      const nip   = String((row as Record<string,unknown>).nip   ?? '').trim();
      const regon = String((row as Record<string,unknown>).regon ?? '').trim();
      if (nip && existingNips.has(nip))     { dupNips.push(nip);   continue; }
      if (regon && existingRegons.has(regon)) { dupRegons.push(regon); continue; }
      const newRow = { company: row.company??'', contact: row.contact??'', title: row.title??'', phone: row.phone??'', email: row.email??'', city: row.city??'', state: row.state??'', industry: row.industry??'', revenue: Number(row.revenue)||0, employees: String(row.employees??''), url: row.url??'', nip, regon, notes: String((row as Record<string,unknown>).notes??''), status: 'lead' as const, assigned_to: '' };
      const { data: inserted, error } = await supabase.from('crm_companies').insert(newRow).select().single();
      if (error) {
        if (error.code === '23505') { if (error.message.includes('nip')) dupNips.push(nip); else dupRegons.push(regon); }
        else errors++;
      } else if (inserted) {
        set(state => ({ companies: [...state.companies, dbRowToCompany(inserted as Record<string,unknown>)] }));
        if (nip) existingNips.add(nip);
        if (regon) existingRegons.add(regon);
        imported++;
      }
    }
    return { imported, duplicates: { nip: dupNips, regon: dupRegons }, errors };
  },
}));
