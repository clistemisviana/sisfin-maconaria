# SisFinMaçonaria v2 — guia para o Claude Code

Sistema financeiro da Loja Maçônica Filhos da Fé (Natal-RN). **Está em produção e em
uso real todos os dias** — cada alteração vai para o ar assim que sofre `git push`.

## Arquitetura

- **Single-file:** todo o sistema é o `index.html` na raiz (~3.765 linhas: CSS no
  `<head>`, HTML das telas, e um único bloco `<script>` inline a partir da linha ~1401).
- **Sem build, sem bundler, sem framework.** JS vanilla, manipulação de DOM direta.
- **Backend:** Supabase (PostgreSQL). Acesso direto do browser via `@supabase/supabase-js` v2.
- **Libs via CDN** (no `<head>`): Chart.js, SheetJS/XLSX, Supabase JS v2, EmailJS.
- **Hospedagem:** GitHub Pages serve o `index.html` da raiz. Deploy = `git push` na branch `main`.
- **Auth:** não usa Supabase Auth. Tabela própria `usuarios` (perfis `admin` / `tesoureiro` / `viewer`).

Detalhes completos de schema, funções e backlog: `briefing-sisfin-claudecode.md`
(fica só local — está no `.gitignore` porque o repositório é público).

## Convenções de código

- JavaScript vanilla, `'use strict'`. Funções nomeadas e descritivas (ex.: `renderDashLoja`, `registrarEntradaLoja`).
- Estado global no objeto `S` (`S.irmaos`, `S.entradasLoja`, `S.config`, ...).
- Acesso a banco só pelas funções de abstração: `dbLoad`, `dbInsert`, `dbUpdate`, `dbDelete`, `dbUpdateConfig`.
- Cada tela tem uma função `render<Tela>()` que recria o HTML da tabela a partir de `S`.
- Português brasileiro em toda a UI, mensagens e comentários.
- Preservar o estilo denso do arquivo (várias declarações por linha em trechos utilitários).
- Quebras de linha em **LF** (garantido pelo `.gitattributes`).

## Fluxo de trabalho

1. Alinhar a melhoria (mockup antes de implementar, quando fizer sentido).
2. Editar o `index.html` no ponto certo.
3. `node tools/validate.mjs` — checa sintaxe do JS e sanidade do HTML.
4. `git add -A && git commit -m "..."`.
5. `git push` → o hook `pre-push` roda o validador de novo e, se passar, publica.
   O GitHub Pages atualiza sozinho em ~1 min.

### Migrações de banco

Quando a melhoria mexe no schema do Supabase, **entregar um arquivo `.sql` separado**
em `docs/migrations/` com nome `AAAA-MM-DD-descricao.sql`. O usuário roda no
Supabase SQL Editor **antes** de publicar o HTML que depende dele. Padrão:

```sql
-- O que este SQL faz
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;
```

## Cuidados

- Repositório **público**: nunca commitar segredos, backups com dados dos irmãos, nem o briefing.
- Nada de reformatar o arquivo inteiro — manter os diffs pequenos e revisáveis.
- Supabase no plano free pausa após 7 dias sem acesso; o sistema já tem alerta interno para isso.
