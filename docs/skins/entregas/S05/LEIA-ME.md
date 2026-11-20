# Jornada Bíblica · S05

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 6c28220. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Abigail, Rainha de Sabá e Mical são femininas; os demais são masculinos, conforme o lote. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Abigail** — `epico_abigail` — 1 Sm 25:18
  Rosto: Adulta madura; rosto curto em losango, testa baixa arredondada, maçãs largas, queixo fino curto, nariz longo de ponta redonda, olhos grandes próximos e sobrancelhas altas em arco; boca larga, expressão sensata acolhedora.
- **Traje de Natã** — `epico_nata` — 2 Sm 12:1
  Rosto: Adulto maduro; rosto angular muito estreito de testa alta, queixo longo pontudo, nariz curto de ponte alta, olhos pequenos afastados e sobrancelhas grossas inclinadas; barba curta bifurcada e bigode estreito, expressão firme ponderada.
- **Traje de Rainha de Sabá** — `epico_rainha_de_saba` — 1 Rs 10:1-2
  Rosto: Adulta; rosto oval muito alongado, testa alta larga, maçãs salientes e maxilar estreito, nariz largo reto, olhos horizontais afastados sob sobrancelhas finas baixas; lábios cheios bem desenhados, expressão régia curiosa.
- **Traje de Naamã** — `epico_naama` — 2 Rs 5:14
  Rosto: Adulto maduro vigoroso; rosto retangular largo, testa baixa, maxilar quadrado, nariz longo convexo de ponta achatada, olhos próximos fundos e sobrancelhas baixas espessas; barba curta arredondada, expressão aliviada e serena.
- **Traje de Ezequias** — `epico_ezequias` — 2 Rs 18:5; 20:5
  Rosto: Adulto maduro; rosto oval estreito de testa muito alta, maxilar delicado e queixo comprido, nariz aquilino fino, olhos grandes fundos próximos e sobrancelhas retas quebradas; barba média afilada, expressão de oração concentrada.
- **Traje de Josias** — `epico_josias` — 2 Rs 22:11; 23:2
  Rosto: Adulto jovem; rosto retangular curto de testa larga, queixo comprido com covinha central, nariz curto reto de base fina, olhos amendoados inclinados e sobrancelhas grossas altas; rosto sem barba nem bigode, expressão atenta reverente.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S05.png de corpos e Rostos_S05.png.
- As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S05 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou envio direto, aguardar revisão, corrigir apontamentos e avançar automaticamente após o fechamento do ciclo. Até dois lotes nesta entrega: S05/S06.
