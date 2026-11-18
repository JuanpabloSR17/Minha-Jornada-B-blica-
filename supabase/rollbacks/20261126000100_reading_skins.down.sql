-- Reversão manual das skins de leitura: tira o gatilho, as regras e o progresso e devolve o
-- get_my_skins anterior. As skins já concedidas continuam na conta (user_skins não é tocada).
drop trigger if exists domain_events_reading_skins on private.domain_events;
drop function if exists private.on_event_grant_reading_skins();
drop function if exists private.grant_reading_skins(uuid);
drop function if exists private.skin_rule_progress(uuid, jsonb);
drop table if exists public.skin_unlock_rules;

create or replace function public.get_my_skins()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return jsonb_build_object(
    'selected', private.skin_selection(v_uid),
    'owned', coalesce((
      select jsonb_agg(jsonb_build_object('skinId', s.id, 'acquiredAt', u.acquired_at) order by s.sort_order)
        from public.skins s
        left join public.user_skins u on u.skin_id = s.id and u.user_id = v_uid
       where s.is_active and (u.user_id is not null or s.origin = 'inicio')
    ), '[]'::jsonb)
  );
end;
$$;
