-- Corrige la migracion 0043: REVOKE EXECUTE ... FROM anon, authenticated
-- no alcanza si la funcion quedo con GRANT a PUBLIC (el default al crear
-- una funcion en Postgres) — anon/authenticated heredan igual via PUBLIC.
-- Encontrado en cross-check: el advisor de Supabase seguia marcando
-- handle_new_user() como RPC publica despues del "fix" anterior. El
-- trigger de auth.users no depende de este grant (se dispara con los
-- privilegios de quien hace el INSERT, no de anon/authenticated).

revoke execute on function handle_new_user() from public;
