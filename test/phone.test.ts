import { describe, it, expect } from "vitest";
import { normalizePhoneBR, toWhatsappNumber, maskPhoneBR } from "@/lib/phone";

describe("normalizePhoneBR", () => {
  it("normalizes a masked 11-digit mobile to E.164", () => {
    expect(normalizePhoneBR("(13) 99618-4401")).toBe("+5513996184401");
  });

  it("accepts a 10-digit landline", () => {
    expect(normalizePhoneBR("13 3221-0000")).toBe("+551332210000");
  });

  it("strips a leading +55 country code", () => {
    expect(normalizePhoneBR("+55 13 99618-4401")).toBe("+5513996184401");
  });

  it("strips a bare 55 country code", () => {
    expect(normalizePhoneBR("5513996184401")).toBe("+5513996184401");
  });

  it("drops a single leading trunk 0", () => {
    expect(normalizePhoneBR("013996184401")).toBe("+5513996184401");
  });

  it("returns null when there are too few digits", () => {
    expect(normalizePhoneBR("99618-4401")).toBeNull(); // 9 digits
  });

  it("returns null for empty / nullish input", () => {
    expect(normalizePhoneBR("")).toBeNull();
    expect(normalizePhoneBR(null)).toBeNull();
    expect(normalizePhoneBR(undefined)).toBeNull();
  });
});

describe("toWhatsappNumber", () => {
  it("strips the leading + for the Evolution API", () => {
    expect(toWhatsappNumber("+5513996184401")).toBe("5513996184401");
  });
});

describe("maskPhoneBR", () => {
  it("masks progressively as digits are typed", () => {
    expect(maskPhoneBR("")).toBe("");
    expect(maskPhoneBR("13")).toBe("(13");
    expect(maskPhoneBR("139961")).toBe("(13) 9961");
  });

  it("formats a 10-digit landline", () => {
    expect(maskPhoneBR("1332210000")).toBe("(13) 3221-0000");
  });

  it("formats an 11-digit mobile", () => {
    expect(maskPhoneBR("13996184401")).toBe("(13) 99618-4401");
  });

  it("caps at 11 digits", () => {
    expect(maskPhoneBR("139961844019999")).toBe("(13) 99618-4401");
  });
});
