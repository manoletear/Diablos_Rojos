-- Cross-check de seguridad: handle_new_user() (migracion 0039) quedo
-- expuesta como endpoint RPC publico (/rest/v1/rpc/handle_new_user) por
-- ser SECURITY DEFINER en schema public, igual que otras funciones del
-- proyecto. Es trigger-only (usa NEW, que no existe fuera de un trigger) —
-- se le quita el EXECUTE a anon/authenticated para que solo la dispare el
-- trigger, no quien la llame directo por API.

revoke execute on function handle_new_user() from anon, authenticated;
