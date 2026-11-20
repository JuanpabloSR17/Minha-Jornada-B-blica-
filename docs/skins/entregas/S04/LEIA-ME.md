# Jornada Bíblica · S04

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit f2bbdd0. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. As filhas de Zelofeade, Débora ama de Rebeca, Noemi, Raabe e Ana são femininas; os demais são masculinos. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Matusalém** — `raro_matusalem` — Gn 5:27
  Rosto: Ancião de idade muito avançada; rosto extremamente alongado e magro, testa alta estreita, maçãs fundas, nariz comprido curvo, olhos pequenos afastados e sobrancelhas finas elevadas; barba muito longa afilada até o ventre, expressão tranquila.
- **Traje de Noemi** — `epico_noemi` — Rt 1:20-22
  Rosto: Idosa; rosto retangular comprido de têmporas estreitas, mandíbula larga arredondada, nariz reto amplo, olhos horizontais sob pálpebras pesadas e sobrancelhas cheias baixas; lábios cheios, sulcos profundos e expressão de pesar contido.
- **Traje de Boaz** — `epico_boaz` — Rt 2:4; 3:15
  Rosto: Idoso vigoroso; rosto largo em pera, testa baixa, maxilar robusto, nariz médio convexo de ponta achatada, olhos oblíquos próximos e sobrancelhas altas arredondadas; bigode espesso e barba curta de base plana, expressão generosa firme.
- **Traje de Raabe** — `epico_raabe` — Js 2:18
  Rosto: Adulta; rosto em losango de têmporas largas, queixo alto estreito, nariz curto achatado de ponta redonda, olhos grandes afastados e sobrancelhas altas arqueadas; lábio superior marcado e expressão alerta confiante.
- **Traje de Ana** — `epico_ana` — 1 Sm 1:10-11; 2:19
  Rosto: Adulta; rosto oval largo de testa estreita e bochechas cheias, queixo pequeno redondo, nariz curto levemente arrebitado, olhos redondos próximos e sobrancelhas suaves curvas; expressão de oração íntima e esperançosa.
- **Traje de Jônatas** — `epico_jonatas` — 1 Sm 18:4
  Rosto: Adulto jovem; rosto alongado em coração de testa larga, maxilar estreito e queixo proeminente com covinha, nariz longo reto de ponta fina, olhos horizontais pequenos e sobrancelhas grossas separadas; bigode discreto e barba muito curta, expressão leal aberta.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S04.png de corpos e Rostos_S04.png.
- As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S04 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou envio direto, aguardar revisão, corrigir apontamentos e avançar automaticamente após o fechamento do ciclo. Até dois lotes nesta entrega: S03/S04.
