import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { getTestimonialById } from "@/lib/admin-queries";
import { testimonialToForm } from "@/lib/testimonial-form";
import { resolveLocale } from "@/i18n/routing";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.testimonials");

  const testimonial = await getTestimonialById(id);
  if (!testimonial) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/testimonials"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("title")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("editTitle", { name: testimonial.authorName })}
        </h1>
      </div>

      <TestimonialForm
        mode="edit"
        testimonialId={testimonial.id}
        defaultValues={testimonialToForm(testimonial)}
      />
    </div>
  );
}
