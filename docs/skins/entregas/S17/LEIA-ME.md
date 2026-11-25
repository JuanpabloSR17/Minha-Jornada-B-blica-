# Jornada Bíblica · S17

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit afc0f6f. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Nesta entrega (S17+S18), dez skins têm apresentação masculina; Ana, a profetisa, e a viúva pobre têm apresentação feminina. O menino mantém anatomia infantil e o contrato do §27: as mesmas três âncoras, escala uniforme sem cisalhamento e topo entre120–170. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Ana, a profetisa** — `epico_ana_a_profetisa` — Lc 2:36-38
  Rosto: Anciã de rosto comprido e muito fino, maçãs ósseas, têmporas fundas, testa alta sulcada, sobrancelhas finas retas, olhos pequenos de pálpebras pesadas, nariz longo fino ligeiramente curvo, boca fina de cantos elevados e queixo estreito. Idade avançada e expressão de gratidão serena, diferente de Isabel.
- **Traje de Bartimeu** — `epico_bartimeu` — Mc 10:46-50
  Rosto: Homem maduro de rosto trapezoidal largo no maxilar, testa baixa com sulco central, maçãs largas e gastas pelo sol, sobrancelhas espessas assimétricas, olhos naturais de foco impreciso, nariz largo de ponta caída e boca grande entreaberta ao chamar. Barba curta irregular de contorno arredondado; expressão esperançosa e decidida.
- **Traje de Filipe** — `raro_filipe` — Jo 1:43-46
  Rosto: Adulto jovem de rosto oval comprido, testa média lisa, sobrancelhas baixas retilíneas, olhos grandes afastados de cantos suaves, nariz reto comprido de ponta pequena e boca de lábio superior fino com sorriso acolhedor. Queixo alongado, barba muito curta escura uniforme. Idade aparente de adulto jovem, sem sulcos de ancião.
- **Traje de Natanael** — `raro_natanael` — Jo 1:48
  Rosto: Adulto jovem de rosto em coração comprido, testa larga, maçãs altas afiladas, sobrancelhas espessas que sobem junto à ponte do nariz, olhos amendoados profundos, nariz curvo proeminente de ponta fina e lábios de arco central marcado. Barba curta de queixo estreito, expressão contemplativa que se abre em confiança.
- **Traje de Tomé** — `raro_tome` — Jo 20:27-28
  Rosto: Adulto jovem de rosto angular em losango, testa alta e estreita, sobrancelhas retas separadas, olhos fundos de pálpebras pesadas, nariz largo na ponte e fino na ponta, lábios cheios de boca curta e maxilar de cantos marcados. Barba escura curta bem aparada, expressão de surpresa reverente e convicção.
- **Traje de Tiago, filho de Alfeu** — `raro_tiago_filho_de_alfeu` — Mc 3:18
  Rosto: Adulto jovem de rosto redondo curto, testa ampla lisa, sobrancelhas finas arqueadas, olhos redondos atentos, nariz curto de ponta larga suave, boca larga de lábios finos e queixo curto arredondado. Sem barba nem bigode, expressão calma e reservada; adulto, sem aparência infantil.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S17.png de corpos e Rostos_S17.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; os prompts identificam expressamente as referências de material, pigmento e identidade de cada imagem.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S17 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou continuar S17/S18 em 25/11/2026. As 12 adaptações e os 12 figurinos foram alinhados e registrados no commit afc0f6f antes de qualquer pintura. Pesquisa de época, região e função segue o §35. O campo figurino aprovado é preservado nas fichas quando presente no plano. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S17/S18.
