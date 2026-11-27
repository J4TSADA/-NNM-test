import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseAttendanceCsv } from './csv'
import { summarizeWeek } from './summary'

const sample = readFileSync(new URL('../fixtures/sample-week.csv', import.meta.url), 'utf8')
const summary = () => summarizeWeek(parseAttendanceCsv(sample))

describe('summarizeWeek', () => {
  it('สรุปครบทุกคนในไฟล์ (AC1)', () => {
    expect(summary().employees.map((e) => e.name)).toEqual(['สมใจ', 'มาลี', 'บุญมี'])
  })

  it('ค่าของแต่ละคนตรงกับที่คำนวณมือ (AC2–AC5)', () => {
    expect(summary().employees).toEqual([
      {
        employeeId: 'E01',
        name: 'สมใจ',
        workDays: 5,
        totalHours: 43,
        lateCount: 2,
        overtimeHours: 3,
      },
      {
        employeeId: 'E02',
        name: 'มาลี',
        workDays: 4,
        totalHours: 33,
        lateCount: 0,
        overtimeHours: 1,
      },
      {
        employeeId: 'E03',
        name: 'บุญมี',
        workDays: 5,
        totalHours: 37.5,
        lateCount: 3,
        overtimeHours: 0.5,
      },
    ])
  })

  it('เข้างานตรง 08:00 พอดีไม่นับว่าสาย แต่ 08:01 นับว่าสาย (AC4)', () => {
    const base = { employeeId: 'X', name: 'ทดสอบ', clockOut: '16:00' }
    const result = summarizeWeek([
      { ...base, date: '2026-11-23', clockIn: '08:00' },
      { ...base, date: '2026-11-24', clockIn: '08:01' },
    ])

    expect(result.employees[0]?.lateCount).toBe(1)
  })

  it('มีภาพรวม 3 บรรทัด (AC6)', () => {
    expect(summary().overview).toEqual([
      'พนักงาน 3 คน ทำงานรวม 113.5 ชั่วโมง (2026-11-23 ถึง 2026-11-28)',
      'มาสายรวม 5 ครั้ง คนที่มาสายบ่อยที่สุดคือ บุญมี (3 ครั้ง)',
      'OT รวม 4.5 ชั่วโมง คนที่ทำ OT มากที่สุดคือ สมใจ (3 ชั่วโมง)',
    ])
  })

  it('สรุปไฟล์เดิมซ้ำได้ผลเหมือนเดิมทุกครั้ง (AC7)', () => {
    expect(summary()).toEqual(summary())
  })
})
