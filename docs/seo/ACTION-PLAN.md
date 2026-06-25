# Plano de Ação SEO — N8X Marketing

**Site:** https://n8xmarketing.com.br · **Nota geral:** 90/100 (Excelente)
**Data:** 25/06/2026

> O site já está em ótimo estado. Nenhuma ação aqui é crítica para indexação ou ranqueamento — são **refinamentos** ordenados por impacto/esforço.

---

## 🥇 Prioridade Alta (rápido, faz hoje)

### 1. Adicionar `og:url` em todas as páginas
**Por quê:** `og:url` está ausente (confirmado no HTML ao vivo). Sem ele, plataformas sociais às vezes erram a URL canônica do compartilhamento. Impacto baixo, esforço mínimo.
**Onde:** [`src/app/[locale]/layout.tsx`](../../src/app/[locale]/layout.tsx) → `generateMetadata`, bloco `openGraph`.
**Como:** o `og:url` deve ser por-rota (igual ao canonical). A forma limpa é incluir `url` no `openGraph` de cada página usando o mesmo valor de `localeAlternates(...).canonical`, ou adicionar um helper. Exemplo mínimo na home/serviços:
```ts
openGraph: { url: localizedUrl(locale, "/services/" + slug) }
```
Como o layout já omite títulos OG para herança por rota, basta as páginas passarem `openGraph.url` (ou centralizar num helper em `lib/seo.ts`).

### 2. Preencher `parentOrganization` (Grupo Vannuchi)
**Por quê:** desambiguação de entidade — ajuda Google/IA a conectar a N8X ao grupo. Já está modelado, só falta dado.
**Onde:** [`src/config/site.ts`](../../src/config/site.ts) → `parentOrganization`.
**Como:** descomentar e preencher `url` (site do Grupo) e `sameAs` (Google Business / LinkedIn do Grupo):
```ts
parentOrganization: {
  name: "Grupo Vannuchi Engenharia",
  url: "https://...",
  sameAs: ["https://www.linkedin.com/company/...", "https://g.page/..."],
},
```

---

## 🥈 Prioridade Média (esta semana)

### 3. Enriquecer `ArticleJsonLd` com datas e imagem
**Por quê:** `datePublished`/`dateModified` são sinais de frescor e elegibilidade a rich results; `image` melhora a aparência na busca/IA.
**Onde:** [`src/components/json-ld.tsx`](../../src/components/json-ld.tsx) → `ArticleJsonLd`, e o call site em `informations/[slug]/page.tsx`.
**Como:** passar `createdAt`/`updatedAt` do registro de `information` e a capa:
```ts
datePublished: String(createdAt), dateModified: String(updatedAt), image: absoluteUrl(cover)
```

### 4. Decidir política de scrapers de IA de treino
**Por quê:** Bytespider, CCBot, Amazonbot, anthropic-ai, Applebot-Extended, FacebookBot hoje herdam `allow`. PerplexityBot/OAI/GPTBot/ClaudeBot trazem **citação com tráfego** (manter). Os de treino puro não retornam tráfego — decisão de negócio.
**Onde:** [`src/app/robots.ts`](../../src/app/robots.ts) → array `aiCrawlers`.
**Como:** se a decisão for bloquear treino, adicionar uma 3ª regra `disallow: "/"` para esses UAs. Se a decisão for manter tudo aberto (estratégia de máxima exposição), **documentar** isso no comentário para não parecer omissão.

### 5. Medir Core Web Vitals reais
**Por quê:** não foi possível medir nesta auditoria (rate limit da API). Confirmar LCP/INP/CLS.
**Como:** rodar https://pagespeed.web.dev/?url=https://n8xmarketing.com.br (mobile e desktop). Metas: LCP < 2,5s · INP < 200ms · CLS < 0,1. A arquitetura (ISR + next/image + gru1) sugere bom desempenho, mas confirme em campo.

---

## 🥉 Prioridade Baixa (backlog / refinamento)

### 6. Byline de autor-pessoa nos artigos
Adicionar autor-pessoa (com página de perfil `ProfilePage`/`Person`) nos artigos de `/informations` reforça E-E-A-T para queries competitivas (padrão dez/2025). Requer campo "autor" no CMS.

### 7. Implementar CSP (Content-Security-Policy)
Único header de segurança faltando (85/100 → 100). Exige nonce-middleware por causa do JSON-LD inline e fontes externas — entregar como mudança própria, com teste. Já está documentado como dívida consciente em `next.config.ts`.

### 8. `llms-full.txt` (opcional, GEO)
Versão expandida do `llms.txt` com conteúdo completo de serviços/cases — pode melhorar a qualidade da citação por LLMs.

### 9. `twitter:site` / `twitter:creator` (opcional)
Adicionar o handle do Twitter/X da agência (se houver) ao `twitter` metadata para atribuição em cards.

### 10. Conteúdo: cadência editorial
O maior ganho de **tráfego orgânico** não é técnico — a base já é excelente. É publicar com regularidade em `/informations` (cauda longa local: "agência de marketing Santos", "social media Baixada Santista", etc.), aproveitando a estrutura de schema/hreflang/sitemap que já existe.

---

## Resumo

| Prioridade | Itens | Esforço | Impacto SEO |
|-----------|-------|---------|-------------|
| 🥇 Alta | og:url, parentOrganization | Minutos | Baixo-médio |
| 🥈 Média | Article dates, política IA, medir CWV | Horas | Médio |
| 🥉 Baixa | autor, CSP, llms-full, twitter, conteúdo | Variado | Médio (conteúdo) a baixo |

**Veredito:** Tecnicamente, o site está pronto para competir. O foco de maior retorno passa a ser **conteúdo e autoridade** (item 10), não correções técnicas.
