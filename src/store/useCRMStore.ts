import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Company, ContactHistory, Reminder, CRMUser, PipelineStage } from '../data/companies';
import { DEFAULT_STAGES } from '../data/companies';

function dbRowToCompany(row: Record<string,unknown>, history: ContactHistory[]=[], reminders: Reminder[]=[]): Company {
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
    history, reminders,
  };
}

interface CRMState {
  companies: Company[];
  users: CRMUser[];
  stages: PipelineStage[];
  currentUser: CRMUser | null;
  loading: boolean;
  loadData: () => Promise<void>;
  setCurrentUser: (user: CRMUser) => void;
  // Company CRUD
  addCompany: (data: Partial<Company>) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;
  updateCompanyStatus: (id: number, status: Company['status']) => void;
  updateCompany: (id: number, data: Partial<Company>) => void;
  // History & Reminders
  addHistory: (companyId: number, entry: ContactHistory) => void;
  addReminder: (companyId: number, reminder: Reminder) => void;
  toggleReminder: (companyId: number, reminderId: string) => void;
  deleteReminder: (companyId: number, reminderId: string) => void;
  // Users
  addUser: (data: Partial<CRMUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<CRMUser>) => Promise<void>;
  // Stages
  updateStages: (stages: PipelineStage[]) => Promise<void>;
  // CSV Import
  importCompanies: (rows: Partial<Company>[]) => Promise<{ imported: number; duplicates: { nip: string[]; regon: string[] }; errors: number }>;
}

export const useCRMStore = create<CRMState>()((set, get) => ({
  companies: [], users: [], stages: DEFAULT_STAGES,
  currentUser: null, loading: true,

  setCurrentUser: (user) => {
    localStorage.setItem('crm-user-id', user.id);
    set({ currentUser: user });
  },

  loadData: async () => {
    set({ loading: true });
    const [{ data: companiesData }, { data: historyData }, { data: remindersData }, { data: usersData }, { data: settingsData }] = await Promise.all([
      supabase.from('crm_companies').select('*').order('company'),
      supabase.from('crm_history').select('*').order('created_at', { ascending: false }),
      supabase.from('crm_reminders').select('*').order('date'),
      supabase.from('crm_users').select('*').order('name'),
      supabase.from('crm_settings').select('*'),
    ]);

    const users: CRMUser[] = (usersData ?? []).map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role, color: u.color, active: u.active,
    }));

    const stages: PipelineStage[] = settingsData?.find(s => s.key === 'pipeline_stages')?.value ?? DEFAULT_STAGES;

    const companies = (companiesData ?? []).map(row => {
      const history = (historyData ?? []).filter(h => h.company_id === row.id)
        .map(h => ({ id: h.id, type: h.type, date: h.created_at, note: h.note, author: h.author }));
      const reminders = (remindersData ?? []).filter(r => r.company_id === row.id)
        .map(r => ({ id: r.id, date: r.date, text: r.text, done: r.done }));
      return dbRowToCompany(row, history, reminders);
    });

    const savedUserId = localStorage.getItem('crm-user-id');
    const currentUser = users.find(u => u.id === savedUserId) ?? users.find(u => u.role === 'admin') ?? users[0] ?? null;

    set({ companies, users, stages, currentUser, loading: false });
  },

  addCompany: async (data) => {
    const maxId = Math.max(0, ...get().companies.map(c => c.id));
    const newId = maxId + 1;
    const row = {
      id: newId, company: data.company ?? '', contact: data.contact ?? '',
      title: data.title ?? '', phone: data.phone ?? '', email: data.email ?? '',
      city: data.city ?? '', state: data.state ?? '', industry: data.industry ?? '',
      revenue: data.revenue ?? 0, employees: data.employees ?? '',
      url: data.url ?? '', status: data.status ?? 'lead',
      assigned_to: data.assignedTo ?? '',
    };
    const { error } = await supabase.from('crm_companies').insert(row);
    if (!error) {
      set(state => ({ companies: [...state.companies, dbRowToCompany(row)] }));
    }
  },

  deleteCompany: async (id) => {
    await supabase.from('crm_companies').delete().eq('id', id);
    set(state => ({ companies: state.companies.filter(c => c.id !== id) }));
  },

  updateCompanyStatus: (id, status) => {
    set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, status } : c) }));
    supabase.from('crm_companies').update({ status, updated_at: new Date().toISOString() }).eq('id', id).then();
  },

  updateCompany: (id, data) => {
    set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, ...data } : c) }));
  },

  addHistory: (companyId, entry) => {
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, history: [entry, ...c.history] } : c) }));
    supabase.from('crm_history').insert({ id: entry.id, company_id: companyId, type: entry.type, note: entry.note, author: entry.author }).then();
  },

  addReminder: (companyId, reminder) => {
    set(state => ({ companies: state.companies.map(c => c.id === companyId ? { ...c, reminders: [...c.reminders, reminder] } : c) }));
    supabase.from('crm_reminders').insert({ id: reminder.id, company_id: companyId, text: reminder.text, date: reminder.date, done: false }).then();
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

  addUser: async (data) => {
    const { data: row, error } = await supabase.from('crm_users').insert({
      name: data.name ?? '', email: data.email ?? '', role: data.role ?? 'user', color: data.color ?? '#6b7280',
    }).select().single();
    if (!error && row) {
      set(state => ({ users: [...state.users, row as CRMUser] }));
    }
  },

  deleteUser: async (id) => {
    await supabase.from('crm_users').delete().eq('id', id);
    set(state => ({ users: state.users.filter(u => u.id !== id) }));
  },

  updateUser: async (id, data) => {
    await supabase.from('crm_users').update(data).eq('id', id);
    set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
  },

  updateStages: async (stages) => {
    set({ stages });
    await supabase.from('crm_settings').upsert({ key: 'pipeline_stages', value: stages as unknown as Record<string,unknown>, updated_at: new Date().toISOString() });
  },

  importCompanies: async (rows) => {
    const existing   = get().companies;
    const dupNips:   string[] = [];
    const dupRegons: string[] = [];
    let imported = 0, errors = 0;

    // Build lookup sets from existing data
    const existingNips   = new Set(existing.map(c => c.nip?.trim()).filter(Boolean));
    const existingRegons = new Set(existing.map(c => c.regon?.trim()).filter(Boolean));

    for (const row of rows) {
      if (!row.company?.trim()) continue;

      const nip   = String((row as Record<string,unknown>).nip   ?? '').trim();
      const regon = String((row as Record<string,unknown>).regon ?? '').trim();

      // Check duplicates BEFORE insert
      if (nip && existingNips.has(nip)) {
        dupNips.push(nip);
        continue;
      }
      if (regon && existingRegons.has(regon)) {
        dupRegons.push(regon);
        continue;
      }

      const maxId = Math.max(0, ...get().companies.map(c => c.id));
      const newRow = {
        id: maxId + 1,
        company:     row.company ?? '',
        contact:     row.contact ?? '',
        title:       row.title ?? '',
        phone:       row.phone ?? '',
        email:       row.email ?? '',
        city:        row.city ?? '',
        state:       row.state ?? '',
        industry:    row.industry ?? '',
        revenue:     Number(row.revenue) || 0,
        employees:   String(row.employees ?? ''),
        url:         row.url ?? '',
        nip,
        regon,
        notes:       String((row as Record<string,unknown>).notes ?? ''),
        status:      'lead' as const,
        assigned_to: '',
      };

      const { error } = await supabase.from('crm_companies').insert(newRow);
      if (error) {
        // Catch DB-level unique constraint violation (safety net)
        if (error.code === '23505') {
          if (error.message.includes('nip'))   dupNips.push(nip);
          if (error.message.includes('regon')) dupRegons.push(regon);
        } else {
          errors++;
        }
      } else {
        set(state => ({ companies: [...state.companies, dbRowToCompany(newRow)] }));
        if (nip)   existingNips.add(nip);
        if (regon) existingRegons.add(regon);
        imported++;
      }
    }

    return { imported, duplicates: { nip: dupNips, regon: dupRegons }, errors };
  },
}));
