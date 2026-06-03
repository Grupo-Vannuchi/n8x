import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
      <p className="text-7xl font-bold text-brand">404</p>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-pretty text-muted-foreground">
        {t("description")}
      </p>
      <Link href="/" className={buttonVariants()}>
        {t("back")}
      </Link>
    </Container>
  );
}
