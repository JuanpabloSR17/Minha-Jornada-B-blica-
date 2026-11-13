# Protótipo jogável — RPG cinematográfico (Êxodo 25)

Percurso: **Início no acampamento → marco de Êxodo 25 → leitura → revelação → Santuário**, dentro do app,
com os dados e as regras reais da conta. Capturas e gravações em [`prototipo-exodo25/`](prototipo-exodo25/).

## 1. Direção visual aplicada

| Elemento | Decisão |
|---|---|
| Paleta | `cinemaColors` (`src/theme/tokens.ts`): céu azul-noite `#0C1124`, tecido roxo `#3E2C63`/`#4E2A74`, pedra `#4A3C30`, bronze `#7A5418`, dourado `#E9BA5B`/`#F7D98A`, texto creme `#F6ECD6` |
| Tema | `CinemaTheme` força a paleta noturna nas telas da jornada (Início, marco, leitura, recompensa, Santuário) em qualquer tema do aparelho; as demais telas mantêm o tema claro/escuro |
| Títulos | Cinzel em placas com moldura dourada (`Plaque`); corpo do texto em fonte do sistema para legibilidade |
| Ação principal | `Button variant="gold"` (relevo dourado, mesmo nome acessível dos botões antigos) |
| Barra de abas | noite + bronze + dourado em todo o app |

## 2. Camadas (cenário, avatar, artefatos e luz)

Tudo em `react-native-svg`, cada camada um componente próprio, com o mesmo `viewBox` e
`preserveAspectRatio="xMidYMid slice"`, para se sobrepor alinhada em qualquer largura:

- `src/features/journey/art/scenes.tsx` — `CampBackdrop` (céu, estrelas, lua, falésias, tendas, chão),
  `CampFlames` e `CampFireGlow` (animáveis), `TabernacleBackdrop`, `SanctuaryHall`, `Pedestal`, `GoldRays`.
- `src/features/journey/art/artifacts.tsx` — Arca, Mesa dos Pães (12 pães em duas pilhas) e Candelabro
  (sete lâmpadas), com estados `owned` / `grantable` / `locked` e halo separado. A mesma arte serve ao
  marco, à revelação, ao Santuário e à miniatura do inventário.
- `CampHero`: cenário → chamas (laço de escala/opacidade) → **personagem real** (`AvatarRenderer`
  com o visual em uso, recorte `camp`, respiração de ±1,5 px aplicada ao conjunto inteiro, então as
  camadas do avatar nunca se desalinham) → luz da fogueira por cima (mesmo laço das chamas) → vinheta.
- Movimento: `useAmbient` (laço) e `Animated` com driver nativo fora da web. Com **reduzir movimento**,
  os valores ficam fixos no meio do ciclo: a cena é a mesma, só que estática (verificado por pixels).

## 3. Avatar e peças vestidas

O acampamento e o guarda-roupa leem o **mesmo** visual em uso do servidor (`useMyAvatar` / `getWardrobe`),
então trocar uma peça e voltar ao Início mostra a mudança, também depois de reabrir o app.

### Peças novas (arte vestida + miniatura separada)

| Peça (id) | Camadas de encaixe | Ajuste por corpo |
|---|---|---|
| Bolsa do Viajante (`common_bolsa_do_viajante`) | alça em `chest` (cruza a túnica e o manto drapeado, do ombro ao quadril oposto) + bolsa em `waist` (repousa no quadril, sob o braço) | `dx/dy.body-c`, `dx.body-a` |
| Cinto com Bolsa (`belt-pouch`) | `waist` (cinto acompanha `tunicHalfWidthAt`) | `dy.body-c` |
| Cajado de Pastor (`staff-shepherd`), Cajado de Caminhada (`common_cajado_de_caminhada`) | haste em `cloak_front` (abaixo da mão) + dedos fechados em `hand_item` (acima da haste) → **a mão envolve o cajado** | âncora do pulso de cada corpo |
| Manto Noturno (`cloak-night`), Manto de Viagem (`common_manto_de_viagem`) | costas em `cloak_back` + drapeado dianteiro em `chest`, **abaixo dos braços** → o manto passa atrás do braço; broche no ombro | `dy.body-c` |
| Turbante de Areia (`headwrap-sand`) | `headwear` + cabelo ajustado em `back_item` | — |
| Lenço de Cabeça (`headscarf-ochre`), Pano de Cabeça (`common_pano_de_cabeca`) | frente em `headwear` (abertura do rosto, franja na cor do cabelo) + caimento em `back_item` | ombros por corpo |

- **Cabelo sob cobertura:** a entrada do manifest declara `hides: ['front_hair', 'back_hair']` e a camada
  `gear.underhair` desenha só o que aparece sob o tecido, conforme o estilo (curto → costeletas;
  cacheado → volume na nuca; longo ondulado → mechas nos ombros) e na cor do jogador.
- **Ajustes por perfil de corpo:** parâmetros `dx.<corpo>` / `dy.<corpo>` na própria peça
  (`ManifestEntry.params`), além das âncoras procedurais de `anchors()` (ombro, cotovelo, pulso, quadril,
  joelho, tornozelo) e `HEAD`/`FACE` (cabeça).
- **Miniatura × arte vestida:** `src/features/avatar/art/icons.tsx` desenha a peça inteira, isolada, para o
  inventário; os artefatos usam a própria arte. `ItemIcon` prefere a miniatura quando existe.
- Grade de encaixe (3 corpos × 3 cabelos, com e sem cobertura): `/dev/avatar-lab?fit=1`
  ([captura](prototipo-exodo25/j-encaixe-3-corpos.png)).

### Cobertura do protótipo

- **Corpos:** os três perfis (`body-a` Esguio, `body-b` Atlético, `body-c` Robusto).
- **Cabelos com arte:** curto, cacheado e longo ondulado (os outros 9 estilos usam a arte padrão).
- **Peças com arte vestida:** 4 túnicas, 4 mantos, 2 calçados, 2 de cintura, 3 de cabeça, 2 de mão.

### O que falta para levar o mesmo acabamento ao restante do catálogo

1. **Pose ¾ de corpo inteiro: não produzida.** Este ambiente não tem gerador de imagens, e o
   desenho procedural em vetor só sustenta a pose frontal de repouso. O acampamento usa um
   **enquadramento mais próximo** (`CROPS.camp`, da cabeça à canela) da pose atual. Para a pose ¾ da
   prancha, é preciso ilustrar:
   - um molde por corpo (3);
   - rostos e expressões;
   - 12 cabelos, em frente e trás;
   - as peças vestidas, cada uma com um novo mapa de âncoras ¾ (ombro próximo/distante, mão do
     cajado, quadril da bolsa).

   O pipeline de PNG/WebP (`npm run assets`, `docs/ARTE.md`) já aceita essas camadas por corpo.
2. **Peças sem arte vestida:** 158 itens equipáveis. Por slot:

   | Slot | Itens sem arte |
   |---|---|
   | mão | 54 |
   | cintura | 18 |
   | manto | 16 |
   | fundos | 14 |
   | túnica | 10 |
   | emblema | 10 |
   | moldura | 10 |
   | calçado | 9 |
   | cabeça | 5 |
   | pescoço | 5 |
   | peitoral | 3 |
   | costas | 2 |
   | efeito | 2 |

   Elas continuam visíveis com a apresentação existente ("Arte em produção").
3. **Cabelos sem arte:** raspado, repartido, crespo volumoso, ondulado médio, longo liso, tranças, coque,
   rabo de cavalo e dreadlocks. Cada estilo precisa da variante "sob cobertura".
4. **Coberturas rígidas:** o Turbante do Sacerdote e as coroas precisam de máscara de cabelo própria.
5. **Outros marcos dos Santos:** só o de Êxodo 25 tem cena ilustrada. Os outros 19 mostram a lista de
   itens e precisam de uma cena e das artes dos seus Santos.
6. **Telas ainda no tema antigo:** Mercado, Jornada, Amigos, Perfil, guarda-roupa e criador ainda não usam a
   paleta da jornada nem as placas.

## 4. Regras preservadas

- A leitura comum de Êxodo 25 segue as recompensas habituais, sem Santos e sem revelação
  (verificado no banco).
- Os Santos só vêm da sessão vinculada ao marco escolhido.
- A revelação só abre depois da confirmação do servidor e mostra apenas `result.granted`. Com a Mesa
  já obtida, aparecem só a Arca e o Candelabro, e a tela informa "Já estava no seu Santuário: Mesa…".
- Se a resposta se perde, o Início mostra "Aguardando o servidor" com **Verificar resultado**. O
  reenvio usa o mesmo ID de sessão, sem duplicar itens, e a revelação acontece quando o resultado chega.
- A revelação é marcada como vista no aparelho (`revealed`) e não se repete ao reabrir a recompensa.
- Santuário: "Marcos cumpridos" (registro), "Santos obtidos" (posse) e o progresso de cada coleção
  continuam separados.

## 5. Verificação

`FLOW=journey bash e2e/run.sh` (banco real + navegador, 320 px e 412 px):

1. Dois personagens diferentes (corpo, tom e cabelo) com túnica, manto, bolsa, cajado, sandálias e
   cobertura de cabeça: o equipamento confere entre o guarda-roupa e o acampamento.
2. A ação principal fica visível sem rolagem e não há rolagem lateral.
3. Troca do cajado no guarda-roupa: o Início muda e, após reabrir, fica igual pixel a pixel (gravado).
4. Marco com a Mesa já obtida:
   - estados na cena e Iniciar visível sem rolagem;
   - pausa, reabertura com **Continuar leitura** priorizado no Início, e retomada;
   - perda da resposta → **Verificar resultado** → revelação só de 2 itens, sem duplicar no banco;
   - Pular animação.
5. Santuário: os três artefatos obtidos, os contadores (1 de 20, 3 de 22, coleção 3 de 13) e o toque que
   mostra passagem e significado.
6. A leitura comum de Êxodo 25 não concede Santos.
7. A revelação completa é gravada em 412 px.
8. Movimento reduzido: revelação e acampamento estáticos (comparação de pixels).
