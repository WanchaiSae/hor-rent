This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Room Rent

ระบบจัดการหอพักด้วย Next.js และ PostgreSQL

## เริ่มต้นใช้งาน

1. ที่โฟลเดอร์หลักของโปรเจกต์ คัดลอก `.env.example` เป็น `.env` แล้วตั้ง `POSTGRES_PASSWORD` และ `DATABASE_URL` ให้ใช้รหัสผ่านเดียวกัน
2. เปิด PostgreSQL: `docker compose up -d postgres`
3. ติดตั้งแพ็กเกจ: `bun install`
4. สร้างตาราง: `bun run db:migrate`
5. เริ่มเว็บ: `bun run dev`

Migration จะบันทึกเวอร์ชันใน `schema_migrations` จึงรันซ้ำได้โดยไม่สร้างตารางซ้ำ

## API

- `GET /api/health` ตรวจสถานะฐานข้อมูล
- Resources ที่รองรับ CRUD: `dormitories`, `rooms`, `tenants`, `contracts`, `contract-tenants`, `transaction-categories`, `transactions`, `invoices` และ `invoice-items`
- ทุก resource รองรับ `GET /api/{resource}` และ `POST /api/{resource}`; ใช้ `GET`, `PATCH` และ `DELETE /api/{resource}/{id}` สำหรับรายการเดียว
- รายการแบ่งหน้าได้ด้วย `?limit=50&offset=0` (สูงสุด 100 รายการต่อครั้ง); rooms กรองตามหอพักได้ด้วย `?dormitoryId=1`
- ตัวอย่างสร้างหอพัก: `POST /api/dormitories` ด้วย JSON `{"code":"A","name":"หอพัก A"}`
- ตัวอย่างสร้างห้อง: `POST /api/rooms` ด้วย JSON `{"dormitoryId":"1","roomNumber":"101","capacity":2,"monthlyRent":4500}`

Response สำเร็จคืนข้อมูลใน `data`; validation error คืน `400`, ไม่พบรายการคืน `404`, ข้อมูลซ้ำหรือข้อจำกัด foreign key คืน `409` พร้อมข้อความใน `error`
