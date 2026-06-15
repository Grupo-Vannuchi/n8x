"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { type Locale } from "@/i18n/routing";
import {
  readSteps,
  stepsToStored,
  blankBotStep,
  blankInputStep,
  type FunnelFormStep,
} from "@/lib/funnel-form";
import { updateFunnelDefaultTemplate } from "@/app/actions/funnels";
import type { FunnelDefaultStep } from "@/lib/funnel-runtime";

const selectStyles =
  "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors focus-visible:border-brand focus-visible:outline-none";

const inputFields = ["name", "role", "phone", "email"] as const;

type FormValues = { defaultBlock: FunnelFormStep[] };

/** Editor for one locale's global default lead-capture block. */
export function FunnelDefaultForm({
  locale,
  initialSteps,
}: {
  locale: Locale;
  initialSteps: FunnelDefaultStep[];
}) {
  const t = useTranslations("admin.funnels");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const { register, control, handleSubmit } = useForm<FormValues>({
    defaultValues: { defaultBlock: readSteps(initialSteps) },
  });
  const steps = useFieldArray({ control, name: "defaultBlock" });

  async function onSubmit(values: FormValues) {
    setStatus("saving");
    const res = await updateFunnelDefaultTemplate({
      locale,
      steps: stepsToStored(values.defaultBlock),
    });
    setStatus(res.ok ? "saved" : "error");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {t("tokenLegend")}{" "}
        <code className="rounded bg-muted px-1">{"{NOME}"}</code>{" "}
        <code className="rounded bg-muted px-1">{"{CARGO}"}</code>
      </p>

      <div className="flex flex-col gap-3">
        {steps.fields.map((field, i) => (
          <div
            key={field.id}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {field.kind === "bot" ? t("stepBot") : t("stepInput")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => i > 0 && steps.move(i, i - 1)}
                  aria-label={t("moveUp")}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => i < steps.fields.length - 1 && steps.move(i, i + 1)}
                  aria-label={t("moveDown")}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => steps.remove(i)}
                  aria-label={t("removeStep")}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {field.kind === "bot" ? (
              <Textarea
                aria-label={t("botText")}
                placeholder={t("botText")}
                {...register(`defaultBlock.${i}.text` as const)}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <select
                  className={cn(selectStyles)}
                  aria-label={t("inputField")}
                  {...register(`defaultBlock.${i}.field` as const)}
                >
                  {inputFields.map((f) => (
                    <option key={f} value={f}>
                      {t(`field_${f}`)}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder={t("inputPrompt")}
                  {...register(`defaultBlock.${i}.prompt` as const)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => steps.append(blankBotStep())}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:underline"
        >
          <Plus className="size-4" />
          {t("addBotStep")}
        </button>
        <button
          type="button"
          onClick={() => steps.append(blankInputStep())}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:underline"
        >
          <Plus className="size-4" />
          {t("addInputStep")}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="md" disabled={status === "saving"}>
          {status === "saving" ? t("saving") : t("saveDefault")}
        </Button>
        {status === "saved" ? (
          <span className="text-sm text-emerald-600">{t("defaultSaved")}</span>
        ) : null}
        {status === "error" ? (
          <span className="text-sm text-red-500">{t("error.unknown")}</span>
        ) : null}
      </div>
    </form>
  );
}
