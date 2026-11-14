# Lote 1 de avatares 2.5D semirrealistas — camadas e âncoras para a pintura

**Para:** quem vai pintar as camadas finais (Codex ou ilustração).
**Escopo:** uma combinação jogável no **corpo B (Atlético)**, com troca de cajado.
**Referência de acabamento:** os dois viajantes pintados anexados pelo usuário (volume pintado no rosto,
cabelo e roupa, caimento e materiais convincentes). O cenário ilustrado do acampamento está em
`origin/codex/acampamento-cinematografico` (f2eb61f); o avatar entra por cima dele.

Lista legível por máquina: [`lote-1.json`](lote-1.json). Moldes de cada camada (2048×3072, transparentes,
na mesma árvore de pastas dos arquivos finais): [`lote-1/moldes/`](lote-1/moldes/). Molde completo com
âncoras: [`lote-1/molde-corpo-b-cajado.png`](lote-1/molde-corpo-b-cajado.png). Folha com todas as
camadas: [`lote-1/folha-de-camadas.png`](lote-1/folha-de-camadas.png).

## 1. O que já está no app

O pipeline já recebe essas camadas e foi verificado no guarda-roupa e no acampamento
(`FLOW=avatar-lote1 bash e2e/run.sh`). Os arquivos atuais em `assets/avatars/` são **camadas de teste**:
o desenho vetorial exportado e passado por uma pintura procedural (`scripts/paint-pass.py`). Para entregar a
pintura final, **substitua os arquivos com o mesmo nome e caminho** e rode `npm run assets`. Nada mais muda.

## 2. Formato

| Item | Regra |
|---|---|
| Canvas | **2048×3072 (`@2x`) e 1024×1536 (base), os dois obrigatórios neste lote** — o acampamento mostra o personagem com ~1100 px reais |
| Formato | WebP com alfa (PNG aceito), fundo transparente, peça já posicionada no canvas inteiro |
| Caminho | `assets/avatars/{categoria}/{id}/{body-b|all}/{camada}[.staff][.mask|.shade][@2x].webp` |
| `.mask` | só a forma, em cor chapada clara (`#F0F0F0`); o app tinge com a cor da conta (pele ou cabelo). A cor pintada é ignorada, só o alfa conta |
| `.shade` | sombras e luzes translúcidas **sem cor de base**: preto translúcido para sombra, branco translúcido para luz, por cima da máscara |
| `.staff` | variante de pose: braço direito dobrado segurando o cajado (só `arms`, `hands`, `sleeves`, `cloak_front`) |
| Luz pintada | **neutra**, principal do alto à esquerda, preenchimento suave. Não pinte o azul da noite nem o laranja da fogueira: o app aplica a luz de cada tela sobre a silhueta |
| Contorno | discreto, marrom quente escuro, mais fino que o atual; o volume vem da pintura |

Validação automática (`npm run assets`): tamanho, alfa, caminho, camada, corpo, id do catálogo, `.mask`
só em pele/cabelo e em `hand_item`, `.staff` só nas camadas de pose.

## 3. Espaço de pintura e âncoras (corpo B, canvas 1024×1536; no `@2x` multiplique por 2)

A pintura fica no **espaço final do corpo**. A cabeça já está na proporção adulta (~7 cabeças).

| Ponto | Repouso (esq. / dir. do observador) | Pose do cajado (braço direito) |
|---|---|---|
| Topo da cabeça | y 216 | — |
| Queixo | y 391 | — |
| Olhos | (485, 310) e (539, 310) | — |
| Boca | (512, 362) | — |
| Meia-largura da cabeça | ~63 | — |
| Ombros | (382, 476) e (642, 476) | (642, 476) |
| Cotovelos | (354, 690) e (670, 690) | **(690, 704)** |
| Pulsos | (365, 884) e (659, 884) | **(658, 566)** |
| Punho fechado no cajado | — | **y 496 a 572, centro x 664** |
| Haste do cajado | — | **x 664**, do gancho (topo y 236; gancho até x ~762) ao chão (y 1456) |
| Quadris | (457, 792) e (567, 792) | — |
| Joelhos | (460, 1078) e (564, 1078) | — |
| Tornozelos | (465, 1386) e (559, 1386) | — |
| Chão (sola) | y 1450 | — |
| Barra da túnica de linho | y 1120 | — |
| Alça da bolsa | do ombro direito (626, 452), curva sobre o peito, até (457, 840) | — |
| Bolsa | centro (437, 896), ~120 × 122, repousando no quadril esquerdo | — |
| Drapeado do manto | do ombro esquerdo (346, 448) até o quadril direito (615, 900); broche em (380, 468) | — |
| Costas do manto | barra em y ~1400, meia-largura na barra ~286 | — |

## 4. As 23 camadas (ordem de pintura = ordem de sobreposição, de trás para frente)

Camadas marcadas com **(par)** são dois arquivos: `.mask` + `.shade`. As misturas (`mixed`) são a parte
que não é pele em `.webp` e a parte que é pele em `.shade`.

| # | Arquivo(s) em `assets/avatars/` | Tipo | O que pintar e como encaixa |
|---|---|---|---|
| 1 | `back/cloak-night/body-b/cloak_back` | base | Costas do manto de lã roxo até a canela, atrás do corpo inteiro; dobras verticais, barra bordada dourada |
| 2 | `hair/hair-short/all/back_hair` **(par)** | mask | Volume de trás do cabelo curto, atrás da cabeça |
| 3 | `body/base/body-b/body` **(par)** | mask | Cabeça, orelhas, pescoço, tronco e pernas em pele; volume do rosto pintado na `.shade` |
| 4 | `body/base/body-b/face.shade` (+ `face`) | mixed | Nariz, maçãs do rosto, sombra sob o queixo, só como sombreamento sobre a pele |
| 5 | `eyes/eyes-almond/all/face` + `face.shade` | mixed | Olhos (íris, brilho, cílios) em cor; pálpebras e olheiras como `.shade` |
| 6 | `brows/brows-soft/all/face` **(par)** | mask | Sobrancelhas (tinta do cabelo) |
| 7 | `feet/sandals-leather/body-b/feet` | base | Sandálias de couro sobre os pés do corpo; tiras cruzadas, sola com espessura |
| 8 | `outfit/tunic-linen/body-b/upper_outfit` | base | Túnica de linho cru até y 1120, trama visível, bordado turquesa na gola e na barra; sem mangas |
| 9 | `back/cloak-night/body-b/chest` | base | Drapeado do manto: cai do ombro esquerdo, cruza o peito até o quadril direito, **por baixo dos braços**; broche de bronze |
| 10 | `waist/common_bolsa_do_viajante/body-b/chest` | base | Alça a tiracolo **por cima** do drapeado e da túnica, acompanhando o volume do peito, com sombra suave na roupa e fivela |
| 11 | `waist/common_bolsa_do_viajante/body-b/waist` | base | Bolsa de couro gasto no quadril esquerdo, por baixo do braço; sombra de contato na túnica |
| 12 | `body/base/body-b/arms` **(par)** | mask | Braços relaxados, sem mãos |
| 13 | `body/base/body-b/arms.staff` **(par)** | mask | Braço esquerdo relaxado; direito com cotovelo para fora (690, 704) e antebraço subindo até (658, 566) |
| 14 | `outfit/tunic-linen/body-b/sleeves` | base | Mangas três-quartos, braços relaxados |
| 15 | `outfit/tunic-linen/body-b/sleeves.staff` | base | Manga esquerda igual à 14; manga direita acompanhando o braço dobrado (braço + meio antebraço) |
| 16 | `hands/staff-shepherd/body-b/cloak_front.staff` | base | Haste do cajado de pastor em x 664, gancho acima da cabeça, madeira com veios e desgaste; **abaixo** da mão |
| 17 | `hands/common_cajado_de_caminhada/body-b/cloak_front.staff` | base | Cajado de caminhada reto, topo y ~262, tira de couro abaixo do topo — **peça da troca** |
| 18 | `body/base/body-b/hands` **(par)** | mask | As duas mãos relaxadas nos pulsos |
| 19 | `body/base/body-b/hands.staff` **(par)** | mask | **Só a mão esquerda** (a direita está na camada 22/23) |
| 20 | `expression/expr-smile/all/mouth.shade` (+ `mouth`) | mixed | Boca sorrindo. Lábios em cor translúcida (alfa 40–60%), para servir a todos os tons de pele |
| 21 | `hair/hair-short/all/front_hair` **(par)** | mask | Franja e mechas da frente |
| 22 | `hands/staff-shepherd/body-b/hand_item` **(par)** | skinmask | Mão direita fechada envolvendo a haste: dedos dobrados à frente com nós visíveis, polegar por cima; a haste aparece acima e abaixo do punho |
| 23 | `hands/common_cajado_de_caminhada/body-b/hand_item` **(par)** | skinmask | A mesma mão, na haste do cajado de caminhada |

Total: 35 arquivos base + 35 `@2x`.

## 5. Regras de encaixe que a pintura precisa respeitar

- Peças que tocam o corpo seguem o contorno do **molde da própria camada**. Pode passar 4–8 px da borda
  para o caimento do tecido, mas não pode descobrir pele que o molde cobre.
- **Mão no cajado:** a haste (16/17) não pode ter interrupção onde fica o punho. A mão (20/21) cobre a
  haste entre y 496 e 572 e deixa a madeira visível acima e abaixo.
- **Bolsa:** a alça (10) termina por baixo da bolsa (11). A bolsa fica abaixo da camada dos braços
  (12/13), então o braço esquerdo pode passar à frente dela.
- **Manto:** o drapeado (9) fica abaixo dos braços. As costas (1) não podem aparecer entre as pernas
  abaixo da barra da túnica além do que o molde mostra.
- **Pose:** com o cajado equipado, o app usa só `arms.staff`, `hands.staff` e `sleeves.staff`. Se faltar
  uma delas, essa camada volta para o vetor (fica visível como diferença de acabamento).
- **Tingimento:** nunca pinte a cor da pele ou do cabelo dentro de `.mask`. Todo o volume vai na `.shade`.

## 6. Verificado com as camadas de teste

Capturas em [`lote-1/capturas/`](lote-1/capturas/):
[lado a lado](lote-1/capturas/lote1-lado-a-lado.png) (guarda-roupa, acampamento com o Cajado de Pastor,
depois da troca, e no acampamento ilustrado do Codex numa integração local) e
[gravação da troca](lote-1/capturas/lote1-troca-de-cajado.mp4).

- Conta comum com corpo B, Tom 4 e cabelo curto preto: as camadas tingem com a cor da conta.
- Guarda-roupa (luz neutra) e acampamento (noite + fogueira só na silhueta) usam as mesmas 13 camadas da
  combinação, incluindo as variantes `.staff`; nenhuma camada de repouso de braço, mão ou manga carrega
  com o cajado equipado.
- Troca do Cajado de Pastor pelo Cajado de Caminhada no guarda-roupa: o Início muda e, depois de
  reabrir o app, mostra o mesmo visual pixel a pixel.
- 320 e 412 px sem rolagem lateral; corpos A e C continuam com a arte vetorial.

## 7. Como entregar e verificar

A direção aprovada é o personagem **ilustrado** (a prova 3D foi arquivada, ver `docs/MODELO-3D.md`). A arte
final vem das ilustrações pintadas. As camadas atuais servem de molde e de opção provisória para o que ainda
não foi pintado.

1. Pinte sobre o molde da camada (`lote-1/moldes/…@2x.webp`, mesma árvore de pastas) e salve com o **mesmo
   caminho** em uma pasta de entrega, nas duas resoluções (`@2x` 2048×3072 e base 1024×1536). Pode entregar uma
   peça por vez, por exemplo só `outfit/tunic-linen/body-b/upper_outfit` e `@2x`.
2. Rode `npm run art:intake -- <pasta-da-entrega>` (ou `bash scripts/art-intake.sh <pasta>`). O comando:
   - copia as camadas para `assets/avatars/`, substituindo uma a uma;
   - valida e registra (`npm run assets`);
   - atualiza [`lote-1/ESTADO.md`](lote-1/ESTADO.md): pintura entregue × teste procedural × faltando, pelo hash
     registrado em `assets/avatars/ORIGEM.json`;
   - roda os testes de encaixe e o percurso no navegador: guarda-roupa, acampamento, troca de cajado, reabrir,
     320 e 412 px;
   - gera em `lote-1/capturas-entrega/`:
     - a comparação **referência vetorial × pintura**, no guarda-roupa e no acampamento;
     - o **antes × depois** das telas;
     - o vídeo da troca.
3. Combinações sem pintura (outros corpos, outras peças) continuam com a camada vetorial correspondente.

Só a validação: `npm run assets` · só o estado: `npm run art:status` · moldes de outras peças, corpos ou poses
(app com `EXPO_PUBLIC_AVATAR_LAB=1`): `node scripts/export-avatar-layers.cjs docs/arte-lotes/lote-1.json <pasta>`.

## 8. Entregas recebidas

### Entrega 1 — Manto Noturno e bolsa (Codex, `Jornada_Biblica_Lote_2D_Pintado.zip`)

| Arquivo (`assets/avatars/…`) | SHA-256 | Encaixe |
|---|---|---|
| `back/cloak-night/body-b/cloak_back` (+`@2x`) | ✔ confere | costas do manto entre x 224–798 e y 425–1415, como o molde |
| `back/cloak-night/body-b/chest` (+`@2x`) | ✔ confere | drapeado com broche do ombro esquerdo ao quadril direito, atrás do braço |
| `waist/common_bolsa_do_viajante/body-b/waist` (+`@2x`) | ✔ confere | bolsa no quadril esquerdo (centro ~ 440, 894); a alça atual chega até ela |

Verificação (`npm run art:intake`):
- validação do pipeline e 30 testes de encaixe passaram;
- o percurso no navegador passou: guarda-roupa com luz neutra, acampamento, troca do Cajado de Pastor pelo de Caminhada com reabertura, pose do cajado e repouso, 320 e 412 px;
- comparação e antes × depois em [`lote-1/capturas-entrega/`](lote-1/capturas-entrega/).

[`ESTADO.md`](lote-1/ESTADO.md): 6 de 70 arquivos com pintura entregue.

**Névoa de alfa: corrigida (`Jornada_Biblica_Lote_2D_Alfa_Corrigido.zip`).**
- **O problema:** na primeira exportação, 69–99% do canvas das versões 1024×1536 tinha alfa entre 1 e 15, preto. Isso deixava uma borda reta no palco do guarda-roupa: o céu caía de 219,3 para 216,3 de luminância onde começava o canvas.
- **A reexportação:** o Codex reexportou só as três WebP base, com alfa sem perdas. As três `@2x` são byte a byte iguais às já aplicadas.
- **Integridade:** o novo `SHA256SUMS.txt` confere para os seis sprites.
- **Transparência:** fundo aberto com alfa 0 em 70–99% do canvas; pixels de alfa 1–15 só junto às bordas (0,03–0,18%); bordas suaves (16–239) iguais às da primeira entrega.
- **`art:intake`:** "alfa: sem névoa residual"; validação, testes de encaixe e percurso no guarda-roupa e no acampamento passaram.
- **Palco do guarda-roupa:** céu contínuo, 219,3 dentro e fora do canvas.

### Entrega 2 — Túnica de Linho e cabelo curto (Codex, `Jornada_Biblica_Tunica_e_Cabelo_2D.zip`)

14 WebP sem perdas com alfa, aplicados por `scripts/art-intake.sh` a partir de `assets/avatars` da pasta extraída.

| Arquivo (`assets/avatars/…`, base + `@2x`) | SHA-256 | Encaixe |
|---|---|---|
| `outfit/tunic-linen/body-b/upper_outfit` | ✔ confere | corpo da túnica em x 343–680, y 422–1148, como o molde |
| `outfit/tunic-linen/body-b/sleeves` | ✔ confere | mangas em repouso, caindo ao lado do corpo até a altura do punho |
| `outfit/tunic-linen/body-b/sleeves.staff` | ✔ confere | manga direita dobrada no cotovelo (690, 704) até o punho (658, 566), fechando sob a mão no cajado; até x 791 |
| `hair/hair-short/all/back_hair.mask` + `.shade` | ✔ confere | nuca atrás da cabeça |
| `hair/hair-short/all/front_hair.mask` + `.shade` | ✔ confere | cabelo curto em x 442–581, y 196–328, sobre a testa sem cobrir os olhos |

**Integridade e alfa:**
- `SHA256SUMS.txt` confere para os 14 arquivos, antes e depois de copiados.
- Fundo com alfa 0; alfa 1–15 só junto às bordas (≤ 0,06% do canvas). `art:intake`: "alfa: sem névoa residual".
- As máscaras do cabelo são quase brancas e opacas, então recebem a cor da conta.
- As sombras são escuras e translúcidas (alfa médio 78–91, máximo 224), como pede a §2.

**Verificação:**
- `art:intake`: validação do pipeline, `tsc` e 30 testes de encaixe passaram.
- Jest, rodado à parte: 13 suítes, 108 testes passaram.
- Percurso `FLOW=avatar-lote1`, com conta simulada (José, corpo B, Tom 4, Curto, Preto), passou por inteiro:
  - **Pose do cajado:** com o Cajado de Pastor, guarda-roupa e acampamento carregam `sleeves.staff` e nenhuma camada de repouso.
  - **Repouso, em 412 e em 320 px:** tirar o cajado e salvar não deixa item de mão no banco. Guarda-roupa e acampamento passam a carregar `sleeves` e `arms.mask` de repouso, sem `sleeves.staff`. Continua igual após reabrir. Não há rolagem lateral.
  - **Cajado de volta:** equipar o Cajado de Pastor de novo, salvar e reabrir restaura `sleeves.staff` no guarda-roupa e no acampamento.
  - **Cor do cabelo:** preto e loiro usam as mesmas `front_hair.mask` e `back_hair.shade`. A luminância média na área do cabelo pintado foi 72 com preto e 169 com loiro.
  - **Troca de cajado:** a troca gravada e a reabertura continuam passando (`sameLook`).
- Capturas em [`lote-1/capturas-entrega/`](lote-1/capturas-entrega/):
  - `l1-06`/`l1-07`: sem cajado, em 412 e 320 px.
  - `l1-04`/`l1-05`: com cajado, em 320 px.
  - `l1-08-cabelo-preto` e `l1-08-cabelo-loiro`.
  - Comparações e antes × depois.

[`ESTADO.md`](lote-1/ESTADO.md): 20 de 70 arquivos com pintura entregue.

Pele, feições (olhos, sobrancelhas, boca, sombras do rosto) e mãos continuam nas camadas atuais até o próximo
lote pintado.

### Entrega 3 — Mãos do corpo Atlético (Codex, `Jornada_Biblica_Maos_2D.zip`)

16 WebP sem perdas com alfa (8 camadas, base + `@2x`), aplicados por `scripts/art-intake.sh` a partir de `assets/avatars` da pasta extraída.

| Variante | Arquivos (`assets/avatars/…`, `.mask` + `.shade`) | SHA-256 | Encaixe |
|---|---|---|---|
| Duas mãos em repouso | `body/base/body-b/hands` | ✔ confere | x 336–689, y 868–945: as duas mãos abaixo das mangas em repouso |
| Mão relaxada (pose do cajado) | `body/base/body-b/hands.staff` | ✔ confere | x 336–402, y 868–945: só a mão esquerda, ao lado da bolsa |
| Mão fechada no Cajado de Pastor | `hands/staff-shepherd/body-b/hand_item` | ✔ confere | x 632–702, y 492–574: punho na âncora do cajado, fechando a manga dobrada |
| Mão fechada no Cajado de Caminhada | `hands/common_cajado_de_caminhada/body-b/hand_item` | ✔ confere | mesma pintura, byte a byte, e a mesma âncora |

**Integridade e alfa:**
- `SHA256SUMS.txt` confere para os 16 WebP e o `LEIA-ME.md`.
- As caixas das camadas coincidem com as atuais com diferença de até 2 px.
- As máscaras são quase brancas e opacas (alfa médio 245–248), então recebem o tom da conta.
- As sombras são escuras e translúcidas (alfa médio 54–61).
- `art:intake`: "alfa: sem névoa residual".

**Verificação:**
- `art:intake`: validação do pipeline e 30 testes de encaixe passaram.
- **Duas poses, em 412 e 320 px, após salvar e reabrir (guarda-roupa e acampamento):** o percurso `FLOW=avatar-lote1` agora confere também as mãos pintadas.
  - Com o cajado, carregam `hands.staff` e `hand_item`, e não `hands`.
  - Sem o cajado, carrega `hands` em repouso, sem `hands.staff` nem `hand_item`.
- **Troca de cajado:** do Pastor para o de Caminhada, o Início muda, carrega o `hand_item` pintado do novo cajado e fica igual após reabrir (gravado).
- **Troca de tom de pele, em luz neutra, nas três poses** (Cajado de Pastor, Cajado de Caminhada, repouso):

  | Mão | Tom 1 | Tom 6 |
  |---|---:|---:|
  | Fechada (os dois cajados) | 182 | 60 |
  | Relaxada | 181 | 57 |
  | Em repouso, direita | 188 | 61 |

  Os números são a luminância média na área da mão. As mesmas máscaras recebem os dois tons. Nos dois cajados, a mão fechada tem a mesma luminância.
- Capturas em [`lote-1/capturas-entrega/`](lote-1/capturas-entrega/):
  - `l1-09-maos-{cajado,caminhada,repouso}-skin-{1,6}`;
  - `l1-06`/`l1-07`: sem cajado, em 412 e 320 px;
  - comparações e antes × depois.

[`ESTADO.md`](lote-1/ESTADO.md): 36 de 70 arquivos com pintura entregue.

As feições (rosto, olhos, sobrancelhas, boca) e o restante da pele (`body.mask`/`.shade`) seguem nas camadas atuais
até a próxima entrega.

### Próximo pedido: feições e pele (corpo B)

| # | Arquivos | Tipo |
|---|---|---|
| 1 | `body/base/body-b/body.mask` + `body.shade` | pele (máscara chapada + sombreamento) |
| 2 | `body/base/body-b/face.shade` | nariz, maçãs, sombra do queixo |
| 3 | `eyes/eyes-almond/all/face` + `face.shade` | olhos (cor) + pálpebras (sombreamento) |
| 4 | `brows/brows-soft/all/face.mask` + `face.shade` | sobrancelhas (tinta do cabelo) |
| 5 | `expression/expr-smile/all/mouth.shade` (+ `mouth` opcional) | boca; lábios translúcidos |
| 6 | ~~`hair/hair-short/all/…`~~ | ✔ recebido na entrega 2 |
| 7 | ~~`body/base/body-b/hands…`~~ | ✔ recebido na entrega 3 |
| 8 | ~~`hands/…/body-b/hand_item…`~~ | ✔ recebido na entrega 3 |
| 9 | ~~`outfit/tunic-linen/body-b/…`~~ | ✔ recebido na entrega 2 |

Cada arquivo vai em duas resoluções, `@2x` e base. Os moldes de cada camada estão em `lote-1/moldes/`, com o
mesmo caminho.

## 9. Próximos lotes (sugestão)

1. Lote 2: corpos A e C da mesma combinação (as mesmas 23 camadas, por corpo; cabelo, olhos, boca e
   sobrancelhas em `all/` já servem).
2. Lote 3: as outras peças de viagem já encaixadas — Cinto com Bolsa, Manto de Viagem, Turbante de Areia
   (`headwear` + `back_item`), Lenço de Cabeça e Pano de Cabeça (`headwear` + `back_item`), e o cabelo sob a
   cobertura (`back_item`) para curto, cacheado e longo ondulado.
3. Lote 4: os outros 9 estilos de cabelo, olhos, sobrancelhas, expressões e barbas.
4. Depois: as 158 peças equipáveis ainda sem arte vestida, por slot e por prioridade de loja e capítulos.
