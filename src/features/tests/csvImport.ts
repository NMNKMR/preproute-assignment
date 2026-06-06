import type { Difficulty } from '@/api/types'
import type { CorrectOption, QuestionDraft } from './questionDraft'

/** The editable fields of a question, as produced by a CSV import. */
export type ImportedQuestion = Omit<QuestionDraft, 'localId' | 'serverId'>

export interface CsvImportResult {
  questions: ImportedQuestion[]
  errors: string[]
}

const REQUIRED_COLUMNS = [
  'question',
  'option1',
  'option2',
  'option3',
  'option4',
  'correct_option',
] as const

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  // flush trailing field/row
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  // drop fully-blank lines
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Accept 1-4, A-D, or option1-4 (case-insensitive). */
function normalizeCorrect(raw: string): CorrectOption | '' {
  const v = raw.trim().toLowerCase()
  if (/^option[1-4]$/.test(v)) return v as CorrectOption
  if (/^[1-4]$/.test(v)) return `option${v}` as CorrectOption
  if (/^[a-d]$/.test(v)) {
    return `option${v.charCodeAt(0) - 96}` as CorrectOption
  }
  return ''
}

function normalizeDifficulty(raw: string): Difficulty | '' {
  const v = raw.trim().toLowerCase()
  if (v === 'easy' || v === 'medium' || v === 'difficult') return v
  if (v === 'hard') return 'difficult'
  return ''
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Convert plain CSV question text into the HTML the rich-text editor stores. */
function toQuestionHtml(text: string): string {
  return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
}

/**
 * Parse a questions CSV into importable drafts. Returns valid rows plus a list
 * of human-readable errors for rows that were skipped.
 */
export function parseQuestionsCsv(text: string): CsvImportResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { questions: [], errors: ['The file is empty.'] }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c))
  if (missing.length > 0) {
    return { questions: [], errors: [`Missing required column(s): ${missing.join(', ')}`] }
  }

  const col = (name: string) => header.indexOf(name)
  const cell = (row: string[], name: string) => {
    const i = col(name)
    return i === -1 ? '' : (row[i] ?? '').trim()
  }

  const questions: ImportedQuestion[] = []
  const errors: string[] = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const lineNo = r + 1
    const question = cell(row, 'question')
    const option1 = cell(row, 'option1')
    const option2 = cell(row, 'option2')
    const option3 = cell(row, 'option3')
    const option4 = cell(row, 'option4')
    const correct = normalizeCorrect(cell(row, 'correct_option'))

    if (!question) {
      errors.push(`Row ${lineNo}: missing question`)
      continue
    }
    if (!option1 || !option2 || !option3 || !option4) {
      errors.push(`Row ${lineNo}: all four options are required`)
      continue
    }
    if (!correct) {
      errors.push(
        `Row ${lineNo}: correct_option must be 1-4, A-D, or option1-4`,
      )
      continue
    }

    questions.push({
      question: toQuestionHtml(question),
      option1,
      option2,
      option3,
      option4,
      correct_option: correct,
      explanation: cell(row, 'explanation'),
      difficulty: normalizeDifficulty(cell(row, 'difficulty')),
      topic: cell(row, 'topic'),
      sub_topic: cell(row, 'sub_topic'),
      media_url: cell(row, 'media_url'),
    })
  }

  return { questions, errors }
}
