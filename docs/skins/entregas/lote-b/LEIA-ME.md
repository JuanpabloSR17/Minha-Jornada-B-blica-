# Êxodo · Lote B da Loja

Pacote de arte para o ramo `claude/kind-bell-fuk4e4`, catálogo do commit `011664b`. São seis skins, cinco apresentações femininas e três estilos completos por apresentação.

| ID de skin | Apresentação padrão | Apresentação feminina | Elemento que identifica o traje |
| --- | --- | --- | --- |
| `comum_carpinteiro` | Carpinteiro de acácia | Carpinteira de acácia | Avental de trabalho, enxó e tábua |
| `raro_sacerdote` | Sacerdote | — | Túnica, cinto e turbante de linho |
| `raro_bordador` | Bordador | Bordadora | Bastidor com tecido e fios coloridos |
| `raro_ourives` | Ourives | Ourives | Buril e folhas de ouro |
| `raro_gravador` | Gravador de pedras | Gravadora de pedras | Pedra incisa e ferramenta fina |
| `raro_perfumista` | Perfumista | Perfumista | Frasco de alabastro e pilão |

Para Sacerdote, a apresentação segue as vestes dos filhos de Arão em Êxodo 28:40–42.

## Aplicação

1. Confira o hash externo do ZIP e valide `SHA256SUMS.txt` na raiz extraída.
2. Copie os seis diretórios de `assets/skins/` e rode `node scripts/gen-skin-art.mjs`.
3. Na integração, registre `padrao` e `feminino` em `skins.variants` para Carpinteiro, Bordador, Ourives, Gravador e Perfumista. O vestiário usa o `nomeExibicao` da ficha feminina sob o mesmo ID de desbloqueio.

Cada apresentação inclui a ficha, o ícone de 256 × 256 px e três corpos transparentes de 1024 × 1536 px. Os arquivos `@2x` são ampliações para 2048 × 3072 px. As provas em 320 e 412 px usam as coordenadas de recorte do `AvatarRenderer`. A galeria mostra o primeiro estilo de cada apresentação.

## Direção das raridades

O traje Comum evidencia o trabalho diário pela construção simples e pelos materiais usados. Os Raros se reconhecem pelo ofício, pelas ferramentas e pela precisão dos acabamentos. Nas Lendárias, use uma silhueta reconhecível no retrato, tecidos de maior presença e um objeto assinatura com forma própria.

`capturas/Estudo_Lendaria.png` mostra uma proposta para o Manto de Moisés. O estudo dá mais volume ao manto longo, usa uma borda dupla legível e identifica o cajado pela ponta bifurcada. A comparação usa as pinturas aprovadas do Lote A como referência. A arte do estudo está na prancha de apresentação.
