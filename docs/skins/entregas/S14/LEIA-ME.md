# Jornada Bíblica · S14_v2

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 693f4ef. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Onze skins têm somente apresentação masculina; Marta tem somente apresentação feminina, conforme o personagem e o briefing. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Os recabitas** — `raro_os_recabitas` — Jr 35:6-7
  Rosto: Representante coletivo adulto de rosto pentagonal largo, testa baixa reta, bochechas planas e queixo longo largo; nariz médio convexo de ponta romba, olhos pequenos próximos, sobrancelhas finas baixas e boca estreita; bigode comprido discreto e sombra curta de barba. Expressão tranquila resoluta; mesma pessoa nos três estilos.
- **Traje de Dario, o medo** — `raro_dario_o_medo` — Dn 6:25-26
  Rosto: Rei idoso de rosto retangular largo e pesado, testa ampla, maxilar forte com queixo duplo discreto; nariz longo reto de ponta aquilina, olhos pequenos próximos fundos e sobrancelhas longas retas; barba média curta em leque de base quase reta, bigode paralelo e sulcos naturais de idade. Expressão régia grave sem dureza caricata.
- **Traje de Hananias, Misael e Azarias** — `raro_hananias_misael_e_azarias` — Dn 1:6-7
  Rosto: Representante coletivo masculino adulto jovem de rosto oval comprido suave, testa alta arredondada, mandíbula estreita e queixo curto rombo; nariz longo fino de ponta levemente elevada, olhos amendoados grandes próximos, sobrancelhas finas quase retas e lábio superior cheio. Sem barba nem bigode; expressão estudiosa confiante, distinta do representante adulto de Daniel 3.
- **Traje de Aspenaz** — `raro_aspenaz` — Dn 1:9
  Rosto: Oficial maduro de rosto losangular largo, maçãs muito altas e queixo estreito bem definido; nariz curto de ponte estreita reta e ponta arredondada, olhos estreitos ascendentes afastados, sobrancelhas altas finas arqueadas e lábio inferior cheio. Rosto sem barba, apenas bigode fino reto; expressão acolhedora comedida.
- **Traje de Gemarias** — `raro_gemarias` — Jr 36:10-12
  Rosto: Oficial maduro de rosto quadrado curto, testa ampla plana e queixo pequeno em bloco com fenda discreta; nariz grande aquilino de raiz larga, olhos redondos próximos profundos com pálpebras baixas e sobrancelhas grossas retas; bigode curto curvo e pequeno cavanhaque, bochechas sem barba. Expressão de escuta cuidadosa.
- **Traje de Marta** — `epico_marta` — Lc 10:40; Jo 11:20-27
  Rosto: Mulher adulta de rosto hexagonal largo suave, bochechas cheias com leve assimetria e queixo largo arredondado; nariz curto reto de base larga e ponta redonda, olhos amendoados grandes afastados com cantos externos baixos, sobrancelhas grossas de arco suave e lábios cheios. Sorriso discreto pensativo e uma covinha tênue; identidade própria, sem copiar rostos femininos anteriores.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S14.png de corpos e Rostos_S14.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; os prompts identificam expressamente as referências de material, pigmento e identidade de cada imagem.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S14 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou S13/S14 em 24/11/2026. As 12 adaptações foram aprovadas e registradas no commit 693f4ef antes da produção. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S13/S14.

## Revisão solicitada no §33, commit15ff838

Marta e Gemarias estilo3: pele muito escura tom6, usando Raabe estilo1 como referência de pigmento. Rostos, penteados, barba de Gemarias, trajes, jarra e rolo, mãos e poses preservados.

Somente 4 WebPs (base e @2x dos estilos3 solicitados) mudaram; os outros44assets, inclusive todas as6fichas e6ícones, são byte a byte idênticos à primeira entrega.

Sem alteração de IDs, catálogo, sexo, estilos, regras, app ou banco. Âncoras e dimensões mantidas; as novas pinturas foram conferidas e calibradas com o mesmo contrato. As capturas320/412 dos alvos, galerias de corpos/rostos e comparação antes/depois foram atualizadas. Capturas dos outros personagens permanecem idênticas. ZIPs originais imutáveis. Enviar este pacote completo v2 com seu novo .zip.sha256; não criar migração para a troca de arte. Aguardar o ciclo base15ff838 terminar antes de aplicar, então conferir unitários, auditoria e fluxo fixes no novo commit.
