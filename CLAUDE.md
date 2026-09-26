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

## Testes

- `node tools/validate.mjs` — sintaxe do `index.html` (roda sozinho no `pre-push`).
- `node tools/test-relatorios.mjs` — confere o motor de relatórios contra o dado real do
  banco (API REST, sem login). Rodar sempre que mexer em `rel*` ou nas categorias.

## Configurar uma máquina nova

1. Instalar Git for Windows, Node 20+ e o app Claude (desktop/Code); entrar na mesma conta.
2. `git config --global user.name "Clistemis Viana"` e `git config --global user.email "clistemis.viana@gmail.com"`.
3. Clonar **fora do OneDrive** (git e OneDrive brigam): `git clone https://github.com/clistemisviana/sisfin-maconaria.git`
4. Dentro da pasta, rodar **uma vez** (config local do git não vem no clone):
   `git config core.hooksPath .githooks` e `git config core.autocrlf false` e `git config core.longpaths true`
5. Copiar `briefing-sisfin-claudecode.md` (fica fora do repo) para a raiz da pasta.
6. No primeiro `git push` o Git Credential Manager abre o navegador para login no GitHub (só uma vez).
7. Memória do Claude: abrir a pasta no Claude Code uma vez e copiar os arquivos de memória
   (`MEMORY.md`, `workflow-deploy.md`) para a pasta `memory` do projeto novo, ou pedir ao Claude
   "salve estas memórias" colando o conteúdo.
8. Rodar `node tools/test-relatorios.mjs` para confirmar que tudo funciona.
9. EmailJS: as chaves ficam no `localStorage` do navegador — na máquina/navegador novo,
   preencher de novo em Configurações → Envio de Comprovantes por E-mail.

Sempre `git pull` antes de começar a editar e `git push` ao terminar, para as duas máquinas
ficarem em sincronia.

## Cuidados

- Repositório **público**: nunca commitar segredos, backups com dados dos irmãos, nem o briefing.
- Nada de reformatar o arquivo inteiro — manter os diffs pequenos e revisáveis.
- Supabase no plano free pausa após 7 dias sem acesso; o sistema já tem alerta interno para isso.

