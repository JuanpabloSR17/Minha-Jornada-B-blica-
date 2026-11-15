# Tour e piloto da Jornada Bíblica

A Jornada já registra capítulos, recompensa o ritmo de leitura e transforma conquistas em itens e medalhas. O piloto deve verificar se quem chega pela primeira vez entende **onde está, o que ler agora e o que mudou depois que leu**.

## Como ler esta revisão

A base do tour é o ramo de trabalho no commit `96ce033`. A revisão cruza as telas e as regras com os roteiros de validação já registrados no projeto. Os resultados da versão deste piloto devem ser lidos na seção de verificação da entrega.

## Tour por área

| Área | O que funciona | O que ajustar |
|---|---|---|
| **Boas-vindas, cadastro e entrada** | É possível experimentar o criador sem conta e recuperar o rascunho no cadastro. Cadastro e entrada usam e-mail e senha. O fluxo de recuperação por e-mail está implementado. | Explicar o alcance de “Experimentar” na tela inicial. Validar confirmação e recuperação com e-mails reais no endereço do piloto. Mostrar erros recuperáveis com uma saída clara. |
| **Identidade, personagem e meta** | Nome, usuário único e perfil privado por padrão. O criador salva corpo, rosto, cabelo e visual, em quatro passos. O ritmo pode ser de 1, 2, 3, 5 capítulos, personalizado ou livre. | Mostrar em cada passo quanto falta até a primeira leitura. Oferecer um visual inicial e a possibilidade de personalizar em mais detalhes depois, sem perder o rascunho. |
| **Início no acampamento** | Mostra o personagem equipado e a ação principal de começar, continuar ou verificar a leitura. A próxima leitura usa o progresso da conta e há atalhos para Mercado, guarda-roupa e Santuário. | Dar mais destaque à referência, à meta e à próxima conquista alcançável. Mostrar um estado de conclusão total, pois a sugestão atual recai em Gênesis 1 quando o servidor informa que já terminou. |
| **Jornada** | O mapa abre sete mundos, com 66 livros e 1.189 capítulos. Cada livro mostra o progresso e permite abrir um capítulo. O servidor registra a conclusão do mundo uma vez. A medalha aparece no mapa e no Perfil. | Diferenciar no mapa “por começar”, “em andamento” e “concluído”. Mostrar um objetivo curto dentro de cada mundo, com acesso direto ao próximo capítulo. |
| **Ler e Modo Missão** | A aba agrupa os livros por mundo. A passagem selecionada pela Jornada abre com a ação de iniciar perto do topo. O modo físico tem cronômetro, pausa, retomada e confirmação. Uma finalização interrompida pode ser reenviada com o mesmo registro. | A seleção manual mostra os 66 livros antes da grade do livro escolhido. Levar a grade para junto da seleção, com busca por livro ou passagem, e levar também o toque numa missão especial ao painel de leitura. O modo digital depende da escolha e integração de uma edição autorizada. |
| **Resultado, meta e XP** | Capítulo inédito concede 40 XP. Cumprir a meta do dia concede 40 Siclos, 20 XP extras e um Comum à escolha, quando houver opções. Releitura mantém o progresso já registrado. Recompensas trazem o item conquistado e, quando aplicável, a ação de equipar. | Mostrar o antes/depois do livro e do mundo. A passagem seguinte na tela de resultado segue a ordem canônica e pode já ter sido lida. Reutilizar a sugestão da conta e preservar uma ação explícita de releitura. A experiência ainda acumula pontos sem uma trilha de níveis visível. |
| **Missões especiais e Marcos** | Quatorze missões dão acesso a 16 dos 18 Raros. Vinte marcos dão acesso aos 22 Santos. O jogador escolhe explicitamente o marco para receber os Santos, e a revelação pode ser pulada. | Manter a diferença entre leitura comum, missão e marco perto da ação. Esclarecer “marco cumprido” e “item obtido”. A descrição genérica de obtenção ainda chama missões de “em breve”; revisar. Cálice de Bronze e Bolsa do Mensageiro esperam revisão editorial. |
| **Mercado dos Viajantes** | Dos 25 itens elegíveis, sete entram na vitrine diária às 21h de Brasília e quatro ficam na seção de essenciais. O app mostra saldo, preço e confirmação. O servidor preserva o saldo quando a oferta expira e recupera a compra após perda de resposta sem débito duplo. | Facilitar prévia, comparação e acesso direto ao item comprado. Manter preço, saldo e horário em texto legível. Verificar a virada e o reenvio também no ambiente do piloto. |
| **Guarda-roupa, visuais e coleções** | Inventário com busca, filtros, raridades, posse e prévia. O detalhe liga o item à passagem, à forma de obtenção e às variantes. Visuais têm controle de versões e limite gratuito de três. Coleções informam os itens obtidos. | Destacar “Equipado”, “Obtido” e “Bloqueado” com símbolo e rótulo. Dar mais espaço a nomes longos e à ação de equipar. Os 185 itens têm miniatura identificável; várias peças vestidas ainda têm arte provisória. Pagamento do Premium ainda depende de integração. |
| **Santuário** | Separa marcos cumpridos, Santos obtidos e progresso de coleções. Abriga artefatos, Biblioteca Lendária e detalhes de passagem e significado. | Encurtar a navegação na biblioteca com busca e filtros por mundo ou livro. Ao encontrar um item bloqueado, oferecer um atalho claro para a passagem ou o marco correspondente. |
| **Perfil e Amigos** | O perfil da conta mostra capítulos, livros, mundos, marcos, Santos, medalhas e atalhos para o avatar. O perfil público é opcional e mostra nome, usuário e visual a outras contas autenticadas. | Colocar progresso e conquistas acima ou ao lado do palco do avatar no celular. A aba Amigos mostra uma prévia, inclusive um “1º” ilustrativo. Lista de amigos, ranking, desafios e compartilhamento ficam para uma etapa social. Para o piloto, usar rótulo de prévia evidente ou retirar a aba principal. |

**Como as conquistas se encadeiam hoje.** Êxodo 25 é o exemplo mais completo. A leitura normal registra o capítulo e pode avançar a meta. A sessão iniciada pelo Marco do Tabernáculo também pode revelar Arca, Mesa e Candelabro conforme o que a conta ainda pode obter. A revelação dá acesso ao Santuário. O capítulo entra no progresso de Êxodo e do mundo Origens e Aliança.

## Melhorias prioritárias

### Antes de convidar participantes

1. **Uniformizar leitura e controles.** Usar uma família de texto com bom peso para títulos de seção, frases, listas, formulários e botões. Preservar a tipografia ornamental para a marca e as conquistas. Usar ícones com texto nas ações, contraste de texto consistente no índigo e no tema claro, alvos confortáveis e espaço para ampliação. Conferir rótulos longos e o botão principal em 320 px.
2. **Encurtar o caminho até o primeiro capítulo.** A ação principal do Início deve levar direto à passagem e à possibilidade de ler. Ao escolher um livro longe do topo, abrir os capítulos no mesmo lugar. O painel de leitura preserva uma escolha explícita quando houver um marco associado.
3. **Fechar a experiência de teste no celular.** Na versão web em HTTPS, testar recarregamento em rota interna, entrada, saída, links de recuperação e persistência. No Android e no iPhone, conferir a barra do navegador, o teclado, texto com ampliação, pausas, retorno após bloquear a tela e rede interrompida. Uma prova no navegador em largura móvel cobre layout, enquanto o teste no aparelho observa o comportamento real do sistema.

### Para tornar a evolução visível

1. **Acampamento.** Exibir, com nomes e símbolos, a próxima passagem, a meta de hoje e a próxima conquista relevante. Uma mensagem como “Faltam dois capítulos para concluir Rute” mostra o objetivo ao retornar da leitura.
2. **Página de cada mundo.** Liberar os destinos para exploração desde o início. Mostrar um emblema por mundo, avanço por livro, a próxima parada e conquistas obtidas. Origens e Aliança tem 187 capítulos, enquanto Visão da Nova Criação tem 22. Um primeiro capítulo, um trecho temático curto e um livro concluído dão marcos intermediários mesmo nos mundos maiores.
3. **Resultado e Perfil.** Dar feedback curto e pulável quando um capítulo, livro ou mundo sobe um degrau. No Perfil, propor uma trilha de XP com próximo nível e benefícios cosméticos, mais um histórico das últimas conquistas. Os marcos e medalhas precisam referenciar capítulos realmente registrados. A recompensa adicional por mundo ainda depende de decisão de produto.
4. **Santuário, itens e arte.** Usar famílias de ícones para leituras, mundos, metas, coleções, itens e conquistas. Trabalhar as peças vestidas do visual inicial em lotes que possam ser conferidos em 320 e 412 px. O lote atual do corpo Atlético tem 44 de 70 arquivos de arte pintados. Esse número descreve as camadas desse lote.

### Para divertir enquanto se aprende

Começar com uma trilha curta e curada, com contexto escrito para o app e referências para a Bíblia física. Em cada passagem, dar uma frase antes da leitura e, no fim, uma pergunta opcional com resposta comentada ou convite à reflexão. Na trilha **Rute**, a abertura pode apresentar o contexto da viagem de Noemi. Depois de Rute 1, uma pergunta convida o leitor a relacionar a escolha de Rute com o que acabou de ler. O registro avança no mapa e na barra do livro. Ao concluir o livro, o leitor recebe o Lendário que o sistema já concede.

Em uma segunda trilha, ligar as passagens às peças do Santuário. O leitor consegue abrir o contexto de um artefato, localizar a passagem, lê-la e rever o significado na exposição. As perguntas servem ao aprendizado e podem ser puladas. A revisão editorial deve conferir as referências, os significados e as diferenças entre a passagem e a representação simbólica. O leitor digital pode entrar após a decisão da edição e do uso do texto. Amigos e desafios têm mais valor depois que o ciclo individual estiver claro.

## Roteiro de teste no celular

Tenha uma Bíblia física à mão. Na demonstração, toque em **Começar demonstração** e vá direto ao acampamento. O progresso fica no navegador, e o saldo inicial de 80 Siclos permite testar uma compra. As etapas de cadastro e acesso em outro aparelho pertencem ao futuro piloto com contas. Faça o percurso no Android ou iPhone, de preferência com outra pessoa acompanhando sem sugerir o próximo toque.

| Passo | O que tentar | O que deve acontecer |
|---|---|---|
| 1 | Abrir o link, experimentar o criador, depois cadastrar e entrar | O jogador entende onde está, mantém o rascunho e chega ao acampamento. A conta abre como privada. |
| 2 | Escolher meta de um capítulo. Abrir uma passagem pelo mapa | Mundo, livro, capítulo e ação principal ficam claros. O mapa continua navegável. |
| 3 | Começar a leitura, pausar, fechar e reabrir | A mesma sessão reaparece e o tempo pausado fica preservado. O estado de leitura em andamento permanece identificável. |
| 4 | Confirmar um capítulo inédito, conferir o resultado e escolher o Comum | O registro aparece uma vez. A meta, o livro e a Jornada refletem o mesmo avanço. A escolha volta se o jogador sair antes de confirmar. |
| 5 | Ler Êxodo 25 pelo Marco do Tabernáculo e visitar o Santuário | A sessão indica “marco”, a revelação mostra os Santos disponíveis e o acervo reflete a posse. |
| 6 | Concluir a meta em outro dia. Comprar no Mercado, equipar e reabrir | Uma compra válida aparece no inventário, o saldo é ajustado uma vez e o personagem mantém a peça. Os essenciais mais baratos custam 80 Siclos. |
| 7 | Conferir Perfil, mapa e opções com texto ampliado. Abrir a conta em outro aparelho | O progresso e a aparência persistem. O título, os botões, os erros e os estados de posse continuam legíveis e acionáveis. |

No registro do piloto, anote o aparelho, se concluiu sem ajuda, onde precisou voltar e se soube explicar a próxima ação. Dê atenção especial à primeira leitura, à diferença entre marco e leitura comum, ao reaparecimento da sessão depois de fechar e ao que mudou no mapa após a leitura.

## Verificação desta entrega

A interface passou a usar Atkinson Hyperlegible Next em textos, formulários, listas e botões, com pesos médio, seminegrito e negrito. Cinzel ficou nos títulos ornamentais. A barra de navegação, os mundos, a leitura, os marcos e o Perfil receberam ícones com rótulos. O ícone do app é uma Bíblia aberta em dourado sobre índigo, com a mesma marca na abertura. A imagem foi gerada para o projeto e adaptada aos formatos nativo e web.

O piloto web roda a aplicação e as regras de leitura, recompensas e Mercado no navegador. Ele usa o mesmo conjunto de migrações do projeto em uma base local. O cadastro real, o envio de e-mails e a sincronização entre aparelhos precisam de um ambiente Supabase de testes. A tela nativa de abertura está configurada e ainda precisa de conferência em aparelhos Android e iOS.

Na versão desta entrega, o TypeScript e os 108 testes automatizados passaram. No navegador, iniciei o Marco do Tabernáculo pelo mapa, concluí Êxodo 25, conferi os três Santos no Perfil e os recuperei após reabrir. Em seguida, comprei o Cantil de Água e conferi a atualização do saldo e a abertura do guarda-roupa. As rotas de Início, Jornada, Ler, Perfil, Mercado, guarda-roupa, Santuário e Amigos abriram sem rolagem lateral em 320, 390 e 412 px.

## Evidências da revisão

- [Roteiro completo de cadastro, inventário, missão, meta, Mercado e privacidade](../e2e/marco1.flow.cjs)
- [Roteiro de progressão no Perfil e no mapa, retomada e Mercado](../e2e/fixes.flow.cjs)
- [Roteiro de revelação, Santuário e movimento reduzido](../e2e/journey.flow.cjs)
- [Validação do Supabase](VALIDACAO-SUPABASE.md)
- [Regras da conclusão dos mundos](MUNDOS-RECOMPENSAS.md) e [rotação do Mercado](MERCADO.md)
- [Cobertura dos ícones](IDENTIDADE-E-ICONES.md) e [estado da pintura](arte-lotes/lote-1/ESTADO.md)

