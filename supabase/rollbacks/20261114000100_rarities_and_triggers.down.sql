-- Reversão MANUAL do sistema de raridades (não é aplicada automaticamente).
-- Não apaga inventários. Relíquias (slot 'relic') e itens 'holy' continuam cadastrados:
-- antes de reverter, desative-os (is_active = false) se precisar restaurar os CHECKs antigos.
drop function if exists private.require_trigger(text, text);
drop function if exists private.book_chapters_complete(uuid, text);
drop table if exists public.reward_triggers;
drop index if exists public.cosmetic_items_one_legendary_per_book;
alter table public.cosmetic_items drop column if exists book_code;
alter table public.cosmetic_items drop column if exists series;
alter table public.cosmetic_items drop column if exists acquisition;
alter table public.cosmetic_items drop constraint if exists cosmetic_items_rarity_fkey;
-- A tabela public.rarities é mantida (referência inofensiva). Reaplique as definições de
-- private.record_event, private.rule_condition_met, private.validate_equipment e public.equip_item
-- de 20261113000100_marco2_wardrobe.sql.
