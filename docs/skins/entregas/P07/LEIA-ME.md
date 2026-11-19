# Jornada Bíblica · P07

## Revisão da entrega · versão 2

Vestes de Jonas recebeu rosto compacto mais largo, nariz curto de ponte baixa e bigode sem barba no queixo ou nas faces. A alteração foi feita nos três estilos após a comparação conjunta apontar semelhança com João Batista. Tons, penteados, cores, trajes, objetos, IDs e regras de leitura foram preservados. A ficha registra `revisaoRosto`. Este pacote completo substitui o ZIP inicial do mesmo lote; não cadastra skins novas. As demais cinco skins do lote permanecem iguais. A Gloriosa Jonas e o grande peixe conserva o seu rosto próprio já distinto, como nas duas Ester e nas duas skins de Jó da entrega anterior; a identidade é definida por skin, conforme o pedido e o padrão aprovado. A folha `capturas/Comparacao_Rostos_P07.png` mostra os três estilos de João Batista e o antes/depois da skin corrigida.

Produção conforme o branch `claude/kind-bell-fuk4e4`, commit `593028f`, o `LOTES.md`, o `PRODUCAO-POR-LOTES.md` e o contrato de `TEMPORADA-1-EXODO.md` §2.

**6 skins completas, de corpo inteiro, em 3 estilos: 18 pinturas 2.5D.** São 2 Lendárias e 4 Gloriosas. Cada personagem tem somente a apresentação do próprio sexo.

## Identidades dos rostos

Cada skin tem formato de rosto, nariz, olhos, maxilar, idade aparente e expressão próprios, registrados em `identidadeFacial` na ficha e no plano. Os três estilos preservam esse perfil e usam os tons, cores e penteados do briefing. Referência de materiais sem rostos para evitar reaproveitar retratos. A prancha `capturas/Rostos_P07.png` mostra as 18 apresentações; `Galeria_P07.png` mostra as pinturas completas. Os rostos são criações artísticas, sem pretensão de retrato histórico.

- **Vestes de Jonas** — `lendario_jonas` — Jn 1:3
  Identidade facial: Adulto de meia-idade; rosto compacto largo de bochechas cheias, nariz curto largo de ponte baixa, olhos pequenos de pálpebras pesadas, queixo arredondado liso e bigode cheio aparado; sem barba nas faces nem no queixo.
- **Daniel na cova dos leões** — `glorioso_daniel_na_cova_dos_leoes` — Dn 6:22
  Identidade facial: Ancião; testa alta com linhas horizontais, rosto comprido de maçãs cheias, nariz aquilino estreito, olhos pequenos serenos e barba longa de base retangular.
- **Isaías e a brasa do altar** — `glorioso_isaias_e_a_brasa_do_altar` — Is 6:6-8
  Identidade facial: Adulto maduro; rosto hexagonal magro, maçãs altas com sulcos abaixo, nariz estreito com desvio sutil, olhos alongados elevados e barba curta rala que deixa os lábios visíveis.
- **Jonas e o grande peixe** — `glorioso_jonas_e_o_grande_peixe` — Jn 2:10
  Identidade facial: Adulto; rosto oval largo, maxilar arredondado pesado, nariz curto arrebitado, orelhas arredondadas, olhos grandes afastados e barba curta encaracolada; expressão de alívio.
- **Ezequiel no vale de ossos** — `glorioso_ezequiel_no_vale_de_ossos` — Ez 37:1-10
  Identidade facial: Maduro; rosto largo e plano de contorno retangular, testa baixa, nariz achatado largo, olhos oblíquos fundos, sobrancelhas arqueadas assimétricas e barba média em leque.
- **Vestes de João Batista** — `lendario_joao_batista` — Mt 3:4
  Identidade facial: Adulto; rosto estreito em cunha, testa plana com sobrancelhas muito arqueadas, nariz grande de ponta voltada para baixo, boca larga e barba áspera bifurcada.

## Arquivos

- `assets/skins/<id>/estilo-1..3/corpo.webp`: pintura inteira 1024 × 1536, fundo transparente, WebP qualidade 92 e até 450 KB.
- `corpo@2x.webp`: 2048 × 3072, exportação ampliada da mesma pintura.
- `icone.webp`: 256 × 256, primeiro estilo com moldura da raridade.
- `ficha.json`: metadados, apresentação, estilos, identidade facial e âncoras.
- Cabeça [512,300], queixo [512,391], pés [512,1450], tolerância de 12 px.
- `capturas/`: seis folhas de 320 px, seis de 412 px, galeria completa e prancha de rostos. Prévias técnicas com a geometria do AvatarRenderer; a auditoria do app integrado fica com o ciclo oficial do Claude.
- `PLANO-DO-LOTE.json`: registros de origem e identidades faciais.
- `PROMPTS.md`: prompts reais do gerador de imagens integrado e eventuais correções.
- `VALIDACAO.json`: dimensões, peso, pés, âncoras e transparência das exportações.
- `SHA256SUMS.txt`: SHA-256 de todos os demais arquivos do pacote. O `.zip.sha256` externo confere o ZIP.

## Adaptações da pintura

Daniel tem aparência de ancião, traje de oficial e dois leões mansos em tamanho coerente, dentro do recorte transparente. O gesto de Isaías com a tenaz e a brasa é uma adaptação simbólica para a skin de um único viajante: na passagem o gesto pertence ao serafim. A pintura não pretende substituir essa narrativa; dispensa uma mão avulsa ou um segundo personagem. A fumaça do altar fica confinada junto ao objeto, sem névoa de fundo. Jonas resgatado usa uma costa genérica, sem nome de cidade, com manto molhado, algas e um pequeno motivo de água. O documento de viagem de Jonas é um pergaminho simbólico, sem aparência de bilhete moderno. O vale de Ezequiel é sugerido por manto ao vento, ossos secos limpos e brotos, sem cadáveres ou violência. João Batista conserva o traje áspero de pelos de camelo e o cinto de couro.

## Integração pelo Claude Code

1. Conferir o SHA-256 externo e todas as somas internas; extrair em pasta separada.
2. Revisar arte, rostos, estilos, apresentação, mãos, apoios, recortes, transparência e peso.
3. Copiar os assets e executar `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P07`.
4. Executar testes unitários, bateria SQL, `FLOW=skins-audit`, fluxos `marco1`, `journey`, `lobby`, `fixes` e Supabase local oficial.
5. Regerar `STATUS.md` e `LOTES.md`, atualizar `PARA-O-CODEX.md`, publicar no mesmo branch e informar testes e commit.

Esta produção local altera apenas assets e arquivos de entrega. Migrações, banco e testes de integração pertencem ao ciclo do Claude Code. Não produzir o lote seguinte antes de encerrar esta entrega.
