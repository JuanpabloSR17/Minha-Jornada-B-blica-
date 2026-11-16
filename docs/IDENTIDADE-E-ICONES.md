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

### Tipografia e ícones da interface

- Títulos curtos em **Cinzel**; todo o texto corrido em **Atkinson Hyperlegible Next**, a partir do Medium (17/26), com SemiBold e Bold reais. Fontes em `assets/fonts/` (OFL).
- Ícones em dois tons com referências bíblicas: tenda, rolo de mapa, Bíblia aberta, banca, túnica, coroa de louros, pedras memoriais, vaso do maná, lâmpada, tabernáculo com a nuvem e siclo. Folha em [`lobby/lb-04-icones.png`](lobby/lb-04-icones.png).
- Para continuar a repaginação com o Codex, veja [`CODEX-REPAGINACAO.md`](CODEX-REPAGINACAO.md).

### Lobby do jogo (Início)

O acampamento é o lobby. Cada função tem um lugar fixo, como num jogo:

| Área | O que mostra | Leva a |
|---|---|---|
| HUD (topo) | retrato, nome, nível e barra de XP; Siclos; capítulos lidos | retrato → Perfil; Siclos → Mercado |
| Trilho lateral | Loja, Vestiário, Troféus, Marcos (2 × 2 em telas baixas) | Mercado, guarda-roupa, Santuário, Marcos dos Santos |
| Painel de jogar | selo "Modo Missão", próxima leitura, meta de hoje e o botão principal | missão ou escolha de capítulo |
| Missão diária | meta, progresso e recompensa prevista | Alterar meta |
| Modos de jogo | Modo Missão, Mapa dos mundos, Marcos dos Santos, Santuário, com o progresso da conta | Ler, Jornada, Marcos, Santuário |
| Doca | abas com o medalhão dourado de leitura no centro | Início, Jornada, Ler, Amigos, Perfil |

O nível é só de exibição: sai do XP já registrado no servidor (`src/features/lobby/level.ts`; subir do
nível n custa 200 + 100 × (n − 1) XP) e não concede nada. Percurso: `FLOW=lobby bash e2e/run.sh`
(320 e 412 px, botão principal sem rolagem, cada função no seu destino). Capturas em [`lobby/`](lobby/).

### Telas na identidade

| Tela | Situação |
|---|---|
| Início (acampamento), marco, leitura, recompensa/revelação, Santuário, Jornada (Codex) | ✔ |
| **Criador de personagem** e **guarda-roupa** | ✔ desta entrega: base índigo, ação dourada, seleção neon violeta; sem rolagem lateral em 320 e 412 px |
| **Ler (Modo Missão)** | Passagem escolhida no topo e livros agrupados pelos sete mundos |
| **Perfil** | Capítulos e livros lidos, marcos, Santos e medalhas dos mundos registrados no servidor |
| **Mercado** | Vitrine ilustrada, molduras de raridade e ofertas do dia com contagem para a próxima troca |
| Configurações, autenticação, onboarding | por último: legibilidade em primeiro lugar |

Regras mantidas: ação principal visível sem rolagem em 320 px; movimento reduzido (`reduceMotion`) desliga
fogo, brilho e respiração; alvos de toque ≥ 44 px.

## 2. Ícones por ID canônico

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

| Cobertura do catálogo v8 | Quantidade |
|---|---:|
| Itens no app | 185 |
| Miniaturas com composição por ID no registro | 182 |
| Arte de artefato reutilizada na miniatura | 3 |
| Itens elegíveis para o Mercado com miniatura | 25 |

São 144 itens oficiais e 41 adicionais do app. Entre os oficiais são 22 Comuns, 18 Raros, 16 Épicos,
66 Lendários e 22 Santos. Os 66 Lendários trazem a sigla do livro para distinguir recompensas de
nomes ou formatos semelhantes. As formas de cada família são reutilizadas com materiais, símbolos
e paletas escolhidos por item. O tamanho pequeno prioriza a silhueta e o contraste.

Miniatura de inventário e sprite vestido têm coberturas próprias. A folha de revisão de todas as
miniaturas está em `/dev/avatar-lab?icons=48`. O teste `src/features/avatar/__tests__/icons.test.ts`
compara o registro e os artefatos com todos os IDs do catálogo vigente.
