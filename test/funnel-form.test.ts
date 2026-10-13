import { describe, it, expect } from "vitest";
import { funnelToForm, formToInput } from "@/lib/funnel-form";

const funnel = {
  slug: "meet",
  locale: "pt",
  name: "Meeting funnel",
  status: "PUBLISHED" as const,
  whatsappInstance: "inst-1",
  defaultBlock: [
    { kind: "bot", text: "Oi" },
    { kind: "input", field: "name", prompt: "Seu nome?" },
  ],
};

const questions = [
  {
    key: "q1",
    kind: "CHOICE" as const,
    prompt: "Tem orçamento?",
    options: ["Sim", "Não"],
    optionNext: ["END", "q2"],
    next: "",
  },
  {
    key: "q2",
    kind: "TEXT" as const,
    prompt: "Conte mais sobre o projeto",
    options: [],
    optionNext: [],
    next: "e1",
  },
];

const endings = [
  {
    key: "e1",
    name: "Reunião",
    type: "MEETING" as const,
    completionMessage: "Obrigado",
    meetingDurationMinutes: 30,
    meetingSlotStartHour: 9,
    meetingSlotEndHour: 18,
    meetingDaysAhead: 14,
    meetingTimezone: "America/Sao_Paulo",
    bonusUrl: null,
    bonusButtonLabel: null,
    redirectUrl: null,
    redirectButtonLabel: null,
    redirectDelaySeconds: null,
  },
];

describe("funnel-form round-trip", () => {
  it("funnelToForm → formToInput preserves the funnel shape", () => {
    const input = formToInput(funnelToForm(funnel, questions, endings));

    expect(input).toMatchObject({
      slug: "meet",
      locale: "pt",
      name: "Meeting funnel",
      status: "PUBLISHED",
      whatsappInstance: "inst-1",
      defaultBlock: [
        { kind: "bot", text: "Oi" },
        { kind: "input", field: "name", prompt: "Seu nome?" },
      ],
    });

    expect(input.questions).toHaveLength(2);
    expect(input.questions[0]).toMatchObject({
      kind: "CHOICE",
      prompt: "Tem orçamento?",
      options: ["Sim", "Não"],
      optionNext: ["END", "q2"],
    });
    // The descriptive question round-trips with its single continuation target
    // and no options.
    expect(input.questions[1]).toMatchObject({
      kind: "TEXT",
      prompt: "Conte mais sobre o projeto",
      options: [],
      optionNext: [],
      next: "e1",
    });

    expect(input.endings).toHaveLength(1);
    expect(input.endings[0]).toMatchObject({
      name: "Reunião",
      type: "MEETING",
      completionMessage: "Obrigado",
      meetingDurationMinutes: 30,
      // null numeric fields fall back to their form defaults on the way back.
      redirectDelaySeconds: 3,
    });
  });

  it("round-trips a question's field name and answer format", () => {
    const named = [
      { ...questions[0], fieldName: "Orçamento", inputType: "TEXT" as const },
      { ...questions[1], fieldName: " CNPJ ", inputType: "CNPJ" as const },
    ];
    const input = formToInput(funnelToForm(funnel, named, endings));
    expect(input.questions[0]).toMatchObject({ fieldName: "Orçamento", inputType: "TEXT" });
    expect(input.questions[1]).toMatchObject({ fieldName: "CNPJ", inputType: "CNPJ" });
  });

  it("defaults legacy questions to no field name and free text", () => {
    const input = formToInput(funnelToForm(funnel, questions, endings));
    expect(input.questions[1]).toMatchObject({ fieldName: "", inputType: "TEXT" });
  });

  it("stores a choice question's format as TEXT even if the form held another", () => {
    const form = funnelToForm(funnel, questions, endings);
    form.questions[0]!.inputType = "CPF";
    expect(formToInput(form).questions[0]).toMatchObject({ kind: "CHOICE", inputType: "TEXT" });
  });
});
