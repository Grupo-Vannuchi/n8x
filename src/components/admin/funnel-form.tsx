"use client";

import { useState, useEffect } from "react";
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
  blankEnding,
  type FunnelFormValues,
} from "@/lib/funnel-form";
import {
  createFunnel,
  updateFunnel,
  type FunnelActionResult,
} from "@/app/actions/funnels";
import { listInstancesAction } from "@/app/actions/whatsapp";

const selectStyles =
  "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors focus-visible:border-brand focus-visible:outline-none aria-[invalid=true]:border-red-500";

const inputFields = ["name", "role", "phone", "email"] as const;

/** Nested options editor for one custom question (single-choice buttons). */
function OptionsEditor({
  control,
  register,
  qIndex,
  questions,
  endings,
}: {
  control: Control<FunnelFormValues>;
  register: UseFormRegister<FunnelFormValues>;
  qIndex: number;
  /** Live questions + endings lists, to populate each option's branch target. */
  questions: FunnelFormValues["questions"];
  endings: FunnelFormValues["endings"];
}) {
  const t = useTranslations("admin.funnels");
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${qIndex}.options`,
  });

  // Other questions this option can branch to (exclude self; need a key).
  const targets = questions
    .map((q, j) => ({ key: q.key, prompt: q.prompt, j }))
    .filter((q) => q.j !== qIndex && q.key);
  const endingTargets = endings
    .map((e, j) => ({ key: e.key, name: e.name, j }))
    .filter((e) => e.key);

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("options")}</Label>
      {fields.map((field, i) => (
        <div
          key={field.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5"
        >
          <div className="flex items-center gap-2">
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
          <label className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
            <span className="shrink-0">{t("optionNext")}</span>
            <select
              className={cn(selectStyles, "py-1.5 text-xs")}
              {...register(`questions.${qIndex}.options.${i}.next` as const)}
            >
              <option value="">{t("nextDefault")}</option>
              <option value="END">{t("nextEnd")}</option>
              {targets.length > 0 ? (
                <optgroup label={t("sectionQuestions")}>
                  {targets.map((tg) => (
                    <option key={tg.key} value={tg.key}>
                      {tg.prompt || `${t("question")} ${tg.j + 1}`}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {endingTargets.length > 0 ? (
                <optgroup label={t("sectionEndings")}>
                  {endingTargets.map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.name || `${t("ending")} ${e.j + 1}`}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ value: "", next: "" })}
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
  const endings = useFieldArray({ control, name: "endings" });
  // Live lists so the branch-target dropdowns and conditional ending config stay in sync.
  const watchedQuestions = watch("questions") ?? [];
  const watchedEndings = watch("endings") ?? [];
  // Load WhatsApp instances client-side and non-blocking: the funnel editor must
  // never hang or fail because the Evolution server is slow/unreachable.
  const [instanceOptions, setInstanceOptions] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    listInstancesAction().then((r) => {
      if (active && r.ok) setInstanceOptions(r.data.map((i) => i.name));
    });
    return () => {
      active = false;
    };
  }, []);
  // Keep the funnel's current instance selectable even if it's not in the live list.
  const watchedInstance = watch("whatsappInstance");
  const instanceSelectOptions =
    watchedInstance && !instanceOptions.includes(watchedInstance)
      ? [watchedInstance, ...instanceOptions]
      : instanceOptions;

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
          <div className="sm:col-span-2">
            <Label htmlFor="whatsappInstance">{t("whatsappInstance")}</Label>
            <select
              id="whatsappInstance"
              className={cn(selectStyles)}
              {...register("whatsappInstance")}
            >
              <option value="">{t("whatsappInstanceDefault")}</option>
              {instanceSelectOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("whatsappInstanceHint")}{" "}
              <Link href="/admin/funnels/whatsapp" className="text-brand hover:underline">
                {t("manageWhatsapp")}
              </Link>
            </p>
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
                <OptionsEditor
                  control={control}
                  register={register}
                  qIndex={qIndex}
                  questions={watchedQuestions}
                  endings={watchedEndings}
                />
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

      {/* Endings (one or more; the first is the default/fallback) */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionEndings")}</legend>
        <p className="mb-4 text-xs text-muted-foreground">{t("endingsHint")}</p>

        <div className="flex flex-col gap-4">
          {endings.fields.map((field, i) => {
            const endingType = watchedEndings[i]?.type ?? "MESSAGE";
            return (
              <div
                key={field.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {t("ending")} {i + 1}
                    {i === 0 ? (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        {t("endingDefault")}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => i > 0 && endings.move(i, i - 1)}
                      aria-label={t("moveUp")}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        i < endings.fields.length - 1 && endings.move(i, i + 1)
                      }
                      aria-label={t("moveDown")}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={endings.fields.length <= 1}
                      onClick={() => endings.remove(i)}
                      aria-label={t("removeEnding")}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>{t("endingName")}</Label>
                      <Input
                        placeholder={t("endingNamePlaceholder")}
                        aria-invalid={Boolean(errors.endings?.[i]?.name)}
                        {...register(`endings.${i}.name` as const, required)}
                      />
                      <FieldError>{errors.endings?.[i]?.name?.message}</FieldError>
                    </div>
                    <div>
                      <Label>{t("type")}</Label>
                      <select
                        className={cn(selectStyles)}
                        {...register(`endings.${i}.type` as const)}
                      >
                        <option value="MEETING">{t("typeMeeting")}</option>
                        <option value="BONUS">{t("typeBonus")}</option>
                        <option value="MESSAGE">{t("typeMessage")}</option>
                        <option value="REDIRECT">{t("typeRedirect")}</option>
                      </select>
                    </div>
                  </div>

                  {endingType === "MEETING" ? (
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("meetingHint")}{" "}
                        <Link href="/admin/funnels/google" className="text-brand hover:underline">
                          {t("manageGoogle")}
                        </Link>
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>{t("meetingDuration")}</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...register(`endings.${i}.meetingDurationMinutes` as const)}
                          />
                        </div>
                        <div>
                          <Label>{t("meetingDaysAhead")}</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...register(`endings.${i}.meetingDaysAhead` as const)}
                          />
                        </div>
                        <div>
                          <Label>{t("meetingStartHour")}</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...register(`endings.${i}.meetingSlotStartHour` as const)}
                          />
                        </div>
                        <div>
                          <Label>{t("meetingEndHour")}</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            aria-invalid={Boolean(errors.endings?.[i]?.meetingSlotEndHour)}
                            {...register(`endings.${i}.meetingSlotEndHour` as const)}
                          />
                          <FieldError>
                            {errors.endings?.[i]?.meetingSlotEndHour?.message}
                          </FieldError>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("meetingTimezone")}: America/Sao_Paulo
                      </p>
                      <p className="text-xs text-brand">{t("meetingLinkHint")}</p>
                    </div>
                  ) : null}

                  {endingType === "BONUS" ? (
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                      <div>
                        <Label>{t("bonusUrl")}</Label>
                        <Input
                          placeholder="https://drive.google.com/..."
                          aria-invalid={Boolean(errors.endings?.[i]?.bonusUrl)}
                          {...register(`endings.${i}.bonusUrl` as const)}
                        />
                        <FieldError>{errors.endings?.[i]?.bonusUrl?.message}</FieldError>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("bonusUrlHint")}
                        </p>
                      </div>
                      <div>
                        <Label>{t("bonusButtonLabel")}</Label>
                        <Input {...register(`endings.${i}.bonusButtonLabel` as const)} />
                      </div>
                    </div>
                  ) : null}

                  {endingType === "REDIRECT" ? (
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                      <div>
                        <Label>{t("redirectUrl")}</Label>
                        <Input
                          placeholder="https://..."
                          aria-invalid={Boolean(errors.endings?.[i]?.redirectUrl)}
                          {...register(`endings.${i}.redirectUrl` as const)}
                        />
                        <FieldError>{errors.endings?.[i]?.redirectUrl?.message}</FieldError>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("redirectUrlHint")}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>{t("redirectButtonLabel")}</Label>
                          <Input {...register(`endings.${i}.redirectButtonLabel` as const)} />
                        </div>
                        <div>
                          <Label>{t("redirectDelay")}</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...register(`endings.${i}.redirectDelaySeconds` as const)}
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("redirectDelayHint")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Label>{t("completionMessage")}</Label>
                    <Textarea
                      className="min-h-24"
                      aria-invalid={Boolean(errors.endings?.[i]?.completionMessage)}
                      {...register(`endings.${i}.completionMessage` as const, required)}
                    />
                    <FieldError>
                      {errors.endings?.[i]?.completionMessage?.message}
                    </FieldError>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("completionHint")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => endings.append(blankEnding())}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:underline"
        >
          <Plus className="size-4" />
          {t("addEnding")}
        </button>
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
