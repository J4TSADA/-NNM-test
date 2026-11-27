import type { AttendanceRecord, ParseResult, RowWarning } from './types'

type Column = 'employee_id' | 'name' | 'date' | 'clock_in' | 'clock_out'

const COLUMN_ALIASES: Record<Column, string[]> = {
  employee_id: ['employee_id', 'emp_id', 'id', 'รหัส', 'รหัสพนักงาน'],
  name: ['name', 'employee_name', 'ชื่อ', 'ชื่อพนักงาน', 'ชื่อ-สกุล', 'ชื่อ-นามสกุล'],
  date: ['date', 'วันที่'],
  clock_in: ['clock_in', 'time_in', 'check_in', 'เวลาเข้า', 'เข้างาน'],
  clock_out: ['clock_out', 'time_out', 'check_out', 'เวลาออก', 'ออกงาน'],
}

const BOM = String.fromCharCode(0xfeff)

const REQUIRED: Column[] = ['name', 'date', 'clock_in', 'clock_out']

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

const pad2 = (value: number) => String(value).padStart(2, '0')

export function normalizeDate(raw: string): string {
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  const parts = iso
    ? { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    : dmy
      ? { year: Number(dmy[3]), month: Number(dmy[2]), day: Number(dmy[1]) }
      : undefined
  if (!parts) return ''

  const year = parts.year > 2400 ? parts.year - 543 : parts.year
  const valid = new Date(Date.UTC(year, parts.month - 1, parts.day))
  if (valid.getUTCMonth() !== parts.month - 1 || valid.getUTCDate() !== parts.day) return ''
  return `${year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

export function normalizeTime(raw: string): string {
  const match = raw.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/)
  if (!match) return ''
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return ''
  return `${pad2(hours)}:${pad2(minutes)}`
}

export function parseAttendanceCsv(text: string): ParseResult {
  const content = text.startsWith(BOM) ? text.slice(1) : text
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')

  const header = splitCsvLine(lines[0] ?? '').map((column) => column.toLowerCase())
  const indexOf = (column: Column) =>
    header.findIndex((name) => COLUMN_ALIASES[column].includes(name))

  const missing = REQUIRED.filter((column) => indexOf(column) === -1)
  if (missing.length > 0) {
    throw new Error(`ไฟล์ไม่มีคอลัมน์: ${missing.join(', ')}`)
  }
  if (lines.length < 2) {
    throw new Error('ไฟล์ไม่มีข้อมูลลงเวลา')
  }

  const records: AttendanceRecord[] = []
  const warnings: RowWarning[] = []

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
    const cell = (column: Column) => cells[indexOf(column)] ?? ''
    const name = cell('name')
    const rawDate = cell('date')
    const date = normalizeDate(rawDate)

    if (date === '') {
      warnings.push({ name, date: rawDate, message: 'อ่านวันที่ไม่ออก แถวนี้ไม่ถูกนับ' })
      continue
    }

    records.push({
      employeeId: cell('employee_id') || name,
      name,
      date,
      clockIn: normalizeTime(cell('clock_in')),
      clockOut: normalizeTime(cell('clock_out')),
    })
  }

  return { records, warnings }
}
