import "server-only";
import { env } from "@/lib/env";
import { toWhatsappNumber } from "@/lib/phone";

/**
 * Minimal Evolution API (WhatsApp) client. Server-only. Never throws to the
 * caller — returns a discriminated result and logs — so a WhatsApp failure can
 * never block funnel submission persistence. Reused by the completion message
 * and the MESSAGE-type funnel ending.
 */

export type SendResult = { ok: true } | { ok: false; error: string };

/** Whether the Evolution integration has all its env vars set. */
export function isEvolutionConfigured(): boolean {
  return Boolean(
    env.EVOLUTION_BASE_URL && env.EVOLUTION_API_KEY && env.EVOLUTION_INSTANCE,
  );
}

/** Send a plain-text WhatsApp message to an E.164 number. */
export async function sendText(
  phoneE164: string,
  message: string,
): Promise<SendResult> {
  if (!isEvolutionConfigured()) return { ok: false, error: "not_configured" };
  if (!message.trim()) return { ok: false, error: "empty_message" };

  const base = env.EVOLUTION_BASE_URL!.replace(/\/+$/, "");
  // Instance names can contain spaces (e.g. "BOAS VINDAS") — encode the segment.
  const url = `${base}/message/sendText/${encodeURIComponent(env.EVOLUTION_INSTANCE!)}`;
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
