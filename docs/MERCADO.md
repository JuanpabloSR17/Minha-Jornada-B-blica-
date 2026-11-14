# Mercado dos Viajantes

O jogador troca os Siclos que recebe ao cumprir a meta diária (40 por meta) por itens cosméticos.
Entrada: botão **Mercado dos Viajantes** no Início (`/market`).

## Vitrine diária

Às **21h no horário de Brasília**, o servidor troca a seleção para todas as contas. A tela mostra
quanto falta para a virada e atualiza ao chegar a hora ou ao reabrir o Mercado.

- **7 itens do dia:** dois Comuns de vestir, três Comuns de outras categorias e dois Raros.
- **4 permanentes:** Cantil de Água, Ferramenta da Colheita, Lamparina de Barro e Túnica de Linho Cru.
- Os Comuns da vitrine são embaralhados pela data. Os Raros percorrem uma fila embaralhada, dois
  por dia, garantindo que a composição mude a cada virada enquanto houver mais de dois Raros.
- O jogador vê a peça e o preço antes de confirmar. A compra concede a peça exibida.

## Catálogo elegível

Somente Comuns e Raros ativos que o catálogo vigente marca para venda (`cosmetic_items.shop_eligible`,
vindo de `loja: true` no catálogo oficial v2), fora das peças iniciais e Premium.
Preço = `shop_price_suggested` (`preco_siclos_sugerido` do catálogo oficial).

- **25 itens elegíveis** (20 Comuns e 5 Raros), todos com preço definido.
- O catálogo oficial marca 27 itens com `loja: true`. Os 2 que ficam de fora são as peças iniciais
  **Sandálias de Couro** (`sandals-leather`, oficial `common_sandalias_de_couro`, 100) e **Cinto de
  Corda** (`belt-rope`, oficial `common_cinto_de_corda`, 160): todo jogador já os recebe de graça.
- Item elegível sem preço: aparece como "Preço a definir" e a compra é recusada (`price_not_defined`).
  Hoje não há nenhum.

| Item | ID | Raridade | Preço (Siclos) |
|---|---|---|---:|
| Cantil de Água | `common_cantil_de_agua` | Comum | 80 |
| Ferramenta da Colheita | `common_ferramenta_da_colheita` | Comum | 80 |
| Lamparina de Barro | `common_lamparina_de_barro` | Comum | 80 |
| Túnica de Linho Cru | `common_tunica_de_linho_cru` | Comum | 80 |
| Bolsa de Sementes | `common_bolsa_de_sementes` | Comum | 100 |
| Manto de Viagem | `common_manto_de_viagem` | Comum | 100 |
| Pergaminho Simples | `common_pergaminho_simples` | Comum | 100 |
| Cesta de Pães | `common_cesta_de_paes` | Comum | 120 |
| Pano de Cabeça | `common_pano_de_cabeca` | Comum | 120 |
| Pote de Barro | `common_pote_de_barro` | Comum | 120 |
| Vara de Pastor | `common_vara_de_pastor` | Comum | 120 |
| Bolsa do Viajante | `common_bolsa_do_viajante` | Comum | 140 |
| Rede de Pesca | `common_rede_de_pesca` | Comum | 140 |
| Sandálias de Corda | `common_sandalias_de_corda` | Comum | 140 |
| Sandálias de Estrada | `common_sandalias_de_estrada` | Comum | 140 |
| Corda de Trabalho | `common_corda_de_trabalho` | Comum | 160 |
| Faixa de Tecido | `common_faixa_de_tecido` | Comum | 160 |
| Cajado de Caminhada | `common_cajado_de_caminhada` | Comum | 180 |
| Cesto de Junco | `common_cesto_de_junco` | Comum | 180 |
| Túnica de Trabalhador | `common_tunica_de_trabalhador` | Comum | 180 |
| Bolsa do Mensageiro | `rare_bolsa_do_mensageiro` | Raro | 350 |
| Flauta do Músico | `rare_flauta_do_musico` | Raro | 400 |
| Manto de Lã do Pastor | `rare_manto_de_la_do_pastor` | Raro | 400 |
| Sandálias do Peregrino | `rare_sandalias_do_peregrino` | Raro | 400 |
| Instrumento de Cordas | `rare_instrumento_de_cordas` | Raro | 450 |

## Compra

Tudo na mesma transação, sob a mesma trava do jogador usada por missões, meta diária e escolha gratuita:

1. Resolve o **ID canônico** (aliases e IDs antigos, ex.: `net-fishing` → `common_rede_de_pesca`).
2. Confere disponibilidade no catálogo, posse pela identidade canônica e validade da oferta
   (`market_offer_expired`). Na versão atual do app, o servidor também compara o dia e o preço
   apresentados na confirmação (`market_price_changed`). Em seguida, confere o saldo.
3. Debita (`siclos_ledger`, `MARKET_PURCHASE`, `purchase:<id>`, valor negativo) e concede
   (`user_items`, origem `purchase:<id>`). Se qualquer passo falhar, nada muda: saldo e posse ficam como estavam.
4. Registra a compra (`market_purchases`, única por jogador e item) com o resultado.

**Idempotência:** o ID da compra é gerado no app e guardado no aparelho até a resposta chegar.
Reenviar a mesma compra devolve o resultado registrado (`duplicate = true`) sem novo débito.
Se a conexão cair, o Mercado mostra "Compra aguardando confirmação" (também depois de fechar e
reabrir o app) com **Verificar compra**.

**Concorrência:** compras simultâneas em dois aparelhos (mesma compra, mesmo item com outro ID ou
itens diferentes disputando o saldo) resultam em no máximo uma concessão e um débito por item, e o
saldo nunca fica negativo. Compra e escolha gratuita do mesmo item: só uma vence; a outra recebe
`item_already_owned` sem débito.

**Escolha gratuita × compra:** antes de abrir a confirmação, o app atualiza a vitrine; se o item foi
obtido pela escolha gratuita (ou em outro aparelho) até a confirmação, o servidor recusa e a tela
passa a mostrar "Obtido", sem gastar Siclos. A escolha pendente da meta deixa de oferecer itens
comprados. A escolha gratuita também passou a reconhecer posse por ID antigo.

`public.get_market()` devolve saldo, a vitrine atual com preços e posse, a próxima virada e as
compras registradas. A migração `20261123000100_market_rotation.sql` funciona sobre o catálogo
vigente e o histórico existente. A reversão restaura a vitrine anterior com as compras preservadas.
