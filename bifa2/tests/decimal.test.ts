import { describe, expect, it } from 'vitest'
import { Dec } from '../shared/utils/decimal'

describe('Dec', () => {
  it('parses and formats without float drift', () => {
    expect(Dec.toFixed(Dec.add(Dec.from('0.1'), Dec.from('0.2')), 2)).toBe('0.30')
    expect(Dec.toFixed(Dec.from('-12.34567'), 4)).toBe('-12.3457')
    expect(Dec.toFixed(Dec.from('7'), 0)).toBe('7')
  })
  it('multiplies and divides with half-away-from-zero rounding', () => {
    expect(Dec.toFixed(Dec.mul(Dec.from('3'), Dec.from('1.33335')), 4)).toBe('4.0001')
    expect(Dec.toFixed(Dec.div(Dec.from('10'), Dec.from('3')), 4)).toBe('3.3333')
    expect(Dec.toFixed(Dec.div(Dec.from('-2'), Dec.from('3')), 4)).toBe('-0.6667')
  })
  it('compares with a tolerance', () => {
    expect(Dec.near(Dec.from('1.005'), Dec.from('1.0149'))).toBe(true)
    expect(Dec.near(Dec.from('1.00'), Dec.from('1.02'))).toBe(false)
  })
  it('rejects invalid input', () => {
    expect(() => Dec.from('1,5')).toThrow()
  })
})
