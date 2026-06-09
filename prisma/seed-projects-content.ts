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
    category: { pt: "Engenharia", en: "Engineering" },
    summary: {
      pt: "Posicionamento e presença digital para uma empresa de engenharia gerar contatos qualificados.",
      en: "Positioning and digital presence for an engineering company to generate qualified leads.",
    },
    intro: {
      pt: "A **Moraes Vannuchi** é uma empresa de engenharia que queria comunicar autoridade técnica e atrair novos contratos pelo digital.",
      en: "**Moraes Vannuchi** is an engineering company that wanted to convey technical authority and win new contracts online.",
    },
    challenge: {
      pt: "A empresa tinha forte know-how técnico, mas pouca presença digital para gerar contatos qualificados.",
      en: "The company had strong technical know-how but little digital presence to generate qualified leads.",
    },
    result: {
      pt: "Com posicionamento, site e conteúdo técnico, a Moraes Vannuchi passou a gerar um **fluxo constante de oportunidades**.",
      en: "With positioning, a website and technical content, Moraes Vannuchi began generating a **steady flow of opportunities**.",
    },
  },
  {
    slug: "conecta",
    intro: {
      pt: "O **Conecta Expocenter** é um centro de eventos que precisava lotar a agenda e atrair um fluxo constante de novos clientes.",
      en: "**Conecta Expocenter** is an events center that needed to fill its calendar and attract a steady flow of new clients.",
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
      pt: "O **Bar Goiás** é um restaurante que queria atrair mais clientes e se tornar referência na cidade.",
      en: "**Bar Goiás** is a restaurant that wanted to attract more diners and become a reference in the city.",
    },
    challenge: {
      pt: "O movimento dependia quase só do boca a boca e a presença digital não refletia a qualidade da casa.",
      en: "Traffic relied almost entirely on word of mouth, and the digital presence didn't reflect the quality of the place.",
    },
    result: {
      pt: "Com gestão de redes e conteúdo audiovisual, o **movimento aumentou** e a casa passou a ter fila nos fins de semana.",
      en: "With social media management and audiovisual content, **foot traffic grew** and the restaurant gained weekend queues.",
    },
  },
  {
    slug: "sate-conceito",
    intro: {
      pt: "A **Sate Conceito** é uma empresa de móveis que queria escalar as vendas com previsibilidade e margem saudável.",
      en: "**Sate Conceito** is a furniture company that wanted to scale sales with predictability and a healthy margin.",
    },
    challenge: {
      pt: "A empresa investia em anúncios sem controle do custo de aquisição e sem um funil estruturado.",
      en: "The company invested in ads without controlling acquisition cost or having a structured funnel.",
    },
    result: {
      pt: "A operação de mídia paga e automação **reduziu o CAC** e aumentou de forma consistente as vendas de móveis.",
      en: "The paid-media and automation operation **cut the CAC** and consistently increased furniture sales.",
    },
  },
  {
    slug: "coronata",
    intro: {
      pt: "A **Coronata** é um restaurante que queria encher as mesas e fortalecer a marca na região.",
      en: "**Coronata** is a restaurant that wanted to fill its tables and strengthen its brand in the region.",
    },
    challenge: {
      pt: "O movimento era irregular e a marca não transmitia toda a qualidade da experiência.",
      en: "Traffic was irregular and the brand didn't convey the full quality of the experience.",
    },
    result: {
      pt: "Com conteúdo, campanhas e posicionamento, as **mesas passaram a lotar** com mais frequência.",
      en: "With content, campaigns and positioning, the **tables began filling up** more often.",
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
      pt: "O **Thiago Vannuchi**, dono do grupo, queria construir uma marca pessoal forte e relevante no ambiente digital.",
      en: "**Thiago Vannuchi**, the group's owner, wanted to build a strong, relevant personal brand in the digital space.",
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
    category: { pt: "Restaurante", en: "Restaurant" },
    summary: {
      pt: "Branding e presença digital para um restaurante nascer com identidade forte.",
      en: "Branding and digital presence for a restaurant to launch with a strong identity.",
    },
    intro: {
      pt: "O **Kalili** é um restaurante que chegou até a N8X para nascer com uma marca e um posicionamento fortes.",
      en: "**Kalili** is a restaurant that came to N8X to launch with a strong brand and positioning.",
    },
    challenge: {
      pt: "Era preciso definir identidade visual, cardápio e voz da marca antes da inauguração.",
      en: "Visual identity, menu and brand voice had to be defined before opening.",
    },
    result: {
      pt: "O Kalili abriu com uma **identidade sólida** e presença digital pronta para atrair clientes.",
      en: "Kalili opened with a **solid identity** and a digital presence ready to attract diners.",
    },
  },
  {
    slug: "vannuchi-group",
    category: { pt: "Conglomerado", en: "Conglomerate" },
    summary: {
      pt: "Identidade e estratégia de marca para o conglomerado que reúne as empresas do grupo.",
      en: "Brand identity and strategy for the conglomerate that unites the group's companies.",
    },
    intro: {
      pt: "O **Grupo Vannuchi** é um conglomerado de empresas que precisava unificar a comunicação sob uma marca forte.",
      en: "**Vannuchi Group** is a conglomerate that needed to unify its companies' communication under one strong brand.",
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
    category: { pt: "Engenharia", en: "Engineering" },
    summary: {
      pt: "Campanha institucional e produção audiovisual para a empresa de engenharia fortalecer a marca.",
      en: "Institutional campaign and audiovisual production for the engineering company to strengthen its brand.",
    },
    intro: {
      pt: "A **Vannuchi** é uma empresa de engenharia que buscava fortalecer sua marca com uma campanha institucional sólida.",
      en: "**Vannuchi** is an engineering company that sought to strengthen its brand with a solid institutional campaign.",
    },
    challenge: {
      pt: "A empresa tinha reputação técnica, mas pouca presença audiovisual e digital.",
      en: "The company had a technical reputation but little audiovisual and digital presence.",
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
