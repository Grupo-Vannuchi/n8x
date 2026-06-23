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
import type { FunnelRunView, FunnelEndingView } from "@/lib/queries";
import { submitFunnel } from "@/app/actions/funnels-public";
import { FunnelScheduler } from "@/components/funnels/funnel-scheduler";

/** A single conversational node the runner walks through, in order. */
type ChoiceOption = { label: string; next: string };

type Node =
  | { type: "bot"; text: string }
  | { type: "input"; field: "name" | "role" | "phone" | "email"; prompt: string }
  | {
      type: "choice";
      questionKey: string;
      prompt: string;
      options: ChoiceOption[];
    };

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
      questionKey: q.key,
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
  // Branch target lookup: question key → its node index.
  const keyToIndex = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n, i) => {
      if (n.type === "choice") map.set(n.questionKey, i);
    });
    return map;
  }, [nodes]);
  // Branch target lookup: ending key → the ending.
  const endingByKey = useMemo(() => {
    const map = new Map<string, FunnelEndingView>();
    for (const e of funnel.endings) map.set(e.key, e);
    return map;
  }, [funnel.endings]);
  const defaultEnding = funnel.endings[0];

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
  const [errorKey, setErrorKey] = useState<"errorRetry" | "rateLimited">(
    "errorRetry",
  );
  // A MEETING ending whose scheduler couldn't load slots (e.g. Google expired):
  // we still capture the lead, but say so honestly instead of faking completion.
  const [meetingUnavailable, setMeetingUnavailable] = useState(false);
  const [reachedEnding, setReachedEnding] = useState<FunnelEndingView | null>(null);

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
      // End of the path with no explicit branch target → the default ending.
      reachEnding(defaultEnding);
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

  /** Reach a funnel ending: a MEETING opens the scheduler; others submit now. */
  function reachEnding(ending: FunnelEndingView) {
    setReachedEnding(ending);
    if (ending.type === "MEETING") setStatus("scheduling");
    else void runSubmit(ending);
  }

  async function runSubmit(ending: FunnelEndingView, meetingStartAt?: string) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setStatus("submitting");
    if (!tokenRef.current) tokenRef.current = crypto.randomUUID();
    const res = await submitFunnel({
      funnelId: funnel.id,
      endingKey: ending.key,
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
      setErrorKey(res.error === "rate_limited" ? "rateLimited" : "errorRetry");
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

  function answerChoice(questionKey: string, prompt: string, option: ChoiceOption) {
    setAnswers((a) => [
      ...a,
      { questionId: questionKey, prompt, answer: option.label },
    ]);
    setMessages((m) => [...m, { role: "user", text: option.label }]);
    setAwaiting(false);
    // Branch to the option's target: a question, an ending, the default ending
    // ("END"), or the next node in order.
    const next = option.next;
    if (next === "END") {
      reachEnding(defaultEnding);
    } else if (next && keyToIndex.has(next)) {
      setIndex(keyToIndex.get(next)!);
    } else if (next && endingByKey.has(next)) {
      reachEnding(endingByKey.get(next)!);
    } else if (index + 1 >= nodes.length) {
      reachEnding(defaultEnding);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function retry() {
    if (!reachedEnding) {
      setStatus("error");
      return;
    }
    submittedRef.current = false;
    setRetryNotice(false);
    // A MEETING re-opens the picker (the slot wasn't booked); others re-submit.
    if (reachedEnding.type === "MEETING") setStatus("scheduling");
    else void runSubmit(reachedEnding);
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

        {status === "scheduling" && reachedEnding ? (
          <FunnelScheduler
            funnelId={funnel.id}
            endingKey={reachedEnding.key}
            retryNotice={retryNotice}
            onConfirm={(iso) => runSubmit(reachedEnding, iso)}
            onUnavailable={() => {
              setMeetingUnavailable(true);
              void runSubmit(reachedEnding);
            }}
          />
        ) : null}

        {status === "submitting" ? (
          <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {reachedEnding?.type === "MEETING" ? t("booking") : t("submitting")}
          </div>
        ) : null}

        {status === "done" ? (
          <FunnelCompletion
            ending={reachedEnding}
            bookedISO={bookedISO}
            meetingUnavailable={meetingUnavailable}
          />
        ) : null}

        {status === "error" ? (
          <div className="self-start">
            <p className="text-sm text-red-500">{t(errorKey)}</p>
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
              key={option.label}
              type="button"
              onClick={() =>
                answerChoice(choiceNode.questionKey, choiceNode.prompt, option)
              }
              className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:border-brand hover:bg-brand/5"
            >
              {option.label}
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

/** The end-of-funnel screen, varying by the reached ending
 * (bonus / booked meeting / external redirect). */
function FunnelCompletion({
  ending,
  bookedISO,
  meetingUnavailable,
}: {
  ending: FunnelEndingView | null;
  bookedISO: string | null;
  meetingUnavailable: boolean;
}) {
  const t = useTranslations("funnel");
  const locale = useLocale();

  const bonusUrl = ending?.type === "BONUS" ? ending.bonusUrl : null;
  const meetingBooked = ending?.type === "MEETING" && bookedISO;
  const meetingFailed =
    ending?.type === "MEETING" && !bookedISO && meetingUnavailable;
  const redirectUrl = ending?.type === "REDIRECT" ? ending.redirectUrl : null;
  const bookedLabel = bookedISO
    ? new Date(bookedISO).toLocaleString(locale, {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "";

  // REDIRECT: send the lead to the destination (same tab) after a short
  // countdown; the button is an immediate fallback if the auto-redirect is
  // blocked or the visitor would rather go now.
  const redirectDelay =
    ending?.type === "REDIRECT" ? ending.redirectDelaySeconds : 0;
  const [secondsLeft, setSecondsLeft] = useState(redirectDelay);
  useEffect(() => {
    if (!redirectUrl) return;
    if (secondsLeft <= 0) {
      window.location.assign(redirectUrl);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [redirectUrl, secondsLeft]);

  return (
    <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-6 text-center">
      <h2 className="text-lg font-bold">
        {meetingBooked
          ? t("bookedTitle")
          : meetingFailed
            ? t("meetingUnavailableTitle")
            : t("completionTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {meetingBooked
          ? bookedLabel
          : meetingFailed
            ? t("meetingUnavailableText")
            : t("completionText")}
      </p>

      {bonusUrl ? (
        <button
          type="button"
          onClick={() => openAndDownloadBonus(bonusUrl)}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
        >
          {ending?.bonusButtonLabel || t("download")}
        </button>
      ) : null}

      {redirectUrl ? (
        <div className="mt-5 flex flex-col items-center gap-2">
          {secondsLeft > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("redirectingIn", { seconds: secondsLeft })}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.assign(redirectUrl)}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
          >
            {ending?.redirectButtonLabel || t("redirectButton")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
