import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseAttendanceCsv } from './csv'

const sample = readFileSync(new URL('../fixtures/sample-week.csv', import.meta.url), 'utf8')

describe('parseAttendanceCsv', () => {
  it('อ่านไฟล์ตัวอย่างได้ครบทุกแถว', () => {
    const { records, warnings } = parseAttendanceCsv(sample)

    expect(records).toHaveLength(14)
    expect(warnings).toEqual([])
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

    expect(parseAttendanceCsv(excelCsv).records).toHaveLength(14)
  })

  it('อ่านหัวคอลัมน์ภาษาไทยได้', () => {
    const csv = 'รหัสพนักงาน,ชื่อ,วันที่,เวลาเข้า,เวลาออก\nE01,สมใจ,2026-11-23,08:00,16:00'

    expect(parseAttendanceCsv(csv).records[0]).toEqual({
      employeeId: 'E01',
      name: 'สมใจ',
      date: '2026-11-23',
      clockIn: '08:00',
      clockOut: '16:00',
    })
  })

  it('ถ้าไม่มีคอลัมน์รหัส ใช้ชื่อแทนรหัส', () => {
    const csv = 'ชื่อ,วันที่,เวลาเข้า,เวลาออก\nสมใจ,2026-11-23,08:00,16:00'

    expect(parseAttendanceCsv(csv).records[0]?.employeeId).toBe('สมใจ')
  })

  it('แปลงวันที่แบบ วัน/เดือน/ปี ทั้ง ค.ศ. และ พ.ศ. เป็น YYYY-MM-DD', () => {
    const csv = [
      'name,date,clock_in,clock_out',
      'สมใจ,23/11/2026,08:00,16:00',
      'สมใจ,24/11/2569,08:00,16:00',
      'สมใจ,5-1-2027,08:00,16:00',
    ].join('\n')

    expect(parseAttendanceCsv(csv).records.map((r) => r.date)).toEqual([
      '2026-11-23',
      '2026-11-24',
      '2027-01-05',
    ])
  })

  it('แปลงเวลาหลายรูปแบบเป็น HH:mm', () => {
    const csv = [
      'name,date,clock_in,clock_out',
      'สมใจ,2026-11-23,8:05,16.30',
      'สมใจ,2026-11-24,08:00:59,17:00:00',
    ].join('\n')

    expect(parseAttendanceCsv(csv).records.map((r) => [r.clockIn, r.clockOut])).toEqual([
      ['08:05', '16:30'],
      ['08:00', '17:00'],
    ])
  })

  it('อ่านช่องที่มีเครื่องหมายคำพูดและคอมมาข้างในได้', () => {
    const csv = 'employee_id,name,date,clock_in,clock_out\nE01,"ใจดี, สมใจ",2026-11-23,08:00,16:00'

    expect(parseAttendanceCsv(csv).records[0]?.name).toBe('ใจดี, สมใจ')
  })

  it('แถวที่วันที่อ่านไม่ออกไม่ถูกนับ และมีคำเตือน', () => {
    const csv = 'name,date,clock_in,clock_out\nสมใจ,ไม่ทราบ,08:00,16:00\nมาลี,2026-11-23,08:00,16:00'
    const { records, warnings } = parseAttendanceCsv(csv)

    expect(records.map((r) => r.name)).toEqual(['มาลี'])
    expect(warnings).toEqual([{ name: 'สมใจ', date: 'ไม่ทราบ', message: 'อ่านวันที่ไม่ออก แถวนี้ไม่ถูกนับ' }])
  })

  it('แจ้งเป็นภาษาไทยเมื่อไฟล์ไม่มีคอลัมน์ที่ต้องใช้', () => {
    expect(() => parseAttendanceCsv('id,name\nE01,สมใจ')).toThrow('ไฟล์ไม่มีคอลัมน์')
  })

  it('แจ้งเป็นภาษาไทยเมื่อไฟล์มีแต่หัวคอลัมน์', () => {
    expect(() => parseAttendanceCsv('name,date,clock_in,clock_out\n')).toThrow('ไฟล์ไม่มีข้อมูลลงเวลา')
  })
})
