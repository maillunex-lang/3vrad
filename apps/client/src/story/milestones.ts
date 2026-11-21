/**
 * Large story beats every ~10 levels (STORYLEVEL-001 B / BUILDINGS-001).
 * Copy is playable TEMP dialogue until dedicated CHAR scripts are approved.
 */
export type StoryBeat = {
  level: number;
  title: string;
  speaker: string;
  lines: string[];
};

export const STORY_MILESTONES: StoryBeat[] = [
  {
    level: 10,
    title: 'Пляж ожил',
    speaker: 'Клеш',
    lines: [
      'Молоток нашёл, арка стоит, дорожка ведёт к воде.',
      'Первый рабочий пляж готов — дальше берег и причал!',
    ],
  },
  {
    level: 20,
    title: 'Роща принимает гостей',
    speaker: 'Майя',
    lines: [
      'Пальмы выстроились в аллею, бунгало ждут первых гостей.',
      'Держи тропический стиль — люкс и сказка откроются позже.',
    ],
  },
  {
    level: 30,
    title: 'Загадка площади',
    speaker: 'Кеф',
    lines: [
      'Рынок шумит, а фонтан жемчужин шепчет странный сигнал…',
      'Центр острова открыт. Следи за жемчужиной.',
    ],
  },
  {
    level: 40,
    title: 'Мост к лагуне',
    speaker: 'Майя',
    lines: [
      'Клуб путешественников собрался, мост зовёт к лагуне.',
      'Стиль «люкс» теперь доступен для готовых зданий.',
    ],
  },
  {
    level: 50,
    title: 'Праздничная лагуна',
    speaker: 'Кеф',
    lines: [
      'Бар светится, сад светлячков мерцает — лагуна празднует.',
      'Ещё немного — и фестиваль зажжёт сцену.',
    ],
  },
  {
    level: 60,
    title: 'Перед фестивалем',
    speaker: 'Исследователь',
    lines: [
      'Сцена почти готова, в заметках — загадка старого маяка.',
      'Стиль «сказка» открыт. Готовься к мысу.',
    ],
  },
  {
    level: 70,
    title: 'Маяк зажжён',
    speaker: 'Майя',
    lines: [
      'Маяк снова светит — первый остров восстановлен.',
      'Горизонт зовёт ко второму острову. Скоро!',
    ],
  },
];

export function beatForLevel(level: number): StoryBeat | undefined {
  return STORY_MILESTONES.find((b) => b.level === level);
}

export const STYLE_UNLOCK = {
  luxury: 20,
  fantasy: 40,
} as const;
