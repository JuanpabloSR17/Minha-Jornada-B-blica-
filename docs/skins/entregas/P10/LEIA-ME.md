# Jornada Bíblica · P10

5 skins completas × 3 estilos = **15 pinturas** no 2.5D pintado aprovado. Base: branch claude/kind-bell-fuk4e4, commit 0aa1068. Briefing: LOTES.md e contrato TEMPORADA-1-EXODO.md §2.

Cada personagem tem só a apresentação do próprio sexo, na pasta raiz do ID; as Maria Madalena são femininas. Cada Lendária e Gloriosa tem identidadeFacial própria, diferente das demais skins e preservada nos três estilos. Os estilos do plano atual foram respeitados, incluindo os apóstolos jovens com cabelos escuros e João em Patmos ancião grisalho.

- **Vestes de Paulo** — `lendario_paulo` — At 9:15; 2 Tm 4:13
  Rosto: Adulto jovem; rosto em pera de testa estreita e mandíbula suavemente larga, nariz longo reto de ponta pequena, olhos atentos próximos, sobrancelhas curvas assimétricas e barba curta rente com bigode fino; expressão reflexiva.
- **Paulo no caminho de Damasco** — `glorioso_paulo_no_caminho_de_damasco` — At 9:3-4
  Rosto: Adulto jovem; rosto em triângulo invertido com testa larga e queixo pequeno quadrado, nariz curto de ponta levemente elevada, olhos grandes redondos, sobrancelhas arqueadas espessas e rosto sem barba; espanto reverente.
- **Pedro no Pentecostes** — `glorioso_pedro_no_pentecostes` — At 2:3, 14
  Rosto: Adulto jovem; rosto retangular baixo de maxilar reto, testa larga baixa, nariz largo de ponta achatada, olhos longos estreitos, sobrancelhas espessas altas e bigode curto com barba rala no queixo; fala confiante.
- **Estêvão com rosto de anjo** — `glorioso_estevao_com_rosto_de_anjo` — At 6:15; 7:56
  Rosto: Adulto jovem; rosto triangular curto de maçãs cheias, nariz fino reto, olhos afastados grandes, sobrancelhas suaves e queixo pequeno arredondado com barba muito rala; expressão tranquila admirada.
- **João em Patmos** — `glorioso_joao_em_patmos` — Ap 1:9-11
  Rosto: Ancião; rosto longo em pentágono, testa estreita alta com linhas finas, nariz de ponte reta longa e ponta larga, olhos pequenos fundos assimétricos e barba grisalha longa afilada; expressão lúcida serena.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura para exportação; não é detalhe nativo adicional.
- icone.webp: 256×256, estilo 1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras.
- Âncoras: cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de 12 px. Nos motivos com água, a sola é anotada visualmente; espuma/água pode ultrapassá-la em até 40 px, dentro do canvas, sem ser confundida com a âncora do pé.
- capturas/: 5 pranchas de 320 px, 5 de 412 px, Galeria_P10.png com pinturas completas e Rostos_P10.png.
- As capturas são prévias técnicas com a geometria do AvatarRenderer, não um teste do app publicado.
- PLANO-DO-LOTE.json: registros do briefing e perfis; NOTAS-BIBLICAS.md: adaptações e fontes.
- PROMPTS.md: prompts reais do ImageGen integrado, inclusive correções quando houver.
- VALIDACAO.json: dimensões, peso, pés, âncoras, alfa residual de base e @2x.
- A conferência de alfa separa microrresíduos de reamostramento de até 2/255 (menos de 0,8% de opacidade), registrados no relatório, de névoa/fundo visível (alfa ≥3/255). Os cantos da exportação precisam ter alfa zero.
- SHA256SUMS.txt: todos os demais arquivos. O .zip.sha256 externo valida o ZIP.

## Revisão e integração pelo Claude

Conferir anexos, hashes externos, todas as somas internas, arte, rostos, mãos, contagens dos objetos e recortes. Aplicar as pinturas e fichas, executar scripts/gen-skin-art.mjs e scripts/skins-add-lot.mjs P10. Executar o ciclo oficial: testes unitários, SQL, auditoria skins-audit, fluxos marco1/journey/lobby/fixes e Supabase local oficial. Atualizar plano, STATUS, LOTES e PARA-O-CODEX, publicar no mesmo branch e informar resultados/commit.

O Codex alterou apenas a produção de arte e a entrega local, sem migração ou banco. Conforme instrução do usuário, aguardará a revisão, corrigirá apontamentos e só seguirá ao próximo lote depois da resposta do Claude. A produção desta rodada termina em P09/P10.
