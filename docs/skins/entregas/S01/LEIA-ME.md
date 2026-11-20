# Jornada Bíblica · S01

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit bb88762. Briefing: LOTES.md; contrato técnico: TEMPORADA-1-EXODO.md §2.

Cada personagem tem só a apresentação do próprio sexo, na raiz do seu ID. Raquel, Lia e Agar são femininas; os demais são masculinos. Cada skin tem rosto próprio, preservado nos três estilos. Tons de pele, cores e penteados seguem o catálogo.

- **Traje de Raquel** — `epico_raquel` — Gn 29:9
  Rosto: Adulta jovem; rosto alongado em coração, testa ampla, queixo estreito arredondado, nariz longo reto de ponta fina, olhos amendoados afastados e sobrancelhas cheias arqueadas; expressão atenta acolhedora.
- **Traje de Lia** — `epico_lia` — Gn 29:16-17
  Rosto: Adulta; rosto arredondado em pera, bochechas inferiores cheias, queixo amplo curto, nariz curto de base larga, olhos próximos suaves e sobrancelhas baixas curvas; expressão serena digna.
- **Traje de Abel** — `epico_abel` — Gn 4:2-4
  Rosto: Adulto jovem; rosto trapezoidal curto de mandíbula larga, testa baixa, nariz pequeno arrebitado, olhos redondos próximos e sobrancelhas retas espessas; barba curta só no queixo e bigode delicado, expressão gentil.
- **Traje de Enoque** — `epico_enoque` — Gn 5:24
  Rosto: Adulto maduro; rosto oval muito estreito e comprido, maçãs altas, nariz aquilino fino e comprido, olhos fundos estreitos, sobrancelhas finas elevadas e barba média afilada única; expressão contemplativa.
- **Traje de Melquisedeque** — `epico_melquisedeque` — Gn 14:18
  Rosto: Adulto maduro; rosto quadrado largo, testa curta, nariz largo de ponte baixa, olhos horizontais pequenos, sobrancelhas curvas separadas e barba densa de base angulada; expressão hospitaleira firme.
- **Traje de Agar** — `epico_agar` — Gn 21:19
  Rosto: Adulta; rosto angular em escudo, testa alta estreita, maçãs salientes e queixo largo arredondado, nariz comprido de base ampla, olhos grandes oblíquos e sobrancelhas assimétricas arqueadas; expressão resiliente aliviada.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo 1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras.
- Âncoras: cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S01.png com corpos completos e Rostos_S01.png.
- Capturas são prévias técnicas com a geometria do AvatarRenderer; não são teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações e fontes.
- PROMPTS.md: prompts reais da ferramenta de imagens integrada, incluindo correções quando houver.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base e @2x.
- Alfa: cantos zero, sem névoa visível afastada. Microrresíduos numéricos de até 2/255 (menos de 0,8% de opacidade) são registrados separadamente de fundos visíveis (alfa ≥3/255).
- SHA256SUMS.txt: somas de todos os demais arquivos. O .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir quatro anexos (ZIP e .zip.sha256 de cada lote), hashes internos/externos, arte, rostos, mãos e objetos. Aplicar a arte e as fichas pelo fluxo oficial de scripts/skins-add-lot.mjs S01 e scripts/gen-skin-art.mjs. Executar unitários, SQL, skins-audit, fluxos marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch, informando commit e resultado completo.

Somente arte e entrega local foram alteradas pelo Codex, sem migração ou banco. O usuário autorizou envio direto ao Claude, aguardar a revisão, corrigir apontamentos e seguir automaticamente apenas após o fechamento do ciclo. Até dois lotes nesta entrega: S01/S02.
