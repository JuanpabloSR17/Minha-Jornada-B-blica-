-- Permite upsert idempotente das regras de desbloqueio geradas pelo catálogo.
create unique index if not exists item_unlock_rules_item_type_revision
  on public.item_unlock_rules (item_id, rule_type, revision);
