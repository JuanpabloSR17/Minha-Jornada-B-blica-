# Jornada Bíblica · S09_v2

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 59e7861. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Mulher virtuosa e A amada de Cânticos são femininas; os demais são masculinos, conforme o lote. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Asafe** — `raro_asafe` — 1 Cr 16:5
  Rosto: Adulto maduro de rosto oval alto e estreito, têmporas marcadas, nariz fino de ponta arredondada, olhos horizontais próximos e sobrancelhas altas curvas; barba curta em ponta, expressão concentrada alegre.
- **Traje de Hemã e Jedutum** — `raro_hema_e_jedutum` — 1 Cr 25:1
  Rosto: Representante coletivo masculino maduro, com rosto piriforme de testa curta e maxilar largo, nariz largo arredondado, olhos pequenos afastados e sobrancelhas espessas baixas; barba curta arredondada e expressão musical serena. Mesmo rosto nos três estilos, sem atribuir um estilo a cada homem.
- **Traje de Obede-Edom** — `raro_obede_edom` — 2 Sm 6:11
  Rosto: Adulto acolhedor de rosto quadrado curto, testa ampla, nariz curto côncavo e largo, olhos redondos afastados e sobrancelhas suaves arqueadas; bigode espesso e barba curta com covinha no queixo, expressão calorosa.
- **Traje de Ciro** — `raro_ciro` — Ed 1:1-3
  Rosto: Rei adulto maduro de rosto trapezoidal largo, testa baixa, queixo retangular, nariz longo de ponte alta e ponta descendente, olhos amendoados fundos e sobrancelhas retas; barba média densa de contorno quadrado, expressão ponderada firme.
- **Traje de Josué, o sumo sacerdote** — `raro_josue_o_sumo_sacerdote` — Ed 3:2; Zc 3:5
  Rosto: Adulto maduro de rosto hexagonal baixo e largo, maxilar firme, nariz reto curto de base larga, olhos amendoados afastados de pálpebras pesadas e sobrancelhas retas cheias; barba curta em cunha e expressão restaurada tranquila.
- **Traje de Elcana** — `raro_elcana` — 1 Sm 1:1-3
  Rosto: Adulto de rosto losangular com testa ampla e queixo estreito, nariz curto de base larga, olhos ovais próximos e sobrancelhas grossas oblíquas; barba média bifurcada e expressão afetuosa determinada.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S09.png de corpos e Rostos_S09.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S09 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou continuar a produção de arte em21/11/2026. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S09/S10.

## Revisão solicitada pelo Claude em24/11/2026

Obede-Edom2: tom3 médio claramente mais profundo que o estilo1 muito claro; longo liso mel preservado.

Somente raro_obede_edom estilo2. Os outros46assets, incluindo6fichas e6ícones, permanecem byte a byte iguais à primeira entrega. Demais17pinturas preservadas.

Sem mudança emIDs,catálogo,sexo,regras,âncoras,app ou banco. As capturas320/412 da skin corrigida e as galerias foram atualizadas; capturas das outras skins preservadas. Comparacao_S09_v2.png mostra antes/depois no mesmo recorte. Uma nova edição ImageGen nesta revisão, somada aos24registros anteriores; PROMPTS traz25registros. VALIDACAO.json registra hashes antigos/novos dos2assets alterados. O ZIP original permanece imutável. Enviar apenas este pacote completo v2 e seu .zip.sha256, sem reenvio do original.
