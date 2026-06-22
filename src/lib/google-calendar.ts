import "server-only";
import { google } from "googleapis";
import { addDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * Google Calendar integration for MEETING funnels: a single connected company
 * account (tokens in the `GoogleAccount` singleton) whose calendar is read for
 * free/busy and written to when a visitor books. Everything degrades gracefully
 * when unconfigured/disconnected — callers get empty slots or a clear error.
 */

/** The OAuth2 client type as produced by `googleapis` (avoids the duplicate
 * google-auth-library type clash when passing it to `google.calendar`). */
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "openid",
  "email",
];

export type MeetingSlot = {
  startISO: string;
  dayLabel: string;
  timeLabel: string;
};

type MeetingConfig = {
  meetingDurationMinutes: number | null;
  meetingSlotStartHour: number | null;
  meetingSlotEndHour: number | null;
  meetingDaysAhead: number | null;
  meetingTimezone: string | null;
};

/** Redirect URI registered in Google Cloud (derived from the site URL if unset). */
function redirectUri(): string {
  return (
    env.GOOGLE_REDIRECT_URI ||
    `${env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/api/admin/google/callback`
  );
}

export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function oauthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  );
}

/** The Google consent URL (offline + forced consent to always get a refresh token). */
export function consentUrl(): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

/** Exchange the OAuth code for tokens and persist the single GoogleAccount row. */
export async function exchangeCodeAndStore(code: string): Promise<void> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let email: string | null = null;
  try {
    const info = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
    email = info.data.email ?? null;
  } catch {
    // userinfo is best-effort — booking works without the display email.
  }

  const existing = await prisma.googleAccount.findFirst();
  const data = {
    email,
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? null,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    scope: tokens.scope ?? null,
  };

  if (existing) {
    await prisma.googleAccount.update({ where: { id: existing.id }, data });
  } else {
    await prisma.googleAccount.create({ data });
  }
}

/** Remove the stored Google connection. */
export async function disconnectGoogleAccount(): Promise<void> {
  // GoogleAccount is a singleton table — `deleteMany()` without a `where` clears
  // the single connection row on purpose (disconnect), not an accidental wipe.
  await prisma.googleAccount.deleteMany();
}

type AuthedContext = {
  client: OAuth2Client;
  calendarId: string;
};

/** Build an authed client from the stored refresh token; persists refreshed tokens. */
async function authedContext(): Promise<AuthedContext | null> {
  if (!isGoogleConfigured()) return null;
  const account = await prisma.googleAccount.findFirst();
  if (!account?.refreshToken) return null;

  const client = oauthClient();
  client.setCredentials({
    refresh_token: account.refreshToken,
    access_token: account.accessToken ?? undefined,
    expiry_date: account.expiryDate?.getTime(),
  });

  // Persist rotated access/refresh tokens as googleapis refreshes them.
  client.on("tokens", (t) => {
    prisma.googleAccount
      .update({
        where: { id: account.id },
        data: {
          accessToken: t.access_token ?? account.accessToken,
          expiryDate: t.expiry_date ? new Date(t.expiry_date) : account.expiryDate,
          ...(t.refresh_token ? { refreshToken: t.refresh_token } : {}),
        },
      })
      .catch((e) => console.error("Failed to persist refreshed Google token", e));
  });

  return { client, calendarId: account.calendarId };
}

type BusyInterval = { start: Date; end: Date };

async function getFreeBusy(
  ctx: AuthedContext,
  start: Date,
  end: Date,
): Promise<BusyInterval[]> {
  const calendar = google.calendar({ version: "v3", auth: ctx.client });
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: ctx.calendarId }],
    },
  });
  const busy = res.data.calendars?.[ctx.calendarId]?.busy ?? [];
  return busy
    .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

/** Generate bookable slots in the funnel's timezone, excluding busy/past times. */
export async function getAvailableSlots(
  funnel: MeetingConfig,
  locale: string,
): Promise<MeetingSlot[]> {
  const ctx = await authedContext();
  if (!ctx) return [];

  const tz = funnel.meetingTimezone || "America/Sao_Paulo";
  const duration = funnel.meetingDurationMinutes ?? 30;
  const startHour = funnel.meetingSlotStartHour ?? 9;
  const endHour = funnel.meetingSlotEndHour ?? 18;
  const daysAhead = funnel.meetingDaysAhead ?? 14;

  const now = new Date();
  let busy: BusyInterval[];
  try {
    busy = await getFreeBusy(ctx, now, addDays(now, daysAhead + 1));
  } catch (error) {
    // Missing scope, revoked access, API hiccup — never crash the public funnel.
    console.error("Failed to read Google free/busy", error);
    return [];
  }

  const nowTz = new TZDate(now.getTime(), tz);
  const y = nowTz.getFullYear();
  const mo = nowTz.getMonth();
  const d = nowTz.getDate();
  const dayFmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: tz,
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });

  const minLead = now.getTime() + 60 * 60 * 1000; // at least 1h ahead
  const slots: MeetingSlot[] = [];

  for (let i = 0; i <= daysAhead && slots.length < 48; i++) {
    for (let mins = startHour * 60; mins + duration <= endHour * 60; mins += duration) {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      const start = new Date(new TZDate(y, mo, d + i, hh, mm, 0, tz).getTime());
      if (start.getTime() <= minLead) continue;
      const end = new Date(start.getTime() + duration * 60000);
      if (busy.some((b) => start < b.end && end > b.start)) continue;
      slots.push({
        startISO: start.toISOString(),
        dayLabel: dayFmt.format(start),
        timeLabel: timeFmt.format(start),
      });
    }
  }
  return slots;
}

export type BookResult =
  | { ok: true; eventId: string; meetLink: string | null }
  | { ok: false; error: "not_configured" | "slot_taken" | "unknown" };

/** Re-check availability then create the calendar event. */
export async function bookMeeting(
  funnel: MeetingConfig,
  startISO: string,
  attendee: { name: string; phone: string | null; email: string | null },
): Promise<BookResult> {
  const ctx = await authedContext();
  if (!ctx) return { ok: false, error: "not_configured" };

  const duration = funnel.meetingDurationMinutes ?? 30;
  const start = new Date(startISO);
  const end = new Date(start.getTime() + duration * 60000);

  try {
    // Read-then-write race guard: re-check right before inserting.
    const busy = await getFreeBusy(ctx, start, end);
    if (busy.some((b) => start < b.end && end > b.start)) {
      return { ok: false, error: "slot_taken" };
    }

    const calendar = google.calendar({ version: "v3", auth: ctx.client });
    const res = await calendar.events.insert({
      calendarId: ctx.calendarId,
      // Required for Google to provision a Meet link via createRequest.
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Reunião — ${attendee.name}`,
        description: [
          "Agendado por um funil do site.",
          `Nome: ${attendee.name}`,
          `WhatsApp: ${attendee.phone ?? "-"}`,
          `E-mail: ${attendee.email ?? "-"}`,
        ].join("\n"),
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    // The generated Google Meet URL (hangoutLink, or the video entry point).
    const meetLink =
      res.data.hangoutLink ??
      res.data.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video",
      )?.uri ??
      null;

    return { ok: true, eventId: res.data.id ?? "", meetLink };
  } catch (error) {
    console.error("Failed to create calendar event", error);
    return { ok: false, error: "unknown" };
  }
}
