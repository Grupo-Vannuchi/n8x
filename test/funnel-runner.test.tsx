import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithIntl, screen, waitFor, userEvent } from "./test-utils";
import type { FunnelRunView } from "@/lib/queries";

vi.mock("@/app/actions/funnels-public", () => ({ submitFunnel: vi.fn() }));
// The scheduler is only used by MEETING endings (and pulls in its own action);
// stub it out — these tests exercise the MESSAGE path.
vi.mock("@/components/funnels/funnel-scheduler", () => ({
  FunnelScheduler: () => null,
}));

import { submitFunnel } from "@/app/actions/funnels-public";
import { FunnelRunner } from "@/components/funnels/funnel-runner";

const mockSubmit = vi.mocked(submitFunnel);

/** A MESSAGE ending with all the optional fields the runner reads. */
function messageEnding(key: string) {
  return {
    key,
    name: key,
    type: "MESSAGE" as const,
    completionMessage: "Obrigado!",
    bonusUrl: null,
    bonusButtonLabel: null,
    redirectUrl: null,
    redirectButtonLabel: null,
    redirectDelaySeconds: 0,
  };
}

// No default block (keep the conversation to the single question), one question
// whose "Não" option branches straight to a MESSAGE ending.
const funnel = {
  id: "f1",
  slug: "x",
  locale: "pt",
  name: "X",
  defaultBlock: [],
  questions: [
    {
      key: "q1",
      prompt: "Tem interesse?",
      options: [
        { label: "Sim", next: "END" },
        { label: "Não", next: "end-msg" },
      ],
    },
  ],
  endings: [messageEnding("end-default"), messageEnding("end-msg")],
} as unknown as FunnelRunView;

beforeEach(() => {
  mockSubmit.mockReset();
  mockSubmit.mockResolvedValue({ ok: true });
});

describe("FunnelRunner", () => {
  it("includes the just-picked answer when a choice branches straight to an ending (regression: 'Não' keeps the answer)", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FunnelRunner funnel={funnel} />);

    // The question appears after the typing delay.
    await user.click(await screen.findByRole("button", { name: "Não" }));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    const payload = mockSubmit.mock.calls[0]![0];
    expect(payload.endingKey).toBe("end-msg");
    // The bug this guards: the answer just picked must be in the submission,
    // not dropped by the stale `answers` closure.
    expect(payload.answers).toEqual([
      { questionId: "q1", prompt: "Tem interesse?", answer: "Não" },
    ]);
  });

  /** A funnel made only of the given custom questions, ending in a MESSAGE. */
  function questionsFunnel(questions: unknown[]) {
    return {
      id: "f2",
      slug: "y",
      locale: "pt",
      name: "Y",
      defaultBlock: [],
      questions,
      endings: [messageEnding("end-default")],
    } as unknown as FunnelRunView;
  }

  it("blocks an invalid CNPJ with an inline error and submits the valid one formatted", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <FunnelRunner
        funnel={questionsFunnel([
          {
            key: "q1",
            kind: "TEXT",
            prompt: "Qual o CNPJ?",
            options: [],
            next: "END",
            fieldName: "CNPJ",
            inputType: "CNPJ",
          },
        ])}
      />,
    );

    const input = await screen.findByPlaceholderText("Digite sua resposta…");
    await user.type(input, "11222333000182");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Digite um CNPJ válido.")).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "11222333000181");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0]![0].answers).toEqual([
      { questionId: "q1", prompt: "Qual o CNPJ?", answer: "11.222.333/0001-81" },
    ]);
  });

  it("quotes an earlier answer through its field token in the next message", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <FunnelRunner
        funnel={questionsFunnel([
          {
            key: "q1",
            kind: "TEXT",
            prompt: "Qual o nome da sua empresa?",
            options: [],
            next: "",
            fieldName: "Empresa",
            inputType: "TEXT",
          },
          {
            key: "q2",
            kind: "CHOICE",
            prompt: "Quantas pessoas trabalham na {empresa}?",
            options: [{ label: "Até 10", next: "END" }],
            next: "",
            fieldName: "",
            inputType: "TEXT",
          },
        ])}
      />,
    );

    await user.type(await screen.findByPlaceholderText("Digite sua resposta…"), "Acme");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(
      await screen.findByText("Quantas pessoas trabalham na Acme?"),
    ).toBeInTheDocument();
  });
});
