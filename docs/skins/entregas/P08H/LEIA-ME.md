# Apóstolos · revisão de idade e cabelo (P08H)

Cinco skins de corpo inteiro, três pinturas por skin: Pedro, João, Tiago, André e Mateus. São **15 pinturas**, 30 WebPs de corpo (base e @2x), cinco ícones e cinco fichas, nos mesmos IDs e caminhos. Base: commit aa982bc de claude/kind-bell-fuk4e4.

Os apóstolos receberam aparência mais jovem, em faixas diferentes, sem grisalho e sem marcas excessivas. Tiago conserva seu rosto retangular próprio e ganhou ondas escuras no lugar dos dreads loiros. Todos os cinco usam cabelos naturais escuros. As três opções de tom de pele por skin continuam; os penteados e as cores de cabelo mudam conforme AJUSTES-CATALOGO.json. A identidade de cada skin se mantém nos três estilos e difere das demais skins.

## Pesquisa e limites

PESQUISA-HISTORICA.md contém as fontes e as conclusões. **Não há idade individual exata comprovada nessas fontes.** As faixas visuais são escolhas artísticas. As skins continuam trajes inspirados para os jogadores; não são retratos históricos autenticados nem reconstruções arqueológicas literais das roupas. A pesquisa trata do período do ministério; João em Patmos pertence a uma fase posterior e não deve ser automaticamente rejuvenescido.

## Integração no app

1. Conferir o .zip.sha256, SHA256SUMS.txt, galerias e capturas.
2. Substituir somente assets/skins/<id>/ das cinco skins incluídas. Manter Maria, P07 e todas as demais skins.
3. Aplicar os novos styles e identidadeFacial de AJUSTES-CATALOGO.json no plano e no catálogo do app. Os IDs existentes de tom, cor e penteado foram reutilizados; nenhum novo valor de domínio é necessário. Guardar a pesquisa em docs/skins.
4. Regenerar o registro da arte, testar e atualizar a documentação. A troca é visual: não alterar regras de leitura, posse, apresentações, migrações nem funções do banco.

## Arquivos e qualidade

- Base: WebP 1024×1536, qualidade 92, até 450000 bytes, fundo transparente.
- @2x: 2048×3072, ampliação da MESMA pintura para exportação; não é uma nova geração com detalhe nativo adicional.
- Âncoras: cabeça (512,300), queixo (512,391), pés (512,1450), tolerância de 12 px, com ajustes uniformes de escala/alinhamento.
- Ícones: 256×256, moldura Lendária, novo retrato.
- Capturas técnicas em 320 e 412 px usam os recortes e a geometria do AvatarRenderer do commit base. São prévias de integração, não comprovação de teste do app publicado.
- Galeria_Apostolos.png: as 15 pinturas completas. Rostos_Apostolos.png: conferência de identidade, juventude e cabelo. Comparacao_Apostolos.png: antes/depois.
- VALIDACAO.json: dimensões, peso, âncoras, pés e transparência das exportações.
- PROMPTS.md: prompts reais da ferramenta integrada ImageGen.

As versões originais permanecem preservadas fora deste pacote. Sem mudança local de banco, migração, regra de obtenção ou código do aplicativo.
