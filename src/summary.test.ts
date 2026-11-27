import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseAttendanceCsv } from './csv'
import { summarizeWeek } from './summary'
import type { AttendanceRecord } from './types'

const sample = readFileSync(new URL('../fixtures/sample-week.csv', import.meta.url), 'utf8')
const summary = () => summarizeWeek(parseAttendanceCsv(sample).records)

const row = (date: string, clockIn: string, clockOut: string): AttendanceRecord => ({
  employeeId: 'X',
  name: 'ทดสอบ',
  date,
  clockIn,
  clockOut,
})

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
    const result = summarizeWeek([
      row('2026-11-23', '08:00', '16:00'),
      row('2026-11-24', '08:01', '16:00'),
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

  it('ไฟล์ตัวอย่างไม่มีคำเตือน', () => {
    expect(summary().warnings).toEqual([])
  })

  it('ไม่มีเวลาออก: นับเป็นวันทำงาน นับสายได้ แต่ไม่นับชั่วโมง และมีคำเตือน (AC8)', () => {
    const result = summarizeWeek([
      row('2026-11-23', '08:00', '16:00'),
      row('2026-11-24', '08:20', ''),
    ])

    expect(result.employees[0]).toMatchObject({
      workDays: 2,
      totalHours: 8,
      lateCount: 1,
      overtimeHours: 0,
    })
    expect(result.warnings).toEqual([
      { name: 'ทดสอบ', date: '2026-11-24', message: 'ไม่มีเวลาออก ชั่วโมงของวันนี้ไม่ถูกนับ' },
    ])
  })

  it('ไม่มีเวลาเข้า: นับเป็นวันทำงาน แต่ไม่นับชั่วโมง และมีคำเตือน (AC8)', () => {
    const result = summarizeWeek([row('2026-11-23', '', '16:00')])

    expect(result.employees[0]).toMatchObject({ workDays: 1, totalHours: 0, lateCount: 0 })
    expect(result.warnings[0]?.message).toBe('ไม่มีเวลาเข้า ชั่วโมงของวันนี้ไม่ถูกนับ')
  })

  it('ไม่มีทั้งเวลาเข้าและออก: ไม่นับเป็นวันทำงาน (AC8)', () => {
    const result = summarizeWeek([row('2026-11-23', '08:00', '16:00'), row('2026-11-24', '', '')])

    expect(result.employees[0]?.workDays).toBe(1)
    expect(result.warnings).toEqual([])
  })

  it('เวลาออกก่อนเวลาเข้า: ไม่นับชั่วโมง และมีคำเตือน (AC8)', () => {
    const result = summarizeWeek([row('2026-11-23', '16:00', '08:00')])

    expect(result.employees[0]?.totalHours).toBe(0)
    expect(result.warnings[0]?.message).toBe('เวลาออกก่อนเวลาเข้า ชั่วโมงของวันนี้ไม่ถูกนับ')
  })

  it('ลงเวลา 2 รอบในวันเดียว: OT คิดจากชั่วโมงรวมของวัน และนับสายครั้งเดียว (AC9)', () => {
    const result = summarizeWeek([
      row('2026-11-23', '08:30', '12:00'),
      row('2026-11-23', '13:00', '19:00'),
    ])

    expect(result.employees[0]).toMatchObject({
      workDays: 1,
      totalHours: 9.5,
      lateCount: 1,
      overtimeHours: 1.5,
    })
  })

  it('ไฟล์มีข้อมูลเกิน 7 วัน: มีคำเตือน (AC10)', () => {
    const result = summarizeWeek([
      row('2026-11-23', '08:00', '16:00'),
      row('2026-11-30', '08:00', '16:00'),
    ])

    expect(result.warnings).toContainEqual({
      name: '-',
      date: '2026-11-23 ถึง 2026-11-30',
      message: 'ไฟล์มีข้อมูลเกิน 1 สัปดาห์ ตรวจสอบว่าเลือกไฟล์ถูกหรือไม่',
    })
  })
})
