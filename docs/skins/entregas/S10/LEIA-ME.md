# Jornada Bíblica · S10

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 59e7861. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Mulher virtuosa e A amada de Cânticos são femininas; os demais são masculinos, conforme o lote. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Ido, o vidente** — `raro_ido_o_vidente` — 2 Cr 9:29; Zc 1:1
  Rosto: Ancião de rosto retangular largo com testa elevada, queixo arredondado, nariz muito largo e baixo, olhos pequenos afastados e sobrancelhas finas altas; barba média quadrada e expressão investigativa tranquila.
- **Traje de Profeta Gade** — `raro_profeta_gade` — 1 Sm 22:5
  Rosto: Adulto maduro de rosto oblongo de maçãs altas e queixo fino, nariz aquilino estreito, olhos amendoados próximos e sobrancelhas baixas de pontas descendentes; barba longa afilada e expressão firme de orientação.
- **Traje de Mulher virtuosa** — `epico_mulher_virtuosa` — Pv 31:10-31
  Rosto: Mulher adulta madura de rosto retangular alongado de maxilar forte, testa alta, nariz largo reto, olhos horizontais afastados e sobrancelhas espessas arqueadas; boca larga de lábios cheios, expressão competente acolhedora e linhas naturais de maturidade.
- **O Pregador** — `epico_o_pregador` — Ec 1:1; 12:9
  Rosto: Sábio ancião de rosto triangular invertido com testa larga e queixo pequeno arredondado, nariz comprido reto de ponta larga, olhos fundos horizontais próximos e sobrancelhas muito espessas curvas; barba longa estreita e expressão reflexiva austera.
- **A amada de Cânticos** — `epico_a_amada_de_canticos` — Ct 1:5-6
  Rosto: Mulher adulta jovem de rosto em coração largo de maçãs cheias e queixo pequeno, nariz curto de ponta arredondada e base larga, olhos grandes afastados e sobrancelhas finas suaves; expressão alegre serena, sem maquiagem e com marcas naturais do trabalho ao ar livre.
- **Traje de Agur** — `raro_agur` — Pv 30:1
  Rosto: Sábio adulto de rosto oval largo com queixo levemente assimétrico, nariz curto de ponte convexa e ponta arredondada, olhos pequenos fundos próximos e uma sobrancelha mais elevada; barba curta repartida e expressão curiosa humilde.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S10.png de corpos e Rostos_S10.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S10 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou continuar a produção de arte em21/11/2026. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S09/S10.
