# Jornada Bíblica · S02

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit bb88762. Briefing: LOTES.md; contrato técnico: TEMPORADA-1-EXODO.md §2.

Cada personagem tem só a apresentação do próprio sexo, na raiz do seu ID. Raquel, Lia e Agar são femininas; os demais são masculinos. Cada skin tem rosto próprio, preservado nos três estilos. Tons de pele, cores e penteados seguem o catálogo.

- **Traje de Ismael** — `epico_ismael` — Gn 21:20
  Rosto: Adulto; rosto oval horizontal de maxilar curto forte, nariz reto de ponte larga, olhos estreitos afastados, sobrancelhas altas angulosas e barba curta rente bem desenhada; expressão vigilante calma.
- **Traje de Esaú** — `epico_esau` — Gn 25:25-27
  Rosto: Adulto robusto; rosto retangular baixo muito largo, sobrancelhas salientes, nariz grande arredondado, olhos fundos pequenos, mandíbula quadrada e barba cheia arredondada; expressão resoluta.
- **Traje de Judá** — `epico_juda` — Gn 38:18; 49:9
  Rosto: Adulto maduro; rosto longo em losango de têmporas estreitas, maçãs marcadas, nariz convexo comprido, olhos caídos afastados, sobrancelhas espessas oblíquas e barba em cunha; expressão ponderada.
- **Traje de Benjamim** — `epico_benjamim` — Gn 44:12
  Rosto: Adulto jovem; rosto quadrado suave de bochechas redondas, queixo curto com covinha, nariz curto de ponta redonda, olhos grandes bem afastados e sobrancelhas finas retas; bigode discreto sem barba, expressão levemente surpresa.
- **Traje de Calebe** — `epico_calebe` — Nm 13:30; Js 14:11
  Rosto: Idoso vigoroso; rosto largo em pentágono, testa alta vincada, nariz comprido de dorso achatado e ponta larga, olhos amendoados sob pálpebras pesadas, sobrancelhas baixas retas e barba curta triangular; expressão corajosa.
- **Traje de Eleazar** — `epico_eleazar` — Nm 20:28
  Rosto: Adulto maduro; rosto oblongo de maçãs largas, maxilar estreito e queixo plano, nariz reto de base curta, olhos horizontais afastados, sobrancelhas finas elevadas e barba curta redonda; expressão concentrada tranquila.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo 1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras.
- Âncoras: cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S02.png com corpos completos e Rostos_S02.png.
- Capturas são prévias técnicas com a geometria do AvatarRenderer; não são teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações e fontes.
- PROMPTS.md: prompts reais da ferramenta de imagens integrada, incluindo correções quando houver.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base e @2x.
- Alfa: cantos zero, sem névoa visível afastada. Microrresíduos numéricos de até 2/255 (menos de 0,8% de opacidade) são registrados separadamente de fundos visíveis (alfa ≥3/255).
- SHA256SUMS.txt: somas de todos os demais arquivos. O .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir quatro anexos (ZIP e .zip.sha256 de cada lote), hashes internos/externos, arte, rostos, mãos e objetos. Aplicar a arte e as fichas pelo fluxo oficial de scripts/skins-add-lot.mjs S02 e scripts/gen-skin-art.mjs. Executar unitários, SQL, skins-audit, fluxos marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch, informando commit e resultado completo.

Somente arte e entrega local foram alteradas pelo Codex, sem migração ou banco. O usuário autorizou envio direto ao Claude, aguardar a revisão, corrigir apontamentos e seguir automaticamente apenas após o fechamento do ciclo. Até dois lotes nesta entrega: S01/S02.
