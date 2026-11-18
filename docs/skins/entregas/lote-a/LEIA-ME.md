# Temporada 1 — Êxodo

Pacote de arte para o ramo `claude/kind-bell-fuk4e4`, catálogo do commit `a1d95e3`. Reúne as nove pinturas do Lote A e 15 novas pinturas femininas no padrão 2.5D da Jornada.

## Aplicação no vestiário

| Skin do catálogo | Nome para a opção feminina |
| --- | --- |
| `comum_peregrino_exodo` | Peregrina do Êxodo |
| `raro_levita` | Traje levítico |
| `lendario_moises` | Manto de Moisés |

Vincule ambas as apresentações ao mesmo ID de skin no seletor do vestiário. A opção feminina fica disponível quando o jogador possui o traje, com os três estilos correspondentes. O caminho proposto para o corpo é `assets/skins/<id>/feminino/estilo-N/corpo.webp`. Leia `nomeExibicao` e `varianteVisual` em `assets/skins/<id>/feminino/ficha.json`. Use o `icone.webp` da apresentação selecionada para a miniatura.

O corte feminino do Manto de Moisés usa o manto de pastor de Midiã como inspiração. O Traje levítico preserva as varas, a túnica de linho e o bordado da roupa.

Tecelã (`comum_tecela`) e Parteira (`comum_parteira`) já têm IDs próprios na temporada. Aplique a arte diretamente em `assets/skins/<id>/estilo-N/` e o ícone na pasta da skin.

## Conferência

- Compare o SHA-256 do ZIP com o arquivo `.zip.sha256` entregue junto ao pacote. Depois de extrair, confira `SHA256SUMS.txt` a partir da raiz.
- Os WebP de corpo têm alfa transparente e medem 1024 × 1536 px. As versões `@2x` são ampliações para 2048 × 3072 px. Os ícones têm 256 × 256 px.
- As provas em 320 e 412 px usam as coordenadas do `AvatarRenderer` para corpo inteiro, retrato e rosto. A galeria reúne as 15 pinturas novas.

## Produção dos próximos lotes

Inclua a opção feminina na mesma rodada do traje correspondente, com três pinturas completas. Consulte o catálogo de Êxodo para os tons de pele e cabelos. Dê a cada estilo um rosto e uma paleta próprios. Preserve o corte e os objetos que identificam o traje.

Use os IDs de Joquebede, filha de Faraó, Sifrá e Puá, Miriã e Zípora para as artes inspiradas nas figuras femininas da temporada. A enciclopédia orienta as próximas temporadas e os lotes seguem a ordem do guia de Êxodo.
