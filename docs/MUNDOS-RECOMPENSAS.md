# Conclusão dos sete mundos — registro pelo servidor e recompensas para decisão editorial

## 1. O que já está pronto (sem recompensa fixada)

Migração aditiva `20261122000200_world_completion.sql` (testes em `supabase/tests/96_worlds.sql`):

- `bible_worlds` e `bible_world_books`: os sete mundos da aba Jornada, com os 66 livros em exatamente um mundo
  (a migração confere).
- Um gatilho em `private.domain_events`: quando o **último** capítulo de um mundo é registrado
  (`CHAPTER_COMPLETED`), o servidor registra `WORLD_COMPLETED` (`world:<id>`) **uma vez por conta**. Releituras,
  reenvios e verificações repetidas não duplicam.
- Retroativo: na aplicação da migração, contas que já tinham concluído algum mundo recebem o registro.
- `public.get_world_progress()`: capítulos registrados, total e data de conclusão de cada mundo. Pode substituir o
  cálculo local da aba Jornada (`src/features/journey/worlds.ts`) quando o Codex integrar.
- Sete gatilhos `reward_triggers` do tipo `world` (`mundo-origens` … `mundo-nova-criacao`), **sem itens, Siclos ou
  XP ligados**. O teste garante que nenhum item é concedido.
- Reversão manual: `supabase/rollbacks/20261122000200_world_completion.down.sql`, que preserva os eventos já
  registrados.

## 2. Tamanho de cada mundo

| Mundo | Livros | Capítulos | Ritmo de 1 capítulo/dia |
|---|---|---:|---|
| Origens e Aliança | Gênesis–Deuteronômio | 187 | ~6 meses |
| Terra e Reinos | Josué–Ester | 249 | ~8 meses |
| Poesia e Sabedoria | Jó–Cânticos | 243 | ~8 meses |
| Voz dos Profetas | Isaías–Malaquias | 250 | ~8 meses |
| Vida e Ensino de Jesus | Mateus–João | 89 | ~3 meses |
| Caminhos da Igreja | Atos–Judas | 149 | ~5 meses |
| Visão da Nova Criação | Apocalipse | 22 | ~3 semanas |

Referências da economia atual: meta diária = 40 Siclos + 20 XP; itens do Mercado custam de 80 a 400 Siclos;
cada capítulo inédito vale 40 XP; o Lendário de cada livro já é concedido por livro concluído.

## 3. Propostas (para decidir antes de fixar valores ou criar itens)

**A. Siclos proporcionais, sem item novo.** 2 Siclos por capítulo do mundo, arredondado a dezenas:
Origens 370, Reinos 500, Sabedoria 490, Profetas 500, Evangelhos 180, Igreja 300, Nova Criação 50 (piso
sugerido: 100). Simples, usa o que já existe. Mundos pequenos rendem pouco.

**B. Valor fixo e igual por mundo.** 300 Siclos cada (2.100 no total). Reconhece o marco sem medir o tamanho.
O Apocalipse fica desproporcionalmente generoso.

**C. Estandarte do Mundo (item cosmético novo, exposto no Santuário) + Siclos de A.** Um item de exposição
por mundo, por exemplo `world_origens_estandarte`, com raridade própria **"Mundo"** ou Lendária, nunca
vendido. Exige:
- catálogo v9;
- revisão editorial (passagem, significado e representação simbólica);
- arte nos ícones (moldura dourada).

É a opção mais visível e a que custa mais arte e revisão.

**D. Título de perfil por mundo (sem item).** Por exemplo, "Peregrino das Origens", mostrado no perfil
público. Pede um campo de título no perfil, que é migração pequena.

Recomendação para decidir: **C para o lançamento dos mundos, com A como valor dos Siclos**. Se o prazo da arte
não permitir, **A agora** e o Estandarte num lote posterior: o registro já existe, então conceder depois não
perde histórico.

## 4. Perguntas editoriais em aberto

1. A conclusão de um mundo dá XP? Hoje o XP vem só de capítulo inédito e da meta diária.
2. Estandartes: quais símbolos de cada mundo são aceitáveis (evitar emblemas que pareçam relíquia
   verdadeira, como fizemos com os Santos)?
3. Mostrar a celebração na tela de recompensa (como a revelação dos Santos) ou só no Santuário?
4. Ao ligar a recompensa, conceder retroativamente a quem já concluiu? O registro com data já permite fazer
   isso de forma idempotente.
