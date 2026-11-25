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

## 22. P08H: apóstolos mais jovens, com idades diferentes e cabelos naturais escuros (19/11/2026)

A pedido do usuário, depois de `aa982bc`. É uma correção de P08, não um lote novo.

**Conferência**
- O ZIP de 15.277.146 bytes confere com o `.zip.sha256` (`ebfdf641…`) e as 59 somas internas conferem.
- Mudaram só os 8 arquivos de cada uma das 5 skins: Pedro, João o apóstolo, Tiago filho de Zebedeu, André e Mateus. Maria e o P07 não mudam.

**Aprovado**
- Rostos próprios com idades aparentes diferentes: João 18–22, Tiago 22–26, André 24–29, Mateus 25–30 e Pedro 28–34.
- Cabelos castanho-escuros ou pretos, sem locs, louro ou grisalho.
- Tons de pele, trajes, objetos, mãos, âncoras e medidas corretos.
- As fichas trazem `revisaoRosto: "P08H"`.

**Integração**
- Pinturas, ícones e fichas substituídos.
- Os `styles` exatos de `AJUSTES-CATALOGO.json` foram aplicados em `src/features/skins/principais.json` (Vestiário e loja) e no plano. O banco não guarda estilos, então não há migração nova. Posse, regras e desbloqueios não mudaram.
- A pesquisa ficou em `docs/skins/PESQUISA-HISTORICA-APOSTOLOS.md`, e os documentos da entrega em `docs/skins/entregas/P08H/`.
- **Efeitos no plano:**
  - O estilo 1 de duas skins ainda não pintadas, Os magos e a estrela e Timóteo, mudou para não repetir o estilo 1 de João e de André.
  - O estilo 1 de Tiago, de cabelo castanho-escuro ondulado, agora repete o de Samuel, que já está pintada. Isso foi aceito, porque rosto e traje são diferentes.

**Orientação para os próximos apóstolos** (`regras.apostolos` no plano, repetida no topo do LOTES.md)
- Adultos jovens com idades aparentes variadas. As faixas de idade são direção artística, não fato para ensinar no app.
- Cabelos naturais castanho-escuros ou pretos, curtos, ondulados ou cacheados, e rosto próprio para cada um.
- No plano, já recebem estilos assim: Pedro sobre as águas, Paulo, Paulo no caminho de Damasco, Filipe, Natanael, Tomé, Tiago de Alfeu, Tadeu, Simão o zelote, Matias e Pedro no Pentecostes, que não deve parecer décadas mais velho que nas Vestes de Pedro.
- João em Patmos pertence a outra fase e fica idoso, com cabelo grisalho nos três estilos.

**Próximo: P09 e P10.**

**Complemento (19/11/2026)**
- Cabelos escuros e a ausência de grisalho valem para os adultos jovens na fase do ministério e para Pedro no Pentecostes.
- **João em Patmos** é muito posterior e deve aparecer como ancião, com cabelo e barba grisalhos. A proibição de grisalho não vale para ele.
- Nenhuma faixa de idade aparente aparece no app como idade bíblica comprovada. As faixas ficam só nas fichas e na pesquisa, que o app não exibe.

## 23. Lotes P09 e P10: aplicados (19/11/2026). As principais da enciclopédia estão completas

**Conferência**
- **P09_final:** o ZIP de 20.989.344 bytes confere com o `.zip.sha256` (`69d7423a…`) e as 67 somas conferem.
- **P10_final:** o ZIP de 17.975.292 bytes confere com o `.zip.sha256` (`0043f7bb…`) e as 57 somas conferem.

**Aprovado**
- 33 pinturas de 167 a 280 KB, cantos transparentes e estilos idênticos ao plano.
- Maria Madalena só na apresentação feminina; os demais só na masculina.
- Cada skin tem `identidadeFacial` própria.
- Apóstolos jovens de cabelo escuro, e João em Patmos ancião grisalho com sete candelabros.
- Paulo leva papiros com cordão e não envelope moderno, e não há figura divina adicionada.

**Adaptações aceitas**
- Um mago representa o grupo.
- Paulo aparece em pé no caminho de Damasco.
- A pomba no Jordão (Mt 3:16) e a língua de fogo no Pentecostes (At 2:3) são símbolos do próprio texto.
- O grisalho de João é direção artística da fase anciã, sem atribuir Ap 1:14 a João.
- A língua de fogo sobe a figura até y130 e a água desce até y1473, ambas dentro do recorte do acampamento.

**Migrações:** `20261202001000_skins_p09.sql` e `20261202001100_skins_p10.sql` trazem as 11 skins, as regras de leitura e o sexo de cada personagem. Corrigi o texto da regra de João em Patmos para "(1 livro)", no plano e na migração.

**Pendente, sem mudança agora:** a possível duplicidade entre Judas irmão de Tiago e Tadeu fica para o lote correspondente, preservando IDs e posses.

**Próximo: S01 e S02**, quando autorizado.

## 24. Lotes S01 e S02: aplicados (20/11/2026), com 4 pinturas de S02 a corrigir

**Conferência**
- **S01_final:** o ZIP de 18.996.357 bytes confere com o `.zip.sha256` (`acafc64d…`) e as 67 somas conferem.
- **S02_final:** o ZIP de 20.502.340 bytes confere com o `.zip.sha256` (`74292b8c…`) e as 67 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano, medidas e transparência corretas, e um único sexo por personagem.

**Aprovado:** S01 inteiro e S02 menos as pinturas abaixo.
- Raquel, Lia e Agar aparecem só como femininas.
- Abel segura o cordeiro com dois braços.
- Enoque não tem figura divina.
- Esaú tem o manto ferrugem e Calebe aparece maduro.
- Eleazar tem 12 pedras e Benjamim aparece com trigo e sem cena de roubo.
- As mãos e os objetos estão corretos.

**Migrações:** `20261202001200_skins_s01.sql` e `20261202001300_skins_s02.sql`, com as regras de leitura de cada personagem.

**Correção pedida (S02_v2): o tom 1, a pele mais clara, não aparece.** A comparação está em `docs/skins/entregas/S02/Tons_a_corrigir.png`.
- `epico_esau` **estilo-1** (tom 1, cacheado castanho) tem a pele igual à do estilo-3 (tom 4). Clarear para o tom 1, como o Benjamim estilo-2 ou o Paulo estilo-3.
- `epico_calebe` **estilo-1** (tom 1, crespo cobre) e **estilo-3** (tom 3, cacheado castanho) estão com a mesma pele. O estilo-1 deve ficar claramente tom 1 e o estilo-3 tom 3, um meio-termo visível entre o 1 e o 5 do estilo-2.
- `epico_juda` **estilo-3** (tom 1, curto) parece tom 3 ou 4. Clarear para o tom 1.

Mantenha o rosto (`identidadeFacial`), o cabelo, o traje, os objetos, os IDs e as âncoras. Troque só as pinturas, o `corpo@2x` e, se mudar, o ícone dessas skins. Mande o pacote completo de S02 com os SHA-256 atualizados, sem migração.

### 24.1 S02_v2: tons de pele corrigidos e aprovados (20/11/2026)

**Conferência**
- O ZIP de 20.968.274 bytes confere com o `.zip.sha256` (`2bb71799…`) e as 68 somas conferem.
- Mudaram só os 10 arquivos anunciados: 8 pinturas (base e @2x) e os ícones de Esaú e Calebe. Os outros 38 são idênticos.

**Aprovado:** Esaú no estilo 1, Calebe no estilo 1 e Judá no estilo 3 agora em tom 1 claro, e Calebe no estilo 3 em tom 3 intermediário. Rostos, cabelos, trajes e objetos foram preservados.

**Integração:** só os arquivos alterados, sem migração.

**Teste de compras simultâneas no Supabase local** (`e2e/supabase-real/flow.cjs`)
- A falha foi intermitente: a rodada seguinte passou.
- O app consulta o servidor antes de abrir "Pagar". A confirmação só não abre se a vitrine virou ou se o saldo do aparelho estava desatualizado.
- O teste agora espera "Saldo: <saldo disputado> Siclos" nos dois aparelhos antes das compras.
- Se a confirmação não abrir, o teste falha mostrando o aviso que apareceu na tela e o dia da vitrine no servidor.
- As asserções continuam iguais: exatamente uma compra e um débito, nenhuma posse do perdedor e saldo final não negativo.

**Disco:** os scripts e2e deixavam uma pasta temporária a cada rodada (23 GB acumulados). Agora a apagam ao terminar (commit `b56311e`).

## 25. Lotes S03 e S04: aplicados (20/11/2026), com 2 pinturas de Labão a corrigir

**Conferência**
- **S03_final:** o ZIP de 19.756.527 bytes confere com o `.zip.sha256` (`027872e9…`) e as 68 somas conferem.
- **S04_final:** o ZIP de 19.001.215 bytes confere com o `.zip.sha256` (`4c4bf3c7…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano, medidas e transparência corretas, nenhuma pasta do outro sexo e um rosto próprio por skin.

**Aprovado:** S04 inteiro e S03 menos o Labão.
- As adaptações de Finéias (lança em repouso), das filhas de Zelofeade (uma mulher que representa as cinco irmãs) e de Eliézer (joias na bolsa, corda e notas sobre Gn 24) foram respeitadas.
- O fio escarlate de Raabe, a túnica de Ana, o arco e o manto de Jônatas, as espigas de Boaz e a idade de Matusalém e Noemi estão corretos.
- Os contrastes de tom de pele estão bons em todas as outras skins.

**Migrações:** `20261202001400_skins_s03.sql` e `20261202001500_skins_s04.sql`. O app passa a 109 skins pintadas.

**Correção pedida (S03_v2): `raro_labao`.** Os três estilos ficaram numa faixa estreita, de pele média a escura. A comparação está em `docs/skins/entregas/S03/Tons_a_corrigir.png`.
- **estilo-2** (tom 2, longo liso): está em tom médio, quase igual ao estilo-1. Clarear para tom 2 claro, como o Eliézer estilo-1 ou as filhas de Zelofeade estilo-1.
- **estilo-1** (tom 4, crespo volumoso): deixar num tom 4 médio, visivelmente entre o estilo-2 claro e o estilo-3 escuro.
- **estilo-3** (tom 6): está correto e não muda.

Mantenha rosto, bigode, barba, cabelo, traje, cajado, IDs e âncoras. Mande o pacote S03 completo com os SHA-256 atualizados, sem migração.

### 25.1 S03_v2: tons do Labão corrigidos e aprovados (20/11/2026)

**Conferência**
- O ZIP de 19.910.116 bytes confere com o `.zip.sha256` (`a0cf8112…`) e as 69 somas conferem.
- Mudaram só os 5 arquivos anunciados: estilos 1 e 2 (base e @2x) e o ícone. Os outros 43 são idênticos, incluindo as fichas.

**Tons medidos na bochecha:** estilo-2 (tom 2) em 185, estilo-1 (tom 4) em 129 e estilo-3 (tom 6) em 69. A ordem clara, média e escura agora aparece de fato. Rosto, barba, cabelo, traje e cajado foram preservados.

**Integração:** só os arquivos alterados, sem migração nem mudança de catálogo, fichas ou regras.

**S03/S04 encerrados. Próximo: S05 e S06.**

## 26. Lotes S05 e S06: aplicados (20/11/2026), com 1 pintura de Baraque a corrigir

**Conferência**
- **S05_final:** o ZIP de 18.673.671 bytes confere com o `.zip.sha256` (`f8b53661…`) e as 68 somas conferem.
- **S06_final:** o ZIP de 19.869.775 bytes confere com o `.zip.sha256` (`f749c6b2…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano, medidas e transparência corretas e um único sexo por personagem.

**Aprovado:** S05 inteiro e S06 menos Baraque estilo-2.
- As seis adaptações de `6c28220` foram respeitadas: Abigail com a cesta e a corda, Rainha de Sabá com os presentes nas duas mãos, Baraque sozinho e em repouso, Eli em pé, Mical com a corda contínua e Ezequias com a carta.
- A coroa de Mardoqueu está no próprio texto de Et 8:15.
- Rostos próprios, inclusive Zorobabel distinto de Baraque.

**Migrações:** `20261202001600_skins_s05.sql` e `20261202001700_skins_s06.sql`. O app passa a 121 skins pintadas.

**Correção pedida (S06_v2): `raro_baraque` estilo-2** (tom 4, longo liso ruivo).
- A pele saiu tão clara quanto a do estilo-1 (tom 2), e os dois estilos ficaram quase iguais. A comparação está em `docs/skins/entregas/S06/Tons_a_corrigir.png`.
- Escurecer para tom 4 médio (como o Labão estilo-1 v2, cerca de `#AC764B`), visivelmente entre o estilo-1 claro e o estilo-3 (tom 5).
- Mantenha rosto, barba, cabelo, traje, escudo, IDs e âncoras.
- Mande o pacote S06 completo com os SHA-256 atualizados, sem migração.

**Pares de tons vizinhos aceitos como estão:** Eli (tom 4 e tom 5), Mical (tom 4 e tom 5), Ezequias (tom 2 e tom 3) e Joabe (tom 2 e tom 3). Estão visivelmente distintos, como pede o plano.

### 26.1 S06_v2: tom do Baraque (estilo 2) corrigido e aprovado (20/11/2026)

**Conferência**
- O ZIP de 20.140.718 bytes confere com o `.zip.sha256` (`e3eede42…`) e as 69 somas conferem.
- Mudaram só os 2 arquivos anunciados: o estilo-2 do Baraque, base e @2x. Os outros 46 são idênticos, incluindo fichas e ícones.

**Aprovado:** o estilo-2 agora está num tom 4 médio, entre o estilo-1 claro e o estilo-3 (tom 5). Rosto, barba, cabelo ruivo, traje e escudo foram preservados.

**Integração:** só os 2 arquivos alterados, sem migração nem mudança de catálogo, fichas ou regras.

**S05/S06 encerrados. Próximo: S07 e S08.**

## 27. Contrato infantil corrigido para S07/S08 (20/11/2026)

A regra do `cadd33a` fixava o topo da figura infantil em y≈216. Com os pés em y≈1450, isso desce o centro da cabeça para cerca de y≈355–367 e o queixo para y≈454–473, e o recorte do rosto corta a boca. A prova técnica do Codex (opção B) mostrou o problema.

**Vale a opção C:**
- Os mesmos três pontos do contrato adulto: centro da cabeça em y≈300, queixo em y≈391 e pés em y≈1450, com tolerância de ±12 e centro horizontal em x≈512.
- Anatomia infantil por escala uniforme, sem deformar cabeça ou corpo.
- Só o topo da figura (cabelo, coroa ou véu) pode ficar entre y≈120 e y≈170.
- As medidas das provas foram: menina com topo 147, centro 293, queixo 398; Joás com topo 127, centro 289, queixo 402. Conferir de novo nas pinturas finais e registrar os pontos reais na ficha.
- Nada muda no app, nos recortes, no catálogo, nos estilos, no banco ou nas regras.

S07/S08 ainda não foram entregues.

## 28. Lotes S07 e S08: aplicados e aprovados por inteiro (24/11/2026)

**Conferência**
- **S07_final:** o ZIP de 18.889.195 bytes confere com o `.zip.sha256` (`44eba6f3…`) e as 68 somas conferem.
- **S08_final:** o ZIP de 20.401.279 bytes confere com o `.zip.sha256` (`a419df9e…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano, medidas e transparência corretas e um único sexo por personagem.

**Contrato infantil:** a menina tem topo em 146, 142 e 159; Joás em 125, 125 e 161, todos dentro da faixa de 120 a 170. Pés em y≈1452. Os rostos inteiros cabem no recorte.

**Aprovado:** as oito adaptações de `cadd33a` e `59e7861`.
- Mefibosete com a muleta funcional e o pão, sem cura.
- Sunamita com a roupa de cama e a lamparina.
- Menina e Joás com anatomia infantil convincente.
- Jeosafá sozinho em louvor.
- Benaia em repouso, com manto de inverno.
- Valentes de Davi com um único representante.
- Zadoque com o chifre de azeite.

**Tons de pele:** a ordem clara, média e escura está certa nas 12 skins. Nos valentes de Davi, a barba ruiva enganou a medida automática, mas na comparação visual o tom 1 está claro.

**Migrações:** `20261202001800_skins_s07.sql` e `20261202001900_skins_s08.sql`. O app passa a 133 skins pintadas.

**Próximo: S09 e S10.**

**Ciclo S07/S08 fechado e verde (`0b0b02f`):**
- 138 testes unitários e 592 verificações SQL.
- Auditoria com as 133 skins pintadas.
- Fluxos marco1, journey, lobby e fixes.
- 577 verificações no Supabase local.
- Compras simultâneas: uma compra, uma recusa, saldo final 0.

## 29. Lotes S09 e S10: aplicados (24/11/2026), com 2 pinturas a corrigir

**Conferência**
- **S09_final:** o ZIP de 19.226.379 bytes confere com o `.zip.sha256` (`3249052d…`) e as 68 somas conferem.
- **S10_final:** o ZIP de 18.727.201 bytes confere com o `.zip.sha256` (`5d040b6e…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano, medidas e transparência corretas e um único sexo por personagem.

**Adaptações aprovadas e registradas no plano:**
- Hemã e Jedutum: um único músico com lira.
- Obede-Edom: chave e gesto acolhedor, sem a Arca.
- Mulher virtuosa: roca e fuso, sem roda de fiar.
- O Pregador: ampulheta como alegoria.
- Ido: sem afirmar que é a mesma pessoa de Zc 1:1.
- A amada: mulher adulta.

**Aprovado:** 10 das 12 skins. Em Agur (tons 4 e 5) e Ciro (tons 2 e 3), os tons são vizinhos no plano e aparecem distintos a olho.

**Migrações:** `20261202002000_skins_s09.sql` e `20261202002100_skins_s10.sql`. O app passa a 145 skins pintadas.

**Correções pedidas:**
- **S09_v2, `raro_obede_edom` estilo-2** (tom 3, longo mel): a pele está tão clara quanto a do estilo-1 (tom 1). Escurecer para tom 3 médio, entre o estilo-1 e o estilo-3 (tom 6). Comparação em `docs/skins/entregas/S09/Tons_a_corrigir.png`.
- **S10_v2, `epico_o_pregador` estilo-3** (tom 3, cacheado mel): está quase idêntico ao estilo-1 (tom 2, crespo louro), com a mesma pele e o mesmo volume afro. Pintar a pele em tom 3 visivelmente médio e o cabelo com cachos definidos e soltos, não crespo volumoso, em mel, com a barba da mesma cor. Comparação em `docs/skins/entregas/S10/Tons_a_corrigir.png`.

Mantenha rosto, traje, objetos, IDs e âncoras. Mande os pacotes S09 e S10 completos com os SHA-256 atualizados, sem migração.

### 29.1 S09_v2 e S10_v2: correções aprovadas (24/11/2026)

**Ciclo base de S09/S10 fechado e verde (`dcdd3a5`):**
- 138 testes unitários, 592 verificações SQL e auditoria com as 145 skins pintadas.
- Fluxos marco1, journey, lobby e fixes.
- 577 verificações no Supabase local, incluindo as compras simultâneas com saldo final 0.

**S09_v2**
- O ZIP de 19.929.927 bytes confere com o `.zip.sha256` (`b3072d85…`) e as 69 somas conferem.
- Mudou só o estilo-2 de Obede-Edom (base e @2x), agora em tom 3 médio, entre o estilo-1 claro e o estilo-3 escuro.

**S10_v2**
- O ZIP de 19.455.304 bytes confere com o `.zip.sha256` (`aac1e7e3…`) e as 69 somas conferem.
- Mudou só o estilo-3 do Pregador (base e @2x): pele em tom 3, cachos soltos e definidos em mel, já distinto do crespo louro do estilo-1.

Os outros 46 arquivos de cada pacote são idênticos aos anteriores, incluindo fichas e ícones. Integração sem migração nem mudança de catálogo, fichas ou regras.

**S09/S10 encerrados. Próximo: S11 e S12.**

## 30. Adaptações de S11/S12 registradas antes da produção (24/11/2026)

Registradas no plano e na linha **Adaptação** do LOTES.md, sem mudar IDs, nomes, sexo, estilos, referências ou regras:
- **Filhos de Corá:** um único cantor com lira.
- **Sadraque, Mesaque e Abede-Nego:** um único representante, com manto e turbante intactos, sem fogo, cordas nem figura divina.
- **Oseias:** lírio com orvalho pintado dentro da silhueta.
- **Joel:** shofar em repouso e chuva em bordado discreto.
- **Amós:** cajado e ramo de sicômoro com figos.
- **Miqueias:** roupa rural e cajado, sem balança.
- **Habacuque:** tábuas lisas e cálamo, sem torre.
- **Ageu:** duas peças de madeira plausíveis.
- **Zacarias:** lampadário com sete lâmpadas e dois ramos de oliveira, sem candelabro de nove braços.
- **Lemuel e Etã:** rolo simples, sem escrita nem identidade inventada.
- **Eliú:** adulto jovem, nem criança nem ancião.

Os estilos continuam exatos, inclusive os locs de personagens que não são apóstolos, com pele clara, média e escura visivelmente distintas. S11/S12 ainda não foram pintados.

## 31. Lotes S11 e S12: aplicados (24/11/2026), com 3 pinturas a corrigir

**Conferência**
- **S11_final:** o ZIP de 18.577.088 bytes confere com o `.zip.sha256` (`7ebe5285…`) e as 68 somas conferem.
- **S12_final:** o ZIP de 21.215.477 bytes confere com o `.zip.sha256` (`bee61395…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano, medidas e transparência corretas e são todas masculinas.

**Adaptações do §30 respeitadas:**
- Corá: um único cantor com lira.
- Os três amigos: um único representante, com turbante nos 3 estilos e sem fogo.
- Oseias: lírio.
- Joel: shofar.
- Amós: cajado e sicômoro com figos.
- Miqueias: cajado.
- Habacuque: tábuas e cálamo.
- Ageu: madeira plausível.
- Zacarias: lampadário com as sete lâmpadas e dois ramos de oliveira.
- Eliú: adulto jovem.

**Aprovado:** 10 das 12 skins. Em Joel e Corá os tons aparecem distintos a olho.

**Migrações:** `20261202002200_skins_s11.sql` e `20261202002300_skins_s12.sql`. O app passa a 157 skins pintadas.

**Correções pedidas:**
- **S11_v2, `raro_eta_o_ezraita`:** os três estilos ficaram numa faixa média estreita. Comparação em `docs/skins/entregas/S11/Tons_a_corrigir.png`.
  - **estilo-1** (tom 2, cacheado): clarear para tom 2 claro.
  - **estilo-2** (tom 5, crespo volumoso ruivo): escurecer para tom 5 escuro.
  - **estilo-3** (tom 4) fica como está.
- **S12_v2, `epico_habacuque` estilo-3** (tom 2, crespo volumoso): saiu mais escuro que o estilo-1 (tom 3), com a ordem invertida. Clarear para tom 2 claro, como o Ageu estilo-1 ou o Amós estilo-2. Comparação em `docs/skins/entregas/S12/Tons_a_corrigir.png`.

Mantenha rosto, barba, cabelo, traje, objetos, IDs e âncoras. Mande os pacotes S11 e S12 completos com os SHA-256 atualizados, sem migração.

### 31.1 S11_v2 e S12_v2: correções aprovadas (24/11/2026)

**Ciclo base de S11/S12 fechado e verde (`fba0605`):**
- 138 testes unitários, 592 verificações SQL e auditoria com as 157 skins pintadas.
- Fluxos marco1, journey, lobby e fixes.
- 577 verificações no Supabase local, incluindo as compras simultâneas com saldo final 0.

**S11_v2**
- O ZIP de 19.176.176 bytes confere com o `.zip.sha256` (`f849b615…`) e as 69 somas conferem.
- Mudaram só os 5 arquivos anunciados: estilos 1 e 2 de Etã (base e @2x) e o ícone.
- Tons medidos na testa: estilo-1 (tom 2) em 205, estilo-3 (tom 4) em 151 e estilo-2 (tom 5) em 112. A ordem clara, média e escura está certa.

**S12_v2**
- O ZIP de 21.921.745 bytes confere com o `.zip.sha256` (`04dc1735…`) e as 69 somas conferem.
- Mudou só o estilo-3 de Habacuque (base e @2x), agora em tom 2 claro, mais claro que o estilo-1 (tom 3).

Os demais arquivos são idênticos, incluindo as 12 fichas. Integração sem migração nem mudança de catálogo, fichas ou regras.

**S11/S12 encerrados. Próximo: S13 e S14.**

## 32. Adaptações de S13/S14 registradas antes da produção (25/11/2026)

As 12 propostas foram confirmadas sem ajustes e registradas no plano e na linha **Adaptação** do LOTES.md. IDs, nomes, sexo, estilos, referências e regras não mudaram.

**S13**
- **Baruque:** rolo sem letras, cálamo e tinteiro na cintura.
- **Obadias:** rolo selado sem inscrição.
- **Naum:** arauto com manto de montes, sem pedestal.
- **Sofonias:** alegria serena, sem representar o Senhor.
- **Malaquias:** rolo aberto sem escrita.
- **Ebede-Meleque:** corda e trapos; oficial etíope na nota; estilos exatos.

**S14**
- **Recabitas:** um único representante com tecido de tenda e odre de água.
- **Dario, o medo:** diadema baixo e decreto sem escrita.
- **Hananias, Misael e Azarias:** um único adulto jovem com rolo de estudo.
- **Aspenaz:** rolo fechado e gesto acolhedor.
- **Gemarias:** gesto de escuta, com a nota precisa sobre Jr 36:10-12.
- **Marta:** avental e jarra, penteado visível e só apresentação feminina.

S13/S14 ainda não foram pintados.

## 33. Lotes S13 e S14: aplicados (25/11/2026), com 3 pinturas a corrigir

**Conferência**
- **S13_final:** o ZIP de 18.278.064 bytes confere com o `.zip.sha256` (`2f76c31c…`) e as 68 somas conferem.
- **S14_final:** o ZIP de 17.501.017 bytes confere com o `.zip.sha256` (`5f7767a9…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano e medidas e transparência corretas. Marta aparece só feminina e os demais só masculinos.

**Adaptações do §32 respeitadas:**
- Baruque: tinteiro na cintura.
- Naum: montes só na borda do manto.
- Sofonias: alegria humana, sem representar o Senhor.
- Ebede-Meleque: corda e trapos.
- Recabitas e Hananias, Misael e Azarias: um único representante cada.
- Dario: diadema baixo.
- Gemarias: nota precisa sobre Jr 36:10-12.
- Marta: jarra com duas mãos e penteado visível.

**Aprovado:** 9 das 12 skins.

**Migrações:** `20261202002400_skins_s13.sql` e `20261202002500_skins_s14.sql`. O app passa a 169 skins pintadas.

**Correções pedidas:**
- **S13_v2, `raro_malaquias` estilo-3** (tom 1, curto ruivo): está quase igual ao estilo-2 (tom 3), com a mesma pele rosada média. Clarear para tom 1, como o Jônatas estilo-3. Comparação em `docs/skins/entregas/S13/Tons_a_corrigir.png`.
- **S14_v2, `epico_marta` estilo-3 e `raro_gemarias` estilo-3** (ambos tom 6): estão em tom médio, mais claros até que o Aspenaz estilo-2 (tom 5). O tom 6 é o mais escuro do catálogo. Escurecer até a referência Raabe estilo-1. Comparação em `docs/skins/entregas/S14/Tons_a_corrigir.png`.

Mantenha rosto, cabelo, barba, traje, objetos, IDs e âncoras. Mande os pacotes S13 e S14 completos com os SHA-256 atualizados, sem migração.

### 33.1 S13_v2 e S14_v2: correções aprovadas (25/11/2026)

**Ciclo base de S13/S14 fechado e verde (`15ff838`):**
- 138 testes unitários, 592 verificações SQL e auditoria com as 169 skins pintadas.
- Fluxos marco1, journey, lobby e fixes.
- 577 verificações no Supabase local, incluindo as compras simultâneas com saldo final 0.

**S13_v2**
- O ZIP de 18.849.279 bytes confere com o `.zip.sha256` (`8c53c42a…`) e as 69 somas conferem.
- Mudou só o estilo-3 de Malaquias (base e @2x), agora em tom 1 claro.
- Brilho da testa (média dos pixels de pele): 168, contra 120 no estilo-2 (tom 3).

**S14_v2**
- O ZIP de 18.778.798 bytes confere com o `.zip.sha256` (`e930d1fc…`) e as 69 somas conferem.
- Mudaram só os estilos-3 de Marta e Gemarias (base e @2x), agora em tom 6 escuro, perto da referência Raabe estilo-1.
- Brilho medido (testa e pescoço): Marta 88 e 50, Gemarias 93 e 48.

Os demais arquivos são idênticos, incluindo as 12 fichas e os 12 ícones. Integração sem migração nem mudança de catálogo, fichas ou regras.

**S13/S14 encerrados. Próximo: S15 e S16.**

## 34. Adaptações de S15/S16 registradas antes da produção (25/11/2026)

As 12 propostas foram confirmadas sem ajustes e registradas no plano e na linha **Adaptação** do LOTES.md. IDs, estilos, apresentações (8 masculinas e 4 femininas) e regras não mudaram.

**Contrato reafirmado para estes lotes:**
- Mesmo 2.5D pintado, com luz superior esquerda, RGBA transparente sem névoa, figura inteira em pé e as mesmas âncoras.
- Um rosto próprio por skin, preservado nos 3 estilos.
- Tons 1/2, 3/4 e 5/6 claramente distintos, com referência de tom 1 em Jônatas estilo-3 e de tom 6 em Raabe estilo-1.
- `hair-wavy` é ondulado médio, diferente de curto, longo e cacheado.
- Idosos não ficam grisalhos automaticamente: o envelhecimento vai no rosto.
- Rostos e idades aparentes são direção artística.
- Personagens de parábola são identificados como tais.

**Pontos confirmados em especial:**
- **Zaqueu:** quadro e âncoras normais; a baixa estatura fica só na nota, sem mudar o renderer.
- **Bom samaritano:** o jumento fica só na nota narrativa, evocado pela correia de viagem, sem animal desenhado.
- **Zacarias, o sacerdote:** incensário portátil sem fumaça e turbante baixo de linho nos 3 estilos, com os penteados exatos visíveis, sem peitoral de sumo sacerdote.
- **Simeão:** mãos vazias em louvor, sem bebê nem qualquer figura ou volume no lugar de Jesus.

**Demais skins:**
- Maria de Betânia: frasco de nardo intacto e fechado.
- Lázaro: depois de desatado, sem horror.
- Nicodemos: lâmpada e recipiente de resinas, cabeça descoberta.
- José de Arimateia: linho limpo e dobrado.
- Samaritana: cântaro pousado no chão.
- Mulher do perfume: alabastro de gargalo partido e rosto distinto de Maria de Betânia.
- Filho pródigo: anel, sandálias e melhor roupa.
- Isabel: idosa em louvor, com gravidez discreta.

S15/S16 ainda não foram pintados.

## 35. Direção de figurino: complemento do §34 (25/11/2026)

**Pedido do usuário:** variar tecidos, cortes, cores e acabamentos conforme a época, a região e a função de cada personagem. O exemplo dado foi Nicodemos, um fariseu que deve ter visual próprio. Não basta trocar o pigmento do mesmo manto bordado.

**Regra geral** (`regras.figurino` no plano, mostrada no topo do LOTES.md):
- Antes das bases de cada lote, pesquisar época, região e função de cada skin.
- Registrar para cada uma: corte e silhueta, fibra e trama, forma de prender, paleta, acabamento e desgaste, e um objeto próprio.
- Raridade não significa ouro obrigatório.
- Os 3 estilos de uma skin mantêm a mesma identidade e o mesmo traje, com tons e cabelos exatos do catálogo. A variedade de figurino vem sobretudo de uma skin para outra.
- Lendárias e Gloriosas continuam especiais, sem misturar épocas nem copiar o mesmo rosto ou manto.
- Cores e cortes são direção artística. As fontes apoiam famílias de material e estrutura, não cada figurino em particular.
- Para a Judeia romana, a referência é o relatório da IAA sobre Nahal Arugot (linho de trama simples, lã e faixas tecidas). Não usar peças coptas de séculos posteriores.

**Figurinos registrados** (campo `figurino` no plano, linha **Figurino** no LOTES.md):
- **Nicodemos:** túnica de linho azul-tinta lisa, manto retangular de lã crua com faixas índigo e franjas nos cantos (Nm 15:38-39; Dt 22:12), faixa simples e cabeça descoberta.
  - É uma interpretação plausível, não uma farda farisaica: Mt 23:5 cita franjas, mas não define uniforme.
  - Sem tallit, quipá ou roupa rabínica moderna, sem estrela de Davi e sem peitoral.
  - Refazer só o figurino. Rosto, idade, os 3 estilos, pose, lâmpada, recipiente e âncoras ficam como estão.
- **Mulher do perfume:** linho âmbar ou ocre de pregas estreitas e xale ameixa em diagonal, sem ouro e sem o manto em U de Maria.
- **Bom samaritano:** túnica de linho cru até os joelhos e manto de lã grossa ferrugem e areia, preso num ombro. Couro funcional, marcas de uso e cerzido, sem bordado dourado.
- **Filho pródigo:** túnica clara com faixas púrpura estreitas e manto de lã fina vinho, com caimento assimétrico. O valor está na qualidade e no caimento, não em ouro.
- **Zacarias, o sacerdote:** linho marfim de pregas retas, faixa azul, púrpura e carmesim e turbante baixo. Sem manto extra nem ouro que lembre o sumo sacerdote.
- **Isabel:** linho rosa antigo dessaturado, xale de lã verde-musgo gasto e remendo sutil, sem luxo.
- **Simeão:** lã areia ou cinza-quente, manto castanho-oliva envelhecido com franjas curtas, sem ouro.

Nada muda em app, banco, IDs, estilos ou regras de concessão.

## 36. Lotes S15 e S16: aplicados (25/11/2026), com 2 pinturas a corrigir

**Conferência**
- **S15_final:** o ZIP de 18.053.048 bytes confere com o `.zip.sha256` (`14ad1061…`) e as 68 somas conferem.
- **S16_final:** o ZIP de 15.947.926 bytes confere com o `.zip.sha256` (`0dedbb50…`) e as 68 somas conferem.
- As 36 pinturas têm estilos idênticos ao plano e medidas e transparência corretas.
- Há 8 skins masculinas e 4 femininas, cada uma só no próprio sexo.

**Figurinos do §35 aprovados**
- Nicodemos foi refeito: túnica azul-tinta lisa, manto cru com faixas índigo e cordões, sem ouro nem elementos modernos.
- Mulher do perfume, bom samaritano, filho pródigo, Zacarias, Isabel e Simeão estão bem distintos entre si e sem ouro repetido.

**Adaptações do §34 respeitadas**
- Lázaro já desatado e sem horror.
- José de Arimateia com o linho dobrado.
- Zaqueu adulto, no quadro normal.
- Samaritana com o cântaro no chão.
- Mulher do perfume com o alabastro partido.
- Bom samaritano sem jumento desenhado.
- Zacarias com incensário sem fumaça.
- Simeão com as mãos vazias, sem bebê.

**Aprovado:** 10 das 12 skins.

**Migrações:** `20261202002600_skins_s15.sql` e `20261202002700_skins_s16.sql`. O app passa a 181 skins pintadas.

**Correções pedidas** (medidas no ponto fixo da cabeça, com comparações em `entregas/S15` e `entregas/S16`):
- **S15_v2, `epico_zaqueu` estilo-2** (tom 2, longo liso): está tão médio quanto o estilo-1 (tom 4), com os dois medindo 111. Clarear para tom 2, como o Ageu estilo-1.
- **S16_v2, `epico_simeao` estilo-1** (tom 1, longo liso ruivo): saiu rosado médio, perto do estilo-3 (tom 4). Clarear para tom 1, como o Jônatas estilo-3 ou o filho pródigo estilo-1.

Mantenha rosto, idade, cabelo, barba, figurino, objetos, IDs e âncoras. Mande os pacotes S15 e S16 completos com os SHA-256 atualizados, sem migração.
