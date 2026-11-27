import './style.css'
import { parseAttendanceCsv } from './csv'
import { summarizeWeek } from './summary'
import type { WeeklySummary } from './types'

const app = document.querySelector<HTMLDivElement>('#app')

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

function renderSummary(target: HTMLElement, summary: WeeklySummary) {
  const overview = el('ul', undefined, 'overview')
  summary.overview.forEach((line) => overview.append(el('li', line)))

  const table = el('table')
  const headRow = el('tr')
  ;['รหัส', 'ชื่อ', 'วันทำงาน', 'ชั่วโมงรวม', 'มาสาย (ครั้ง)', 'OT (ชั่วโมง)'].forEach((title) =>
    headRow.append(el('th', title)),
  )
  table.append(el('thead'), el('tbody'))
  table.tHead?.append(headRow)
  summary.employees.forEach((employee) => {
    const row = el('tr')
    row.append(
      el('td', employee.employeeId),
      el('td', employee.name),
      el('td', String(employee.workDays)),
      el('td', String(employee.totalHours)),
      el('td', String(employee.lateCount), employee.lateCount > 0 ? 'warn' : undefined),
      el('td', String(employee.overtimeHours)),
    )
    table.tBodies[0]?.append(row)
  })

  target.replaceChildren(el('h2', 'ภาพรวมสัปดาห์นี้'), overview, el('h2', 'สรุปรายคน'), table)
}

function showResult(target: HTMLElement, csvText: string) {
  try {
    renderSummary(target, summarizeWeek(parseAttendanceCsv(csvText)))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'อ่านไฟล์ไม่สำเร็จ'
    target.replaceChildren(el('p', message, 'error'))
  }
}

if (app) {
  const result = el('section')
  const input = el('input')
  input.type = 'file'
  input.accept = '.csv,text/csv'
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (file) showResult(result, await file.text())
  })

  const sampleButton = el('button', 'ลองด้วยไฟล์ตัวอย่าง')
  sampleButton.type = 'button'
  sampleButton.addEventListener('click', async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}sample-week.csv`)
    showResult(result, await response.text())
  })

  const label = el('label', 'เลือกไฟล์ลงเวลา (.csv) 1 สัปดาห์ ')
  label.append(input)

  app.append(
    el('h1', 'สรุปลงเวลาแม่บ้าน · ตลาดหนองเหนียว'),
    el('p', 'อัปโหลดไฟล์แล้วได้สรุปทันที ไม่ต้องสั่ง AI ใหม่ทุกสัปดาห์', 'hint'),
    label,
    sampleButton,
    result,
  )
}
