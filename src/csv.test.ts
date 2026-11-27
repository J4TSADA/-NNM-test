import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseAttendanceCsv } from './csv'

const sample = readFileSync(new URL('../fixtures/sample-week.csv', import.meta.url), 'utf8')

describe('parseAttendanceCsv', () => {
  it('อ่านไฟล์ตัวอย่างได้ครบทุกแถว', () => {
    const records = parseAttendanceCsv(sample)

    expect(records).toHaveLength(14)
    expect(records[0]).toEqual({
      employeeId: 'E01',
      name: 'สมใจ',
      date: '2026-11-23',
      clockIn: '08:00',
      clockOut: '16:00',
    })
  })

  it('อ่านไฟล์ที่ Excel export มา (มี BOM และขึ้นบรรทัดแบบ CRLF) ได้', () => {
    const excelCsv = '﻿' + sample.replace(/\n/g, '\r\n')

    expect(parseAttendanceCsv(excelCsv)).toHaveLength(14)
  })

  it('แจ้งเป็นภาษาไทยเมื่อไฟล์ไม่มีคอลัมน์ที่ต้องใช้', () => {
    expect(() => parseAttendanceCsv('id,name\nE01,สมใจ')).toThrow('ไฟล์ไม่มีคอลัมน์')
  })
})
