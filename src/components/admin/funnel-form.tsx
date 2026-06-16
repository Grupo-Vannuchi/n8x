"use client";

import { useState } from "react";
import {
  useForm,
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/field";
import { Link, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { FunnelDefaultStep } from "@/lib/funnel-runtime";
import {
  formToInput,
  readSteps,
  blankBotStep,
  blankInputStep,
  blankQuestion,
  type FunnelFormValues,
} from "@/lib/funnel-form";
import {
  createFunnel,
  updateFunnel,
  type FunnelActionResult,
} from "@/app/actions/funnels";

const selectStyles =
  "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors focus-visible:border-brand focus-visible:outline-none aria-[invalid=true]:border-red-500";

const inputFields = ["name", "role", "phone", "email"] as const;

/** Nested options editor for one custom question (single-choice buttons). */
function OptionsEditor({
  control,
  register,
  qIndex,
}: {
  control: Control<FunnelFormValues>;
  register: UseFormRegister<FunnelFormValues>;
  qIndex: number;
}) {
  const t = useTranslations("admin.funnels");
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${qIndex}.options`,
  });

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("options")}</Label>
      {fields.map((field, i) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            placeholder={`${t("option")} ${i + 1}`}
            {...register(`questions.${qIndex}.options.${i}.value` as const)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={t("removeOption")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ value: "" })}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:underline"
      >
        <Plus className="size-4" />
        {t("addOption")}
      </button>
    </div>
  );
}

export function FunnelForm({
  mode,
  funnelId,
  defaultValues,
  templateSteps,
}: {
  mode: "create" | "edit";
  funnelId?: string;
  defaultValues: FunnelFormValues;
  /** Global default steps for the funnel's locale — used by "reset to default". */
  templateSteps: FunnelDefaultStep[];
}) {
  const t = useTranslations("admin.funnels");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FunnelFormValues>({ defaultValues });

  const steps = useFieldArray({ control, name: "defaultBlock" });
  const questions = useFieldArray({ control, name: "questions" });
  const type = watch("type");

  async function onSubmit(values: FunnelFormValues) {
    setServerError(null);
    const input = formToInput(values);
    const result: FunnelActionResult =
      mode === "edit" && funnelId
        ? await updateFunnel(funnelId, input)
        : await createFunnel(input);

    if (result.ok) {
      router.push("/admin/funnels");
      router.refresh();
    } else {
      setServerError(t(`error.${result.error}`));
    }
  }

  const required = { required: tv("required") };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
      {/* Basics */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionBasics")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              aria-invalid={Boolean(errors.name)}
              {...register("name", required)}
            />
            <FieldError>{errors.name?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{t("nameHint")}</p>
          </div>
          <div>
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input
              id="slug"
              placeholder="diagnostico-ia"
              aria-invalid={Boolean(errors.slug)}
              {...register("slug", required)}
            />
            <FieldError>{errors.slug?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{t("slugHint")}</p>
          </div>
          <div>
            <Label htmlFor="locale">{t("locale")}</Label>
            <select
              id="locale"
              className={cn(selectStyles)}
              disabled={mode === "edit"}
              {...register("locale")}
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{t("localeHint")}</p>
          </div>
          <div>
            <Label htmlFor="status">{t("status")}</Label>
            <select id="status" className={cn(selectStyles)} {...register("status")}>
              <option value="DRAFT">{t("statusDraft")}</option>
              <option value="PUBLISHED">{t("statusPublished")}</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Default lead-capture block */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionDefault")}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{t("defaultHint")}</p>
        <p className="mb-4 text-xs text-muted-foreground">
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

        <FieldError>{errors.defaultBlock?.message}</FieldError>

        <div className="mt-4 flex flex-wrap gap-3">
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
          <button
            type="button"
            onClick={() => steps.replace(readSteps(templateSteps))}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            {t("resetDefault")}
          </button>
        </div>
      </fieldset>

      {/* Custom questions */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionQuestions")}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{t("questionsHint")}</p>

        <div className="flex flex-col gap-4">
          {questions.fields.map((field, qIndex) => (
            <div
              key={field.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {t("question")} {qIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => qIndex > 0 && questions.move(qIndex, qIndex - 1)}
                    aria-label={t("moveUp")}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      qIndex < questions.fields.length - 1 &&
                      questions.move(qIndex, qIndex + 1)
                    }
                    aria-label={t("moveDown")}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => questions.remove(qIndex)}
                    aria-label={t("removeQuestion")}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <Label>{t("questionPrompt")}</Label>
                  <Input {...register(`questions.${qIndex}.prompt` as const)} />
                </div>
                <OptionsEditor control={control} register={register} qIndex={qIndex} />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => questions.append(blankQuestion())}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:underline"
        >
          <Plus className="size-4" />
          {t("addQuestion")}
        </button>
      </fieldset>

      {/* Type + ending config */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionEnding")}</legend>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="type">{t("type")}</Label>
            <select id="type" className={cn(selectStyles)} {...register("type")}>
              <option value="MEETING">{t("typeMeeting")}</option>
              <option value="BONUS">{t("typeBonus")}</option>
              <option value="MESSAGE">{t("typeMessage")}</option>
            </select>
          </div>

          {type === "MEETING" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                {t("meetingHint")}{" "}
                <Link href="/admin/funnels/google" className="text-brand hover:underline">
                  {t("manageGoogle")}
                </Link>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dur">{t("meetingDuration")}</Label>
                  <Input
                    id="dur"
                    type="number"
                    inputMode="numeric"
                    {...register("meetingDurationMinutes")}
                  />
                </div>
                <div>
                  <Label htmlFor="days">{t("meetingDaysAhead")}</Label>
                  <Input
                    id="days"
                    type="number"
                    inputMode="numeric"
                    {...register("meetingDaysAhead")}
                  />
                </div>
                <div>
                  <Label htmlFor="sh">{t("meetingStartHour")}</Label>
                  <Input
                    id="sh"
                    type="number"
                    inputMode="numeric"
                    {...register("meetingSlotStartHour")}
                  />
                </div>
                <div>
                  <Label htmlFor="eh">{t("meetingEndHour")}</Label>
                  <Input
                    id="eh"
                    type="number"
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.meetingSlotEndHour)}
                    {...register("meetingSlotEndHour")}
                  />
                  <FieldError>{errors.meetingSlotEndHour?.message}</FieldError>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("meetingTimezone")}: America/Sao_Paulo
              </p>
            </div>
          ) : null}

          {type === "BONUS" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
              <div>
                <Label htmlFor="bonusUrl">{t("bonusUrl")}</Label>
                <Input
                  id="bonusUrl"
                  placeholder="https://drive.google.com/..."
                  aria-invalid={Boolean(errors.bonusUrl)}
                  {...register("bonusUrl")}
                />
                <FieldError>{errors.bonusUrl?.message}</FieldError>
                <p className="mt-1 text-xs text-muted-foreground">{t("bonusUrlHint")}</p>
              </div>
              <div>
                <Label htmlFor="bonusButtonLabel">{t("bonusButtonLabel")}</Label>
                <Input id="bonusButtonLabel" {...register("bonusButtonLabel")} />
              </div>
            </div>
          ) : null}

          {type === "MESSAGE" ? (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                {t("messageUsesCompletion")}
              </p>
            </div>
          ) : null}
        </div>
      </fieldset>

      {/* Completion WhatsApp message */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionCompletion")}</legend>
        <Label htmlFor="completionMessage">{t("completionMessage")}</Label>
        <Textarea
          id="completionMessage"
          className="min-h-28"
          aria-invalid={Boolean(errors.completionMessage)}
          {...register("completionMessage", required)}
        />
        <FieldError>{errors.completionMessage?.message}</FieldError>
        <p className="mt-1 text-xs text-muted-foreground">{t("completionHint")}</p>
      </fieldset>

      {serverError ? (
        <p role="alert" className="text-sm text-red-500">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t("saving") : mode === "create" ? t("create") : t("save")}
        </Button>
        <Link
          href="/admin/funnels"
          className="inline-flex h-13 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
