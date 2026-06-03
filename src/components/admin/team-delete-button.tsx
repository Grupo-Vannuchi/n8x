"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { deleteTeamMember } from "@/app/actions/team";

export function TeamDeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const t = useTranslations("admin.team");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(t("deleteConfirm", { name }))) return;
    startTransition(async () => {
      await deleteTeamMember(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label={t("delete")}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-60"
    >
      <Trash2 className="size-4" />
      {t("delete")}
    </button>
  );
}
