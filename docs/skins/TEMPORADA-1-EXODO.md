# Temporada 1 — Êxodo: especificação das skins para o Codex

Decisões do usuário (18/11/2026) que valem para todas as skins:

- **Skin = traje inspirado**, vestido pelo viajante do jogador ("Manto de Moisés", não "Moisés").
- **3 estilos por skin**, cada um com cores, rosto, tom de pele e cabelo diferentes, para que todos os públicos se vejam. Os 3 estilos **substituem** os tipos de corpo Esguio, Atlético e Robusto: **3 pinturas por skin**.
- **Raridades:** Comum, Raro, Épico, Lendário e **Glorioso** (o momento marcante de um personagem primário).
- **Nunca vira skin:** Deus, Jesus, Espírito Santo, anjos, Satanás, vilões (Faraó, Golias…) e ídolos. Sem nudez nem violência.
- **Loja:** Comuns e Raras; algumas Épicas em ocasiões especiais, às vezes grátis num dia fixo da semana. Lendárias e Gloriosas só lendo.
- Traços e roupas fiéis ao antigo Oriente Médio e à África; trajes discretos para homens e mulheres.

## 1. As 26 skins da temporada

| # | ID | Skin | Referência | Raridade | Como se conquista | Elemento que identifica |
|---|---|---|---|---|---|---|
| 1 | `glorioso_moises_rosto_resplandecente` | Moisés com o rosto resplandecente | Êx 34:29 | Glorioso | Marco de Êx 34 + concluir Êxodo | Tábuas nas mãos, luz no rosto, manto do Sinai |
| 2 | `glorioso_arao_vara_floresceu` | Arão e a vara que floresceu | Nm 17:8 | Glorioso | Marco de Nm 17 + concluir a temporada | Vestes sacerdotais, vara com amêndoas em flor |
| 3 | `lendario_moises` | Manto de Moisés | Êx 4:2 | Lendário | Concluir Êxodo | Cajado, manto de pastor de Midiã |
| 4 | `lendario_arao` | Vestes de Arão | Êx 28 | Lendário | Trilha do Tabernáculo | Éfode, peitoral de 12 pedras, mitra com lâmina de ouro |
| 5 | `epico_miria` | Tamborim de Miriã | Êx 15:20 | Épico | Temporada (faixa premium, lendo) | Tamborim, véu de profetisa |
| 6 | `epico_bezalel` | Avental de Bezalel | Êx 31:2-5 | Épico | Temporada (faixa grátis) | Artesão: ouro, madeira de acácia e pedra |
| 7 | `epico_jetro` | Manto de Jetro | Êx 18:1 | Épico | Temporada (faixa premium) | Sacerdote de Midiã, manto de ancião |
| 8 | `epico_zipora` | Véu de Zípora | Êx 2:16-21 | Épico | Temporada (faixa grátis) | Pastora de Midiã, cântaro |
| 9 | `epico_sumo_sacerdote` | Sumo sacerdote | Êx 28 | Épico | Loja em ocasião especial | Vestes completas do sumo sacerdote (sem o nome de Arão) |
| 10 | `raro_joquebede` | Cesto de Joquebede | Êx 2:3 | Raro | Missão especial | Cesto de junco calafetado |
| 11 | `raro_filha_de_farao` | Linho da filha de Faraó | Êx 2:5-6 | Raro | Missão especial | Linho egípcio, cesto do rio |
| 12 | `raro_parteiras` | Sifrá e Puá | Êx 1:15-17 | Raro | Missão especial | Parteiras que temeram a Deus |
| 13 | `raro_hur` | Hur | Êx 17:12 | Raro | Temporada (faixa grátis) | Segurando o braço de Moisés |
| 14 | `raro_aoliabe` | Aoliabe, o bordador | Êx 31:6 | Raro | Temporada (faixa premium) | Fios azul, púrpura e carmesim |
| 15 | `raro_levita` | Levita | Nm 3:5-8 | Raro | Loja ou Siclos | Túnica de linho, varas de carregar |
| 16 | `raro_sacerdote` | Sacerdote | Êx 28:40-42 | Raro | Loja ou Siclos | Túnica, cinto e turbante de linho |
| 17 | `raro_bordador` | Bordador | Êx 35:35 | Raro | Loja ou Siclos | Bastidor, fios coloridos |
| 18 | `raro_ourives` | Ourives | Êx 31:4 | Raro | Loja ou Siclos | Avental fino, buril, folhas de ouro |
| 19 | `raro_gravador` | Gravador de pedras | Êx 28:11 | Raro | Loja ou Siclos | Pedras gravadas com nomes |
| 20 | `raro_perfumista` | Perfumista | Êx 30:25 | Raro | Loja ou Siclos | Frascos de alabastro, pilão |
| 21 | `raro_shofar` | Tocador de shofar | Êx 19:16 | Raro | Temporada (faixa grátis) | Chifre de carneiro |
| 22 | `comum_pastor` | Pastor de ovelhas | Êx 3:1 | Comum | Início do jogo | Manto de lã, cajado, odre |
| 23 | `comum_carpinteiro` | Carpinteiro de acácia | Êx 25:10 | Comum | Siclos | Avental de couro, enxó, tábua de acácia |
| 24 | `comum_tecela` | Tecelã | Êx 35:25 | Comum | Siclos | Roca e fuso, fio de linho |
| 25 | `comum_parteira` | Parteira | Êx 1:15 | Comum | Siclos | Véu simples, lenços de linho |
| 26 | `comum_peregrino_exodo` | Peregrino do Êxodo | Êx 12:11 | Comum | Início do jogo | Cinto cingido, sandálias, cajado na mão |

Total: 26 skins × 3 estilos = **78 pinturas** + 26 miniaturas.

## 2. O que entregar por skin

```
assets/skins/<id>/
  estilo-1/corpo.webp        1024 × 1536, fundo transparente (alfa sem névoa)
  estilo-1/corpo@2x.webp     2048 × 3072
  estilo-2/…  estilo-3/…     mesmos dois arquivos
  icone.webp                 256 × 256 (miniatura do estilo 1, moldura pela raridade)
  ficha.json                 metadados (abaixo)
```

- **Uma pintura por estilo, inteira.** Sem camadas por item e sem máscaras de pele. Os objetos que identificam a skin (cajado, tábuas, tamborim) fazem parte da pintura.
- **Mesmo enquadramento em todas:** figura de pé, de frente ou em três quartos, pés no chão em **y = 1450**, topo da cabeça em **y ≈ 216** (1,75 m de altura), centro em **x = 512**. É o mesmo espaço do `AvatarRenderer` atual, então o recorte de **corpo inteiro, retrato e rosto** do guarda-roupa sai das mesmas coordenadas.
- **Âncoras** (em pixels do arquivo base), na `ficha.json`, para os recortes:
  - `cabecaCentro` (perto de 512, 300)
  - `queixo` (perto de 512, 391)
  - `pes` (perto de 512, 1450)
- **Os 3 estilos variam:** tom de pele (cobrindo do tom 1 ao 6 entre os três), formato do rosto, cabelo e paleta do traje. A silhueta e os objetos continuam os mesmos para a skin ser reconhecível.
- **Peso:** até 450 KB por arquivo base, WebP sem perdas ou com qualidade ≥ 90.

`ficha.json`:

```json
{
  "id": "lendario_moises",
  "nome": "Manto de Moisés",
  "raridade": "legendary",
  "mundo": "origens",
  "referencia": "Êxodo 4:2",
  "representacao": "inspired",
  "origem": "leitura",
  "temporada": "t1-exodo",
  "estilos": [
    { "id": "estilo-1", "rotulo": "Estilo 1", "tomDePele": "skin-4", "cabelo": "haircolor-black" },
    { "id": "estilo-2", "rotulo": "Estilo 2", "tomDePele": "skin-2", "cabelo": "haircolor-brown" },
    { "id": "estilo-3", "rotulo": "Estilo 3", "tomDePele": "skin-6", "cabelo": "haircolor-gray" }
  ],
  "ancoras": { "cabecaCentro": [512, 300], "queixo": [512, 391], "pes": [512, 1450] }
}
```

`origem` aceita `inicio`, `leitura`, `temporada-gratis`, `temporada-premium`, `loja` ou `siclos`.

## 3. Ordem dos lotes

1. **Lote A (prova):** `comum_peregrino_exodo`, `raro_levita` e `lendario_moises`, nos 3 estilos (9 pinturas). Serve para validar enquadramento, âncoras e recortes antes do volume.
2. **Lote B:** as demais Comuns e Raras (18 skins).
3. **Lote C:** Épicas.
4. **Lote D:** Lendárias e Gloriosas.

## 4. Formato da entrega e validação

Como nas rodadas anteriores: um ZIP com `assets/skins/…`, `SHA256SUMS.txt` e capturas em 320 e 412 px. O Claude:

- confere o SHA-256 e extrai numa pasta separada;
- valida dimensões, alfa sem névoa, peso, âncoras (tolerância de ±12 px) e a `ficha.json` contra esta tabela;
- confere o recorte de corpo inteiro, retrato e rosto nos 3 estilos;
- aplica sem sobrescrever trabalho paralelo, roda os testes e registra o commit.

A migração do banco (tabela de skins, conquistas e origem) e as telas de skins ficam com o Claude depois do Lote A aprovado, para o catálogo seguir o que de fato foi pintado.
