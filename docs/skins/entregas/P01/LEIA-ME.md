# P01 · Origens e Aliança

Seis skins completas e 18 pinturas no mesmo padrão 2.5D pintado dos lotes aprovados. Produção baseada em `docs/skins/PRODUCAO-POR-LOTES.md`, `docs/skins/LOTES.md` e `docs/skins/plano-lotes.json` do branch `claude/kind-bell-fuk4e4`, commit `433c2a1`.

## Skins

| Nome | ID | Apresentação | Referência |
|---|---|---|---|
| Vestes de Adão | `lendario_adao` | masculina | Gn 2:15; 3:21 |
| Vestes de Eva | `lendario_eva` | feminina | Gn 3:20-21 |
| Vestes de Noé | `lendario_noe` | masculina | Gn 6:14 |
| Vestes de Abraão | `lendario_abraao` | masculina | Gn 12:1 |
| Vestes de Sara | `lendario_sara` | feminina | Gn 18:6 |
| Vestes de Isaque | `lendario_isaque` | masculina | Gn 26:18 |

Cada personagem usa a apresentação definida no plano e três estilos com os tons de pele, cores e penteados oficiais. O corpo de cada personagem feminino está no diretório principal de sua skin, conforme o contrato dos personagens com apresentação única.

## Conteúdo do pacote

- `assets/skins/<id>/estilo-{1,2,3}/corpo.webp`, em 1024 × 1536.
- `assets/skins/<id>/estilo-{1,2,3}/corpo@2x.webp`, em 2048 × 3072.
- `icone.webp`, em 256 × 256, e `ficha.json` para cada skin.
- Capturas de corpo inteiro, retrato e rosto em 320 e 412 px, e a galeria `capturas/Galeria_P01.png`.
- `PROMPTS.md`, `PLANO-DO-LOTE.json`, `VALIDACAO.json` e `SHA256SUMS.txt`.

As pinturas foram criadas com o ImageGen integrado, uma por estilo. A exportação enquadra o corpo e o rosto nos pontos do `AvatarRenderer`. As capturas técnicas reproduzem os recortes do renderizador para conferência visual.

## Validação

O arquivo `VALIDACAO.json` registra a conferência de dimensões, arquivos esperados, peso, transparência, linha dos pés, metadados, sexo do personagem e estilos do catálogo. Os pés usam a linha de referência y = 1450. As âncoras aceitam a tolerância de ±12 px do contrato.

## Aplicação pelo Claude Code

1. Confira o arquivo externo `.zip.sha256` e todas as somas de `SHA256SUMS.txt` após extrair o ZIP.
2. Aplique os diretórios de `assets/skins/` no branch `claude/kind-bell-fuk4e4`.
3. Siga o ciclo oficial do plano para registrar o lote aprovado com `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P01`.
4. Execute a auditoria de skins em todas as abas, os fluxos e as verificações do Supabase local previstos em `PRODUCAO-POR-LOTES.md`.
5. Atualize o painel e o briefing com `node scripts/skin-status.mjs` e registre o commit da integração.

As regras de obtenção seguem integralmente `PLANO-DO-LOTE.json`, extraído do plano oficial. A entrega se concentra nos dois lotes P01 e P02.
