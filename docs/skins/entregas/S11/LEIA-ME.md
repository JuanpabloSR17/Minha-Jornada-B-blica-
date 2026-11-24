# Jornada Bíblica · S11_v2

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit c041fae. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. As 12 skins destes dois lotes têm somente apresentação masculina, conforme o personagem e o briefing. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Lemuel** — `raro_lemuel` — Pv 31:1
  Rosto: Rei adulto maduro de rosto em coração, testa alta e larga, maçãs elevadas e queixo pequeno firme; nariz largo de ponta arredondada dividida, olhos redondos afastados de pálpebras pesadas, sobrancelhas finas retas; barba curta quadrada e expressão atenta de quem acolhe conselho.
- **Traje dos filhos de Corá** — `raro_filhos_de_cora` — Sl 42 (título)
  Rosto: Cantor adulto de rosto retangular comprido, têmporas estreitas e maxilar longo; nariz de ponte côncava e ponta ampla, olhos pequenos fundos afastados e sobrancelhas baixas horizontais; bigode longo curvo e barba média arredondada. Um único representante coletivo, mesma identidade nos três estilos.
- **Traje de Etã, o ezraíta** — `raro_eta_o_ezraita` — Sl 89 (título)
  Rosto: Salmista idoso de rosto triangular estreito, têmporas recuadas e maçãs angulosas, nariz comprido fortemente convexo de ponta descendente, olhos horizontais próximos de pálpebras baixas e sobrancelhas curvas discretas; barba média afilada em duas pontas e expressão contemplativa.
- **Traje de Eliú** — `raro_eliu` — Jó 32:2-6
  Rosto: Homem adulto jovem de rosto pentagonal largo, testa reta, queixo arredondado e covinhas discretas; nariz curto levemente arrebitado de base larga, olhos grandes afastados, sobrancelhas espessas quase retas e lábios cheios. Sem barba longa: rosto jovem com apenas sombra curta de barba, expressão séria e ansiosa para falar.
- **Traje de Sadraque, Mesaque e Abede-Nego** — `epico_sadraque_mesaque_e_abede_nego` — Dn 3:21-27
  Rosto: Representante coletivo masculino adulto, de rosto oval largo e arredondado, maçãs cheias, maxilar curvo e queixo largo; nariz largo reto, olhos amendoados grandes afastados e sobrancelhas arqueadas espessas; barba curta densa de contorno nítido, expressão confiante tranquila. Mesmo rosto nos três estilos, sem atribuir um amigo a cada estilo.
- **Traje de Oseias** — `epico_oseias` — Os 1:1; 14:5
  Rosto: Profeta adulto maduro de rosto oblongo, testa alta, nariz comprido de ponta inclinada, olhos amendoados muito afastados com cantos externos baixos e sobrancelhas longas curvas; boca larga de lábio superior fino, barba média bifurcada, expressão compassiva com tristeza contida.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S11.png de corpos e Rostos_S11.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S11 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou S11/S12 em 24/11/2026. As 12 adaptações foram aprovadas e registradas no commit c041fae antes da produção. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S11/S12.

## Revisão solicitada no §31, commit fba0605 (24/11/2026)

Etã1: pele clara tom2, com cabelo cacheado e barba em mel preservados. Etã2: pele escura tom5, com crespo volumoso e barba cobre preservados. Etã3 tom4 permanece idêntico.

Somente Etã estilos1 e2 (base e @2x) e o ícone do estilo1 foram alterados. Os outros43assets, inclusive todas as6fichas e os5outros ícones, são byte a byte iguais à primeira entrega.

Sem mudança de IDs, catálogo, sexo, estilos, regras, app, âncoras ou banco. As capturas320/412 da skin corrigida e as duas galerias foram atualizadas; capturas das outras5skins são idênticas. Comparacao_S11_v2.png mostra antes/depois no mesmo recorte. As novas correções foram geradas pela ferramenta integrada ImageGen; PROMPTS.md registra o texto exato. VALIDACAO.json traz os hashes dos assets alterados e a contagem dos preservados. ZIP original mantido imutável. Enviar somente este pacote completo v2 e seu .zip.sha256.
