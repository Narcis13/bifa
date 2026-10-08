const nf = new Map<number, Intl.NumberFormat>()

/** ro-RO number formatting, display only (values stay decimal strings everywhere else). */
export function fmtNum(value: string | number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || value === '') return ''
  let f = nf.get(digits)
  if (!f) {
    f = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    nf.set(digits, f)
  }
  return f.format(Number(value))
}

/** 'YYYY-MM-DD' -> 'DD.MM.YYYY' */
export function fmtData(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}

/** Date -> 'YYYY-MM-DD' in local time. */
export function isoData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' -> local Date (for DatePicker). */
export function dinIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
