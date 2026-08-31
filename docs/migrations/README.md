# Migrações de banco (Supabase)

Um arquivo `.sql` por alteração de schema, nomeado `AAAA-MM-DD-descricao.sql`.

Fluxo:

1. O `.sql` é criado aqui.
2. Você roda o conteúdo no **Supabase → SQL Editor**.
3. Só depois publica o `index.html` que depende dessa mudança.

Estes arquivos ficam versionados como histórico do schema — o Supabase **não** os executa sozinho.
