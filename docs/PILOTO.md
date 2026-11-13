# Piloto fechado — preparação, observação e revisão

Commit de referência: o desta entrega (ver `git log`). Roteiro do participante:
[`PILOTO-PARTICIPANTES.md`](PILOTO-PARTICIPANTES.md).

## 1. Ambiente

| Item | Situação |
|---|---|
| Supabase local oficial (CLI + Docker, Postgres 17 do Supabase, Auth, PostgREST, Kong) | ✔ roteiro completo `e2e/supabase-real/run.sh` (ver `VALIDACAO-SUPABASE.md`) |
| Projeto Supabase **hospedado** de testes | ✘ **não configurado** neste ambiente; roteiro pronto em `e2e/supabase-real/run-hosted.sh` |
| App no celular dos participantes | ✘ **não publicado**; precisa de uma das opções da seção 2 |

### O que falta para rodar no projeto hospedado

1. Projeto Supabase de testes dedicado à Jornada Bíblica (nunca produção).
2. Rede do ambiente liberando `api.supabase.com`, `<ref>.supabase.co` e o host do banco (porta 5432 ou o pooler 6543).
3. Segredos no ambiente: `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`,
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DB_URL`, mais `JB_TEST_PROJECT=1` (confirmação).
4. Auth: “Confirm email” desligado no projeto de testes, ou SMTP configurado e contas confirmadas.
   Site URL e redirect URLs apontando para o endereço do app do piloto (seção 2).
5. Rodar: `NODE_PATH=$(npm root -g) bash e2e/supabase-real/run-hosted.sh` — aplica as migrações pendentes
   na ordem (`supabase db push`), cria duas contas comuns, confere catálogo v8 e permissões e roda o
   percurso no navegador. A bateria SQL não roda no hospedado (ela altera dados).

## 2. Como os participantes vão abrir o app

O projeto ainda não tem build de loja nem distribuição interna configurada. Opções:

- **Web no celular (mais simples):** `npx expo export -p web` com `EXPO_PUBLIC_SUPABASE_URL` e
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` do projeto de testes, publicado num endereço HTTPS. É a forma já
  validada pelos testes em 320 e 390 px. Atenção: “fechar o app” no navegador é fechar a aba.
- **App nativo (EAS internal distribution / TestFlight):** exige configurar EAS, ícones e
  credenciais. Necessário se o piloto precisar observar o comportamento real de tela bloqueada e
  retomada do app nativo, que **não foi verificado** (só o web foi).

## 3. Roteiro do participante e o que observar

O piloto leva dois dias: cada meta rende 40 Siclos e o item mais barato custa 80. No dia 1 o
Mercado mostra “Faltam 40 Siclos”, o que é esperado.

| # | Tarefa | O que observar |
|---|---|---|
| 1 | Criar conta, identidade e personagem | Tempo até o Início; dúvidas no criador |
| 2 | Meta pessoal | Entende que mudar a meta depois só vale no dia seguinte? |
| 3 | Leitura com pausa e retomada | Encontra Pausar/Retomar/Finalizar? Entende que a tela bloqueada não pausa? |
| 4 | Recompensa diária | Percebe a animação, escolhe o item, confirma |
| 5 | Encontrar um marco pelo menu da aba Ler | Acha “Ver todos os marcos”? Distingue **leitura comum** de **marco**? |
| 6 | Fechar e reabrir no meio da leitura | Encontra o destaque “Missão em andamento” e o botão Continuar leitura |
| 7 | Meta do dia 2 | — |
| 8 | Compra no Mercado | Entende o preço e o saldo antes de confirmar; reação ao estado pendente, se ocorrer |
| 9 | Item no guarda-roupa | Encontra a categoria certa e o rótulo “Obtido” |

### Estados que costumam gerar dúvida (perguntar e anotar)

- **Leitura comum × marco:** “Você leu este capítulo. Recebeu o Santo? Por quê?” A tela de recompensa da
  leitura comum agora avisa quando o capítulo tem um marco a cumprir, com o botão **Abrir marco**.
- **Marco cumprido × item obtido:** na lista de marcos, “A cumprir · Santos deste marco que você
  possui: 1 de 3” — o jogador entende que já ter um item não cumpre o marco? No Santuário: “Marcos
  cumpridos”, “Santos obtidos” e “x de 13 Santos obtidos” (coleção) são lidos como coisas diferentes?
- **Compra pendente × confirmada:** “Compra aguardando confirmação” só aparece quando o pedido não teve
  resposta; ao reabrir o Mercado, o app verifica sozinho e mostra “Compra confirmada” ou “Compra já
  registrada”. Perguntar se o jogador achou que foi cobrado duas vezes.
- **Releitura:** cumprir um marco relendo não dá XP nem conta para a meta. O jogador espera XP?

## 4. Registro da observação (um por participante)

| Participante | Tarefa | Concluiu sem ajuda? | Onde pediu ajuda (tela e texto) | Estado que gerou dúvida | Citação / observação | Gravidade (alta/média/baixa) |
|---|---|---|---|---|---|---|
| P1 | 1 | | | | | |
| P1 | … | | | | | |

Ao final, consolidar por tarefa: quantos concluíram sem ajuda, dúvidas repetidas e propostas de texto.

## 5. Verificado pela equipe × a observar com participantes

| Etapa | Equipe (testes automatizados e roteiro no Supabase local) | Precisa de participantes |
|---|---|---|
| Criar conta, identidade, personagem, meta | ✔ navegador (fluxo completo) | Compreensão e tempo |
| Leitura com pausa/retomada | ✔ navegador e unitários (tempo ativo) | Uso real com Bíblia física e tela bloqueada no celular |
| Recompensa diária e escolha | ✔ navegador e banco | Percepção da animação e da escolha |
| Marco pelo menu | ✔ navegador em 320 px (resumo, lista, filtros, detalhe) | Se encontram o menu sem ajuda; leitura comum × marco |
| Recuperação após fechar o app | ✔ navegador (recarregar a página) e Supabase local | App nativo de verdade (não verificado) |
| Compra e guarda-roupa | ✔ navegador e Supabase local (inclui pendente e resposta perdida) | Leitura do preço/saldo; reação ao pendente |
| Permissões e isolamento entre contas | ✔ Supabase local | — |
| Projeto hospedado | ✘ não executado | Executar `run-hosted.sh` quando configurado |

## 6. Problemas reproduzidos pela equipe antes do piloto (corrigidos nesta entrega)

1. **Leitura comum de capítulo com marco não mencionava o marco.** Reproduzir: ler Êxodo 16 pela
   escolha de capítulo → a tela dizia só “Nenhum item novo nesta missão.” Agora a tela de recompensa
   e a escolha de capítulo mostram “Este capítulo tem o ‘Marco: …’” com **Abrir marco** e a explicação
   de que a leitura comum não concede Santos.
2. **Compra “aguardando confirmação” e item “Obtido” ao mesmo tempo.** Reproduzir: compra cuja resposta
   se perde → reabrir o Mercado → o aviso pendente continuava enquanto a vitrine já mostrava o item
   como obtido. Agora, ao abrir o Mercado, a compra pendente é verificada sozinha (mesmo ID, sem
   cobrança dupla); se a resposta se perder de novo mas a vitrine já mostrar o item, a tela confirma a
   compra.
3. **Teste frágil** que encontrava um “Obtido” escondido de outra tela montada por baixo (corrigido no teste).
