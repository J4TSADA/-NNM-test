import { STANDARD_HOURS_PER_DAY, WORK_START } from './rules'
import type { AttendanceRecord, EmployeeSummary, RowWarning, WeeklySummary } from './types'

const toMinutes = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const round2 = (value: number): number => Math.round(value * 100) / 100

const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    groups.set(key(item), [...(groups.get(key(item)) ?? []), item])
  }
  return groups
}

function workedHours(record: AttendanceRecord, warnings: RowWarning[]): number {
  const warn = (message: string) => warnings.push({ name: record.name, date: record.date, message })

  if (record.clockIn === '' && record.clockOut === '') return 0
  if (record.clockOut === '') {
    warn('ไม่มีเวลาออก ชั่วโมงของวันนี้ไม่ถูกนับ')
    return 0
  }
  if (record.clockIn === '') {
    warn('ไม่มีเวลาเข้า ชั่วโมงของวันนี้ไม่ถูกนับ')
    return 0
  }
  const minutes = toMinutes(record.clockOut) - toMinutes(record.clockIn)
  if (minutes <= 0) {
    warn('เวลาออกก่อนเวลาเข้า ชั่วโมงของวันนี้ไม่ถูกนับ')
    return 0
  }
  return minutes / 60
}

function summarizeEmployee(records: AttendanceRecord[], warnings: RowWarning[]): EmployeeSummary {
  const first = records[0]
  let workDays = 0
  let totalHours = 0
  let lateCount = 0
  let overtimeHours = 0

  for (const dayRecords of groupBy(records, (record) => record.date).values()) {
    const attended = dayRecords.filter((r) => r.clockIn !== '' || r.clockOut !== '')
    if (attended.length === 0) continue

    workDays++
    const dayHours = attended.reduce((sum, record) => sum + workedHours(record, warnings), 0)
    totalHours += dayHours
    overtimeHours += Math.max(0, dayHours - STANDARD_HOURS_PER_DAY)

    const clockIns = attended.map((r) => r.clockIn).filter((time) => time !== '')
    const firstIn = clockIns.sort()[0]
    if (firstIn !== undefined && toMinutes(firstIn) > toMinutes(WORK_START)) lateCount++
  }

  return {
    employeeId: first?.employeeId ?? '',
    name: first?.name ?? '',
    workDays,
    totalHours: round2(totalHours),
    lateCount,
    overtimeHours: round2(overtimeHours),
  }
}

function topBy(employees: EmployeeSummary[], key: 'lateCount' | 'overtimeHours') {
  return employees.reduce<EmployeeSummary | undefined>(
    (top, employee) => (top === undefined || employee[key] > top[key] ? employee : top),
    undefined,
  )
}

function dateRange(records: AttendanceRecord[]): { first: string; last: string } {
  const dates = records.map((record) => record.date).sort()
  return { first: dates[0] ?? '-', last: dates.at(-1) ?? '-' }
}

const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000

function buildOverview(
  employees: EmployeeSummary[],
  records: AttendanceRecord[],
): [string, string, string] {
  const { first, last } = dateRange(records)
  const totalHours = round2(employees.reduce((sum, e) => sum + e.totalHours, 0))
  const totalLate = employees.reduce((sum, e) => sum + e.lateCount, 0)
  const totalOvertime = round2(employees.reduce((sum, e) => sum + e.overtimeHours, 0))
  const mostLate = topBy(employees, 'lateCount')
  const mostOvertime = topBy(employees, 'overtimeHours')

  return [
    `พนักงาน ${employees.length} คน ทำงานรวม ${totalHours} ชั่วโมง (${first} ถึง ${last})`,
    totalLate > 0 && mostLate
      ? `มาสายรวม ${totalLate} ครั้ง คนที่มาสายบ่อยที่สุดคือ ${mostLate.name} (${mostLate.lateCount} ครั้ง)`
      : 'สัปดาห์นี้ไม่มีใครมาสาย',
    totalOvertime > 0 && mostOvertime
      ? `OT รวม ${totalOvertime} ชั่วโมง คนที่ทำ OT มากที่สุดคือ ${mostOvertime.name} (${mostOvertime.overtimeHours} ชั่วโมง)`
      : 'สัปดาห์นี้ไม่มี OT',
  ]
}

export function summarizeWeek(records: AttendanceRecord[]): WeeklySummary {
  const warnings: RowWarning[] = []
  const employees = [...groupBy(records, (record) => record.employeeId).values()].map(
    (employeeRecords) => summarizeEmployee(employeeRecords, warnings),
  )

  const { first, last } = dateRange(records)
  if (records.length > 0 && daysBetween(first, last) >= 7) {
    warnings.push({
      name: '-',
      date: `${first} ถึง ${last}`,
      message: 'ไฟล์มีข้อมูลเกิน 1 สัปดาห์ ตรวจสอบว่าเลือกไฟล์ถูกหรือไม่',
    })
  }

  return { employees, overview: buildOverview(employees, records), warnings }
}
