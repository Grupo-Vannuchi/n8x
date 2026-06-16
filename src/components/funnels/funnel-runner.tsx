"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  interpolateTokens,
  type FunnelLeadValues,
  type FunnelAnswer,
} from "@/lib/funnel-runtime";
import { normalizePhoneBR, maskPhoneBR } from "@/lib/phone";
import type { FunnelRunView } from "@/lib/queries";
import { submitFunnel } from "@/app/actions/funnels-public";
import { FunnelScheduler } from "@/components/funnels/funnel-scheduler";

/** A single conversational node the runner walks through, in order. */
type Node =
  | { type: "bot"; text: string }
  | { type: "input"; field: "name" | "role" | "phone" | "email"; prompt: string }
  | { type: "choice"; questionId: string; prompt: string; options: string[] };

type ChatMessage = { role: "bot" | "user"; text: string };

const TYPING_MS = 650;

/** Build the ordered node list from the default block + custom questions. */
function buildNodes(funnel: FunnelRunView): Node[] {
  const nodes: Node[] = [];
  for (const step of funnel.defaultBlock) {
    if (step.kind === "bot") nodes.push({ type: "bot", text: step.text });
    else nodes.push({ type: "input", field: step.field, prompt: step.prompt });
  }
  for (const q of funnel.questions) {
    nodes.push({
      type: "choice",
      questionId: q.id,
      prompt: q.prompt,
      options: q.options,
    });
  }
  return nodes;
}

const inputType: Record<string, string> = {
  name: "text",
  role: "text",
  phone: "tel",
  email: "email",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldError = "invalidPhone" | "invalidEmail";

/** Validate a capture field; returns a `funnel` message key or null if ok. */
function validateField(field: string, value: string): FieldError | null {
  if (field === "phone" && !normalizePhoneBR(value)) return "invalidPhone";
  if (field === "email" && !EMAIL_RE.test(value)) return "invalidEmail";
  return null;
}

export function FunnelRunner({ funnel }: { funnel: FunnelRunView }) {
  const t = useTranslations("funnel");
  const nodes = useMemo(() => buildNodes(funnel), [funnel]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [index, setIndex] = useState(0);
  const [awaiting, setAwaiting] = useState(false);
  const [typing, setTyping] = useState(true);
  const [draft, setDraft] = useState("");
  const [inputError, setInputError] = useState<FieldError | null>(null);
  const [status, setStatus] = useState<
    "running" | "scheduling" | "submitting" | "done" | "error"
  >("running");
  const [bookedISO, setBookedISO] = useState<string | null>(null);
  const [retryNotice, setRetryNotice] = useState(false);

  const [values, setValues] = useState<FunnelLeadValues>({});
  const [answers, setAnswers] = useState<FunnelAnswer[]>([]);
  const submittedRef = useRef(false);
  const tokenRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Drive the conversation: show the current node (bot lines auto-advance;
  // input/choice nodes show their prompt then wait for the visitor).
  // The typing animation intentionally sets state inside a timeout, so the
  // set-state-in-effect rule is disabled for this orchestration effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (status !== "running") return;
    const node = nodes[index];

    if (!node) {
      // MEETING funnels schedule before persisting; others submit immediately.
      if (funnel.type === "MEETING") setStatus("scheduling");
      else void runSubmit();
      return;
    }

    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      const text = interpolateTokens(
        node.type === "bot" ? node.text : node.prompt,
        values,
      );
      setMessages((m) => [...m, { role: "bot", text }]);
      if (node.type === "bot") {
        setIndex((i) => i + 1);
      } else {
        setAwaiting(true);
      }
    }, TYPING_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, status]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, status]);

  async function runSubmit(meetingStartAt?: string) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setStatus("submitting");
    if (!tokenRef.current) tokenRef.current = crypto.randomUUID();
    const res = await submitFunnel({
      funnelId: funnel.id,
      submissionToken: tokenRef.current,
      name: values.name ?? "",
      role: values.role,
      phone: values.phone,
      email: values.email,
      answers,
      meetingStartAt,
    });
    if (res.ok) {
      setBookedISO(meetingStartAt ?? null);
      setStatus("done");
    } else if (res.error === "slot_taken") {
      // That slot was just taken — re-open the picker for another choice.
      submittedRef.current = false;
      setRetryNotice(true);
      setStatus("scheduling");
    } else {
      setStatus("error");
    }
  }

  function answerInput(field: "name" | "role" | "phone" | "email") {
    const value = draft.trim();
    if (!value) return;
    const error = validateField(field, value);
    if (error) {
      setInputError(error);
      return;
    }
    setValues((v) => ({ ...v, [field]: value }));
    setMessages((m) => [...m, { role: "user", text: value }]);
    setDraft("");
    setInputError(null);
    setAwaiting(false);
    setIndex((i) => i + 1);
  }

  function answerChoice(questionId: string, prompt: string, option: string) {
    setAnswers((a) => [...a, { questionId, prompt, answer: option }]);
    setMessages((m) => [...m, { role: "user", text: option }]);
    setAwaiting(false);
    setIndex((i) => i + 1);
  }

  function retry() {
    submittedRef.current = false;
    setStatus("running");
    setIndex(nodes.length); // re-trigger the submit effect
  }

  const current = nodes[index];
  const inputNode = current?.type === "input" ? current : null;
  const choiceNode = current?.type === "choice" ? current : null;
  const showInput = awaiting && inputNode !== null && status === "running";
  const showChoices = awaiting && choiceNode !== null && status === "running";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6">
      {/* Transcript */}
      <div className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] text-pretty rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              m.role === "bot"
                ? "self-start rounded-bl-sm bg-muted text-foreground"
                : "self-end rounded-br-sm bg-brand text-brand-foreground",
            )}
          >
            {m.text}
          </div>
        ))}

        {typing && status === "running" ? (
          <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
            <span className="flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40" />
            </span>
          </div>
        ) : null}

        {status === "scheduling" ? (
          <FunnelScheduler
            funnelId={funnel.id}
            retryNotice={retryNotice}
            onConfirm={(iso) => runSubmit(iso)}
            onUnavailable={() => runSubmit()}
          />
        ) : null}

        {status === "submitting" ? (
          <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {funnel.type === "MEETING" ? t("booking") : t("submitting")}
          </div>
        ) : null}

        {status === "done" ? (
          <FunnelCompletion funnel={funnel} bookedISO={bookedISO} />
        ) : null}

        {status === "error" ? (
          <div className="self-start">
            <p className="text-sm text-red-500">{t("errorRetry")}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
            >
              {t("retry")}
            </button>
          </div>
        ) : null}

        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      {showChoices && choiceNode ? (
        <div className="mt-4 flex flex-col gap-2">
          {choiceNode.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                answerChoice(choiceNode.questionId, choiceNode.prompt, option)
              }
              className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:border-brand hover:bg-brand/5"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {showInput && inputNode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            answerInput(inputNode.field);
          }}
          className="mt-4 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type={inputType[inputNode.field]}
              inputMode={inputNode.field === "phone" ? "numeric" : undefined}
              value={draft}
              onChange={(e) => {
                const raw = e.target.value;
                setDraft(
                  inputNode.field === "phone" ? maskPhoneBR(raw) : raw,
                );
                if (inputError) setInputError(null);
              }}
              placeholder={
                inputNode.field === "phone"
                  ? "(13) 99618-4401"
                  : t("placeholder")
              }
              aria-invalid={Boolean(inputError)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus-visible:border-brand focus-visible:outline-none aria-[invalid=true]:border-red-500"
            />
            <button
              type="submit"
              aria-label={t("send")}
              disabled={!draft.trim()}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground transition-opacity disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </div>
          {inputError ? (
            <p className="px-1 text-xs text-red-500">{t(inputError)}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

/**
 * Derive a preview URL and a direct-download URL from a bonus link. For Google
 * Drive links we extract the file id and build the `uc?export=download` form
 * (the `download` HTML attribute is ignored cross-origin, so this is what
 * actually forces the file to download). Non-Drive links are used as-is.
 */
function bonusLinks(url: string): { preview: string; download: string } {
  const match =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = match?.[1];
  if (id) {
    return {
      preview: `https://drive.google.com/file/d/${id}/view`,
      download: `https://drive.google.com/uc?export=download&id=${id}`,
    };
  }
  return { preview: url, download: url };
}

/** Open the PDF in a new tab AND trigger its download (per the funnel request). */
function openAndDownloadBonus(url: string) {
  const { preview, download } = bonusLinks(url);
  window.open(preview, "_blank", "noopener,noreferrer");
  const a = document.createElement("a");
  a.href = download;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** The end-of-funnel screen, varying by funnel type (bonus download, booked meeting). */
function FunnelCompletion({
  funnel,
  bookedISO,
}: {
  funnel: FunnelRunView;
  bookedISO: string | null;
}) {
  const t = useTranslations("funnel");
  const locale = useLocale();

  const bonusUrl = funnel.type === "BONUS" ? funnel.bonusUrl : null;
  const meetingBooked = funnel.type === "MEETING" && bookedISO;
  const bookedLabel = bookedISO
    ? new Date(bookedISO).toLocaleString(locale, {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-6 text-center">
      <h2 className="text-lg font-bold">
        {meetingBooked ? t("bookedTitle") : t("completionTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {meetingBooked ? bookedLabel : t("completionText")}
      </p>

      {bonusUrl ? (
        <button
          type="button"
          onClick={() => openAndDownloadBonus(bonusUrl)}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
        >
          {funnel.bonusButtonLabel || t("download")}
        </button>
      ) : null}
    </div>
  );
}
