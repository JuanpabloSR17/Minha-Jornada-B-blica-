# Produção de skins por lotes

**Objetivo (meta de lançamento):** ter no app **todas as 288 skins da enciclopédia**, mais o Peregrino do Êxodo, antes de abrir o app para o público. Os personagens se conquistam lendo; os ofícios e trajes de corte vêm do Mercado dos Viajantes. O Codex pinta **um lote por vez**, sem sobrecarga. O Claude confere cada entrega, aplica, coloca as skins no app com a regra de leitura, roda a auditoria em todas as abas e atualiza o painel.

## Arquivos

| Arquivo | Para quê |
|---|---|
| [`plano-lotes.json`](./plano-lotes.json) | O plano: lotes, IDs, nomes, referências, ideia do traje, apresentação, 3 estilos e regra de leitura de cada skin. Vem da Enciclopédia de Skins Bíblicas (288 skins). |
| [`LOTES.md`](./LOTES.md) | **Briefing para o Codex**, só com o que falta pintar, lote a lote. |
| [`STATUS.md`](./STATUS.md) | **Painel:** o que está pronto no app, pintado, sem pintura ou a produzir. |
| `scripts/skin-status.mjs` | Regera o `STATUS.md` e o `LOTES.md` a partir do repositório. |
| `scripts/skins-add-lot.mjs <LOTE>` | Coloca no app as skins pintadas de um lote: catálogo `principais.json` e migração aditiva com as regras de leitura. |
| `e2e/skins-audit.flow.cjs` | **Auditoria:** com uma skin pintada vestida, confere a pintura em cada tela (Início, retrato do HUD, Perfil, Vestiário, Amigos, cartão público, outra conta, loja, mundos, cadastro e troca de apresentação). |

## Ordem dos lotes (plano completo)

| Fase | Lotes | Conteúdo | Skins |
|---|---|---|---|
| Temporada 1 (Êxodo) | T1-A a T1-D | **Concluída**: as 26 skins pintadas e no app | 26 |
| Principais | P01–P10 | Lendárias e Gloriosas de todos os mundos: patriarcas, juízes, reis, profetas, apóstolos e os momentos marcantes | 59 |
| Personagens | S01–S25 | Épicas e Raras que são personagens, na ordem de leitura dos mundos: Raquel, Lia, Calebe, Rute e Boaz, Ana, Jônatas, Abigail, Naamã, os profetas menores, Marta, Maria de Betânia, Lázaro, Zaqueu, Barnabé, Timóteo, Lídia… | 147 |
| Ofícios | O01–O08 | Os ofícios da Bíblia que ainda faltam (pescador, oleiro, escriba, médico, centurião…), para a loja | 47 |
| Realeza | R01–R02 | Rainha Candace, reis Asa, Uzias e Jotão, filhas de Jó e os trajes de corte (rei, rainha, príncipe, princesa) | 10 |

São **47 lotes** a produzir, com 263 skins novas e cerca de 790 pinturas, mais as versões femininas das 54 figuras genéricas. O briefing exato de cada lote está em [`LOTES.md`](./LOTES.md).

**Ritmo sugerido:** até 2 lotes por entrega (12 skins, cerca de 36 pinturas), em ZIPs de até 30 MB. Antes do lançamento, o painel `STATUS.md` precisa mostrar 289 de 289.

## Como se conquista (regras no servidor)

| Skin | Regra | Exemplo |
|---|---|---|
| **Lendária** (personagem principal) | Ler a história do personagem (os capítulos dele) ou concluir o livro dele | Vestes de José: Gênesis 37–50 · Vestes de Rute: concluir Rute |
| **Gloriosa** (momento marcante) | Concluir o **mundo** do momento, como decidido na enciclopédia | Elias no carro de fogo: concluir Terra e Reinos |
| **Épica ou Rara que é personagem** | Ler os capítulos da história do personagem (as referências da enciclopédia) | Traje de Raquel: Gênesis 29 · Traje de Zaqueu: Lucas 19 |
| **Ofício ou traje de corte** (Comum, Raro ou Épico) | Mercado dos Viajantes, com Siclos (Comuns e Raros na vitrine do dia, Épicos na Épica da semana) | Pescador: 160 Siclos |

Uma skin **entra no app quando a pintura é aprovada**, para que toda skin visível já esteja pintada. As da Temporada 1 já estão no catálogo e mostram o traje provisório até a pintura chegar.

## Estilo (obrigatório)

- O mesmo **2.5D pintado** dos lotes aprovados: Lote A, Lote B e o Moisés revisado.
- Contrato técnico de `TEMPORADA-1-EXODO.md` §2:
  - corpo de 1024 × 1536 com fundo transparente, mais a versão @2x;
  - pés em y = 1450, ícone de 256 × 256 e ficha;
  - os estilos exatamente como no briefing.
- **As Lendárias e Gloriosas precisam se destacar das Comuns:** silhueta reconhecível no retrato, tecidos de mais presença e um objeto-assinatura com forma própria.
- **Rosto próprio (decisão do usuário, 19/11/2026):** toda Lendária e Gloriosa tem um rosto especial, diferente das demais skins: formato do rosto, nariz, olhos, maxilar, idade aparente e expressão. Os 3 estilos preservam esse perfil (variam tom de pele, cabelo e cores). O perfil fica em `identidadeFacial` na ficha e no plano. Não reaproveite o rosto de outra skin.
- **Apresentação conforme o personagem (decisão do usuário, 18/11/2026):**
  - **Todo personagem bíblico com sexo definido na Bíblia**, seja principal ou secundário, com nome ou identificado (como a filha de Faraó), tem **só a apresentação do sexo do personagem**, nos 3 estilos. Moisés, Elias, Bezalel e Hur são masculinos; Rute, Ester, Miriã e Zípora são femininas. **Não pinte a versão do outro sexo** dessas skins: o banco recusa (restrição `skins_character_single_presentation`, coluna `character_sex`) e o app ignora a pasta `feminino/` delas. Vale para as Lendárias, Gloriosas e Épicas, e para as Raras que são personagens.
  - **Ofícios e figuras genéricas**, que não são personagens (Pastor, Peregrino, Levita, Ourives, Tecelã, Tocador de shofar…), podem ter as versões masculina e feminina, na mesma rodada, quando o traje permitir.
- **Nunca vira skin:** Deus, Jesus, o Espírito Santo, anjos, Satanás, vilões e ídolos. Sem nudez e sem violência.

## Ciclo de cada lote

1. **Codex:** pinta o lote seguindo o `LOTES.md` e entrega um ZIP com `SHA256SUMS.txt`, o `.zip.sha256`, a `LEIA-ME.md` e as capturas de 320 e 412 px.
2. **Claude confere o pacote:**
   - SHA-256 do ZIP e somas internas;
   - medidas, transparência, pés, estilos contra o plano e peso;
   - um olhar sobre a arte.
3. **Claude aplica:**
   - copia as pinturas e roda `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs <LOTE>`;
   - registra as versões femininas no banco.
4. **Claude verifica:** bateria SQL, auditoria `FLOW=skins-audit`, fluxos `marco1`, `journey`, `lobby` e `fixes`, e o Supabase local oficial.
5. **Claude publica:** regera o `STATUS.md` e o `LOTES.md`, faz o commit e devolve a mensagem para o próximo lote.
