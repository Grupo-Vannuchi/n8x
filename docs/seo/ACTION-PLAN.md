# Plano de Ação SEO — N8X Marketing

**Site:** https://n8xmarketing.com.br · **Nota geral:** 95/100 (Excelente)
**Data:** 25/06/2026 · **Atualizado:** 25/06 — item #1 (Open Graph) concluído (PR #67)

> A base técnica está excelente e quase todo o plano anterior (24/06) foi implementado. A correção de alto alcance (Open Graph) **já foi entregue** — o foco restante é refinamento e conteúdo.

---

## ✅ Concluído — 25/06 (PR #67)

### 1. Restaurar as tags Open Graph removidas (regressão site-wide) — FEITO
**Problema (resolvido):** `og:image`, `og:type`, `og:site_name`, `og:locale` e `twitter:image` haviam sumido de **todas** as páginas. Cards de compartilhamento (WhatsApp/LinkedIn/IG/X) e previews de IA ficaram sem imagem.

**Causa:** [`src/lib/seo.ts`](../../src/lib/seo.ts) → `localeMetadata()` devolvia `openGraph: { url }`, e como o Next **não mescla `openGraph` em profundidade**, esse objeto substituía inteiro o `openGraph` do layout (type/siteName/locale) e derrubava a imagem do `opengraph-image.tsx`.

**Solução entregue:** helper único `baseOpenGraph(locale, overrides)` em `src/lib/seo.ts` (fonte de verdade), usado **tanto** no layout **quanto** no `localeMetadata`. Atributos por página entram via `overrides` — artigos `type: "article"` + imagem própria; portfólio com a capa do projeto. Sem duplicar literais entre layout e páginas.
```ts
export function baseOpenGraph(locale: Locale, overrides: Partial<OpenGraph> = {}): OpenGraph {
  return {
    type: "website",
    siteName: siteConfig.name,
    locale,
    images: [{ url: `${localizedUrl(locale)}/opengraph-image`, width: 1200, height: 630, alt: siteConfig.name }],
    ...overrides,
  } as OpenGraph;
}
```
**Validação (curl, dev):** home/serviços/artigo/portfólio voltaram com o OG completo, 1 `og:image` por página, artigos com `og:type=article`. Conferir em produção após o deploy:
```bash
curl -s https://n8xmarketing.com.br | grep -oiE 'property="og:(image|type|site_name|locale)"'
```

---

## 🥈 Prioridade Média — esta/próxima semana

### 2. Medir Core Web Vitals reais
Não foi possível medir nesta auditoria (rate limit da API). As melhorias recentes (defer das imagens do hero, lazy-load do Maps) devem ter melhorado o LCP — **confirmar em campo**.
**Como:** https://pagespeed.web.dev/?url=https://n8xmarketing.com.br (mobile + desktop). Metas: LCP < 2,5s · INP < 200ms · CLS < 0,1.

### 3. (Opcional) `twitter:site` / `twitter:creator`
Adicionar o handle do X/Twitter da agência (se houver) ao bloco `twitter` para atribuição nos cards. Baixo impacto.

---

## 🥉 Prioridade Baixa — backlog / estratégico

### 4. CSP (Content-Security-Policy)
Único header de segurança faltando (85 → 100). Já é **dívida consciente** documentada em [`docs/adr/0004-defer-csp.md`](../adr/0004-defer-csp.md) — exige nonce-middleware por causa do JSON-LD inline. Manter no radar; entregar como mudança própria com teste.

### 5. Cadência editorial (maior alavanca orgânica)
A estrutura está pronta (schema Article completo, hreflang, sitemap com 177 URLs, autor-pessoa). O ganho de tráfego orgânico agora vem de **publicar com regularidade** em `/informations`, mirando cauda longa local: "agência de marketing Santos", "social media Baixada Santista", "tráfego pago Santos", etc.

---

## Resumo

| Prioridade | Itens | Esforço | Impacto |
|-----------|-------|---------|---------|
| ✅ Feito | Restaurar OG/Twitter image (regressão) — PR #67 | — | Alto (social/GEO/CTR) |
| 🥈 Média | Medir CWV · twitter:site | Minutos | Médio |
| 🥉 Baixa | CSP · cadência de conteúdo | Variado | Médio (conteúdo) |

**Veredito:** Excelente evolução desde 24/06 — quase todo o plano anterior entregue. Com a regressão de Open Graph corrigida (item #1, PR #67), o site está no nível ~95/100. O foco agora deixa de ser técnico e passa a ser **conteúdo e autoridade**.
