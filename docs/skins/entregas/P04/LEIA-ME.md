# Jornada Bíblica · P04 · Terra e Reinos

Entrega baseada no branch `claude/kind-bell-fuk4e4`, commit `522e944`, seguindo `PRODUCAO-POR-LOTES.md` e `LOTES.md`.

**6 skins, 18 pinturas 2.5D**, cada uma nos três estilos do plano. Todas são Lendárias. Personagens bíblicos somente na apresentação do próprio sexo. As personagens femininas usam a pasta raiz da skin, sem `feminino/`.

- Vestes de Davi — `lendario_davi` — 1 Sm 16:11-13
- Vestes de Salomão — `lendario_salomao` — 1 Rs 3:9-12
- Vestes de Elias — `lendario_elias` — 1 Rs 19:13; 2 Rs 1:8
- Vestes de Eliseu — `lendario_eliseu` — 2 Rs 2:13-14
- Vestes de Esdras — `lendario_esdras` — Ne 8:4-5
- Vestes de Neemias — `lendario_neemias` — Ne 1:11; 4:17

## Conteúdo e contrato

- `assets/skins/<id>/estilo-1..3/corpo.webp`: 1024 × 1536, alfa transparente e qualidade WebP 92.
- `corpo@2x.webp`: 2048 × 3072, exportação ampliada da mesma pintura.
- `icone.webp`: 256 × 256, recorte do primeiro estilo e moldura de Lendária.
- `ficha.json`: metadados, três estilos, apresentação e âncoras.
- Pés em y = 1450; centro da cabeça [512,300], queixo [512,391], tolerância de 12 px.
- `capturas/`: seis folhas em 320 px, seis em 412 px e galeria do lote. Conferem corpo inteiro, retrato e rosto segundo a geometria do AvatarRenderer do commit acima; são prévias técnicas dos assets, não capturas do app já integrado.
- `PLANO-DO-LOTE.json`: registros originais e decisões desta entrega.
- `VALIDACAO.json`: medidas, peso e verificações do alfa.
- `PROMPTS.md`: prompts de geração e correções visuais.
- `SHA256SUMS.txt`: SHA-256 de todos os demais arquivos do pacote.
- Arquivo externo `.zip.sha256`: SHA-256 do ZIP completo.

## Adaptação para o sprite

Davi segura a harpa e o cajado com uma mão para cada objeto. Eliseu sustenta o manto de Elias dobrado. Esdras leva o rolo sobre um púlpito leve, colocado ao lado para manter os pés visíveis. Neemias segura a planta dos muros e a taça de copeiro. Os objetos pertencem à pintura inteira, sem camadas ou cenário opaco.

## Conferência e aplicação pelo Claude Code

1. Conferir o SHA-256 externo, extrair numa pasta separada e validar todos os registros internos.
2. Conferir a arte contra o plano, o ajuste aprovado de Sansão quando aplicável, medidas, pés, transparência, estilos e peso.
3. Copiar `assets/skins/` para o repositório. Rodar `node scripts/gen-skin-art.mjs` e `node scripts/skins-add-lot.mjs P04`.
4. Executar a bateria SQL, auditoria `FLOW=skins-audit`, fluxos `marco1`, `journey`, `lobby`, `fixes` e Supabase local oficial conforme o roteiro do projeto.
5. Atualizar `STATUS.md` e `LOTES.md`, publicar o commit e informar o resultado.

O Codex produziu e conferiu os assets. Esta entrega não altera migrações ou banco nem afirma que as novas skins já estejam integradas. O resultado dos testes de integração pertence à etapa do Claude Code. As pinturas são representações artísticas inspiradas, não retratos históricos.
