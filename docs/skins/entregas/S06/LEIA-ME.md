# Jornada Bíblica · S06_v2

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 6c28220. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Abigail, Rainha de Sabá e Mical são femininas; os demais são masculinos, conforme o lote. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Mardoqueu** — `epico_mardoqueu` — Et 8:15
  Rosto: Adulto maduro; rosto quadrado amplo de testa baixa, bochechas cheias, queixo largo com sulco, nariz curto levemente arrebitado, olhos pequenos afastados e sobrancelhas altas espessas; barba média com duas pontas e expressão digna afável.
- **Traje de Zorobabel** — `epico_zorobabel` — Ed 3:8; Ag 2:23
  Rosto: Adulto; rosto em pera invertida de têmporas estreitas e maxilar largo, testa média, nariz pequeno convexo, olhos redondos afastados, sobrancelhas descendentes e orelhas salientes; barba curta de base reta, expressão resoluta tranquila.
- **Traje de Baraque** — `raro_baraque` — Jz 4:14
  Rosto: Adulto maduro; rosto retangular comprido e magro, testa estreita, queixo largo arredondado, nariz longo reto, olhos estreitos próximos e sobrancelhas baixas horizontais; barba cheia arredondada e expressão vigilante serena.
- **Traje de Eli** — `raro_eli` — 1 Sm 1:9
  Rosto: Idoso; rosto pentagonal muito largo, testa curta, bochechas volumosas, queixo pequeno recuado, nariz largo curto, olhos pequenos caídos e sobrancelhas finas baixas; barba longa larga arredondada, expressão cansada gentil, porte corpulento.
- **Traje de Mical** — `raro_mical` — 1 Sm 19:12
  Rosto: Adulta jovem; rosto oval de maxilar largo anguloso e testa estreita, queixo pequeno firme, nariz curto de ponta elevada, olhos amendoados longos próximos e sobrancelhas grossas retas; lábios finos, expressão alerta corajosa.
- **Traje de Joabe** — `raro_joabe` — 2 Sm 2:13
  Rosto: Adulto maduro; rosto curto em diamante, testa larga baixa, maçãs grandes, maxilar curto forte, nariz curto de ponte irregular, olhos pequenos afastados e sobrancelhas grossas oblíquas; barba curta quadrada e expressão séria contida.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S06.png de corpos e Rostos_S06.png.
- As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S06 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou envio direto, aguardar revisão, corrigir apontamentos e avançar automaticamente após o fechamento do ciclo. Até dois lotes nesta entrega: S05/S06.

## Correção de tom · S06_v2

Revisão do §26 de PARA-O-CODEX, base integrada b56ea02. Uma única pintura corrigida: raro_baraque estilo2, tom4 médio(#AC764B), entre o estilo1 claro(tom2) e o estilo3 escuro(tom5). Referência de cor: Labão estilo1 v2 já aprovado. Rosto próprio, barba, cabelo longo liso ruivo, traje, mãos, escudo, IDs e âncoras preservados. Sem migração, banco ou alteração de catálogo.

Mudaram somente2assets: corpo.webp e corpo@2x.webp do estilo2. Os outros46assets, incluindo as seis fichas e todos os ícones, ficaram byte a byte iguais ao S06_final. Os estilos1/3 de Baraque e as outras17pinturas não mudam. Capturas320/412 de Baraque e galerias atualizadas; Comparacao_Tons_S06_v2.png compara1claro/2antes/2depois/3escuro. VALIDACAO.json traz hashes antigos/novos dos2assets.

Uma nova edição ImageGen para uma pintura selecionada; PROMPTS preserva os22registros do S06 e acrescenta esta revisão(23registros). Enviar só S06_v2 e seu .zip.sha256. S05 continua aprovado, sem reenvio. Aguardar revisão/integração e confirmação dos checks antes de S07/S08.
