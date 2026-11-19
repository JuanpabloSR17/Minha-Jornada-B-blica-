# Jornada Bíblica · P06

Entrega a partir do branch `claude/kind-bell-fuk4e4`, commit `97b4be6`, seguindo `PRODUCAO-POR-LOTES.md`, `LOTES.md` e o contrato de `TEMPORADA-1-EXODO.md` §2.

**6 skins e 18 pinturas 2.5D**, cada skin em três estilos. P05 contém uma Lendária e cinco Gloriosas; P06 contém cinco Lendárias e uma Gloriosa. Todos os personagens têm somente a apresentação do próprio sexo; Ester usa a pasta raiz da skin.

## Direção dos rostos

Pedido do usuário: cada skin Lendária e Gloriosa deve ter seu rosto específico, especial e diferente das demais. Foram definidos perfis de rosto, nariz, olhos, maxilar, idade aparente e expressão para cada skin. As referências de acabamento foram transformadas numa prancha de materiais sem rostos para evitar repetir o mesmo retrato. Cada skin tem o seu perfil registrado na ficha e no plano; os três estilos seguem esse perfil com os tons e cabelos exatos do briefing. A folha `capturas/Rostos_P06.png` permite comparar as 18 apresentações do lote.

- **Vestes de Jó** — `lendario_jo` — Jó 1:1; 2:8
  Identidade facial: Maduro; rosto retangular cavado, maçãs baixas, nariz largo de ponta caída, pálpebras pesadas, boca fina e linhas fundas de expressão.
- **Jó restaurado** — `glorioso_jo_restaurado` — Jó 42:10-12
  Identidade facial: Maduro; rosto redondo largo, bochechas cheias, nariz curto largo, olhos sorridentes, queixo arredondado e barba cheia arredondada.
- **Vestes de Isaías** — `lendario_isaias` — Is 6:1
  Identidade facial: Maduro; rosto em losango, maçãs largas e salientes, queixo fino, nariz muito reto e estreito, olhos pequenos e sobrancelhas arqueadas finas.
- **Vestes de Jeremias** — `lendario_jeremias` — Jr 13:1; 27:2
  Identidade facial: Adulto; rosto em pera, testa estreita, maxilar amplo com covinha discreta, nariz suavemente côncavo, olhos grandes de cantos baixos e barba curta.
- **Vestes de Ezequiel** — `lendario_ezequiel` — Ez 2:9-3:3
  Identidade facial: Adulto; rosto quadrado compacto, maçãs e queixo fortes, nariz de ponte alta larga, olhos bem espaçados, orelhas visíveis e barba densa de base reta.
- **Vestes de Daniel** — `lendario_daniel` — Dn 1:8-17
  Identidade facial: Jovem adulto; rosto oval suave, bochechas cheias, nariz pequeno reto, olhos redondos fundos, lábio inferior cheio, queixo suave e sem barba.

## Arquivos e contrato

- `assets/skins/<id>/estilo-1..3/corpo.webp`: 1024 × 1536, alfa transparente, WebP com qualidade 92.
- `corpo@2x.webp`: 2048 × 3072, exportação ampliada da mesma pintura.
- `icone.webp`: 256 × 256, primeiro estilo com moldura da raridade.
- `ficha.json`: identidade facial, metadados, apresentação, três estilos e âncoras.
- Pés em y=1450; cabeça [512,300], queixo [512,391]; tolerância de 12 px.
- `capturas/`: seis folhas de 320 px, seis de 412 px, galeria de corpo inteiro e prancha de rostos. São prévias técnicas pela geometria do AvatarRenderer; a auditoria do app integrado pertence ao ciclo do Claude Code.
- `PLANO-DO-LOTE.json`: registros de origem e perfis faciais.
- `VALIDACAO.json`: medidas, peso e alfa dos arquivos exportados.
- `PROMPTS.md`: prompts do ImageGen integrado e correções de produção.
- `SHA256SUMS.txt`: SHA-256 de todos os outros arquivos do pacote; `.zip.sha256` externo: SHA-256 do ZIP.

## Elementos de cena

O rebanho de Jó restaurado é representado por um grupo compacto em dois pares, como motivo visual de restauração, e não como contagem literal dos animais da passagem. Jeremias sustenta a canga apoiada nos ombros. O rolo de Ezequiel faz uma dobra que revela a frente e parte do verso. Os rostos têm formatos, idades aparentes e expressões próprios; são decisões de direção de arte.

## Conferência e integração

1. Conferir SHA-256 externo e todas as somas internas, e extrair numa pasta separada.
2. Revisar arte, identidades dos rostos, três estilos, apresentação, mãos, apoios dos objetos, transparência, medidas, âncoras e peso.
3. Copiar os assets e rodar `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P06`.
4. Executar bateria SQL, `FLOW=skins-audit`, fluxos `marco1`, `journey`, `lobby`, `fixes` e Supabase local oficial.
5. Atualizar `STATUS.md` e `LOTES.md`, publicar no branch e informar testes e commit.

A produção local do Codex altera apenas assets e arquivos de entrega. Migrações, banco e testes de integração ficam com o ciclo do Claude Code. As pinturas são representações artísticas inspiradas.
