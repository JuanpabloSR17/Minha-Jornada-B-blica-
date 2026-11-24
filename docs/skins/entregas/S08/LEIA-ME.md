# Jornada Bíblica · S08

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit 59e7861. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Viúva de Sarepta, Menina serva de Naamã, Sunamita e Hulda são femininas; os demais são masculinos, conforme o lote. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Jeosafá** — `raro_jeosafa` — 2 Cr 20:21
  Rosto: Adulto maduro; rosto retangular alto de testa estreita e maxilar largo, queixo quadrado saliente, nariz muito largo de ponte baixa, olhos pequenos afastados e sobrancelhas grossas elevadas; barba média retangular, expressão serena de louvor.
- **Traje de Joás, menino rei** — `raro_joas_menino_rei` — 2 Rs 11:12
  Rosto: Menino de cerca de sete anos; rosto quadrado curto de bochechas cheias e testa arredondada, nariz pequeno reto de base larga, olhos redondos afastados e sobrancelhas finas curvas; boca pequena, expressão curiosa solene, sem barba.
- **Traje de Hulda, profetisa** — `raro_hulda_profetisa` — 2 Rs 22:14
  Rosto: Idosa; rosto redondo horizontal de testa larga e queixo curto, nariz largo achatado de ponta arredondada, olhos grandes horizontais próximos e sobrancelhas grossas muito baixas; lábio inferior cheio, expressão firme acolhedora, rugas naturais.
- **Traje de Zadoque** — `raro_zadoque` — 1 Rs 1:39
  Rosto: Idoso vigoroso; rosto estreito em diamante de maçãs altas e queixo comprido, nariz longo curvo de ponta fina, olhos pequenos próximos e sobrancelhas altas retas; barba curta triangular e bigode espesso, expressão respeitosa concentrada.
- **Traje de Benaia** — `raro_benaia` — 2 Sm 23:20
  Rosto: Adulto; rosto oval curto muito largo de testa baixa, maxilar arredondado pesado e queixo pequeno, nariz curto largo de ponta elevada, olhos amendoados afastados e sobrancelhas finas baixas; barba densa curta arredondada, expressão firme tranquila.
- **Os valentes de Davi** — `raro_os_valentes_de_davi` — 2 Sm 23:8-39
  Rosto: Adulto; rosto hexagonal comprido de testa alta estreita e maxilar largo, nariz largo reto, olhos grandes próximos e sobrancelhas espessas curvas assimétricas; barba média de base plana e bigode estreito, expressão decidida leal.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade92, até450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância12px.
- Crianças (Menina e Joás): contrato infantil59e7861, escala uniforme e translação, topo120–170. A ficha traz as medidas reais; sem alterar os recortes do app.
- capturas/: 6 pranchas320px, 6 de412px, Galeria_S08.png de corpos e Rostos_S08.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; nos prompts que citam Image2 também foi referência de cor da geração.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S08 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou envio direto, aguardar revisão, corrigir apontamentos e avançar automaticamente após o fechamento do ciclo. Até dois lotes nesta entrega: S07/S08.
