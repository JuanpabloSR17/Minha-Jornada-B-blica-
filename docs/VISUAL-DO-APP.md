# Novo visual da Jornada Bíblica: especificação completa para o Codex

Este documento descreve o visual e a experiência do app depois da repaginação de 18/11/2026: o jogo só com skins, o lobby de jogo, as páginas dos mundos, o Vestiário, o Perfil como ficha de herói e as Lendárias e Gloriosas conquistadas lendo.

**Situação:** tudo o que está aqui **já está implementado e testado** no branch `claude/kind-bell-fuk4e4` (commits `dc9586b`, `f74ac67` e `bb3ef3c`). Use este documento para três coisas:

1. **Publicar** o piloto a partir deste branch, para o site mostrar o visual novo.
2. **Manter** o visual ao mexer em qualquer tela: as cores, fontes, componentes, rotas e `testID` daqui são o contrato.
3. **Produzir a arte** que falta (§9): as pinturas das skins e as cenas pintadas dos mundos, **sempre no estilo 2.5D que você já usa**.

Documentos irmãos: [`skins/PARA-O-CODEX.md`](./skins/PARA-O-CODEX.md) (skins, loja e monetização) e [`skins/TEMPORADA-1-EXODO.md`](./skins/TEMPORADA-1-EXODO.md) (contrato das pinturas).

---

## 1. Conceito

**"Um lobby de jogo de aventura bíblica, à noite, junto da fogueira."**

- **Imersão de jogo:** o jogador abre o app e está num acampamento, com HUD, trilho de atalhos, botão de jogar e modos de jogo, como num lobby de jogo de celular.
- **Leitura em primeiro lugar:** toda a gamificação aponta para a próxima leitura. O botão principal ("Começar leitura") fica sempre visível sem rolar.
- **Um mundo, um lugar:** cada uma das 7 partes da Bíblia é um mundo com paisagem, paleta e símbolo próprios.
- **Identidade pela skin:** o jogador é visto pela skin que veste (traje, pele e cabelo de um dos 3 estilos), em todas as telas.
- **Conquista pela leitura:** Lendárias e Gloriosas só se ganham lendo. Siclos vêm só da meta diária e compram skins comuns, raras e a épica da semana.

**Tom:** noite azul-violeta, bronze e dourado; brilho violeta só para seleção e XP. Nada de cores de "app de produtividade" e nada de tema claro: **todas as telas usam o tema escuro de jogo** (`CinemaTheme`, aplicado na raiz em `app/_layout.tsx`).

## 2. Tokens

### 2.1 Cores (`src/theme/tokens.ts`, `cinemaColors`)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#0C1124` | Fundo de todas as telas |
| `backgroundAlt` | `#161A33` | Fundo alternativo, áreas pressionadas |
| `surface` | `#1B1631` | Cartões, painéis, tiles |
| `surfaceRaised` | `#251E3D` | Cartão elevado, item selecionado |
| `stage` | `#1E1934` | Fundo atrás do personagem |
| `border` | `#4A3E5E` | Borda comum |
| `borderStrong` | `#C9A24A` | Borda de bronze (destaque) |
| `text` | `#F6ECD6` | Texto principal (pergaminho claro) |
| `textMuted` | `#C9BBA0` | Texto secundário |
| `primary` / `accent` | `#E9BA5B` | Dourado: ações e ícones principais |
| `onPrimary` | `#241606` | Texto sobre dourado |
| `selection` | `#B48CFF` | Violeta: seleção, foco de aba, barra de XP |
| `success` | `#A9D693` | Concluído |
| `danger` | `#F2907E` | Erro, sair da conta, pendente |
| `warning` | `#F2C66C` | Aviso |
| `focus` | `#8FC2FF` | Contorno de foco do teclado |
| `overlay` | `rgba(4,4,14,0.72)` | Fundo de diálogos e da bolsa de recompensas |

Tons "de vidro" das barras e painéis (`GlassPanel`, `ProgressMeter`): `xp` violeta, `reading` ciano, `gold` dourado e `complete` verde-água.

### 2.2 Raridade das skins (`src/features/skins/catalog.ts`)

| Raridade | Rótulo | Cor |
|---|---|---|
| `common` | Comum | `#B9B2A4` |
| `rare` | Rara | `#5FA8FF` |
| `epic` | Épica | `#B48CFF` |
| `legendary` | Lendária | `#F2A93B` |
| `glorious` | Gloriosa | `#FFE7A3` |

A raridade aparece sempre do mesmo jeito: **gema em losango** na cor da raridade + rótulo em Cinzel + **borda do cartão** na mesma cor (opaca se a skin é sua, translúcida se bloqueada).

### 2.3 Tipografia

Duas famílias, ambas no projeto (`assets/fonts`, licença OFL):

- **Cinzel** (inscrição romana): títulos curtos, nomes de skin, nomes de mundo, números de destaque. Nunca em texto corrido.
- **Atkinson Hyperlegible Next**, peso **Medium** como base (traço mais grosso e confortável): todo o resto.

| Variante (`AppText`) | Família | Tamanho / altura |
|---|---|---|
| `display` | Cinzel 700 | 30 / 38 |
| `title` | Cinzel 700 | 22 / 30 |
| `heading` | Atkinson 700 | 18 / 25 |
| `body` | Atkinson 500 | 17 / 26 |
| `label` | Atkinson 700 | 15 / 21 |
| `caption` | Atkinson 500 | 14 / 20 |

O texto acompanha o tamanho de fonte do sistema até 1,6×.

### 2.4 Espaço, raio, toque

- Espaçamento: 4 · 8 · 12 · 16 · 24 · 32 (`spacing.xs` a `xxl`). Margem lateral das telas: 16.
- Raio: 8 · 12 · 18 · 26 · pílula. Cartões grandes usam 18; tiles de skin, 12.
- **Alvo de toque mínimo 44 × 44** (botões de estilo têm 44–46 de altura).
- Funciona de **320 px** de largura (sem rolagem lateral) até desktop.

### 2.5 Ícones (`src/ui/Icon.tsx`)

Desenhados no próprio app, **em dois tons** (traço + preenchimento suave da mesma cor) e com referências bíblicas: tenda (`home`), mapa, livro, rolo (`scroll`), lâmpada de azeite (`lamp`), pedras memoriais (`stones`), vaso do maná (`manna`), tabernáculo, coroa, harpa, cruz, navio, nascer do sol, montanha, medalha, moeda, loja, traje (`outfit`), cadeado e outros. Use sempre um ícone ao lado do rótulo de ações e seções.

## 3. Componentes

### Base (`src/ui`)
- **Button:** variantes `gold` (ação principal: degradê dourado, texto `#2A1606`), `secondary`, `ghost` e `danger`; `compact` para ações secundárias; ícone à esquerda; `testID` opcional.
- **Screen:** área segura + rolagem; nas telas com cena no topo, `edges={['left','right']}` e a cena entra por baixo da barra de status.
- **StepHeader:** voltar + título em Cinzel + barra de etapas (cadastro).
- **Notice**, **Card**, **IconBadge**, **ConfirmDialog**, **TextField**.

### Jogo
| Componente | Onde | O que é |
|---|---|---|
| `LobbyHud` | Início | Retrato do viajante, escudo do nível, barra de XP, Siclos e capítulos |
| `LobbyRail` | Início | Trilho lateral com 4 atalhos em medalhão |
| `CampHero` | Início | Acampamento noturno com a fogueira e o viajante vestido com a skin |
| `ActionPanel` | Início | Painel de jogar: próxima leitura, meta do dia e o botão dourado |
| `ModeCard` | Início | Cartão de modo de jogo com arte |
| `AvatarStage` | Vestiário, Perfil, cadastro | Personagem de corpo inteiro com transição suave |
| `FirelightPortrait` | Tiles, loja, celebração | Busto à luz da fogueira |
| `WorldScene` | Página do mundo | Cena de cada mundo (vetorial hoje; pintura 2.5D em §9.2) |
| `Ring` | Página do mundo | Anel de progresso do mundo |
| `GlassPanel`, `ProgressMeter` | Leitura, meta, resultado | Painéis e barras de vidro |
| `RewardPouch` | Resultado da leitura | Bolsa de couro que se abre e revela XP e Siclos |
| `NewSkinCelebration` | Resultado da leitura | Cartão "Nova skin conquistada!" com "Vestir agora" |
| `TabernacleStage` | Marco de Êxodo 25 | Cena do Tabernáculo com Arca, Mesa e Candelabro |

## 4. Navegação

**Doca inferior** (noite com borda de bronze, 72 px): Início · Jornada · **Ler** (medalhão dourado elevado, o "jogar" do app) · Amigos · Perfil. A aba ativa ganha uma pílula dourada translúcida.

| Rota | Tela |
|---|---|
| `/welcome`, `/auth` | Boas-vindas e entrar/criar conta |
| `/onboarding/identity` → `/onboarding/avatar` → `/onboarding/pace` | Cadastro: nome → **Escolha seu viajante** → ritmo |
| `/(tabs)/home` | Início (lobby no acampamento) |
| `/(tabs)/journey` | Mapa dos 7 mundos |
| `/world/[id]` | **Página do mundo** |
| `/(tabs)/read` | Ler: Modo Missão, livros por mundo, marcos |
| `/reading/mission`, `/reading/completed` | Sessão de leitura e resultado |
| `/reading/milestones`, `/reading/milestone/[id]` | Marcos da Jornada |
| `/reading/trail?trail=ruth|tabernacle` | Trilhas guiadas |
| `/vestiario` | **Vestiário de skins** |
| `/market` | Mercado dos Viajantes (só skins) |
| `/(tabs)/profile` | **Perfil (ficha do herói)** |
| `/users/[username]` | Cartão público |
| `/(tabs)/friends` | Amigos (prévia do cartão) |
| `/settings/pace` | Meta de leitura |

Rotas antigas de peças (`/avatar/wardrobe`, `collections`, `loadouts`, `editor`, `item/[id]`) **redirecionam ao Vestiário**; `/avatar/sanctuary` redireciona aos Marcos. Não recriar essas telas.

## 5. Telas

### 5.1 Cadastro: "Escolha seu viajante" (`SkinPickerScreen`)
- Etapa 2 de 3. Palco com o personagem de corpo inteiro (300 px).
- Nome da skin em Cinzel, centralizado.
- Duas skins iniciais lado a lado (Pastor de ovelhas e Peregrino do Êxodo), cada uma com busto e marca de seleção dourada.
- "Estilo": 3 botões com a bolinha do tom de pele e "Estilo 1/2/3".
- Rodapé fixo: botão dourado **"Começar com esta skin"**. Como visitante (`/try`): "Criar conta para começar".
- Nota: "Você troca de skin quando quiser no Vestiário…".

### 5.2 Início: lobby no acampamento
- **Cena** do acampamento ocupando a altura da tela (mínimo 500 px), com o viajante vestido com a skin.
- **HUD no topo:** retrato e escudo de nível com barra de XP (toque abre o Perfil); à direita, Siclos (abre a loja) e capítulos.
- Saudação "Paz, {nome}!".
- **Trilho lateral à direita:** Loja · Vestiário · Trilhas · Marcos.
- **Painel de jogar na base da cena:** selo "Modo Missão", rolo de pergaminho, "Próxima leitura" com a referência em destaque, a meta de hoje com barra, botão dourado alto (60 px) **"Começar leitura"** e "Escolher outro capítulo ou reler". Se há sessão, mostra o tempo e "Continuar leitura"; se a confirmação está pendente, "Verificar resultado".
- **Abaixo da cena:**
  - "Missão diária" (cartão da meta, com "Alterar meta");
  - **"Conquista ao alcance"** (medalha, "Concluir {livro}", quanto falta);
  - "Modos de jogo" em grade de 2 colunas: Modo Missão, Mapa dos mundos, Marcos da Jornada, Trilhas guiadas.
- O nível é o mesmo em todo o app (`readingLevel`): etapas de 120, 200, 280 XP… com títulos Viajante → Explorador → Cartógrafo → Guardião das Rotas.

### 5.3 Jornada: mapa dos mundos
- Atlas ilustrado com os 7 pinos ligados por uma trilha; um toque seleciona o mundo.
- Cartão "Destino sugerido". Cada mundo aparece como cartão expansível.
- Expandido, mostra primeiro o botão dourado **"Entrar no mundo: {nome}"**, que abre a página do mundo; depois o objetivo, a trilha guiada do mundo e os livros.

### 5.4 Página do mundo (`/world/[id]`, `WorldScreen`)
- **Cena no topo**, de borda a borda (250–340 px, entrando sob a barra de status), com voltar redondo e a etiqueta "Mundo N de 7".
- **Painel sobre a cena** na cor do mundo: emblema (ícone do mundo, ou medalha se concluído), nome em Cinzel, frase do mundo e **anel de progresso** com a porcentagem.
- **3 números:** Capítulos, Livros e Marcos (feito/total).
- Medalha conquistada (com a data) **ou** botão dourado "Continuar: {referência}"; botão da trilha guiada, se houver.
- **Trilha dos livros:** pedras ligadas por um caminho tracejado vertical. Cada livro mostra o estado: medalha (concluído), livro com barra (em leitura) ou bússola (a explorar), e à direita "Ler {ref}". O toque abre a leitura no próximo capítulo.
- **Marcos deste mundo** (cumprido / a cumprir) e **Skins deste mundo**: na Temporada 1, as skins de Êxodo nas Origens; nos outros mundos, "chegam numa próxima temporada".
- Rodapé: passagem-símbolo do mundo.

| Mundo | Céu (topo → horizonte) | Acento | Cena | Passagem-símbolo |
|---|---|---|---|---|
| Origens e Aliança | `#2B1B3D` → `#E0894A` | `#F2B45E` | Sinai com nuvem e relâmpago, coluna de fogo, tendas, palmeira | Êx 13:21 |
| Terra e Reinos | `#1E2A4A` → `#E9B872` | `#D9A3FF` | Aurora, muralhas com torres, templo no alto, oliveiras | Rt 1:16 |
| Poesia e Sabedoria | `#0B1530` → `#2C3F6B` | `#92D6AC` | Noite estrelada, lua, lira em constelação, ciprestes e rio | Sl 19:1 |
| Voz dos Profetas | `#1A0F14` → `#6A2E22` | `#F3A991` | Tempestade, relâmpago, ruínas de zigurate, lâmpada acesa, brasas | Is 40:31 |
| Vida e Ensino de Jesus | `#6FA8D8` → `#F6D9A0` | `#E8C681` | Nascer do sol com raios, mar da Galileia, barco de pesca | Mc 1:17 |
| Caminhos da Igreja | `#183A5C` → `#8CC4E8` | `#9DC6FF` | Mar com ondas, navio a vela, aqueduto romano na costa | At 1:8 |
| Visão da Nova Criação | `#5E3E8C` → `#FFE3B0` | `#F2AACE` | Raios de glória, cidade de luz com portas, rio da vida, árvore da vida | Ap 21:5 |

Fonte: `src/features/worlds/worldThemes.ts` e `WorldScene.tsx`.

### 5.5 Ler, sessão e resultado
- **Ler:** Modo Missão (livro → capítulo), livros agrupados pelos 7 mundos, resumo dos marcos ("Marcos cumpridos: N de 20"), trilha de Rute em destaque.
- **Sessão:** cronômetro, Pausar/Retomar e "Finalizar missão". Pausar e Finalizar ficam visíveis sem rolar, inclusive em 320 px.
- **Resultado:**
  1. a **bolsa de recompensas** abre por cima (XP e Siclos), com "Ir ao resumo" e "Continuar";
  2. depois vem a tela com a referência em `display`, o banner do capítulo/livro e, se a leitura conquistou uma skin, o cartão **"Nova skin conquistada!"** (borda e gema na cor da raridade, busto, "Vestir agora" e "Ver no Vestiário"; aparece uma vez por aparelho);
  3. por fim, a meta do dia, os marcos cumpridos e a próxima leitura.
- **Sem peças:** a escolha de item comum da meta e as listas de itens não aparecem. Os textos falam só de XP, Siclos, marcos e skins.

### 5.6 Marcos da Jornada
- Resumo (marcos cumpridos), filtros Todos / A cumprir / Concluídos e uma lista com bandeira (ou ✓), nome, referência e estado.
- O detalhe mostra a passagem e o botão "Iniciar marco: {ref}". O marco de Êxodo 25 tem a cena do Tabernáculo, sem os selos "Você já possui / Pode receber".

### 5.7 Vestiário (`/vestiario`)
- **Palco** com arco de pedra e luz do alto na cor da raridade da skin em foco, o personagem de corpo inteiro e a etiqueta da raridade.
- Nome em Cinzel, referência bíblica e os **3 estilos** (bolinha do tom de pele + "Estilo N").
- **Ação:**
  - skin sua: "Vestir o estilo N" (dourado) ou "Vestindo agora" (desativado);
  - skin bloqueada: caixa com cadeado e "Ainda não é sua" + como conseguir, com o botão "Loja" se ela aparece na loja;
  - **skin de leitura:** "Conquiste lendo" + a regra (ex.: "Concluir o livro de Êxodo") + **barra de progresso "39 de 40"**.
- Filtros **Minhas (n)** e **Todas (26)**. Grade por raridade (Gloriosa → Comum) com tiles de 100 px: busto, gema, ✓ dourado na vestida, cadeado e transparência nas bloqueadas, barrinha de progresso nas de leitura.

### 5.8 Mercado dos Viajantes (só skins)
- Banner com o saldo e o cartão "Preço justo, contado em dias de leitura": Comum 4 dias (160), Rara 10 (400), Épica 25 (1.000).
- Contagem para a próxima vitrine (21h de Brasília).
- Seções: **Épica da semana** (cartão grande; grátis no dia de presente), **Raras do dia** e **Comuns do dia**.
- Cada cartão traz busto, os 3 estilos, preço com "≈ N dias de leitura" e a ação: Comprar, Resgatar grátis, Obtida ou Faltam N Siclos.
- Compra com confirmação, à prova de queda de conexão.

### 5.9 Perfil: ficha do herói
- **Topo:** a arte do acampamento escurecida em degradê. À esquerda, o personagem de corpo inteiro com a skin (250 px). À direita:
  - **losango dourado com o nível**, "Nível N" e o título em Cinzel;
  - nome grande em Cinzel e @usuário;
  - barra de XP violeta e "Faltam N XP para o próximo nível";
  - etiqueta com a skin vestida, na cor da raridade.
- **4 botões em medalhão** (grade 2 × 2): Vestiário (n de 26 skins) · Loja (saldo) · Mundos (n de 7 medalhas) · Marcos (n de 20 cumpridos).
- **4 números:** Capítulos lidos · Livros (n/66) · XP · Mundos (n/7).
- **Próxima conquista:** cartão com borda dourada, barra e "ler {ref}". O toque abre a leitura.
- **Medalhas dos mundos:** 7 discos com o ícone do mundo, coloridos se conquistados (com ✓), apagados se não. Cada um abre a página do mundo.
- **Suas skins:** bustos das skins da conta (a vestida com borda mais grossa) + um tile tracejado que leva à loja.
- **Marcos recentes** e **Conta e ajustes** em lista com ícone e seta: Meta de leitura, Privacidade (toque alterna privado/público), Ver perfil público e **Sair da conta** (vermelho, com confirmação).

### 5.10 Cartão público e Amigos
- O cartão público mostra **só** nome, @usuário e a skin vestida. Nunca e-mail nem histórico. Perfil privado mostra "Este perfil é privado".
- Amigos: "Prévia do seu cartão" e o aviso de que o social está em desenvolvimento.

## 6. Skins na interface

- **Hoje:** o viajante é desenhado pelo `AvatarRenderer` com o estilo da skin (pele e cabelo de `season1.json`) e o **traje provisório** do `preview` (peças do catálogo antigo, só como desenho).
- **Quando a pintura chegar** (`assets/skins/<id>/estilo-N/corpo.webp`, no contrato de `TEMPORADA-1-EXODO.md`), ela substitui esse desenho no palco do Vestiário, no acampamento, no Perfil, na loja e na celebração, nas mesmas coordenadas e âncoras.
- **Estilo da pintura: o mesmo 2.5D pintado dos personagens já entregues** (§9.1).

## 7. Movimento e acessibilidade

- **Movimento reduzido:** quando o sistema pede menos movimento, a fogueira, a bolsa de recompensas e as transições do personagem ficam estáticas, com o mesmo conteúdo. Os testes conferem isso.
- Todo botão e tile tem `accessibilityLabel` completo. Exemplos: "Pastor de ovelhas, Comum, bloqueada"; "Mundos. 1 de 7 medalhas"; "Privacidade (toque para alternar): Perfil privado".
- Seletores de estilo são `radio` com `aria-checked`; filtros são `tab` com `aria-selected`; barras são `progressbar` com valor.
- Contraste: texto `#F6ECD6` sobre `#0C1124`–`#1B1631`; o dourado é só para ação e destaque, nunca para parágrafos longos.
- Nenhuma tela pode ter rolagem lateral em 320 px.

## 8. Contrato técnico (não quebrar)

- **Servidor:**
  - `get_my_skins()` devolve `selected`, `owned` (com `source`) e `reading` (regra e progresso);
  - `equip_skin(skin, estilo)`;
  - `get_skin_market()` e `purchase_skin(...)`;
  - `get_public_avatar(user)` traz `skin`.
  
  As Lendárias e Gloriosas são concedidas pelo servidor (`skin_unlock_rules`, gatilho em `private.domain_events`). O app **nunca** concede skin.
- **Chave `ITEMS_VISIBLE = false`** em `src/config/features.ts`: as peças continuam no banco, mas fora da interface.
- **`testID` usados pelos testes:**
  - Início: `lobby-hud`, `lobby-rail`, `lobby-siclos`, `home-action-panel`, `camp-hero`, `camp-next-objective`, `mode-*`;
  - Vestiário: `vestiario-stage`, `vestiario-<skin>`, `vestiario-locked`, `vestiario-progress`;
  - Mundo: `world-hero-<id>`, `world-book-<LIVRO>`, `world-medal`;
  - Jornada: `journey-enter-<id>`, `journey-pin-<id>`;
  - Perfil: `profile-hero`, `profile-achievements`, `profile-act-vestiario`, `profile-medal-<id>`, `profile-next-objective`;
  - Loja: `market-<skin>`, `market-fair`;
  - Resultado: `new-skin-<skin>`, `reveal-overlay`, `receipt-*`;
  - Marco: `tabernacle-stage`.
- **Textos:** todos em `src/i18n/pt-BR.ts`, nos blocos `vestiario`, `skinPicker`, `world`, `lobby`, `profile` e `market`.

## 9. O que pedimos a você (arte)

### 9.1 Skins: Lote A primeiro
`comum_peregrino_exodo`, `raro_levita` e `lendario_moises`, nos 3 estilos, no contrato de `TEMPORADA-1-EXODO.md`.

**Estilo obrigatório: o 2.5D pintado que você já usa nos personagens.** Pintura semirrealista de RPG, volume e luz pintados, materiais com textura, contorno suave e proporção adulta.
- Sem vetor chapado, pixel art, anime, cartum, 3D renderizado ou os estilos de teste.
- Mesma luz neutra nas pinturas base.
- Todas as pinturas devem parecer da mesma mão.

### 9.2 Cenas pintadas dos 7 mundos (substituem as vetoriais)
As cenas atuais são vetoriais e servem de **guia de composição**: elementos, paleta e posição estão na tabela de §5.4 e em `WorldScene.tsx`. Pinte uma por mundo **no mesmo 2.5D**, como as artes do acampamento (`assets/journey/camp-night.webp`) e do Mercado.

- **Arquivo:** `assets/worlds/<id>.webp`, **1600 × 960**, WebP qualidade ≥ 85, até 350 KB.
- **Composição:** o assunto principal no **terço superior e no centro**. Os **40% de baixo** ficam mais calmos e escuros, porque o painel do mundo fica por cima. Corte seguro: a cena é recortada pelas laterais em telas estreitas (até 3:4), então deixe o essencial na faixa central de 60%.
- **Paleta:** céu e acento da tabela. Sem texto, sem pessoas em destaque e sem representar Deus ou anjos.
- **Entrega:** como nas rodadas anteriores, um ZIP com `SHA256SUMS.txt`. Eu troco o `WorldScene` pela imagem (com a vetorial como reserva) e rodo o percurso de capturas.

### 9.3 Molduras de raridade (opcional, depois)
Molduras pintadas 2.5D para os tiles de skin (256 × 256, centro transparente) nas 5 raridades, com as cores de §2.2.

## 10. Como conferir

```bash
npx tsc --noEmit -p . && npx jest                     # tipos e 133 testes unitários
bash supabase/tests/run-local.sh                       # 562 verificações SQL (concorrência e reversões)
FLOW=marco1 bash e2e/run.sh                            # cadastro por skin → Vestiário → leitura → loja → perfil público
FLOW=journey bash e2e/run.sh                           # acampamento, marco de Êxodo 25, mundos, Lendárias lendo, movimento reduzido
FLOW=lobby bash e2e/run.sh && FLOW=fixes bash e2e/run.sh
FLOW=tour bash e2e/run.sh                              # capturas de todas as telas em 320 e 412 px
bash e2e/supabase-real/run.sh                          # Supabase local oficial (RLS e RPCs reais)
```

**Critérios de aceite de qualquer mudança visual:**
- tema escuro em todas as telas;
- "Começar leitura" visível sem rolar no Início (320 e 412 px);
- nenhuma rolagem lateral em 320 px;
- movimento reduzido respeitado;
- todos os fluxos acima passando.
