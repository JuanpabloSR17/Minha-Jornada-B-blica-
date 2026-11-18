# Para o Codex: skins, loja nova e decisões até agora

Este é o ponto de partida da próxima rodada. Ele junta tudo o que foi decidido com o usuário em 18/11/2026. A especificação técnica das pinturas continua em [`TEMPORADA-1-EXODO.md`](./TEMPORADA-1-EXODO.md), que vale como contrato de entrega.

**O que pedimos a você:** pintar as skins da Temporada 1 no padrão pintado que você já definiu para o personagem 2.5D. São o mesmo enquadramento, a mesma luz, o mesmo acabamento e as mesmas âncoras do `AvatarRenderer`. Comece pelo **Lote A**.

> **Estilo obrigatório: mantenha o 2.5D pintado que você já está fazendo.**
> As skins seguem exatamente a linha de arte 2.5D dos lotes de personagem já entregues (o lote 1 e a pegada do cajado): pintura digital semirrealista de RPG, volume com luz e sombra pintadas, materiais com textura (linho, lã, couro, madeira, metal), contorno suave e proporção adulta.
> - **Não trocar de estilo:** nada de vetor chapado, pixel art, anime, cartum, 3D renderizado nem os estilos de teste (vitral, gravura, sombras, ponto-cruz, constelação etc.). Esses foram só experimentos e não valem para as skins.
> - **Mesma luz neutra** do guarda-roupa nas pinturas base. O app aplica por cima a luz de cada tela, como a fogueira no acampamento.
> - **As 78 pinturas devem parecer da mesma mão:** os 3 estilos de uma skin e todas as skins da temporada, lado a lado com os personagens 2.5D atuais.
> - Na dúvida, compare com as pinturas do lote 1 em `assets/avatars/` (corpo B, camadas pintadas) e siga a mesma referência.

---

## 1. A virada: skins em vez de itens

- O jogo passa a trabalhar com **skins**, não com itens em camadas.
- **Skin = traje completo inspirado num personagem ou ofício bíblico**, vestido pelo viajante do jogador. O nome é "Manto de Moisés", nunca "Moisés".
- **Cada skin tem 3 estilos**, com cores, rosto, tom de pele e cabelo diferentes, para que todos os públicos se vejam.
- Os 3 estilos **substituem** os tipos de corpo Esguio, Atlético e Robusto. Isso dá **3 pinturas inteiras por skin**, sem camadas por item e sem máscara de pele.
- Os itens antigos continuam no banco e não são apagados de ninguém. A loja e o vestiário passam a girar em torno das skins.

## 2. Regras de conteúdo (decididas pelo usuário)

| Tema | Decisão |
|---|---|
| Raridades | Comum, Rara, Épica, Lendária e **Gloriosa**. A Gloriosa é o momento marcante de um personagem primário, por exemplo Moisés com o rosto resplandecente. |
| O que a skin é | **O traje** do personagem, vestido pelo viajante |
| Maria | Entra como **Lendária**, com traje respeitoso |
| Sansão | Fica |
| Linha infantil | Sim |
| Volume final por mundo | Avaliado durante a produção |
| Primeira temporada | **Êxodo** |
| Realeza | Entram reis, príncipes, rainhas e princesas |
| Nunca vira skin | Deus, Jesus, Espírito Santo, anjos, Satanás, vilões (Faraó, Golias…) e ídolos. Sem nudez e sem violência. |
| Visual | Traços e roupas fiéis ao antigo Oriente Médio e à África, com trajes discretos para homens e mulheres. Entre os 3 estilos, os tons de pele cobrem do 1 ao 6. |

A enciclopédia completa tem 288 skins possíveis: 59 ofícios e 229 personagens, dos quais 23 são Gloriosos. Ela está no documento "Enciclopédia de Skins Bíblicas" do usuário. Se você não tiver acesso, peça a ele. Para a Temporada 1, basta a tabela de `TEMPORADA-1-EXODO.md`.

## 3. O que pintar agora

As **26 skins de Êxodo** estão listadas em `TEMPORADA-1-EXODO.md` §1, com ID, nome, referência, raridade e o elemento que identifica cada uma. Isso dá **78 pinturas e 26 ícones**.

O formato da entrega está em §2:

```
assets/skins/<id>/estilo-{1,2,3}/corpo.webp     1024×1536, alfa limpo
assets/skins/<id>/estilo-{1,2,3}/corpo@2x.webp  2048×3072
assets/skins/<id>/icone.webp                    256×256
assets/skins/<id>/ficha.json
```

- **Enquadramento:** pés em y = 1450, topo da cabeça em y ≈ 216 e centro em x = 512.
- **Âncoras:** `cabecaCentro`, `queixo` e `pes`, com tolerância de ±12 px.
- **Peso:** até 450 KB por arquivo base.

**Os estilos já estão definidos no app.** O arquivo `src/features/skins/season1.json` é a fonte da verdade do catálogo. Para cada skin ele traz:

- os 3 estilos, com `skinTone`, `hairColor` e `hairStyle`;
- o `preview`, com os itens atuais que servem de esboço do traje até a pintura chegar.

Use os mesmos tons e cabelos na `ficha.json`, para a pintura bater com o que a loja já mostra. Se precisar mudar um estilo, diga qual e por quê, e eu atualizo o JSON, a migração e os testes juntos.

### Ordem dos lotes

1. **Lote A (prova):** `comum_peregrino_exodo`, `raro_levita` e `lendario_moises`, nos 3 estilos (9 pinturas). Serve para validar enquadramento, âncoras e recortes de corpo inteiro, retrato e rosto.
2. **Lote B:** as demais Comuns e Raras. Priorize as **10 que já estão à venda** (§4), porque hoje elas aparecem na loja com o esboço.
3. **Lote C:** as Épicas.
4. **Lote D:** as Lendárias e as Gloriosas.

### Entrega

O formato é o mesmo das rodadas anteriores: um ZIP com `assets/skins/…`, `SHA256SUMS.txt` e capturas em 320 e 412 px. Eu confiro o SHA, extraio numa pasta separada, valido dimensões, alfa, peso, âncoras e a `ficha.json`, aplico sem sobrescrever trabalho paralelo, rodo os testes e faço o commit.

## 4. A loja nova: só skins, com preço justo (já implementada)

A loja do app foi refeita para vender **somente skins**. Ela já está no código e testada. Leia antes de pintar, para saber onde cada arte aparece.

### Preço = dias de leitura

A única fonte de Siclos é a meta diária, que paga **40 Siclos por dia**. Por isso o preço de cada skin é medido em dias de leitura.

| Raridade | Dias de meta | Preço |
|---|---|---|
| Comum | 4 | 160 Siclos |
| Rara | 10 | 400 Siclos |
| Épica | 25 | 1.000 Siclos |
| Lendária e Gloriosa | não vendem | só lendo |

O preço é calculado no servidor (`dias × siclos_daily_goal`). Se a meta mudar, os preços acompanham.

### Vitrine

- **Muda todo dia às 21h**, no horário de Brasília.
- Mostra **3 Comuns e 3 Raras** do dia.
- Mostra **1 Épica da semana**, que fica de graça no **dia de presente** (domingo, configurável em `skin_gift_weekday`).
- Hoje há 10 skins à venda:
  - **Comuns:** `comum_carpinteiro`, `comum_tecela` e `comum_parteira`.
  - **Raras:** `raro_levita`, `raro_sacerdote`, `raro_bordador`, `raro_ourives`, `raro_gravador` e `raro_perfumista`.
  - **Épica:** `epico_sumo_sacerdote`.
- `comum_pastor` e `comum_peregrino_exodo` são **iniciais**: todo jogador já tem.
- Cada cartão mostra a prévia da skin, a escolha entre os 3 estilos, o preço com "≈ N dias de leitura" e um botão: comprar, resgatar grátis, "Obtida" ou "Faltam N Siclos".
- **Comprar uma skin dá os 3 estilos.**

### No banco

A migração é `supabase/migrations/20261124000100_skin_market.sql`.

- **Tabelas:**
  - `skins` (catálogo);
  - `user_skins` (o que cada jogador tem e de onde veio);
  - `skin_purchases` (registro das compras).

  Todas têm RLS: cada jogador lê só o que é seu.
- **Funções:**
  - `get_skin_market()` devolve o saldo, os preços, a vitrine do dia, as skins obtidas e o próximo horário de troca.
  - `purchase_skin(id, skin, preço, dia)` faz a compra. Ela é idempotente pelo ID gerado no aparelho, trava por jogador e rejeita preço ou oferta vencidos. Só debita Siclos quando o preço é maior que zero.
- **A raridade `glorious`** foi adicionada.

Quando a pintura chegar, a loja só troca o esboço pela imagem em `assets/skins/<id>/estilo-N/corpo.webp`. Nada muda no banco.

### O que nunca se vende

Não se vendem Siclos, progresso, XP, Santos nem sorteios. As Lendárias e as Gloriosas também não: elas se ganham lendo.

## 5. Monetização combinada (contexto)

**Princípio:** o gratuito abençoa, o Jornada+ aprofunda, as skins expressam e a igreja multiplica. A leitura é sempre grátis e sem limite.

| Plano | O que inclui | Preço a testar |
|---|---|---|
| **Viajante** (grátis) | Leitura ilimitada, Modo Missão, mapa, marcos e Santos, 2 trilhas, plano de ritmo, skins iniciais e as ganhas lendo | grátis |
| **Jornada+** | Todas as trilhas, trilhas personalizadas, faixa premium da temporada, diário, retrospectiva e retratos especiais | R$ 14,90 por mês ou R$ 99,90 por ano |
| **Família** | Até 5 contas, com os pais acompanhando | R$ 149,90 por ano |
| **Igreja / Grupo** | Painel do líder, trilhas e desafios do grupo | R$ 149 a R$ 299 por mês |
| **Fundadores** (vitalício e limitado) | Jornada+ para sempre, com skin e moldura exclusivas | R$ 249 |

**Como se ganham skins:**

1. **Lendo:** é o caminho da maioria das skins e o único para as Lendárias e as Gloriosas.
2. **Temporada:** há uma faixa grátis e uma faixa premium. Mesmo na premium, a skin só se ganha lendo.
3. **Loja com Siclos** (§4).
4. **Edições comemorativas.**

A venda de skins com dinheiro real (R$ 4,90 a R$ 9,90) fica para uma fase posterior. Hoje a loja usa somente Siclos.

**Funil planejado:** landing page → quiz → "seu plano de jornada" → oferta, com "Começar grátis" sempre visível e teste de 7 dias. Os convites aparecem só ao final das ações, nunca no meio da leitura.

**Implantação:** depois do Lote A, o app vai para o domínio raiz e para o projeto Supabase de produção. Isso depende de acesso do usuário. Até lá, tudo roda só no banco de teste.

## 6. Também para você, além das skins

- **Temporada 1:** o enredo das faixas grátis e premium, alinhado às origens da tabela (`temporada-gratis` e `temporada-premium`).
- **4 trilhas novas** no formato das trilhas de Rute e do Tabernáculo.
- **Limpeza dos textos internos** que ainda aparecem para o jogador, como "chega no Marco 4".

## 7. Regras do repositório (as mesmas de sempre)

- Migrações só por adição: nunca alterar migração aplicada nem apagar dado ou conquista de jogador.
- A chave de serviço nunca vai para o app. Há RLS em todas as tabelas.
- Use só o banco de teste. Não conceda itens reais com eventos fictícios.
- Preserve o trabalho em paralelo: entregue um ZIP ou um patch com SHA-256, e não reescreva arquivos que você não tocou.

## 8. Atualização: só skins na interface (18/11/2026)

- **As peças saíram da interface.** O guarda-roupa de peças, os visuais salvos, as coleções, os detalhes de item e o Santuário foram tirados das telas; as rotas antigas levam ao **Vestiário** (`/vestiario`) ou aos Marcos. O servidor continua registrando o que cada jogador conquistou (nada foi apagado), e a chave `ITEMS_VISIBLE` em `src/config/features.ts` traz as peças de volta se elas virarem decoração do acampamento.
- **Skin vestida no servidor.** A migração `20261125000100_skin_wardrobe.sql` cria `user_skin_selection` e os RPCs `get_my_skins()` e `equip_skin(skin, estilo)`, que conferem a posse. O cartão público (`get_public_avatar`) passa a trazer a skin vestida.
- **Cadastro por skin.** A etapa "Criar personagem" virou "Escolha seu viajante": uma das 2 skins iniciais, num dos 3 estilos.
- **Desenho até a pintura chegar.** O viajante é desenhado com o estilo da skin (pele e cabelo) e o traje provisório do `preview` em `season1.json`. Quando a pintura de uma skin for entregue em `assets/skins/<id>/estilo-N/corpo.webp`, ela substitui esse desenho no Vestiário, no acampamento, no perfil e na loja.
- **Páginas dos mundos.** Cada mundo tem página própria (`/world/<id>`) com cena vetorial, trilha dos livros, marcos e skins do mundo. A Temporada 1 (Êxodo) aparece no mundo das Origens. Para as próximas temporadas, a ficha da skin já traz o `mundo`, que é o que liga a skin à página.
- **Marcos sem peças.** Os marcos continuam como conquistas de leitura. A próxima etapa natural é ligar Lendárias e Gloriosas aos marcos e aos livros concluídos (por exemplo, Êxodo 34 → `glorioso_moises_rosto_resplandecente`), para que essas skins se conquistem lendo, como combinado.

## 9. Entrega do Lote A ampliado: aplicada (18/11/2026)

Pacote `Jornada_Biblica_Exodo_Lote_A_Ampliado.zip` (SHA-256 `2c1e43ed54dcbee8828e1f40b91f60a96e628a42047d8266c648d3be9a1dd55b`). Não veio o arquivo `.zip.sha256` citado no LEIA-ME; o hash acima foi calculado na chegada. As 83 somas do `SHA256SUMS.txt` conferem.

**Aprovado e aplicado:** 24 pinturas, incluindo o Lote A completo (Peregrino, Levita e Manto de Moisés), as apresentações femininas dessas 3 skins, a Tecelã e a Parteira.
- Tamanhos 1024 × 1536 e 2048 × 3072. Ícones de 256 × 256. Base entre 165 e 217 KB.
- Pés em y = 1451–1452. Cantos transparentes. Névoa de alfa desprezível.
- Estilos idênticos ao `season1.json`. O 2.5D é coerente com os personagens.

**Como entrou no app:**
- A pintura substitui o traje provisório no Vestiário, no acampamento (com a luz da fogueira), no Perfil, na loja, no cartão público e na comemoração.
- O mapa das pinturas é gerado por `node scripts/gen-skin-art.mjs` → `src/features/skins/art.generated.ts`.
- **Apresentação feminina:** a migração `20261127000100_skin_variants.sql` cria `skins.variants` e `user_skin_selection.variant`, e o RPC passa a ser `equip_skin(skin, estilo, apresentação)`. A escolha aparece no Vestiário e no cadastro ("Peregrino do Êxodo / Peregrina do Êxodo") e usa o `nomeExibicao` da ficha.

**Observação para os próximos lotes:** o Manto de Moisés (Lendário) ficou próximo do Peregrino (Comum): cajado, bolsa e manto parecidos. Reforce o que torna a Lendária reconhecível, como o manto de pastor de Midiã mais nobre e o cajado característico, sem fugir do 2.5D.

**Próximo lote (B):** as demais Comuns e Raras, começando pelas que estão na loja (Carpinteiro, Sacerdote, Bordador, Ourives, Gravador e Perfumista). Inclua a apresentação feminina na mesma rodada quando fizer sentido para o traje. Para cada apresentação nova, a skin precisa constar em `skins.variants` no banco; eu faço essa migração ao aplicar o lote.
