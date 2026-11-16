# Repaginação "lobby de jogo": divisão de trabalho com o Codex

Este documento é o combinado para terminar a repaginação a quatro mãos. A base (lobby do Início,
tipografia e ícones) já está no ramo `claude/kind-bell-fuk4e4`. O Codex continua nas telas abaixo e
entrega como nas rodadas anteriores: um ZIP com `.patch` sobre o último commit do ramo, `SHA256SUMS.txt`
e capturas em 320 e 412 px. O Claude confere o SHA-256, aplica sem sobrescrever trabalho paralelo, roda
todas as verificações e registra o commit.

## 1. O que já está pronto (usar, não refazer)

| Peça | Onde | Como usar |
|---|---|---|
| Lobby do Início | `app/(tabs)/home.tsx` | referência de composição: HUD → cenário → painel de jogar → seções |
| HUD do jogador | `src/features/lobby/LobbyHud.tsx` | retrato, nível (só exibição), XP, Siclos, capítulos; cores em `HUD` |
| Trilho de funções | `src/features/lobby/LobbyRail.tsx` | botões de 52 px (46 px em `compact`) com rótulo curto e nome acessível completo |
| Cartão de modo | `src/features/lobby/ModeCard.tsx` | arte do jogo ao fundo, título em Cinzel, uma frase, progresso na cor do modo |
| Doca | `app/(tabs)/_layout.tsx` | medalhão dourado de leitura no centro |
| Nível de exibição | `src/features/lobby/level.ts` | `levelFromXp(xp)`; não concede nada |

### Tipografia

- **Cinzel** (`fonts.display`) só em títulos curtos: nome de tela, nome de mundo, título de cartão, números do HUD. Nunca em parágrafos.
- **Atkinson Hyperlegible Next** em todo o resto, já no peso Medium (`fonts.body`), com SemiBold e Bold.
- O `AppText` escolhe o arquivo pelo `fontWeight`: 600 vira SemiBold e 700 vira Bold. Não use `fontFamily` de sistema.
- Tamanhos: corpo 17/26, rótulo 15/21 em Bold, legenda 14/20, título de seção 18/25 em Bold.
- Linhas de até cerca de 60 caracteres no celular. Parágrafo de ajuda: no máximo 3 linhas, e o resto vai para "Saiba mais".
- Fontes ficam em `assets/fonts/` (OFL), sem `@` no caminho publicado.

### Ícones

- `src/ui/Icon.tsx`, em dois tons: traço de 1,8 mais preenchimento a 22% da mesma cor.
- Referências bíblicas:
  - tenda (Início);
  - rolo de mapa (Jornada);
  - Bíblia aberta (Ler);
  - viajantes (Amigos);
  - viajante de capuz (Perfil);
  - banca (Loja);
  - túnica (Vestiário);
  - coroa de louros (Troféus, Ap 2:10);
  - pedras memoriais (Marcos, 1 Sm 7:12);
  - vaso do maná (missão diária, Êx 16);
  - lâmpada (Modo Missão, Sl 119:105);
  - tabernáculo com a nuvem (Santuário, Êx 40:34);
  - siclo com cálice.
- Folha de revisão: `/dev/avatar-lab?iconset=1`, capturada pelo percurso `lobby`.
- Evite cruz sobre construções do Antigo Testamento (anacrônico) e símbolos de outras religiões.

## 2. Telas para o Codex, em ordem

Cada item vale como uma entrega pequena. Critério comum a todos:
- sem rolagem lateral em 320 e 412 px;
- ação principal visível sem rolar;
- alvos de toque de 44 px ou mais;
- contraste de 4,5:1 ou mais;
- "reduzir movimento" desliga animações não essenciais;
- nenhuma mudança de banco ou de regra de recompensa.

| # | Tela | Direção | Aceite |
|---|---|---|---|
| 1 | Jornada (`src/features/journey/JourneyScreen.tsx`) | "Mapa de campanha": os 7 mundos como fases, com estado (a explorar / em leitura / concluído com medalha), destino sugerido em destaque e cabeçalho com o HUD compacto (Siclos e nível) | alfinete abre o mundo; `journey-pin-*`, `journey-world-*` e `journey-atlas` preservados |
| 2 | Ler (`src/features/reading/screens/MissionHomeScreen.tsx`) | "Seleção de missão": cartão da passagem com a lâmpada, selo de inédito ou releitura, botão grande; livros por mundo como lista de fases com o ícone do mundo | "Iniciar missão: {passagem}" visível sem rolagem em 320 px; `selected-passage` e `read-world-*` preservados |
| 3 | Missão em andamento e conclusão | Cronômetro como HUD de partida; conclusão como tela de vitória (XP, Siclos, meta) antes da bolsa de recompensas | textos "Concluí a leitura", "Missão concluída" e o `role="timer"` preservados |
| 4 | Perfil (`app/(tabs)/profile.tsx`) | "Cartão do herói": retrato grande, nível, barra de XP, estante de conquistas (marcos, Santos, medalhas dos mundos) e atalhos como o trilho do lobby | `profile-achievements`, `profile-medal-*` e "Abrir mapa da Jornada" preservados |
| 5 | Mercado (`src/features/market/MarketScreen.tsx`) | Banca do mercado: saldo em siclo no topo, contagem da vitrine como placa, preço em chip de moeda, "Faltam N Siclos" discreto | `market-{id}`, "Saldo: N Siclos", "Comprar {nome}" e "Pagar N Siclos" preservados |
| 6 | Guarda-roupa e Santuário | Vestiário (personagem em palco, abas como gavetas) e Santuário (vitrines iluminadas) | "Salvar", "Visual salvo.", abas por nome e "Ver no Santuário" preservados |
| 7 | Amigos | Enquanto o social não existe: tela honesta, sem "Marco 4", com uma prévia ilustrada | sem jargão interno de etapas |
| 8 | Configurações, entrada e onboarding | Legibilidade primeiro: corpo em Atkinson, ação dourada, nada de Cinzel em textos longos | fluxos de conta dos percursos continuam iguais |

### Ícones que o Codex pode desenhar no mesmo estilo

Use o formato de `Icon.tsx` (SVG 24 × 24, dois tons, sem texto) para estes pedidos:
- os sete mundos: aliança, coroa, harpa, pergaminho do profeta, peixe, barco de Paulo, cidade nova;
- os ícones de filtro do guarda-roupa;
- o estado "releitura";
- o cronômetro;
- a bolsa de recompensas.

Para miniaturas de itens, o registro por ID continua em `src/features/avatar/art/icons.tsx`.

## 3. Nomes que os testes usam (não mudar sem atualizar o percurso)

| Onde | Nomes acessíveis e textos |
|---|---|
| Início | "Paz, {nome}!", "Começar leitura", "Continuar leitura", "Escolher outro capítulo ou reler", "Alterar meta", o botão "Mercado dos Viajantes" (exato e único), o painel `home-action-panel`, o cenário `camp-hero`, a imagem "Seu personagem no acampamento…", `lobby-hud`, `lobby-rail`, `lobby-siclos`, `mode-*` |
| Abas | "Início", "Jornada", "Ler", "Amigos", "Perfil" (`role="tab"`) |
| Meta diária | "Meta pessoal: N capítulos por dia", "Meta cumprida hoje!", "Recompensa: 40 Siclos · 20 XP de bônus · 1 Comum à escolha" |

Para conferir, rode estes percursos (todos precisam passar):

```
npx tsc --noEmit -p . && npx jest
FLOW=lobby bash e2e/run.sh
FLOW=marco1 bash e2e/run.sh
FLOW=fixes bash e2e/run.sh
FLOW=journey bash e2e/run.sh
FLOW=avatar-lote1 bash e2e/run.sh
```
