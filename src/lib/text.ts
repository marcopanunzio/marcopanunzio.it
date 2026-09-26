/** Converte il markup minimo dei titoli (`*parola*` → corsivo d'accento) in HTML sicuro. */
export function inline(text = ''): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** Ancora della sezione ricavata dal nome del file: "03-chi-sono" → "chi-sono" */
export function anchor(id: string): string {
  return id.replace(/^\d+[-_]?/, '');
}

export const pad = (n: number) => String(n).padStart(2, '0');
