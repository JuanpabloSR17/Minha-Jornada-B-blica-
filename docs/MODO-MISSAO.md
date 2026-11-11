# Modo Missão de leitura

## Fluxo do jogador

1. **Ler** (aba): escolhe o livro (66, com progresso), o capítulo (concluídos marcados) e o modo.
   - **Bíblia física**: disponível. O app mostra o capítulo e o cronômetro; a pessoa lê no próprio exemplar.
   - **Bíblia digital**: aparece desativada. **Não existe leitor nem texto bíblico licenciado no projeto.**
     O servidor já aceita `mode = 'digital'` para quando o leitor existir.
2. **Missão em andamento** (`/reading/mission`): cronômetro de tempo ativo, Pausar/Retomar,
   Finalizar (com confirmação) e Abandonar.
3. **Recompensa** (`/reading/completed`): confirmação do servidor, releitura ou não, tempo, XP,
   progresso do livro e da Bíblia, missões especiais concluídas e os itens **efetivamente concedidos**,
   com Equipar agora, Ver no inventário e Próximo capítulo.

## Cronômetro e sessão

- A sessão fica no aparelho (AsyncStorage, por conta) e é gravada **antes** de cada mudança na tela.
- O tempo é calculado por marcas de tempo (`accumulatedMs` + `runningSince`): continua certo depois de
  bloquear a tela, sair do app ou reabri-lo. Só **pausar** interrompe a contagem — na leitura física a
  pessoa lê com a tela bloqueada.
- Ao confirmar, o tempo congela. **Não há tempo mínimo**: a conclusão segue a confirmação do jogador.
  O servidor limita o tempo informado ao tempo decorrido desde o início (+60 s) e guarda o valor original.
- Uma missão por vez por conta.

## Finalização e falhas de conexão

- O ID da sessão é um UUID gerado no aparelho e é a **chave de idempotência** no servidor.
- Se a conexão cair (antes de chegar ao servidor ou depois de ele registrar), a sessão fica
  **pendente** no aparelho, sobrevive a fechar o app e pode ser reenviada. O servidor devolve o mesmo
  resultado com `duplicate = true`, sem duplicar capítulo, XP ou itens.
- Finalizações simultâneas do mesmo usuário são serializadas (mesma trava do motor de recompensas).

## Servidor — `public.complete_reading_mission`

1. Valida livro/capítulo (catálogo canônico), modo, início e limite anti-abuso
   (`economy_rules.max_missions_per_10min`, hoje 60).
2. Capítulo inédito → `CHAPTER_COMPLETED` com origem `chapter:BOOK.N` pelo motor existente;
   releitura → origem `mission:<sessão>` (não conta de novo, não repete recompensas).
3. Último capítulo que faltava → `BOOK_COMPLETED` (histórico); o Lendário vem da regra `book_completed`, uma vez.
4. Missões e marcos curados vinculados ao capítulo (`reward_triggers.book_code/chapter`) →
   `MISSION_COMPLETED` / `MILESTONE_REACHED`, uma vez por jogador.
5. XP em `xp_ledger` (chave única). Resultado salvo em `reading_sessions.result`.

`public.get_mission_overview()` devolve progresso, XP total, capítulos concluídos por livro e as missões curadas.

## Regras de produto pendentes

| Assunto | Situação |
|---|---|
| XP | **Não havia regra.** `xp_new_chapter = 10` e `xp_reread = 0` são provisórios, em `economy_rules` (muda sem código). |
| Siclos | **Não implementado**: não há regra de valores. A especificação só diz que Siclos vêm de metas e missões curadas, não de cliques em capítulos. |
| Meta diária → Siclos + escolha gratuita de um Comum | Depende da regra acima e da definição do baú de escolha (22 Comuns estão em `mission_pool`). |
| 17 Raros "missão especial ou loja" | Só o Manto do Profeta tem missão curada. Os outros 17 precisam da definição das missões. |
| 22 Santos | Regra vigente: só por marco curado validado pelo servidor. **Nenhum marco está cadastrado** — falta o conteúdo das missões curadas. O mecanismo já funciona (testado com marco de teste). |
| Leitor digital | Falta texto bíblico licenciado. |
| Mundos (`WORLD_COMPLETED`) | Sem mapa de mundos definido. |

## Manto do Profeta → Manto da Sucessão → Coleção dos Profetas

- Condição oficial (catálogo v2): `missao_especial_ou_loja`, referência 1 Reis 19:19.
- Catálogo v6: missão curada `missao_manto_do_profeta` ("Missão especial: o chamado de Eliseu"),
  concluída ao finalizar uma missão de **1 Reis 19**; regra do item = `mission_completed`.
- Jogador novo (testado no banco e no navegador): missão de 1 Reis 19 → Manto do Profeta;
  2 Reis 2 → Manto da Sucessão (mesmo se lido antes: fica pendente e é liberado depois);
  livro de Isaías completo → Rolo de Isaías + Lendário de Isaías; com os três, a Coleção dos Profetas
  concede o Manto de Elias — Edição dos Profetas. **Nenhuma condição depende de conteúdo ausente.**
