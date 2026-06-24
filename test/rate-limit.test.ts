import { describe, it, expect } from "vitest";
import { memLimit } from "@/lib/rate-limit";

// `memLimit(key, limit, windowMs, now)` is the pure in-memory fallback. It keeps
// a module-level store keyed by `key`, so each test uses a unique key.
describe("memLimit (in-memory fixed window)", () => {
  it("allows up to the limit, then blocks within the window", () => {
    const now = 1000;
    expect(memLimit("a", 2, 1000, now)).toEqual({ ok: true });
    expect(memLimit("a", 2, 1000, now)).toEqual({ ok: true });
    expect(memLimit("a", 2, 1000, now)).toEqual({ ok: false, retryAfter: 1 });
  });

  it("reports retryAfter in seconds until the window resets", () => {
    expect(memLimit("b", 1, 2000, 1000)).toEqual({ ok: true });
    // 1500ms into a window that resets at 3000 → 1500ms left → 2s (ceil).
    expect(memLimit("b", 1, 2000, 1500)).toEqual({ ok: false, retryAfter: 2 });
  });

  it("resets once the window has elapsed", () => {
    expect(memLimit("c", 1, 1000, 1000)).toEqual({ ok: true });
    expect(memLimit("c", 1, 1000, 1500)).toEqual({ ok: false, retryAfter: 1 });
    expect(memLimit("c", 1, 1000, 2000)).toEqual({ ok: true }); // reset <= now
  });
});
