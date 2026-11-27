export interface AttendanceRecord {
  employeeId: string
  name: string
  date: string
  clockIn: string
  clockOut: string
}

export interface RowWarning {
  name: string
  date: string
  message: string
}

export interface ParseResult {
  records: AttendanceRecord[]
  warnings: RowWarning[]
}

export interface EmployeeSummary {
  employeeId: string
  name: string
  workDays: number
  totalHours: number
  lateCount: number
  overtimeHours: number
}

export interface WeeklySummary {
  employees: EmployeeSummary[]
  overview: [string, string, string]
  warnings: RowWarning[]
}
