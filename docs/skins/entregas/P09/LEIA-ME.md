# Jornada Bíblica · P09

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Base: branch claude/kind-bell-fuk4e4, commit 0aa1068. Briefing: LOTES.md e contrato TEMPORADA-1-EXODO.md §2.

Cada personagem tem só a apresentação do próprio sexo, na pasta raiz do ID; as Maria Madalena são femininas. Cada Lendária e Gloriosa tem identidadeFacial própria, diferente das demais skins e preservada nos três estilos. Os estilos do plano atual foram respeitados, incluindo os apóstolos jovens com cabelos escuros e João em Patmos ancião grisalho.

- **Manto de Maria Madalena** — `lendario_maria_madalena` — Lc 8:2; Mc 16:1
  Rosto: Adulta jovem; rosto em losango de maçãs altas arredondadas e queixo curto, nariz reto estreito de ponta redonda, olhos fundos grandes, sobrancelhas diagonais e lábios cheios; expressão firme acolhedora.
- **Vestes de José de Nazaré** — `lendario_jose_de_nazare` — Mt 1:24; 13:55
  Rosto: Adulto; rosto oblongo de maxilar largo em U, testa alta, nariz de ponte alta e ponta voltada para baixo, olhos horizontais pequenos, sobrancelhas retas separadas e barba curta de contorno quadrado.
- **Pedro sobre as águas** — `glorioso_pedro_sobre_as_aguas` — Mt 14:29
  Rosto: Adulto jovem; rosto hexagonal de têmporas largas e queixo estreito arredondado, nariz convexo com ponta curta, olhos grandes elevados, sobrancelhas oblíquas e barba curta escura afilada; surpresa e confiança.
- **João Batista no Jordão** — `glorioso_joao_batista_no_jordao` — Mt 3:13-16
  Rosto: Adulto; rosto trapezoidal com testa estreita e maxilar largo, nariz largo de ponte baixa, olhos próximos retos e sobrancelhas baixas; barba média arredondada sem bifurcação; expressão concentrada serena.
- **Maria Madalena na manhã da ressurreição** — `glorioso_maria_madalena_na_manha_da_ressurreicao` — Jo 20:16
  Rosto: Adulta jovem; rosto oval curto de bochechas inferiores cheias, nariz curto de base larga, olhos amendoados afastados de pálpebras suaves, sobrancelhas arqueadas finas e boca larga; alívio e alegria contida.
- **Os magos e a estrela** — `glorioso_os_magos_e_a_estrela` — Mt 2:9-11
  Rosto: Adulto maduro; rosto largo em escudo, testa abaulada, nariz comprido de base estreita, olhos pequenos amendoados sob sobrancelhas curvas, lábio superior estreito e barba densa curta com base reta; expressão contemplativa.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura para exportação; não é detalhe nativo adicional.
- icone.webp: 256×256, estilo 1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras.
- Âncoras: cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de 12 px. Nos motivos com água, a sola é anotada visualmente; espuma/água pode ultrapassá-la em até 40 px, dentro do canvas, sem ser confundida com a âncora do pé.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_P09.png com pinturas completas e Rostos_P09.png.
- As capturas são prévias técnicas com a geometria do AvatarRenderer, não um teste do app publicado.
- PLANO-DO-LOTE.json: registros do briefing e perfis; NOTAS-BIBLICAS.md: adaptações e fontes.
- PROMPTS.md: prompts reais do ImageGen integrado, inclusive correções quando houver.
- VALIDACAO.json: dimensões, peso, pés, âncoras, alfa residual de base e @2x.
- A conferência de alfa separa microrresíduos de reamostramento de até 2/255 (menos de 0,8% de opacidade), registrados no relatório, de névoa/fundo visível (alfa ≥3/255). Os cantos da exportação precisam ter alfa zero.
- SHA256SUMS.txt: todos os demais arquivos. O .zip.sha256 externo valida o ZIP.

## Revisão e integração pelo Claude

Conferir anexos, hashes externos, todas as somas internas, arte, rostos, mãos, contagens dos objetos e recortes. Aplicar as pinturas e fichas, executar scripts/gen-skin-art.mjs e scripts/skins-add-lot.mjs P09. Executar o ciclo oficial: testes unitários, SQL, auditoria skins-audit, fluxos marco1/journey/lobby/fixes e Supabase local oficial. Atualizar plano, STATUS, LOTES e PARA-O-CODEX, publicar no mesmo branch e informar resultados/commit.

O Codex alterou apenas a produção de arte e a entrega local, sem migração ou banco. Conforme instrução do usuário, aguardará a revisão, corrigirá apontamentos e só seguirá ao próximo lote depois da resposta do Claude. A produção desta rodada termina em P09/P10.
