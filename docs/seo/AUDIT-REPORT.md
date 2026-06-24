# Auditoria de SEO — n8x-marketing (análise de código-fonte) · pós-implementação

> **Escopo:** auditoria estática do código-fonte do app Next.js (App Router + next-intl), **sem subir servidor**. Cobre metadata, indexabilidade (sitemap/robots), dados estruturados (JSON-LD), headings, imagens/alt, canonical/hreflang, OG/Twitter, PWA e sinais de E-E-A-T.
> **Data:** 2026-06-08 · **Método:** LLM-first sobre os arquivos do repositório + verificação contra a saída do `next build` (Next 16.2.7). Sem fetch de URL público, sem PageSpeed.
> **Confiança do score:** Média-Alta (estrutura confirmada no build de produção; Core Web Vitals e robots/sitemap *servidos publicamente* ainda não medidos — ver Limitações de Ambiente).

---

## A) Resumo da Auditoria

- **Tipo de site:** Agência de marketing (negócio local — Santos/SP, com endereço, telefone e CNPJ no `siteConfig`).
- **Rating geral:** **~84 / 100 — Good** (antes: ~63 — *Needs Improvement*). Score confidence: Média-Alta.
- **O que mudou desde a auditoria de 2026-06-05:** os três principais problemas (ausência de JSON-LD, falta de canonical/hreflang em página, e cards sociais em branco) foram resolvidos e **verificados no HTML pré-renderizado** do `next build`. Foram também tratados todos os itens de manutenção (robots locale-aware + AI crawlers, `lastModified` real no sitemap, ícones PWA) e adicionado `llms.txt`.

**Top 3 problemas (anteriores) — todos resolvidos ✅**
1. ✅ **Dados estruturados JSON-LD** — agora presentes em todas as páginas públicas: `ProfessionalService`, `WebSite`, `Service` + `BreadcrumbList` (serviços), `CreativeWork` + `BreadcrumbList` (portfólio), cruzando-se por `@id`.
2. ✅ **Canonical + hreflang no nível de página** — `alternates` self-referencing em todas as rotas via helper `localeAlternates`.
3. ✅ **Imagem OG/Twitter** — `[locale]/opengraph-image.tsx` (1200×630) herdada por todas as páginas; portfólio usa a capa do projeto.

**Pontos de atenção remanescentes (baixa severidade)**
1. ℹ️ Core Web Vitals **não medidos** (exigem URL pública + PageSpeed). ISR já implementado deve ajudar TTFB/LCP.
2. ℹ️ Meta `keywords` ainda presente (ignorada pelo Google; inofensiva — mantida para Bing).
3. ℹ️ Ícones PWA são gerados por código (`icon.tsx`/`apple-icon.tsx` via `ImageResponse`) — funcionais; um asset de marca dedicado (PNG desenhado) renderiza melhor que o monograma automático.

---

## B) Tabela de Achados

| Área | Severidade | Confiança | Achado | Evidência | Status |
|------|-----------|-----------|--------|-----------|--------|
| Dados estruturados | ✅ Pass | Confirmed | JSON-LD `ProfessionalService` + `WebSite` em todas as páginas; `Service`/`CreativeWork` + `BreadcrumbList` nos detalhes | [json-ld.tsx](src/components/json-ld.tsx); build: `@type` `ProfessionalService`/`WebSite`/`Service`/`BreadcrumbList` no HTML de serviços, `CreativeWork`+`BreadcrumbList` no de portfólio | Implementado |
| Canonical / i18n | ✅ Pass | Confirmed | `canonical` + `hreflang` (pt/en) em cada rota | [seo.ts:`localeAlternates`](src/lib/seo.ts); build: `<link rel="canonical">` + `<link rel="alternate" hreflang>` em `pt.html` | Implementado |
| Social / OG | ✅ Pass | Confirmed | OG/Twitter image global 1200×630; títulos/descrições derivados por página | [opengraph-image.tsx](src/app/[locale]/opengraph-image.tsx); build: `og:image`/`twitter:image` + `og:title` específico por página | Implementado |
| OG (detalhe serviço) | ✅ Pass | Confirmed | Serviço herda a OG image padrão (antes saía sem imagem) | build: `og:image` presente em `pt/services/branding.html` | Corrigido |
| Schema `Service`/`CreativeWork` | ✅ Pass | Confirmed | `Service` (com `provider`→org) e `CreativeWork` (com `creator`→org, imagem absoluta) | [services/[slug]](src/app/[locale]/(marketing)/services/[slug]/page.tsx), [portfolio/[slug]](src/app/[locale]/(marketing)/portfolio/[slug]/page.tsx) | Implementado |
| Breadcrumbs | ✅ Pass | Confirmed | `BreadcrumbList` (3 níveis, nomes localizados) nos detalhes | build: 3× `ListItem` por página de detalhe | Implementado |
| Performance | ⚠️ Warning | Likely | ISR no lugar de `force-dynamic` (cache por tag + fallback 1 dia) | [queries.ts](src/lib/queries.ts) `unstable_cache`; build: rotas marcadas `●/○` (SSG/Static), não `ƒ` | Implementado (CWV não medido) |
| Robots | ✅ Pass | Confirmed | `disallow` derivado de `locales`; política explícita para crawlers de IA | [robots.ts](src/app/robots.ts); build `robots.txt`: regra `*` + regra GPTBot/ClaudeBot/PerplexityBot/… | Implementado |
| Sitemap | ✅ Pass | Confirmed | `lastModified` real por registro (`updatedAt`) | [sitemap.ts](src/app/sitemap.ts) + [queries.ts](src/lib/queries.ts) `get*SitemapEntries`; build: 12+ valores `<lastmod>` distintos | Implementado |
| GEO / IA | ✅ Pass | Confirmed | `llms.txt` (mapa do site para LLMs) + AI crawlers liberados | [llms.txt/route.ts](src/app/llms.txt/route.ts); build: `○ /llms.txt` | Implementado |
| PWA / Ícones | ✅ Pass | Confirmed | `icon` 512 (maskable) + `apple-icon` 180; manifest com `purpose: any/maskable` | [icon.tsx](src/app/icon.tsx), [apple-icon.tsx](src/app/apple-icon.tsx), [manifest.ts](src/app/manifest.ts); build: `apple-touch-icon` no HTML | Implementado |
| Metadata (keywords) | ℹ️ Info | Confirmed | Meta `keywords` presente (ignorada pelo Google) | [layout.tsx:41](src/app/[locale]/layout.tsx#L41) | Mantido (inofensivo) |
| On-page | ✅ Pass | Confirmed | H1 único e semântico por página | [hero.tsx:26](src/components/sections/hero.tsx#L26); detalhes usam `<article>` + `<h1>`/`<h2>` | — |
| Imagens / Acessibilidade | ✅ Pass | Confirmed | Todas as `<Image>` têm `alt` significativo; `priority`+`sizes` nas capas | `project.title`, `member.name`, `client.name` | — |
| Metadata interna | ✅ Pass | Confirmed | Páginas internas com title/description via i18n | `generateMetadata` em about/services/portfolio/contact/careers + detalhes | — |
| Indexação admin | ✅ Pass | Confirmed | Admin com `noindex` + `disallow` (todos os locales) | [admin layout](src/app/[locale]/admin/(dashboard)/layout.tsx#L6); robots cobre `/admin` e `/en/admin` | — |

---

## C) Detalhe por Categoria (score direcional)

| Categoria | Peso | Score antes | Score agora | Observação |
|-----------|------|-------------|-------------|------------|
| Technical SEO | 25% | 70 | **88** | canonical/hreflang, ISR, robots locale-aware + AI, sitemap com `lastModified` real |
| Content Quality / E-E-A-T | 20% | 80 | **85** | sinais reais (sobre, time, endereço/CNPJ) agora **estruturados** via schema |
| On-Page SEO | 15% | 80 | **80** | títulos, descrições e headings já corretos |
| Schema / Structured Data | 15% | 10 | **90** | Organization, WebSite, Service, CreativeWork, BreadcrumbList — grafo conectado por `@id` |
| Performance (CWV) | 10% | 55 | **70** | ISR implementado; **CWV ainda não medido** (sem URL pública) |
| Image Optimization | 10% | 85 | **88** | `next/image` + OG image social agora presente |
| AI Search Readiness (GEO) | 5% | 45 | **80** | schema + `llms.txt` + política explícita de AI crawlers |

> Score global ≈ **84** → *Good* (antes ≈ 63). O salto vem sobretudo de Schema (10→90) e Technical SEO (70→88). O teto até a auditoria por URL é limitado por Performance/CWV não medido.

---

## D) Resumo das alterações implementadas

- **`src/components/json-ld.tsx`** — novos componentes `WebSiteJsonLd`, `BreadcrumbJsonLd`, `ServiceJsonLd`, `CreativeWorkJsonLd` (além do `OrganizationJsonLd` existente), cruzando-se por `@id` (`#organization`, `#website`).
- **`src/lib/seo.ts`** — helper `absoluteUrl()` para tornar absolutas as imagens de schema.
- **`src/app/[locale]/(marketing)/layout.tsx`** — render do `WebSiteJsonLd`.
- **`src/app/[locale]/layout.tsx`** — `openGraph`/`twitter` sem `title`/`description` fixos (derivam por página); OG image herdada.
- **`src/app/[locale]/opengraph-image.tsx`** — movido da raiz para o segmento `[locale]` para ser anexado à metadata das páginas (correção do card em branco).
- **`src/app/[locale]/(marketing)/services/[slug]/page.tsx`** — `ServiceJsonLd` + `BreadcrumbJsonLd`; remoção do `openGraph` redundante (herda a OG image).
- **`src/app/[locale]/(marketing)/portfolio/[slug]/page.tsx`** — `CreativeWorkJsonLd` + `BreadcrumbJsonLd`.
- **`src/app/robots.ts`** — `disallow` derivado de `locales`; segunda regra liberando GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended.
- **`src/app/llms.txt/route.ts`** — novo handler `text/plain` (revalidação diária; degrada para páginas-núcleo sem DB).
- **`src/app/sitemap.ts`** + **`src/lib/queries.ts`** — `lastModified` real via `get{Project,Service}SitemapEntries` (slug + `updatedAt`).
- **`src/app/icon.tsx`** (512, maskable-safe) + **`src/app/apple-icon.tsx`** (180) + **`src/app/manifest.ts`** (ícones 192/512, `purpose: any` e `maskable`).

**Verificação:** `tsc --noEmit` e `eslint` sem erros (1 warning pré-existente, alheio às mudanças, em `service-form.tsx`); `next build` concluído com sucesso (87 páginas estáticas). Saída inspecionada: JSON-LD, canonical/hreflang, OG/Twitter image, `robots.txt`, `sitemap.xml` (lastmod reais), `llms.txt` e `apple-touch-icon`.

---

## E) Incógnitas e Follow-ups (continuam dependendo de domínio publicado)

- **Core Web Vitals reais (LCP/INP/CLS):** exigem URL pública + PageSpeed. Hoje `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- **robots.txt / sitemap.xml / llms.txt servidos:** validar a saída real em produção (o `host`/`sitemap` no robots usam `NEXT_PUBLIC_SITE_URL` — definir o domínio real antes do deploy).
- **Renderização final em produção:** confirmar tags no `<head>` servido por um domínio público (validar JSON-LD no Rich Results Test do Google).

---

## Limitações de Ambiente

Auditoria **estática (código-fonte)** + verificação contra o build local. Não foram executados: fetch de URL pública, PageSpeed/CrUX, checagem de headers de segurança, broken links nem captura visual. Nenhum valor de ranking, tráfego, CWV ou penalidade foi inferido. Para fechar as incógnitas de CWV/headers/robots servido, publique o site e rode `seo audit https://SEU-DOMINIO`.
