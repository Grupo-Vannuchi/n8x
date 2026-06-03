"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { LeadStatus } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { updateLeadStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function LeadStatusButtons({
  id,
  status,
}: {
  id: string;
  status: LeadStatus;
}) {
  const t = useTranslations("admin.leads");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: LeadStatus) {
    startTransition(async () => {
      await updateLeadStatus(id, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "CONTACTED" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setStatus("CONTACTED")}
        >
          {t("markContacted")}
        </Button>
      ) : null}
      {status !== "ARCHIVED" ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setStatus("ARCHIVED")}
        >
          {t("archive")}
        </Button>
      ) : null}
    </div>
  );
}
