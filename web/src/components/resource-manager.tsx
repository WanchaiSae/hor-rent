"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createRecord, deleteRecord, getCollection, updateRecord, type ApiRecord } from "@/lib/client/api";
import type { ClientResource, FormField } from "@/lib/client/resources";

const PAGE_SIZE = 100;

interface ResourceManagerProps {
  resource: ClientResource;
  search: string;
  query?: string;
  fixedValues?: Record<string, unknown>;
  title?: string;
  description?: string;
}

export function ResourceManager({
  resource,
  search,
  query = "",
  fixedValues = {},
  title = resource.title,
  description = resource.description,
}: ResourceManagerProps) {
  const [rows, setRows] = useState<ApiRecord[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [referenceOptions, setReferenceOptions] = useState<Record<string, ApiRecord[]>>({});
  const [selectedDormitoryId, setSelectedDormitoryId] = useState("");
  const [availableRooms, setAvailableRooms] = useState<ApiRecord[]>([]);

  const loadRows = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(query);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      const data = await getCollection<ApiRecord>(resource.endpoint, params.toString(), signal);
      setRows(data);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [offset, query, resource.endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    void loadRows(controller.signal);
    return () => controller.abort();
  }, [loadRows]);

  useEffect(() => {
    const sources = new Map<string, string>();
    for (const field of resource.fields) {
      if (field.source && !field.dependsOn) sources.set(field.source.endpoint, field.source.endpoint);
    }
    if (sources.size === 0) return;

    const controller = new AbortController();
    void Promise.all([...sources.keys()].map(async (endpoint) => {
      try {
        const options = await getCollection<ApiRecord>(endpoint, "", controller.signal);
        setReferenceOptions((current) => ({ ...current, [endpoint]: options }));
      } catch {
        // The form remains usable when an optional lookup endpoint is temporarily unavailable.
      }
    }));
    return () => controller.abort();
  }, [resource]);

  useEffect(() => {
    if (!modalOpen || resource.endpoint !== "contracts" || !selectedDormitoryId) {
      setAvailableRooms([]);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ dormitoryId: selectedDormitoryId });
    void getCollection<ApiRecord>("rooms", params.toString(), controller.signal)
      .then(setAvailableRooms)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setAvailableRooms([]);
      });

    return () => controller.abort();
  }, [modalOpen, resource.endpoint, selectedDormitoryId]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return rows;
    return rows.filter((row) => Object.values(row).some((value) =>
      String(value ?? "").toLocaleLowerCase().includes(term),
    ));
  }, [rows, search]);

  function openCreate() {
    setEditing(null);
    setSelectedDormitoryId("");
    setModalOpen(true);
  }

  function openEdit(row: ApiRecord) {
    setEditing(row);
    setSelectedDormitoryId(String(row.dormitory_id ?? ""));
    setModalOpen(true);
  }

  function handleFormChange(event: React.ChangeEvent<HTMLFormElement>) {
    if (event.target instanceof HTMLSelectElement && event.target.name === "dormitoryId") {
      setSelectedDormitoryId(event.target.value);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const input: Record<string, unknown> = { ...fixedValues };

    for (const field of resource.fields) {
      if (field.key in fixedValues || field.hidden) continue;
      const raw = form.get(field.key);
      if (field.type === "checkbox") {
        input[field.key] = raw === "on";
        continue;
      }
      if (raw === null || raw === "") {
        if (field.nullable) input[field.key] = null;
        continue;
      }
      input[field.key] = field.type === "number"
        ? Number(raw)
        : field.key === "citizenId"
          ? String(raw).replace(/\D/g, "")
          : raw;
    }

    try {
      if (editing) {
        await updateRecord(resource.endpoint, editing.id, input);
        setNotice(`แก้ไข${resource.singular}แล้ว`);
      } else {
        await createRecord(resource.endpoint, input);
        setNotice(`เพิ่ม${resource.singular}แล้ว`);
      }
      setModalOpen(false);
      setEditing(null);
      await loadRows();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: ApiRecord) {
    if (!window.confirm(`ต้องการลบ${resource.singular}รายการนี้หรือไม่?`)) return;
    setError("");
    try {
      await deleteRecord(resource.endpoint, row.id);
      setNotice(`ลบ${resource.singular}แล้ว`);
      await loadRows();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ลบข้อมูลไม่สำเร็จ");
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <button className="primary-button" onClick={openCreate} type="button">
          <span className="material-icons-round text-lg">add</span>
          เพิ่ม{resource.singular}
        </button>
      </div>

      {notice && <p className="notice-success" role="status">{notice}</p>}
      {error && <p className="notice-error" role="alert">{error}</p>}

      <div className="table-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {resource.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="table-empty" colSpan={resource.columns.length + 1}>กำลังโหลดข้อมูล...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td className="table-empty" colSpan={resource.columns.length + 1}>ยังไม่มีข้อมูล</td></tr>
              ) : filteredRows.map((row) => (
                <tr key={row.id}>
                  {resource.columns.map((column) => {
                    const value = row[column.key];
                    return <td key={column.key}>{column.format ? column.format(value, row) : displayValue(value)}</td>;
                  })}
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="icon-button text-blue-600" onClick={() => openEdit(row)} title="แก้ไข" type="button">
                        <span className="material-icons-round">edit</span>
                      </button>
                      <button className="icon-button text-red-500" onClick={() => void handleDelete(row)} title="ลบ" type="button">
                        <span className="material-icons-round">delete_outline</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>แสดง {rows.length} รายการ · หน้าที่ {Math.floor(offset / PAGE_SIZE) + 1}</span>
          <div className="flex gap-2">
            <button className="page-button" disabled={offset === 0 || loading} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>ก่อนหน้า</button>
            <button className="page-button" disabled={rows.length < PAGE_SIZE || loading} onClick={() => setOffset((value) => value + PAGE_SIZE)}>ถัดไป</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModalOpen(false);
        }}>
          <div aria-labelledby="resource-form-title" aria-modal="true" className="modal-panel" role="dialog">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900" id="resource-form-title">
                  {editing ? `แก้ไข${resource.singular}` : `เพิ่ม${resource.singular}ใหม่`}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">กรอกข้อมูลให้ครบถ้วนก่อนบันทึก</p>
              </div>
              <button className="icon-button text-gray-400" onClick={() => setModalOpen(false)} type="button" aria-label="ปิดหน้าต่าง">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <form className="space-y-4" onChange={handleFormChange} onSubmit={handleSubmit}>
              <div className="modal-fields">
                {resource.fields.filter((field) => !field.hidden && !(field.key in fixedValues)).map((field) => (
                  <FormControl
                    field={field}
                    key={field.dependsOn ? `${field.key}-${selectedDormitoryId}` : field.key}
                    options={field.dependsOn ? availableRooms : field.source ? referenceOptions[field.source.endpoint] ?? [] : []}
                    row={editing}
                    disabled={Boolean(field.dependsOn && !selectedDormitoryId)}
                  />
                ))}
              </div>
              {error && <p className="notice-error" role="alert">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button className="secondary-button" onClick={() => setModalOpen(false)} type="button">ยกเลิก</button>
                <button className="primary-button" disabled={saving} type="submit">
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function FormControl({ field, options, row, disabled = false }: { field: FormField; options: ApiRecord[]; row: ApiRecord | null; disabled?: boolean }) {
  const column = toSnakeCase(field.key);
  const value = row?.[column];
  const common = {
    id: field.key,
    name: field.key,
    required: field.required,
    className: "form-control",
    placeholder: field.placeholder,
    defaultValue: formatInputValue(value, field.type),
  };

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700">
        <input className="h-4 w-4 accent-blue-600" defaultChecked={row ? Boolean(value) : Boolean(field.defaultChecked)} id={field.key} name={field.key} type="checkbox" />
        {field.label}
      </label>
    );
  }
  if (field.key === "citizenId") {
    return <CitizenIdInput field={field} value={value} />;
  }
  if (field.type === "textarea") {
    return <label className="form-label" htmlFor={field.key}>{field.label}<textarea {...common} rows={3} /></label>;
  }
  if (field.type === "select") {
    return (
      <label className="form-label" htmlFor={field.key}>{field.label}
        <select {...common} defaultValue={formatInputValue(value, field.type) ?? ""} disabled={disabled}>
          <option value="">{disabled ? "เลือกหอพักก่อน" : `เลือก${field.label}`}</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          {field.source?.endpoint && options.map((option) => (
            <option key={option.id} value={option.id}>{field.source!.label(option)}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="form-label" htmlFor={field.key}>{field.label}
      <input {...common} step={field.step} type={field.type ?? "text"} />
    </label>
  );
}

function CitizenIdInput({ field, value }: { field: FormField; value: unknown }) {
  const [digits, setDigits] = useState(() => String(value ?? "").replace(/\D/g, "").slice(0, 13));

  return (
    <label className="form-label" htmlFor={field.key}>{field.label}
      <input
        autoComplete="off"
        className="form-control"
        id={field.key}
        inputMode="numeric"
        maxLength={17}
        name={field.key}
        onChange={(event) => setDigits(event.target.value.replace(/\D/g, "").slice(0, 13))}
        placeholder="0 0000 00000 00 0"
        type="text"
        value={formatThaiCitizenId(digits)}
      />
    </label>
  );
}

function formatThaiCitizenId(value: string): string {
  const groups = [1, 4, 5, 2, 1];
  let offset = 0;

  return groups
    .map((length) => {
      const group = value.slice(offset, offset + length);
      offset += length;
      return group;
    })
    .filter(Boolean)
    .join(" ");
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function formatInputValue(value: unknown, type: FormField["type"]): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (type === "date") return String(value).slice(0, 10);
  if (type === "datetime-local") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return undefined;
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
  return String(value);
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ใช่" : "ไม่ใช่";
  return String(value);
}
