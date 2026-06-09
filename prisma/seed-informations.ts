/**
 * Generates the "Informações" catalog — one entry per marketing theme, mirroring
 * the topic-card catalog of grupovannuchi.com.br/informacoes but for N8X's
 * digital-marketing niche. Each theme becomes a bilingual Information record with
 * a category-appropriate icon, an SEO description and a short article body.
 *
 * Imported by `prisma/seed.ts`. Re-running the seed upserts by slug, so editing a
 * theme here and re-seeding is safe.
 */

export type SeedInformation = {
  slug: string;
  icon: string;
  image: string;
  order: number;
  title: { pt: string; en: string };
  description: { pt: string; en: string };
  content: { pt: string[]; en: string[] };
};

/** Theme category — drives the icon and the content "family" (shared copy). */
type Cat =
  | "mkt"
  | "local"
  | "nicho"
  | "sites"
  | "seo"
  | "conteudo"
  | "social"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "b2b"
  | "comercial"
  | "ia"
  | "portfolio"
  | "foto"
  | "video"
  | "drone"
  | "audiovisual"
  | "performance";

/** [pt theme, en theme, category]. Order follows the brief. */
const THEMES: [string, string, Cat][] = [
  ["agência de marketing digital", "Digital marketing agency", "mkt"],
  ["agência de marketing em Santos", "Marketing agency in Santos", "local"],
  ["agência de marketing na Baixada Santista", "Marketing agency in Baixada Santista", "local"],
  ["marketing digital para empresas", "Digital marketing for companies", "nicho"],
  ["marketing digital para negócios locais", "Digital marketing for local businesses", "nicho"],
  ["marketing digital para construtoras", "Digital marketing for construction companies", "nicho"],
  ["marketing digital para engenharia", "Digital marketing for engineering firms", "nicho"],
  ["marketing digital para prestadores de serviço", "Digital marketing for service providers", "nicho"],
  ["criação de site profissional", "Professional website creation", "sites"],
  ["criação de site com SEO", "SEO-ready website creation", "sites"],
  ["criação de sites otimizados", "Optimized website creation", "sites"],
  ["criação de site para empresas", "Website creation for companies", "sites"],
  ["criação de site institucional", "Corporate website creation", "sites"],
  ["criação de landing page", "Landing page creation", "sites"],
  ["landing page de alta conversão", "High-conversion landing page", "sites"],
  ["site para aparecer no Google", "Website to rank on Google", "seo"],
  ["site na primeira página do Google", "Website on Google's first page", "seo"],
  ["SEO para primeira página do Google", "SEO for Google's first page", "seo"],
  ["otimização de sites SEO", "SEO website optimization", "seo"],
  ["consultoria SEO", "SEO consulting", "seo"],
  ["agência de SEO", "SEO agency", "seo"],
  ["SEO local", "Local SEO", "seo"],
  ["SEO para empresas locais", "SEO for local businesses", "seo"],
  ["SEO em Santos", "SEO in Santos", "local"],
  ["SEO na Baixada Santista", "SEO in Baixada Santista", "local"],
  ["posicionamento no Google", "Google ranking positioning", "seo"],
  ["aparecer no Google", "Getting found on Google", "seo"],
  ["melhorar ranking no Google", "Improving Google ranking", "seo"],
  ["tráfego orgânico", "Organic traffic", "seo"],
  ["palavras-chave para Google", "Keywords for Google", "seo"],
  ["marketing de conteúdo", "Content marketing", "conteudo"],
  ["conteúdo para redes sociais", "Content for social media", "conteudo"],
  ["gestão de mídias sociais", "Social media management", "social"],
  ["gestão de redes sociais", "Social network management", "social"],
  ["social media para empresas", "Social media for companies", "social"],
  ["social media em Santos", "Social media in Santos", "local"],
  ["agência de social media", "Social media agency", "social"],
  ["planejamento de conteúdo", "Content planning", "conteudo"],
  ["calendário editorial", "Editorial calendar", "conteudo"],
  ["criação de posts para Instagram", "Instagram post creation", "instagram"],
  ["gestão de Instagram", "Instagram management", "instagram"],
  ["Instagram para empresas", "Instagram for companies", "instagram"],
  ["crescimento no Instagram", "Instagram growth", "instagram"],
  ["marketing no Instagram", "Instagram marketing", "instagram"],
  ["gestão de TikTok", "TikTok management", "tiktok"],
  ["TikTok para empresas", "TikTok for companies", "tiktok"],
  ["vídeos para TikTok", "Videos for TikTok", "tiktok"],
  ["marketing no TikTok", "TikTok marketing", "tiktok"],
  ["gestão de YouTube", "YouTube management", "youtube"],
  ["YouTube para empresas", "YouTube for companies", "youtube"],
  ["criação de canal no YouTube", "YouTube channel creation", "youtube"],
  ["vídeos para YouTube", "Videos for YouTube", "youtube"],
  ["marketing no YouTube", "YouTube marketing", "youtube"],
  ["gestão de LinkedIn", "LinkedIn management", "linkedin"],
  ["LinkedIn para empresas", "LinkedIn for companies", "linkedin"],
  ["prospecção pelo LinkedIn", "LinkedIn prospecting", "linkedin"],
  ["prospecção automática LinkedIn", "Automated LinkedIn prospecting", "linkedin"],
  ["agendamento pelo LinkedIn", "Scheduling via LinkedIn", "linkedin"],
  ["geração de leads pelo LinkedIn", "Lead generation via LinkedIn", "linkedin"],
  ["social selling LinkedIn", "LinkedIn social selling", "linkedin"],
  ["captação de leads B2B", "B2B lead capture", "b2b"],
  ["prospecção B2B", "B2B prospecting", "b2b"],
  ["prospecção comercial automática", "Automated sales prospecting", "b2b"],
  ["prospecção ativa digital", "Active digital prospecting", "b2b"],
  ["geração de oportunidades comerciais", "Generating sales opportunities", "b2b"],
  ["geração de reuniões comerciais", "Generating sales meetings", "b2b"],
  ["agendamento de reuniões B2B", "B2B meeting scheduling", "b2b"],
  ["terceirização comercial", "Sales outsourcing", "comercial"],
  ["terceirização de vendas", "Outsourced sales", "comercial"],
  ["equipe comercial terceirizada", "Outsourced sales team", "comercial"],
  ["comercial com metas", "Goal-driven sales", "comercial"],
  ["comercial com resultados", "Results-driven sales", "comercial"],
  ["vendas B2B terceirizadas", "Outsourced B2B sales", "comercial"],
  ["implantação comercial", "Sales implementation", "comercial"],
  ["estruturação comercial", "Sales structuring", "comercial"],
  ["processos comerciais", "Sales processes", "comercial"],
  ["implantação de processos comerciais", "Sales process implementation", "comercial"],
  ["automação comercial", "Sales automation", "ia"],
  ["automação de vendas", "Sales automation", "ia"],
  ["automação de prospecção", "Prospecting automation", "ia"],
  ["automação de atendimento", "Customer service automation", "ia"],
  ["automação de follow-up", "Follow-up automation", "ia"],
  ["automação de CRM", "CRM automation", "ia"],
  ["CRM para empresas", "CRM for companies", "comercial"],
  ["funil de vendas", "Sales funnel", "comercial"],
  ["gestão de funil de vendas", "Sales funnel management", "comercial"],
  ["criação de funil comercial", "Sales funnel creation", "comercial"],
  ["consultoria comercial", "Sales consulting", "comercial"],
  ["estratégia comercial", "Sales strategy", "comercial"],
  ["inteligência comercial", "Sales intelligence", "comercial"],
  ["agente de IA para empresas", "AI agent for companies", "ia"],
  ["agente de IA comercial", "Sales AI agent", "ia"],
  ["inteligência artificial para vendas", "AI for sales", "ia"],
  ["IA para atendimento", "AI for customer service", "ia"],
  ["IA para prospecção", "AI for prospecting", "ia"],
  ["IA para automação comercial", "AI for sales automation", "ia"],
  ["chatbot com inteligência artificial", "AI chatbot", "ia"],
  ["atendimento automático com IA", "Automated AI customer service", "ia"],
  ["automação com IA", "AI automation", "ia"],
  ["automação de processos com IA", "AI process automation", "ia"],
  ["automação de processos comerciais", "Sales process automation", "ia"],
  ["melhoria de processos comerciais", "Sales process improvement", "comercial"],
  ["digitalização comercial", "Sales digitalization", "ia"],
  ["transformação digital para empresas", "Digital transformation for companies", "ia"],
  ["marketing com inteligência artificial", "Marketing with AI", "ia"],
  ["agência de marketing com IA", "AI marketing agency", "ia"],
  ["criação de portfólio comercial", "Sales portfolio creation", "portfolio"],
  ["elaboração de portfólio comercial", "Sales portfolio development", "portfolio"],
  ["portfólio profissional para empresas", "Professional company portfolio", "portfolio"],
  ["apresentação comercial profissional", "Professional sales presentation", "portfolio"],
  ["material comercial para vendas", "Sales material", "portfolio"],
  ["proposta comercial profissional", "Professional sales proposal", "portfolio"],
  ["design de apresentação comercial", "Sales presentation design", "portfolio"],
  ["captação de imagens profissionais", "Professional image capture", "foto"],
  ["fotografia profissional para empresas", "Professional photography for companies", "foto"],
  ["fotografia corporativa", "Corporate photography", "foto"],
  ["fotografia comercial", "Commercial photography", "foto"],
  ["fotografia institucional", "Institutional photography", "foto"],
  ["fotos profissionais para redes sociais", "Professional photos for social media", "foto"],
  ["fotos profissionais para site", "Professional photos for websites", "foto"],
  ["filmagem profissional", "Professional filming", "video"],
  ["filmagem institucional", "Institutional filming", "video"],
  ["vídeos institucionais", "Institutional videos", "video"],
  ["vídeos comerciais", "Commercial videos", "video"],
  ["vídeos para empresas", "Videos for companies", "video"],
  ["produção de vídeos para redes sociais", "Video production for social media", "video"],
  ["gravação de vídeos profissionais", "Professional video recording", "video"],
  ["drone para empresas", "Drone for companies", "drone"],
  ["filmagem com drone", "Drone filming", "drone"],
  ["fotografia com drone", "Drone photography", "drone"],
  ["imagens aéreas com drone", "Aerial drone imagery", "drone"],
  ["captação aérea com drone", "Aerial drone capture", "drone"],
  ["produção audiovisual para empresas", "Audiovisual production for companies", "audiovisual"],
  ["agência audiovisual", "Audiovisual agency", "audiovisual"],
  ["marketing audiovisual", "Audiovisual marketing", "audiovisual"],
  ["vídeos para Instagram", "Videos for Instagram", "video"],
  ["reels para empresas", "Reels for companies", "audiovisual"],
  ["vídeos curtos para redes sociais", "Short videos for social media", "audiovisual"],
  ["campanhas digitais", "Digital campaigns", "performance"],
  ["estratégia de marketing digital", "Digital marketing strategy", "mkt"],
  ["consultoria de marketing digital", "Digital marketing consulting", "mkt"],
  ["plano de marketing digital", "Digital marketing plan", "mkt"],
  ["marketing para aumentar vendas", "Marketing to increase sales", "performance"],
  ["marketing para geração de leads", "Marketing for lead generation", "performance"],
  ["marketing para captação de clientes", "Marketing for client acquisition", "performance"],
  ["captação de clientes online", "Online client acquisition", "performance"],
  ["agência para aumentar vendas", "Agency to increase sales", "performance"],
  ["marketing de performance", "Performance marketing", "performance"],
  ["marketing digital com resultados", "Results-driven digital marketing", "performance"],
  ["agência de marketing focada em vendas", "Sales-focused marketing agency", "performance"],
];

/** lucide-react icon name per category (must exist in src/components/ui/icon.tsx). */
const ICONS: Record<Cat, string> = {
  mkt: "Megaphone",
  local: "Target",
  nicho: "Building2",
  sites: "Globe",
  seo: "TrendingUp",
  conteudo: "Newspaper",
  social: "Share2",
  instagram: "Instagram",
  tiktok: "Video",
  youtube: "Video",
  linkedin: "Share2",
  b2b: "Target",
  comercial: "TrendingUp",
  ia: "Bot",
  portfolio: "FileText",
  foto: "Camera",
  video: "Video",
  drone: "Camera",
  audiovisual: "Camera",
  performance: "TrendingUp",
};

/** Thematic cover image per category (Unsplash; host allowlisted in next.config). */
const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

const IMAGES: Record<Cat, string> = {
  mkt: IMG("photo-1557838923-2985c318be48"),
  local: IMG("photo-1449034446853-66c86144b0ad"),
  nicho: IMG("photo-1486406146926-c627a92ad1ab"),
  sites: IMG("photo-1467232004584-a241de8bcf5d"),
  seo: IMG("photo-1432888498266-38ffec3eaf0a"),
  conteudo: IMG("photo-1499750310107-5fef28a66643"),
  social: IMG("photo-1611162617474-5b21e879e113"),
  instagram: IMG("photo-1611926653458-09294b3142bf"),
  tiktok: IMG("photo-1611162616475-46b635cb6868"),
  youtube: IMG("photo-1574717024653-61fd2cf4d44d"),
  linkedin: IMG("photo-1573497491208-6b1acb260507"),
  b2b: IMG("photo-1454165804606-c3d57bc86b40"),
  comercial: IMG("photo-1556155092-490a1ba16284"),
  ia: IMG("photo-1677442136019-21780ecad995"),
  portfolio: IMG("photo-1551836022-d5d88e9218df"),
  foto: IMG("photo-1452780212940-6f5c0d14d848"),
  video: IMG("photo-1492619375914-88005aa9e8fb"),
  drone: IMG("photo-1473968512647-3e447244af8f"),
  audiovisual: IMG("photo-1574717024653-61fd2cf4d44d"),
  performance: IMG("photo-1551288049-bebda4e38f71"),
};

/** Content family per category (categories sharing the same article copy). */
type Family =
  | "geral"
  | "sites"
  | "seo"
  | "conteudo"
  | "social"
  | "linkedin"
  | "b2b"
  | "ia"
  | "portfolio"
  | "av";

const FAMILY: Record<Cat, Family> = {
  mkt: "geral",
  local: "geral",
  nicho: "geral",
  performance: "geral",
  sites: "sites",
  seo: "seo",
  conteudo: "conteudo",
  social: "social",
  instagram: "social",
  tiktok: "social",
  youtube: "social",
  linkedin: "linkedin",
  b2b: "b2b",
  comercial: "b2b",
  ia: "ia",
  portfolio: "portfolio",
  foto: "av",
  video: "av",
  drone: "av",
  audiovisual: "av",
};

type Copy = {
  /** Short tail appended after the title to form the meta description. */
  descTailPt: string;
  descTailEn: string;
  /** Intro paragraph variants ("{th}" is replaced by the theme). */
  introPt: [string, string];
  introEn: [string, string];
  deliverPt: string[];
  deliverEn: string[];
};

const COPY: Record<Family, Copy> = {
  geral: {
    descTailPt: "estratégia, execução e dados para crescer com previsibilidade.",
    descTailEn: "strategy, execution and data to grow with predictability.",
    introPt: [
      "Na N8X Marketing, {th} significa unir estratégia, criatividade e dados em uma única operação. Em vez de ações soltas, construímos um plano contínuo, orientado a metas de negócio e ajustado mês a mês.",
      "Mais do que postar ou anunciar, {th} exige um time que entende o seu mercado. A N8X conecta posicionamento, conteúdo e mídia para transformar presença digital em vendas.",
    ],
    introEn: [
      "At N8X Marketing, {th} means uniting strategy, creativity and data in a single operation. Instead of scattered actions, we build a continuous, goal-driven plan, tuned month by month.",
      "More than posting or advertising, {th} requires a team that understands your market. N8X connects positioning, content and media to turn digital presence into sales.",
    ],
    deliverPt: [
      "Diagnóstico de marca, público e concorrência",
      "Planejamento estratégico com metas claras",
      "Execução de conteúdo, tráfego e campanhas",
      "Acompanhamento de métricas e otimização contínua",
    ],
    deliverEn: [
      "Brand, audience and competitor diagnosis",
      "Strategic planning with clear goals",
      "Content, traffic and campaign execution",
      "Metrics tracking and continuous optimization",
    ],
  },
  sites: {
    descTailPt: "sites rápidos, responsivos e otimizados para converter.",
    descTailEn: "fast, responsive websites optimized to convert.",
    introPt: [
      "Um bom site é a base da sua presença digital. Criamos páginas rápidas, responsivas e otimizadas para SEO, pensadas para gerar contato e vendas — não apenas para 'ficar bonito'.",
      "Da estrutura ao texto, cada página é construída com foco em conversão e em ser encontrada no Google. Unimos design profissional, performance técnica e SEO desde o primeiro dia.",
    ],
    introEn: [
      "A good website is the foundation of your digital presence. We build fast, responsive, SEO-ready pages designed to generate contact and sales — not just to 'look nice'.",
      "From structure to copy, every page is built to convert and to be found on Google. We combine professional design, technical performance and SEO from day one.",
    ],
    deliverPt: [
      "Design responsivo e carregamento rápido",
      "Estrutura otimizada para SEO e Google",
      "Textos e CTAs focados em conversão",
      "Integração com formulários, WhatsApp e analytics",
    ],
    deliverEn: [
      "Responsive design and fast loading",
      "Structure optimized for SEO and Google",
      "Copy and CTAs focused on conversion",
      "Integration with forms, WhatsApp and analytics",
    ],
  },
  seo: {
    descTailPt: "mais visibilidade no Google com SEO técnico e conteúdo.",
    descTailEn: "more Google visibility with technical SEO and content.",
    introPt: [
      "Aparecer no Google não é sorte: é método. Trabalhamos SEO técnico, conteúdo e as palavras-chave certas para colocar sua empresa na frente de quem já está procurando o que você oferece.",
      "SEO é o canal que gera tráfego qualificado de forma sustentável. Otimizamos site, conteúdo e autoridade para melhorar seu posicionamento e atrair visitas que viram clientes.",
    ],
    introEn: [
      "Ranking on Google isn't luck — it's method. We work on technical SEO, content and the right keywords to put your company in front of people already searching for what you offer.",
      "SEO is the channel that drives qualified traffic sustainably. We optimize your site, content and authority to improve rankings and attract visits that become customers.",
    ],
    deliverPt: [
      "Pesquisa de palavras-chave e intenção de busca",
      "SEO técnico, on-page e de conteúdo",
      "Otimização para SEO local e Google Maps",
      "Acompanhamento de posições e tráfego orgânico",
    ],
    deliverEn: [
      "Keyword and search-intent research",
      "Technical, on-page and content SEO",
      "Local SEO and Google Maps optimization",
      "Ranking and organic-traffic tracking",
    ],
  },
  conteudo: {
    descTailPt: "conteúdo estratégico que constrói autoridade e gera demanda.",
    descTailEn: "strategic content that builds authority and demand.",
    introPt: [
      "Conteúdo é o que conecta sua marca ao público certo. Planejamos pautas, calendário editorial e formatos que educam, engajam e geram oportunidades de negócio.",
      "Em vez de postar por postar, criamos uma linha editorial com propósito: conteúdo alinhado à estratégia, à jornada do cliente e aos objetivos comerciais da empresa.",
    ],
    introEn: [
      "Content is what connects your brand to the right audience. We plan topics, an editorial calendar and formats that educate, engage and generate business opportunities.",
      "Instead of posting for the sake of it, we create an editorial line with purpose: content aligned to strategy, the customer journey and the company's sales goals.",
    ],
    deliverPt: [
      "Planejamento de pautas e calendário editorial",
      "Conteúdo para redes sociais, blog e SEO",
      "Roteiros, textos e design alinhados à marca",
      "Análise de desempenho e ajuste de temas",
    ],
    deliverEn: [
      "Topic planning and editorial calendar",
      "Content for social media, blog and SEO",
      "Scripts, copy and design aligned to the brand",
      "Performance analysis and topic adjustment",
    ],
  },
  social: {
    descTailPt: "gestão de redes que transforma seguidores em clientes.",
    descTailEn: "social media management that turns followers into customers.",
    introPt: [
      "Cuidamos das suas redes sociais de ponta a ponta: estratégia, criação, publicação e análise. O objetivo não é só engajamento — é construir uma audiência que compra.",
      "Cada rede tem sua linguagem. Adaptamos conteúdo, formatos e frequência para cada plataforma, sempre conectados ao posicionamento e às metas da sua marca.",
    ],
    introEn: [
      "We manage your social media end to end: strategy, creation, publishing and analysis. The goal isn't just engagement — it's building an audience that buys.",
      "Each network has its own language. We adapt content, formats and frequency for each platform, always tied to your brand's positioning and goals.",
    ],
    deliverPt: [
      "Calendário de conteúdo e criação de posts",
      "Design, copy e edição de vídeos",
      "Gestão de publicações e interação",
      "Relatórios de métricas e otimização",
    ],
    deliverEn: [
      "Content calendar and post creation",
      "Design, copy and video editing",
      "Publishing and community management",
      "Metrics reports and optimization",
    ],
  },
  linkedin: {
    descTailPt: "LinkedIn como canal de prospecção e vendas B2B.",
    descTailEn: "LinkedIn as a B2B prospecting and sales channel.",
    introPt: [
      "O LinkedIn é o melhor canal para vendas B2B. Estruturamos perfil, conteúdo e prospecção para gerar conexões qualificadas, reuniões e oportunidades reais de negócio.",
      "Unimos conteúdo de autoridade com prospecção ativa (inclusive automatizada) para transformar o LinkedIn em uma máquina de geração de leads e agendamento de reuniões.",
    ],
    introEn: [
      "LinkedIn is the best channel for B2B sales. We structure your profile, content and prospecting to generate qualified connections, meetings and real business opportunities.",
      "We combine authority content with active (and automated) prospecting to turn LinkedIn into a lead-generation and meeting-scheduling machine.",
    ],
    deliverPt: [
      "Otimização de perfil e página da empresa",
      "Conteúdo de autoridade e social selling",
      "Prospecção ativa e automação de mensagens",
      "Geração de leads e agendamento de reuniões",
    ],
    deliverEn: [
      "Profile and company-page optimization",
      "Authority content and social selling",
      "Active prospecting and message automation",
      "Lead generation and meeting scheduling",
    ],
  },
  b2b: {
    descTailPt: "prospecção e estrutura comercial para gerar reuniões qualificadas.",
    descTailEn: "prospecting and sales structure that generate qualified meetings.",
    introPt: [
      "Geramos demanda de forma previsível. Da prospecção ativa à estruturação do funil, organizamos seu comercial para atrair, qualificar e converter oportunidades B2B.",
      "Vendas B2B exigem processo. Implantamos prospecção, funil, CRM e metas para que sua equipe receba leads qualificados e foque em fechar negócios.",
    ],
    introEn: [
      "We generate demand predictably. From active prospecting to funnel structuring, we organize your sales operation to attract, qualify and convert B2B opportunities.",
      "B2B sales require process. We implement prospecting, funnel, CRM and targets so your team receives qualified leads and focuses on closing deals.",
    ],
    deliverPt: [
      "Definição de ICP e lista de prospecção",
      "Prospecção ativa multicanal (e-mail, LinkedIn, telefone)",
      "Estruturação de funil, CRM e processos",
      "Agendamento de reuniões e acompanhamento de metas",
    ],
    deliverEn: [
      "ICP definition and prospecting list",
      "Multichannel active prospecting (email, LinkedIn, phone)",
      "Funnel, CRM and process structuring",
      "Meeting scheduling and target tracking",
    ],
  },
  ia: {
    descTailPt: "automação e IA para ganhar escala no marketing e nas vendas.",
    descTailEn: "automation and AI to scale marketing and sales.",
    introPt: [
      "Usamos IA e automação para acelerar o que toma tempo: atendimento, follow-up, prospecção e processos comerciais. Mais escala, menos trabalho manual, sem perder a voz da marca.",
      "Da automação de CRM a agentes de IA para atendimento e prospecção, implantamos tecnologia que reduz custo, agiliza respostas e mantém o relacionamento ativo 24/7.",
    ],
    introEn: [
      "We use AI and automation to speed up what takes time: customer service, follow-up, prospecting and sales processes. More scale, less manual work, without losing the brand's voice.",
      "From CRM automation to AI agents for service and prospecting, we implement technology that cuts cost, speeds up responses and keeps relationships active 24/7.",
    ],
    deliverPt: [
      "Agentes de IA para atendimento e prospecção",
      "Automação de follow-up, CRM e processos",
      "Chatbots e respostas automáticas inteligentes",
      "Integração de ferramentas e digitalização comercial",
    ],
    deliverEn: [
      "AI agents for customer service and prospecting",
      "Follow-up, CRM and process automation",
      "Chatbots and intelligent automated replies",
      "Tool integration and sales digitalization",
    ],
  },
  portfolio: {
    descTailPt: "materiais comerciais profissionais que ajudam a vender.",
    descTailEn: "professional sales materials that help you close.",
    introPt: [
      "Sua proposta precisa convencer. Criamos portfólios, apresentações e materiais comerciais com design profissional e mensagem clara para fortalecer suas vendas.",
      "Reunimos história, cases e diferenciais em materiais de alto impacto: portfólio, apresentação comercial e proposta prontos para impressionar e converter.",
    ],
    introEn: [
      "Your proposal has to convince. We create portfolios, presentations and sales materials with professional design and a clear message to strengthen your sales.",
      "We bring story, cases and differentiators together into high-impact materials: portfolio, sales presentation and proposal ready to impress and convert.",
    ],
    deliverPt: [
      "Portfólio e apresentação comercial profissional",
      "Propostas e materiais de vendas com design",
      "Estrutura de narrativa e diferenciais claros",
      "Versões para impressão e digital",
    ],
    deliverEn: [
      "Professional portfolio and sales presentation",
      "Proposals and sales materials with design",
      "Narrative structure and clear differentiators",
      "Print and digital versions",
    ],
  },
  av: {
    descTailPt: "fotos, vídeos e drone profissionais para valorizar sua marca.",
    descTailEn: "professional photos, video and drone to elevate your brand.",
    introPt: [
      "Imagem é percepção de valor. Produzimos fotos e vídeos profissionais — inclusive com drone — para campanhas, redes sociais e site, sempre com a cara da sua marca.",
      "Da captação à edição, cuidamos de toda a produção audiovisual: fotografia corporativa, vídeos institucionais, reels e imagens aéreas com drone.",
    ],
    introEn: [
      "Image is value perception. We produce professional photos and videos — including drone — for campaigns, social media and websites, always reflecting your brand.",
      "From capture to editing, we handle the whole audiovisual production: corporate photography, institutional videos, reels and aerial drone imagery.",
    ],
    deliverPt: [
      "Fotografia corporativa, comercial e institucional",
      "Vídeos institucionais, comerciais e para redes",
      "Imagens e filmagens aéreas com drone",
      "Edição profissional e entrega multiplataforma",
    ],
    deliverEn: [
      "Corporate, commercial and institutional photography",
      "Institutional, commercial and social videos",
      "Aerial imagery and filming with drone",
      "Professional editing and multi-platform delivery",
    ],
  },
};

/** Lowercase + strip accents + hyphenate, e.g. "SEO local" → "seo-local". */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Capitalize the first character only (keeps acronyms like SEO/IA intact). */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Build the full Information catalog from the theme list. */
export function buildInformations(): SeedInformation[] {
  const seen = new Set<string>();

  return THEMES.map(([pt, en, cat], index) => {
    // Guarantee unique slugs even if two themes normalize to the same string.
    let slug = slugify(pt);
    while (seen.has(slug)) slug = `${slug}-${index}`;
    seen.add(slug);

    const titlePt = capitalize(pt);
    const titleEn = capitalize(en);
    const copy = COPY[FAMILY[cat]];
    const variant = index % 2;
    const regional = /santos|baixada/i.test(pt);

    const ctaPt = regional
      ? `Quer avançar com ${pt}? A N8X Marketing atende empresas em Santos e em toda a Baixada Santista — [fale com a gente](/contact) e receba um plano sob medida.`
      : `Quer avançar com ${pt}? [Fale com a N8X Marketing](/contact) e receba um plano de ação sob medida.`;
    const ctaEn = regional
      ? `Want to move forward with ${en.toLowerCase()}? N8X Marketing serves companies in Santos and across the Baixada Santista region — [talk to us](/contact) for a tailored plan.`
      : `Want to move forward with ${en.toLowerCase()}? [Talk to N8X Marketing](/contact) for a tailored action plan.`;

    return {
      slug,
      icon: ICONS[cat],
      image: IMAGES[cat],
      order: index + 10,
      title: { pt: titlePt, en: titleEn },
      description: {
        pt: `${titlePt}: ${copy.descTailPt}`,
        en: `${titleEn}: ${copy.descTailEn}`,
      },
      content: {
        pt: [
          `## ${titlePt}`,
          copy.introPt[variant].replace("{th}", pt),
          "### O que a N8X entrega",
          ...copy.deliverPt.map((b) => `- ${b}`),
          ctaPt,
        ],
        en: [
          `## ${titleEn}`,
          copy.introEn[variant].replace("{th}", en.toLowerCase()),
          "### What N8X delivers",
          ...copy.deliverEn.map((b) => `- ${b}`),
          ctaEn,
        ],
      },
    };
  });
}
