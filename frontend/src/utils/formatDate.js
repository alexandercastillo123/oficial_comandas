export function formatTime(dateInput) {
  if (!dateInput) return '';
  
  // Si ya es un string que solo es hora como "05:00:00" o "08:00", extraer las primeras 5 letras "HH:MM"
  if (typeof dateInput === 'string' && !dateInput.includes('-') && !dateInput.includes('T')) {
    const parts = dateInput.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }

  const d = toUtcDate(dateInput);
  return d.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = toUtcDate(dateInput);
  return d.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function toUtcDate(input) {
  if (input instanceof Date) return new Date(input.getTime());
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:.\d+/.test(str)) return new Date(str + 'Z');
  const normalized = str.replace(' ', 'T');
  return new Date(normalized + 'Z');
}
