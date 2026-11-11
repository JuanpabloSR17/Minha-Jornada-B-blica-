-- SOMENTE PARA TESTES LOCAIS: imita o mínimo do ambiente Supabase num Postgres puro
-- (papéis, schema auth, auth.uid() e privilégios padrão concedidos pelo Supabase).
-- Não aplicar em produção: o Supabase real já fornece tudo isto.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
-- Comportamento padrão do Supabase: tudo novo em public é concedido a estes papéis.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
