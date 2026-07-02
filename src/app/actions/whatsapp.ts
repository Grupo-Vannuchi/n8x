"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  fetchInstances,
  invalidateInstances,
  createInstance,
  connectInstance,
  getConnectionState,
  logoutInstance,
  deleteInstance,
  type EvoResult,
  type EvoInstance,
  type EvoQrCode,
} from "@/lib/evolution";

/** Result shape returned to the admin WhatsApp panel (serializable). */
type Result<T> = EvoResult<T> | { ok: false; error: "unauthorized" };

async function requireAdmin(): Promise<boolean> {
  return Boolean(await getCurrentUser());
}

/** Validate an instance name (letters, numbers, spaces, - and _). */
function cleanName(name: string): string | null {
  const n = name.trim();
  if (!n || n.length > 60 || !/^[\p{L}\p{N} _-]+$/u.test(n)) return null;
  return n;
}

export async function listInstancesAction(
  force = false,
): Promise<Result<EvoInstance[]>> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  return fetchInstances(force);
}

export async function createInstanceAction(name: string): Promise<Result<EvoQrCode>> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "invalid_name" };
  const res = await createInstance(clean);
  if (res.ok) invalidateInstances();
  return res;
}

export async function connectInstanceAction(name: string): Promise<Result<EvoQrCode>> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  return connectInstance(name);
}

export async function connectionStateAction(name: string): Promise<Result<string>> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  return getConnectionState(name);
}

export async function logoutInstanceAction(name: string): Promise<Result<unknown>> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  const res = await logoutInstance(name);
  if (res.ok) invalidateInstances();
  return res;
}

export async function deleteInstanceAction(name: string): Promise<Result<unknown>> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  const res = await deleteInstance(name);
  if (res.ok) invalidateInstances();
  return res;
}
