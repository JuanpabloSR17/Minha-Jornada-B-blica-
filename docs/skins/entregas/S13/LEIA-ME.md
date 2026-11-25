# Jornada Bíblica · S13

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 693f4ef. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Onze skins têm somente apresentação masculina; Marta tem somente apresentação feminina, conforme o personagem e o briefing. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Baruque** — `epico_baruque` — Jr 36:4
  Rosto: Escriba adulto de rosto oval anguloso comprido, testa alta abaulada, queixo longo achatado e maxilar estreito; nariz comprido fino reto, olhos pequenos próximos com cantos externos baixos, sobrancelhas finas arqueadas e lábio inferior cheio; barba curta pontuda bem cuidada e bigode fino. Expressão concentrada e gentil.
- **Traje de Obadias** — `raro_obadias` — Ob 1:1
  Rosto: Mensageiro adulto de rosto largo arredondado, testa ampla, mandíbula curta larga e queixo rombo; nariz curto levemente arrebitado de base larga, olhos amendoados afastados, sobrancelhas curvas com discreta assimetria e lábios médios; barba curta cheia em meia-lua e expressão atenta firme.
- **Traje de Naum** — `raro_naum` — Na 1:15
  Rosto: Arauto maduro de rosto longo ósseo, testa quadrada larga, maçãs altas marcadas e queixo estreito rombo; nariz longo largo convexo, olhos pequenos próximos profundos e sobrancelhas espessas retas com vinco vertical entre elas; bigode espesso e barba média larga de base reta. Expressão de anúncio confiante, sem grito.
- **Traje de Sofonias** — `raro_sofonias` — Sf 3:17
  Rosto: Profeta adulto de rosto largo em coração, bochechas altas cheias, testa aberta e queixo arredondado pequeno; nariz curto de ponta redonda, olhos grandes redondos afastados, sobrancelhas suaves arqueadas e boca larga de lábios cheios; sem barba nem bigode, sorriso sereno com covinhas discretas.
- **Traje de Malaquias** — `raro_malaquias` — Ml 3:16
  Rosto: Profeta idoso de rosto trapezoidal comprido, testa estreita, maxilar inferior largo pesado e queixo quadrado saliente; nariz curto largo de ponta quadrada, olhos pequenos muito afastados com pálpebras pesadas, sobrancelhas grossas horizontais e lábios finos; barba média retangular e expressão sóbria reflexiva.
- **Traje de Ebede-Meleque** — `raro_ebede_meleque` — Jr 38:7-13
  Rosto: Oficial adulto robusto de rosto oval comprido, testa larga, têmporas recuadas, maçãs inclinadas e queixo projetado arredondado; nariz de ponte baixa e base larga, olhos grandes bem afastados de pálpebras marcadas, sobrancelhas curvas altas e lábio inferior cheio; bigode espesso e barba curta arredondada. Expressão compassiva decidida.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S13.png de corpos e Rostos_S13.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; os prompts identificam expressamente as referências de material, pigmento e identidade de cada imagem.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S13 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou S13/S14 em 24/11/2026. As 12 adaptações foram aprovadas e registradas no commit 693f4ef antes da produção. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S13/S14.
