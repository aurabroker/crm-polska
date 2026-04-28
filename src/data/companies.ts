export type Status = 'lead' | 'kontakt' | 'oferta' | 'negocjacje' | 'zamkniety' | 'stracony';

export interface ContactHistory {
  id: string; type: 'notatka'|'telefon'|'email'|'spotkanie';
  date: string; note: string; author: string;
}
export interface Reminder {
  id: string; date: string; text: string; done: boolean;
}
export interface OrgContact {
  id: string; name: string; title: string;
  phone: string; email: string; department: string; notes: string;
}
export interface CRMEvent {
  id: string; companyId?: number; title: string;
  type: 'spotkanie'|'call'|'event';
  dateStart: string; dateEnd?: string;
  location: string; notes: string; done: boolean; createdBy: string;
}
export interface CRMUser {
  id: string; name: string; email: string; role: 'admin'|'user'; color: string; active: boolean;
}
export interface PipelineStage {
  key: Status; label: string; color: string;
}
export interface Company {
  id: number; company: string; contact: string; title: string;
  phone: string; email: string; city: string; state: string;
  industry: string; revenue: number; employees: string; url: string;
  nip?: string; regon?: string; notes?: string;
  status: Status; assignedTo?: string; assignedUserId?: string;
  history: ContactHistory[]; reminders: Reminder[]; contacts: OrgContact[];
}

export const DEFAULT_STAGES: PipelineStage[] = [
  { key:'lead',       label:'Lead',       color:'#6b7280' },
  { key:'kontakt',    label:'Kontakt',    color:'#3b82f6' },
  { key:'oferta',     label:'Oferta',     color:'#f59e0b' },
  { key:'negocjacje', label:'Negocjacje', color:'#8b5cf6' },
  { key:'zamkniety',  label:'Zamknięty',  color:'#10b981' },
  { key:'stracony',   label:'Stracony',   color:'#ef4444' },
];

export const DEPARTMENTS = ['HR','Flota','Majątek','Finanse','IT','Zarząd','Sprzedaż','Inne'];
