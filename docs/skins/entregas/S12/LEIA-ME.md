# Jornada Bíblica · S12

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit c041fae. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. As 12 skins destes dois lotes têm somente apresentação masculina, conforme o personagem e o briefing. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Joel** — `epico_joel` — Jl 2:28
  Rosto: Profeta maduro de rosto losangular largo, maçãs altas angulosas e queixo retangular longo; nariz curto largo de ponta arredondada, olhos estreitos levemente ascendentes e sobrancelhas grossas arqueadas; barba média quadrada e expressão solene de convocação.
- **Traje de Amós** — `epico_amos` — Am 7:14-15
  Rosto: Trabalhador adulto robusto de rosto quadrado baixo, queixo largo rombo e maçãs fortes; nariz largo de narinas abertas, olhos pequenos afastados de pálpebras fundas e sobrancelhas retas espessas; bigode espesso e barba curta cheia, expressão franca firme.
- **Traje de Miqueias** — `epico_miqueias` — Mq 6:8
  Rosto: Profeta adulto de rosto trapezoidal alto, testa estreita e maxilar largo, bochechas alongadas, nariz comprido estreito reto de ponta pequena; olhos pequenos próximos, sobrancelhas altas arqueadas e barba média estreita de contorno alongado. Expressão humilde determinada.
- **Traje de Habacuque** — `epico_habacuque` — Hc 2:1-2
  Rosto: Vigia adulto maduro de rosto hexagonal comprido, testa ampla de planos angulares, maxilar cortado e nariz reto de ponte larga e ponta redonda; olhos ovais horizontais bem afastados e sobrancelhas longas baixas; barba média em cunha, expressão vigilante concentrada.
- **Traje de Ageu** — `epico_ageu` — Ag 1:8
  Rosto: Profeta idoso de rosto oval curto e cheio, maçãs pesadas e queixo largo arredondado; nariz pequeno côncavo de base larga, olhos grandes afastados de pálpebras elevadas e sobrancelhas curvas altas suaves; barba curta espessa arredondada e expressão encorajadora de trabalhador experiente.
- **Traje de Zacarias** — `epico_zacarias` — Zc 4:2-3
  Rosto: Profeta maduro de rosto oval comprido de maçãs altas, testa lisa larga e queixo dividido, nariz estreito aquilino de ponta pequena, olhos redondos próximos de pálpebra superior marcada e sobrancelhas finas altas quase retas; barba longa em duas pontas e expressão contemplativa desperta.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S12.png de corpos e Rostos_S12.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S12 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou S11/S12 em 24/11/2026. As 12 adaptações foram aprovadas e registradas no commit c041fae antes da produção. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S11/S12.
