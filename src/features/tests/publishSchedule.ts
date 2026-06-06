import dayjs from 'dayjs'

export type LiveUntil = 'always' | '1w' | '2w' | '3w' | '1m' | 'custom'

export const LIVE_UNTIL_OPTIONS: { value: LiveUntil; label: string }[] = [
  { value: 'always', label: 'Always Available' },
  { value: '3w', label: '3 Weeks' },
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '2w', label: '2 Weeks' },
  { value: 'custom', label: 'Custom Duration' },
]

/**
 * Resolve the expiry timestamp (ISO) for a "Live Until" choice relative to a
 * base time. Returns null for "always available". `from` is injectable so this
 * is deterministic in tests.
 */
export function resolveExpiry(
  option: LiveUntil,
  opts: { from?: dayjs.ConfigType; customDate?: string; customTime?: string } = {},
): string | null {
  const base = dayjs(opts.from)
  switch (option) {
    case 'always':
      return null
    case '1w':
      return base.add(1, 'week').toISOString()
    case '2w':
      return base.add(2, 'week').toISOString()
    case '3w':
      return base.add(3, 'week').toISOString()
    case '1m':
      return base.add(1, 'month').toISOString()
    case 'custom': {
      if (!opts.customDate) return null
      const combined = dayjs(`${opts.customDate}T${opts.customTime || '23:59'}`)
      return combined.isValid() ? combined.toISOString() : null
    }
  }
}

export function combineDateTime(
  date: string,
  time: string,
): string | null {
  if (!date) return null
  const d = dayjs(`${date}T${time || '00:00'}`)
  return d.isValid() ? d.toISOString() : null
}
