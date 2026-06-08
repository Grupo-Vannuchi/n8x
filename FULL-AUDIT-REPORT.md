# Auditoria de SEO — n8x-marketing (análise de código-fonte)

> **Escopo:** auditoria estática do código-fonte do app Next.js (App Router + next-intl), **sem subir servidor**. Cobre metadata, indexabilidade (sitemap/robots), dados estruturados (JSON-LD), headings, imagens/alt, canonical/hreflang, OG/Twitter e sinais de E-E-A-T.
> **Data:** 2026-06-05 · **Método:** LLM-first sobre os arquivos do repositório (sem fetch de URL, sem PageSpeed).
> **Confiança do score:** Média-Baixa (Core Web Vitals e robots.txt servido não puderam ser medidos — ver Limitações de Ambiente).

---

## A) Resumo da Auditoria

- **Tipo de site:** Agência de marketing (negócio local — Santos/SP, com endereço, telefone e CNPJ no `siteConfig`).
- **Rating geral:** **~63 / 100 — Needs Improvement** (Score confidence: Média-Baixa).
- **Base sólida:** metadata bem estruturada nas páginas internas, sitemap com hreflang, `alt` em todas as imagens, HTML semântico e i18n correto.

**Top 3 problemas**
1. 🟠 **Nenhum dado estruturado JSON-LD** em todo o projeto (0 ocorrências) — falta `Organization`/`LocalBusiness`, `WebSite`, `BreadcrumbList`, `Service`.
2. 🟠 **Sem `canonical` nem `hreflang` no nível de página** (`alternates` só existe no sitemap).
3. 🟠 **Sem imagem de OG/Twitter global** — cards sociais saem em branco (`twitter.card = summary_large_image` sem `images`).

**Top 3 oportunidades**
1. `LocalBusiness` + `Organization` JSON-LD — o site já tem endereço, telefone, CNPJ e redes sociais prontos no `siteConfig`.
2. Trocar `force-dynamic` por ISR (`revalidate`) nas páginas de marketing → melhora TTFB/LCP.
3. `alternates.canonical` + `alternates.languages` no `generateMetadata` do layout/páginas.

---

## B) Tabela de Achados

| Área | Severidade | Confiança | Achado | Evidência | Correção |
|------|-----------|-----------|--------|-----------|----------|
| Dados estruturados | 🟠 Warning | Confirmed | Nenhum JSON-LD no projeto | `grep "application/ld+json"` → 0 resultados em todo `src/` | Adicionar `<script type="application/ld+json">` com `Organization`/`LocalBusiness` no layout e `Service`/`BreadcrumbList` nas páginas de detalhe |
| Canonical / i18n | 🟠 Warning | Confirmed | Páginas não emitem `canonical` nem `hreflang` | `generateMetadata` em [layout.tsx](src/app/[locale]/layout.tsx#L26) e páginas não definem `alternates`; só [sitemap.ts](src/app/sitemap.ts#L15) tem `alternates` | Adicionar `alternates: { canonical, languages }` no `generateMetadata` |
| Social / OG | 🟠 Warning | Confirmed | Sem imagem OG/Twitter padrão | [layout.tsx:43-54](src/app/[locale]/layout.tsx#L43-L54): `openGraph` sem `images`; `twitter.card` = `summary_large_image` sem imagem | Criar OG image (estática ou `opengraph-image.tsx`) e adicionar `images` no OG/Twitter do layout |
| Performance | 🟠 Warning | Likely | `force-dynamic` em páginas de marketing impede cache/ISR | `export const dynamic = "force-dynamic"` na [home](src/app/[locale]/(marketing)/page.tsx#L14), [about](src/app/[locale]/(marketing)/about/page.tsx#L17), [service/[slug]](src/app/[locale]/(marketing)/services/[slug]/page.tsx#L16), [portfolio/[slug]](src/app/[locale]/(marketing)/portfolio/[slug]/page.tsx#L17) | Trocar por `export const revalidate = 3600` (ISR) e revalidar sob demanda no CMS |
| OG (detalhe) | ⚠️ Warning | Confirmed | Página de serviço não define imagem OG | [services/[slug]:30-34](src/app/[locale]/(marketing)/services/[slug]/page.tsx#L30-L34) — OG sem `images` (portfolio já tem) | Reaproveitar imagem do serviço ou cair no OG padrão do site |
| Sitemap | ℹ️ Info | Confirmed | `lastModified` sempre = agora | [sitemap.ts:44](src/app/sitemap.ts#L44) usa `new Date()` para todos | Usar `updatedAt` real do registro (projetos/serviços) |
| Robots | ℹ️ Info | Confirmed | `disallow` com paths de locale hardcoded | [robots.ts:11](src/app/robots.ts#L11): `["/admin", "/en/admin"]` | Gerar a lista a partir de `locales` para não quebrar ao adicionar idioma |
| PWA / Ícones | ℹ️ Info | Confirmed | Manifest só com `favicon.ico` | [manifest.ts:13](src/app/manifest.ts#L13) — sem PNG 192/512 nem `apple-touch-icon` | Adicionar `icon-192.png`, `icon-512.png` (maskable) e apple-touch-icon |
| Metadata (keywords) | ℹ️ Info | Confirmed | Meta `keywords` presente (ignorada pelo Google) | [layout.tsx:41](src/app/[locale]/layout.tsx#L41) + `pt.json:6` | Inofensivo; pode manter para Bing ou remover |
| Home metadata | ℹ️ Info | Confirmed | Home não tem `generateMetadata` próprio | [page.tsx](src/app/[locale]/(marketing)/page.tsx) sem export de metadata → herda o default do layout | Aceitável (o default já é voltado à home); ganha com canonical próprio |
| On-page | ✅ Pass | Confirmed | H1 único e semântico por página | [hero.tsx:26](src/components/sections/hero.tsx#L26) (`<h1>`), detalhes usam `<article>` + `<h1>`/`<h2>` | — |
| Imagens / Acessibilidade | ✅ Pass | Confirmed | Todas as `<Image>` têm `alt` significativo | `project.title`, `member.name`, `client.name`, `siteConfig.name`; `priority`+`sizes` em capas | — |
| Metadata interna | ✅ Pass | Confirmed | Páginas internas com title/description via i18n | `generateMetadata` em about/services/portfolio/contact/careers + detalhes | — |
| Indexação admin | ✅ Pass | Confirmed | Admin com `noindex` + `disallow` | [admin layout](src/app/[locale]/admin/(dashboard)/layout.tsx#L6) e login com `robots:{index:false}` | — |
| Título / Descrição | ✅ Pass | Confirmed | Comprimentos dentro do ideal | Título ~48 ch; description ~150 ch (`pt.json:3-5`) | — |

---

## C) Detalhe por Categoria (score direcional)

| Categoria | Peso | Score | Observação |
|-----------|------|-------|------------|
| Technical SEO | 25% | 70 | Sitemap/robots bons; faltam canonical/hreflang; `force-dynamic` |
| Content Quality / E-E-A-T | 20% | 80 | Sobre, time, depoimentos, endereço/CNPJ reais — bons sinais, mas não estruturados |
| On-Page SEO | 15% | 80 | Títulos, descrições e headings corretos |
| Schema / Structured Data | 15% | 10 | Ausente |
| Performance (CWV) | 10% | 55 | `force-dynamic` prejudica TTFB/LCP — **não medido** |
| Image Optimization | 10% | 85 | `next/image`, `alt`, `sizes`, `priority` |
| AI Search Readiness (GEO) | 5% | 45 | Bom conteúdo, mas sem schema nem `llms.txt` |

> Score global ≈ **63** → *Needs Improvement*. Penalizado sobretudo pela ausência total de dados estruturados e de canonical/hreflang em página.

---

## D) Incógnitas e Follow-ups (para confirmar `Likely`→`Confirmed`)

- **Core Web Vitals reais (LCP/INP/CLS):** exigem URL pública + PageSpeed. Hoje `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (sem domínio publicado).
- **robots.txt / sitemap.xml servidos:** validar a saída real das rotas `robots.ts`/`sitemap.ts` em produção.
- **AI crawlers (GPTBot, ClaudeBot, PerplexityBot…):** o `robots.ts` atual não os trata explicitamente — decidir política quando houver domínio.
- **Renderização final do `<head>`:** confirmar tags geradas (canonical/OG) num build/servidor real.

---

## Limitações de Ambiente

Esta auditoria foi **estática (código-fonte)**, a pedido. Não foram executados: fetch de URL, PageSpeed/CrUX, checagem de headers de segurança, broken links nem captura visual (Playwright). Nenhum valor de ranking, tráfego, CWV ou penalidade foi inferido — conforme as guardas anti-alucinação da skill. Para a auditoria completa (CWV, robots servido, headers), publique o site e rode `seo audit <url>`.
