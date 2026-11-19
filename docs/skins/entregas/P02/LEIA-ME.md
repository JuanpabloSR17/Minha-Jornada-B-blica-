# P02 · Origens e Aliança

Seis skins completas e 18 pinturas no mesmo padrão 2.5D pintado dos lotes aprovados. Produção baseada em `docs/skins/PRODUCAO-POR-LOTES.md`, `docs/skins/LOTES.md` e `docs/skins/plano-lotes.json` do branch `claude/kind-bell-fuk4e4`, commit `433c2a1`.

## Skins

| Nome | ID | Apresentação | Referência |
|---|---|---|---|
| Vestes de Rebeca | `lendario_rebeca` | feminina | Gn 24:15-16 |
| Vestes de Jacó | `lendario_jaco` | masculina | Gn 32:28 |
| Vestes de José | `lendario_jose` | masculina | Gn 37:3 |
| José, governador do Egito | `glorioso_jose_governador_do_egito` | masculina | Gn 41:42 |
| Abraão sob as estrelas | `glorioso_abraao_sob_as_estrelas` | masculina | Gn 15:5 |
| Noé e o arco-íris | `glorioso_noe_e_o_arco_iris` | masculina | Gn 9:13 |

Cada personagem usa a apresentação definida no plano e três estilos com os tons de pele, cores e penteados oficiais. O corpo de cada personagem feminino está no diretório principal de sua skin, conforme o contrato dos personagens com apresentação única.

## Conteúdo do pacote

- `assets/skins/<id>/estilo-{1,2,3}/corpo.webp`, em 1024 × 1536.
- `assets/skins/<id>/estilo-{1,2,3}/corpo@2x.webp`, em 2048 × 3072.
- `icone.webp`, em 256 × 256, e `ficha.json` para cada skin.
- Capturas de corpo inteiro, retrato e rosto em 320 e 412 px, e a galeria `capturas/Galeria_P02.png`.
- `PROMPTS.md`, `PLANO-DO-LOTE.json`, `VALIDACAO.json` e `SHA256SUMS.txt`.

As pinturas foram criadas com o ImageGen integrado, uma por estilo. A exportação enquadra o corpo e o rosto nos pontos do `AvatarRenderer`. As capturas técnicas reproduzem os recortes do renderizador para conferência visual.

## Validação

O arquivo `VALIDACAO.json` registra a conferência de dimensões, arquivos esperados, peso, transparência, linha dos pés, metadados, sexo do personagem e estilos do catálogo. Os pés usam a linha de referência y = 1450. As âncoras aceitam a tolerância de ±12 px do contrato.

## Aplicação pelo Claude Code

1. Confira o arquivo externo `.zip.sha256` e todas as somas de `SHA256SUMS.txt` após extrair o ZIP.
2. Aplique os diretórios de `assets/skins/` no branch `claude/kind-bell-fuk4e4`.
3. Siga o ciclo oficial do plano para registrar o lote aprovado com `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P02`.
4. Execute a auditoria de skins em todas as abas, os fluxos e as verificações do Supabase local previstos em `PRODUCAO-POR-LOTES.md`.
5. Atualize o painel e o briefing com `node scripts/skin-status.mjs` e registre o commit da integração.

As regras de obtenção seguem integralmente `PLANO-DO-LOTE.json`, extraído do plano oficial. A entrega se concentra nos dois lotes P01 e P02.
