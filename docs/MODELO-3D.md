# Personagem 3D — prova jogável e especificação do modelo final

## 1. O que está jogável hoje

Rota `/avatar/3d` (botão **Ver em 3D** no guarda-roupa e no Início), verificada por `FLOW=avatar3d bash e2e/run.sh`.

| Requisito | Situação |
|---|---|
| GLB com geometria, esqueleto e pesos de pele | ✔ `assets/models/viajante.glb` (19 ossos humanoides, 6 malhas, ~9,7 mil vértices, 582 KB) |
| Materiais PBR iluminados em tempo real | ✔ three.js + `@react-three/fiber` (web); tom de pele e cor do cabelo da conta aplicados aos materiais |
| Girar e ver de frente, lado e costas | ✔ botões e arraste |
| Animação discreta de repouso | ✔ clipes `idle` e `idle_staff` (respiração, peso, cabeça); estática com movimento reduzido |
| Um corpo, dois tons de pele, dois cabelos | ✔ corpo B; Tom 2 e Tom 5 (todos os 6 tons funcionam); curto e longo ondulado |
| Duas peças vestíveis + cajado que acompanha a mão | ✔ Túnica de Linho, Manto Noturno; Cajado de Pastor preso ao osso da mão direita, com o braço na pose de segurar |
| Troca com os dados reais da conta e persistência | ✔ salva pelo mesmo `save_wardrobe` do guarda-roupa; volta igual após reabrir; o Início 2D mostra o mesmo visual |
| Luz neutra no guarda-roupa; lua e fogueira no acampamento | ✔ com a fogueira tremulando (fixa com movimento reduzido) |
| Roupa sem atravessar o corpo | ✔ no repouso: túnica 1,5–3 cm além da pele com os mesmos pesos; manto aberto na frente |
| Web: carregamento e fluidez | ✔ GLB em ~120–150 ms (local) e ~45 quadros/s no Chromium **sem GPU** do ambiente de testes |
| Celular físico (Android/iPhone) | ✘ **não verificado**: não há aparelho neste ambiente. `expo-gl` está instalado; o palco usa `@react-three/fiber`, que tem entrada nativa |

**Limite de qualidade:** o GLB atual é **gerado por código** (`scripts/build-avatar-glb.mjs`) para provar a
integração. Tem formas simples, como um manequim: vale como **prova parcial** de aparência. A prova de
integração (carregar, animar, iluminar, trocar e persistir) está completa. O modelo final entra no lugar do
arquivo, com os mesmos nomes de ossos, malhas e materiais, sem mudar o app.

## 2. Modelo de que precisamos (primeira entrega)

Referência visual: os dois viajantes pintados anexados (adulto semirrealista, túnica de linho, manto de lã
roxo, bolsa de couro, cajado com gancho, sandálias).

| Item | Especificação |
|---|---|
| Personagem | 1 adulto, corpo "Atlético" (corpo B), 1,72–1,78 m, proporção ~7,5 cabeças, pose A (braços a ~30°), olhando para +Z, pés no chão (y = 0), unidade em metros |
| Malha do corpo | 12–20 mil triângulos, topologia para deformação (cotovelos, joelhos, ombros), cabeça e mãos com 5 dedos |
| Rosto | olhos separados (íris + córnea), cílios e sobrancelhas como cartões; 4 blendshapes opcionais: `blink`, `smile`, `browUp`, `jawOpen` |
| Esqueleto | humanoide VRM 1.0, nomes exatos: `hips, spine, chest, upperChest?, neck, head, leftShoulder, leftUpperArm, leftLowerArm, leftHand, (dedos opcionais: leftThumbProximal…), leftUpperLeg, leftLowerLeg, leftFoot, leftToes?` e o lado `right…` |
| Pesos | no máximo 4 influências por vértice, normalizados |
| Peças (malhas separadas, mesmo esqueleto) | `outfit_tunic` (Túnica de Linho, com mangas), `cloak` (Manto Noturno), `hair_short`, `hair_long` (longo ondulado). Cada peça modelada **sobre o corpo** e com pesos transferidos do corpo, sem atravessar em ±35° de flexão de cotovelo e joelho |
| Cajado | malha `staff`, **filha do osso `rightHand`**, com a haste vertical na pose `idle_staff` e a base no chão |
| Materiais (nomes exatos) | `skin` (cor base clara, neutra: o app tinge pelo tom da conta), `hair` e `brows` (idem, pela cor do cabelo), `eye_white`, `iris`, `lips`, `linen`, `trim`, `wool`, `gold`, `leather`, `wood` |
| Texturas | PBR metal/rugosidade: baseColor + normal + ORM, **1024² por material** (2048² no corpo), KTX2/Basis se possível; `skin` e `hair` com baseColor em tons de cinza claros (o tingimento multiplica) |
| Animações (nomes exatos) | `idle` e `idle_staff` (4–6 s, em laço, sem deslocar a raiz). Opcionais: `turn`, `celebrate` |
| Arquivo | `assets/models/viajante.glb` (glTF 2.0 binário), Draco ou meshopt opcional, **≤ 4 MB** |
| Miniaturas | um PNG 512² transparente por peça, renderizado do próprio modelo (vista ¾, luz neutra), para os ícones do inventário |
| Licença | autoral do projeto ou CC0/CC-BY com atribuição; **não** usar Mixamo, Ready Player Me ou assets de loja com restrição de redistribuição em app |

Entregas seguintes: corpos A e C (mesmo esqueleto, proporções diferentes), os outros cabelos, Bolsa do
Viajante (`satchel`, alça com pesos do tronco), Sandálias de Couro (`feet_sandals`) e as peças do lote 2D.

## 3. Como substituir e conferir

1. Coloque o GLB em `assets/models/viajante.glb` (mesmo nome).
2. `FLOW=avatar3d bash e2e/run.sh`: carrega, desenha, gira, troca, salva, reabre, troca a luz e mede os quadros.
3. No celular: `npx expo start` com o app de desenvolvimento e a rota `/avatar/3d`; medir tempo de carga e quadros por segundo.
