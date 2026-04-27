import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Company, ContactHistory, Reminder, Role } from '../data/companies';

function dbRowToCompany(row: Record<string, unknown>, history: ContactHistory[] = [], reminders: Reminder[]= []): Company {
  return {
    id: row.id as number,
    company: row.company as string,
    contact: row.contact as string ?? '',
    title: row.title as string ?? '',
    phone: row.phone as string ?? '',
    email: row.email as string ?? '',
    city: row.city as string ?? '',
    state: row.state as string ?? '',
    industry: row.industry as string ?? '',
    revenue: row.revenue as number ?? 0,
    employees: row.employees as string ?? '',
    url: row.url as string ?? '',
    status: row.status as Company['status'],
    assignedTo: row.assigned_to as string ?? '',
    history,
    reminders,
  };
}

interface CRMState {
  companies: Company[];
  role: Role;
  loading: boolean;
  setRole: (role: Role) => void;
  loadData: () => Promise<void>;
  updateCompanyStatus: (id: number, status: Company['status']) => void;
  addHistory: (companyId: number, entry: ContactHistory) => void;
  addReminder: (companyId: number, reminder: Reminder) => void;
  toggleReminder: (companyId: number, reminderId: string) => void;
  deleteReminder: (companyId: number, reminderId: string) => void;
  updateCompany: (id: number, data: Partial<Company>) => void;
}

// Role is kept in localStorage only (it's a UI preference)
const savedRole = (localStorage.getItem('crm-role') as Role) ?? 'Admin';

export const useCRMStore = create<CRMState>()((set, get) => ({
  companies: [],
  role: savedRole,
  loading: true,

  setRole: (role) => {
    localStorage.setItem('crm-role', role);
    set({ role });
  },

  loadData: async () => {
    set({ loading: true });
    // Load companies
    const { data: companiesData } = await supabase.from('crm_companies').select('*').order('id');
    // Load history
    const { data: historyData } = await supabase.from('crm_history').select('*').order('created_at', { ascending: false });
    // Load reminders
    const { data: remindersData } = await supabase.from('crm_reminders').select('*').order('date');

    if (!companiesData) { set({ loading: false }); return; }

    const companies = companiesData.map(row => {
      const history: ContactHistory[] = (historyData ?? [])
        .filter(h => h.company_id === row.id)
        .map(h => ({ id: h.id, type: h.type, date: h.created_at, note: h.note, author: h.author }));
      const reminders: Reminder[] = (remindersData ?? [])
        .filter(r => r.company_id === row.id)
        .map(r => ({ id: r.id, date: r.date, text: r.text, done: r.done }));
      return dbRowToCompany(row, history, reminders);
    });

    set({ companies, loading: false });
  },

  updateCompanyStatus: (id, status) => {
    // Optimistic update
    set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, status } : c) }));
    supabase.from('crm_companies').update({ status, updated_at: new Date().toISOString() }).eq('id', id).then();
  },

  addHistory: (companyId, entry) => {
    set(state => ({
      companies: state.companies.map(c => c.id === companyId ? { ...c, history: [entry, ...c.history] } : c),
    }));
    supabase.from('crm_history').insert({
      id: entry.id, company_id: companyId, type: entry.type, note: entry.note, author: entry.author,
    }).then();
  },

  addReminder: (companyId, reminder) => {
    set(state => ({
      companies: state.companies.map(c => c.id === companyId ? { ...c, reminders: [...c.reminders, reminder] } : c),
    }));
    supabase.from('crm_reminders').insert({
      id: reminder.id, company_id: companyId, text: reminder.text, date: reminder.date, done: false,
    }).then();
  },

  toggleReminder: (companyId, reminderId) => {
    const company = get().companies.find(c => c.id === companyId);
    const reminder = company?.reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    const newDone = !reminder.done;
    set(state => ({
      companies: state.companies.map(c => c.id === companyId
        ? { ...c, reminders: c.reminders.map(r => r.id === reminderId ? { ...r, done: newDone } : r) }
        : c),
    }));
    supabase.from('crm_reminders').update({ done: newDone }).eq('id', reminderId).then();
  },

  deleteReminder: (companyId, reminderId) => {
    set(state => ({
      companies: state.companies.map(c => c.id === companyId
        ? { ...c, reminders: c.reminders.filter(r => r.id !== reminderId) }
        : c),
    }));
    supabase.from('crm_reminders').delete().eq('id', reminderId).then();
  },

  updateCompany: (id, data) => {
    set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, ...data } : c) }));
  },
}));
