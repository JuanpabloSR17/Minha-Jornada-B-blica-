# Jornada Bíblica · S07

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 59e7861. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Viúva de Sarepta, Menina serva de Naamã, Sunamita e Hulda são femininas; os demais são masculinos, conforme o lote. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Mefibosete** — `raro_mefibosete` — 2 Sm 9:7
  Rosto: Adulto; rosto triangular de testa larga e maxilar muito estreito, queixo comprido arredondado, nariz curto largo, olhos pequenos afastados e sobrancelhas curvas finas; barba curta rente, expressão reservada acolhida, postura apoiada.
- **Traje de Urias** — `raro_urias` — 2 Sm 11:11
  Rosto: Adulto; rosto hexagonal muito largo de têmporas fortes e queixo curto quadrado, nariz aquilino largo, olhos horizontais próximos sob sobrancelhas espessas baixas; bigode curto e barba rala de maxilar, expressão disciplinada tranquila.
- **Traje de Isaí** — `raro_isai` — 1 Sm 16:10-11
  Rosto: Idoso; rosto oval largo de testa alta, maçãs baixas e maxilar arredondado, nariz médio curvo de ponta bulbosa, olhos grandes fundos afastados e sobrancelhas altas finas; barba longa dividida ao centro, expressão paternal atenta.
- **Traje de Viúva de Sarepta** — `raro_viuva_de_sarepta` — 1 Rs 17:12-16
  Rosto: Adulta madura; rosto oval muito fino, testa estreita e bochechas fundas, queixo pequeno, nariz comprido reto, olhos amendoados afastados e sobrancelhas retas baixas; lábios finos, expressão cansada mas esperançosa.
- **Traje de Menina serva de Naamã** — `raro_menina_serva_de_naama` — 2 Rs 5:2-3
  Rosto: Menina em idade escolar, aparência infantil sem idade bíblica exata; rosto redondo de testa alta, bochechas suaves, queixo pequeno, nariz curto arrebitado, olhos grandes próximos e sobrancelhas retas cheias; expressão atenta gentil, sem maquiagem.
- **Traje de Sunamita** — `raro_sunamita` — 2 Rs 4:8-10
  Rosto: Adulta madura; rosto pentagonal largo de testa média e maxilar forte, nariz curto convexo de base larga, olhos redondos afastados e sobrancelhas grossas arqueadas; boca larga, expressão segura hospitaleira, porte robusto.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- Crianças (Menina e Joás): contrato infantil59e7861, escala uniforme e translação, topo120–170. A ficha traz as medidas reais; sem alterar os recortes do app.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S07.png de corpos e Rostos_S07.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S07 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou envio direto, aguardar revisão, corrigir apontamentos e avançar automaticamente após o fechamento do ciclo. Até dois lotes nesta entrega: S07/S08.
