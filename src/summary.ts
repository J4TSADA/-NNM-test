import { STANDARD_HOURS_PER_DAY, WORK_START } from './rules'
import type { AttendanceRecord, EmployeeSummary, WeeklySummary } from './types'

const toMinutes = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const round2 = (value: number): number => Math.round(value * 100) / 100

function summarizeEmployee(records: AttendanceRecord[]): EmployeeSummary {
  const first = records[0]
  const workedHoursPerDay = records.map(
    (record) => (toMinutes(record.clockOut) - toMinutes(record.clockIn)) / 60,
  )

  return {
    employeeId: first?.employeeId ?? '',
    name: first?.name ?? '',
    workDays: new Set(records.map((record) => record.date)).size,
    totalHours: round2(workedHoursPerDay.reduce((sum, hours) => sum + hours, 0)),
    lateCount: records.filter((record) => toMinutes(record.clockIn) > toMinutes(WORK_START)).length,
    overtimeHours: round2(
      workedHoursPerDay.reduce(
        (sum, hours) => sum + Math.max(0, hours - STANDARD_HOURS_PER_DAY),
        0,
      ),
    ),
  }
}

function topBy(employees: EmployeeSummary[], key: 'lateCount' | 'overtimeHours') {
  return employees.reduce<EmployeeSummary | undefined>(
    (top, employee) => (top === undefined || employee[key] > top[key] ? employee : top),
    undefined,
  )
}

function buildOverview(
  employees: EmployeeSummary[],
  records: AttendanceRecord[],
): [string, string, string] {
  const dates = records.map((record) => record.date).sort()
  const totalHours = round2(employees.reduce((sum, e) => sum + e.totalHours, 0))
  const totalLate = employees.reduce((sum, e) => sum + e.lateCount, 0)
  const totalOvertime = round2(employees.reduce((sum, e) => sum + e.overtimeHours, 0))
  const mostLate = topBy(employees, 'lateCount')
  const mostOvertime = topBy(employees, 'overtimeHours')

  return [
    `พนักงาน ${employees.length} คน ทำงานรวม ${totalHours} ชั่วโมง (${dates[0]} ถึง ${dates.at(-1)})`,
    totalLate > 0 && mostLate
      ? `มาสายรวม ${totalLate} ครั้ง คนที่มาสายบ่อยที่สุดคือ ${mostLate.name} (${mostLate.lateCount} ครั้ง)`
      : 'สัปดาห์นี้ไม่มีใครมาสาย',
    totalOvertime > 0 && mostOvertime
      ? `OT รวม ${totalOvertime} ชั่วโมง คนที่ทำ OT มากที่สุดคือ ${mostOvertime.name} (${mostOvertime.overtimeHours} ชั่วโมง)`
      : 'สัปดาห์นี้ไม่มี OT',
  ]
}

export function summarizeWeek(records: AttendanceRecord[]): WeeklySummary {
  const byEmployee = new Map<string, AttendanceRecord[]>()
  for (const record of records) {
    byEmployee.set(record.employeeId, [...(byEmployee.get(record.employeeId) ?? []), record])
  }

  const employees = [...byEmployee.values()].map(summarizeEmployee)
  return { employees, overview: buildOverview(employees, records), warnings: [] }
}
