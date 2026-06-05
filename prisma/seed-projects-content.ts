import { PrismaClient } from "@prisma/client";

/**
 * Idempotent content seed for the portfolio case studies.
 *
 * Run with: `npx tsx prisma/seed-projects-content.ts`
 *
 * Every client received the full N8X service suite, so each case study shares a
 * "services we delivered" block and varies the intro / challenge / result around
 * it. Bodies use the `<RichText>` markup (`## headings`, `**bold**`, `*italic*`,
 * `- lists`). Placeholder projects also get a clean category + summary.
 */

const prisma = new PrismaClient();

/** The full service suite, delivered to every client. Shared across cases. */
const servicesPt = [
  "Para esse cliente, colocamos em prática o **ecossistema completo de marketing da N8X**:",
  "- **Branding**: criação e refino da identidade visual e do posicionamento da marca.",
  "- **Gestão de Mídias Sociais**: conteúdo e gestão de Instagram, LinkedIn, TikTok e YouTube.",
  "- **Captação Audiovisual**: filmagens, fotografias e imagens de drone profissionais.",
  "- **Gestão de Tráfego Pago**: campanhas no Facebook e Google Ads orientadas a resultado.",
  "- **Criação de Site com SEO**: site rápido e otimizado para a primeira página do Google.",
  "- **Automação Comercial e de Marketing**: funis e fluxos que nutrem e convertem leads.",
  "- **Agente de IA e Chatbot**: atendimento automatizado, qualificando contatos 24 horas por dia.",
  "- **Publicidade e Propaganda**: materiais impressos e institucionais que reforçam a marca.",
];

const servicesEn = [
  "For this client, we put the **complete N8X marketing ecosystem** to work:",
  "- **Branding**: creating and refining the brand's visual identity and positioning.",
  "- **Social Media Management**: content and management across Instagram, LinkedIn, TikTok and YouTube.",
  "- **Audiovisual Production**: professional filming, photography and drone footage.",
  "- **Paid Traffic Management**: result-driven Facebook and Google Ads campaigns.",
  "- **SEO Website**: a fast site optimized for the first page of Google.",
  "- **Sales & Marketing Automation**: funnels and flows that nurture and convert leads.",
  "- **AI Agent & Chatbot**: automated service qualifying contacts 24 hours a day.",
  "- **Advertising & Print**: print and institutional materials that reinforce the brand.",
];

type Case = {
  slug: string;
  /** Provided only for placeholder projects that need a real category. */
  category?: { pt: string; en: string };
  /** Provided only for placeholder projects that need a real summary. */
  summary?: { pt: string; en: string };
  intro: { pt: string; en: string };
  challenge: { pt: string; en: string };
  result: { pt: string; en: string };
};

const cases: Case[] = [
  {
    slug: "moraes-vannuchi",
    intro: {
      pt: "O **Moraes Vannuchi** queria deixar de ser mais um restaurante para se tornar referência gastronômica na cidade.",
      en: "**Moraes Vannuchi** wanted to evolve from just another restaurant into a culinary reference in the city.",
    },
    challenge: {
      pt: "A marca não comunicava a qualidade da experiência no salão e dependia quase só do boca a boca.",
      en: "The brand didn't communicate the quality of its dining experience and relied almost entirely on word of mouth.",
    },
    result: {
      pt: "Com o rebranding e a operação digital integrada, o **movimento do salão dobrou** e o delivery cresceu de forma consistente.",
      en: "With the rebrand and an integrated digital operation, **in-store traffic doubled** and delivery grew consistently.",
    },
  },
  {
    slug: "conecta",
    intro: {
      pt: "O **Conecta Expocenter** precisava lotar a agenda e atrair um fluxo constante de novos clientes.",
      en: "**Conecta Expocenter** needed to fill its calendar and attract a steady flow of new clients.",
    },
    challenge: {
      pt: "Faltava previsibilidade na captação e uma presença digital à altura da estrutura do espaço.",
      en: "It lacked predictable client acquisition and a digital presence that matched the venue's quality.",
    },
    result: {
      pt: "A campanha de captação digital encheu a agenda e o espaço passou a operar com **lista de espera**.",
      en: "The digital acquisition campaign filled the calendar and the venue began operating with a **waiting list**.",
    },
  },
  {
    slug: "bar-goias",
    intro: {
      pt: "O **Bar Goiás** buscava se posicionar como destino e profissionalizar a captação de eventos.",
      en: "**Bar Goiás** wanted to position itself as a destination and professionalize its event bookings.",
    },
    challenge: {
      pt: "Sem site e sem um posicionamento claro, os contatos chegavam desqualificados e dispersos.",
      en: "With no website and no clear positioning, leads arrived unqualified and scattered.",
    },
    result: {
      pt: "O novo posicionamento e o site otimizado passaram a gerar um **pipeline qualificado de vendas** todos os meses.",
      en: "The new positioning and optimized website began generating a **qualified sales pipeline** every month.",
    },
  },
  {
    slug: "sate-conceito",
    intro: {
      pt: "A **Sate Conceito** queria escalar as vendas online com previsibilidade e margem saudável.",
      en: "**Sate Conceito** wanted to scale online sales with predictability and a healthy margin.",
    },
    challenge: {
      pt: "O e-commerce investia em anúncios sem controle do custo de aquisição de clientes.",
      en: "The e-commerce was investing in ads without controlling its customer acquisition cost.",
    },
    result: {
      pt: "A operação de mídia paga **reduziu o CAC** e **triplicou o faturamento** da loja online.",
      en: "The paid-media operation **cut the CAC** and **tripled the revenue** of the online store.",
    },
  },
  {
    slug: "coronata",
    intro: {
      pt: "A **Coronata** precisava preencher as turmas do próximo ciclo dentro do prazo de matrículas.",
      en: "**Coronata** needed to fill the next cycle's classes within the enrollment window.",
    },
    challenge: {
      pt: "A captação de alunos era sazonal e dependia quase só de indicações.",
      en: "Student acquisition was seasonal and relied almost entirely on referrals.",
    },
    result: {
      pt: "A campanha de matrículas **lotou as turmas antes do prazo**, com custo por lead abaixo do esperado.",
      en: "The enrollment campaign **filled the classes ahead of schedule**, with a cost per lead below expectations.",
    },
  },
  {
    slug: "thiago-vannuchi",
    category: { pt: "Marca Pessoal", en: "Personal Brand" },
    summary: {
      pt: "Construção de marca pessoal e presença digital com conteúdo audiovisual e gestão de redes.",
      en: "Personal brand building and digital presence with audiovisual content and social media management.",
    },
    intro: {
      pt: "O **Thiago Vannuchi** queria construir uma marca pessoal forte e relevante no ambiente digital.",
      en: "**Thiago Vannuchi** wanted to build a strong, relevant personal brand in the digital space.",
    },
    challenge: {
      pt: "Faltava consistência de conteúdo e uma identidade que traduzisse a sua autoridade.",
      en: "There was no content consistency and no identity that conveyed his authority.",
    },
    result: {
      pt: "A marca pessoal ganhou **consistência, alcance e autoridade**, abrindo novas oportunidades de negócio.",
      en: "The personal brand gained **consistency, reach and authority**, opening new business opportunities.",
    },
  },
  {
    slug: "kalili",
    category: { pt: "Branding", en: "Branding" },
    summary: {
      pt: "Criação de marca e estratégia de posicionamento construídas do zero.",
      en: "Brand creation and positioning strategy built from scratch.",
    },
    intro: {
      pt: "A **Kalili** chegou até a N8X para construir uma marca do zero, com identidade e posicionamento próprios.",
      en: "**Kalili** came to N8X to build a brand from scratch, with its own identity and positioning.",
    },
    challenge: {
      pt: "Era preciso definir propósito, identidade visual e voz da marca antes de ir ao mercado.",
      en: "Purpose, visual identity and brand voice had to be defined before going to market.",
    },
    result: {
      pt: "A Kalili nasceu com uma **identidade sólida** e um posicionamento claro para crescer com consistência.",
      en: "Kalili launched with a **solid identity** and clear positioning to grow consistently.",
    },
  },
  {
    slug: "vannuchi-group",
    category: { pt: "Corporativo", en: "Corporate" },
    summary: {
      pt: "Identidade corporativa e estratégia de marca para um grupo de empresas.",
      en: "Corporate identity and brand strategy for a group of companies.",
    },
    intro: {
      pt: "O **Vannuchi Group** precisava unificar a comunicação de suas empresas sob uma marca forte.",
      en: "**Vannuchi Group** needed to unify the communication of its companies under one strong brand.",
    },
    challenge: {
      pt: "As unidades do grupo comunicavam de formas diferentes, sem uma identidade em comum.",
      en: "The group's units communicated in different ways, with no shared identity.",
    },
    result: {
      pt: "O grupo passou a ter uma **identidade corporativa coesa** e uma estratégia de marca integrada.",
      en: "The group gained a **cohesive corporate identity** and an integrated brand strategy.",
    },
  },
  {
    slug: "vannuchi",
    category: { pt: "Corporativo", en: "Corporate" },
    summary: {
      pt: "Campanha institucional e produção audiovisual para fortalecer a marca.",
      en: "Institutional campaign and audiovisual production to strengthen the brand.",
    },
    intro: {
      pt: "A **Vannuchi** buscava fortalecer a percepção da marca com uma campanha institucional sólida.",
      en: "**Vannuchi** sought to strengthen its brand perception with a solid institutional campaign.",
    },
    challenge: {
      pt: "A marca tinha reconhecimento, mas pouca presença audiovisual e digital.",
      en: "The brand had recognition but little audiovisual and digital presence.",
    },
    result: {
      pt: "A campanha institucional **fortaleceu a marca** e ampliou consideravelmente o seu alcance digital.",
      en: "The institutional campaign **strengthened the brand** and considerably expanded its digital reach.",
    },
  },
  {
    slug: "sushi-loko",
    summary: {
      pt: "Gestão de redes sociais e produção audiovisual que encheram as mesas do restaurante.",
      en: "Social media management and audiovisual production that filled the restaurant's tables.",
    },
    intro: {
      pt: "O **Sushi Loko** queria encher as mesas e se destacar em um mercado de delivery concorrido.",
      en: "**Sushi Loko** wanted to fill its tables and stand out in a crowded delivery market.",
    },
    challenge: {
      pt: "O restaurante tinha um ótimo produto, mas uma presença digital ainda tímida.",
      en: "The restaurant had a great product but a still-timid digital presence.",
    },
    result: {
      pt: "Com conteúdo audiovisual de dar água na boca e gestão de redes, as **mesas passaram a lotar**.",
      en: "With mouth-watering audiovisual content and social media management, the **tables started filling up**.",
    },
  },
];

function buildContent(c: Case) {
  return {
    pt: [
      c.intro.pt,
      "## O desafio",
      c.challenge.pt,
      "## Os serviços que entregamos",
      ...servicesPt,
      "## O resultado",
      c.result.pt,
    ],
    en: [
      c.intro.en,
      "## The challenge",
      c.challenge.en,
      "## The services we delivered",
      ...servicesEn,
      "## The result",
      c.result.en,
    ],
  };
}

async function main() {
  for (const c of cases) {
    const data: {
      content: { pt: string[]; en: string[] };
      category?: { pt: string; en: string };
      summary?: { pt: string; en: string };
    } = { content: buildContent(c) };
    if (c.category) data.category = c.category;
    if (c.summary) data.summary = c.summary;

    await prisma.project.update({ where: { slug: c.slug }, data });
    console.log(`✓ ${c.slug}${c.category ? " (+category/summary)" : ""}`);
  }
  console.log(`\nDone — ${cases.length} case studies updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
