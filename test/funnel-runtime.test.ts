import { describe, it, expect } from "vitest";
import { interpolateTokens } from "@/lib/funnel-runtime";

describe("interpolateTokens", () => {
  it("replaces {NOME}/{NAME} case-insensitively, trimming the value", () => {
    expect(interpolateTokens("Olá, {NOME}!", { name: "  Ana " })).toBe("Olá, Ana!");
    expect(interpolateTokens("Hi {name}", { name: "Bob" })).toBe("Hi Bob");
  });

  it("replaces {CARGO}/{ROLE}", () => {
    expect(interpolateTokens("Como {CARGO}", { role: "CEO" })).toBe("Como CEO");
  });

  it("replaces date, time and link tokens", () => {
    expect(
      interpolateTokens("{DATA} às {HORA} — {LINK}", {
        date: "10/06",
        time: "14h",
        link: "https://meet/x",
      }),
    ).toBe("10/06 às 14h — https://meet/x");
  });

  it("collapses unknown or empty tokens to an empty string", () => {
    expect(interpolateTokens("Oi {NOME}", {})).toBe("Oi ");
    expect(interpolateTokens("{CARGO}", { role: "   " })).toBe("");
  });

  it("tolerates spaced braces like { nome }", () => {
    expect(interpolateTokens("{ nome }", { name: "Ana" })).toBe("Ana");
  });
});
