"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Unplug } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { disconnectGoogle } from "@/app/actions/funnels";

export function GoogleDisconnectButton() {
  const t = useTranslations("admin.funnels");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(t("googleDisconnectConfirm"))) return;
    startTransition(async () => {
      await disconnectGoogle();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-60"
    >
      <Unplug className="size-4" />
      {t("googleDisconnect")}
    </button>
  );
}
