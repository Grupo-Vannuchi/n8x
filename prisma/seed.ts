import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { buildInformations } from "./seed-informations";

const prisma = new PrismaClient();

/** Shorthand for a bilingual value stored in a Json column. */
const t = (pt: string, en: string) => ({ pt, en });
/** Bilingual rich text: an array of paragraphs per locale. */
const tr = (pt: string[], en: string[]) => ({ pt, en });
const img = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, name: "Admin", passwordHash, role: "ADMIN" },
  });
  console.log(`✓ Admin user ready: ${email}`);
}

const services = [
  {
    slug: "social-media",
    icon: "Instagram",
    order: 1,
    title: t("Social Media", "Social Media"),
    description: t(
      "Conteúdo, planejamento e gestão de redes que constroem comunidade e vendas.",
      "Content, planning and community management that build audience and sales.",
    ),
  },
  {
    slug: "branding",
    icon: "Palette",
    order: 2,
    title: t("Branding", "Branding"),
    description: t(
      "Identidade visual, naming e posicionamento para marcas memoráveis.",
      "Visual identity, naming and positioning for memorable brands.",
    ),
  },
  {
    slug: "audiovisual",
    icon: "Camera",
    order: 3,
    title: t("Foto & Audiovisual", "Photo & Video"),
    description: t(
      "Produção de vídeo e fotografia que traduzem a essência da marca.",
      "Video and photography production that capture your brand's essence.",
    ),
  },
  {
    slug: "campaigns",
    icon: "Megaphone",
    order: 4,
    title: t("Campanhas On & Offline", "On & Offline Campaigns"),
    description: t(
      "Campanhas integradas que conectam o digital ao mundo real.",
      "Integrated campaigns that connect digital and the real world.",
    ),
  },
  {
    slug: "paid-traffic",
    icon: "TrendingUp",
    order: 5,
    title: t("Tráfego Pago", "Paid Traffic"),
    description: t(
      "Mídia paga e analytics para escalar resultados com previsibilidade.",
      "Paid media and analytics to scale results predictably.",
    ),
  },
  {
    slug: "strategy",
    icon: "Target",
    order: 6,
    title: t("Estratégia & Análise", "Strategy & Analytics"),
    description: t(
      "Planejamento orientado a dados, do diagnóstico ao plano de ação.",
      "Data-driven planning, from diagnosis to action plan.",
    ),
  },
];

const informations = [
  {
    slug: "company-history",
    icon: "BookOpen",
    order: 1,
    title: t("Nossa história", "Our history"),
    description: t(
      "Como a N8X nasceu e evoluiu até se tornar uma agência full service.",
      "How N8X was born and grew into a full-service agency.",
    ),
    content: tr(
      [
        "## Onde tudo começou",
        "A N8X surgiu da vontade de unir estratégia, criatividade e dados em uma única operação de marketing.",
        "Desde então, ajudamos dezenas de marcas a crescer com previsibilidade e consistência.",
      ],
      [
        "## Where it all began",
        "N8X was born from the desire to unite strategy, creativity and data in a single marketing operation.",
        "Since then, we've helped dozens of brands grow with predictability and consistency.",
      ],
    ),
  },
  {
    slug: "how-we-work",
    icon: "Workflow",
    order: 2,
    title: t("Como trabalhamos", "How we work"),
    description: t(
      "Nosso processo, do diagnóstico inicial à execução e leitura de resultados.",
      "Our process, from initial diagnosis to execution and results reading.",
    ),
    content: tr(
      [
        "Começamos com um diagnóstico completo de marca, público e concorrência.",
        "Em seguida, definimos o posicionamento e construímos um plano de ação mensal.",
        "- Planejamento estratégico",
        "- Execução de conteúdo e tráfego",
        "- Acompanhamento de métricas e ajustes",
      ],
      [
        "We start with a complete diagnosis of brand, audience and competitors.",
        "Then we define positioning and build a monthly action plan.",
        "- Strategic planning",
        "- Content and traffic execution",
        "- Metrics tracking and adjustments",
      ],
    ),
  },
  {
    slug: "privacy-policy",
    icon: "ShieldCheck",
    order: 3,
    title: t("Política de privacidade", "Privacy policy"),
    description: t(
      "Como tratamos e protegemos os dados coletados no site.",
      "How we handle and protect the data collected on the site.",
    ),
    content: tr(
      [
        "Levamos a privacidade a sério e tratamos seus dados conforme a LGPD.",
        "Os dados enviados pelos formulários são usados apenas para contato comercial.",
      ],
      [
        "We take privacy seriously and handle your data in accordance with applicable law.",
        "Data submitted through forms is used solely for business contact.",
      ],
    ),
  },
  {
    slug: "frequently-asked-questions",
    icon: "Info",
    order: 4,
    title: t("Perguntas frequentes", "Frequently asked questions"),
    description: t(
      "Respostas rápidas para as dúvidas mais comuns sobre os nossos serviços.",
      "Quick answers to the most common questions about our services.",
    ),
    content: tr(
      [
        "### Vocês atendem empresas de qualquer segmento?",
        "Sim. Adaptamos a estratégia ao momento e ao mercado de cada cliente.",
        "### Existe contrato mínimo?",
        "Trabalhamos com ciclos mensais, com foco em resultado e transparência.",
      ],
      [
        "### Do you work with companies in any segment?",
        "Yes. We adapt the strategy to each client's moment and market.",
        "### Is there a minimum contract?",
        "We work in monthly cycles, focused on results and transparency.",
      ],
    ),
  },
];

const projects = [
  {
    slug: "sabor-urbano",
    clientName: "Sabor Urbano",
    category: t("Restaurante", "Restaurant"),
    year: 2025,
    featured: true,
    order: 1,
    tags: ["Branding", "Social Media", "Tráfego"],
    coverImage: img("saborurbano", 1200, 800),
    gallery: [img("saborurbano-1"), img("saborurbano-2"), img("saborurbano-3")],
    title: t("Reposicionamento Sabor Urbano", "Sabor Urbano rebrand"),
    summary: t(
      "Rebranding completo e gestão de redes que dobraram o movimento do salão.",
      "Full rebrand and social management that doubled in-store traffic.",
    ),
    content: tr(
      [
        "O Sabor Urbano queria deixar de ser mais um restaurante de bairro para virar referência gastronômica da cidade.",
        "Reconstruímos a identidade visual, criamos uma linha de conteúdo autoral e estruturamos campanhas de tráfego local.",
        "Em seis meses, o movimento no salão dobrou e o delivery cresceu 70%.",
      ],
      [
        "Sabor Urbano wanted to evolve from a neighborhood spot into a city-wide culinary reference.",
        "We rebuilt the visual identity, created an original content line and set up local traffic campaigns.",
        "Within six months, in-store traffic doubled and delivery grew 70%.",
      ],
    ),
  },
  {
    slug: "corpo-em-foco",
    clientName: "Corpo em Foco",
    category: t("Fitness", "Fitness"),
    year: 2025,
    featured: true,
    order: 2,
    tags: ["Social Media", "Audiovisual"],
    coverImage: img("corpoemfoco", 1200, 800),
    gallery: [img("corpoemfoco-1"), img("corpoemfoco-2")],
    title: t("Lançamento Corpo em Foco", "Corpo em Foco launch"),
    summary: t(
      "Estúdio de treino com agenda lotada após campanha de captação digital.",
      "A training studio with a full schedule after a digital acquisition campaign.",
    ),
    content: tr(
      [
        "Para a inauguração do estúdio, criamos uma campanha de pré-lançamento com captação de leads.",
        "Produzimos uma série de vídeos curtos com os treinadores e anúncios segmentados por região.",
        "O estúdio abriu com 80% das vagas preenchidas.",
      ],
      [
        "For the studio opening, we built a pre-launch campaign with lead capture.",
        "We produced a series of short videos with the trainers and geo-targeted ads.",
        "The studio opened with 80% of spots already filled.",
      ],
    ),
  },
  {
    slug: "modular-plus",
    clientName: "Modular Plus",
    category: t("Indústria", "Industry"),
    year: 2024,
    featured: true,
    order: 3,
    tags: ["Branding", "Estratégia"],
    coverImage: img("modularplus", 1200, 800),
    gallery: [img("modularplus-1"), img("modularplus-2")],
    title: t("Marca B2B Modular Plus", "Modular Plus B2B brand"),
    summary: t(
      "Posicionamento e site que geraram um pipeline qualificado de vendas.",
      "Positioning and a website that generated a qualified sales pipeline.",
    ),
    content: tr(
      [
        "A Modular Plus precisava comunicar autoridade técnica para grandes contas.",
        "Definimos posicionamento, criamos a identidade e um site focado em conversão.",
        "O time comercial passou a receber leads qualificados toda semana.",
      ],
      [
        "Modular Plus needed to convey technical authority to large accounts.",
        "We defined positioning, created the identity and a conversion-focused website.",
        "The sales team began receiving qualified leads every week.",
      ],
    ),
  },
  {
    slug: "vita-supplements",
    clientName: "Vita Supplements",
    category: t("E-commerce", "E-commerce"),
    year: 2024,
    featured: false,
    order: 4,
    tags: ["Tráfego", "Social Media"],
    coverImage: img("vita", 1200, 800),
    gallery: [img("vita-1"), img("vita-2")],
    title: t("Escala Vita Supplements", "Scaling Vita Supplements"),
    summary: t(
      "Operação de mídia paga que reduziu o CAC e triplicou o faturamento.",
      "A paid-media operation that cut CAC and tripled revenue.",
    ),
    content: tr(
      [
        "Estruturamos a operação de tráfego do zero, com testes contínuos de criativos.",
        "Integramos analytics e CRM para acompanhar o funil ponta a ponta.",
        "Em um ano, o faturamento triplicou com CAC 35% menor.",
      ],
      [
        "We built the paid-traffic operation from scratch, with continuous creative testing.",
        "We integrated analytics and CRM to track the funnel end to end.",
        "Within a year, revenue tripled with a 35% lower CAC.",
      ],
    ),
  },
  {
    slug: "escola-horizonte",
    clientName: "Escola Horizonte",
    category: t("Educação", "Education"),
    year: 2023,
    featured: false,
    order: 5,
    tags: ["Campanhas", "Audiovisual"],
    coverImage: img("horizonte", 1200, 800),
    gallery: [img("horizonte-1"), img("horizonte-2")],
    title: t("Matrículas Escola Horizonte", "Escola Horizonte enrollment"),
    summary: t(
      "Campanha de matrículas que lotou as turmas antes do prazo.",
      "An enrollment campaign that filled the classes ahead of schedule.",
    ),
    content: tr(
      [
        "Criamos uma campanha emocional conectada aos valores da escola.",
        "Combinamos mídia offline no bairro com tráfego digital segmentado.",
        "As matrículas encerraram com lista de espera.",
      ],
      [
        "We created an emotional campaign tied to the school's values.",
        "We combined neighborhood offline media with targeted digital traffic.",
        "Enrollment closed with a waiting list.",
      ],
    ),
  },
];

const clients = [
  "Sabor Urbano",
  "Corpo em Foco",
  "Modular Plus",
  "Vita Supplements",
  "Escola Horizonte",
  "Café Central",
  "Studio Aura",
  "TechNova",
].map((name, i) => ({
  name,
  logoUrl: img(`logo-${i}`, 240, 120),
  order: i,
}));

const testimonials = [
  {
    authorName: "Marina Alves",
    company: "Sabor Urbano",
    rating: 5,
    order: 1,
    avatarUrl: img("avatar-marina", 200, 200),
    role: t("Proprietária", "Owner"),
    quote: t(
      "Em poucos meses nossa marca virou referência. O salão vive cheio.",
      "In a few months our brand became a reference. The place is always full.",
    ),
  },
  {
    authorName: "Rafael Costa",
    company: "Corpo em Foco",
    rating: 5,
    order: 2,
    avatarUrl: img("avatar-rafael", 200, 200),
    role: t("CEO", "CEO"),
    quote: t(
      "Profissionalismo do briefing à entrega. Resultado acima do esperado.",
      "Professional from briefing to delivery. Results above expectations.",
    ),
  },
  {
    authorName: "Juliana Prado",
    company: "Modular Plus",
    rating: 5,
    order: 3,
    avatarUrl: img("avatar-juliana", 200, 200),
    role: t("Diretora de Marketing", "Marketing Director"),
    quote: t(
      "Finalmente uma agência que entende de estratégia e de número.",
      "Finally an agency that understands both strategy and numbers.",
    ),
  },
  {
    authorName: "Pedro Henrique",
    company: "Vita Supplements",
    rating: 5,
    order: 4,
    avatarUrl: img("avatar-pedro", 200, 200),
    role: t("Fundador", "Founder"),
    quote: t(
      "Triplicamos o faturamento com uma operação de mídia impecável.",
      "We tripled revenue with a flawless media operation.",
    ),
  },
];

const team = [
  {
    name: "Camila Fernandes",
    order: 1,
    photoUrl: img("team-camila", 400, 400),
    role: t("CEO & Estrategista", "CEO & Strategist"),
    socials: { linkedin: "https://linkedin.com" },
  },
  {
    name: "Lucas Martins",
    order: 2,
    photoUrl: img("team-lucas", 400, 400),
    role: t("Diretor de Criação", "Creative Director"),
    socials: { instagram: "https://instagram.com" },
  },
  {
    name: "Beatriz Souza",
    order: 3,
    photoUrl: img("team-beatriz", 400, 400),
    role: t("Social Media", "Social Media Lead"),
    socials: { instagram: "https://instagram.com" },
  },
  {
    name: "Thiago Lima",
    order: 4,
    photoUrl: img("team-thiago", 400, 400),
    role: t("Gestor de Tráfego", "Traffic Manager"),
    socials: { linkedin: "https://linkedin.com" },
  },
];

const stats = [
  { key: "years", value: 9, suffix: "+", order: 1, label: t("anos de mercado", "years in business") },
  { key: "logos", value: 120, suffix: "+", order: 2, label: t("marcas criadas", "brands created") },
  { key: "clients", value: 80, suffix: "+", order: 3, label: t("clientes atendidos", "clients served") },
  { key: "ads", value: 2500, suffix: "+", order: 4, label: t("anúncios veiculados", "ads delivered") },
];

async function main() {
  await seedAdmin();

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }
  console.log(`✓ ${services.length} services`);

  // The 4 evergreen entries above plus the generated marketing-theme catalog.
  const allInformations = [...informations, ...buildInformations()];
  for (const i of allInformations) {
    await prisma.information.upsert({
      where: { slug: i.slug },
      update: i,
      create: i,
    });
  }
  console.log(`✓ ${allInformations.length} informations`);

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`✓ ${projects.length} projects`);

  await prisma.client.deleteMany();
  await prisma.client.createMany({ data: clients });
  console.log(`✓ ${clients.length} clients`);

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({ data: testimonials });
  console.log(`✓ ${testimonials.length} testimonials`);

  await prisma.teamMember.deleteMany();
  await prisma.teamMember.createMany({ data: team });
  console.log(`✓ ${team.length} team members`);

  for (const s of stats) {
    await prisma.stat.upsert({ where: { key: s.key }, update: s, create: s });
  }
  console.log(`✓ ${stats.length} stats`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
