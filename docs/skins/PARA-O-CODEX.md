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

## 10. Entrega "Arte Lote A e Mundos": aplicada (18/11/2026)

O SHA-256 do ZIP confere com o `.zip.sha256` e as 72 somas internas conferem.
- **Cenas dos 7 mundos:** aprovadas. Medem 1600 × 960 e pesam de 229 a 327 KB, com o assunto no alto e no centro e a base calma. Estão no topo de cada página de mundo e em faixa nos cartões do mapa da Jornada.
- **Skins do Lote A:** as pinturas de corpo são idênticas às já aplicadas. Só os 6 ícones mudaram (moldura ajustada) e foram atualizados.

## 11. Lote B da loja: aplicado (18/11/2026)

`Jornada_Biblica_Exodo_Lote_B_Loja.zip`: o SHA-256 confere com o `.zip.sha256` e as 114 somas internas conferem.
- **Aprovado:** 33 pinturas (6 skins e 5 apresentações femininas). Pesam de 131 a 171 KB, os estilos são idênticos ao catálogo, os pés ficam em y ≈ 1451 e os cantos são transparentes.
- **Skins:** Carpinteiro (e Carpinteira) de acácia, Sacerdote (só a padrão, Êx 28:40-42), Bordador/Bordadora, Ourives, Gravador/Gravadora de pedras e Perfumista.
- A migração `20261128000100_skin_variants_lote_b.sql` registra a apresentação feminina das 5 skins. As 11 skins pintadas já aparecem na loja, no Vestiário, no acampamento e no Perfil.
- **Estudo do Manto de Moisés** (`entregas/lote-b/Estudo_Lendaria.png`): **aprovado como direção.** Manto longo e volumoso, borda dupla legível, faixa na cintura e cajado com ponta bifurcada. Entregue as 3 pinturas do Moisés novo (e da apresentação feminina) para substituir as do Lote A, com o mesmo ID e as mesmas âncoras.

**Próximo:** o Moisés revisado e a Épica da semana (`epico_sumo_sacerdote`), que aparece na loja. Depois, as Raras de missão (Joquebede, filha de Faraó, Sifrá e Puá) e as Épicas da temporada.

## 12. Moisés revisado, Épica da semana e Raras de missão: aplicados (18/11/2026)

`Jornada_Biblica_Exodo_Moises_Epica_e_Missoes.zip`, montado sobre `986cfd0`:
- O SHA-256 `474d42e5…3523` confere com o `.zip.sha256`.
- O `SHA256SUMS.txt` anexado é idêntico ao de dentro do ZIP, e as 63 entradas conferem.
- As fichas do Moisés são idênticas às do branch.

**Aprovado:** 18 pinturas de 137 a 233 KB, com estilos idênticos ao catálogo, pés em y ≈ 1451 e névoa zero.
- **Manto de Moisés (Lendária):** substituído pelo corte do estudo, com manto longo de borda dupla, faixa tecida e cajado bifurcado, nas versões padrão e feminina. Agora se distingue bem do Peregrino.
- **Sumo sacerdote (Épica da semana):** éfode, peitoral de 12 pedras e turbante com a placa dourada.
- **Joquebede, filha de Faraó e Sifrá e Puá (Raras de missão):** as mãos de Joquebede e da filha de Faraó seguram o cesto pelas laterais, como pedido.

Nada mudou no banco nem nas migrações. São 15 skins pintadas, e todas as da loja (incluindo a Épica) aparecem pintadas.

**Falta pintar da Temporada 1 (11 skins):**
- Gloriosas: Moisés com o rosto resplandecente e Arão com a vara que floresceu.
- Lendária: Vestes de Arão.
- Épicas: Miriã, Bezalel, Jetro e Zípora.
- Raras: Hur, Aoliabe e Tocador de shofar.
- Comum: Pastor de ovelhas (a skin inicial).

Prioridade sugerida: Pastor (é inicial), depois as Lendárias e Gloriosas de leitura (já conquistáveis no app) e por fim as Épicas e Raras da temporada.

## 13. Lotes T1-C e T1-D: aplicados (18/11/2026), Temporada 1 completa

- **T1-C:** o ZIP confere com o `.zip.sha256` (`d830a67c…`) e as 92 somas conferem.
- **T1-D:** o ZIP confere com o `.zip.sha256` (`9ed8e7d2…`) e as 73 somas conferem.
- Integrados nessa ordem: 48 pinturas com estilos idênticos ao catálogo e pés em y ≈ 1451.
- As versões femininas de Pastor (Pastora de ovelhas), Moisés com o rosto resplandecente, Bezalel, Aoliabe e Tocador de shofar (Tocadora) estão registradas no banco pela migração `20261130000100_skin_variants_t1cd.sql`.

**As 26 skins da Temporada 1 estão pintadas e no app**, cada uma com a forma de conquista vigente (inicial, loja ou leitura).

**Ajuste feito na entrega:** `epico_bezalel/feminino/estilo-3` (1x e @2x) tinha um halo de alfa fraco (≤ 16) em volta da figura, com 74 mil pixels longe do contorno. Removi só esses pixels, sem tocar na pintura, e regravei em WebP 92. Os outros 47 arquivos estão como foram entregues. Nos próximos lotes, confira que o fundo sai totalmente transparente.

**Para os próximos lotes:**
- **As Gloriosas precisam se destacar das Lendárias do mesmo personagem.** Arão e a vara que floresceu ficou quase igual às Vestes de Arão: só a vara diferencia. Use luz, um tecido de mais presença ou um elemento do momento marcante.
- **Moisés com o rosto resplandecente:** o "rosto que brilha" (Êx 34:29) pode aparecer mais, com uma luz suave no rosto, sem halo de santo.
- **Nomes femininos:** quando o nome é o mesmo nas duas versões, o Vestiário mostra "Padrão" e "Feminina". Use um `nomeExibicao` próprio sempre que fizer sentido (Pastora, Tocadora, Bordadora).

**Próximo lote: P01**, as principais das Origens. O briefing está em `LOTES.md`.

## 14. Moisés com o rosto resplandecente, véu e aura: aplicado (18/11/2026)

O ZIP confere com o `.zip.sha256` (`5b32cd9b…`), as 23 somas conferem e as fichas são idênticas às de `3e5c300`. As 6 pinturas entraram no lugar das anteriores, com os mesmos caminhos.
- O véu de linho segue Êx 34:33–35.
- A transparência fraca fora da figura fica toda no quadro da cabeça (y entre 66 e 455), ou seja, é a aura pedida e não névoa.

**Ajuste no app:** a aura passava do limite superior do recorte do acampamento (y = 176) e aparecia cortada por uma borda reta. As skins pintadas agora usam no acampamento o enquadramento `campPainted` (`202 56 670 1132`, mesma proporção), e a aura se desfaz sem corte.

**Para pinturas futuras:** o que estiver acima da cabeça (aura, coroa, chama) deve ficar em y ≥ 56 e x entre 202 e 872, para caber no acampamento. No retrato redondo do topo, o recorte de cabeça (`382 150 260 260`) corta naturalmente o que passar disso.

## 15. Moisés com as tábuas da referência e a regra dos personagens principais: aplicados (18/11/2026)

O ZIP confere com o `.zip.sha256` (`685975e8…`), as 17 somas conferem e a ficha é idêntica.
- As 3 pinturas masculinas, com véu, aura e as tábuas da referência `tc3a1buas.gif`, entraram no lugar das anteriores. A aura foi preservada e cabe no `campPainted`.
- **As inscrições foram conferidas letra por letra:** as abreviações tradicionais dos Dez Mandamentos em hebraico, lidas da direita para a esquerda, com os mandamentos 1 a 5 na tábua da direita de quem olha e 6 a 10 na da esquerda.

**Regra dos personagens principais aplicada:**
- **Banco:** a migração `20261201000100_principal_characters_presentation.sql` deixa as Lendárias e Gloriosas só com a apresentação padrão, que é a do sexo do personagem. Ela também normaliza as seleções antigas, mantendo a mesma skin, o mesmo estilo e a posse, e acrescenta a restrição `skins_principal_single_presentation`.
- **Arte:** as pastas `feminino/` de `lendario_moises` e `glorioso_moises_rosto_resplandecente` saíram do app. Continuam no histórico do repositório.
- **App:** `isPrincipalCharacter` no catálogo. Vestiário, cadastro, loja, acampamento, Perfil, Amigos e cartão público usam a mesma apresentação válida.
- **Ferramentas:** `gen-skin-art.mjs` e `skins-add-lot.mjs` ignoram a apresentação feminina de skins principais. O `LOTES.md` traz a regra em cada skin.
- **Ofícios e personagens não principais** (Pastor, Ourives, Bezalel, Aoliabe, Tocador de shofar…) continuam com a apresentação feminina.

## 16. Regra ampliada: todo personagem bíblico só no próprio sexo (18/11/2026)

**Decisão do usuário:** se o personagem tem o sexo definido na Bíblia, a skin tem **só** a apresentação desse sexo, seja ele principal ou secundário. Só o que não é personagem (ofícios e figuras genéricas) pode ter as versões masculina e feminina.

- **Banco:** a migração `20261202000100_biblical_characters_presentation.sql` cria `skins.character_sex` e marca os 13 personagens da Temporada 1:
  - 8 masculinos: os dois Moisés, os dois Arão, Bezalel, Jetro, Hur e Aoliabe;
  - 5 femininos: Miriã, Zípora, Joquebede, a filha de Faraó e Sifrá e Puá.
  
  A restrição `skins_character_single_presentation` passa a valer para eles e para toda Lendária e Gloriosa. As seleções antigas de apresentação do outro sexo foram normalizadas, com a mesma skin, o mesmo estilo e a posse.
- **Saíram do app** as pastas `feminino/` de `epico_bezalel` e `raro_aoliabe` (continuam no histórico do repositório).
- **Mantêm a versão feminina**, por serem figuras genéricas: Pastor/Pastora, Peregrino/Peregrina, Levita, Carpinteiro/Carpinteira, Bordador/Bordadora, Ourives, Gravador/Gravadora, Perfumista e Tocador/Tocadora de shofar.
- **Próximos lotes:** o `LOTES.md` indica em cada skin se ela é "personagem bíblico: só esta apresentação" ou "figura genérica: feminina adicional quando o traje permitir". O plano marca `character` em todas as principais.

## 17. Lotes P01 e P02 (principais das Origens): aplicados (19/11/2026)

- **P01:** o ZIP confere com o `.zip.sha256` (`e5ab3cb6…`) e as 65 somas conferem.
- **P02:** o ZIP confere com o `.zip.sha256` (`d4f27ca7…`) e as 65 somas conferem.
- **Aprovado:** 36 pinturas de 165 a 313 KB, estilos idênticos ao plano, sem névoa e sem pasta `feminino/`, porque são personagens e ficam só no próprio sexo.
- **P01:** Vestes de Adão, Eva, Noé, Abraão, Sara e Isaque.
- **P02:** Vestes de Rebeca, Jacó e José, e as Gloriosas José, governador do Egito, Abraão sob as estrelas e Noé e o arco-íris. As Gloriosas agora se distinguem bem das Lendárias.

As migrações `20261202000200_skins_p01.sql` e `20261202000300_skins_p02.sql` acrescentam as 12 skins, com as regras de leitura e o sexo de cada personagem.
- As Lendárias se ganham pela história do personagem (José: Gênesis 37–50).
- As 3 Gloriosas se ganham ao concluir o mundo das Origens.

**Próximo: P03 e P04** (principais de Terra e Reinos), conforme o `LOTES.md`.

## 18. Lotes P03 e P04 (principais de Terra e Reinos): aplicados (19/11/2026)

- **P03:** o ZIP confere com o `.zip.sha256` (`518e7a3f…`) e as 65 somas conferem.
- **P04:** o ZIP confere com o `.zip.sha256` (`8a9ca300…`) e as 65 somas conferem.
- **Aprovado:** 36 pinturas de 156 a 271 KB, sem névoa, estilos iguais ao plano e personagens só no próprio sexo (Débora e Rute femininas).
- **P03:** Vestes de Josué, Débora, Gideão, Sansão, Rute e Samuel.
- **P04:** Vestes de Davi, Salomão, Elias, Eliseu, Esdras e Neemias. O manto dobrado de Eliseu usa o tecido do manto de Elias.

**Sansão: decisão do usuário aplicada.** As sete tranças aparecem nos três estilos (Jz 16:13), com as cores e os tons do plano. No catálogo e no plano, o penteado dos três estilos passou a `hair-braids`, com a nota "sete tranças". A ficha guarda os IDs originais e o `penteadoVisual`, para rastrear a mudança.

As migrações `20261202000400_skins_p03.sql` e `20261202000500_skins_p04.sql` trazem as 12 skins com as regras de leitura. Exemplos:
- Vestes de Sansão: Juízes 13–16.
- Vestes de Davi: 1 Samuel 16–31.
- Vestes de Elias: 1 Reis 17 a 2 Reis 2.
- Vestes de Rute: concluir Rute.

**Próximo: P05 e P06**, com as últimas principais de Terra e Reinos (Ester e as 5 Gloriosas) e as de Sabedoria e Profetas.

## 19. Lotes P05 e P06: aplicados (19/11/2026)

- **P05:** o ZIP confere com o `.zip.sha256` (`d2ce4c8a…`) e as 66 somas conferem.
- **P06:** o ZIP confere com o `.zip.sha256` (`9768c5e8…`) e as 66 somas conferem.
- **Aprovado:** 36 pinturas de 175 a 350 KB, sem névoa, estilos iguais ao plano e personagens só no próprio sexo (as duas Ester são femininas).
- **P05:** Vestes de Ester e as Gloriosas Davi diante de Golias, Elias no carro de fogo, Ester diante do rei, Josué diante das muralhas e Salomão no trono de marfim.
- **P06:** Vestes de Jó, Isaías, Jeremias, Ezequiel e Daniel, e a Gloriosa Jó restaurado.
- As adaptações do LEIA-ME foram aceitas: Salomão de pé junto ao trono, as ovelhas de Jó como símbolo da restauração, a canga de Jeremias e o rolo de Ezequiel.

**Rosto próprio, regra nova do usuário:** toda Lendária e Gloriosa tem rosto especial e diferente das demais skins, preservado nos 3 estilos.
- O perfil (`identidadeFacial`) das 12 skins foi copiado das fichas para o `plano-lotes.json`.
- A regra entrou em `regras.rosto` no plano, na seção Estilo do `PRODUCAO-POR-LOTES.md` e no briefing de cada Lendária e Gloriosa do `LOTES.md`.
- **Vale também para as Lendárias e Gloriosas dos lotes anteriores (P01 a P04)?** Fica para o usuário decidir se quer revisar os rostos delas.

As migrações `20261202000600_skins_p05.sql` e `20261202000700_skins_p06.sql` trazem as 12 skins com as regras de leitura. As Gloriosas de Terra e Reinos pedem o mundo inteiro; Jó restaurado pede o mundo de Poesia e Sabedoria.

**Próximo: P07 e P08**: Jonas, as Gloriosas dos Profetas e as primeiras principais dos Evangelhos.

## 20. Revisão dos rostos de P01–P04: no final de tudo (decisão do usuário, 19/11/2026)

As 24 Lendárias e Gloriosas de P01 a P04 (de Adão a Neemias) foram pintadas antes da regra do rosto próprio. Elas serão refeitas **no final de todos os lotes novos**, nos lotes **RF01–RF04** do plano.
- **O que muda:** só o rosto. Cada uma ganha formato, nariz, olhos, maxilar, idade aparente e expressão únicos, registrados em `identidadeFacial` na ficha.
- **O que se mantém:** IDs, estilos (tons e penteados, incluindo as sete tranças de Sansão), sexo do personagem, traje, objetos, âncoras e caminhos.
- **Integração:** como as skins já estão no app, a revisão só troca as pinturas (`gen-skin-art.mjs`). Não há migração nova.
- O briefing está em `LOTES.md`, e o painel `STATUS.md` mostra o andamento ("0/6 revisadas").

## 21. Lotes P07 e P08: aplicados (19/11/2026), estilos do plano corrigidos

- **P07:** o ZIP confere com o `.zip.sha256` (`bbb57e92…`) e as 66 somas conferem.
- **P08:** o ZIP confere com o `.zip.sha256` (`b4cf1384…`) e as 66 somas conferem.
- **Aprovado:** 36 pinturas de 152 a 316 KB, sem névoa, estilos iguais ao plano, Maria feminina e os demais masculinos, todas com `identidadeFacial`.
- **P07:** Vestes de Jonas e de João Batista, e as Gloriosas Daniel na cova dos leões, Isaías e a brasa do altar, Jonas e o grande peixe e Ezequiel no vale de ossos.
- **P08:** Vestes de Pedro, João, Tiago, André e Mateus, e o Manto de Maria, mãe de Jesus.
- As adaptações do LEIA-ME foram aceitas: Isaías segurando a tenaz como símbolo, Jonas numa costa genérica e as cenas dentro do recorte. O Daniel idoso é coerente com Daniel 6, no tempo de Dario, quando ele tinha cerca de 80 anos.

**Erro do plano, já corrigido:** o gerador de estilos do `plano-lotes.json` tinha poucas combinações.
- **Efeito:** João Batista e Tiago receberam os 3 estilos idênticos, e Jonas quase idênticos. Com pele e cabelo iguais, os rostos ficaram parecidos, mesmo com `identidadeFacial` diferente. No plano inteiro, 146 skins compartilhavam estilos com outra.
- **Correção:** as 215 skins ainda não pintadas ganharam estilos novos.
  - Cada skin tem um tom claro, um médio e um escuro, com cores e penteados variados.
  - O conjunto de 3 estilos nunca se repete entre skins, e o estilo 1 não se repete entre skins do mesmo sexo.
  - Louro só em pele clara, mel em pele clara ou média.
  - O `LOTES.md` já traz os estilos novos. **Use sempre os estilos do `LOTES.md` atual.**
- **As skins já pintadas mantêm seus estilos.** Atualização: o Codex vai diferenciar **agora** os rostos de Vestes de Jonas e de Tiago nos três estilos, mudando só a anatomia facial e a barba (mesmos tons, penteados, trajes, objetos e IDs), em **P07_v2 e P08_v2**. João Batista fica como referência. Os três saem da RF05 e o `stylesRevisao` foi removido do plano.

**RF05 também inclui** as Lendárias e Gloriosas da Temporada 1 (Vestes de Moisés, Vestes de Arão e Arão e a vara que floresceu), anteriores à regra do rosto. Moisés com o rosto resplandecente fica de fora, porque o véu cobre o rosto.

A revisão de cada skin conta como feita quando a ficha nova traz `"revisaoRosto": "<lote>"`.

As migrações `20261202000800_skins_p07.sql` e `20261202000900_skins_p08.sql` trazem as 12 skins com as regras de leitura.

**Próximo: P09 e P10**, o fim das principais.

### 21.1 P07_v2 e P08_v2: rostos de Jonas e Tiago corrigidos (19/11/2026)

- **P07_v2_final:** o ZIP confere com o `.zip.sha256` (`44f4d5d3…`) e as 67 somas conferem.
- **P08_v2_final:** o ZIP confere com o `.zip.sha256` (`79ee4283…`) e as 67 somas conferem.
- Mudaram só os 8 arquivos de cada skin corrigida: 6 pinturas, ícone e ficha. Os outros 80 arquivos de assets são idênticos aos já integrados.
- As fichas mudaram só em `identidadeFacial`, `revisaoRosto` e `detalhesDaRevisao`. Medidas e âncoras conferem.
- **Vestes de Jonas:** rosto compacto e largo, nariz curto e bigode, sem barba.
- **Vestes de Tiago:** rosto retangular maduro, nariz achatado e queixo com covinha, sem barba nem bigode.
- As comparações confirmam que os dois agora se distinguem de João Batista nos três estilos, com os mesmos tons, penteados e trajes.
- Aprovado e integrado **sem migração nova**. O plano recebeu a nova `identidadeFacial`.
- A Gloriosa "Jonas e o grande peixe" fica como foi enviada, com rosto próprio. Segue a regra de um rosto por skin, como nas duas Ester e nas duas skins de Jó.

**Próximo: P09 e P10.**
