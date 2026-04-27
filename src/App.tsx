import { useState, useEffect } from 'react';
import { useCRMStore } from './store/useCRMStore';
import { ROLES } from './data/companies';
import type { Company } from './data/companies';
import { Dashboard } from './components/Dashboard';
import { Pipeline } from './components/Pipeline';
import { CompanyDrawer } from './components/CompanyDrawer';
import { Calendar } from './components/Calendar';
import { Reports } from './components/Reports';

type View = 'dashboard' | 'pipeline' | 'calendar' | 'reports';

const NAV_ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '◫' },
  { key: 'pipeline', label: 'Pipeline', icon: '▤' },
  { key: 'calendar', label: 'Kalendarz', icon: '▦' },
  { key: 'reports', label: 'Raporty', icon: '▨' },
];

const VIEW_TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  pipeline: 'Pipeline Kanban',
  calendar: 'Kalendarz',
  reports: 'Raporty',
};

export default function App() {
  const { role, setRole, companies, loading, loadData } = useCRMStore();
  const [view, setView] = useState<View>('dashboard');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => { loadData(); }, []);

  const freshCompany = selectedCompany
    ? companies.find(c => c.id === selectedCompany.id) ?? selectedCompany
    : null;

  const totalReminders = companies.reduce((s, c) => s + c.reminders.filter(r => !r.done).length, 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="text-white font-black text-2xl tracking-tight mb-2">CRM</div>
          <div className="text-zinc-500 text-sm">Ładowanie danych...</div>
          <div className="mt-4 w-48 h-0.5 bg-zinc-800 mx-auto overflow-hidden">
            <div className="h-full bg-amber-400 animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden font-sans">
      <aside className="w-52 bg-zinc-950 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-zinc-800">
          <div className="text-white font-black text-lg tracking-tight">CRM</div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5">System sprzedaży</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left ${
                view === item.key
                  ? 'bg-white text-zinc-950 font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {item.key === 'calendar' && totalReminders > 0 && (
                <span className="ml-auto bg-amber-400 text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                  {totalReminders}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 px-1">Rola / Użytkownik</div>
          <div className="space-y-0.5">
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  role === r
                    ? 'bg-amber-400 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {r === 'Admin' ? '⚙ Admin' : r === 'Jan Kowalski' ? '👤 Jan Kowalski' : '👤 Anna Nowak'}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="font-bold text-zinc-900 text-sm uppercase tracking-widest">{VIEW_TITLES[view]}</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadData()}
              className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors px-2 py-1 border border-transparent hover:border-zinc-200"
              title="Odśwież dane"
            >
              ↻ Odśwież
            </button>
            <span className="text-xs text-zinc-400">
              {companies.length} firm · {companies.filter(c => c.status === 'zamkniety').length} zamkniętych
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 text-white text-xs flex items-center justify-center font-bold">
                {role === 'Admin' ? 'A' : role.split(' ').map(w => w[0]).join('')}
              </div>
              <span className="text-sm text-zinc-700 font-medium">{role}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6">
          {view === 'dashboard' && <Dashboard onSelectCompany={setSelectedCompany} />}
          {view === 'pipeline' && <Pipeline onSelectCompany={setSelectedCompany} />}
          {view === 'calendar' && <Calendar onSelectCompany={setSelectedCompany} />}
          {view === 'reports' && <Reports />}
        </div>
      </main>

      {freshCompany && (
        <CompanyDrawer company={freshCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
}
