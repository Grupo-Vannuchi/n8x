import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { renderWithIntl, screen, waitFor, userEvent } from "./test-utils";

// n8x uses Server Actions, not client fetch — mock the action module directly
// (no MSW). The component should call it with the typed payload + locale.
vi.mock("@/app/actions/leads", () => ({ submitContactLead: vi.fn() }));

import { submitContactLead } from "@/app/actions/leads";
import { ContactForm } from "@/components/forms/contact-form";

const mockSubmit = vi.mocked(submitContactLead);

beforeEach(() => {
  mockSubmit.mockReset();
});

describe("ContactForm", () => {
  it("keeps the honeypot out of the accessibility tree", () => {
    renderWithIntl(<ContactForm />);
    // Visible fields: name, email, phone, company, message (5). The honeypot is
    // aria-hidden, so it must NOT show up as an accessible textbox.
    expect(screen.getAllByRole("textbox")).toHaveLength(5);
  });

  it("blocks submission and flags invalid fields when empty", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(screen.getAllByRole("textbox")[0]).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data with the locale and shows the success state", async () => {
    mockSubmit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    const [name, email, , , message] = screen.getAllByRole("textbox");
    await user.type(name, "Ana");
    await user.type(email, "ana@example.com");
    await user.type(message, "Olá, gostaria de saber mais sobre os serviços.");
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ana",
        email: "ana@example.com",
        message: "Olá, gostaria de saber mais sobre os serviços.",
      }),
      "pt",
    );
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = renderWithIntl(<ContactForm />);
    const results = await axe(container);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
