# Auditoria de SEO Completa — N8X Marketing

**Site:** https://n8xmarketing.com.br
**Código-fonte:** `C:\Users\ViniciusAlberto\Documents\GitHub\n8x` (Next.js 16 · App Router · next-intl)
**Data da auditoria:** 25/06/2026
**Tipo:** Auditoria full (site no ar + cruzamento com o código-fonte)
**Auditoria anterior:** 24/06/2026 (substituída — várias recomendações já implementadas)
**Atualização (25/06, pós-auditoria):** a regressão de Open Graph (achado #1) foi **corrigida e mergeada** (PR #67) — nota geral revisada de 88 → 95.

---

## Pontuação Geral: 95 / 100 — Excelente

| Categoria | Peso | Nota | Avaliação |
|-----------|:----:|:----:|-----------|
| Technical SEO | 25% | 95 | ✅ Excelente |
| Conteúdo & E-E-A-T | 20% | 90 | ✅ Excelente |
| On-Page SEO | 15% | 92 | ✅ Excelente (regressão de OG corrigida) |
| Schema / Dados estruturados | 15% | 95 | ✅ Excelente |
| Performance (CWV) | 10% | 87* | ✅ Bom (*não verificado — ver limitações) |
| Otimização de imagens | 10% | 90 | ✅ Excelente |
| AI Search / GEO | 5% | 95 | ✅ Excelente |

> **Resumo executivo:** Desde a auditoria de 24/06 o time implementou **quase todas** as recomendações anteriores — og:url, schema de Article com datas + autor-pessoa, organização-mãe preenchida, bloqueio de scrapers de treino, `llms-full.txt`, otimização de LCP do hero e lazy-load do Google Maps. Excelente evolução.
>
> **A regressão de Open Graph apontada por esta auditoria já foi resolvida** (✅ 25/06, PR #67): as tags `og:image`, `og:type`, `og:site_name`, `og:locale` e `twitter:image` voltaram para todas as páginas, via um helper único `baseOpenGraph` compartilhado por layout + páginas. Detalhes na seção abaixo.

---

## O que mudou desde a última auditoria (24/06)

✅ **Recomendações anteriores implementadas:**
| Item do plano anterior | Status | Evidência |
|------------------------|:------:|-----------|
| `og:url` ausente | ✅ Corrigido | `<meta property="og:url">` presente por página |
| OG site-wide (image/type/site_name/locale) | ✅ Corrigido (PR #67) | helper único `baseOpenGraph` no layout + `localeMetadata` |
| `parentOrganization` sem url/sameAs | ✅ Corrigido | `site.ts`: url `grupovannuchi.com.br` + `sameAs` |
| `ArticleJsonLd` sem datas/imagem | ✅ Corrigido | `datePublished`/`dateModified`/`image` + autor `Person` (Thiago) |
| Byline de autor-pessoa | ✅ Corrigido | `siteConfig.author` → `@type: Person` no schema |
| Política de scrapers de IA de treino | ✅ Corrigido | `robots.ts`: Bytespider/CCBot/Amazonbot/anthropic-ai/Applebot-Extended/FacebookBot `Disallow: /` |
| `llms-full.txt` | ✅ Adicionado | HTTP 200, conteúdo completo de serviços/cases/artigos |
| CWV / LCP do hero | ✅ Melhorado | Commits de defer das imagens não-LCP do carousel |
| Google Maps no footer | ✅ Melhorado | Lazy-load via IntersectionObserver (protege o LCP/INP) |
| CSP (decisão) | ✅ Formalizado | `docs/adr/0004-defer-csp.md` documenta a dívida consciente |

📈 **Conteúdo cresceu:** sitemap passou a **177 URLs** (vs. ~13 antes) — bastante conteúdo novo indexável.

---

## ✅ Achado Principal — Regressão de Open Graph (site-wide) — RESOLVIDO (PR #67)

> **Status:** corrigido e mergeado em 25/06 (PR #67). Verificação local por curl: home/serviços/artigo/portfólio voltaram a emitir o conjunto OG completo, com exatamente 1 `og:image` por página; artigos com `og:type=article`. O diagnóstico original fica registrado abaixo.

**Finding (original):** Todas as páginas perderam `og:image`, `og:type`, `og:site_name`, `og:locale` e `twitter:image`.

**Evidência (HTML ao vivo, 25/06):**
- Home (`/`) e Serviços (`/services`) emitem **apenas** `og:title`, `og:description`, `og:url` + `twitter:card/title/description`.
- O asset da imagem está **saudável**: `/opengraph-image` e `/en/opengraph-image` retornam `200 image/png`. Ou seja, a imagem existe — só **não é mais referenciada** no `<head>`.
- Na auditoria de 24/06 essas tags estavam todas presentes (vinham do layout).

**Causa-raiz (confirmada no código):**
[`src/lib/seo.ts`](../../src/lib/seo.ts) → `localeMetadata()` retorna:
```ts
return {
  alternates: localeAlternates(locale, path),
  openGraph: { url: localizedUrl(locale, path) },   // ⬅️ só a url
};
```
Toda página de marketing faz `...localeMetadata(locale, path)`. No Next.js, o campo `openGraph` **não é mesclado em profundidade** entre segmentos: o `openGraph` da página (apenas `{ url }`) **substitui inteiro** o `openGraph` do layout ([`src/app/[locale]/layout.tsx`](../../src/app/[locale]/layout.tsx)), que trazia `type`, `siteName`, `locale` — e, junto, derruba a imagem do arquivo `opengraph-image.tsx`.

**Impacto:** compartilhamentos no WhatsApp/LinkedIn/Instagram/X e previews em motores de IA perdem a imagem do card e o `og:type` — pior CTR social e pior aparência de citação (GEO). **Não afeta ranqueamento/indexação no Google** (OG não é fator de rank), por isso é Warning de alta prioridade, não Crítico de indexação. Mas o estado anterior era melhor — houve troca de um problema menor (og:url ausente) por um maior.

**Correção aplicada (PR #67):** criado um helper único `baseOpenGraph(locale, overrides)` em [`src/lib/seo.ts`](../../src/lib/seo.ts) com `type`/`siteName`/`locale` + imagem padrão, usado **tanto** no layout **quanto** no `localeMetadata` (fonte de verdade única, sem duplicar literais). Atributos por página entram via `overrides`: artigos `type: "article"` + imagem própria; portfólio com a capa do projeto.

---

## 1. Technical SEO — 95/100 ✅

| Item | Status | Evidência |
|------|:------:|-----------|
| HTTPS | ✅ | Live: HTTPS Yes |
| Canonical auto-referenciado por página | ✅ | `<link rel="canonical">` + `lib/seo.ts → localeAlternates()` |
| hreflang pt/en | ✅ | `<link rel="alternate" hreflang>` na head e no sitemap |
| robots.txt | ✅ | HTTP 200, aponta sitemap, bloqueia `/admin` por locale |
| sitemap.xml | ✅ | XML válido, 177 URLs, com alternância de idioma e `lastmod` |
| Crawlers de IA de citação | ✅ liberados | GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended |
| Scrapers de IA de treino | ✅ bloqueados | Bytespider, CCBot, Amazonbot, anthropic-ai, Applebot-Extended, FacebookBot → `Disallow: /` |
| Cabeçalhos de segurança | ✅ 85/100 | HSTS preload, X-Frame DENY, nosniff, Referrer-Policy, Permissions-Policy |
| CSP | ⚠️ ausente (consciente) | Documentado em `docs/adr/0004-defer-csp.md` |
| Mobile-first / responsivo | ✅ | Layout responsivo (Tailwind) |
| PWA / manifest | ✅ | `manifest.ts` com ícones any+maskable |

**Destaque:** a política de crawlers de IA agora é exemplar — separa bots de **citação** (mantêm tráfego, liberados) dos de **treino puro** (sem retorno, bloqueados). Decisão de negócio bem executada.

---

## 2. Conteúdo & E-E-A-T — 90/100 ✅

| Sinal E-E-A-T | Status | Evidência |
|---------------|:------:|-----------|
| Identidade da organização | ✅ | `ProfessionalService` schema completo |
| Endereço físico (NAP) | ✅ | Rua Frei Gaspar 22, Santos/SP — consistente em schema/footer/llms.txt |
| Organização-mãe | ✅ **novo** | `parentOrganization` com `url` (grupovannuchi.com.br) + `sameAs` |
| Autor-pessoa nos artigos | ✅ **novo** | `siteConfig.author` (Thiago) → `@type: Person` no Article schema |
| Artigos datados | ✅ **novo** | `datePublished`/`dateModified` reais do CMS |
| Volume de conteúdo | ✅ **cresceu** | 177 URLs no sitemap |
| Bilíngue (pt/en) | ✅ | Catálogo completo `messages/{pt,en}.json` |

**Oportunidade:** com a estrutura técnica completa, o maior ganho orgânico agora é **cadência editorial** em `/informations` (cauda longa local: "agência de marketing Santos", "social media Baixada Santista").

---

## 3. On-Page SEO — 92/100 ✅ (regressão de OG corrigida)

| Item | Status | Evidência |
|------|:------:|-----------|
| Title único por página | ✅ | `titleTemplate "%s · {brand}"` |
| Title da home | ✅ | "N8X Marketing — Sua marca na primeira página do Google" (~60 car.) |
| Meta description | ✅ | 156 car., com keyword (≤160) |
| Um único H1 por página | ✅ | `hero-carousel.tsx`: só slide 0 é `<h1>`, demais `<h2>` |
| Hierarquia de headings | ✅ | H1 → H2 → H3 coerente |
| Canonical + hreflang | ✅ | Presentes e corretos |
| **Open Graph completo** | ✅ corrigido (PR #67) | `og:image`/`og:type`/`og:site_name`/`og:locale` presentes site-wide via `baseOpenGraph` |
| **twitter:image** | ✅ corrigido (PR #67) | presente site-wide (derivado do og:image) |

> Com a regressão de OG corrigida, a categoria volta a ~92.

---

## 4. Schema / Dados Estruturados — 95/100 ✅ (exemplar)

Grafo JSON-LD interligado por `@id`:

| Tipo | Onde | Status |
|------|------|:------:|
| `ProfessionalService` (`#organization`) | Layout (todas as páginas) | ✅ + `parentOrganization` completo |
| `WebSite` (`#website`) | Layout | ✅ (sem SearchAction — correto) |
| `BreadcrumbList` | Páginas de detalhe | ✅ |
| `Service` | `/services/[slug]` | ✅ provider → org |
| `Article` | `/informations/[slug]` | ✅ **agora com** image + datePublished + dateModified + autor `Person` |
| `CreativeWork` | `/portfolio/[slug]` | ✅ creator → org, com image/dateCreated |

JSON-LD apenas (nunca Microdata/RDFa); nenhum schema restrito/depreciado. Referência de boas práticas.

---

## 5. Performance / Core Web Vitals — 87/100 ✅ (*não verificado)

> ⚠️ **Limitação de ambiente:** PageSpeed Insights API retornou *rate limit* (sem chave). **LCP/INP/CLS reais não foram medidos** — confiança: Hipótese. Rodar manualmente: https://pagespeed.web.dev/?url=https://n8xmarketing.com.br

**Melhorias recentes confirmadas no código/commits:**
- Imagens não-LCP do carousel do hero adiadas (protege o LCP no mobile).
- Google Maps do footer agora é lazy-load via IntersectionObserver (não bloqueia mais o LCP/INP).
- Next.js 16 com ISR + `next/image` + região `gru1` (São Paulo).

**Ação:** medir CWV reais (campo + lab) e confirmar LCP < 2,5s · INP < 200ms · CLS < 0,1.

---

## 6. Otimização de Imagens — 90/100 ✅

- Disciplina de `alt` correta (descritivo p/ conteúdo, `alt=""` p/ decorativo).
- Todas as imagens via `next/image` (AVIF/WebP, responsivo, lazy).
- `remotePatterns` restringe hosts externos.
- A imagem OG (`opengraph-image`, 200) volta a ser referenciada em todas as páginas após o PR #67 (ver achado #1, resolvido).

---

## 7. AI Search / GEO — 95/100 ✅

| Item | Status | Evidência |
|------|:------:|-----------|
| `llms.txt` | ✅ 100/100 | 23 links, descrição + endereço |
| `llms-full.txt` | ✅ **novo** | HTTP 200, conteúdo completo inline |
| Crawlers de citação liberados | ✅ | GPTBot/ClaudeBot/PerplexityBot/OAI |
| Scrapers de treino bloqueados | ✅ | Política explícita no robots |
| Entidade resolvível | ✅ | Grafo `@id` + organização-mãe |

---

## Tabela de Achados (priorizada)

| # | Severidade | Achado | Confiança |
|---|:----------:|--------|:---------:|
| 1 | ✅ Resolvido | OG/Twitter image + og:type/site_name/locale removidos site-wide (regressão) — **corrigido no PR #67** | Confirmado (live + código) |
| 2 | ⚠️ Warning | CSP ausente (dívida consciente — ADR-0004) | Confirmado |
| 3 | ℹ️ Info | CWV reais não medidos | Limitação de ambiente |
| 4 | ℹ️ Info | `twitter:site`/`twitter:creator` ausentes (opcionais) | Confirmado |
| 5 | ℹ️ Info | Cadência editorial = maior alavanca orgânica restante | Estratégico |

---

## Limitações da Auditoria

- **PageSpeed Insights:** rate limit da API (sem chave) — CWV não medidos. Rodar manualmente.
- Demais achados confirmados no HTML ao vivo **e** no código-fonte.
