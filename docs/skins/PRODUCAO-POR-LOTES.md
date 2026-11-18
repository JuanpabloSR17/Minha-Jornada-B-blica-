# Produção de skins por lotes

**Objetivo:** ter no app as skins principais de todos os livros da Bíblia, cada uma conquistada lendo. O Codex pinta **um lote por vez**, sem sobrecarga. O Claude confere cada entrega, aplica, coloca as skins no app com a regra de leitura, roda a auditoria em todas as abas e atualiza o painel.

## Arquivos

| Arquivo | Para quê |
|---|---|
| [`plano-lotes.json`](./plano-lotes.json) | O plano: lotes, IDs, nomes, referências, ideia do traje, apresentação, 3 estilos e regra de leitura de cada skin. Vem da Enciclopédia de Skins Bíblicas (288 skins). |
| [`LOTES.md`](./LOTES.md) | **Briefing para o Codex**, só com o que falta pintar, lote a lote. |
| [`STATUS.md`](./STATUS.md) | **Painel:** o que está pronto no app, pintado, sem pintura ou a produzir. |
| `scripts/skin-status.mjs` | Regera o `STATUS.md` e o `LOTES.md` a partir do repositório. |
| `scripts/skins-add-lot.mjs <LOTE>` | Coloca no app as skins pintadas de um lote: catálogo `principais.json` e migração aditiva com as regras de leitura. |
| `e2e/skins-audit.flow.cjs` | **Auditoria:** com uma skin pintada vestida, confere a pintura em cada tela (Início, retrato do HUD, Perfil, Vestiário, Amigos, cartão público, outra conta, loja, mundos, cadastro e troca de apresentação). |

## Ordem dos lotes

| Lote | Conteúdo | Skins |
|---|---|---|
| T1-C | Temporada 1: Pastor de ovelhas (inicial), Vestes de Arão, as 2 Gloriosas de Êxodo, Bezalel e Jetro | 6 |
| T1-D | Temporada 1: Miriã, Zípora, Aoliabe, Hur e Tocador de shofar | 5 |
| P01–P02 | Principais de Origens e Aliança: Adão, Eva, Noé, Abraão, Sara, Isaque, Rebeca, Jacó, José + Gloriosas de José, Abraão e Noé | 12 |
| P03–P05 | Principais de Terra e Reinos: Josué, Débora, Gideão, Sansão, Rute, Samuel, Davi, Salomão, Elias, Eliseu, Esdras, Neemias, Ester + 5 Gloriosas | 18 |
| P06–P07 | Principais de Poesia e Sabedoria e de Voz dos Profetas: Jó, Isaías, Jeremias, Ezequiel, Daniel, Jonas + 5 Gloriosas | 11 |
| P07–P09 | Principais de Vida e Ensino de Jesus: João Batista, Pedro, João, Tiago, André, Mateus, Maria, Maria Madalena, José de Nazaré + 4 Gloriosas | 13 |
| P10 | Principais de Caminhos da Igreja e Nova Criação: Paulo + Gloriosas de Paulo, Pedro no Pentecostes, Estêvão e João em Patmos | 5 |

São 70 skins (11 da Temporada 1 e 59 principais), cerca de 210 pinturas, mais as versões femininas.

**Depois das principais:** as 76 Épicas (personagens secundários), as Raras e Comuns dos ofícios (59) e a realeza, no mesmo formato. Os lotes dessa fase serão acrescentados ao plano quando as principais terminarem.

## Como se conquista (regras no servidor)

| Raridade | Regra | Exemplo |
|---|---|---|
| **Lendária** | Ler a história do personagem (os capítulos dele) ou concluir o livro dele | Vestes de José: Gênesis 37–50 · Vestes de Rute: concluir Rute |
| **Gloriosa** | Concluir o **mundo** do momento marcante, como decidido na enciclopédia | Elias no carro de fogo: concluir Terra e Reinos |
| Épica e Rara da temporada | Ler os capítulos do personagem | Véu de Zípora: Êxodo 2, 4 e 18 |
| Comum e Rara da loja | Mercado dos Viajantes, com Siclos | Tecelã: 160 Siclos |

Uma skin **entra no app quando a pintura é aprovada**, para que toda skin visível já esteja pintada. As da Temporada 1 já estão no catálogo e mostram o traje provisório até a pintura chegar.

## Estilo (obrigatório)

- O mesmo **2.5D pintado** dos lotes aprovados: Lote A, Lote B e o Moisés revisado.
- Contrato técnico de `TEMPORADA-1-EXODO.md` §2:
  - corpo de 1024 × 1536 com fundo transparente, mais a versão @2x;
  - pés em y = 1450, ícone de 256 × 256 e ficha;
  - os estilos exatamente como no briefing.
- **As Lendárias e Gloriosas precisam se destacar das Comuns:** silhueta reconhecível no retrato, tecidos de mais presença e um objeto-assinatura com forma própria.
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
