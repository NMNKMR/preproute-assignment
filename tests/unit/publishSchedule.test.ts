import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { combineDateTime, resolveExpiry } from '@/features/tests/publishSchedule'

describe('resolveExpiry', () => {
  const from = '2026-01-01T00:00:00.000Z'

  it('returns null for always-available', () => {
    expect(resolveExpiry('always', { from })).toBeNull()
  })

  it('adds the right offsets for fixed durations', () => {
    expect(resolveExpiry('1w', { from })).toBe(
      dayjs(from).add(1, 'week').toISOString(),
    )
    expect(resolveExpiry('2w', { from })).toBe(
      dayjs(from).add(2, 'week').toISOString(),
    )
    expect(resolveExpiry('3w', { from })).toBe(
      dayjs(from).add(3, 'week').toISOString(),
    )
    expect(resolveExpiry('1m', { from })).toBe(
      dayjs(from).add(1, 'month').toISOString(),
    )
  })

  it('uses the custom date/time when provided', () => {
    const result = resolveExpiry('custom', {
      from,
      customDate: '2026-03-10',
      customTime: '14:30',
    })
    expect(dayjs(result).isValid()).toBe(true)
    expect(dayjs(result).format('YYYY-MM-DD HH:mm')).toBe('2026-03-10 14:30')
  })

  it('returns null for custom without a date', () => {
    expect(resolveExpiry('custom', { from })).toBeNull()
  })
})

describe('combineDateTime', () => {
  it('combines date and time into ISO', () => {
    const iso = combineDateTime('2026-05-01', '09:00')
    expect(dayjs(iso).format('YYYY-MM-DD HH:mm')).toBe('2026-05-01 09:00')
  })

  it('returns null without a date', () => {
    expect(combineDateTime('', '09:00')).toBeNull()
  })
})
