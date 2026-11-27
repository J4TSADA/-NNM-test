# feat: สรุปลงเวลาแม่บ้านรายสัปดาห์จากไฟล์ CSV (F1 · ตลาดหนองเหนียว)

ผู้จัดการตลาดอัปโหลดไฟล์ CSV ลงเวลา 1 สัปดาห์ แล้วได้ตารางสรุปต่อคน (วันทำงาน ชั่วโมงรวม มาสาย OT) พร้อมภาพรวม 3 บรรทัด ใช้ซ้ำได้ทุกสัปดาห์โดยไม่ต้องสั่ง AI ใหม่ ขอบเขตและ acceptance criteria อยู่ใน `intent.md`

## Logic การคำนวณ

- `src/csv.ts`: อ่าน CSV รองรับ BOM และ CRLF จาก Excel แจ้ง error ภาษาไทยเมื่อขาดคอลัมน์
- `src/summary.ts`: สรุปรายคนและภาพรวม 3 บรรทัด
- `src/rules.ts`: กติกาเวลาเข้างานและชั่วโมงมาตรฐาน อยู่ที่เดียว

## หน้าเว็บ

- `src/main.ts`, `src/style.css`, `index.html`: หน้าอัปโหลดไฟล์และตารางสรุป
- `public/sample-week.csv`: ไฟล์ตัวอย่างสำหรับปุ่ม "ลองด้วยไฟล์ตัวอย่าง"

## เทสต์ (TDD)

- `src/csv.test.ts`, `src/summary.test.ts`, `fixtures/sample-week.csv`
- commit `test:` แดง 8/8 ก่อน แล้ว commit `feat:` เขียว 8/8 รายละเอียดใน `docs/tdd-evidence.md`

## เครื่องมือและ CI

- `.github/workflows/ci.yml`: lint, format, typecheck, test, build
- `.husky/`: pre-commit รัน lint-staged, commit-msg รัน commitlint

## เอกสาร

- `docs/discover.md`, `intent.md`, `README.md`, `docs/code-walkthrough.md` (มี quiz), `docs/go-no-go.md`

## วิธีทดสอบ

1. `npm install && npm test`
2. `npm run dev` แล้วกด "ลองด้วยไฟล์ตัวอย่าง" ตัวเลขต้องตรงกับตารางใน README

## ไม่อยู่ในขอบเขต

ระบบล็อกอิน การคิดเงินเดือน และการเชื่อมกับระบบจริงของตลาด
