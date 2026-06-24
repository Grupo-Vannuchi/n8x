<!--
Título no padrão do board: [ÁREA] - verbo + tarefa
ÁREA: CRE (novo) · IMP (integrar) · UPD (melhorar) · CRX (corrigir) · RMV (remover)
-->

## O que muda
<!-- Resumo curto do que este PR faz e por quê. -->

## Como testar
<!-- Passos pra validar manualmente. -->

## Checklist
- [ ] `npm run typecheck && npm run lint && npm run build` passam
- [ ] Strings novas adicionadas em `pt.json` **e** `en.json`
- [ ] Migração: criada com `prisma migrate dev` (local) — sobe via `migrate deploy`
- [ ] Endpoint público novo tem rate-limit/honeypot + validação `zod`
- [ ] Nenhum segredo no cliente / nos logs
- [ ] Decisão relevante registrada em `docs/adr/` (se aplicável)

## Notas / follow-ups
<!-- Pendências, riscos, ou passos manuais (ex: env var na Vercel, reconectar Google). -->
