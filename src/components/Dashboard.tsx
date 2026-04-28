import { useState, useMemo, useRef } from 'react';
import { useCRMStore } from '../store/useCRMStore';
import type { Company } from '../data/companies';
import { lookupByNIP } from '../lib/gus';

interface DashboardProps { onSelectCompany: (c: Company) => void; }
type SortKey = 'company'|'employees'|'revenue';
type SortDir = 'asc'|'desc';

const STATUS_COLORS: Record<string,string> = {
  lead:'bg-gray-100 text-gray-700', kontakt:'bg-blue-100 text-blue-700',
  oferta:'bg-amber-100 text-amber-700', negocjacje:'bg-purple-100 text-purple-700',
  zamkniety:'bg-emerald-100 text-emerald-700', stracony:'bg-red-100 text-red-700',
};
const PAGE_SIZE = 20;

export function Dashboard({ onSelectCompany }: DashboardProps) {
  const { companies, stages, addCompany, deleteCompany, importCompanies, currentUser } = useCRMStore();
  const [search, setSearch]         = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [sortKey, setSortKey]   = useState<SortKey>('company');
  const [sortDir, setSortDir]   = useState<SortDir>('asc');
  const [page, setPage]         = useState(1);
  const [showAdd, setShowAdd]   = useState(false);
  const [newCo, setNewCo]       = useState<Record<string,string>>({});
  const [confirmDelete, setConfirmDelete] = useState<number|null>(null);
  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: { nip: string[]; regon: string[] }; errors: number }|null>(null);
  const [hideLost, setHideLost] = useState(true);
  const [nipInput, setNipInput] = useState('');
  const [gusLoading, setGusLoading] = useState(false);
  const [gusError, setGusError]   = useState('');
  const csvRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUser?.role === 'admin';

  const visible = isAdmin ? companies : companies.filter(c => !c.assignedTo || c.assignedTo === currentUser?.name);
  const cities     = useMemo(() => ['all',...Array.from(new Set(visible.map(c=>c.city))).filter(Boolean).sort()], [visible]);
  const industries = useMemo(() => ['all',...Array.from(new Set(visible.map(c=>c.industry))).filter(Boolean).sort()], [visible]);

  const filtered = useMemo(() => {
    let r = visible;
    if (hideLost && filterStatus==='all') r = r.filter(c=>c.status!=='stracony');
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      r = r.filter(c =>
        c.company.toLowerCase().includes(q) ||
        (c.contact??'').toLowerCase().includes(q) ||
        (c.nip??'').includes(q) ||
        (c.regon??'').includes(q) ||
        (c.phone??'').replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
        (c.email??'').toLowerCase().includes(q) ||
        (c.city??'').toLowerCase().includes(q)
      );
    }
    if (filterCity !== 'all')     r = r.filter(c=>c.city===filterCity);
    if (filterIndustry !== 'all') r = r.filter(c=>c.industry===filterIndustry);
    if (filterStatus !== 'all')   r = r.filter(c=>c.status===filterStatus);
    return [...r].sort((a,b)=>{
      if (sortKey==='employees') { const va=parseInt(a.employees||'0')||0,vb=parseInt(b.employees||'0')||0; return sortDir==='asc'?va-vb:vb-va; }
      if (sortKey==='revenue')   return sortDir==='asc'?a.revenue-b.revenue:b.revenue-a.revenue;
      return sortDir==='asc'?a.company.localeCompare(b.company,'pl'):b.company.localeCompare(a.company,'pl');
    });
  }, [visible,search,filterCity,filterIndustry,filterStatus,sortKey,sortDir,hideLost]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const toggleSort = (k:SortKey) => { if(sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortKey(k);setSortDir('asc');} setPage(1); };
  const SI = ({k}:{k:SortKey}) => <span className="ml-1 text-[10px] opacity-50">{sortKey===k?(sortDir==='asc'?'↑':'↓'):'↕'}</span>;

  const handleGUSLookup = async () => {
    if (!nipInput.trim()) return;
    setGusLoading(true); setGusError('');
    try {
      const data = await lookupByNIP(nipInput);
      if (data) setNewCo(p => ({ ...p, company: data.name, city: data.city, nip: data.nip, regon: data.regon }));
      else setGusError('Nie znaleziono NIP');
    } catch(e: unknown) { setGusError((e as Error).message); }
    finally { setGusLoading(false); }
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportResult(null);
    const text = await file.text();
    const firstLine = text.split(/\r?\n/)[0];
    const sep = firstLine.includes(';') ? ';' : ',';
    const parseLine = (line: string): string[] => {
      const vals: string[] = []; let cur = '', inQ = false;
      for (const ch of line) { if (ch==='"'){inQ=!inQ;} else if(ch===sep&&!inQ){vals.push(cur.trim().replace(/^"|"$/g,'')); cur='';} else{cur+=ch;} }
      vals.push(cur.trim().replace(/^"|"$/g,''));
      return vals;
    };
    const allLines = text.split(/\r?\n/).filter(l=>l.trim());
    const keywords = ['company','name','nazwa','first','last','telefon','phone','city','miasto','nip'];
    let headerIdx = 0;
    for (let i = 0; i < Math.min(5, allLines.length); i++) {
      if (keywords.filter(k=>allLines[i].toLowerCase().includes(k)).length >= 2) { headerIdx=i; break; }
    }
    const headers = parseLine(allLines[headerIdx]).map(h=>h.toLowerCase().trim());
    const find = (obj: Record<string,string>, ...keys: string[]) => keys.map(k=>obj[k]||'').find(Boolean) || '';
    const rows = allLines.slice(headerIdx+1).map(line => {
      const vals = parseLine(line); const obj: Record<string,string> = {};
      headers.forEach((h,i) => { obj[h] = vals[i]??''; });
      const firstName = find(obj,'first name','imię','first');
      const lastName  = find(obj,'last name','nazwisko','last');
      return {
        company:   find(obj,'company name','company','nazwa','name'),
        contact:   find(obj,'contact','kontakt') || [firstName,lastName].filter(Boolean).join(' '),
        title:     find(obj,'title','stanowisko'),
        phone:     find(obj,'phone','telefon','tel','phone number'),
        email:     find(obj,'company email','email','e-mail'),
        city:      find(obj,'city','miasto'),
        state:     find(obj,'state or province','state','województwo'),
        industry:  find(obj,'industry','branża'),
        employees: find(obj,'employees (total)','employees (single site)','employees','pracownicy'),
        revenue:   Number(find(obj,'revenue','przychód')||0),
        url:       find(obj,'url','www','website'),
        nip:       find(obj,'nip'),
        regon:     find(obj,'regon'),
        notes:     find(obj,'notes','notatki'),
      };
    }).filter(r=>r.company&&r.company.trim()!=='');
    const result = await importCompanies(rows);
    setImportResult(result); setImporting(false);
    if (csvRef.current) csvRef.current.value='';
  };

  const handleAdd = async () => {
    if (!newCo.company?.trim()) return;
    await addCompany({ ...newCo, revenue: Number(newCo.revenue)||0 });
    setNewCo({}); setShowAdd(false);
  };

  const selClass = "h-9 border-2 border-zinc-300 bg-white text-sm px-2 focus:outline-none focus:border-zinc-900 text-zinc-800 font-medium";

  return (
    <div className="flex flex-col h-full">

      {/* Import result banner */}
      {importResult && (
        <div className={`mb-3 px-4 py-2.5 text-sm flex items-start justify-between border-l-4 ${importResult.errors>0?'bg-red-50 border-red-500 text-red-700':'bg-emerald-50 border-emerald-500 text-emerald-800'}`}>
          <div>
            ✅ Zaimportowano: <strong>{importResult.imported}</strong> firm
            {importResult.errors>0 && <span className="ml-3 text-red-600">❌ Błędy: <strong>{importResult.errors}</strong></span>}
            {importResult.duplicates.nip.length>0 && <span className="ml-3 text-amber-700">⚠ Duplikaty NIP: <strong>{importResult.duplicates.nip.length}</strong></span>}
            {importResult.duplicates.regon.length>0 && <span className="ml-3 text-amber-700">⚠ Duplikaty REGON: <strong>{importResult.duplicates.regon.length}</strong></span>}
          </div>
          <button onClick={()=>setImportResult(null)} className="text-zinc-400 hover:text-zinc-700 ml-4">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <input placeholder="Szukaj: nazwa, NIP, REGON, tel, email..." value={search}
            onChange={e=>{setSearch(e.target.value);setPage(1);}}
            className="w-72 h-9 border-2 border-zinc-300 px-3 pl-8 text-sm focus:outline-none focus:border-zinc-900 bg-white"/>
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
          {search && <button onClick={()=>{setSearch('');setPage(1);}} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs">✕</button>}
        </div>

        <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}} className={selClass}>
          <option value="all">📋 Wszystkie statusy</option>
          {stages.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        <select value={filterCity} onChange={e=>{setFilterCity(e.target.value);setPage(1);}} className={selClass}>
          <option value="all">🏙 Wszystkie miasta</option>
          {cities.filter(c=>c!=='all').map(c=><option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterIndustry} onChange={e=>{setFilterIndustry(e.target.value);setPage(1);}} className={selClass}>
          <option value="all">🏭 Wszystkie branże</option>
          {industries.filter(i=>i!=='all').map(i=><option key={i} value={i}>{i}</option>)}
        </select>

        <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 cursor-pointer select-none border-2 border-zinc-300 px-2 h-9 hover:border-zinc-900 transition-colors">
          <input type="checkbox" checked={hideLost} onChange={e=>setHideLost(e.target.checked)} className="accent-zinc-900"/>
          Ukryj stracone
        </label>

        {(search||filterCity!=='all'||filterIndustry!=='all'||filterStatus!=='all') &&
          <button onClick={()=>{setSearch('');setFilterCity('all');setFilterIndustry('all');setFilterStatus('all');setPage(1);}}
            className="h-9 px-3 text-xs border-2 border-zinc-300 text-zinc-600 hover:border-zinc-900 font-medium">Wyczyść</button>}

        <div className="ml-auto flex gap-2">
          <label className={`h-9 px-3 text-xs flex items-center gap-1.5 border-2 cursor-pointer transition-colors font-medium ${importing?'border-zinc-200 text-zinc-300':'border-zinc-300 text-zinc-700 hover:border-zinc-900'}`}>
            ↑ {importing?'Importuję...':'Import CSV'}
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} disabled={importing}/>
          </label>
          <button onClick={()=>setShowAdd(true)} className="h-9 px-3 text-xs bg-zinc-900 text-white hover:bg-zinc-700 font-medium">+ Dodaj firmę</button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}>
          <div className="bg-white w-[580px] shadow-2xl border border-zinc-200">
            <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-widest">Nowa firma</span>
              <button onClick={()=>setShowAdd(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <input value={nipInput} onChange={e=>setNipInput(e.target.value)} placeholder="Wpisz NIP i pobierz dane z GUS..."
                  className="flex-1 h-9 border border-zinc-200 px-3 text-sm focus:outline-none focus:border-zinc-900 font-mono"/>
                <button onClick={handleGUSLookup} disabled={gusLoading}
                  className="h-9 px-4 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {gusLoading?'Szukam...':'Pobierz z GUS'}
                </button>
              </div>
              {gusError && <div className="text-red-500 text-xs mb-3">{gusError}</div>}
              <div className="grid grid-cols-2 gap-3">
                {([['Nazwa firmy *','company'],['Kontakt','contact'],['Stanowisko','title'],['Telefon','phone'],['E-mail','email'],['NIP','nip'],['REGON','regon'],['Miasto','city'],['Województwo','state'],['Branża','industry'],['Pracownicy','employees'],['WWW','url']] as [string,string][]).map(([lbl,key])=>(
                  <div key={key}>
                    <div className="text-xs text-zinc-500 mb-1">{lbl}</div>
                    <input value={newCo[key]??''} onChange={e=>setNewCo(p=>({...p,[key]:e.target.value}))}
                      className="w-full h-8 border border-zinc-200 px-2 text-sm focus:outline-none focus:border-zinc-900"/>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-900">Anuluj</button>
              <button onClick={handleAdd} disabled={!newCo.company?.trim()} className="px-4 py-2 text-sm bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40">Zapisz</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete!==null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-zinc-200 shadow-xl p-6 w-80">
            <div className="font-bold text-zinc-900 mb-1">Usuń firmę?</div>
            <div className="text-sm text-zinc-500 mb-4">Usunie też historię, przypomnienia i kontakty.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setConfirmDelete(null)} className="px-3 py-1.5 text-sm border border-zinc-200 text-zinc-600">Anuluj</button>
              <button onClick={async()=>{await deleteCompany(confirmDelete!);setConfirmDelete(null);}} className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700">USUŃ</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto border border-zinc-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-zinc-900 text-white sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase w-8">#</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">
                <button onClick={()=>toggleSort('company')} className="flex items-center hover:text-zinc-300">Firma <SI k="company"/></button>
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">Kontakt</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">Miasto</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">Branża</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">
                <button onClick={()=>toggleSort('employees')} className="flex items-center hover:text-zinc-300">Pracownicy <SI k="employees"/></button>
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">NIP</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium tracking-widest uppercase">Status</th>
              <th className="px-3 py-2.5 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c, i) => (
              <tr key={c.id} className={`border-b border-zinc-100 hover:bg-blue-50 transition-colors cursor-pointer ${i%2===0?'bg-white':'bg-zinc-50/30'}`}>
                <td className="px-3 py-2 text-zinc-300 text-xs font-mono" onClick={()=>onSelectCompany(c)}>{(page-1)*PAGE_SIZE+i+1}</td>
                <td className="px-3 py-2" onClick={()=>onSelectCompany(c)}>
                  <div className="font-semibold text-zinc-900 leading-tight">{c.company}</div>
                </td>
                <td className="px-3 py-2 text-zinc-600" onClick={()=>onSelectCompany(c)}>
                  {c.contact && <div className="text-sm leading-tight">{c.contact}</div>}
                  {c.phone && <div className="text-xs text-zinc-400">{c.phone}</div>}
                </td>
                <td className="px-3 py-2 text-zinc-600 text-sm" onClick={()=>onSelectCompany(c)}>{c.city||'—'}</td>
                <td className="px-3 py-2 text-zinc-600 text-sm max-w-[160px] truncate" onClick={()=>onSelectCompany(c)}>{c.industry||'—'}</td>
                <td className="px-3 py-2 font-mono text-sm text-zinc-700 text-right" onClick={()=>onSelectCompany(c)}>{c.employees||'—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-400" onClick={()=>onSelectCompany(c)}>{c.nip||'—'}</td>
                <td className="px-3 py-2" onClick={()=>onSelectCompany(c)}>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]??'bg-gray-100 text-gray-700'}`}>
                    {stages.find(s=>s.key===c.status)?.label??c.status}
                  </span>
                </td>
                <td className="px-3 py-2" onClick={e=>e.stopPropagation()}>
                  {isAdmin && <button onClick={()=>setConfirmDelete(c.id)} className="text-xs px-2 py-0.5 border border-red-200 text-red-400 hover:bg-red-600 hover:text-white transition-colors">✕</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageItems.length===0 && <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">Brak wyników</div>}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <span>{filtered.length} firm · strona {page} z {totalPages||1}</span>
        <div className="flex gap-1">
          <button onClick={()=>setPage(1)} disabled={page===1} className="px-2 py-1 border border-zinc-200 hover:border-zinc-900 disabled:opacity-30">«</button>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-2 py-1 border border-zinc-200 hover:border-zinc-900 disabled:opacity-30">‹</button>
          {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
            let p = page<=4 ? i+1 : page+i-3;
            if(p>totalPages) return null;
            return <button key={p} onClick={()=>setPage(p)} className={`px-2.5 py-1 border ${p===page?'bg-zinc-900 text-white border-zinc-900':'border-zinc-200 hover:border-zinc-900'}`}>{p}</button>;
          })}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages||totalPages===0} className="px-2 py-1 border border-zinc-200 hover:border-zinc-900 disabled:opacity-30">›</button>
          <button onClick={()=>setPage(totalPages)} disabled={page===totalPages||totalPages===0} className="px-2 py-1 border border-zinc-200 hover:border-zinc-900 disabled:opacity-30">»</button>
        </div>
      </div>
    </div>
  );
}
