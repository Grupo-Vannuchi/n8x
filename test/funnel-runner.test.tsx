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
});
