import dayjs from 'dayjs'

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format('DD MMM YYYY') : '—'
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format('DD MMM YYYY, hh:mm A') : '—'
}
