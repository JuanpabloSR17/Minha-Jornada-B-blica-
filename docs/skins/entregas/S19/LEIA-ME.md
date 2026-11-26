# Jornada Bíblica · S19

6 skins, 6 apresentações e **18 pinturas completas** no padrão pintado 2.5D aprovado. Cada apresentação tem rosto próprio, preservado nos três estilos. Personagens bíblicos só no próprio sexo; a criança genérica de S20 inclui menino e menina.

Fonte: branch claude/kind-bell-fuk4e4, commit 2c5185cfbbfb440f9080b46a36b8e782de6f1e61, LOTES.md atual, estilos exatos do plano. As adaptações e os figurinos estão documentados em NOTAS-BIBLICAS.md desde antes das bases. Os campos locais de direção artística não foram apresentados como uma alteração já aprovada/publicada no catálogo. Cores de roupa, idades aparentes e rosto não são informações históricas comprovadas.

- **Traje de Jairo** · `raro_jairo`

  Homem maduro, cerca de55 anos como direção artística, rosto triangular invertido de têmporas largas, testa alta, sobrancelhas cheias quase horizontais, olhos estreitos atentos, nariz convexo longo e queixo afilado. Barba curta em cunha na cor do cabelo; expressão preocupada e digna.

- **A mulher que tocou o manto** · `raro_a_mulher_que_tocou_o_manto`

  Mulher adulta de aproximadamente46 anos, rosto retangular estreito, maçãs discretas, olheiras suaves, testa baixa, sobrancelhas finas inclinadas, olhos grandes profundos, nariz estreito reto e boca pequena de lábios finos. Queixo arredondado; esperança contida, sem expressão de dor.

- **O semeador (parábola)** · `raro_o_semeador`

  Homem adulto de cerca de32 anos, rosto pentagonal de maçãs largas e mandíbula compacta, testa curta, sobrancelhas angulares separadas, olhos pequenos ligeiramente afastados, nariz curto largo e lábio superior fino. Barba muito curta de trabalho e bigode ralo na cor do cabelo; expressão atenta e tranquila.

- **Traje de Simão de Cirene** · `raro_simao_de_cirene`

  Homem adulto de cerca de40 anos, rosto oblongado de maçãs proeminentes, testa inclinada, olhos fundos amendoados, nariz largo de ponte alta, boca larga com lábios cheios e queixo arredondado. Barba curta espessa recortada e bigode na cor exata do cabelo; expressão concentrada e compassiva.

- **Traje de Joana e Susana** · `raro_joana_e_susana`

  Viajante adulta de cerca de40 anos, rosto retangular curto de maxilar largo, testa baixa, sobrancelhas curtas quase retas, olhos pequenos arredondados e afastados, nariz curto largo de ponta arredondada, boca estreita de lábio inferior cheio e queixo largo com leve fenda. Expressão serena e enérgica; rosto próprio distinto das outras viajantes.

- **Traje de Salomé** · `raro_salome`

  Mulher madura de aproximadamente58 anos, rosto oval curto de bochechas suaves, testa larga com linhas leves, sobrancelhas curtas arqueadas, olhos pequenos expressivos com marcas naturais, nariz convexo definido e boca estreita. Queixo cheio e expressão afetuosa serena, sem cabelos automaticamente grisalhos.

## Arquivos e qualidade

- assets/skins/<id>/estilo-{1,2,3}/corpo.webp: 1024 × 1536, qualidade 92, até 450.000 bytes, fundo transparente.
- corpo@2x.webp: 2048 × 3072, ampliação da mesma pintura; sem detalhe nativo adicional.
- icone.webp: 256 × 256, estilo 1 com moldura de raridade. ficha.json contém ID, apresentação, estilos, rosto, adaptação e figurino.
- As femininas que são personagens ficam na raiz do ID. Somente a apresentação adicional da criança genérica fica em feminino/.
- Âncoras canônicas: cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de ±12 px. Anotações visuais aproximadas no original, revisadas nas provas. MEDIDAS.json registra a transformação e os pontos usados.
- Crianças: anatomia infantil, topo 120–170, mesmas três âncoras e escala uniforme, sem cisalhamento. As medidas próprias estão na ficha de cada apresentação.
- 12 capturas técnicas em 320/412 px e duas galerias. São prévias com a geometria atual do AvatarRenderer; não são testes de navegação do app integrado.
- VALIDACAO.json quantifica dimensões, pesos, pontos, chão e alfa da base/@2x. Microalfa de até 2/255 é registrado separadamente da cobertura visível; sem névoa afastada.
- FONTE.json registra os hashes do plano e dos arquivos de referência. A geometria é um snapshot somente de leitura do checkout local do app; o restante vem do commit acima.
- SHA256SUMS.txt confere todos os demais arquivos do pacote. O .zip.sha256 externo confere o ZIP lacrado.

## Integração

Conferir o ZIP e todas as somas, rever a arte e aplicar apenas os diretórios entregues, sem sobrescrever trabalho paralelo. Preservar IDs, nomes, estilos, sexo e regras do plano. Usar os geradores oficiais gen-skin-art.mjs e skins-add-lot.mjs S19; conferir a apresentação feminina adicional de S20. A integração de catálogo, regras, migrações aditivas e testes pertence ao responsável pelo app.

Validar o app com os roteiros apropriados do projeto: unitários/TypeScript, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local limpo, conforme o escopo e as autorizações atuais do chat de desenvolvimento. Registrar o fechamento, atualizar STATUS/LOTES e devolver os resultados antes de seguir ao próximo par.

Este chat produziu apenas arte e arquivos locais de entrega. Banco, migrações e código do app não foram modificados aqui. Até dois lotes nesta entrega: S19/S20.
