export function formatRevenue(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2).replace('.', ',')} mld €`;
  }
  return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} mln €`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const HISTORY_TYPE_LABELS = {
  notatka: 'Notatka',
  telefon: 'Telefon',
  email: 'E-mail',
  spotkanie: 'Spotkanie',
};

export const HISTORY_TYPE_ICONS: Record<string, string> = {
  notatka: '📝',
  telefon: '📞',
  email: '✉️',
  spotkanie: '🤝',
};
