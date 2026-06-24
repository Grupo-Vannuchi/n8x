import "server-only";
import { env } from "@/lib/env";
import { toWhatsappNumber } from "@/lib/phone";

/**
 * Evolution API (WhatsApp) client. Server-only — the global API key never
 * reaches the browser. Two surfaces:
 *  - `sendText`: best-effort message send (never throws), used by the funnel
 *    completion flow. Picks the instance per call (funnel override → default).
 *  - instance management (`fetchInstances`, `createInstance`, `connectInstance`,
 *    `getConnectionState`, `logoutInstance`, `deleteInstance`): admin-only, used
 *    by the WhatsApp panel. These surface errors to the admin UI.
 */

export type SendResult = { ok: true } | { ok: false; error: string };
export type EvoResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Whether the Evolution server is configured (base URL + global key). */
export function isEvolutionConfigured(): boolean {
  return Boolean(env.EVOLUTION_BASE_URL && env.EVOLUTION_API_KEY);
}

/** Default instance to send from when a funnel doesn't pick its own. */
export function defaultInstance(): string | null {
  return env.EVOLUTION_INSTANCE ?? null;
}

function serverBase(): string {
  return env.EVOLUTION_BASE_URL!.replace(/\/+$/, "");
}

/** Low-level request to the Evolution server with the global key. Never throws. */
async function evoRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<EvoResult<T>> {
  if (!isEvolutionConfigured()) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch(`${serverBase()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: env.EVOLUTION_API_KEY!,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Management calls populate UI — keep the wait short so a slow/unreachable
      // server degrades quickly instead of hanging the request.
      signal: AbortSignal.timeout(8_000),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const error = `http_${res.status}: ${text.slice(0, 300)}`;
      console.error(`Evolution ${method} ${path} failed`, error);
      return { ok: false, error };
    }
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch_failed";
    console.error(`Evolution ${method} ${path} error`, message);
    return { ok: false, error: message };
  }
}

/** Send a plain-text WhatsApp message to an E.164 number, from a given instance
 * (falls back to the default instance). Best-effort: never throws. */
export async function sendText(
  phoneE164: string,
  message: string,
  instance?: string | null,
): Promise<SendResult> {
  if (!isEvolutionConfigured()) return { ok: false, error: "not_configured" };
  if (!message.trim()) return { ok: false, error: "empty_message" };
  const inst = instance || defaultInstance();
  if (!inst) return { ok: false, error: "no_instance" };

  // Instance names can contain spaces (e.g. "BOAS VINDAS") — encode the segment.
  const url = `${serverBase()}/message/sendText/${encodeURIComponent(inst)}`;
  const number = toWhatsappNumber(phoneE164);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({ number, text: message }),
      // Don't let a slow/unreachable instance hang the funnel response.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `http_${res.status}: ${body.slice(0, 200)}`;
      console.error("Evolution sendText failed", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch_failed";
    console.error("Evolution sendText error", message);
    return { ok: false, error: message };
  }
}

// --- Instance management (admin panel) ---

export type EvoInstance = {
  name: string;
  /** "open" (connected) | "connecting" | "close" (disconnected). */
  state: string;
  /** Connected WhatsApp number / profile, when available. */
  number: string | null;
  profileName: string | null;
};

export type EvoQrCode = {
  /** "data:image/png;base64,…" — usable directly as an <img> src. */
  base64: string | null;
  pairingCode: string | null;
};

/** Read a field from an object trying several possible keys (shape varies by
 * Evolution version: flat in v2, wrapped in `{ instance: {…} }` in v1). */
function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

function normalizeInstance(raw: unknown): EvoInstance | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inner =
    o.instance && typeof o.instance === "object"
      ? (o.instance as Record<string, unknown>)
      : o;
  const name = pick(inner, ["name", "instanceName"]);
  if (!name) return null;
  const ownerJid = pick(inner, ["ownerJid", "owner"]);
  return {
    name,
    state: pick(inner, ["connectionStatus", "state", "status"]) ?? "close",
    number: ownerJid ? ownerJid.split("@")[0] : pick(inner, ["number"]),
    profileName: pick(inner, ["profileName"]),
  };
}

/** List every instance on the server. */
export async function fetchInstances(): Promise<EvoResult<EvoInstance[]>> {
  const res = await evoRequest<unknown>("GET", "/instance/fetchInstances");
  if (!res.ok) return res;
  const list = Array.isArray(res.data) ? res.data : [];
  return { ok: true, data: list.map(normalizeInstance).filter(Boolean) as EvoInstance[] };
}

/** Create an instance (Baileys/WhatsApp) and return its first QR code. */
export async function createInstance(name: string): Promise<EvoResult<EvoQrCode>> {
  const res = await evoRequest<Record<string, unknown>>("POST", "/instance/create", {
    instanceName: name,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  });
  if (!res.ok) return res;
  const qr = res.data.qrcode as Record<string, unknown> | undefined;
  return {
    ok: true,
    data: {
      base64: (qr?.base64 as string) ?? null,
      pairingCode: (qr?.pairingCode as string) ?? null,
    },
  };
}

/** Get a fresh QR code to (re)connect an instance. */
export async function connectInstance(name: string): Promise<EvoResult<EvoQrCode>> {
  const res = await evoRequest<Record<string, unknown>>(
    "GET",
    `/instance/connect/${encodeURIComponent(name)}`,
  );
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      base64: (res.data.base64 as string) ?? null,
      pairingCode: (res.data.pairingCode as string) ?? null,
    },
  };
}

/** Current connection state of an instance ("open" | "connecting" | "close"). */
export async function getConnectionState(name: string): Promise<EvoResult<string>> {
  const res = await evoRequest<Record<string, unknown>>(
    "GET",
    `/instance/connectionState/${encodeURIComponent(name)}`,
  );
  if (!res.ok) return res;
  const inst = res.data.instance as Record<string, unknown> | undefined;
  const state = (inst?.state as string) ?? (res.data.state as string) ?? "close";
  return { ok: true, data: state };
}

/** Disconnect (logout) an instance without deleting it. */
export async function logoutInstance(name: string): Promise<EvoResult<unknown>> {
  return evoRequest("DELETE", `/instance/logout/${encodeURIComponent(name)}`);
}

/** Permanently delete an instance. */
export async function deleteInstance(name: string): Promise<EvoResult<unknown>> {
  return evoRequest("DELETE", `/instance/delete/${encodeURIComponent(name)}`);
}
