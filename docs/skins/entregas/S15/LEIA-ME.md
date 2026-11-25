# Jornada Bíblica · S15

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit d376644. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Oito skins têm somente apresentação masculina; Maria de Betânia, a samaritana, a mulher do perfume e Isabel têm somente apresentação feminina, conforme o briefing. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Maria de Betânia** — `epico_maria_de_betania` — Jo 12:3
  Rosto: Mulher adulta com rosto em coração largo nas maçãs, testa baixa suavemente arredondada, sobrancelhas arqueadas e separadas, olhos amendoados de cantos elevados, nariz curto de ponta arredondada, lábios cheios com arco central marcado e queixo pequeno arredondado; expressão serena. Identidade própria, diferente da mulher do perfume.
- **Traje de Lázaro** — `epico_lazaro` — Jo 11:44
  Rosto: Homem adulto de rosto comprido e estreito, maçãs altas discretas, sobrancelhas retas baixas, olhos fundos de pálpebras largas, nariz longo de ponte elevada e ponta fina, boca estreita, sulco central no queixo e barba curta densa de contorno triangular suave. Expressão aliviada e viva.
- **Traje de Nicodemos** — `epico_nicodemos` — Jo 3:1-2; 19:39
  Rosto: Homem maduro com rosto oval largo, testa alta, sobrancelhas arqueadas espessas, olhos próximos e fundos com cantos externos caídos, nariz comprido de ponte larga e ponta curva, boca de lábio superior fino e inferior cheio, barba curta arredondada. Expressão inquisitiva e reservada.
- **Traje de José de Arimateia** — `epico_jose_de_arimateia` — Mt 27:57-60
  Rosto: Homem maduro de rosto retangular de mandíbula larga, maçãs angulosas altas, sobrancelhas largas quase horizontais, olhos grandes com pálpebras pesadas, nariz largo de ponte reta, boca larga de cantos suaves e barba média dividida discretamente no centro. Postura digna e compassiva.
- **Traje de Zaqueu** — `epico_zaqueu` — Lc 19:4-8
  Rosto: Homem adulto com rosto circular largo, mandíbula compacta, pescoço forte, testa curta, sobrancelhas baixas espessas, olhos vivos separados, nariz curto levemente convexo e boca larga com sorriso discreto. Barba muito curta aparada. Proporções compactas de adulto, sem caricatura infantil.
- **A samaritana** — `epico_a_samaritana` — Jo 4:28-29
  Rosto: Mulher adulta com rosto triangular alongado, maçãs proeminentes, testa média, sobrancelhas retas longas, olhos alongados bem separados, nariz de ponte longa e ponta pequena, boca larga de lábio superior fino e inferior arredondado, queixo estreito com covinha sutil. Expressão comunicativa.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S15.png de corpos e Rostos_S15.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; os prompts identificam expressamente as referências de material, pigmento e identidade de cada imagem.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S15 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou continuar S15/S16 em 25/11/2026. As 12 adaptações foram aprovadas em 55f3cf8 antes da produção; o complemento de figurino pedido durante S15 foi registrado em d376644 antes da revisão de Nicodemos e das bases S16. O campo figurino aprovado é preservado nas fichas quando presente no plano. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S15/S16.
