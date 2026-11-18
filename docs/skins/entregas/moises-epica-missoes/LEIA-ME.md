# Êxodo · Manto de Moisés, Épica da semana e missões

Arte para o ramo `claude/kind-bell-fuk4e4`, a partir do catálogo do commit `986cfd0`. O pacote contém 18 pinturas 2.5D, com três estilos por apresentação.

| Skin | ID | Arte |
| --- | --- | --- |
| Manto de Moisés | `lendario_moises` | Manto longo de lã com borda dupla, faixa tecida e cajado bifurcado. Três pinturas padrão e três femininas. |
| Sumo sacerdote | `epico_sumo_sacerdote` | Éfode tecido, peitoral com doze pedras e turbante de linho com placa dourada. |
| Cesto de Joquebede | `raro_joquebede` | Manto de tom terroso e cesto de junco calafetado. |
| Linho da filha de Faraó | `raro_filha_de_farao` | Linho egípcio plissado, colar de faiança e cesto do rio. |
| Sifrá e Puá | `raro_parteiras` | Traje inspirado nas parteiras, com bolsa de trabalho e rolos de linho. |

Nos três estilos de Joquebede e nos três da filha de Faraó, os braços sustentam o cesto pelas laterais e deixam a base livre.

## Aplicação

1. Confira o SHA-256 do ZIP com o arquivo `.zip.sha256`. Depois de extrair, valide `SHA256SUMS.txt` a partir da raiz.
2. Substitua os arquivos de `assets/skins/lendario_moises/`, inclusive os da pasta `feminino/`, usando os mesmos IDs de estilo. As fichas seguem as âncoras do lote aplicado.
3. Copie os quatro diretórios da Épica e das Raras em `assets/skins/`. Rode `node scripts/gen-skin-art.mjs` para registrar as pinturas.

Cada apresentação tem três corpos transparentes de 1024 × 1536 px, versões ampliadas `@2x` de 2048 × 3072 px, ícone de 256 × 256 px e ficha. As provas em 320 e 412 px usam as coordenadas de corpo inteiro, retrato e rosto do `AvatarRenderer`. A galeria reúne os 18 estilos.
