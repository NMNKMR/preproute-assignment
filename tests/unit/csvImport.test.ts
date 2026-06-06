import { describe, expect, it } from 'vitest'
import { parseCsv, parseQuestionsCsv } from '@/features/tests/csvImport'

const HEADER =
  'question,option1,option2,option3,option4,correct_option,explanation,difficulty,topic,sub_topic'

describe('parseCsv', () => {
  it('parses quoted fields containing commas and escaped quotes', () => {
    const rows = parseCsv('a,"b,c","she said ""hi"""\n1,2,3')
    expect(rows[0]).toEqual(['a', 'b,c', 'she said "hi"'])
    expect(rows[1]).toEqual(['1', '2', '3'])
  })

  it('ignores blank lines and trailing newlines', () => {
    const rows = parseCsv('a,b\n\n1,2\n')
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('parseQuestionsCsv', () => {
  it('parses valid rows and normalizes correct_option (digit / letter / option)', () => {
    const csv = [
      HEADER,
      '"What is 2 + 2?",3,4,5,6,2,Adds up,easy,Dice,Games',
      '"Capital of France?",Berlin,Madrid,Paris,Rome,C,,medium,,',
      '"Pick D",a,b,c,d,option4,,hard,,',
    ].join('\n')

    const { questions, errors } = parseQuestionsCsv(csv)
    expect(errors).toEqual([])
    expect(questions).toHaveLength(3)
    expect(questions[0]).toMatchObject({
      question: '<p>What is 2 + 2?</p>',
      option2: '4',
      correct_option: 'option2',
      explanation: 'Adds up',
      difficulty: 'easy',
      topic: 'Dice',
      sub_topic: 'Games',
    })
    expect(questions[1].correct_option).toBe('option3') // C
    expect(questions[2].correct_option).toBe('option4')
    expect(questions[2].difficulty).toBe('difficult') // hard -> difficult
  })

  it('errors when required columns are missing', () => {
    const { questions, errors } = parseQuestionsCsv('question,option1\nhi,a')
    expect(questions).toHaveLength(0)
    expect(errors[0]).toMatch(/missing required column/i)
  })

  it('skips invalid rows with descriptive errors', () => {
    const csv = [
      HEADER,
      '"Good?",a,b,c,d,1,,,,',
      '"No correct",a,b,c,d,9,,,,',
      '"Missing option",a,b,,d,1,,,,',
      ',a,b,c,d,1,,,,',
    ].join('\n')

    const { questions, errors } = parseQuestionsCsv(csv)
    expect(questions).toHaveLength(1)
    expect(errors).toHaveLength(3)
    expect(errors[0]).toMatch(/row 3.*correct_option/i)
    expect(errors[1]).toMatch(/row 4.*options/i)
    expect(errors[2]).toMatch(/row 5.*question/i)
  })

  it('escapes HTML in the question text', () => {
    const csv = [HEADER, '"<b>x</b> & y",a,b,c,d,1,,,,'].join('\n')
    const { questions } = parseQuestionsCsv(csv)
    expect(questions[0].question).toBe('<p>&lt;b&gt;x&lt;/b&gt; &amp; y</p>')
  })

  it('reports an empty file', () => {
    expect(parseQuestionsCsv('').errors[0]).toMatch(/empty/i)
  })
})
