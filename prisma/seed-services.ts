import { PrismaClient } from "@prisma/client";

/**
 * Idempotent content seed for the agency's eight core services.
 *
 * Run with: `npx tsx prisma/seed-services.ts`
 *
 * Each service carries bilingual (pt/en) title, short description (used in card
 * + meta description) and a rich `content` body. The body uses the lightweight
 * markup understood by `<RichText>`: `## headings`, `**bold**`, `*italic*`,
 * `- lists` — written to be both readable and SEO-friendly.
 */

const prisma = new PrismaClient();

const t = (pt: string, en: string) => ({ pt, en });
const tr = (pt: string[], en: string[]) => ({ pt, en });

const services = [
  {
    slug: "social-media",
    icon: "Share2",
    order: 1,
    title: t("Gestão de Mídias Sociais", "Social Media Management"),
    description: t(
      "Gestão profissional de Instagram, LinkedIn, TikTok e YouTube com conteúdo estratégico, design e métricas que constroem autoridade e geram vendas.",
      "Professional management of Instagram, LinkedIn, TikTok and YouTube with strategic content, design and metrics that build authority and drive sales.",
    ),
    content: tr(
      [
        "A **gestão de mídias sociais** é a base da presença digital da sua empresa. Cuidamos de **Instagram, LinkedIn, TikTok e YouTube** de ponta a ponta — do planejamento estratégico à publicação e à análise de resultados.",
        "## Conteúdo estratégico para cada rede",
        "Cada plataforma tem uma linguagem própria, e produzimos conteúdo pensado para o algoritmo e para o público de cada uma:",
        "- **Instagram**: feed, Reels e Stories com design profissional e *copywriting* que gera engajamento.",
        "- **LinkedIn**: posicionamento de autoridade e conteúdo corporativo para atrair clientes e talentos.",
        "- **TikTok**: vídeos curtos e virais que ampliam o alcance da marca.",
        "- **YouTube**: vídeos otimizados para busca que geram tráfego orgânico de longo prazo.",
        "## Calendário editorial e gestão completa",
        "Trabalhamos com um **calendário editorial** mensal, criação de design, copywriting e acompanhamento de métricas. Você acompanha tudo com relatórios claros de crescimento, engajamento e conversão.",
        "Mais do que postar, construímos **comunidade e vendas**: transformamos seguidores em clientes com uma estratégia consistente e orientada a dados.",
      ],
      [
        "**Social media management** is the foundation of your company's digital presence. We handle **Instagram, LinkedIn, TikTok and YouTube** end to end — from strategic planning to publishing and results analysis.",
        "## Strategic content for every network",
        "Each platform has its own language, and we produce content designed for both the algorithm and the audience of each one:",
        "- **Instagram**: feed, Reels and Stories with professional design and *copywriting* that drives engagement.",
        "- **LinkedIn**: authority positioning and corporate content to attract clients and talent.",
        "- **TikTok**: short, viral videos that expand your brand's reach.",
        "- **YouTube**: search-optimized videos that generate long-term organic traffic.",
        "## Editorial calendar and full management",
        "We work with a monthly **editorial calendar**, design creation, copywriting and metrics tracking. You follow everything through clear reports on growth, engagement and conversion.",
        "More than posting, we build **community and sales**: we turn followers into customers with a consistent, data-driven strategy.",
      ],
    ),
  },
  {
    slug: "photo-video",
    icon: "Camera",
    order: 2,
    title: t("Captação — Filmagem, Fotografia e Drone", "Filming, Photography & Drone"),
    description: t(
      "Filmagens e fotografia profissional, com imagens aéreas de drone, para campanhas, anúncios, cardápios digitais e posicionamento de marca.",
      "Professional filming and photography, with aerial drone footage, for campaigns, ads, digital menus and brand positioning.",
    ),
    content: tr(
      [
        "A **captação audiovisual profissional** é o que diferencia marcas que vendem das que passam despercebidas. Produzimos **filmagens, fotografias e imagens aéreas com drone** que traduzem a essência do seu negócio.",
        "## Produção sob medida para cada objetivo",
        "- **Filmagem profissional**: vídeos institucionais, comerciais, *reels* e conteúdo para anúncios.",
        "- **Fotografia**: ensaios de produtos, ambientes, equipe e campanhas publicitárias.",
        "- **Drone**: imagens aéreas que dão escala e impacto à sua marca.",
        "## Imagens que valorizam a sua marca",
        "Cada imagem é planejada para **comunicar valor** e gerar desejo. Usamos equipamentos profissionais e direção de arte para entregar material pronto para *campanhas, redes sociais, cardápios digitais e anúncios pagos*.",
        "Conteúdo visual de alta qualidade aumenta a **percepção de valor**, melhora o desempenho dos anúncios e fortalece o posicionamento da sua empresa.",
      ],
      [
        "**Professional audiovisual production** is what sets brands that sell apart from those that go unnoticed. We produce **filming, photography and aerial drone footage** that capture the essence of your business.",
        "## Production tailored to every goal",
        "- **Professional filming**: corporate videos, commercials, *reels* and ad content.",
        "- **Photography**: product, location, team and advertising-campaign shoots.",
        "- **Drone**: aerial footage that adds scale and impact to your brand.",
        "## Visuals that elevate your brand",
        "Every image is planned to **communicate value** and create desire. We use professional gear and art direction to deliver material ready for *campaigns, social media, digital menus and paid ads*.",
        "High-quality visual content increases **perceived value**, improves ad performance and strengthens your company's positioning.",
      ],
    ),
  },
  {
    slug: "automacao-comercial",
    icon: "Workflow",
    order: 3,
    title: t("Automação Comercial e de Marketing", "Sales & Marketing Automation"),
    description: t(
      "Automação de processos comerciais e de marketing: funis, CRM e fluxos que capturam, nutrem e convertem leads sem esforço manual.",
      "Automation of sales and marketing processes: funnels, CRM and flows that capture, nurture and convert leads without manual effort.",
    ),
    content: tr(
      [
        "A **automação comercial e de marketing** elimina tarefas repetitivas e faz sua empresa vender no piloto automático. Estruturamos **funis, fluxos e integrações** que trabalham 24 horas por dia.",
        "## O que automatizamos",
        "- **Captura de leads** com formulários, landing pages e integrações.",
        "- **Nutrição automática** por e-mail e WhatsApp, conduzindo o lead até a compra.",
        "- **CRM e funil de vendas** organizados para o time focar em quem está pronto para comprar.",
        "- **Disparos e lembretes** que reduzem o tempo de resposta e aumentam a conversão.",
        "## Mais vendas com menos esforço",
        "Com a automação certa, *nenhum lead é esquecido*. Cada contato recebe a mensagem certa no momento certo, aumentando a **taxa de conversão** e reduzindo o custo de aquisição.",
        "Integramos suas ferramentas — **WhatsApp, e-mail, CRM e site** — em um único processo previsível e escalável.",
      ],
      [
        "**Sales and marketing automation** removes repetitive tasks and lets your company sell on autopilot. We build **funnels, flows and integrations** that work 24 hours a day.",
        "## What we automate",
        "- **Lead capture** through forms, landing pages and integrations.",
        "- **Automatic nurturing** via email and WhatsApp, guiding the lead to purchase.",
        "- **CRM and sales funnel** organized so your team focuses on who's ready to buy.",
        "- **Triggers and reminders** that cut response time and boost conversion.",
        "## More sales with less effort",
        "With the right automation, *no lead is forgotten*. Every contact gets the right message at the right moment, increasing the **conversion rate** and lowering acquisition cost.",
        "We integrate your tools — **WhatsApp, email, CRM and website** — into a single, predictable and scalable process.",
      ],
    ),
  },
  {
    slug: "ai-marketing",
    icon: "Bot",
    order: 4,
    title: t("Agente de Inteligência Artificial e Chatbot", "AI Agent & Chatbot"),
    description: t(
      "Agentes de IA e chatbots que atendem, qualificam e convertem clientes 24h por dia, integrados ao seu WhatsApp, site e redes sociais.",
      "AI agents and chatbots that serve, qualify and convert customers 24/7, integrated with your WhatsApp, website and social media.",
    ),
    content: tr(
      [
        "Um **agente de Inteligência Artificial** atende seus clientes a qualquer hora, responde dúvidas, qualifica leads e até ajuda a fechar vendas. É como ter um time comercial que **nunca dorme**.",
        "## Atendimento inteligente 24 horas",
        "Desenvolvemos **chatbots e agentes de IA** treinados com as informações do seu negócio, capazes de:",
        "- Responder perguntas frequentes com linguagem natural e humanizada.",
        "- **Qualificar leads** automaticamente e encaminhar os mais quentes para o time.",
        "- Agendar reuniões, enviar orçamentos e registrar tudo no seu CRM.",
        "- Atender no **WhatsApp, site e redes sociais** ao mesmo tempo.",
        "## Mais conversões, menos custo",
        "Enquanto o atendimento humano tem limites, a IA escala *sem aumentar custos*. Você reduz o tempo de resposta para **segundos** e aumenta a satisfação do cliente.",
        "A inteligência artificial aplicada ao marketing também acelera a criação de **conteúdos, testes de anúncios e análises**, deixando sua operação mais rápida e competitiva.",
      ],
      [
        "An **Artificial Intelligence agent** serves your customers at any hour, answers questions, qualifies leads and even helps close sales. It's like having a sales team that **never sleeps**.",
        "## Smart 24-hour service",
        "We build **chatbots and AI agents** trained on your business information, able to:",
        "- Answer frequently asked questions with natural, humanized language.",
        "- **Qualify leads** automatically and route the hottest ones to your team.",
        "- Schedule meetings, send quotes and log everything in your CRM.",
        "- Serve **WhatsApp, website and social media** at the same time.",
        "## More conversions, lower cost",
        "While human support has limits, AI scales *without raising costs*. You cut response time to **seconds** and increase customer satisfaction.",
        "AI applied to marketing also speeds up creating **content, ad tests and analysis**, making your operation faster and more competitive.",
      ],
    ),
  },
  {
    slug: "publicidade-propaganda",
    icon: "Printer",
    order: 5,
    title: t("Publicidade e Propaganda", "Advertising & Print"),
    description: t(
      "Publicidade e materiais impressos com identidade profissional: papel ofício, cartão de visita e kit onboarding que fortalecem a marca.",
      "Advertising and print materials with a professional identity: letterhead, business cards and onboarding kits that strengthen your brand.",
    ),
    content: tr(
      [
        "A **publicidade e propaganda** dá rosto e voz à sua marca em todos os pontos de contato — do digital ao impresso. Criamos materiais que comunicam **profissionalismo e confiança**.",
        "## Materiais que valorizam a marca",
        "- **Papel ofício** e papelaria corporativa com identidade visual consistente.",
        "- **Cartão de visita** profissional que causa uma boa primeira impressão.",
        "- **Kit onboarding** para receber novos clientes e colaboradores com uma experiência memorável.",
        "## Comunicação integrada e consistente",
        "Garantimos que sua marca seja *reconhecível e coerente* em cada material, físico ou digital. Uma identidade bem aplicada aumenta a **percepção de valor** e a lembrança de marca.",
        "Da peça publicitária ao material impresso, cuidamos de cada detalhe para que sua empresa transmita **credibilidade** em qualquer situação.",
      ],
      [
        "**Advertising and print** give your brand a face and a voice across every touchpoint — from digital to print. We create materials that communicate **professionalism and trust**.",
        "## Materials that elevate the brand",
        "- **Letterhead** and corporate stationery with consistent visual identity.",
        "- **Business cards** that make a strong first impression.",
        "- **Onboarding kits** to welcome new clients and team members with a memorable experience.",
        "## Integrated, consistent communication",
        "We make sure your brand is *recognizable and coherent* across every material, physical or digital. A well-applied identity increases **perceived value** and brand recall.",
        "From the ad piece to the printed material, we handle every detail so your company conveys **credibility** in any situation.",
      ],
    ),
  },
  {
    slug: "branding",
    icon: "Palette",
    order: 6,
    title: t("Branding — Criação e Rebranding", "Branding — Creation & Rebranding"),
    description: t(
      "Criação de marca e rebranding: identidade visual, naming e posicionamento estratégico que tornam sua marca memorável e desejada.",
      "Brand creation and rebranding: visual identity, naming and strategic positioning that make your brand memorable and desired.",
    ),
    content: tr(
      [
        "O **branding** é o que faz as pessoas escolherem e lembrarem da sua marca. Criamos marcas do zero e fazemos o **rebranding** de empresas que precisam se reposicionar no mercado.",
        "## Criação de marca",
        "- **Identidade visual** completa: logotipo, paleta de cores, tipografia e aplicações.",
        "- **Naming** e construção de marca com propósito e personalidade.",
        "- **Posicionamento estratégico** que diferencia você da concorrência.",
        "## Rebranding com estratégia",
        "Sua marca já existe, mas não comunica o que você se tornou? Fazemos o *rebranding* preservando o que funciona e modernizando o que ficou para trás, sempre com base em **pesquisa e estratégia**.",
        "Uma marca forte aumenta o **valor percebido**, justifica preços melhores e cria conexão emocional com o cliente. É o ativo mais valioso do seu negócio.",
      ],
      [
        "**Branding** is what makes people choose and remember your brand. We create brands from scratch and **rebrand** companies that need to reposition in the market.",
        "## Brand creation",
        "- Complete **visual identity**: logo, color palette, typography and applications.",
        "- **Naming** and brand building with purpose and personality.",
        "- **Strategic positioning** that sets you apart from competitors.",
        "## Strategic rebranding",
        "Your brand already exists but no longer reflects what you've become? We *rebrand* while preserving what works and modernizing what fell behind — always based on **research and strategy**.",
        "A strong brand increases **perceived value**, justifies better pricing and builds an emotional connection with customers. It's your business's most valuable asset.",
      ],
    ),
  },
  {
    slug: "paid-traffic",
    icon: "TrendingUp",
    order: 7,
    title: t("Gestão de Tráfego Pago — Facebook e Google Ads", "Paid Traffic — Facebook & Google Ads"),
    description: t(
      "Gestão de Facebook Ads e Google Ads orientada a dados para gerar leads, vendas e oportunidades reais com previsibilidade e escala.",
      "Data-driven Facebook Ads and Google Ads management to generate leads, sales and real opportunities with predictability and scale.",
    ),
    content: tr(
      [
        "A **gestão de tráfego pago** coloca sua empresa na frente das pessoas certas, no momento certo. Gerenciamos campanhas no **Facebook Ads (Meta) e Google Ads** focadas em resultado real: leads, pedidos e vendas.",
        "## Campanhas orientadas a dados",
        "- **Google Ads**: apareça na primeira posição quando seu cliente procura pelo que você vende.",
        "- **Facebook e Instagram Ads**: alcance e *remarketing* para gerar demanda e desejo.",
        "- **Segmentação avançada** para falar com quem realmente tem potencial de compra.",
        "- **Otimização contínua** de criativos, públicos e lances.",
        "## Previsibilidade e escala",
        "Acompanhamos cada real investido com **métricas claras** — CPL, ROAS e CAC — para escalar o que funciona e cortar o que não traz retorno.",
        "Nosso objetivo não é *gastar com anúncios*: é **transformar investimento em lucro** de forma previsível e escalável.",
      ],
      [
        "**Paid traffic management** puts your company in front of the right people at the right time. We run campaigns on **Facebook Ads (Meta) and Google Ads** focused on real results: leads, orders and sales.",
        "## Data-driven campaigns",
        "- **Google Ads**: show up in the top spot when your customer searches for what you sell.",
        "- **Facebook and Instagram Ads**: reach and *remarketing* to generate demand and desire.",
        "- **Advanced targeting** to speak only to those with real buying potential.",
        "- **Continuous optimization** of creatives, audiences and bids.",
        "## Predictability and scale",
        "We track every dollar invested with **clear metrics** — CPL, ROAS and CAC — to scale what works and cut what doesn't deliver returns.",
        "Our goal isn't to *spend on ads*: it's to **turn investment into profit** in a predictable, scalable way.",
      ],
    ),
  },
  {
    slug: "seo-marketing",
    icon: "Globe",
    order: 8,
    title: t("Criação de Site com SEO — Primeira Página do Google", "SEO Website — First Page of Google"),
    description: t(
      "Criação de sites otimizados para SEO que colocam sua empresa na primeira página do Google e transformam visitantes em clientes.",
      "SEO-optimized website creation that puts your company on the first page of Google and turns visitors into customers.",
    ),
    content: tr(
      [
        "Ter um site não basta — ele precisa ser **encontrado**. Criamos sites rápidos, modernos e otimizados para **SEO**, feitos para conquistar a **primeira página do Google** e converter visitantes em clientes.",
        "## Sites que vendem e rankeiam",
        "- **Otimização para SEO** desde a estrutura: títulos, palavras-chave, velocidade e dados estruturados.",
        "- **Design responsivo** que funciona perfeitamente no celular e no computador.",
        "- **Páginas de conversão** e landing pages focadas em gerar contato e vendas.",
        "- **Performance e Core Web Vitals** para carregamento rápido — fator que o Google valoriza.",
        "## Tráfego orgânico de longo prazo",
        "Diferente do anúncio, o **SEO** gera visitas *todos os dias, sem pagar por clique*. Trabalhamos palavras-chave estratégicas para o seu negócio aparecer exatamente quando o cliente procura.",
        "Um site bem posicionado é uma **máquina de aquisição** que trabalha 24 horas por dia, atraindo clientes de forma contínua e sustentável.",
      ],
      [
        "Having a website isn't enough — it needs to be **found**. We build fast, modern, **SEO**-optimized websites designed to reach the **first page of Google** and convert visitors into customers.",
        "## Websites that sell and rank",
        "- **SEO optimization** from the ground up: titles, keywords, speed and structured data.",
        "- **Responsive design** that works perfectly on mobile and desktop.",
        "- **Conversion pages** and landing pages focused on generating contact and sales.",
        "- **Performance and Core Web Vitals** for fast loading — a factor Google rewards.",
        "## Long-term organic traffic",
        "Unlike ads, **SEO** brings visits *every day, with no cost per click*. We target strategic keywords so your business shows up exactly when customers are searching.",
        "A well-ranked website is an **acquisition machine** that works 24 hours a day, attracting customers continuously and sustainably.",
      ],
    ),
  },
];

async function main() {
  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        icon: s.icon,
        order: s.order,
        title: s.title,
        description: s.description,
        content: s.content,
        featured: true,
        published: true,
      },
      create: {
        slug: s.slug,
        icon: s.icon,
        order: s.order,
        title: s.title,
        description: s.description,
        content: s.content,
        featured: true,
        published: true,
      },
    });
    console.log(`✓ ${s.slug}`);
  }

  // The old generic "strategy" service is replaced by the dedicated "branding"
  // one above. Remove it so the catalogue holds exactly the eight services.
  const removed = await prisma.service.deleteMany({ where: { slug: "strategy" } });
  if (removed.count > 0) console.log("✓ removed legacy 'strategy' service");

  console.log(`\nDone — ${services.length} services in place.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
