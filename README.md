# สรุปลงเวลาแม่บ้าน · ตลาดหนองเหนียว

อัปโหลดไฟล์ CSV ลงเวลา 1 สัปดาห์ แล้วได้ตารางสรุปต่อคน (วันทำงาน ชั่วโมงรวม มาสาย OT) พร้อมภาพรวม 3 บรรทัด ไม่ต้องสั่ง AI ใหม่ทุกสัปดาห์

## ต้องมีอะไรก่อน

- Node.js 22 ขึ้นไป
- npm

## รันบนเครื่อง

```bash
npm install
npm run dev
```

เปิดลิงก์ที่ขึ้นในเทอร์มินัล แล้วกด "ลองด้วยไฟล์ตัวอย่าง" หรืออัปโหลดไฟล์ของตัวเอง

## รูปแบบไฟล์ CSV

ต้องมีหัวคอลัมน์ 5 ตัวนี้ (เรียงสลับได้):

```csv
employee_id,name,date,clock_in,clock_out
E01,สมใจ,2026-11-23,08:00,16:00
```

- `date` รูปแบบ `YYYY-MM-DD`
- `clock_in`, `clock_out` รูปแบบ `HH:mm` (24 ชั่วโมง)
- ไฟล์ที่ save จาก Excel (มี BOM หรือขึ้นบรรทัดแบบ Windows) ใช้ได้

ตัวอย่างเต็มอยู่ที่ `fixtures/sample-week.csv` ผลที่ต้องได้คือ

| ชื่อ   | วันทำงาน | ชั่วโมงรวม | มาสาย | OT  |
| ---- | ------- | -------- | ----- | --- |
| สมใจ | 5       | 43       | 2     | 3   |
| มาลี  | 4       | 33       | 0     | 1   |
| บุญมี  | 5       | 37.5     | 3     | 0.5 |

## กติกาการคำนวณ

อยู่ใน `src/rules.ts` ที่เดียว: เข้างาน 08:00 (หลังจากนั้นนับสาย) และ OT คือชั่วโมงที่เกิน 8 ชั่วโมงต่อวัน รายละเอียดดูใน `intent.md`

## คำสั่ง

| คำสั่ง                   | ทำอะไร                              |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | รันเพื่อพัฒนา                           |
| `npm test`             | รันเทสต์                              |
| `npm run lint`         | ตรวจโค้ดด้วย ESLint                   |
| `npm run format:check` | ตรวจ format ด้วย Prettier            |
| `npm run typecheck`    | ตรวจ type                           |
| `npm run build`        | build ไฟล์ขึ้น production ไว้ใน `dist/` |

## มาตรฐานที่บังคับอัตโนมัติ

- **ก่อน commit:** husky + lint-staged รัน ESLint และ Prettier กับไฟล์ที่แก้
- **ข้อความ commit:** commitlint บังคับรูปแบบ Conventional Commits
- **CI:** `.github/workflows/ci.yml` รัน lint, format, typecheck, test และ build ทุก PR

## Deploy

1. merge PR เข้า `main`
2. สร้าง tag: `git tag v0.1.0 && git push origin v0.1.0`
3. `c9n deploy --dry-run` ดูก่อนว่าจะ deploy อะไร
4. `c9n deploy` ขึ้น Alpha

ก่อนขึ้น production ดู `docs/go-no-go.md`

## เอกสาร

- `docs/discover.md`: ผู้ใช้ ปัญหาจริง วัดความสำเร็จ
- `intent.md`: ทำอะไร ไม่ทำอะไร และ acceptance criteria
- `docs/code-walkthrough.md`: อธิบายโค้ดแบบเล่าเรื่อง พร้อม quiz
- `docs/tdd-evidence.md`: หลักฐานเทสต์แดงก่อนเขียว
- `docs/go-no-go.md`: checklist, rollback plan, env vars
