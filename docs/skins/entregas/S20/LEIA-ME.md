# Jornada Bíblica · S20

6 skins, 7 apresentações e **21 pinturas completas** no padrão pintado 2.5D aprovado. Cada apresentação tem rosto próprio, preservado nos três estilos. Personagens bíblicos só no próprio sexo; a criança genérica de S20 inclui menino e menina.

Fonte: branch claude/kind-bell-fuk4e4, commit 2c5185cfbbfb440f9080b46a36b8e782de6f1e61, LOTES.md atual, estilos exatos do plano. As adaptações e os figurinos estão documentados em NOTAS-BIBLICAS.md desde antes das bases. Os campos locais de direção artística não foram apresentados como uma alteração já aprovada/publicada no catálogo. Cores de roupa, idades aparentes e rosto não são informações históricas comprovadas.

- **Traje de Cleopas** · `raro_cleopas`

  Homem adulto de cerca de45 anos, rosto em pera de têmporas estreitas e mandíbula larga, testa baixa, sobrancelhas retilíneas, olhos fundos, nariz curto retilíneo e queixo com pequena fenda. Bigode estreito e barba curta contornando o maxilar na cor do cabelo; expressão reflexiva acolhedora.

- **A criança no colo de Jesus** · `raro_a_crianca_no_colo_de_jesus`

  Menino de cerca de7 anos como direção artística, rosto redondo curto, testa larga, olhos grandes afastados, nariz pequeno arredondado, boca pequena com sorriso tímido e queixo suave. Proporções infantis naturais e sem barba; rosto próprio preservado nos três estilos.

- **Traje de Barnabé** · `epico_barnabe`

  Homem adulto de cerca de42 anos, rosto retangular comprido de testa larga, olhos pequenos calmos, sobrancelhas grossas curvas, nariz longo largo na ponta, sulcos nasolabiais marcados e maxilar arredondado. Barba curta aparada com queixo mais cheio e bigode fino na cor do cabelo; expressão generosa firme.

- **Traje de Estêvão** · `epico_estevao`

  Homem jovem de aproximadamente26 anos, rosto oval quase redondo de maçãs altas suaves, testa larga lisa, olhos grandes de cantos levemente baixos, nariz pequeno reto, lábios cheios e queixo curto. Sem barba ou bigode em todos os estilos; expressão serena atenta, rosto próprio.

- **Traje de Tiago, irmão do Senhor** · `epico_tiago_irmao_do_senhor`

  Homem adulto de cerca de38 anos, rosto comprido triangular de têmporas estreitas, testa alta, sobrancelhas finas retilíneas, olhos fundos de cantos baixos, nariz longo levemente adunco e boca pequena firme. Barba curta densa de base afilada e bigode conectado na cor do cabelo; expressão recolhida.

- **Traje de Lucas** · `epico_lucas`

  Homem adulto de cerca de35 anos, rosto oval largo de testa arredondada alta, sobrancelhas de espessura desigual, olhos espaçados e atentos, nariz reto curto, boca larga de sorriso assimétrico sutil e queixo pontudo pequeno. Sem barba nem bigode; orelhas expostas com formato próprio.

- **A criança no colo de Jesus** — apresentação feminina adicional · `raro_a_crianca_no_colo_de_jesus`

  Menina de cerca de7 anos como direção artística, rosto oval curto de bochechas cheias, testa alta suave, olhos grandes amendoados, nariz pequeno de ponta arrebitada, lábios pequenos e queixo arredondado. Rosto próprio distinto do menino, expressão curiosa tranquila e anatomia infantil natural.

## Arquivos e qualidade

- assets/skins/<id>/estilo-{1,2,3}/corpo.webp: 1024 × 1536, qualidade 92, até 450.000 bytes, fundo transparente.
- corpo@2x.webp: 2048 × 3072, ampliação da mesma pintura; sem detalhe nativo adicional.
- icone.webp: 256 × 256, estilo 1 com moldura de raridade. ficha.json contém ID, apresentação, estilos, rosto, adaptação e figurino.
- As femininas que são personagens ficam na raiz do ID. Somente a apresentação adicional da criança genérica fica em feminino/.
- Âncoras canônicas: cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de ±12 px. Anotações visuais aproximadas no original, revisadas nas provas. MEDIDAS.json registra a transformação e os pontos usados.
- Crianças: anatomia infantil, topo 120–170, mesmas três âncoras e escala uniforme, sem cisalhamento. As medidas próprias estão na ficha de cada apresentação.
- 14 capturas técnicas em 320/412 px e duas galerias. São prévias com a geometria atual do AvatarRenderer; não são testes de navegação do app integrado.
- VALIDACAO.json quantifica dimensões, pesos, pontos, chão e alfa da base/@2x. Microalfa de até 2/255 é registrado separadamente da cobertura visível; sem névoa afastada.
- FONTE.json registra os hashes do plano e dos arquivos de referência. A geometria é um snapshot somente de leitura do checkout local do app; o restante vem do commit acima.
- SHA256SUMS.txt confere todos os demais arquivos do pacote. O .zip.sha256 externo confere o ZIP lacrado.

## Integração

Conferir o ZIP e todas as somas, rever a arte e aplicar apenas os diretórios entregues, sem sobrescrever trabalho paralelo. Preservar IDs, nomes, estilos, sexo e regras do plano. Usar os geradores oficiais gen-skin-art.mjs e skins-add-lot.mjs S20; conferir a apresentação feminina adicional de S20. A integração de catálogo, regras, migrações aditivas e testes pertence ao responsável pelo app.

Validar o app com os roteiros apropriados do projeto: unitários/TypeScript, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local limpo, conforme o escopo e as autorizações atuais do chat de desenvolvimento. Registrar o fechamento, atualizar STATUS/LOTES e devolver os resultados antes de seguir ao próximo par.

Este chat produziu apenas arte e arquivos locais de entrega. Banco, migrações e código do app não foram modificados aqui. Até dois lotes nesta entrega: S19/S20.
