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

describe("interpolateTokens — custom field tokens", () => {
  const fields = { empresa: "Acme", cidade: "" };

  it("replaces a defined field token with its answer, case-insensitively", () => {
    expect(interpolateTokens("Na {empresa} ou {EMPRESA}?", { fields })).toBe(
      "Na Acme ou Acme?",
    );
  });

  it("renders a defined but unanswered field as empty", () => {
    expect(interpolateTokens("Em {cidade}.", { fields })).toBe("Em .");
  });

  it("leaves an undefined token literal, so typos stay visible", () => {
    expect(interpolateTokens("Na {empresaa}", { fields })).toBe("Na {empresaa}");
  });

  it("fills built-in and custom tokens together", () => {
    expect(interpolateTokens("{NOME}, da {empresa}", { name: "Ana", fields })).toBe(
      "Ana, da Acme",
    );
  });

  it("never re-interpolates a value that itself looks like a token", () => {
    expect(
      interpolateTokens("{NOME} / {empresa}", { name: "{empresa}", fields }),
    ).toBe("{empresa} / Acme");
  });

  it("does not resolve object-prototype names as fields", () => {
    expect(interpolateTokens("{constructor}", { fields })).toBe("{constructor}");
  });
});
