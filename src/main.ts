import './style.css'
import { parseAttendanceCsv } from './csv'
import { summarizeWeek } from './summary'
import type { EmployeeSummary, RowWarning, WeeklySummary } from './types'

const app = document.querySelector<HTMLElement>('#app')

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  if (className) node.className = className
  return node
}

const OVERVIEW_TONES = ['hours', 'late', 'ot'] as const

function renderOverview(overview: WeeklySummary['overview']) {
  const section = el('section', undefined, 'overview')
  section.setAttribute('aria-label', 'ภาพรวมสัปดาห์')
  section.append(el('h2', 'ภาพรวมสัปดาห์นี้'))
  const list = el('ul')
  overview.forEach((line, index) => list.append(el('li', line, OVERVIEW_TONES[index])))
  section.append(list)
  return section
}

function renderWarnings(warnings: RowWarning[]) {
  const section = el('section', undefined, 'warnings')
  section.setAttribute('role', 'status')
  section.append(el('h2', `มี ${warnings.length} แถวที่ควรตรวจในไฟล์`))
  const list = el('ul')
  warnings.forEach((warning) => {
    const item = el('li')
    item.append(el('strong', `${warning.name} ${warning.date}`), el('span', warning.message))
    list.append(item)
  })
  section.append(list)
  return section
}

function numberCell(value: number, tone?: 'late' | 'ot') {
  const cell = el('td', undefined, 'num')
  if (tone && value > 0) {
    cell.append(el('span', String(value), `badge ${tone}`))
  } else {
    cell.append(el('span', String(value), value === 0 ? 'zero' : undefined))
  }
  return cell
}

function renderTable(employees: EmployeeSummary[]) {
  const section = el('section', undefined, 'people')
  section.append(el('h2', 'สรุปรายคน'))

  const scroller = el('div', undefined, 'table-scroll')
  const table = el('table')
  const head = el('tr')
  head.append(
    el('th', 'ชื่อ'),
    el('th', 'วันทำงาน', 'num'),
    el('th', 'ชั่วโมงรวม', 'num'),
    el('th', 'มาสาย (ครั้ง)', 'num'),
    el('th', 'OT (ชั่วโมง)', 'num'),
  )
  table.createTHead().append(head)

  const body = table.createTBody()
  employees.forEach((employee) => {
    const nameCell = el('td', undefined, 'name')
    nameCell.append(el('span', employee.name))
    if (employee.employeeId !== employee.name) {
      nameCell.append(el('small', employee.employeeId))
    }
    const row = el('tr')
    row.append(
      nameCell,
      numberCell(employee.workDays),
      numberCell(employee.totalHours),
      numberCell(employee.lateCount, 'late'),
      numberCell(employee.overtimeHours, 'ot'),
    )
    body.append(row)
  })

  scroller.append(table)
  section.append(scroller)
  return section
}

function renderError(message: string) {
  const box = el('section', undefined, 'error')
  box.setAttribute('role', 'alert')
  box.append(
    el('h2', 'สรุปไฟล์นี้ไม่ได้'),
    el('p', message),
    el(
      'p',
      'ไฟล์ต้องเป็น .csv และมีคอลัมน์ ชื่อ, วันที่, เวลาเข้า, เวลาออก ลองเปิดไฟล์ใน Excel แล้วเลือกบันทึกเป็น CSV อีกครั้ง',
      'help',
    ),
  )
  return box
}

if (app) {
  const input = el('input')
  input.type = 'file'
  input.accept = '.csv,text/csv'
  input.className = 'visually-hidden'
  input.id = 'csv-file'

  const dropzone = el('label', undefined, 'dropzone')
  dropzone.htmlFor = 'csv-file'
  dropzone.append(
    el('span', 'วางไฟล์ลงเวลาที่นี่', 'drop-title'),
    el('span', 'หรือคลิกเพื่อเลือกไฟล์ .csv ของ 1 สัปดาห์', 'drop-sub'),
    input,
  )

  const sampleButton = el('button', 'ลองด้วยไฟล์ตัวอย่าง', 'link-button')
  sampleButton.type = 'button'

  const intake = el('section', undefined, 'intake')
  intake.append(dropzone, sampleButton)

  const fileBar = el('div', undefined, 'file-bar')
  fileBar.hidden = true
  const fileName = el('span', undefined, 'file-name')
  const changeButton = el('button', 'เปลี่ยนไฟล์', 'secondary')
  changeButton.type = 'button'
  fileBar.append(el('span', 'กำลังดูไฟล์', 'file-label'), fileName, changeButton)

  const result = el('div', undefined, 'result')

  const show = (name: string, csvText: string) => {
    fileName.textContent = name
    fileBar.hidden = false
    intake.hidden = true
    try {
      const parsed = parseAttendanceCsv(csvText)
      const summary = summarizeWeek(parsed.records)
      const warnings = [...parsed.warnings, ...summary.warnings]
      result.replaceChildren(
        renderOverview(summary.overview),
        ...(warnings.length > 0 ? [renderWarnings(warnings)] : []),
        renderTable(summary.employees),
      )
    } catch (error) {
      result.replaceChildren(renderError(error instanceof Error ? error.message : 'อ่านไฟล์ไม่สำเร็จ'))
    }
    result.focus()
  }

  const readFile = async (file: File | undefined) => {
    if (file) show(file.name, await file.text())
  }

  input.addEventListener('change', () => {
    void readFile(input.files?.[0])
    input.value = ''
  })
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault()
    dropzone.classList.add('dragging')
  })
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'))
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault()
    dropzone.classList.remove('dragging')
    void readFile(event.dataTransfer?.files[0])
  })
  sampleButton.addEventListener('click', async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}sample-week.csv`)
    show('sample-week.csv (ไฟล์ตัวอย่าง)', await response.text())
  })
  changeButton.addEventListener('click', () => input.click())

  result.tabIndex = -1

  const header = el('header', undefined, 'masthead')
  header.append(
    el('p', 'ตลาดหนองเหนียว', 'market'),
    el('h1', 'สรุปลงเวลาแม่บ้านรายสัปดาห์'),
    el('p', 'วางไฟล์ลงเวลาแล้วได้สรุปทันที กติกาเดิมทุกสัปดาห์ ไม่ต้องสั่ง AI ใหม่', 'lede'),
  )

  app.append(header, intake, fileBar, result)
}
