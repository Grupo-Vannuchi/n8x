# Auditoria de SEO Completa — N8X Marketing

**Site:** https://n8xmarketing.com.br
**Código-fonte:** `C:\Users\ViniciusAlberto\Documents\GitHub\n8x` (Next.js 16 · App Router · next-intl)
**Data da auditoria:** 25/06/2026
**Tipo:** Auditoria full (site no ar + cruzamento com o código-fonte)

---

## Pontuação Geral: 90 / 100 — Excelente

| Categoria | Peso | Nota | Avaliação |
|-----------|:----:|:----:|-----------|
| Technical SEO | 25% | 95 | ✅ Excelente |
| Conteúdo & E-E-A-T | 20% | 85 | ✅ Bom |
| On-Page SEO | 15% | 92 | ✅ Excelente |
| Schema / Dados estruturados | 15% | 93 | ✅ Excelente |
| Performance (CWV) | 10% | 85* | ✅ Bom (*não verificado — ver limitações) |
| Otimização de imagens | 10% | 90 | ✅ Excelente |
| AI Search / GEO | 5% | 95 | ✅ Excelente |

> **Resumo executivo:** O site é uma das implementações de SEO técnico mais sólidas que se vê em sites de agência. Canonical e hreflang auto-referenciados por página, sitemap com alternâncias de idioma, robots com gestão explícita de crawlers de IA, grafo de dados estruturados JSON-LD interligado por `@id`, llms.txt com nota 100/100 e cabeçalhos de segurança fortes. Os ajustes pendentes são todos de baixo impacto e refinamento — **não há nenhum problema crítico de indexação ou ranqueamento.**

---

## Metodologia & Evidências

Esta auditoria cruzou três fontes:
1. **HTML renderizado no ar** (`curl` ao `<head>`, sitemap.xml, robots.txt).
2. **Scripts de verificação** do skill (robots, security headers, social meta, llms.txt, PageSpeed).
3. **Código-fonte** (fonte da verdade — confirma intenção e elimina falsos positivos).

> ⚠️ **Falso positivo eliminado:** um fetch automatizado da home reportou "3 tags `<h1>`". A leitura de [`hero-carousel.tsx`](../../src/components/sections/hero-carousel.tsx) confirma que **só o primeiro slide renderiza `<h1>`; os demais são `<h2>`** (`const Heading = i === 0 ? "h1" : "h2"`). Não há problema de múltiplos H1.

---

## 1. Technical SEO — 95/100 ✅

| Item | Status | Evidência |
|------|:------:|-----------|
| HTTPS | ✅ | Live: HTTPS Yes |
| Canonical auto-referenciado por página | ✅ | `<link rel="canonical" href="https://n8xmarketing.com.br"/>` · `lib/seo.ts → localeAlternates()` |
| hreflang pt/en + x-default implícito | ✅ | `<link rel="alternate" hreflang="pt|en">` na head e no sitemap |
| robots.txt | ✅ | HTTP 200, aponta sitemap, bloqueia `/admin` por locale |
| sitemap.xml | ✅ | XML válido com `xhtml:link` de alternância de idioma e `lastmod` |
| Gestão de crawlers de IA | ✅ | GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended explicitamente liberados (estratégia GEO opt-in) |
| Cabeçalhos de segurança | ✅ 85/100 | HSTS (preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy |
| Mobile-first / responsivo | ✅ | Layout responsivo (Tailwind), `viewport` automático do Next |
| PWA / manifest | ✅ | `manifest.ts` com ícones any+maskable, theme_color |
| Bloqueio de admin do índice | ✅ | `robots.ts` deriva `/admin` e `/{locale}/admin` de `locales` |

**Pontos fortes notáveis**
- `localePrefix: "as-needed"` — locale padrão (pt) servido sem prefixo, evitando duplicação de conteúdo. Canonical e hreflang são coerentes com essa regra (`lib/seo.ts`).
- `robots.ts` deriva os caminhos de admin de `locales`, então adicionar um idioma nunca deixa um path de admin exposto. Engenharia defensiva.

**Oportunidades**
- ⚠️ **CSP ausente** — único header de segurança faltando. O código documenta a decisão de adiar ([`next.config.ts`](../../next.config.ts)): a CSP exige nonce-middleware por causa do JSON-LD inline e fontes externas. Decisão consciente, mas vale priorizar como hardening.
- ℹ️ **6 scrapers de IA não gerenciados explicitamente** (Bytespider, CCBot, Amazonbot, anthropic-ai, Applebot-Extended, FacebookBot) herdam a regra `*` (allow). Não é um defeito — é uma **decisão estratégica a tomar**: Bytespider/CCBot são scrapers de treino sem benefício de citação; alguns sites os bloqueiam. Ver Action Plan.

---

## 2. Conteúdo & E-E-A-T — 85/100 ✅

| Sinal E-E-A-T | Status | Evidência |
|---------------|:------:|-----------|
| Identidade da organização | ✅ | `ProfessionalService` schema: nome, legalName, CNPJ-ready, foundingDate 2017 |
| Endereço físico (NAP) | ✅ | Rua Frei Gaspar 22, Santos/SP — `PostalAddress` no schema + footer |
| Contato (e-mail/telefone/WhatsApp) | ✅ | `siteConfig.contact` + botão WhatsApp flutuante |
| Página "Quem somos" / time | ✅ | `/about` + seção Team com fotos e nomes |
| Prova social (depoimentos/clientes) | ✅ | Seções Testimonials, Clients, Stats, Portfolio |
| Organização-mãe | ⚠️ parcial | `parentOrganization: Grupo Vannuchi Engenharia` declarado **só pelo nome** — `url` e `sameAs` comentados/vazios |
| Bilíngue (pt/en) | ✅ | Catálogo completo em `messages/{pt,en}.json` |
| Conteúdo editorial (blog/informações) | ✅ | `/informations` (artigos via CMS) |

**Oportunidades**
- ℹ️ **Autoria dos artigos** — `ArticleJsonLd` usa a organização como `author`/`publisher` (correto), mas não há **byline de pessoa** nem `datePublished`/`dateModified`. Para E-E-A-T de conteúdo competitivo (padrão dez/2025, aplica-se a todas as queries), nomear um autor-pessoa e datar os artigos fortalece o sinal de "Expertise/Experience".
- ℹ️ **Profundidade de conteúdo / cadência** — a estrutura para blog (`/informations`) existe e está bem otimizada; o ganho de ranqueamento orgânico de cauda longa virá de **volume e frequência de publicação**, não de mudanças técnicas.

---

## 3. On-Page SEO — 92/100 ✅

| Item | Status | Evidência |
|------|:------:|-----------|
| Title único por página | ✅ | `defaultTitle` + `titleTemplate "%s · {brand}"` em `[locale]/layout.tsx` |
| Title da home | ✅ | "N8X Marketing — Sua marca na primeira página do Google" (60 car., ideal) |
| Meta description | ✅ | 156 caracteres, com keyword e proposta de valor (ideal ≤ 160) |
| Um único H1 por página | ✅ | Confirmado no código (carousel emite só 1 `<h1>`) |
| Hierarquia de headings | ✅ | H1 → H2 (seções) → H3 (serviços/cases) coerente |
| Keywords meta | ✅ (neutro) | Presente; Google ignora, mas não prejudica |
| Metadata por rota | ✅ | Todas as 12 páginas de marketing têm `generateMetadata` próprio |

**Observação:** title/description de OG e Twitter são **deliberadamente omitidos** no layout para que o Next os derive do `title`/`description` de cada rota — assim cada página recebe copy social própria. Decisão correta e bem documentada no código.

---

## 4. Schema / Dados Estruturados — 93/100 ✅ (exemplar)

Grafo JSON-LD interligado por `@id` estável — referência de boas práticas:

| Tipo | Onde | Status |
|------|------|:------:|
| `ProfessionalService` (`#organization`) | Layout marketing (todas as páginas) | ✅ |
| `WebSite` (`#website`) | Layout marketing | ✅ (sem SearchAction — correto, não há busca on-site) |
| `BreadcrumbList` | Páginas de detalhe (serviço/portfólio/info) | ✅ |
| `Service` | `/services/[slug]` | ✅ provider → `#organization` |
| `Article` | `/informations/[slug]` | ✅ author/publisher → `#organization` |
| `CreativeWork` | `/portfolio/[slug]` | ✅ creator → `#organization`, com image/dateCreated |

**Pontos fortes**
- JSON-LD apenas (nunca Microdata/RDFa) — conforme padrão atual.
- Entidades cruzam-se por `@id` → motores resolvem um único grafo conectado.
- Nenhum uso de schema restrito/depreciado (sem FAQPage indevido, sem HowTo).

**Oportunidades**
- ℹ️ `ArticleJsonLd` sem `datePublished`/`dateModified`/`image` — adicionar habilita melhor elegibilidade a rich results e sinais de frescor.
- ℹ️ `parentOrganization` sem `url`/`sameAs` — preencher o perfil do Grupo Vannuchi (Google Business / LinkedIn) melhora a desambiguação de entidade.

---

## 5. Performance / Core Web Vitals — 85/100 ✅ (*não verificado)

> ⚠️ **Limitação de ambiente:** o PageSpeed Insights API retornou *rate limit* (sem chave). **LCP/INP/CLS reais não foram medidos** — confiança: Hipótese. Recomenda-se rodar manualmente em https://pagespeed.web.dev/?url=https://n8xmarketing.com.br

**Sinais arquiteturais positivos (do código):**
- Next.js 16 com renderização estática + ISR (`revalidateTag` nas edições) → HTML servido estático e rápido.
- `next/image` em todas as imagens, com `priority` na imagem LCP do hero e `sizes="100vw"`.
- Fontes Google com `subsets: ["latin"]` (Geist) — subset reduzido.
- Animação do carousel respeita `prefers-reduced-motion` e pausa no hover/focus.
- Região de deploy `gru1` (São Paulo) — baixa latência para público brasileiro.

**Ação:** medir CWV reais (campo + lab) e confirmar LCP < 2,5s / INP < 200ms / CLS < 0,1.

---

## 6. Otimização de Imagens — 90/100 ✅

- **Disciplina de alt correta:** imagens significativas recebem alt descritivo (`client.name`, `project.title`, `member.name`, `item.authorName`); imagens decorativas (fundo do hero, ícones, og-image, capa de info) recebem `alt=""`. Padrão impecável.
- Todas as imagens passam por `next/image` (lazy/responsive/AVIF-WebP automático).
- `remotePatterns` restringe hosts externos (Unsplash, Drive, etc.) — bom para segurança.

**Oportunidade:** as imagens de capa de `informations` usam `alt=""` (decorativas, duplicam o título adjacente) — defensável; se passarem a ser ilustrativas/informativas, dar alt descritivo.

---

## 7. AI Search / GEO — 95/100 ✅

| Item | Status | Evidência |
|------|:------:|-----------|
| `llms.txt` | ✅ 100/100 | 3 seções, 23 links, descrição da agência + endereço |
| Crawlers de IA liberados | ✅ | GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot explicitamente allow |
| Entidade resolvível (schema) | ✅ | Grafo `@id` conectado — facilita citação por IA |
| NAP consistente | ✅ | Mesmo endereço no schema, footer e llms.txt |

**Oportunidades**
- ℹ️ `llms-full.txt` não existe — opcional; um arquivo expandido com o conteúdo completo dos serviços/cases pode aumentar a qualidade da citação por LLMs.
- ℹ️ Decidir explicitamente sobre Bytespider/CCBot (treino sem citação) vs. PerplexityBot/OAI (citação com tráfego).

---

## Tabela de Achados (priorizada)

| # | Severidade | Achado | Confiança |
|---|:----------:|--------|:---------:|
| 1 | ⚠️ Warning | `og:url` ausente em todas as páginas | Confirmado (live) |
| 2 | ⚠️ Warning | CSP (Content-Security-Policy) ausente | Confirmado |
| 3 | ℹ️ Info | `parentOrganization` sem `url`/`sameAs` (Grupo Vannuchi) | Confirmado (código) |
| 4 | ℹ️ Info | `ArticleJsonLd` sem `datePublished`/`dateModified`/`image` | Confirmado (código) |
| 5 | ℹ️ Info | 6 scrapers de IA herdam regra `*` (decisão estratégica) | Confirmado |
| 6 | ℹ️ Info | Sem byline de autor-pessoa nos artigos | Confirmado |
| 7 | ℹ️ Info | `llms-full.txt` ausente (opcional) | Confirmado |
| 8 | ℹ️ Info | `twitter:site`/`twitter:creator` ausentes (opcionais) | Confirmado |
| 9 | ℹ️ Info | CWV reais não medidos | Limitação de ambiente |

---

## Limitações da Auditoria

- **PageSpeed Insights:** rate limit da API (sem chave) — CWV não medidos. Rodar manualmente.
- Demais checagens foram confirmadas no HTML ao vivo **e** no código-fonte, eliminando hipóteses.
