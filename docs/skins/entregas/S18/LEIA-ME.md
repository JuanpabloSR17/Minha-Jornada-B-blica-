# Jornada Bíblica · S18

6 skins completas × 3 estilos = **18 pinturas** no 2.5D pintado aprovado. Fonte: branch claude/kind-bell-fuk4e4, commit afc0f6f. Briefing: LOTES.md; contrato: TEMPORADA-1-EXODO.md §2.

Cada personagem tem somente a apresentação do próprio sexo, na raiz do seu ID. Nesta entrega (S17+S18), dez skins têm apresentação masculina; Ana, a profetisa, e a viúva pobre têm apresentação feminina. O menino mantém anatomia infantil e o contrato do §27: as mesmas três âncoras, escala uniforme sem cisalhamento e topo entre120–170. Cada skin preserva seu rosto próprio nos três estilos. Tons de pele, cores e penteados seguem o catálogo, sem os uniformizar pela iluminação.

- **Traje de Tadeu** — `raro_tadeu` — Lc 6:16; Jo 14:22
  Rosto: Adulto jovem de rosto retangular curto e largo nas maçãs, testa média lisa, sobrancelhas grossas horizontais, olhos pequenos de cantos elevados, nariz curto de ponte reta e ponta bifurcada suave, boca larga com covinha lateral e maxilar largo. Barba escura curta compacta, expressão curiosa e cordial.
- **Traje de Simão, o zelote** — `raro_simao_o_zelote` — Lc 6:15
  Rosto: Adulto jovem de rosto trapezoidal alongado, maxilar forte afilado, testa larga lisa, sobrancelhas baixas inclinadas, olhos estreitos intensos, nariz reto largo com ponta quadrada e boca de lábio inferior cheio. Barba escura curta de contorno reto, expressão firme e atenta sem agressividade.
- **Os pastores de Belém** — `raro_os_pastores_de_belem` — Lc 2:8-16
  Rosto: Homem adulto de rosto largo hexagonal, testa baixa, maçãs fortes arredondadas, sobrancelhas grossas arqueadas, olhos grandes de cantos baixos, nariz largo achatado de ponta arredondada e boca larga entre barba cheia curta. Expressão maravilhada e acolhedora, diferente do Pastor inicial.
- **O menino dos pães e peixes** — `raro_o_menino_dos_paes_e_peixes` — Jo 6:9
  Rosto: Menino de idade escolar com rosto oval curto e bochechas cheias, testa ampla suave, sobrancelhas finas curvas, olhos grandes redondos, nariz pequeno de ponta arredondada e lábios macios com sorriso tímido. Queixo curto, pescoço e ombros infantis, sem barba, bigode ou musculatura adulta.
- **A viúva pobre** — `raro_a_viuva_pobre` — Mc 12:42-44
  Rosto: Mulher de meia-idade de rosto quadrado estreito, maçãs marcadas e bochechas um pouco fundas, testa média com linhas suaves, sobrancelhas retas baixas, olhos alongados de cantos elevados, nariz longo de ponta larga e boca pequena de lábios cheios. Queixo quadrado, expressão firme e generosa, diferente da idosa Ana.
- **O centurião de Cafarnaum** — `raro_o_centuriao_de_cafarnaum` — Mt 8:5-10
  Rosto: Homem adulto de rosto retangular comprido, testa média lisa com um sulco de atenção, maxilar muito marcado, sobrancelhas espessas baixas, olhos pequenos fundos, nariz reto largo e comprido, boca de lábios finos e queixo largo com covinha vertical. Sem barba, com expressão respeitosa e confiante, pescoço forte, sem agressividade.

## Arquivos

- assets/skins/<id>/estilo-1..3/corpo.webp: 1024×1536, fundo transparente, qualidade 92, até 450000 bytes.
- corpo@2x.webp: 2048×3072, ampliação da mesma pintura; não é detalhe nativo adicional.
- icone.webp: 256×256, retrato do estilo1 com moldura da raridade.
- ficha.json: IDs, sexo, origem, estilos, identidade facial e âncoras; as adaptações do plano são preservadas.
- Âncoras: cabeça[512,300], queixo[512,391], pés[512,1450], tolerância de 12 px.
- capturas/: 6 pranchas de 320 px, 6 de 412 px, Galeria_S18.png de corpos e Rostos_S18.png.
- As anotações de centro e queixo no original são visuais aproximadas, revisadas em provas de pontos. As capturas são prévias técnicas com a geometria do AvatarRenderer, não teste do app publicado.
- PLANO-DO-LOTE.json: briefing e perfis; NOTAS-BIBLICAS.md: adaptações/fontes.
- PROMPTS.md: prompts reais da ferramenta integrada, incluindo correções quando houver.
- referencias/paleta-tons-catalogo.png: os seis tons oficiais da esquerda para a direita, para comparação; os prompts identificam expressamente as referências de material, pigmento e identidade de cada imagem.
- VALIDACAO.json: medidas, pesos, âncoras, chão e alfa de base/@2x.
- Alfa: cantos zero, sem névoa visível afastada. Resíduos numéricos até2/255 são registrados separadamente da cobertura visível(alfa≥3/255).
- SHA256SUMS.txt confere todos os demais arquivos; .zip.sha256 externo confere o ZIP.

## Revisão e integração

Conferir ZIP e .zip.sha256 de cada lote, somas, arte, diferenças de pele, rostos, mãos e objetos. Aplicar pelo fluxo oficial scripts/skins-add-lot.mjs S18 e scripts/gen-skin-art.mjs. Rodar unitários, SQL, skins-audit, marco1/journey/lobby/fixes e Supabase local oficial limpo. Atualizar plano/STATUS/LOTES/PARA-O-CODEX e publicar no mesmo branch com commit e resultado completo.

O Codex alterou somente arte e arquivos de entrega locais, sem migração ou banco. A integração oficial fica com o Claude. O usuário autorizou continuar S17/S18 em 25/11/2026. As 12 adaptações e os 12 figurinos foram alinhados e registrados no commit afc0f6f antes de qualquer pintura. Pesquisa de época, região e função segue o §35. O campo figurino aprovado é preservado nas fichas quando presente no plano. Revisão, integração e testes oficiais com o Claude continuam necessários. Até dois lotes nesta entrega: S17/S18.
