export interface SelectSource {
  endpoint: string;
  label: (record: Record<string, unknown>) => string;
}

export interface FormField {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "select" | "textarea" | "checkbox";
  required?: boolean;
  nullable?: boolean;
  options?: { value: string; label: string }[];
  source?: SelectSource;
  hidden?: boolean;
  placeholder?: string;
  step?: string;
  defaultChecked?: boolean;
  dependsOn?: { field: string; parameter: string };
}

export interface TableColumn {
  key: string;
  label: string;
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface ClientResource {
  key: string;
  endpoint: string;
  title: string;
  description: string;
  singular: string;
  fields: FormField[];
  columns: TableColumn[];
}

const dormitorySource: SelectSource = {
  endpoint: "dormitories",
  label: (row) => `${String(row.code)} · ${String(row.name)}`,
};
const roomSource: SelectSource = {
  endpoint: "rooms",
  label: (row) => `${String(row.room_number)} · ${String(row.dormitory_name ?? "")}`,
};
const tenantSource: SelectSource = {
  endpoint: "tenants",
  label: (row) => `${String(row.first_name)} ${String(row.last_name)}`,
};
const contractSource: SelectSource = {
  endpoint: "contracts",
  label: (row) => String(row.contract_number),
};
const categorySource: SelectSource = {
  endpoint: "transaction-categories",
  label: (row) => `${String(row.name)} (${String(row.type)})`,
};
const transactionSource: SelectSource = {
  endpoint: "transactions",
  label: (row) => `#${String(row.id)} · ฿${String(row.amount)}`,
};

export const clientResources: Record<string, ClientResource> = {
  rooms: {
    key: "rooms",
    endpoint: "rooms",
    title: "จัดการห้องพัก",
    singular: "ห้อง",
    description: "จัดการเลขห้อง ประเภทห้อง และค่าเช่าของหอพัก",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "roomNumber", label: "เลขห้อง", required: true, placeholder: "เช่น 101" },
      { key: "floor", label: "ชั้น", type: "number", nullable: true, step: "1" },
      {
        key: "roomType",
        label: "ประเภทห้อง",
        type: "select",
        required: true,
        options: [
          { value: "air_conditioned", label: "ห้องแอร์" },
          { value: "fan", label: "ห้องพัดลม" },
        ],
      },
      { key: "monthlyRent", label: "ค่าเช่าตามรูปแบบสัญญา", type: "number", required: true, step: "0.01" },
      {
        key: "status",
        label: "สถานะห้อง",
        type: "select",
        options: [
          { value: "available", label: "ห้องว่าง" },
          { value: "occupied", label: "ห้องเต็ม" },
          { value: "maintenance", label: "ห้องกำลังปรับปรุง" },
        ],
      },
      { key: "isActive", label: "เปิดใช้งาน", type: "checkbox", defaultChecked: true },
    ],
    columns: [
      { key: "room_number", label: "เลขห้อง" },
      { key: "floor", label: "ชั้น" },
      { key: "room_type", label: "ประเภทห้อง" },
      { key: "capacity", label: "ผู้พักสูงสุด" },
      { key: "monthly_rent", label: "ค่าเช่า/เดือน", format: money },
      { key: "status", label: "สถานะ" },
    ],
  },
  tenants: {
    key: "tenants", endpoint: "tenants", title: "ข้อมูลผู้เช่า", singular: "ผู้เช่า",
    description: "จัดการข้อมูลและช่องทางติดต่อของผู้เช่า",
    fields: [
      { key: "citizenId", label: "เลขบัตรประชาชน", placeholder: "ระบุเลขบัตรประชาชน" },
      { key: "firstName", label: "ชื่อ", required: true },
      { key: "lastName", label: "นามสกุล", required: true },
      { key: "phone", label: "เบอร์โทรศัพท์", type: "tel", nullable: true },
      { key: "email", label: "อีเมล", type: "email", nullable: true },
      { key: "emergencyContact", label: "ผู้ติดต่อฉุกเฉิน", nullable: true },
      { key: "isActive", label: "สถานะใช้งาน", type: "checkbox" },
    ],
    columns: [
      { key: "first_name", label: "ชื่อ-นามสกุล", format: (_, row) => `${row.first_name} ${row.last_name}` },
      { key: "phone", label: "เบอร์โทรศัพท์" }, { key: "email", label: "อีเมล" },
      { key: "citizen_id", label: "เลขบัตรประชาชน" },
      { key: "is_active", label: "สถานะ", format: (value) => value ? "ใช้งาน" : "ปิดใช้งาน" },
    ],
  },
  contracts: {
    key: "contracts", endpoint: "contracts", title: "สัญญาเช่า", singular: "สัญญา",
    description: "จัดการระยะเวลา ค่าเช่า และสถานะสัญญา",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "roomId", label: "ห้องที่จะอยู่", type: "select", required: true, source: roomSource, dependsOn: { field: "dormitoryId", parameter: "dormitoryId" } },
      { key: "contractNumber", label: "เลขที่สัญญา", required: true },
      { key: "rentalPeriod", label: "รูปแบบสัญญา", type: "select", required: true, options: [
        { value: "monthly", label: "รายเดือน" }, { value: "daily", label: "รายวัน" },
      ] },
      { key: "startDate", label: "วันเริ่มสัญญา", type: "date", required: true },
      { key: "endDate", label: "วันสิ้นสุดสัญญา", type: "date", nullable: true },
      { key: "monthlyRent", label: "ค่าเช่าต่อเดือน", type: "number", required: true, step: "0.01" },
      { key: "depositAmount", label: "เงินประกัน", type: "number", step: "0.01" },
      {
        key: "status",
        label: "สถานะสัญญา",
        type: "select",
        required: true,
        options: [
          { value: "draft", label: "ร่างสัญญา" },
          { value: "active", label: "อยู่ในสัญญา" },
          { value: "ended", label: "หมดสัญญา" },
        ],
      },
      { key: "terms", label: "เงื่อนไขเพิ่มเติม", type: "textarea", nullable: true },
      { key: "checkInDate", label: "วันเข้าพัก", type: "date", nullable: true },
      { key: "checkOutDate", label: "วันย้ายออก", type: "date", nullable: true },
    ],
    columns: [
      { key: "contract_number", label: "เลขที่สัญญา" }, { key: "room_id", label: "ห้อง" },
      { key: "start_date", label: "เริ่มสัญญา" }, { key: "end_date", label: "สิ้นสุด" },
      { key: "rental_period", label: "รูปแบบสัญญา", format: (value) => value === "daily" ? "รายวัน" : "รายเดือน" },
      { key: "monthly_rent", label: "ค่าเช่า", format: money }, { key: "status", label: "สถานะ" },
    ],
  },
  "contract-tenants": {
    key: "contract-tenants", endpoint: "contract-tenants", title: "ผู้เช่าในสัญญา", singular: "ผู้เช่าในสัญญา",
    description: "เชื่อมผู้เช่ากับสัญญาและกำหนดผู้เช่าหลัก",
    fields: [
      { key: "contractId", label: "สัญญา", type: "select", required: true, source: contractSource },
      { key: "tenantId", label: "ผู้เช่า", type: "select", required: true, source: tenantSource },
      { key: "isPrimary", label: "ผู้เช่าหลัก", type: "checkbox" },
      { key: "moveInDate", label: "วันเข้าพัก", type: "date", nullable: true },
      { key: "moveOutDate", label: "วันย้ายออก", type: "date", nullable: true },
    ],
    columns: [
      { key: "contract_id", label: "สัญญา" }, { key: "tenant_id", label: "ผู้เช่า" },
      { key: "is_primary", label: "ผู้เช่าหลัก", format: (value) => value ? "ใช่" : "ไม่ใช่" },
      { key: "move_in_date", label: "วันเข้า" }, { key: "move_out_date", label: "วันออก" },
    ],
  },
  "transaction-categories": {
    key: "transaction-categories", endpoint: "transaction-categories", title: "หมวดหมู่การเงิน", singular: "หมวดหมู่",
    description: "ตั้งค่าหมวดหมู่รายรับและรายจ่าย",
    fields: [
      { key: "name", label: "ชื่อหมวดหมู่", required: true },
      { key: "type", label: "ประเภท", type: "select", required: true, options: [
        { value: "income", label: "รายรับ" }, { value: "expense", label: "รายจ่าย" },
      ] },
      { key: "isSystem", label: "หมวดหมู่ระบบ", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "หมวดหมู่" }, { key: "type", label: "ประเภท", format: (value) => value === "income" ? "รายรับ" : "รายจ่าย" },
      { key: "is_system", label: "หมวดหมู่ระบบ", format: (value) => value ? "ใช่" : "ไม่ใช่" },
    ],
  },
  transactions: {
    key: "transactions", endpoint: "transactions", title: "รายรับ-รายจ่าย", singular: "รายการ",
    description: "บันทึกและติดตามธุรกรรมของหอพัก",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "roomId", label: "ห้อง (ถ้ามี)", type: "select", nullable: true, source: roomSource },
      { key: "contractId", label: "สัญญา (ถ้ามี)", type: "select", nullable: true, source: contractSource },
      { key: "categoryId", label: "หมวดหมู่", type: "select", required: true, source: categorySource },
      { key: "type", label: "ประเภทรายการ", type: "select", required: true, options: [
        { value: "income", label: "รายรับ" }, { value: "expense", label: "รายจ่าย" },
      ] },
      { key: "amount", label: "จำนวนเงิน", type: "number", required: true, step: "0.01" },
      { key: "transactionDate", label: "วันที่ทำรายการ", type: "datetime-local" },
      { key: "paymentStatus", label: "สถานะชำระ", placeholder: "paid / pending / void" },
      { key: "paidAt", label: "วันที่ชำระ", type: "datetime-local", nullable: true },
      { key: "note", label: "หมายเหตุ", type: "textarea", nullable: true },
    ],
    columns: [
      { key: "transaction_date", label: "วันที่", format: dateTime },
      { key: "type", label: "ประเภท", format: (value) => value === "income" ? "รายรับ" : "รายจ่าย" },
      { key: "category_id", label: "หมวดหมู่" }, { key: "amount", label: "จำนวนเงิน", format: money },
      { key: "payment_status", label: "สถานะ" }, { key: "note", label: "หมายเหตุ" },
    ],
  },
  invoices: {
    key: "invoices", endpoint: "invoices", title: "ใบแจ้งหนี้ / ค่าน้ำ-ค่าไฟ", singular: "ใบแจ้งหนี้",
    description: "สร้างและติดตามยอดเรียกเก็บจากสัญญาเช่า",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "contractId", label: "สัญญา", type: "select", required: true, source: contractSource },
      { key: "invoiceNumber", label: "เลขที่ใบแจ้งหนี้", required: true },
      { key: "invoiceDate", label: "วันที่ออก", type: "date" },
      { key: "dueDate", label: "วันครบกำหนด", type: "date", required: true },
      { key: "periodStart", label: "เริ่มรอบบิล", type: "date", required: true },
      { key: "periodEnd", label: "สิ้นสุดรอบบิล", type: "date", required: true },
      { key: "subtotal", label: "ยอดก่อนภาษี", type: "number", step: "0.01" },
      { key: "tax", label: "ภาษี", type: "number", step: "0.01" },
      { key: "totalAmount", label: "ยอดสุทธิ", type: "number", step: "0.01" },
      { key: "status", label: "สถานะ", placeholder: "unpaid / paid / overdue" },
    ],
    columns: [
      { key: "invoice_number", label: "เลขที่" }, { key: "invoice_date", label: "วันที่ออก" },
      { key: "due_date", label: "ครบกำหนด" }, { key: "total_amount", label: "ยอดสุทธิ", format: money },
      { key: "status", label: "สถานะ" },
    ],
  },
  "invoice-items": {
    key: "invoice-items", endpoint: "invoice-items", title: "รายการในใบแจ้งหนี้", singular: "รายการ",
    description: "จัดการค่าเช่า ค่าน้ำ ค่าไฟ และรายการเรียกเก็บอื่น ๆ",
    fields: [
      { key: "invoiceId", label: "ใบแจ้งหนี้", type: "select", required: true, source: {
        endpoint: "invoices", label: (row) => String(row.invoice_number),
      } },
      { key: "description", label: "รายละเอียด", required: true },
      { key: "quantity", label: "จำนวน", type: "number", step: "0.01" },
      { key: "unitPrice", label: "ราคาต่อหน่วย", type: "number", required: true, step: "0.01" },
      { key: "amount", label: "จำนวนเงิน", type: "number", required: true, step: "0.01" },
      { key: "transactionId", label: "รายการรับชำระ (ถ้ามี)", type: "select", nullable: true, source: transactionSource },
    ],
    columns: [
      { key: "invoice_id", label: "ใบแจ้งหนี้" }, { key: "description", label: "รายละเอียด" },
      { key: "quantity", label: "จำนวน" }, { key: "unit_price", label: "ต่อหน่วย", format: money },
      { key: "amount", label: "รวม", format: money },
    ],
  },
};

function money(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(value));
}

function dateTime(value: unknown): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
}
