import type { WORLDS } from '@/features/journey/worlds';

export type WorldId = typeof WORLDS[number]['id'];

export type WorldTheme = {
  /** frase curta que diz do que o mundo trata */
  tagline: string;
  /** passagem-símbolo (só a referência; o texto fica na Bíblia do jogador) */
  emblemRef: string;
  sky: [string, string];
  ink: string;
  accent: string;
  /** cor do painel sobre a cena */
  panel: string;
  /** trilha guiada ligada ao mundo */
  trail?: { id: 'ruth' | 'tabernacle'; title: string };
};

export const WORLD_THEMES: Record<WorldId, WorldTheme> = {
  origens: {
    tagline: 'Da criação ao Sinai: a promessa a Abraão, o êxodo e a aliança no deserto.',
    emblemRef: 'Êxodo 13:21',
    sky: ['#2B1B3D', '#E0894A'], ink: '#FFF1D9', accent: '#F2B45E', panel: 'rgba(43, 24, 30, 0.92)',
    trail: { id: 'tabernacle', title: 'Trilha do Tabernáculo' },
  },
  reinos: {
    tagline: 'A terra prometida, juízes, reis e o exílio: o povo aprende a confiar.',
    emblemRef: 'Rute 1:16',
    sky: ['#1E2A4A', '#E9B872'], ink: '#FFF4DE', accent: '#D9A3FF', panel: 'rgba(28, 26, 52, 0.92)',
    trail: { id: 'ruth', title: 'Trilha guiada de Rute' },
  },
  sabedoria: {
    tagline: 'Salmos, provérbios e perguntas difíceis: a fé que canta e pensa.',
    emblemRef: 'Salmos 19:1',
    sky: ['#0B1530', '#2C3F6B'], ink: '#E8F2FF', accent: '#92D6AC', panel: 'rgba(12, 22, 44, 0.92)',
  },
  profetas: {
    tagline: 'Vozes que chamam de volta: juízo, consolo e a esperança que virá.',
    emblemRef: 'Isaías 40:31',
    sky: ['#1A0F14', '#6A2E22'], ink: '#FFE9DD', accent: '#F3A991', panel: 'rgba(30, 14, 16, 0.92)',
  },
  evangelhos: {
    tagline: 'A vida, as palavras e os caminhos de Jesus, da Galileia a Jerusalém.',
    emblemRef: 'Marcos 1:17',
    sky: ['#6FA8D8', '#F6D9A0'], ink: '#FFF8EA', accent: '#E8C681', panel: 'rgba(22, 34, 52, 0.9)',
  },
  igreja: {
    tagline: 'Atos e as cartas: a mensagem atravessa o mar e chega às cidades.',
    emblemRef: 'Atos 1:8',
    sky: ['#183A5C', '#8CC4E8'], ink: '#EEF7FF', accent: '#9DC6FF', panel: 'rgba(14, 30, 50, 0.92)',
  },
  'nova-criacao': {
    tagline: 'O Apocalipse: a cidade de luz, o rio da vida e todas as coisas novas.',
    emblemRef: 'Apocalipse 21:5',
    sky: ['#5E3E8C', '#FFE3B0'], ink: '#FFFBF0', accent: '#F2AACE', panel: 'rgba(40, 26, 62, 0.9)',
  },
};
