import { PrismaClient } from "@prisma/client";

/**
 * Base records for the portfolio case studies.
 *
 * Run with: `npx tsx prisma/seed-projects.ts`
 * Then run `npx tsx prisma/seed-projects-content.ts` to fill the rich content.
 *
 * NOTE: these records were reconstructed after the original admin-created rows
 * were lost. Client names, business categories, summaries and titles are real;
 * the COVER IMAGES are placeholders (picsum) — replace them with the real photos
 * via the admin (/admin/projects). `year` and `tags` are best-effort.
 */

const prisma = new PrismaClient();

const t = (pt: string, en: string) => ({ pt, en });
const cover = (slug: string) => `https://picsum.photos/seed/${slug}/1200/800`;

const projects = [
  {
    slug: "moraes-vannuchi",
    clientName: "Moraes Vannuchi",
    category: t("Engenharia", "Engineering"),
    year: 2024,
    order: 1,
    featured: true,
    tags: ["Branding", "Site & SEO", "Tráfego Pago"],
    title: t("Autoridade digital Moraes Vannuchi", "Moraes Vannuchi digital authority"),
    summary: t(
      "Posicionamento e presença digital para uma empresa de engenharia gerar contatos qualificados.",
      "Positioning and digital presence for an engineering company to generate qualified leads.",
    ),
  },
  {
    slug: "conecta",
    clientName: "Conecta Expocenter",
    category: t("Centro de Eventos", "Events Center"),
    year: 2024,
    order: 2,
    featured: true,
    tags: ["Tráfego Pago", "Social Media"],
    title: t("Lançamento Conecta Expocenter", "Conecta Expocenter launch"),
    summary: t(
      "Captação digital que lotou a agenda do centro de eventos.",
      "Digital acquisition that filled the events center's calendar.",
    ),
  },
  {
    slug: "bar-goias",
    clientName: "Bar Goiás",
    category: t("Restaurante", "Restaurant"),
    year: 2024,
    order: 3,
    featured: true,
    tags: ["Social Media", "Audiovisual", "Tráfego Pago"],
    title: t("Mais movimento no Bar Goiás", "More traffic at Bar Goiás"),
    summary: t(
      "Gestão de redes e conteúdo audiovisual que aumentaram o movimento do restaurante.",
      "Social media management and audiovisual content that boosted the restaurant's traffic.",
    ),
  },
  {
    slug: "sate-conceito",
    clientName: "Sate Conceito",
    category: t("Móveis", "Furniture"),
    year: 2024,
    order: 4,
    featured: false,
    tags: ["Tráfego Pago", "Automação", "Site & SEO"],
    title: t("Escala Sate Conceito", "Scaling Sate Conceito"),
    summary: t(
      "Mídia paga e automação que reduziram o CAC e escalaram as vendas de móveis.",
      "Paid media and automation that cut the CAC and scaled furniture sales.",
    ),
  },
  {
    slug: "coronata",
    clientName: "Coronata",
    category: t("Restaurante", "Restaurant"),
    year: 2024,
    order: 5,
    featured: false,
    tags: ["Social Media", "Audiovisual"],
    title: t("Mais movimento na Coronata", "More traffic at Coronata"),
    summary: t(
      "Conteúdo, campanhas e posicionamento que encheram as mesas do restaurante.",
      "Content, campaigns and positioning that filled the restaurant's tables.",
    ),
  },
  {
    slug: "thiago-vannuchi",
    clientName: "Thiago Vannuchi",
    category: t("Marca Pessoal", "Personal Brand"),
    year: 2024,
    order: 6,
    featured: false,
    tags: ["Marca Pessoal", "Audiovisual"],
    title: t("Marca pessoal Thiago Vannuchi", "Thiago Vannuchi personal brand"),
    summary: t(
      "Construção da marca pessoal do dono do grupo, com conteúdo audiovisual e gestão de redes.",
      "Building the group owner's personal brand, with audiovisual content and social media management.",
    ),
  },
  {
    slug: "kalili",
    clientName: "Kalili",
    category: t("Restaurante", "Restaurant"),
    year: 2024,
    order: 7,
    featured: false,
    tags: ["Branding", "Social Media"],
    title: t("Lançamento da marca Kalili", "Kalili brand launch"),
    summary: t(
      "Branding e presença digital para um restaurante nascer com identidade forte.",
      "Branding and digital presence for a restaurant to launch with a strong identity.",
    ),
  },
  {
    slug: "vannuchi-group",
    clientName: "Grupo Vannuchi",
    category: t("Conglomerado", "Conglomerate"),
    year: 2024,
    order: 8,
    featured: false,
    tags: ["Branding", "Corporativo"],
    title: t("Identidade Grupo Vannuchi", "Vannuchi Group identity"),
    summary: t(
      "Identidade e estratégia de marca para o conglomerado que reúne as empresas do grupo.",
      "Brand identity and strategy for the conglomerate that unites the group's companies.",
    ),
  },
  {
    slug: "vannuchi",
    clientName: "Vannuchi",
    category: t("Engenharia", "Engineering"),
    year: 2024,
    order: 9,
    featured: false,
    tags: ["Audiovisual", "Branding"],
    title: t("Campanha institucional Vannuchi", "Vannuchi institutional campaign"),
    summary: t(
      "Campanha institucional e produção audiovisual para a empresa de engenharia fortalecer a marca.",
      "Institutional campaign and audiovisual production for the engineering company to strengthen its brand.",
    ),
  },
  {
    slug: "sushi-loko",
    clientName: "Sushi Loko",
    category: t("Restaurante", "Restaurant"),
    year: 2024,
    order: 10,
    featured: false,
    tags: ["Social Media", "Audiovisual"],
    title: t("Sushi Loko nas redes", "Sushi Loko on social"),
    summary: t(
      "Gestão de redes sociais e produção audiovisual que encheram as mesas do restaurante.",
      "Social media management and audiovisual production that filled the restaurant's tables.",
    ),
  },
];

async function main() {
  for (const p of projects) {
    const base = {
      clientName: p.clientName,
      category: p.category,
      year: p.year,
      coverImage: cover(p.slug),
      tags: p.tags,
      title: p.title,
      summary: p.summary,
      featured: p.featured,
      published: true,
      order: p.order,
    };
    await prisma.project.upsert({
      where: { slug: p.slug },
      // Don't touch `content` on update — it's owned by seed-projects-content.ts.
      update: base,
      create: { slug: p.slug, content: {}, ...base },
    });
    console.log(`✓ ${p.slug}`);
  }
  console.log(`\nDone — ${projects.length} project base records in place.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
