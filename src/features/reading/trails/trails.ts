import type { IconName } from '@/ui';

type Reflection = {
  question: string;
  choices: readonly [string, string, string];
  correct: 0 | 1 | 2;
  commentary: string;
};

export type TrailStep = {
  chapter: number;
  title: string;
  icon: IconName;
  focus: string;
  introduction: string;
  reflection: Reflection;
  milestoneId?: string;
};

export type Trail = { book: string; title: string; steps: readonly TrailStep[] };

export const RUTH_TRAIL: Trail = {
  book: 'RUT',
  title: 'Trilha de Rute',
  steps: [
    {
      chapter: 1, title: 'A estrada de volta', icon: 'compass', focus: 'Rute 1:6–22',
      introduction: 'Uma família de Belém foi morar em Moabe durante uma fome. Anos depois, Noemi se prepara para voltar. Repare no que Rute tem a perder ou a ganhar ao escolher acompanhá-la.',
      reflection: {
        question: 'Que compromisso Rute assume quando Noemi decide voltar para Belém?',
        choices: ['Visitar Noemi depois da colheita.', 'Acompanhar Noemi e fazer parte de seu povo.', 'Pedir que Noemi fique com ela em Moabe.'],
        correct: 1,
        commentary: 'Rute decide seguir com Noemi e se compromete com seu povo e seu Deus. A decisão dá forma à lealdade em um momento em que o futuro das duas ainda é incerto. Releia Rute 1:15–18.',
      },
    },
    {
      chapter: 2, title: 'Entre as espigas', icon: 'sunrise', focus: 'Rute 2:2–17',
      introduction: 'Em Belém, começa a época da colheita. Rute sai em busca de alimento. Observe o que ela faz por iniciativa própria e como Boaz reage ao encontrá-la em seu campo.',
      reflection: {
        question: 'O que Boaz faz para acolher Rute no campo?',
        choices: ['Pede que ela só volte no fim da colheita.', 'Envia Rute a outro campo para recolher espigas.', 'Oferece proteção e orienta os trabalhadores a deixarem espigas para ela.'],
        correct: 2,
        commentary: 'Boaz permite que Rute recolha espigas perto de suas trabalhadoras e pede que deixem parte da colheita para ela. A solidariedade aparece em decisões concretas que tornam o trabalho de Rute mais seguro. Veja Rute 2:8–9 e 15–16.',
      },
    },
    {
      chapter: 3, title: 'Uma conversa na eira', icon: 'lamp', focus: 'Rute 3:6–13',
      introduction: 'Uma eira era o lugar onde se separavam os grãos das hastes depois da colheita. Na eira, Rute apresenta um pedido a Boaz. Preste atenção ao que ele pode prometer naquela noite.',
      reflection: {
        question: 'Por que Boaz precisa conversar com outra pessoa antes de assumir o compromisso?',
        choices: ['Havia um parente mais próximo com prioridade.', 'Os trabalhadores precisavam escolher quem ficaria com a colheita.', 'Noemi ainda precisava indicar onde ficava a eira.'],
        correct: 0,
        commentary: 'Boaz aceita cuidar da questão, mas reconhece que outro parente é mais próximo. A cena combina disposição para ajudar com respeito às responsabilidades que já existiam. Veja Rute 3:11–13.',
      },
    },
    {
      chapter: 4, title: 'Uma história que continua', icon: 'medal', focus: 'Rute 4:9–22',
      introduction: 'A negociação chega à porta da cidade, onde havia testemunhas. Leia até o fim e repare por que o livro termina com uma lista de nomes.',
      reflection: {
        question: 'Qual rei aparece na genealogia com que o livro termina?',
        choices: ['Salomão.', 'Josias.', 'Davi.'],
        correct: 2,
        commentary: 'A genealogia liga a família de Rute ao rei Davi. Assim, as decisões de uma família também se tornam parte da história de Israel. Veja Rute 4:17–22.',
      },
    },
  ],
};

export const TABERNACLE_TRAIL: Trail = {
  book: 'EXO',
  title: 'Trilha do Tabernáculo',
  steps: [
    {
      chapter: 25, title: 'A mobília da tenda', icon: 'chest', focus: 'Êxodo 25:10–40',
      milestoneId: 'marco_mobilia_do_tabernaculo',
      introduction: 'O capítulo apresenta as contribuições para o santuário e as instruções para seus primeiros objetos. Durante a leitura, observe as diferenças entre arca, mesa e candelabro.',
      reflection: {
        question: 'Qual objeto recebia os pães colocados diante de Deus?',
        choices: ['A arca.', 'A mesa.', 'O candelabro.'],
        correct: 1,
        commentary: 'Os pães ficavam sobre a mesa. A arca tinha outra função e o candelabro sustentava as lâmpadas. Compare Êxodo 25:16, 30 e 37.',
      },
    },
    {
      chapter: 30, title: 'O altar do incenso', icon: 'lamp', focus: 'Êxodo 30:1–10',
      milestoneId: 'holy_altar_do_incenso',
      introduction: 'As instruções agora descrevem o altar do incenso. Ao ler, repare onde ele ficava e como seu uso se relacionava com o cuidado das lâmpadas.',
      reflection: {
        question: 'Em quais momentos Arão devia queimar o incenso?',
        choices: ['De manhã e ao anoitecer, ao cuidar das lâmpadas.', 'Somente na partida para uma nova etapa da viagem.', 'Apenas depois de cada colheita.'],
        correct: 0,
        commentary: 'O capítulo liga o incenso ao cuidado das lâmpadas pela manhã e ao anoitecer. A rotina ajuda a entender a função do objeto. Veja Êxodo 30:7–8.',
      },
    },
    {
      chapter: 40, title: 'A tenda reunida', icon: 'sanctuary', focus: 'Êxodo 40:17–38',
      introduction: 'No encerramento de Êxodo, objetos descritos antes reaparecem no relato da montagem da tenda. Observe o que a nuvem sinaliza ao povo nas jornadas seguintes.',
      reflection: {
        question: 'Que sinal indicava quando o povo retomava a viagem?',
        choices: ['As lâmpadas ficavam apagadas.', 'A arca era trazida para a entrada.', 'A nuvem se levantava de sobre o Tabernáculo.'],
        correct: 2,
        commentary: 'A movimentação da nuvem indicava quando o povo devia partir. O final liga o santuário recém-montado às jornadas de Israel. Veja Êxodo 40:34–38.',
      },
    },
  ],
};

export function completedTrailSteps(trail: Trail, chapters: readonly number[], milestones: ReadonlySet<string>) {
  return trail.steps.filter((step) => step.milestoneId ? milestones.has(step.milestoneId) : chapters.includes(step.chapter));
}

