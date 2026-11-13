# Interface de jogo e ícones dos itens

## 1. Identidade visual (tokens)

`cinemaColors` em `src/theme/tokens.ts`, aplicado com `<CinemaTheme>`:

| Papel | Valor |
|---|---|
| Base | índigo noturno `#0C1124` / superfícies `#1B1631`, `#251E3D` |
| Bronze (bordas fortes, moldura das peças iniciais) | `#C9A24A`, `#8C6A3A` |
| Dourado (ação principal, botão `gold`) | `#E9BA5B` → `#B47A22` |
| **Seleção e conquistas** (neon violeta, com brilho) | `selection` `#B48CFF` |
| **Foco** (azul frio) | `focus` `#8FC2FF` |
| Texto | `#F6ECD6` / secundário `#C9BBA0` (contraste ≥ 4,5:1 sobre as superfícies) |

O token `selection` também existe nos temas claro e escuro (igual ao `primary`), então os componentes
compartilhados (cartões de item, carrossel, abas, barra de categorias) usam a mesma propriedade em qualquer tela.

### Telas na identidade

| Tela | Situação |
|---|---|
| Início (acampamento), marco, leitura, recompensa/revelação, Santuário, Jornada (Codex), personagem 3D | ✔ |
| **Criador de personagem** e **guarda-roupa** | ✔ desta entrega: base índigo, ação dourada, seleção neon violeta; sem rolagem lateral em 320 e 412 px |
| Ler (Modo Missão) | próxima: envolver em `CinemaTheme`; trocar a grade de livros por cartões de mundo (reaproveitar `worlds.ts`); destacar a passagem escolhida com a moldura de bronze |
| Perfil | próxima: cabeçalho com o personagem no palco (2D ou 3D) e as placas de conquista (marcos, Santos, mundos) em neon violeta |
| Mercado | o Codex ilustrou a vitrine; falta só a moldura das miniaturas (já automática pelo `ItemIcon`) |
| Configurações, autenticação, onboarding | por último: legibilidade em primeiro lugar |

Regras mantidas: ação principal visível sem rolagem em 320 px; movimento reduzido (`reduceMotion`) desliga
fogo, brilho e respiração; alvos de toque ≥ 44 px.

## 2. Ícones por ID canônico (lote 1)

Registro em `src/features/avatar/art/icons.tsx`. Cada miniatura é desenhada para o seu ID, reconhecível pela
silhueta e pelos detalhes, com a raridade na moldura:
- **Bronze:** peça inicial.
- **Cinza:** comum.
- **Azul:** rara.
- **Roxo:** épica.
- **Laranja:** lendária.
- **Dourado:** Santo.

`ItemIcon` usa o registro em todas as telas (Mercado, recompensa, escolha da meta, guarda-roupa, detalhe,
coleções, Santuário, revelação), então a mesma arte aparece em todo lugar.

| | Quantidade |
|---|---:|
| IDs ativos | 185 |
| **Entregues neste lote** (prova 3D + iniciais + 25 do Mercado + 3 artefatos de Êxodo 25, sem repetição) | **63** |
| Faltam | 122 |

Os 122 que faltam, por raridade:

| Raridade | Faltam |
|---|---:|
| Lendários (um por livro) | 66 |
| Raros | 19 |
| Épicos | 18 |
| Santos sem arte | 19 |

E por tipo de peça:

| Tipo | Faltam |
|---|---:|
| Mão | 43 |
| Fundos | 14 |
| Mantos | 13 |
| Emblemas | 10 |
| Molduras | 10 |
| Cintura | 8 |
| Relíquias | 6 |
| Túnicas | 4 |
| Cabeça | 4 |
| Peitorais | 3 |
| Pescoço | 2 |
| Calçados | 2 |
| Efeitos | 2 |
| Costas | 1 |

Validação: `src/features/avatar/__tests__/icons.test.ts` exige miniatura para todos os 63 prioritários e confere
os IDs. A folha de revisão visual em 48 e 64 px está em `/dev/avatar-lab?icons=64` e `?icons=48`
(capturas em `docs/icones/`).

Próximos lotes sugeridos:
1. Os 19 Santos sem arte (a mesma linguagem dos artefatos) e os 18 épicos.
2. Os 66 lendários: um molde de ícone por livro, com o símbolo do livro.
3. Fundos, molduras e efeitos.

As miniaturas das peças com modelo 3D devem passar a ser renderizadas do próprio modelo (PNG 512² pedido em
`docs/MODELO-3D.md`) quando ele chegar.
