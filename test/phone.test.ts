import { describe, it, expect } from "vitest";
import { normalizePhoneBR, toWhatsappNumber, maskPhoneBR } from "@/lib/phone";

describe("normalizePhoneBR", () => {
  it("normalizes a masked 11-digit mobile to E.164", () => {
    expect(normalizePhoneBR("(13) 91234-5678")).toBe("+5513912345678");
  });

  it("accepts a 10-digit landline", () => {
    expect(normalizePhoneBR("13 3221-0000")).toBe("+551332210000");
  });

  it("strips a leading +55 country code", () => {
    expect(normalizePhoneBR("+55 13 91234-5678")).toBe("+5513912345678");
  });

  it("strips a bare 55 country code", () => {
    expect(normalizePhoneBR("5513912345678")).toBe("+5513912345678");
  });

  it("drops a single leading trunk 0", () => {
    expect(normalizePhoneBR("013912345678")).toBe("+5513912345678");
  });

  it("returns null when there are too few digits", () => {
    expect(normalizePhoneBR("91234-5678")).toBeNull(); // 9 digits
  });

  it("returns null for empty / nullish input", () => {
    expect(normalizePhoneBR("")).toBeNull();
    expect(normalizePhoneBR(null)).toBeNull();
    expect(normalizePhoneBR(undefined)).toBeNull();
  });
});

describe("toWhatsappNumber", () => {
  it("strips the leading + for the Evolution API", () => {
    expect(toWhatsappNumber("+5513912345678")).toBe("5513912345678");
  });
});

describe("maskPhoneBR", () => {
  it("masks progressively as digits are typed", () => {
    expect(maskPhoneBR("")).toBe("");
    expect(maskPhoneBR("13")).toBe("(13");
    expect(maskPhoneBR("139123")).toBe("(13) 9123");
  });

  it("formats a 10-digit landline", () => {
    expect(maskPhoneBR("1332210000")).toBe("(13) 3221-0000");
  });

  it("formats an 11-digit mobile", () => {
    expect(maskPhoneBR("13912345678")).toBe("(13) 91234-5678");
  });

  it("caps at 11 digits", () => {
    expect(maskPhoneBR("139123456789999")).toBe("(13) 91234-5678");
  });
});
