-- Executado em paralelo por run-local.sh: o mesmo capítulo concluído em duas requisições simultâneas.
select pg_sleep(0.2);
select private.record_event('a7777777-0000-0000-0000-000000000007', 'CHAPTER_COMPLETED', 'chapter:GEN.37', '{"book":"GEN","chapter":37}');
