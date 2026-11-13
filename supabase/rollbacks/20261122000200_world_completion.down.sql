-- Reversão manual da conclusão dos mundos. Preserva os eventos WORLD_COMPLETED já registrados
-- (histórico da conta) e só desativa os gatilhos de conclusão.
drop trigger if exists domain_events_world_completion on private.domain_events;
drop function if exists private.on_chapter_completed_world();
drop function if exists private.check_world_for_book(uuid, text);
drop function if exists private.world_complete(uuid, text);
drop function if exists public.get_world_progress();
update public.reward_triggers set is_active = false where kind = 'world' and id like 'mundo-%';
drop table if exists public.bible_world_books;
drop table if exists public.bible_worlds;
