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

## Meta diária (v2 — meta pessoal)

### Regra

- A recompensa diária sai quando os **capítulos inéditos do dia** atingem a **meta do dia**:
  meta 1 → 1 capítulo, 2 → 2, 3 → 3, 5 → 5, personalizada → N (1 a 50).
- **Ritmo livre:** o jogador escolhe a **missão do dia** (≥ 1 capítulo) **antes do primeiro capítulo
  inédito do dia** (`set_daily_mission_target`). Sem escolha, o dia não tem recompensa diária (os
  capítulos contam no progresso e no XP). A missão do dia não pode ser trocada depois de escolhida.
- **Recompensa (uma por dia):** 40 Siclos + 20 XP de bônus + escolha de 1 entre até 3 Comuns elegíveis.
- **XP de leitura:** 40 por capítulo inédito; releitura 0. Capítulos além da meta continuam dando XP e
  progresso, sem nova recompensa diária. Lendários, épicos e missões especiais seguem as próprias regras.
- Valores em `economy_rules` (`xp_new_chapter` 40, `xp_reread` 0, `xp_daily_goal_bonus` 20,
  `siclos_daily_goal` 40, `daily_goal_choices` 3).

### Snapshot da meta e mudança de meta

- Cada dia tem um snapshot da meta ativa (`daily_targets`: modo, meta, origem, fuso), criado na
  primeira vez que o dia é usado (primeira missão ou abertura do Início) e nunca mais alterado pela
  preferência.
- Mudar a meta (`set_reading_preferences`) grava uma **mudança pendente** que vale a partir da
  **próxima data civil** do fuso de leitura. Voltar à meta em vigor cancela a pendência. A única
  exceção é a primeira definição (onboarding), que vale na hora.
- Baixar a meta durante o dia não recompensa o dia (o snapshot manda); subir não tira nada.

### Elegibilidade, consistência e escolha

- **Elegíveis:** Comuns ativos com regra ativa `mission_pool` (pool `common`), exceto peças
  iniciais e Premium, que o jogador ainda não possui. Sem elegíveis: Siclos e XP creditados, sem escolha.
- Meta (`daily_goals`, chave usuário+dia), Siclos (`siclos_ledger`, `goal:<dia>`), bônus de XP
  (`xp_ledger`, `DAILY_GOAL_BONUS`/`goal:<dia>`) e opções são gravados na mesma transação da
  finalização, sob a trava do jogador. Reenvio devolve o resultado registrado com o estado atual.
- `claim_daily_goal_item(dia, item)`: só itens apresentados, no máximo um por meta, repetir a mesma
  escolha não concede de novo. A escolha pendente fica no servidor e aparece no Início, na aba Ler,
  na tela de recompensa (com animação de meta cumprida) e em `/reading/goal`, em qualquer aparelho.

### Recompensas da regra anterior (v1)

- Metas concedidas pela v1 (primeiro capítulo inédito do dia) **ficam como estão**
  (`daily_goals.rule_version = 1`, snapshot de auditoria `legacy_v1`): Siclos, item e escolha pendente
  mantidos; **nada é removido nem concedido de novo**.
- Um dia que já tem meta (v1 ou v2) não recebe outra recompensa diária — inclusive o dia da troca de regra.
- XP já registrado a 10 por capítulo não é recalculado; os 40 XP valem para capítulos novos. Metas v1
  não recebem o bônus de 20 XP retroativamente.

### Dia e fuso horário

- **Dia = data civil no fuso de leitura do perfil** (`profiles.time_zone`), padrão **`America/Sao_Paulo`**.
- **O aparelho sugere, o usuário decide:** o fuso do aparelho só é adotado sozinho se o usuário nunca
  definiu um (`time_zone_source = 'default'`). Depois disso, um fuso diferente no aparelho aparece
  como sugestão no Início ("Usar …"), e só muda com a confirmação (`set_time_zone`).
- Trocas de fuso: no máximo uma a cada 24 h. Uma recompensa só pode cair num dia **posterior** ao da
  última recompensa: trocar de fuso não "volta" a um dia sem meta nem gera recompensas retroativas.
- Testado: virada à meia-noite em São Paulo e em Tóquio (os mesmos instantes caem em dias diferentes
  conforme o fuso), meia-noite UTC não vira o dia.

## Regras de produto pendentes

| Assunto | Situação |
|---|---|
| XP | Definido: 40 por capítulo inédito, 0 por releitura, +20 ao cumprir a meta diária (`economy_rules`). |
| Siclos | Só a meta diária credita (40). **Não há onde gastar**: não existe loja. |
| Uso dos Siclos | Mercado dos Viajantes v1 (`docs/MERCADO.md`). |
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
