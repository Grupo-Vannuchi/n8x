import { describe, it, expect } from "vitest";
import {
  fieldToken,
  fieldNameIssue,
  hasFieldNameIssue,
  validateAnswer,
  maskAnswer,
  buildFieldValues,
} from "@/lib/funnel-fields";

describe("fieldToken", () => {
  it("lowercases, strips accents and joins words with _", () => {
    expect(fieldToken("Nome da Empresa")).toBe("nome_da_empresa");
    expect(fieldToken("  Endereço Comercial! ")).toBe("endereco_comercial");
  });

  it("returns '' when nothing usable remains", () => {
    expect(fieldToken("!!!")).toBe("");
  });
});

describe("fieldNameIssue", () => {
  const qs = (...names: string[]) => names.map((fieldName) => ({ fieldName }));

  it("accepts an empty name (the question just has no variable)", () => {
    expect(fieldNameIssue(qs(""), 0)).toBeNull();
  });

  it("accepts a unique, non-reserved name", () => {
    expect(fieldNameIssue(qs("Empresa", "Cidade"), 0)).toBeNull();
  });

  it("flags a name with no usable characters", () => {
    expect(fieldNameIssue(qs("!!!"), 0)).toBe("invalid");
  });

  it("flags names that collide with built-in tokens", () => {
    expect(fieldNameIssue(qs("Nome"), 0)).toBe("reserved");
    expect(fieldNameIssue(qs("Data"), 0)).toBe("reserved");
  });

  it("flags duplicates by token, ignoring case and accents", () => {
    const list = qs("Endereço", "endereco");
    expect(fieldNameIssue(list, 0)).toBe("duplicate");
    expect(fieldNameIssue(list, 1)).toBe("duplicate");
  });

  it("hasFieldNameIssue is true when any question has an issue", () => {
    expect(hasFieldNameIssue(qs("Empresa", "Cidade"))).toBe(false);
    expect(hasFieldNameIssue(qs("Empresa", "Cargo"))).toBe(true);
  });
});

describe("validateAnswer", () => {
  const ok = (value: string) => ({ ok: true, value });
  const bad = { ok: false };

  it("TEXT: trims, rejects blank", () => {
    expect(validateAnswer("TEXT", "  oi  ", "pt")).toEqual(ok("oi"));
    expect(validateAnswer("TEXT", "   ", "pt")).toEqual(bad);
  });

  it("NUMBER: integers and decimals in pt or en notation", () => {
    for (const n of ["1500", "12,5", "12.5", "1.500,50", "1,500.50", "-3"]) {
      expect(validateAnswer("NUMBER", n, "pt")).toEqual(ok(n));
    }
    for (const n of ["abc", "1.2.3", "12,", "1 500"]) {
      expect(validateAnswer("NUMBER", n, "pt")).toEqual(bad);
    }
  });

  it("DATE: real calendar dates, dd/mm/yyyy in pt and mm/dd/yyyy in en", () => {
    expect(validateAnswer("DATE", "29/02/2024", "pt")).toEqual(ok("29/02/2024"));
    expect(validateAnswer("DATE", "29/02/2023", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "31/04/2026", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "31/02/2026", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "2026-02-10", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "02/29/2024", "en")).toEqual(ok("02/29/2024"));
    expect(validateAnswer("DATE", "13/01/2026", "en")).toEqual(bad);
  });

  it("CPF: check digits, stored formatted", () => {
    expect(validateAnswer("CPF", "52998224725", "pt")).toEqual(ok("529.982.247-25"));
    expect(validateAnswer("CPF", "529.982.247-25", "pt")).toEqual(ok("529.982.247-25"));
    expect(validateAnswer("CPF", "529.982.247-24", "pt")).toEqual(bad);
    expect(validateAnswer("CPF", "111.111.111-11", "pt")).toEqual(bad);
  });

  it("CNPJ: numeric and the 2026 alphanumeric format, stored formatted", () => {
    expect(validateAnswer("CNPJ", "11222333000181", "pt")).toEqual(
      ok("11.222.333/0001-81"),
    );
    // Official Receita Federal example of the alphanumeric format.
    expect(validateAnswer("CNPJ", "12.abc.345/01de-35", "pt")).toEqual(
      ok("12.ABC.345/01DE-35"),
    );
    expect(validateAnswer("CNPJ", "11.222.333/0001-82", "pt")).toEqual(bad);
    expect(validateAnswer("CNPJ", "12.ABC.345/01DE-36", "pt")).toEqual(bad);
    expect(validateAnswer("CNPJ", "11.111.111/1111-11", "pt")).toEqual(bad);
  });

  it("URL: adds https:// when missing, needs a dotted host", () => {
    expect(validateAnswer("URL", "n8xmarketing.com.br", "pt")).toEqual(
      ok("https://n8xmarketing.com.br"),
    );
    expect(validateAnswer("URL", "https://instagram.com/n8x", "pt")).toEqual(
      ok("https://instagram.com/n8x"),
    );
    for (const u of ["localhost", "não é url", "ftp://x.com"]) {
      expect(validateAnswer("URL", u, "pt")).toEqual(bad);
    }
  });
});

describe("maskAnswer", () => {
  it("masks CPF, CNPJ and dates while typing", () => {
    expect(maskAnswer("CPF", "5299822")).toBe("529.982.2");
    expect(maskAnswer("CPF", "52998224725999")).toBe("529.982.247-25");
    expect(maskAnswer("CNPJ", "12abc34501de35")).toBe("12.ABC.345/01DE-35");
    expect(maskAnswer("DATE", "2902")).toBe("29/02");
    expect(maskAnswer("DATE", "29022024")).toBe("29/02/2024");
  });

  it("leaves the other formats untouched", () => {
    expect(maskAnswer("TEXT", "Olá, mundo")).toBe("Olá, mundo");
    expect(maskAnswer("URL", "site.com")).toBe("site.com");
  });
});

describe("buildFieldValues", () => {
  const questions = [
    { key: "q1", fieldName: "Empresa" },
    { key: "q2", fieldName: "" },
    { key: "q3", fieldName: "Cidade" },
  ];

  it("maps every named field to its answer, '' until answered", () => {
    expect(
      buildFieldValues(questions, [{ questionId: "q1", answer: "Acme" }]),
    ).toEqual({ empresa: "Acme", cidade: "" });
  });

  it("keeps the latest answer when a question is answered twice", () => {
    expect(
      buildFieldValues(questions, [
        { questionId: "q1", answer: "A" },
        { questionId: "q1", answer: "B" },
      ]).empresa,
    ).toBe("B");
  });
});
