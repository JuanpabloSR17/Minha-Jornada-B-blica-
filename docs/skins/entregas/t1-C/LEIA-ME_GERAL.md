# Temporada 1 · Êxodo

Pacote de arte para `claude/kind-bell-fuk4e4`, preparado sobre `08e9761` e seguindo **PARA-O-CODEX §12**. Reúne as 11 skins pendentes da temporada, com 48 pinturas 2.5D distribuídas em 16 apresentações.

A entrega cobre os lotes T1-C e T1-D de LOTES.md. Conferi os IDs, os estilos e os recortes também contra o branch em 3b6570e.

| Entrega | Skin | Elemento que identifica |
| --- | --- | --- |
| Início | Pastor e Pastora de ovelhas | Lã simples, cajado curvo e odre |
| Leitura | Vestes de Arão | Éfode tecido, peitoral de doze pedras e mitra de linho |
| Leitura | Moisés com o rosto resplandecente | Tábuas da Aliança, manto do Sinai e luz pintada no rosto |
| Leitura | Arão e a vara que floresceu | Ramo de amendoeira com flores e frutos |
| Temporada | Tamborim de Miriã | Tamborim de pele e véu |
| Temporada | Avental de Bezalel | Avental de artífice e acácia com incrustação |
| Temporada | Manto de Jetro | Manto listado de ancião de Midiã |
| Temporada | Véu de Zípora | Véu de Midiã e cântaro de barro |
| Temporada | Hur | Manto de viagem e gesto de sustentar |
| Temporada | Aoliabe, o bordador | Trabalho em azul, púrpura e carmesim |
| Temporada | Tocador de shofar | Chifre de carneiro |

As pastas `feminino/` trazem Pastora de ovelhas e as apresentações femininas de Moisés com o rosto resplandecente, Avental de Bezalel, Aoliabe e Tocador de shofar. Miriã e Zípora já têm apresentação padrão feminina. Nas duas skins de Arão e no Manto de Jetro, a apresentação padrão acompanha o traje sacerdotal que serve de inspiração. Hur segue como personagem individual. Seu gesto remete a Êxodo 17:12.

## Integração

1. Confira o arquivo de soma `.zip.sha256`. Extraia o ZIP em uma pasta separada e valide os 163 arquivos com `SHA256SUMS.txt`.
2. Copie os diretórios de `assets/skins/` para o repositório. As fichas mantêm as raridades, origens, estilos e referências do catálogo de `08e9761`.
3. No ambiente do repositório, execute `node scripts/gen-skin-art.mjs` para atualizar o registro de pinturas. As apresentações adicionais estão prontas para o registro em `skins.variants` descrito em PARA-O-CODEX §9.

Cada apresentação contém três pinturas transparentes em WebP de 1024 × 1536, ampliações `@2x` de 2048 × 3072, ícone de 256 × 256 e ficha. As capturas de 320 e 412 px usam os recortes de corpo inteiro, retrato e rosto do `AvatarRenderer`. A galeria reúne os 48 estilos.
