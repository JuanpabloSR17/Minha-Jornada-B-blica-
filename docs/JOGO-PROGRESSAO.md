# No Caminho: plano de aspecto de jogo, progressão e evolução

Feito em 26/11/2026, a partir do teste do piloto publicado com uma conta de teste.

**Objetivo:** cada capítulo lido deve parecer um passo de uma jornada real. O jogador sai do acampamento, avança pelos 7 mundos, evolui de nível e de título, e o próprio viajante e o acampamento mostram essa evolução.

**Onde implementar:** no código do piloto, depois que o Codex publicar num branch do GitHub. Nada aqui exige mudança de banco nem de regra de concessão. Os itens que dependem de dados novos estão marcados com **(banco)**.

## Princípios

- **Uma emoção por momento.** Ler é calmo. Recompensa é festa. Evolução é marco. Os efeitos não competem com a leitura.
- **Respeitar quem precisa de menos movimento.**
  - Toda animação tem uma versão estática equivalente quando o sistema pede movimento reduzido.
  - Toda revelação tem botão Pular.
  - Som desligado por padrão. Música e efeitos são ajustes separados.
- **O servidor confirma, a animação celebra.** Nunca animar uma recompensa antes da confirmação. Se o servidor demorar, mostrar o estado "aguardando confirmação" que já existe.
- **Desempenho no celular.**
  - Animar só `transform` e `opacity`, com `useNativeDriver`.
  - Partículas limitadas a 24 por tela.
  - Nada animando em loop quando a tela está fora de foco.

## 1. Progressão visível

### 1.1 Níveis com títulos
- Os níveis existentes ganham títulos de jornada a cada faixa:
  - 1 a 4: Viajante.
  - 5 a 9: Peregrino.
  - 10 a 14: Guardião do Caminho.
  - 15 a 19: Escriba.
  - 20 a 29: Ancião das Tendas.
  - 30 em diante: Testemunha.
- **Sobe de nível:** a barra de XP do topo enche, brilha e "estoura". Aparece um selo do novo nível com o título e uma frase curta, por exemplo "Você já percorreu 12 capítulos".
- Os títulos são derivados do nível atual, sem precisar de banco.

### 1.2 Acampamento que evolui
O acampamento do Início muda conforme o progresso, como recompensa visual permanente:
- **0 a 9 capítulos:** uma tenda, fogueira pequena.
- **10 a 49:** segunda tenda e uma lanterna acesa.
- **50 a 199:** um tear e jarros, e a fogueira maior.
- **200 a 599:** estandarte com o emblema do mundo mais avançado.
- **600 ou mais:** acampamento iluminado, com estrelas mais densas.

São camadas de imagem sobre o cenário atual, de 3 a 5 artes novas, que o Codex pode pintar no mesmo 2.5D. A troca de estágio tem um momento próprio: tela escurece, nova camada aparece com luz e um texto curto ("O acampamento cresceu").

### 1.3 Mapa da Jornada como trilha real
- No mapa dos 7 mundos, um marcador com o rosto do avatar mostra onde o jogador está.
- O caminho já percorrido fica aceso, como uma linha dourada, e o restante fica em pontilhado.
- Ao concluir um livro, um ponto acende com faísca.
- Ao concluir um mundo, a medalha é cunhada (gira e brilha) e a trilha se estende até o próximo mundo, com câmera acompanhando.

### 1.4 Sequência de dias **(banco)**
- Uma chama ao lado do avatar mostra quantos dias seguidos de leitura: cresce em 3, 7, 30 e 100 dias.
- Um dia de folga por semana: se o jogador falhar um dia, a chama vira brasa e não apaga.
- Precisa de um campo de sequência calculado no servidor, a partir das metas cumpridas que já existem.

## 2. Momentos de recompensa

### 2.1 Bolsa de recompensas (já existe, falta movimento)
1. A bolsa entra caindo e quica uma vez.
2. Ao tocar em Abrir, ela balança, o cordão se solta e a boca abre.
3. Cada recompensa sobe da bolsa com rastro de luz. Os números de XP e Siclos sobem contando (0 a 60) em 600 ms.
4. Ao avançar, os Siclos voam em arco até o contador do topo, que pulsa ao receber.
5. A última recompensa tem um brilho dourado final.
6. **Correção visual:** a bolsa não pode ficar atrás do anel nem encostar no texto; ela desce para baixo do número.

### 2.2 Revelação de skin por raridade
| Raridade | Duração | Efeito |
|---|---|---|
| Comum | 0,6 s | brilho suave atrás da figura |
| Rara | 1,0 s | anel azul que se expande |
| Épica | 1,4 s | partículas violeta subindo e leve tremor da câmera |
| Lendária | 2,0 s | raios dourados girando, silhueta escura antes de revelar o rosto |
| Gloriosa | 2,4 s | tela escurece, coluna de luz, nome escrito letra a letra |

- Pular sempre visível.
- Com movimento reduzido, mostra o resultado final direto, com a mesma moldura de raridade.

### 2.3 Meta do dia
Quando a meta é cumprida, uma faixa de luz percorre a barra de progresso e o selo "Meta cumprida" carimba com leve impacto.

## 3. Mundo vivo

- **Fogueira:** as chamas tremem (escala e opacidade em loop de 1,2 s), sobem faíscas devagar e a luz pisca sobre o avatar.
- **Céu por horário:** o fundo do acampamento acompanha a hora local, com amanhecer, dia, entardecer e noite. Pode ser filtro de cor sobre a arte atual.
- **Avatar respirando:** escala de 1,000 a 1,006 em 3 s, quase imperceptível, para tirar a sensação de imagem parada.
- **Transições:** entrar num mundo ou num marco faz um zoom suave na imagem do mundo, em vez de corte seco.

## 4. Som

Desligado por padrão. Botão de Música com estado visível (ligado e desligado).

| Momento | Som |
|---|---|
| Música do acampamento | fogo crepitando, vento leve e uma lira distante em loop |
| Iniciar leitura | página virando |
| Finalizar missão | sino suave |
| Abrir bolsa | couro e cordão |
| Siclos chegando | moedas caindo |
| Comum e Rara | lira curta |
| Épica | acorde de lira mais longo |
| Lendária e Gloriosa | shofar curto |
| Subir de nível | tambor e lira |

- No Android, vibração leve ao cumprir a meta e ao ganhar uma skin.
- Sons originais ou com licença livre, e o mesmo volume entre todos.

## 5. Funções que reforçam a jornada

1. **Convite por link ou QR** em Amigos. Quem entra pelo convite vê o viajante de quem convidou no acampamento.
2. **Desafio de grupo:** ler o mesmo livro numa semana, com progresso coletivo e sem ranking. **(banco)**
3. **Diário de uma frase** ao fim do capítulo, que vira um histórico no Perfil. **(banco)**
4. **Cartão para compartilhar** a conquista ou o versículo, com a skin vestida.
5. **Lembrete diário** por notificação. O app já pode ser instalado; falta o service worker e o envio. **(banco)**

## 6. Correções antes dos efeitos

1. **"Experimentar sem conta":** levar o visitante ao acampamento e a um capítulo, salvando só no aparelho, e pedir a conta ao guardar a primeira recompensa.
2. **Links diretos e página 404 em branco:** a hospedagem deve reescrever para `index.html` só o que não for arquivo, sem incluir `/_expo/*`.
3. **Erros do cadastro:** e-mail inválido, e-mail já cadastrado, senha fraca e excesso de tentativas.
4. **Onboarding:** "Etapa 2 de 3" na escolha do viajante.
5. **Abertura:** splash com o emblema e a fogueira no `index.html`.
6. **Aviso de marco na escolha de capítulo:** um botão principal e uma frase curta.

## Ordem sugerida

1. Correções da seção 6.
2. Bolsa animada e revelação por raridade (2.1 e 2.2), que dão o maior ganho de sensação de jogo.
3. Fogueira viva e avatar respirando (3).
4. Níveis com títulos e animação de subir de nível (1.1).
5. Som (4).
6. Mapa com marcador e trilha acesa (1.3).
7. Acampamento que evolui (1.2), que depende das artes novas.
8. Itens marcados com **(banco)**.
