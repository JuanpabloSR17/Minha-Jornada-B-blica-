# Personagem 3D — prova arquivada

**Situação:** fora do app. A direção aprovada é o personagem **ilustrado 2D/2.5D** em camadas PNG/WebP
(`AvatarRenderer`), conforme [`arte-lotes/LOTE-1.md`](arte-lotes/LOTE-1.md).

A prova jogável continua no histórico do repositório:

| Commit | Conteúdo |
|---|---|
| `d6a375d` | GLB gerado por código (corpo B, 19 ossos humanoides, dois cabelos, túnica, manto, cajado na mão, `idle`/`idle_staff`), palco com rotação e luz por tela, rota `/avatar/3d`, `e2e/avatar3d.flow.cjs`, `docs/MODELO-3D.md` com a especificação de um modelo final |
| `39a2a1d` | último commit com a prova presente |

O que foi verificado na época (web, Chromium sem GPU):
- o GLB carregava em ~120–150 ms e o palco desenhava ~45 quadros/s;
- dava para girar e ver frente, lado e costas;
- a troca de aparência e de peças era salva e voltava igual após reabrir;
- o guarda-roupa tinha luz neutra e o acampamento, luz de lua e fogueira.

Não foi verificado em celular físico.

Para recuperar: `git show d6a375d --stat` e `git checkout d6a375d -- <arquivos>`. É preciso reinstalar
`three`, `@react-three/fiber` e `expo-gl` e recriar o `metro.config.js` que registra `.glb` como asset.
