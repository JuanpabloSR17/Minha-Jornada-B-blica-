# Jornada Bíblica · S03

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit f2bbdd0. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. As filhas de Zelofeade, Débora ama de Rebeca, Noemi, Raabe e Ana são femininas; os demais são masculinos. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Finéias** — `epico_fineias` — Nm 25:11
  Rosto: Adulto; rosto curto em diamante, maçãs altas, mandíbula estreita, queixo arredondado, nariz fino reto com ponta descendente, olhos pequenos afastados e sobrancelhas horizontais; barba curta rente e bigode fino, expressão vigilante serena.
- **Traje de Labão** — `raro_labao` — Gn 29:13
  Rosto: Adulto maduro; rosto trapezoidal largo de testa curta e maxilar forte, nariz largo comprido de ponte baixa, olhos grandes afastados, sobrancelhas curvas espessas e bigode longo sobre barba média de base larga; expressão hospitaleira reservada.
- **Traje de Rúben** — `raro_ruben` — Gn 37:22
  Rosto: Adulto maduro; rosto oval comprido, testa estreita, nariz aquilino pronunciado, olhos próximos profundos e sobrancelhas baixas oblíquas, boca larga e barba cheia de base quadrada; expressão preocupada e protetora.
- **Traje de Eliézer, servo de Abraão** — `raro_eliezer_servo_de_abraao` — Gn 24:2-10
  Rosto: Idoso; rosto em pera de testa larga e maxilar estreito, nariz curto largo de ponta caída, olhos horizontais com pálpebras pesadas, sobrancelhas finas arqueadas e barba longa arredondada; expressão confiável e experiente.
- **Traje das filhas de Zelofeade** — `raro_filhas_de_zelofeade` — Nm 27:1-7
  Rosto: Adulta; rosto largo em coração, testa alta arredondada, maçãs firmes, queixo triangular curto, nariz curto de base ampla, olhos amendoados próximos e sobrancelhas retas assimétricas; expressão decidida e respeitosa.
- **Traje de Débora, ama de Rebeca** — `raro_debora_ama_de_rebeca` — Gn 35:8
  Rosto: Idosa; rosto redondo largo de bochechas baixas, queixo pequeno recuado, nariz comprido reto, olhos pequenos próximos sob pálpebras franzidas e sobrancelhas finas baixas; expressão acolhedora, rugas naturais e boca pequena.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S03.png de corpos e Rostos_S03.png.
- As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S03 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou envio direto, aguardar revisão, corrigir apontamentos e avançar automaticamente após o fechamento do ciclo. Até dois lotes nesta entrega: S03/S04.
