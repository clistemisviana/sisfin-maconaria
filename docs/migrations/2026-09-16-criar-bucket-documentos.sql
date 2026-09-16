-- Cria o bucket de armazenamento "documentos" que o sistema ja espera existir
-- (usado para: logo da loja, fotos de notas em Saidas da Loja e Saidas do Tronco).
-- Sem isso, todo upload de imagem falha silenciosamente (o app so mostra uma
-- previa local do arquivo, mas nunca salva de verdade -- some ao atualizar a pagina).

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;

-- O sistema acessa o Supabase com a chave publica (anon), sem login proprio,
-- entao as policies de storage.objects precisam liberar essa chave -- mesmo
-- padrao ja usado nas demais tabelas do sistema (sem RLS restritiva).

drop policy if exists "documentos_insert_publico" on storage.objects;
create policy "documentos_insert_publico"
on storage.objects for insert
to public
with check (bucket_id = 'documentos');

drop policy if exists "documentos_select_publico" on storage.objects;
create policy "documentos_select_publico"
on storage.objects for select
to public
using (bucket_id = 'documentos');

drop policy if exists "documentos_update_publico" on storage.objects;
create policy "documentos_update_publico"
on storage.objects for update
to public
using (bucket_id = 'documentos');
