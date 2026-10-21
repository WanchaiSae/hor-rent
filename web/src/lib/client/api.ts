export type ApiRecord = Record<string, unknown> & { id: string };

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function getCollection<T>(
  resource: string,
  search = "",
  signal?: AbortSignal,
): Promise<T[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (search) {
    new URLSearchParams(search).forEach((value, key) => params.set(key, value));
  }
  const response = await fetch(`/api/${resource}?${params}`, { signal });
  const payload = await readPayload<{ data: T[] }>(response);
  return payload.data;
}

export async function createRecord<T>(resource: string, input: unknown): Promise<T> {
  const response = await fetch(`/api/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readPayload<{ data: T }>(response);
  return payload.data;
}

export async function updateRecord<T>(resource: string, id: string, input: unknown): Promise<T> {
  const response = await fetch(`/api/${resource}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readPayload<{ data: T }>(response);
  return payload.data;
}

export async function deleteRecord(resource: string, id: string): Promise<void> {
  const response = await fetch(`/api/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) await readPayload(response);
}

async function readPayload<T = unknown>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String(payload.error)
      : "เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์";
    throw new ApiClientError(message, response.status);
  }
  return payload as T;
}
