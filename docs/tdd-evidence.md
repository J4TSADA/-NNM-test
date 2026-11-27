# หลักฐาน TDD: เทสต์แดงก่อน แล้วค่อยเขียว

ดูได้จากประวัติ commit บน branch `feat/f1-attendance-summary`

| ลำดับ | Commit                                                    | สถานะเทสต์ |
| ---- | --------------------------------------------------------- | --------- |
| 1    | `test: add failing tests for weekly attendance summary`   | แดง 8/8   |
| 2    | `feat: summarize weekly attendance per employee from csv` | เขียว 8/8  |

ลองเองได้: `git checkout <commit ข้อ 1> && npm test` จะเห็นแดง แล้ว `git checkout <commit ข้อ 2> && npm test` จะเห็นเขียว

## ผลตอนแดง (commit ข้อ 1)

```
 × สรุปครบทุกคนในไฟล์ (AC1)
 × ค่าของแต่ละคนตรงกับที่คำนวณมือ (AC2–AC5)
 × เข้างานตรง 08:00 พอดีไม่นับว่าสาย แต่ 08:01 นับว่าสาย (AC4)
 × มีภาพรวม 3 บรรทัด (AC6)
 × สรุปไฟล์เดิมซ้ำได้ผลเหมือนเดิมทุกครั้ง (AC7)
 × อ่านไฟล์ตัวอย่างได้ครบทุกแถว
 × อ่านไฟล์ที่ Excel export มา (มี BOM และขึ้นบรรทัดแบบ CRLF) ได้
 × แจ้งเป็นภาษาไทยเมื่อไฟล์ไม่มีคอลัมน์ที่ต้องใช้

 Test Files  2 failed (2)
      Tests  8 failed (8)
```

## ผลตอนเขียว (commit ข้อ 2)

```
 Test Files  2 passed (2)
      Tests  8 passed (8)
```
