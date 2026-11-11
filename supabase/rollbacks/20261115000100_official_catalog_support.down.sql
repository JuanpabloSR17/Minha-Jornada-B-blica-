-- Reversão MANUAL do suporte ao catálogo oficial (não é aplicada automaticamente).
-- Não apaga inventários nem itens: posse obtida por alias ("alias:<id>") continua com o usuário.
-- Colunas de metadados (representation, meaning, referent, holy_subtype, shop_*) e
-- item_unlock_rules.is_active são mantidas: são dados de catálogo inofensivos, e removê-las
-- reativaria regras antigas do rascunho.
drop function if exists public.get_reading_progress();
drop function if exists private.apply_item_aliases();
drop table if exists public.cosmetic_item_aliases;
alter table public.cosmetic_items drop constraint if exists cosmetic_items_holy_not_for_sale;
-- private.resolve_item_id é usada por public.equip_item: depois de removê-la, reaplique
-- private.evaluate_rewards, private.validate_equipment e public.equip_item de
-- 20261114000100_rarities_and_triggers.sql (versões sem aliases).
drop function if exists private.resolve_item_id(text) cascade;
