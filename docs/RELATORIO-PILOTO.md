# Jornada Bíblica · Prontidão do piloto gratuito

## Parecer

O piloto web está pronto para ser compartilhado gratuitamente com um grupo de teste. O percurso principal começa em **Começar demonstração** e pode ser feito com uma Bíblia física à mão. As leituras, recompensas, compras e conquistas ficam no navegador usado para o teste. Trocar de navegador ou apagar os dados do site inicia um progresso separado.

[Abrir o piloto da Jornada Bíblica](https://jornada-biblica-piloto.lushbrush67.chatgpt.site)

## O que entrou nesta versão

- **Progresso visível.** O acampamento, a aba Ler, o mapa e o Perfil mostram barras luminosas, com azul para leitura, violeta para XP e verde para metas cumpridas. O dourado identifica Siclos e conquistas. Os contadores também têm texto e ícones. Os painéis sobre a arte do acampamento, do Mercado e do Santuário recebem transparência e reflexos. A interface mantém o contraste do texto e respeita a preferência de movimento reduzido. [Diretrizes de materiais da Apple](https://developer.apple.com/design/human-interface-guidelines/materials)
- **Bolsa de recompensas.** Uma bolsa de couro ilustrada em 2.5D aparece depois de uma leitura com recompensas confirmadas. Cada toque revela um crédito ou item, com o nome e a raridade. O jogador pode ir direto ao resumo. A referência de jogo foi a abertura de recompensas do Clash Royale. Na Jornada, o conteúdo vem do resultado da leitura, das regras do catálogo e da escolha da meta diária. [Referência de recompensas da Supercell](https://support.supercell.com/clash-royale/en/articles/lucky-chests-6.html)
- **Resumo e recuperação.** O XP combina a leitura e o bônus da meta, com as duas parcelas visíveis quando aplicável. O resumo lista os Siclos e itens concedidos. Se a resposta da finalização se perder, a verificação recupera o resultado da mesma sessão. Na aba **Ler**, o botão **Último resultado** abre o resultado mais recente e permite rever a bolsa. Uma releitura sem recompensa nova mostra diretamente o resultado. Uma releitura que cumpre um marco pela primeira vez continua podendo entregar seus artefatos.
- **Escolha da meta.** O item Comum escolhido tem sua própria revelação após a confirmação. Ao rever o resultado que cumpriu a meta, o item aparece junto dos demais ganhos.

## O que funciona no piloto

| Área | Fluxo disponível |
| --- | --- |
| Entrada e visual | Entrada pelo navegador sem cadastro, acampamento, avatar personalizável, guarda-roupa, coleções e visuais salvos. O ícone e o manifesto web estão publicados. |
| Leitura e metas | Seleção de livro e capítulo, busca por passagem, cronômetro com pausa e retomada, confirmação de leitura, releitura, meta diária e escolha de recompensa. |
| Jornada | Sete mundos no mapa. A trilha de Rute combina leituras, perguntas opcionais, Cajado de Boaz, Capa de Rute e Manto do Resgate. A do Tabernáculo integra os marcos de Êxodo 25 e 30 e a leitura de Êxodo 40. |
| Recompensas e Santuário | XP, Siclos, itens da meta, prêmios das missões especiais e artefatos dos marcos. Na Biblioteca Lendária, o jogador pode buscar pelo nome e filtrar por mundo. |
| Mercado | Saldo em Siclos virtuais, prévia, confirmação da compra e item adquirido no inventário. A vitrine indica a troca diária às 21h de Brasília. |
| Perfil | Nível, barra de XP, próxima conquista, contadores de leitura e histórico de marcos e medalhas. Amigos já tem uma prévia do cartão do jogador. |

## Validação

- 122 testes automatizados do app e verificação de tipos.
- 485 verificações SQL no mesmo motor de banco local usado pelo piloto. O serviço Supabase em nuvem, a confirmação por e-mail e a recuperação de conta fazem parte da próxima etapa.
- Navegação e leitura em navegador com larguras de 320, 390 e 412 px. A abertura foi exercitada por toque simulado e teclado, com movimento normal e reduzido. A auditoria de imagens confirmou o manifesto dos sprites e apontou peças vestidas que ainda usam arte provisória em alguns modelos.
- No endereço público, uma sessão nova concluiu Gênesis 1, abriu a bolsa pelo toque, passou pelo resumo e mostrou 60 de 120 XP para o próximo nível. O texto e o valor das barras foram verificados na interface de acessibilidade do navegador.
- No teste de atualização, o navegador registrou Rute 1 usando a exportação da versão anterior. A versão publicada recuperou essa etapa e os 60 XP, registrou Rute 2, revelou o Cajado de Boaz e preservou o último resultado após recarregar.

## O que fechar antes de chamar de lançamento definitivo

1. **Testar em aparelhos reais.** Abrir o link em um iPhone e em um Android, registrar uma leitura, bloquear a tela durante outra, voltar e verificar o resultado. Conferir também o caminho de adicionar à tela inicial.
2. **Guardar o histórico entre aparelhos.** Publicar o ambiente com contas e validar entrada, confirmação de e-mail, recuperação de senha e sincronização. Para quem testar agora, o histórico fica local neste navegador.
3. **Preparar a Bíblia digital.** Escolher a edição em português para uso no app e integrar o texto. No piloto, a pessoa acompanha a leitura na própria Bíblia.
4. **Concluir o acabamento.** Finalizar os sprites vestíveis nos modelos ainda provisórios e validar a versão instalada. Amizades, ranking e desafios em grupo seguem em desenvolvimento.

Para o primeiro teste, peça à pessoa que abra a Trilha de Rute, leia o primeiro capítulo, revele as recompensas e procure seu progresso no Perfil. Registre se ela entendeu sozinha a próxima leitura e se conseguiu voltar ao ponto onde parou.

## Referências de produção visual

Usei as orientações de design presentes na cópia local do catálogo do Claude Code para manter Cinzel nos títulos da Jornada, Atkinson Hyperlegible Next nos controles e a abertura da bolsa como o principal momento de animação. A edição e a validação foram executadas nesta sessão.

A arte foi gerada com a ferramenta integrada de imagens. Os quadros [fechado](../assets/journey/rewards/pouch-closed.webp) e [aberto](../assets/journey/rewards/pouch-open.webp) foram otimizados para a interface. O pedido de imagem foi uma folha de dois quadros com a mesma bolsa de viagem em couro castanho, costura, cordões de linho e fecho de bronze. À esquerda, a bolsa amarrada. À direita, a boca aberta com luz dourada no interior. Mesma pose e escala, pintura realista de RPG 2.5D e transparência ao redor da peça.

<details>
<summary>Pedido original da geração de imagem</summary>

```text
Create a two-frame game sprite sheet for the mobile RPG Jornada Bíblica. Wide horizontal canvas with two equally sized square cells and a clean transparent background. Both frames show the same small, plump, historically inspired first-century travel pouch of rich walnut-brown leather, tightly stitched seams, brass button bearing a discreet four-point rosette, and weathered flax drawstrings. In the LEFT half show it tied shut with the drawstrings dangling. In the RIGHT half show the same pouch opened, the drawstrings loosened with its round mouth visible and a softly lit warm gold interior. Keep the footprint, object scale, ground line, viewing angle and proportions identical across both frames. Leave a generous transparent moat between the pouches and around all edges, center the pouch in each cell. Three-quarter frontal angle seen very slightly from above. Painterly realistic 2.5D RPG item sprite, convincing leather grain, crisp hand-painted stitching, warm amber rim light, substantial silhouette; premium polished fantasy inventory artwork with natural materials. No cast shadow on the background, no flying particles, no coins or loot, no human elements, no labels, no text, no watermark, no dividing line. Use native transparency around the objects.
```
</details>
