import type { AttendanceRecord, ParseResult } from './types'

const REQUIRED_COLUMNS = ['employee_id', 'name', 'date', 'clock_in', 'clock_out'] as const

export function parseAttendanceCsv(text: string): ParseResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')

  const header = (lines[0] ?? '').split(',').map((column) => column.trim())
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    throw new Error(`ไฟล์ไม่มีคอลัมน์: ${missing.join(', ')}`)
  }

  const indexOf = (column: (typeof REQUIRED_COLUMNS)[number]) => header.indexOf(column)

  const records: AttendanceRecord[] = lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim())
    const cell = (column: (typeof REQUIRED_COLUMNS)[number]) => cells[indexOf(column)] ?? ''
    return {
      employeeId: cell('employee_id'),
      name: cell('name'),
      date: cell('date'),
      clockIn: cell('clock_in'),
      clockOut: cell('clock_out'),
    }
  })
  return { records, warnings: [] }
}
