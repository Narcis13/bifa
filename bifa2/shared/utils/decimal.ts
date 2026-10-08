/**
 * Exact decimal arithmetic on strings (MySQL DECIMAL values come back as strings).
 * Values are held as BigInt scaled by 10^scale; no JS floats are involved.
 */

const SCALE = 8
const FACTOR = 10n ** BigInt(SCALE)

/** Parses a decimal string ("-12.3456", "7", "0.5") into a scaled BigInt. */
function dec(value: string | number | bigint | null | undefined): bigint {
  if (value === null || value === undefined || value === '') return 0n
  if (typeof value === 'bigint') return value * FACTOR
  const s = typeof value === 'number' ? numberToPlain(value) : value.trim()
  const m = /^([+-])?(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || (m[2] === '' && (m[3] ?? '') === '')) throw new Error(`Valoare zecimală invalidă: ${value}`)
  const frac = (m[3] ?? '').padEnd(SCALE + 1, '0')
  let n = BigInt(m[2] || '0') * FACTOR + BigInt(frac.slice(0, SCALE))
  if (Number(frac[SCALE]) >= 5) n += 1n // round half away from zero on the 9th digit
  return m[1] === '-' ? -n : n
}

function numberToPlain(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`Număr invalid: ${n}`)
  return n.toFixed(SCALE + 1)
}

/** Rounds a scaled value to `digits` decimals, half away from zero (like MySQL ROUND on DECIMAL). */
function round(v: bigint, digits: number): bigint {
  const unit = 10n ** BigInt(SCALE - digits)
  const half = unit / 2n
  const abs = v < 0n ? -v : v
  const r = ((abs + half) / unit) * unit
  return v < 0n ? -r : r
}

const add = (...vs: bigint[]) => vs.reduce((a, b) => a + b, 0n)
const sub = (a: bigint, b: bigint) => a - b
const mul = (a: bigint, b: bigint) => {
  const p = a * b
  const half = FACTOR / 2n
  return p >= 0n ? (p + half) / FACTOR : -((-p + half) / FACTOR)
}
const div = (a: bigint, b: bigint) => {
  if (b === 0n) throw new Error('Împărțire la zero')
  const p = a * FACTOR
  const neg = (p < 0n) !== (b < 0n)
  const [ap, ab] = [p < 0n ? -p : p, b < 0n ? -b : b]
  const q = (ap + ab / 2n) / ab
  return neg ? -q : q
}

/** Formats a scaled value as a plain decimal string with `digits` decimals (rounded). */
function str(v: bigint, digits = 4): string {
  const r = round(v, digits)
  const neg = r < 0n
  const abs = neg ? -r : r
  const int = abs / FACTOR
  const frac = (abs % FACTOR).toString().padStart(SCALE, '0').slice(0, digits)
  return `${neg && abs !== 0n ? '-' : ''}${int}${digits ? `.${frac}` : ''}`
}

/** True when |a - b| <= tolerance (tolerance as decimal string). */
const near = (a: bigint, b: bigint, tolerance = '0.01') => {
  const d = a - b
  return (d < 0n ? -d : d) <= dec(tolerance)
}

/** Exact decimal helpers, auto-imported in app and server as `Dec`. */
export const Dec = { from: dec, round, add, sub, mul, div, toFixed: str, near }
