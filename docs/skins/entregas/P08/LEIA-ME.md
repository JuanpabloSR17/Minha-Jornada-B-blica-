# Jornada Bíblica · P08

Produção conforme o branch `claude/kind-bell-fuk4e4`, commit `593028f`, o `LOTES.md`, o `PRODUCAO-POR-LOTES.md` e o contrato de `TEMPORADA-1-EXODO.md` §2.

**6 skins completas, de corpo inteiro, em 3 estilos: 18 pinturas 2.5D.** São 6 Lendárias e 0 Gloriosas. Cada personagem tem somente a apresentação do próprio sexo.

## Identidades dos rostos

Cada skin tem formato de rosto, nariz, olhos, maxilar, idade aparente e expressão próprios, registrados em `identidadeFacial` na ficha e no plano. Os três estilos preservam esse perfil e usam os tons, cores e penteados do briefing. Referência de materiais sem rostos para evitar reaproveitar retratos. A prancha `capturas/Rostos_P08.png` mostra as 18 apresentações; `Galeria_P08.png` mostra as pinturas completas. Os rostos são criações artísticas, sem pretensão de retrato histórico.

- **Vestes de Pedro** — `lendario_pedro` — Mt 4:18; 16:18
  Identidade facial: Adulto maduro; cabeça larga arredondada, maxilar pesado de cantos redondos, nariz curto largo de ponta bulbosa, sobrancelhas grossas baixas, olhos pequenos francos e barba curta cheia.
- **Vestes de João, o apóstolo** — `lendario_joao_o_apostolo` — Jo 13:23; 19:27
  Identidade facial: Jovem adulto; testa larga e rosto curto em coração, queixo pequeno, nariz pequeno arredondado, olhos amendoados grandes afastados e lábio superior fino; sem barba.
- **Vestes de Tiago, filho de Zebedeu** — `lendario_tiago_filho_de_zebedeu` — Mc 1:19; 3:17
  Identidade facial: Adulto; rosto triangular comprido, maçãs altas inclinadas, nariz convexo forte, sobrancelhas diagonais, olhos estreitos intensos e bigode volumoso sobre barba curta afilada.
- **Vestes de André** — `lendario_andre` — Jo 1:40-42
  Identidade facial: Adulto; rosto oval comprido com têmporas estreitas, testa alta arredondada, nariz largo de ponta comprida, olhos baixos acolhedores, boca larga e barba média arredondada.
- **Vestes de Mateus** — `lendario_mateus` — Mt 9:9
  Identidade facial: Adulto; rosto retangular fino de maçãs planas, nariz comprido de ponte curva, olhos pequenos atentos, uma sobrancelha elevada, lábios estreitos e barba muito curta bem aparada.
- **Manto de Maria, mãe de Jesus** — `lendario_maria_mae_de_jesus` — Lc 1:38; 2:19
  Identidade facial: Adulta jovem; rosto alongado em pera, testa estreita, bochechas baixas suaves, nariz de base larga e ponta redonda, olhos baixos de pálpebras suaves e sorriso discreto.

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

Pedro leva a rede apoiada no antebraço e a chave no cinto. João é um jovem adulto com rolo fechado; Tiago leva corda de pesca, rede e flutuador, sem raios literais. André traz cesto e rede e faz um gesto de convite, sem outra figura. Mateus segura o rolo de contas e a pena de escrever de forma apoiada. Maria usa manto azul e véu simples com os cabelos parcialmente visíveis, para distinguir os estilos; somente sua apresentação feminina, na pasta raiz da skin. O manto azul é a direção de arte pedida no briefing, sem alegação de cor histórica. Não há auréola nem figura divina na pintura.

## Integração pelo Claude Code

1. Conferir o SHA-256 externo e todas as somas internas; extrair em pasta separada.
2. Revisar arte, rostos, estilos, apresentação, mãos, apoios, recortes, transparência e peso.
3. Copiar os assets e executar `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P08`.
4. Executar testes unitários, bateria SQL, `FLOW=skins-audit`, fluxos `marco1`, `journey`, `lobby`, `fixes` e Supabase local oficial.
5. Regerar `STATUS.md` e `LOTES.md`, atualizar `PARA-O-CODEX.md`, publicar no mesmo branch e informar testes e commit.

Esta produção local altera apenas assets e arquivos de entrega. Migrações, banco e testes de integração pertencem ao ciclo do Claude Code. Não produzir o lote seguinte antes de encerrar esta entrega.
