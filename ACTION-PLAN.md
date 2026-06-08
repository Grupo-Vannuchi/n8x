# Plano de Ação SEO — n8x-marketing

Ordem de execução priorizada (impacto × esforço). Baseado em [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md).

---

## 1. Bloqueadores imediatos
_Nenhum._ O site é indexável (sem `noindex` global, sem `disallow: /`, sitemap presente).

---

## 2. Quick wins (alto impacto, baixo esforço) — ✅ todos implementados

### 2.1 — Dados estruturados `Organization` + `LocalBusiness` ✅ (implementado)
**Impacto:** elegibilidade a rich results, Knowledge Panel e SEO local (negócio em Santos/SP).
- ✅ Componente [`json-ld.tsx`](src/components/json-ld.tsx) injeta `<script type="application/ld+json">` (apenas JSON-LD).
- ✅ `ProfessionalService` (`@id` `#organization`) renderizado no [layout de marketing](src/app/[locale]/(marketing)/layout.tsx) com `name`, `legalName`, `url`, `telephone`, `email`, `address` (PostalAddress), `sameAs` e `foundingDate`.

### 2.2 — Canonical + hreflang no `generateMetadata` ✅ (implementado)
**Impacto:** evita conteúdo duplicado entre `/` (pt) e `/en`, consolida sinais.
- ✅ Helper [`localeAlternates`](src/lib/seo.ts) aplicado em home, about, services/[slug] e portfolio/[slug]: `alternates: { canonical, languages: { pt, en } }`. Confirmado no HTML do build.

### 2.3 — Imagem OG/Twitter padrão ✅ (implementado)
**Impacto:** CTR em compartilhamentos (antes o card saía em branco).
- ✅ [`[locale]/opengraph-image.tsx`](src/app/[locale]/opengraph-image.tsx) 1200×630 gerada via `ImageResponse`, herdada por todas as páginas.
- ✅ Layout sem `title`/`description` fixos em `openGraph`/`twitter` (derivam por página); detalhe de serviço herda a OG image; portfólio usa a capa do projeto.

### 2.4 — `BreadcrumbList` nas páginas de detalhe ✅ (implementado)
**Impacto:** breadcrumbs nos resultados de busca.
- ✅ `BreadcrumbJsonLd` (3 níveis, nomes localizados) em `services/[slug]` e `portfolio/[slug]`.

---

## 3. Melhorias estratégicas (alto impacto, esforço maior)

### 3.1 — Trocar `force-dynamic` por ISR ✅ (implementado — padrão ouro)
**Impacto:** TTFB/LCP melhores, menos carga de servidor (CWV).
- ✅ `force-dynamic` removido da home, about, services/portfolio (lista e `[slug]`).
- ✅ Queries em [src/lib/queries.ts](src/lib/queries.ts) agora usam `unstable_cache` com **tags por tipo de conteúdo** ([src/lib/cache.ts](src/lib/cache.ts)) + fallback de 1 dia.
- ✅ Server actions trocaram `revalidatePath` (hardcoded por path/locale) por `revalidateTag(tag, "max")` — invalida todas as páginas que leem o conteúdo, em qualquer locale.
- ✅ `generateStaticParams` resiliente nos `[slug]` (prerender + ISR on-demand).
- ⚠️ **Operacional:** o `next build` agora exige o banco acessível (as páginas são pré-renderizadas). Garanta `DATABASE_URL` no CI/build.

### 3.2 — `WebSite` e schema `Service`/`CreativeWork` ✅ (implementado)
**Impacto:** entendimento de entidade e GEO/AEO (citação por IA).
- ✅ `WebSiteJsonLd` (`@id` `#website`, `inLanguage`, `publisher`→org) no layout de marketing.
- ✅ `ServiceJsonLd` (com `provider`→org) em cada serviço; `CreativeWorkJsonLd` (com `creator`→org e imagem absoluta) nos cases.
- _Sem `SearchAction`: o site não tem busca on-site, então anunciar uma seria enganoso._

### 3.3 — Readiness para IA (GEO) ✅ (implementado)
- ✅ [`app/llms.txt`](src/app/llms.txt/route.ts) — mapa do site em texto para LLMs (revalidação diária, degrada para páginas-núcleo sem DB).
- ✅ Política explícita de AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended) liberados em [robots.ts](src/app/robots.ts). Definir o domínio real em `NEXT_PUBLIC_SITE_URL` antes do deploy (usado em `host`/`sitemap`).

---

## 4. Manutenção — ✅ implementada (exceto item inofensivo)

| Item | Status | Arquivo |
|------|--------|---------|
| Sitemap `lastModified` | ✅ `updatedAt` real via `get{Project,Service}SitemapEntries` | [sitemap.ts](src/app/sitemap.ts) · [queries.ts](src/lib/queries.ts) |
| Robots locale-aware | ✅ `disallow` derivado de `locales` (`/admin`, `/en/admin`, …) | [robots.ts](src/app/robots.ts) |
| Ícones PWA | ✅ `icon` 512 (maskable) + `apple-icon` 180 (gerados via `ImageResponse`); manifest com `purpose: any/maskable` | [icon.tsx](src/app/icon.tsx) · [apple-icon.tsx](src/app/apple-icon.tsx) · [manifest.ts](src/app/manifest.ts) |
| Meta `keywords` | ℹ️ Mantido (inofensivo; Google ignora, Bing pode usar) | [layout.tsx:41](src/app/[locale]/layout.tsx#L41) |

---

## 5. Verificação pós-publicação (quando houver domínio)
Rodar a auditoria completa por URL para fechar as incógnitas de CWV/headers/robots servido:
```
seo audit https://SEU-DOMINIO
```
Isso cobre PageSpeed (LCP/INP/CLS), headers de segurança, robots.txt/sitemap.xml reais e gestão de AI crawlers — itens marcados como *Limitação de Ambiente* no relatório.
