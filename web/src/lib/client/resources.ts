import { createElement, type ReactNode } from "react";

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
  readOnly?: boolean;
  placeholder?: string;
  step?: string;
  defaultChecked?: boolean;
  defaultValue?: string;
  dependsOn?: { field: string; parameter: string };
  filterBy?: { field: string; optionKey: string };
}

export interface TableColumn {
  key: string;
  label: string;
  format?: (value: unknown, row: Record<string, unknown>) => string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
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
  label: (row) => {
    const tenantName = String(row.tenant_names ?? "").trim();
    const contractNumber = String(row.contract_number ?? "");
    return tenantName
      ? `${tenantName} · สัญญา ${contractNumber}`
      : `สัญญา ${contractNumber}`;
  },
};
const categorySource: SelectSource = {
  endpoint: "transaction-categories",
  label: (row) => String(row.name),
};
const transactionSource: SelectSource = {
  endpoint: "transactions",
  label: (row) => `#${String(row.id)} · ฿${String(row.amount)}`,
};
const supplierSource: SelectSource = {
  endpoint: "suppliers",
  label: (row) => String(row.name),
};
const amenitySource: SelectSource = {
  endpoint: "amenities",
  label: (row) => `${String(row.name)} · ${String(row.location)} · ${String(row.dormitory_name)}`,
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
      { key: "status", label: "สถานะ", format: roomStatus },
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
  suppliers: {
    key: "suppliers", endpoint: "suppliers", title: "ร้านค้าและซัพพลายเออร์", singular: "ซัพพลายเออร์",
    description: "จัดเก็บข้อมูลผู้ให้บริการและร้านค้าที่ใช้ดูแลงานของหอพัก",
    fields: [
      { key: "name", label: "ชื่อร้านค้าหรือบริษัท", required: true, placeholder: "เช่น บริษัทดูแลเครื่องซักผ้า" },
      { key: "contactName", label: "ชื่อผู้ติดต่อ", nullable: true },
      { key: "phone", label: "เบอร์โทรศัพท์", type: "tel", nullable: true },
      { key: "email", label: "อีเมล", type: "email", nullable: true },
      { key: "address", label: "ที่อยู่", type: "textarea", nullable: true },
      { key: "notes", label: "หมายเหตุ", type: "textarea", nullable: true },
      { key: "isActive", label: "เปิดใช้งาน", type: "checkbox", defaultChecked: true },
    ],
    columns: [
      { key: "name", label: "ชื่อร้านค้าหรือบริษัท" }, { key: "contact_name", label: "ผู้ติดต่อ" },
      { key: "phone", label: "เบอร์โทรศัพท์" }, { key: "email", label: "อีเมล" },
      { key: "is_active", label: "สถานะ", format: (value) => value ? "ใช้งาน" : "ปิดใช้งาน" },
    ],
  },
  amenities: {
    key: "amenities", endpoint: "amenities", title: "ซักผ้าและตู้กดน้ำ", singular: "อุปกรณ์",
    description: "จัดการเครื่องซักผ้าและตู้กดน้ำแยกตามหอพัก พร้อมสถานะและผู้ดูแล",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "amenityType", label: "ประเภทอุปกรณ์", type: "select", required: true, options: [
        { value: "laundry_machine", label: "เครื่องซักผ้า" },
        { value: "water_dispenser", label: "ตู้กดน้ำ" },
      ] },
      { key: "name", label: "ชื่ออุปกรณ์", required: true, placeholder: "เช่น เครื่องซักผ้าหมายเลข 1" },
      { key: "assetTag", label: "รหัสทรัพย์สิน", nullable: true },
      { key: "location", label: "ตำแหน่งติดตั้ง", required: true, placeholder: "เช่น ชั้น 1 อาคาร A" },
      { key: "supplierId", label: "ผู้ดูแลหรือซัพพลายเออร์", type: "select", nullable: true, source: supplierSource },
      { key: "status", label: "สถานะอุปกรณ์", type: "select", required: true, options: [
        { value: "active", label: "พร้อมใช้งาน" },
        { value: "maintenance", label: "กำลังซ่อม" },
        { value: "inactive", label: "เลิกใช้งาน" },
      ] },
      { key: "installedOn", label: "วันที่ติดตั้ง", type: "date", nullable: true },
      { key: "lastServicedOn", label: "วันที่บำรุงรักษาล่าสุด", type: "date", nullable: true },
      { key: "notes", label: "หมายเหตุ", type: "textarea", nullable: true },
    ],
    columns: [
      { key: "name", label: "อุปกรณ์" },
      { key: "amenity_type", label: "ประเภท", format: amenityTypeLabel },
      { key: "dormitory_name", label: "หอพัก" }, { key: "location", label: "ตำแหน่ง" },
      { key: "supplier_name", label: "ผู้ดูแล" }, { key: "status", label: "สถานะ", format: amenityStatusLabel },
    ],
  },
  maintenanceJobs: {
    key: "maintenanceJobs", endpoint: "maintenance-jobs", title: "งานซ่อมบำรุง", singular: "งานซ่อม",
    description: "ติดตามปัญหา ผู้รับผิดชอบ ค่าใช้จ่าย และสถานะการซ่อมของห้องหรืออุปกรณ์",
    fields: [
      { key: "roomId", label: "ห้องที่มีปัญหา", type: "select", nullable: true, source: roomSource },
      { key: "amenityId", label: "อุปกรณ์ส่วนกลางที่มีปัญหา", type: "select", nullable: true, source: amenitySource },
      { key: "issueType", label: "ประเภทงานซ่อม", type: "select", required: true, options: [
        { value: "lighting", label: "ไฟ / หลอดไฟ" }, { value: "air_conditioning", label: "เครื่องปรับอากาศ" },
        { value: "electrical", label: "ระบบไฟฟ้า" }, { value: "plumbing", label: "ประปา / ท่อน้ำ" },
        { value: "door_lock", label: "ประตู / ลูกบิด / กุญแจ" }, { value: "furniture", label: "เฟอร์นิเจอร์" },
        { value: "laundry_machine", label: "เครื่องซักผ้า" }, { value: "water_dispenser", label: "ตู้กดน้ำ" },
        { value: "other", label: "อื่น ๆ" },
      ] },
      { key: "title", label: "อาการหรือจุดที่ชำรุด", required: true, placeholder: "เช่น หลอดไฟหน้าห้องไม่ติด หรือแอร์ไม่เย็น" },
      { key: "description", label: "รายละเอียดปัญหา", type: "textarea", nullable: true },
      { key: "priority", label: "ความเร่งด่วน", type: "select", required: true, options: [
        { value: "low", label: "ต่ำ" }, { value: "normal", label: "ปกติ" },
        { value: "high", label: "สูง" }, { value: "urgent", label: "เร่งด่วน" },
      ] },
      { key: "status", label: "สถานะงาน", type: "select", required: true, options: [
        { value: "open", label: "รอดำเนินการ" }, { value: "in_progress", label: "กำลังซ่อม" },
        { value: "resolved", label: "ซ่อมเสร็จ" }, { value: "cancelled", label: "ยกเลิก" },
      ] },
      { key: "supplierId", label: "ผู้รับผิดชอบ", type: "select", nullable: true, source: supplierSource },
      { key: "resolvedOn", label: "วันที่ซ่อมเสร็จ", type: "date", nullable: true },
      { key: "cost", label: "ค่าใช้จ่าย", type: "number", nullable: true, step: "0.01" },
    ],
    columns: [
      { key: "target_name", label: "ห้อง / อุปกรณ์" }, { key: "issue_type", label: "ประเภท", format: issueTypeLabel }, { key: "title", label: "อาการ / รายการซ่อม" },
      { key: "priority", label: "ความเร่งด่วน", format: priorityLabel },
      { key: "status", label: "สถานะ", format: maintenanceStatusLabel },
      { key: "supplier_name", label: "ผู้รับผิดชอบ" }, { key: "cost", label: "ค่าใช้จ่าย", format: money },
    ],
  },
  contracts: {
    key: "contracts", endpoint: "contracts", title: "สัญญาเช่า", singular: "สัญญา",
    description: "จัดการระยะเวลา ค่าเช่า และสถานะสัญญา",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "roomId", label: "ห้องที่จะอยู่", type: "select", required: true, source: roomSource, dependsOn: { field: "dormitoryId", parameter: "dormitoryId" } },
      { key: "tenantId", label: "ผู้เช่า", type: "select", required: true, source: tenantSource },
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
      { key: "contract_number", label: "เลขที่สัญญา" }, { key: "room_number", label: "ห้อง" },
      { key: "tenant_names", label: "ผู้เช่า" },
      { key: "start_date", label: "เริ่มสัญญา", format: dateOnly },
      { key: "end_date", label: "สิ้นสุด / วันคงเหลือ", render: (_, row) => renderContractExpiry(row) },
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
      { key: "contract_number", label: "เลขที่สัญญา" }, { key: "room_number", label: "ห้อง" },
      { key: "tenant_name", label: "ผู้เช่า" },
      { key: "is_primary", label: "ผู้เช่าหลัก", format: (value) => value ? "ใช่" : "ไม่ใช่" },
      { key: "move_in_date", label: "วันเข้าพัก", format: dateOnly },
      { key: "move_out_date", label: "วันย้ายออก", format: dateOnly },
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
      { key: "defaultAmount", label: "จำนวนเงินตั้งต้น (ถ้ามี)", type: "number", nullable: true, step: "0.01", placeholder: "เว้นว่างได้ หากยอดเปลี่ยนแต่ละครั้ง" },
      { key: "isSystem", label: "หมวดหมู่ระบบ", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "หมวดหมู่" }, { key: "type", label: "ประเภท", format: (value) => value === "income" ? "รายรับ" : "รายจ่าย" },
      { key: "default_amount", label: "จำนวนเงินตั้งต้น", format: money },
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
      { key: "type", label: "ประเภทรายการ", type: "select", required: true, defaultValue: "income", options: [
        { value: "income", label: "รายรับ" }, { value: "expense", label: "รายจ่าย" },
      ] },
      { key: "categoryId", label: "หมวดหมู่", type: "select", required: true, source: categorySource, filterBy: { field: "type", optionKey: "type" } },
      { key: "amount", label: "จำนวนเงินจริง", type: "number", step: "0.01", placeholder: "เติมจากหมวดหมู่ได้ หรือกรอกยอดจริง" },
      { key: "transactionDate", label: "วันที่ทำรายการ", type: "datetime-local" },
      { key: "paymentStatus", label: "สถานะชำระ", type: "select", required: true, defaultValue: "paid", options: [
        { value: "paid", label: "ชำระแล้ว" }, { value: "pending", label: "รอชำระ" }, { value: "void", label: "ยกเลิก" },
      ] },
      { key: "paidAt", label: "วันที่ชำระ", type: "datetime-local", nullable: true },
      { key: "note", label: "หมายเหตุ", type: "textarea", nullable: true },
    ],
    columns: [
      { key: "transaction_date", label: "วันที่", format: dateTime },
      { key: "type", label: "ประเภท", format: (value) => value === "income" ? "รายรับ" : "รายจ่าย" },
      { key: "category_name", label: "หมวดหมู่" }, { key: "amount", label: "จำนวนเงิน", format: money },
      { key: "payment_status", label: "สถานะชำระ", format: paymentStatusLabel }, { key: "note", label: "หมายเหตุ" },
    ],
  },
  invoices: {
    key: "invoices", endpoint: "invoices", title: "ใบแจ้งหนี้ / ค่าน้ำ-ค่าไฟ", singular: "ใบแจ้งหนี้",
    description: "สร้างและติดตามยอดเรียกเก็บจากสัญญาเช่า",
    fields: [
      { key: "dormitoryId", label: "หอพัก", type: "select", required: true, source: dormitorySource },
      { key: "contractId", label: "ชื่อผู้เช่า", type: "select", required: true, source: contractSource },
      { key: "invoiceNumber", label: "เลขที่ใบแจ้งหนี้", required: true },
      { key: "invoiceDate", label: "วันที่ออก", type: "date" },
      { key: "dueDate", label: "วันครบกำหนด", type: "date", required: true },
      { key: "periodStart", label: "เริ่มรอบบิล", type: "date", required: true },
      { key: "periodEnd", label: "สิ้นสุดรอบบิล", type: "date", required: true },
      { key: "subtotal", label: "ยอดก่อนภาษี", type: "number", step: "0.01" },
      { key: "tax", label: "ภาษี", type: "number", step: "0.01" },
      { key: "totalAmount", label: "ยอดสุทธิ", type: "number", step: "0.01" },
      { key: "status", label: "สถานะ", type: "select", required: true, defaultValue: "unpaid", options: [
        { value: "unpaid", label: "รอชำระ" },
        { value: "paid", label: "ชำระแล้ว" },
        { value: "overdue", label: "เกินกำหนดชำระ" },
      ] },
    ],
    columns: [
      { key: "invoice_number", label: "เลขที่" }, { key: "invoice_date", label: "วันที่ออก", format: dateOnly },
      { key: "due_date", label: "ครบกำหนด", render: (_, row) => renderInvoiceDueDate(row) },
      { key: "total_amount", label: "ยอดสุทธิ", format: money },
      { key: "status", label: "สถานะ", format: invoiceStatusLabel },
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
      { key: "quantity", label: "จำนวน", type: "number", required: true, step: "0.01", defaultValue: "1" },
      { key: "unitPrice", label: "ราคาต่อหน่วย", type: "number", required: true, step: "0.01" },
      { key: "amount", label: "จำนวนเงิน (คำนวณอัตโนมัติ)", type: "number", required: true, readOnly: true, step: "0.01" },
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

function roomStatus(value: unknown): string {
  if (value === "available") return "ว่าง";
  if (value === "occupied") return "ไม่ว่าง";
  if (value === "maintenance") return "กำลังซ่อมบำรุง";
  return String(value ?? "—");
}

function amenityTypeLabel(value: unknown): string {
  if (value === "laundry_machine") return "เครื่องซักผ้า";
  if (value === "water_dispenser") return "ตู้กดน้ำ";
  return String(value ?? "—");
}

function issueTypeLabel(value: unknown): string {
  const labels: Record<string, string> = {
    lighting: "ไฟ / หลอดไฟ",
    air_conditioning: "เครื่องปรับอากาศ",
    electrical: "ระบบไฟฟ้า",
    plumbing: "ประปา / ท่อน้ำ",
    door_lock: "ประตู / ลูกบิด / กุญแจ",
    furniture: "เฟอร์นิเจอร์",
    laundry_machine: "เครื่องซักผ้า",
    water_dispenser: "ตู้กดน้ำ",
    other: "อื่น ๆ",
  };
  return labels[String(value)] ?? String(value ?? "—");
}

function amenityStatusLabel(value: unknown): string {
  if (value === "active") return "พร้อมใช้งาน";
  if (value === "maintenance") return "กำลังซ่อม";
  if (value === "inactive") return "เลิกใช้งาน";
  return String(value ?? "—");
}

function priorityLabel(value: unknown): string {
  if (value === "low") return "ต่ำ";
  if (value === "normal") return "ปกติ";
  if (value === "high") return "สูง";
  if (value === "urgent") return "เร่งด่วน";
  return String(value ?? "—");
}

function maintenanceStatusLabel(value: unknown): string {
  if (value === "open") return "รอดำเนินการ";
  if (value === "in_progress") return "กำลังซ่อม";
  if (value === "resolved") return "ซ่อมเสร็จ";
  if (value === "cancelled") return "ยกเลิก";
  return String(value ?? "—");
}

function paymentStatusLabel(value: unknown): string {
  if (value === "paid") return "ชำระแล้ว";
  if (value === "pending") return "รอชำระ";
  if (value === "void") return "ยกเลิก";
  return String(value ?? "—");
}

function invoiceStatusLabel(value: unknown, row: Record<string, unknown>): string {
  if (value === "unpaid") {
    const dueDate = parseCalendarDate(row.due_date);
    if (dueDate && dueDate.getTime() < thaiTodayAsUtcDate().getTime()) return "เกินกำหนดชำระ";
    return "รอชำระ";
  }
  if (value === "paid") return "ชำระแล้ว";
  if (value === "overdue") return "เกินกำหนดชำระ";
  return String(value ?? "—");
}

function renderInvoiceDueDate(row: Record<string, unknown>): ReactNode {
  const dueDate = parseCalendarDate(row.due_date);
  if (!dueDate) return "—";

  const formattedDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "UTC" }).format(dueDate);
  if (row.status === "paid") return formattedDate;

  const daysRemaining = Math.round((dueDate.getTime() - thaiTodayAsUtcDate().getTime()) / 86_400_000);
  const label = daysRemaining < 0
    ? `เกินกำหนด ${Math.abs(daysRemaining)} วัน`
    : daysRemaining === 0
      ? "ครบกำหนดวันนี้"
      : `อีก ${daysRemaining} วันครบกำหนด`;
  const isUrgent = daysRemaining < 7;

  return createElement("div", { className: "flex flex-col items-start gap-1" },
    createElement("span", null, formattedDate),
    createElement("span", {
      className: isUrgent
        ? "inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
        : "inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600",
      role: isUrgent ? "status" : undefined,
    }, label),
  );
}

function dateTime(value: unknown): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
}

function dateOnly(value: unknown): string {
  if (!value) return "—";
  const date = parseCalendarDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function renderContractExpiry(row: Record<string, unknown>): ReactNode {
  const endDate = parseCalendarDate(row.end_date);
  const formattedDate = endDate
    ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "UTC" }).format(endDate)
    : "ไม่กำหนดวันสิ้นสุด";

  if (!endDate || row.status !== "active") return formattedDate;

  const today = thaiTodayAsUtcDate();
  const daysRemaining = Math.round((endDate.getTime() - today.getTime()) / 86_400_000);
  const label = daysRemaining < 0
    ? `เกินกำหนด ${Math.abs(daysRemaining)} วัน`
    : daysRemaining === 0
      ? "สิ้นสุดวันนี้"
      : `เหลือ ${daysRemaining} วัน`;
  const isUrgent = daysRemaining < 7;

  return createElement("div", { className: "flex flex-col items-start gap-1" },
    createElement("span", null, formattedDate),
    createElement("span", {
      className: isUrgent
        ? "inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
        : "inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600",
      role: isUrgent ? "status" : undefined,
    }, label),
  );
}

function parseCalendarDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const input = String(value);
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (dateOnlyMatch) {
    return new Date(Date.UTC(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])));
  }

  const timestamp = new Date(input);
  if (Number.isNaN(timestamp.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const year = Number(part("year"));
  const month = Number(part("month"));
  const day = Number(part("day"));
  return year && month && day ? new Date(Date.UTC(year, month - 1, day)) : null;
}

function thaiTodayAsUtcDate(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
}
