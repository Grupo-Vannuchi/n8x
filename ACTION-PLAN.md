# Plano de Ação SEO — n8x-marketing

Ordem de execução priorizada (impacto × esforço). Baseado em [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md).

---

## 1. Bloqueadores imediatos
_Nenhum._ O site é indexável (sem `noindex` global, sem `disallow: /`, sitemap presente).

---

## 2. Quick wins (alto impacto, baixo esforço)

### 2.1 — Dados estruturados `Organization` + `LocalBusiness` 🟠
**Impacto:** elegibilidade a rich results, Knowledge Panel e SEO local (negócio em Santos/SP).
**Esforço:** baixo — os dados já existem em [`siteConfig`](src/config/site.ts).
- Criar um componente `JsonLd` que injeta `<script type="application/ld+json">`.
- Renderizar no [layout `[locale]`](src/app/[locale]/layout.tsx) um `LocalBusiness` (ou `ProfessionalService`) com `name`, `legalName`, `url`, `telephone`, `email`, `address` (PostalAddress a partir de `siteConfig.contact.address`), `sameAs` (redes do `siteConfig.social`) e `foundingDate`.
- **Apenas JSON-LD** (regra da skill — nunca Microdata/RDFa).

### 2.2 — Canonical + hreflang no `generateMetadata` 🟠
**Impacto:** evita conteúdo duplicado entre `/` (pt) e `/en`, consolida sinais.
**Esforço:** baixo.
- No `generateMetadata` do [layout](src/app/[locale]/layout.tsx#L26) (e/ou helper compartilhado) adicionar:
  `alternates: { canonical: <url do locale>, languages: { pt: ..., en: ... } }`.
- Reaproveitar a lógica de `url()`/`alternates()` que já existe em [sitemap.ts](src/app/sitemap.ts).

### 2.3 — Imagem OG/Twitter padrão 🟠
**Impacto:** CTR em compartilhamentos (hoje o card sai em branco).
**Esforço:** baixo.
- Adicionar `opengraph-image.tsx` (ou PNG estático 1200×630) e referenciar `images` no `openGraph`/`twitter` do [layout:43-54](src/app/[locale]/layout.tsx#L43-L54).
- Garantir fallback nas páginas de detalhe de serviço ([services/[slug]](src/app/[locale]/(marketing)/services/[slug]/page.tsx#L30-L34)).

### 2.4 — `BreadcrumbList` nas páginas de detalhe ⚠️
**Impacto:** breadcrumbs nos resultados de busca.
**Esforço:** baixo — adicionar JSON-LD em `services/[slug]` e `portfolio/[slug]`.

---

## 3. Melhorias estratégicas (alto impacto, esforço maior)

### 3.1 — Trocar `force-dynamic` por ISR ✅ (implementado — padrão ouro)
**Impacto:** TTFB/LCP melhores, menos carga de servidor (CWV).
- ✅ `force-dynamic` removido da home, about, services/portfolio (lista e `[slug]`).
- ✅ Queries em [src/lib/queries.ts](src/lib/queries.ts) agora usam `unstable_cache` com **tags por tipo de conteúdo** ([src/lib/cache.ts](src/lib/cache.ts)) + fallback de 1 dia.
- ✅ Server actions trocaram `revalidatePath` (hardcoded por path/locale) por `revalidateTag(tag, "max")` — invalida todas as páginas que leem o conteúdo, em qualquer locale.
- ✅ `generateStaticParams` resiliente nos `[slug]` (prerender + ISR on-demand).
- ⚠️ **Operacional:** o `next build` agora exige o banco acessível (as páginas são pré-renderizadas). Garanta `DATABASE_URL` no CI/build.

### 3.2 — `WebSite` + `SearchAction` e schema `Service`/`CreativeWork` 🟠
**Impacto:** entendimento de entidade e GEO/AEO (citação por IA).
**Esforço:** médio.
- `WebSite` JSON-LD no layout; `Service` em cada serviço; `CreativeWork`/`Article` nos cases de portfólio.

### 3.3 — Readiness para IA (GEO) ℹ️
- Avaliar `app/llms.txt` e política explícita de AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) no [robots.ts](src/app/robots.ts) quando houver domínio.

---

## 4. Manutenção (baixa urgência)

| Item | Ação | Arquivo |
|------|------|---------|
| Sitemap `lastModified` | Usar `updatedAt` real dos registros | [sitemap.ts:44](src/app/sitemap.ts#L44) |
| Robots locale-aware | Gerar `disallow` a partir de `locales` | [robots.ts:11](src/app/robots.ts#L11) |
| Ícones PWA | Adicionar PNG 192/512 (maskable) + apple-touch-icon | [manifest.ts](src/app/manifest.ts) |
| Meta `keywords` | Manter (Bing) ou remover (Google ignora) | [layout.tsx:41](src/app/[locale]/layout.tsx#L41) |

---

## 5. Verificação pós-publicação (quando houver domínio)
Rodar a auditoria completa por URL para fechar as incógnitas de CWV/headers/robots servido:
```
seo audit https://SEU-DOMINIO
```
Isso cobre PageSpeed (LCP/INP/CLS), headers de segurança, robots.txt/sitemap.xml reais e gestão de AI crawlers — itens marcados como *Limitação de Ambiente* no relatório.
