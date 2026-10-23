"use client";

import { useEffect, useMemo, useState } from "react";
import { getCollection, type ApiRecord } from "@/lib/client/api";
import { clientResources } from "@/lib/client/resources";
import { ResourceManager } from "@/components/resource-manager";
import { RoomsManager } from "@/components/rooms-manager";

const primaryNavigation = [
  { key: "dashboard", label: "ภาพรวม (Dashboard)", icon: "dashboard" },
  { key: "rooms", label: "ห้องพัก", icon: "meeting_room" },
  { key: "tenants", label: "ข้อมูลผู้เช่า", icon: "people" },
  { key: "contracts", label: "สัญญาเช่า", icon: "description" },
  { key: "invoices", label: "ใบแจ้งหนี้ / ค่าน้ำ-ไฟ", icon: "receipt_long" },
  { key: "transactions", label: "รายรับ-รายจ่าย", icon: "account_balance_wallet" },
];

const additionalNavigation = [
  { key: "contract-tenants", label: "ผู้เช่าในสัญญา", icon: "group_add" },
  { key: "invoice-items", label: "รายการใบแจ้งหนี้", icon: "list_alt" },
  { key: "transaction-categories", label: "หมวดหมู่การเงิน", icon: "category" },
];

const operationsNavigation = [
  { key: "suppliers", label: "ร้านค้า & ซัพพลายเออร์", icon: "store" },
  { key: "amenities", label: "ซักผ้า & ตู้กดน้ำ", icon: "local_laundry_service" },
  { key: "maintenanceJobs", label: "งานซ่อมบำรุง", icon: "build" },
];

type PageKey = "dashboard" | "rooms" | string;

export function DormFlowApp() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [databaseOnline, setDatabaseOnline] = useState<boolean | null>(null);
  const activeResource = activePage === "rooms" ? undefined : clientResources[activePage];
  const currentTitle = useMemo(() => {
    if (activePage === "dashboard") return "ภาพรวมระบบ";
    if (activePage === "rooms") return "จัดการห้องพัก";
    return activeResource?.title ?? "DormFlow";
  }, [activePage, activeResource]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/health", { signal: controller.signal })
      .then((response) => setDatabaseOnline(response.ok))
      .catch(() => setDatabaseOnline(false));
    return () => controller.abort();
  }, []);

  function navigate(page: string) {
    setActivePage(page);
    setSearch("");
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button aria-label="ปิดเมนู" className="mobile-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div>
          <div className="brand-row">
            <span className="material-icons-round text-3xl text-blue-600">apartment</span>
            <span className="text-xl font-bold tracking-tight text-gray-900">DormFlow</span>
            <button className="icon-button ml-auto text-gray-400 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู">
              <span className="material-icons-round">close</span>
            </button>
          </div>

          <nav aria-label="เมนูหลัก" className="sidebar-menu">
            {primaryNavigation.map((item) => (
              <NavigationButton active={activePage === item.key} item={item} key={item.key} onClick={() => navigate(item.key)} />
            ))}
            <div className="sidebar-divider"><span>จัดการข้อมูล</span></div>
            {additionalNavigation.map((item) => (
              <NavigationButton active={activePage === item.key} item={item} key={item.key} onClick={() => navigate(item.key)} />
            ))}
            <div className="sidebar-divider"><span>ส่วนงานเพิ่มเติม</span></div>
            {operationsNavigation.map((item) => (
              <NavigationButton active={activePage === item.key} item={item} key={item.key} onClick={() => navigate(item.key)} />
            ))}
          </nav>
        </div>

        <div className="profile-footer">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">A</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">ผู้ดูแลระบบ</p>
            <p className="truncate text-xs text-gray-500">DormFlow</p>
          </div>
          <span className={`ml-auto h-2.5 w-2.5 rounded-full ${databaseOnline === false ? "bg-red-500" : databaseOnline === true ? "bg-emerald-500" : "bg-gray-300"}`} title={databaseOnline ? "ฐานข้อมูลเชื่อมต่อแล้ว" : "กำลังตรวจสอบฐานข้อมูล"} />
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <button className="icon-button text-gray-600" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู">
              <span className="material-icons-round text-2xl">menu</span>
            </button>
            <span className="truncate font-bold text-gray-900">DormFlow</span>
          </div>
          <div className="search-box">
            <span className="material-icons-round mr-2 text-xl text-gray-400">search</span>
            <input aria-label="ค้นหา" onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาข้อมูลในหน้านี้..." value={search} />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-gray-700 md:inline">{currentTitle}</span>
            <span className={`connection-indicator ${databaseOnline ? "online" : databaseOnline === false ? "offline" : "checking"}`} title={databaseOnline ? "เชื่อมต่อฐานข้อมูลแล้ว" : databaseOnline === false ? "เชื่อมต่อฐานข้อมูลไม่ได้" : "กำลังตรวจสอบฐานข้อมูล"} />
          </div>
        </header>

        <main className="main-content">
          {activePage === "dashboard" ? <Dashboard /> : null}
          {activePage === "rooms" ? <RoomsManager search={search} /> : null}
          {activeResource ? <ResourceManager key={activeResource.key} resource={activeResource} search={search} /> : null}
        </main>

        <nav aria-label="เมนูด้านล่าง" className="mobile-nav">
          {primaryNavigation.slice(0, 3).concat(primaryNavigation[5]).map((item) => (
            <button className={activePage === item.key ? "mobile-nav-active" : ""} key={item.key} onClick={() => navigate(item.key)}>
              <span className="material-icons-round">{item.icon}</span><span>{item.key === "dashboard" ? "ภาพรวม" : item.key === "rooms" ? "ห้องพัก" : item.key === "tenants" ? "ผู้เช่า" : "การเงิน"}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavigationButton({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: { key: string; label: string; icon: string };
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={onClick} type="button">
      <span className="material-icons-round text-xl">{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"all" | "month" | "week" | "custom">("month");
  const [today, setToday] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [dashboardData, setDashboardData] = useState({
    rooms: [] as ApiRecord[],
    tenants: [] as ApiRecord[],
    contracts: [] as ApiRecord[],
    contractTenants: [] as ApiRecord[],
    invoices: [] as ApiRecord[],
    transactions: [] as ApiRecord[],
  });

  // Compute after hydration so server and browser render the same initial date.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(getDateInBangkok(new Date()) ?? "");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDashboard() {
      try {
        const [rooms, tenants, contracts, contractTenants, invoices, transactions] = await Promise.all([
          getCollection<ApiRecord>("rooms", "", controller.signal),
          getCollection<ApiRecord>("tenants", "", controller.signal),
          getCollection<ApiRecord>("contracts", "", controller.signal),
          getCollection<ApiRecord>("contract-tenants", "", controller.signal),
          getCollection<ApiRecord>("invoices", "", controller.signal),
          getAllCollection<ApiRecord>("transactions", controller.signal),
        ]);
        setDashboardData({ rooms, tenants, contracts, contractTenants, invoices, transactions });
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "โหลดข้อมูลภาพรวมไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }
    void loadDashboard();
    return () => controller.abort();
  }, []);

  const range = useMemo(() => getDashboardDateRange(period, today, customStart, customEnd), [period, today, customStart, customEnd]);
  const periodTransactions = useMemo(() => dashboardData.transactions
    .filter((transaction) => {
      const date = getDateInBangkok(transaction.transaction_date);
      return Boolean(date && range.valid && (!range.start || date >= range.start) && (!range.end || date <= range.end));
    })
    .filter((transaction) => transaction.payment_status !== "void")
    .sort((left, right) => new Date(String(right.transaction_date)).getTime() - new Date(String(left.transaction_date)).getTime()),
  [dashboardData.transactions, range]);
  const income = periodTransactions.reduce((total, transaction) =>
    transaction.type === "income" && transaction.payment_status === "paid" ? total + Number(transaction.amount) : total, 0);
  const expenses = periodTransactions.reduce((total, transaction) =>
    transaction.type === "expense" && transaction.payment_status === "paid" ? total + Number(transaction.amount) : total, 0);
  const recentTransactions = periodTransactions.slice(0, 5);
  const availableRooms = dashboardData.rooms.filter((room) => room.status === "available" && room.is_active).length;
  const currentTenants = countCurrentTenants(dashboardData.tenants, dashboardData.contracts, dashboardData.contractTenants, today);
  const outstandingInvoices = dashboardData.invoices.filter((invoice) => invoice.status !== "paid").length;

  const stats = [
    { label: "ห้องพักทั้งหมด", value: loading ? "—" : `${dashboardData.rooms.length} ห้อง`, icon: "meeting_room", color: "blue" },
    { label: "ห้องว่าง", value: loading ? "—" : `${availableRooms} ห้อง`, icon: "check_circle", color: "green" },
    { label: "ผู้เช่าปัจจุบัน", value: loading ? "—" : `${currentTenants} คน`, icon: "people", color: "indigo" },
    { label: "รับชำระแล้ว", value: loading ? "—" : money(income), icon: "payments", color: "amber" },
    { label: "จ่ายแล้ว", value: loading ? "—" : money(expenses), icon: "payments", color: "red" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">ภาพรวมระบบ (Dashboard)</h1>
        <p className="mt-1 text-sm text-gray-500">สรุปข้อมูลจากฐานข้อมูลหอพัก</p>
      </div>
      {error && <p className="notice-error" role="alert">{error}</p>}
      <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="form-label" htmlFor="dashboard-period">ช่วงเวลารายรับ–รายจ่าย</label>
          <select className="form-control mt-1 min-w-48" id="dashboard-period" onChange={(event) => setPeriod(event.target.value as typeof period)} value={period}>
            <option value="all">ทั้งหมด</option>
            <option value="month">เดือนนี้</option>
            <option value="week">สัปดาห์นี้</option>
            <option value="custom">เลือกช่วงเอง</option>
          </select>
        </div>
        {period === "custom" && (
          <div className="grid grid-cols-2 gap-3 sm:min-w-[420px]">
            <label className="form-label" htmlFor="dashboard-start">ตั้งแต่<input className="form-control" id="dashboard-start" max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)} type="date" value={customStart} /></label>
            <label className="form-label" htmlFor="dashboard-end">ถึง<input className="form-control" id="dashboard-end" min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)} type="date" value={customEnd} /></label>
          </div>
        )}
        <p className="text-xs text-gray-500">{range.label}</p>
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-5">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.label}</p>
              <p className={`mt-2 text-xl font-bold sm:text-2xl ${stat.color === "green" ? "text-emerald-600" : stat.color === "red" ? "text-red-600" : "text-gray-900"}`}>{stat.value}</p>
            </div>
            <span className={`stat-icon stat-${stat.color} material-icons-round`}>{stat.icon}</span>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div><h2 className="font-bold text-gray-900">รายการล่าสุด</h2><p className="mt-0.5 text-xs text-gray-500">{range.label} · ไม่รวมรายการยกเลิก</p></div>
            <span className="material-icons-round text-gray-400">receipt_long</span>
          </div>
          {!range.valid ? (
            <p className="p-8 text-center text-sm text-gray-500">เลือกวันเริ่มต้นและวันสิ้นสุดที่ถูกต้อง</p>
          ) : recentTransactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">ไม่มีรายการในช่วงเวลานี้</p>
          ) : recentTransactions.map((transaction) => (
            <div className="flex items-center justify-between gap-3 border-b border-gray-50 px-5 py-3 last:border-0" key={transaction.id}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${transaction.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  <span className="material-icons-round text-lg">{transaction.type === "income" ? "south_west" : "north_east"}</span>
                </span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800">{String(transaction.note || `รายการ #${transaction.id}`)}</p><p className="text-xs text-gray-400">{formatDate(transaction.transaction_date)}</p></div>
              </div>
              <span className={`shrink-0 text-sm font-bold ${transaction.type === "income" ? "text-emerald-600" : "text-gray-800"}`}>
                {transaction.type === "income" ? "+" : "−"}{money(Number(transaction.amount))}
              </span>
            </div>
          ))}
        </section>

        <section className="panel p-5">
          <div className="flex items-start justify-between">
            <div><h2 className="font-bold text-gray-900">ใบแจ้งหนี้ที่ต้องติดตาม</h2><p className="mt-1 text-xs text-gray-500">รายการที่ยังไม่ได้ทำเครื่องหมายว่าชำระแล้ว</p></div>
            <span className="rounded-xl bg-red-50 p-2.5 text-red-500"><span className="material-icons-round">warning_amber</span></span>
          </div>
          <p className="mt-7 text-3xl font-bold text-gray-900">{loading ? "—" : outstandingInvoices}<span className="ml-2 text-base font-medium text-gray-500">รายการ</span></p>
          <p className="mt-2 text-sm text-gray-500">ตรวจสอบสถานะและวันครบกำหนดในหน้าใบแจ้งหนี้</p>
        </section>
      </div>
    </div>
  );
}

function countCurrentTenants(
  tenants: ApiRecord[],
  contracts: ApiRecord[],
  contractTenants: ApiRecord[],
  today: string,
): number {
  const activeTenantIds = new Set(
    tenants.filter((tenant) => tenant.is_active).map((tenant) => String(tenant.id)),
  );
  const currentContractIds = new Set(
    contracts
      .filter((contract) =>
        contract.status === "active"
        && Boolean(contract.room_id)
        && (getDateInBangkok(contract.start_date) ?? "") <= today
        && (!contract.end_date || (getDateInBangkok(contract.end_date) ?? "") >= today),
      )
      .map((contract) => String(contract.id)),
  );

  const currentTenantIds = new Set(
    contractTenants
      .filter((link) =>
        currentContractIds.has(String(link.contract_id))
        && activeTenantIds.has(String(link.tenant_id))
        && (!link.move_in_date || (getDateInBangkok(link.move_in_date) ?? "") <= today)
        && (!link.move_out_date || (getDateInBangkok(link.move_out_date) ?? "") >= today),
      )
      .map((link) => String(link.tenant_id)),
  );

  return currentTenantIds.size;
}

function money(value: number): string {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(date);
}

type DashboardPeriod = "all" | "month" | "week" | "custom";

interface DashboardDateRange {
  start: string | null;
  end: string | null;
  valid: boolean;
  label: string;
}

async function getAllCollection<T>(resource: string, signal: AbortSignal): Promise<T[]> {
  const pageSize = 100;
  const records: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    const page = await getCollection<T>(resource, params.toString(), signal);
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

function getDashboardDateRange(
  period: DashboardPeriod,
  today: string,
  customStart: string,
  customEnd: string,
): DashboardDateRange {
  if (period === "all") return { start: null, end: null, valid: true, label: "ตลอดช่วงข้อมูล" };
  if (period === "custom") {
    const valid = Boolean(customStart && customEnd && customStart <= customEnd);
    return {
      start: customStart || null,
      end: customEnd || null,
      valid,
      label: valid ? `${formatCalendarDate(customStart)} – ${formatCalendarDate(customEnd)}` : "เลือกวันเริ่มต้นและวันสิ้นสุด",
    };
  }

  if (!today) return { start: null, end: null, valid: false, label: "ไม่สามารถระบุวันที่ปัจจุบันได้" };
  if (period === "month") {
    const start = `${today.slice(0, 7)}-01`;
    return { start, end: today, valid: true, label: `เดือนนี้ · ${formatCalendarDate(start)} – ${formatCalendarDate(today)}` };
  }

  const [year, month, day] = today.split("-").map(Number);
  const utcToday = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (utcToday.getUTCDay() + 6) % 7;
  utcToday.setUTCDate(utcToday.getUTCDate() - mondayOffset);
  const start = utcToday.toISOString().slice(0, 10);
  return { start, end: today, valid: true, label: `สัปดาห์นี้ · ${formatCalendarDate(start)} – ${formatCalendarDate(today)}` };
}

function getDateInBangkok(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const input = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}
