# Direção de arte e especificação de assets — Personagens

Versão do manifest: **2** (`src/features/avatar/art/manifest.ts`).

## 1. Direção aprovada

Opção B: **personagens 2D ilustrados em estilo RPG de aventura**.

- Proporção humana estilizada: **~5,6 cabeças** de altura (nunca chibi).
- Rostos expressivos: pálpebras, íris com brilho, nariz e lábios desenhados.
- Cabelo com volume e mechas; tecidos com dobras, bordados, costuras e barras onduladas.
- Contorno fino em tom quente escuro (nunca preto puro) e sombreamento suave de volume.
- Paleta terrosa com acentos em turquesa, índigo, verde-oliva e dourado.
- Inspiração histórica bíblica, com liberdade artística respeitosa. Itens são **simbólicos**,
  não relíquias, e não dão poder nem vantagem.

### Referência de acabamento

A referência enviada (viajante de cabelo crespo, túnica ocre com bordado turquesa, lenço,
calça verde e sandálias) é **pintada à mão em aquarela/guache**. Esse acabamento (texturas de
pigmento, bordas suaves e variação de tinta) **não é reproduzível por desenho em código**.

### O que existe hoje (e o que não existe)

| Item | Situação |
|---|---|
| Pipeline de camadas (canvas, âncoras, ordem, tingimento, PNG/WebP) | **Pronto e testado** |
| Criador de personagem de RPG (palco grande, zoom de câmera, categorias, carrossel, transição) | **Pronto e testado** |
| Conjunto de validação em vetor detalhado (3 corpos, 3 cabelos, 3 túnicas + Túnica de José, 2 mantos, 2 calçados, rostos) | **Protótipo de encaixe e direção**: serve para validar proporção, silhueta, encaixe e experiência |
| Validador e registro automático de PNG/WebP, política de variantes, moldes de alinhamento, prompts | **Pronto e testado** (testado com um PNG real rasterizado: encaixe exato) |
| Ilustração final pintada no nível da referência | **Pendente: precisa de ferramenta de geração de imagem + tratamento** (lista na seção 6). Este ambiente não tem gerador de imagens |
| Itens bíblicos novos (Sandálias do Deserto, Funda de Davi, Manto de Elias etc.) | **Sem arte**: aparecem com substituto marcado "Arte em produção" até serem ilustrados |

Quando os PNG/WebP finais chegarem em `assets/avatars/`, `npm run assets` os registra e eles
substituem a arte vetorial camada a camada, **sem mudar** o renderizador, o criador, o banco ou as regras.

## 2. Canvas de referência

| Propriedade | Valor |
|---|---|
| Canvas lógico | **1024 × 1536** (2:3), origem no canto superior esquerdo |
| Exportação recomendada | 2048 × 3072 (2×) em **WebP com alfa** (PNG aceito) |
| Eixo central | x = 512 |
| Topo da cabeça | y = 148 |
| Queixo | y = 390 (cabeça = 242 u) |
| Linha do chão (sola) | y = 1450 |
| Olhos | y = 278, x = 512 ± 37 |
| Boca | y = 350 |
| Fundo | separado do personagem; pode exceder o canvas nas laterais |

Todo asset é exportado **no canvas inteiro**, já posicionado, com o resto transparente.
Assim o encaixe é exato, sem offsets por peça.

## 3. Modelos de corpo e âncoras

As três silhuetas são diferentes de propósito (não é o mesmo boneco com outra cor).
As âncoras (x relativo ao centro, y absoluto) vêm de `anchors()` em `art/geometry.ts`:

| Corpo | Ombro | Cotovelo | Pulso | Quadril | Joelho | Tornozelo |
|---|---|---|---|---|---|---|
| body-a (Esguio) | ±98, 476 | ±126, 690 | ±131, 884 | ±50, 792 | ±48, 1078 | ±43, 1386 |
| body-b (Atlético) | ±130, 476 | ±158, 690 | ±147, 884 | ±55, 792 | ±52, 1078 | ±47, 1386 |
| body-c (Robusto) | ±126, 476 | ±182, 690 | ±192, 884 | ±75, 792 | ±70, 1078 | ±62, 1386 |

Peças que tocam o corpo (túnicas, mangas, mantos, calçados) precisam de **uma versão por corpo**.
Cabelos, rostos e barbas usam a mesma cabeça nos três corpos e têm uma versão só.

Para ver as âncoras sobre as artes: rota interna `/dev/avatar-lab` → "Mostrar guias de ancoragem"
(disponível em desenvolvimento ou com `EXPO_PUBLIC_AVATAR_LAB=1`).

## 4. Camadas e ordem de sobreposição

```
background → shadow → cloak_back → back_hair → body → face → lower_outfit → feet →
upper_outfit → waist → arms → sleeves → cloak_front → hands → neck → beard → mouth →
front_hair → headwear → face_accessory → hand_item → special_fx → frame
```

Regras importantes:
- **Manto** tem duas camadas: `cloak_back` (atrás do corpo) e `cloak_front` (sobre os ombros).
- **Cabelo** tem duas camadas: `back_hair` (atrás da cabeça e dos ombros) e `front_hair` (franja/mechas).
- **Braços** ficam acima da túnica e abaixo das mangas; as **mãos** são uma camada própria acima do
  manto dianteiro (as mãos "saem" do manto).
- Acessórios de cabeça podem esconder camadas (`hides` no catálogo), ex.: turbante esconde `front_hair`.

## 5. Nomenclatura dos arquivos

> **Lotes de arte 2.5D:** a relação exata de camadas, arquivos e âncoras de cada lote está em
> [`docs/arte-lotes/`](arte-lotes/) (lote 1: [`LOTE-1.md`](arte-lotes/LOTE-1.md)). A cabeça é pintada já na
> proporção adulta (topo y 216, queixo y 391 no corpo); as âncoras do corpo continuam as da seção 3.
> Variante de pose: `{camada}.staff` (braço direito segurando o cajado) para `arms`, `hands`, `sleeves` e
> `cloak_front`. Camadas de encaixe das peças de viagem: `chest` (alça, drapeado), `back_item` (cabelo sob
> cobertura, caimento do lenço) e `hand_item` (mão fechada no cajado, com `.mask` de pele).

```
assets/avatars/{categoria}/{assetId}/{corpo|all}/{camada}.webp
```

Exemplos:

```
assets/avatars/body/base/body-b/body.webp          (máscara de pele, tingível)
assets/avatars/body/base/body-b/body_shading.webp  (sombras/luzes sobre a pele)
assets/avatars/hair/hair-curly/all/back_hair.webp  (máscara de cabelo, tingível)
assets/avatars/hair/hair-curly/all/back_hair_shading.webp
assets/avatars/outfit/tunic-joseph/body-a/upper_outfit.webp
assets/avatars/outfit/tunic-joseph/body-a/sleeves.webp
assets/avatars/back/cloak-desert/body-c/cloak_back.webp
assets/avatars/back/cloak-desert/body-c/cloak_front.webp
assets/avatars/feet/boots-travel/body-b/feet.webp
```

O `assetId` é o mesmo ID do catálogo (`src/features/avatar/catalog/catalog.json`) e do banco.

### Cores de pele e cabelo (tingimento)

Para não exportar cada peça em 6 tons de pele × 8 cores de cabelo:
1. **Máscara** em cor chapada clara (forma da pele/cabelo), registrada com `tint: 'skin'` ou `tint: 'hair'`.
2. **Sombreamento** em camada separada (sombras/luzes translúcidas, sem cor de base), por cima.

O `AvatarRenderer` aplica a cor do catálogo sobre a máscara (`tintColor`). Olhos, lábios e detalhes
pintados ficam na camada de sombreamento ou numa camada própria sem tingimento.

### Registro automático e validação

Não se registra imagem à mão. Coloque os arquivos em `assets/avatars/` e rode:

```bash
npm run assets         # valida e gera src/features/avatar/art/imageAssets.generated.ts
npm run assets:check   # (CI) falha se o registro estiver desatualizado ou houver arquivo inválido
```

O validador recusa: tamanho diferente de 1024×1536 (ou 2048×3072 no `@2x`), ausência de canal alfa,
caminho fora do padrão, camada desconhecida, corpo desconhecido, ID que não existe no catálogo e
`.mask` fora de pele/cabelo. O `@2x` é escolhido automaticamente pelo empacotador em telas densas.

### Política de variantes por corpo

Para cada camada, o renderer usa, nesta ordem:

1. a versão do corpo do jogador (`body-a/`, `body-b/` ou `body-c/`);
2. a versão `all/`, quando a peça serve igualmente aos três corpos;
3. a arte provisória (vetor) da mesma camada;
4. um substituto genérico do slot (túnica, manto ou sandália cinza), marcado como "Arte em produção".

O validador avisa quais corpos estão sem versão. Exceções permanentes (uma peça que nunca terá versão
para um corpo) usam `body_compatibility` no banco; o servidor recusa equipar nesses casos
(`item_incompatible_body`).

### Moldes de alinhamento

`docs/art-templates/molde-body-{a,b,c}.png` (1024×1536, fundo transparente): manequim de cada corpo
com linhas de cabeça/queixo/chão, marcas de altura de cabeça e os pontos de ancoragem. Use-os como
camada de referência no editor de imagem ou como controle de pose na ferramenta de geração.
Regenerar: rota interna `/dev/avatar-lab?template=body-b` (captura 1024×1536 com fundo transparente).

### Prompts

Prompts, negativo e fluxo de recorte em camadas: [`docs/PROMPTS-ARTE.md`](PROMPTS-ARTE.md).

## 6. Assets finais necessários — conjunto de validação

Produzir **só este conjunto** primeiro, validar no app e depois expandir.

| # | Peça | Arquivos | Versões |
|---|---|---|---|
| 1 | Corpo base (pele) | `body` (máscara) + `body_shading` + `arms` + `hands` | 3 corpos |
| 2 | Rosto base | `face` (nariz, bochechas) | 1 |
| 3 | Olhos: amendoados, redondos, serenos | `face` | 3 |
| 4 | Sobrancelhas: suaves, retas, grossas | `face` (máscara tingível pela cor do cabelo) | 3 |
| 5 | Expressões: sorriso, sereno, alegria | `mouth` | 3 |
| 6 | Barbas: por fazer, curta | `beard` + sombreamento | 2 |
| 7 | Cabelos: crespo volumoso, curto texturizado, longo ondulado | `back_hair` + `front_hair` (+ sombreamento) | 3 |
| 8 | Túnicas: Linho (areia + bordado turquesa), Índigo (listras douradas), Terracota (transpassada + faixa verde) | `upper_outfit` + `sleeves` | 3 × 3 corpos |
| 9 | **Túnica de José** (Gn 37:3), épica | `upper_outfit` + `sleeves` | 3 corpos |
| 10 | Mantos: Lã (marrom, barra clara), Deserto (ocre, lenço no pescoço, bordado turquesa, franja) | `cloak_back` + `cloak_front` | 2 × 3 corpos |
| 11 | Calçados: Sandálias de couro, Botas de viagem | `feet` | 2 × 3 corpos |
| 12 | Fundo: deserto da Judeia ao entardecer | `background` (pode ser mais largo que o canvas) | 1 |

Total aproximado: **~70 arquivos** (contando versões por corpo e camadas de sombreamento).

### Briefing para ilustração (ou ferramenta gráfica)

> Personagem 2D para jogo mobile de aventura bíblica, vista frontal em pé, braços relaxados ao lado
> do corpo, proporção de 5,5–6 cabeças, estilo ilustrado em aquarela/guache com contorno fino marrom
> escuro, sombreamento suave e paleta terrosa (areia, ocre, terracota, oliva) com acentos turquesa,
> índigo e dourado. Vestimentas inspiradas no Oriente Médio antigo, com dobras e bordados.
> Sem chibi, sem traço infantil. Fundo transparente. Cada peça isolada numa camada, no canvas
> 1024×1536, alinhada às âncoras da tabela da seção 3.

Ao usar ferramentas de geração de imagem, a imagem gerada **precisa ser recortada em camadas e
alinhada ao canvas** por um artista; uma ilustração única pronta não serve para personalização.

### Critérios de aceite da arte final

- Encaixe perfeito sobre as âncoras nos três corpos (verificar no `/dev/avatar-lab` com guias).
- Nenhuma peça "flutuando" ou cortada ao trocar cabelo, manto ou túnica.
- Silhuetas distintas entre os corpos.
- Legível no celular: o personagem inteiro com ~450 px de altura e o retrato com ~520 px.
- Itens bíblicos com acabamento igual ou superior às peças comuns.
