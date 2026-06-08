import { siteConfig, fullAddress } from "@/config/site";
import { defaultLocale } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo";
import { getProjects, getServices } from "@/lib/queries";

/**
 * `/llms.txt` — a concise, link-rich map of the site for LLM/AI crawlers, per
 * the llmstxt.org convention. Served as plain text and revalidated daily; the
 * content list degrades to the core pages if the database is unavailable.
 */
export const revalidate = 86400;

function line(title: string, path: string, description?: string): string {
  const url = localizedUrl(defaultLocale, path);
  return description
    ? `- [${title}](${url}): ${description}`
    : `- [${title}](${url})`;
}

export async function GET(): Promise<Response> {
  const { name, legalName } = siteConfig;

  const core = [
    line("Quem somos", "/about", "A agência, o time e a forma de trabalhar"),
    line("Serviços", "/services", "Tudo o que a agência oferece"),
    line("Portfólio", "/portfolio", "Cases e projetos realizados"),
    line("Contato", "/contact", "Fale com a equipe"),
    line("Trabalhe conosco", "/careers", "Vagas e oportunidades"),
  ];

  let services: string[] = [];
  let projects: string[] = [];
  try {
    const [s, p] = await Promise.all([
      getServices(defaultLocale),
      getProjects(defaultLocale),
    ]);
    services = s.map((x) => line(x.title, `/services/${x.slug}`, x.description));
    projects = p.map((x) => line(x.title, `/portfolio/${x.slug}`, x.summary));
  } catch {
    // Database unavailable — ship the core pages only.
  }

  const sections = [
    `# ${name}`,
    "",
    `> ${legalName} — agência de marketing e vendas em ${fullAddress()}.`,
    "",
    "## Páginas principais",
    ...core,
  ];

  if (services.length) sections.push("", "## Serviços", ...services);
  if (projects.length) sections.push("", "## Portfólio", ...projects);

  return new Response(`${sections.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
