# Jornada Bíblica · S16

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit d376644. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Oito skins têm somente apresentação masculina; Maria de Betânia, a samaritana, a mulher do perfume e Isabel têm somente apresentação feminina, conforme o briefing. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **A mulher do perfume** — `epico_a_mulher_do_perfume` — Mc 14:3
  Rosto: Mulher adulta de rosto oblongo, maçãs largas e mandíbula afilada, testa alta, sobrancelhas finas suavemente inclinadas, olhos arredondados de pálpebras bem marcadas, nariz comprido de ponte reta, boca pequena de lábios finos e queixo firme. Expressão concentrada e generosa, distinta de Maria de Betânia.
- **O bom samaritano (parábola)** — `epico_o_bom_samaritano` — Lc 10:33-35
  Rosto: Homem adulto maduro com rosto largo de mandíbula robusta, testa curta, sobrancelhas baixas de pontas suaves, olhos estreitos acolhedores com marcas de sol, nariz largo e achatado de ponta redonda, boca grande e barba curta encaracolada compacta. Expressão compassiva e atenta.
- **O filho pródigo (parábola)** — `epico_o_filho_prodigo` — Lc 15:22
  Rosto: Jovem adulto de rosto em losango, maçãs altas estreitas, testa média, sobrancelhas inclinadas cheias, olhos grandes profundos, nariz reto de ponta larga, boca de lábio inferior cheio e queixo anguloso limpo. Rosto sem barba, expressão grata e um pouco emocionada.
- **Traje de Zacarias, o sacerdote** — `epico_zacarias_o_sacerdote` — Lc 1:8-9
  Rosto: Sacerdote idoso de rosto oval comprido, orelhas marcadas, testa alta sulcada, sobrancelhas finas arqueadas, olhos fundos de pálpebras caídas, nariz central comprido arredondado e boca fina. Barba comprida afilada sem tranças. Expressão reverente e concentrada.
- **Traje de Isabel** — `epico_isabel` — Lc 1:41-42
  Rosto: Senhora idosa de rosto largo e arredondado, maçãs salientes, testa alta ampla, sobrancelhas discretas arqueadas, olhos pequenos vivos de cantos sorridentes, nariz largo de ponta suave, boca fina larga e sulcos profundos de sorriso. Queixo curto e forte, expressão de louvor caloroso.
- **Traje de Simeão** — `epico_simeao` — Lc 2:28
  Rosto: Ancião de rosto retangular estreito e magro, têmporas fundas, testa baixa enrugada, sobrancelhas compridas finas, olhos de cantos externos altos e pálpebras pesadas, nariz muito longo estreito e queixo saliente. Barba média rala afilada e bigode fino. Expressão de admiração e gratidão.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S16.png de corpos e Rostos_S16.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; os prompts identificam expressamente as referências de material, pigmento e identidade de cada imagem.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S16 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou continuar S15/S16 em 25/11/2026. As 12 adaptações foram aprovadas em 55f3cf8 antes da produção; o complemento de figurino pedido durante S15 foi registrado em d376644 antes da revisão de Nicodemos e das bases S16. O campo figurino aprovado é preservado nas fichas quando presente no plano. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S15/S16.

## Revisão v2 — retorno do Claude no commit 6e87f35 (§36)

Pacote completo. S15 clareia somente Zaqueu estilo-2 para o tom2; S16 clareia somente Simeão estilo-1 para o tom1. As correções preservam rosto próprio, idade, cabelo/barba, figurino, pose, objetos, IDs e âncoras. Os demais assets foram preservados byte a byte. CORRECOES-V2.json documenta os hashes anteriores/atuais e capturas/Comparacao_V2.png mostra antes/depois, outros estilos e referência aprovada. A correção de Simeão inclui seu ícone, que deriva do estilo1. As galerias, prévias do personagem corrigido, prompts e validação foram atualizados. Os ZIPs originais permanecem imutáveis. Sem migração ou mudança no banco. A integração oficial e os testes finais continuam sujeitos à revisão do Claude.
