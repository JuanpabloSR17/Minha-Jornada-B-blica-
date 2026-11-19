# Jornada Bíblica · P05

Entrega a partir do branch `claude/kind-bell-fuk4e4`, commit `97b4be6`, seguindo `PRODUCAO-POR-LOTES.md`, `LOTES.md` e o contrato de `TEMPORADA-1-EXODO.md` §2.

**6 skins e 18 pinturas 2.5D**, cada skin em três estilos. P05 contém uma Lendária e cinco Gloriosas; P06 contém cinco Lendárias e uma Gloriosa. Todos os personagens têm somente a apresentação do próprio sexo; Ester usa a pasta raiz da skin.

## Direção dos rostos

Pedido do usuário: cada skin Lendária e Gloriosa deve ter seu rosto específico, especial e diferente das demais. Foram definidos perfis de rosto, nariz, olhos, maxilar, idade aparente e expressão para cada skin. As referências de acabamento foram transformadas numa prancha de materiais sem rostos para evitar repetir o mesmo retrato. Cada skin tem o seu perfil registrado na ficha e no plano; os três estilos seguem esse perfil com os tons e cabelos exatos do briefing. A folha `capturas/Rostos_P05.png` permite comparar as 18 apresentações do lote.

- **Vestes de Ester** — `lendario_ester` — Et 2:17
  Identidade facial: Jovem adulta; rosto em coração, testa ampla, maçãs altas, queixo pequeno arredondado, nariz curto de ponta arredondada, olhos amendoados abertos e sorriso contido.
- **Davi diante de Golias** — `glorioso_davi_diante_de_golias` — 1 Sm 17:40
  Identidade facial: Jovem adulto; rosto triangular estreito, sobrancelhas retas baixas, nariz largo de ponta levemente elevada, orelhas discretamente salientes, boca pequena e olhar determinado.
- **Elias no carro de fogo** — `glorioso_elias_no_carro_de_fogo` — 2 Rs 2:11
  Identidade facial: Adulto maduro; rosto longo e magro, testa alta marcada, nariz convexo proeminente, olhos fundos semicerrados e barba longa estreita.
- **Ester diante do rei** — `glorioso_ester_diante_do_rei` — Et 5:1-2
  Identidade facial: Adulta; rosto oval alongado, maxilar definido, nariz longo reto, olhos alongados de cantos elevados, sobrancelhas espessas e expressão resoluta.
- **Josué diante das muralhas** — `glorioso_josue_diante_das_muralhas` — Js 6:20
  Identidade facial: Adulto; rosto trapezoidal largo, maxilar pesado, nariz largo de ponte baixa, olhos próximos e sobrancelhas retas espessas.
- **Salomão no trono de marfim** — `glorioso_salomao_no_trono_de_marfim` — 1 Rs 10:18-20
  Identidade facial: Adulto; rosto estreito oblongo, testa larga e queixo afilado, nariz fino comprido, sobrancelhas altas, olhos estreitos e barba curta em ponta.

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

O grupo de Salomão mantém o rei de pé junto ao trono de marfim e aos leões esculpidos, para respeitar as âncoras do AvatarRenderer. O gesto de Ester tocar o cetro usa um suporte cerimonial completo, sem uma mão avulsa de outro personagem. Josué leva um fragmento das muralhas como elemento de cena dentro do recorte transparente. Elias usa luz quente nas vestes e formas de fogo junto ao manto, sem substituir o fundo do app. Davi conserva a funda e as cinco pedras no saquitel.

## Conferência e integração

1. Conferir SHA-256 externo e todas as somas internas, e extrair numa pasta separada.
2. Revisar arte, identidades dos rostos, três estilos, apresentação, mãos, apoios dos objetos, transparência, medidas, âncoras e peso.
3. Copiar os assets e rodar `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P05`.
4. Executar bateria SQL, `FLOW=skins-audit`, fluxos `marco1`, `journey`, `lobby`, `fixes` e Supabase local oficial.
5. Atualizar `STATUS.md` e `LOTES.md`, publicar no branch e informar testes e commit.

A produção local do Codex altera apenas assets e arquivos de entrega. Migrações, banco e testes de integração ficam com o ciclo do Claude Code. As pinturas são representações artísticas inspiradas.
