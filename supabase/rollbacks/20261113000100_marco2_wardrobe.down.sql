-- Reversão MANUAL do Marco 2 (não é aplicada automaticamente).
-- Remove funções e tabelas novas. NÃO apaga perfis, aparências, inventário nem visuais.
-- Itens do catálogo v3 continuam cadastrados (só perdem as colunas de variante/compatibilidade).
-- Atenção: apaga o histórico de eventos/recompensas e os estados de assinatura.

drop function if exists public.get_wardrobe();
drop function if exists public.save_wardrobe(uuid, jsonb, int, jsonb, int);
drop function if exists public.equip_item(uuid, text, int);
drop function if exists public.unequip_slot(uuid, text, int);
drop function if exists public.create_loadout(text, uuid);
drop function if exists public.rename_loadout(uuid, text);
drop function if exists public.activate_loadout(uuid);
drop function if exists public.delete_loadout(uuid);
drop function if exists public.get_collections();
drop function if exists public.get_public_avatar(text);
drop function if exists public.set_privacy_mode(text);
drop function if exists private.record_event(uuid, text, text, jsonb);
drop function if exists private.evaluate_rewards(uuid, text);
drop function if exists private.rule_condition_met(uuid, public.item_unlock_rules);
drop function if exists private.collection_complete(uuid, text);
drop function if exists private.wardrobe_state(uuid);
drop function if exists private.write_loadout(uuid, uuid, jsonb, int);
drop function if exists private.validate_equipment(uuid, jsonb, text);
drop function if exists private.loadout_is_locked(uuid, uuid);
drop function if exists private.loadout_limit(uuid);
drop function if exists private.is_premium(uuid);

drop table if exists public.reward_events;
drop table if exists private.domain_events;
drop table if exists public.user_entitlements;
drop table if exists public.collection_items;
drop table if exists public.item_collections;
drop table if exists public.bible_books;

alter table public.avatar_loadouts drop column if exists version;
alter table public.cosmetic_items drop column if exists body_compatibility;
alter table public.cosmetic_items drop column if exists variant_label;
alter table public.cosmetic_items drop column if exists variant_of;

-- Depois disso, reaplique a definição original de public.save_avatar
-- (supabase/migrations/20261111000100_marco1_core.sql, seção "save_avatar").
