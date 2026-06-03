"use server";

import { prisma } from "@/lib/prisma";
import {
  careerSchema,
  contactSchema,
  type CareerInput,
  type ContactInput,
} from "@/lib/validations/lead";
import { hasLocale } from "next-intl";
import { defaultLocale, routing } from "@/i18n/routing";

export type LeadResult = { ok: boolean };

function resolveLocale(locale: string): string {
  return hasLocale(routing.locales, locale) ? locale : defaultLocale;
}

/** Persist a contact-form submission. Re-validates server-side. */
export async function submitContactLead(
  input: ContactInput,
  locale: string,
): Promise<LeadResult> {
  const parsed = contactSchema().safeParse(input);
  if (!parsed.success) return { ok: false };

  try {
    const { name, email, phone, company, message } = parsed.data;
    await prisma.lead.create({
      data: {
        type: "CONTACT",
        name,
        email,
        phone: phone || null,
        company: company || null,
        message,
        locale: resolveLocale(locale),
      },
    });
    return { ok: true };
  } catch (error) {
    console.error("Failed to persist contact lead", error);
    return { ok: false };
  }
}

/** Persist a careers-form submission. Re-validates server-side. */
export async function submitCareerLead(
  input: CareerInput,
  locale: string,
): Promise<LeadResult> {
  const parsed = careerSchema().safeParse(input);
  if (!parsed.success) return { ok: false };

  try {
    const { name, email, phone, role, portfolio, message } = parsed.data;
    await prisma.lead.create({
      data: {
        type: "CAREER",
        name,
        email,
        phone: phone || null,
        role: role || null,
        portfolio: portfolio || null,
        message,
        locale: resolveLocale(locale),
      },
    });
    return { ok: true };
  } catch (error) {
    console.error("Failed to persist career lead", error);
    return { ok: false };
  }
}
