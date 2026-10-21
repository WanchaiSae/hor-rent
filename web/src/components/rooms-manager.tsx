"use client";

import { useCallback, useEffect, useState } from "react";
import { createRecord, deleteRecord, getCollection, updateRecord, type ApiRecord } from "@/lib/client/api";
import { clientResources } from "@/lib/client/resources";
import { ResourceManager } from "@/components/resource-manager";

export function RoomsManager({ search }: { search: string }) {
  const [dormitories, setDormitories] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ApiRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRecord | null>(null);

  const loadDormitories = useCallback(async () => {
    setLoading(true);
    try {
      setDormitories(await getCollection<ApiRecord>("dormitories"));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "โหลดข้อมูลหอพักไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDormitories(); }, [loadDormitories]);

  async function saveDormitory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      code: String(form.get("code") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      address: String(form.get("address") ?? "").trim() || null,
      province: String(form.get("province") ?? "").trim() || null,
      isActive: form.get("isActive") === "on",
    };
    try {
      if (editing) await updateRecord("dormitories", editing.id, payload);
      else await createRecord("dormitories", payload);
      setModalOpen(false);
      setEditing(null);
      await loadDormitories();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกข้อมูลไม่สำเร็จ");
    }
  }

  async function removeDormitory(dormitory: ApiRecord) {
    if (!window.confirm(`ต้องการลบ${String(dormitory.name)}หรือไม่?`)) return;
    try {
      await deleteRecord("dormitories", dormitory.id);
      if (selected?.id === dormitory.id) setSelected(null);
      await loadDormitories();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ลบหอพักไม่สำเร็จ");
    }
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(event: React.MouseEvent, dormitory: ApiRecord) {
    event.stopPropagation();
    setEditing(dormitory);
    setModalOpen(true);
  }

  return (
    <section className="space-y-5">
      {selected ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button className="secondary-button !px-2.5" onClick={() => setSelected(null)} type="button" aria-label="กลับไปยังรายการหอพัก">
                <span className="material-icons-round">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{String(selected.name)}</h1>
                <p className="text-sm text-gray-500">จัดการห้องพักในสาขานี้</p>
              </div>
            </div>
            <button className="secondary-button" onClick={() => { setEditing(selected); setModalOpen(true); }} type="button">
              <span className="material-icons-round text-lg">edit</span> แก้ไขหอพัก
            </button>
          </div>
          <ResourceManager
            key={selected.id}
            resource={clientResources.rooms}
            search={search}
            query={`dormitoryId=${encodeURIComponent(selected.id)}`}
            fixedValues={{ dormitoryId: selected.id }}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการห้องพัก</h1>
              <p className="mt-1 text-sm text-gray-500">เลือกสาขาหอพักเพื่อดูและจัดการห้อง</p>
            </div>
            <button className="primary-button" onClick={openCreate} type="button">
              <span className="material-icons-round text-lg">add_business</span> เพิ่มหอพัก
            </button>
          </div>
          {error && <p className="notice-error" role="alert">{error}</p>}
          {loading ? <div className="panel p-8 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</div> : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {dormitories.length === 0 ? (
                <div className="panel col-span-full p-10 text-center text-sm text-gray-500">ยังไม่มีข้อมูลหอพัก เริ่มจากเพิ่มหอพักใหม่</div>
              ) : dormitories.map((dormitory) => (
                <article className="dorm-card group" key={dormitory.id} onClick={() => setSelected(dormitory)}>
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <span className="material-icons-round text-2xl">domain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-pill ${dormitory.is_active ? "status-green" : "status-gray"}`}>
                        {dormitory.is_active ? "เปิดให้บริการ" : "ปิดใช้งาน"}
                      </span>
                      <button className="icon-button text-blue-600" onClick={(event) => openEdit(event, dormitory)} type="button" title="แก้ไขหอพัก">
                        <span className="material-icons-round">edit</span>
                      </button>
                      <button className="icon-button text-red-500" onClick={(event) => { event.stopPropagation(); void removeDormitory(dormitory); }} type="button" title="ลบหอพัก">
                        <span className="material-icons-round">delete_outline</span>
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">{String(dormitory.code)}</p>
                  <h2 className="mt-1 text-lg font-bold text-gray-900 transition group-hover:text-blue-600">{String(dormitory.name)}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <span className="material-icons-round text-base">location_on</span>
                    {String(dormitory.province || dormitory.address || "ยังไม่ได้ระบุที่อยู่")}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-bold text-blue-600">
                    ดูห้องพัก <span className="material-icons-round ml-1 text-base">arrow_forward</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModalOpen(false);
        }}>
          <div className="modal-panel max-w-lg" role="dialog" aria-modal="true" aria-labelledby="dormitory-form-title">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900" id="dormitory-form-title">
                {editing ? "แก้ไขข้อมูลหอพัก" : "เพิ่มหอพักใหม่"}
              </h2>
              <button className="icon-button text-gray-400" onClick={() => setModalOpen(false)} type="button" aria-label="ปิด">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <form className="space-y-4" onSubmit={saveDormitory}>
              <div className="modal-fields">
                <label className="form-label">รหัสหอพัก<input className="form-control" defaultValue={editing?.code as string | undefined} name="code" required maxLength={20} /></label>
                <label className="form-label">ชื่อหอพัก<input className="form-control" defaultValue={editing?.name as string | undefined} name="name" required maxLength={100} /></label>
                <label className="form-label">ที่อยู่<textarea className="form-control" defaultValue={editing?.address as string | undefined} name="address" rows={2} /></label>
                <label className="form-label">จังหวัด<input className="form-control" defaultValue={editing?.province as string | undefined} name="province" maxLength={50} /></label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input className="h-4 w-4 accent-blue-600" defaultChecked={editing ? Boolean(editing.is_active) : true} name="isActive" type="checkbox" /> เปิดให้บริการ
                </label>
              </div>
              {error && <p className="notice-error" role="alert">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button className="secondary-button" onClick={() => setModalOpen(false)} type="button">ยกเลิก</button>
                <button className="primary-button" type="submit">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
