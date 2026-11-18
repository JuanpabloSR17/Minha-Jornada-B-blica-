-- Reversão manual do vestiário de skins: volta o cartão público à versão anterior e apaga a
-- escolha de skin (as skins obtidas e o avatar salvo não são tocados).
create or replace function public.get_public_avatar(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_target public.profiles;
  v_state jsonb;
begin
  select * into v_target from public.profiles p where p.username = lower(btrim(coalesce(p_username, '')));
  if v_target.id is null then
    return null;
  end if;
  if v_target.id <> v_uid and v_target.privacy_mode <> 'public' then
    return jsonb_build_object('username', v_target.username, 'visible', false);
  end if;
  v_state := private.avatar_state(v_target.id);
  return jsonb_build_object(
    'username', v_target.username,
    'displayName', v_target.display_name,
    'visible', true,
    'isSelf', v_target.id = v_uid,
    'appearance', v_state -> 'appearance',
    'equipment', v_state -> 'equipment'
  );
end;
$$;

drop function if exists public.equip_skin(text, int);
drop function if exists public.get_my_skins();
drop function if exists private.skin_selection(uuid);
drop table if exists public.user_skin_selection;
