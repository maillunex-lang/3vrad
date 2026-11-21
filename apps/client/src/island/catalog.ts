export type StageCost = { unlockLevel: number; costStars: number };

export type BuildingDef = {
  id: string;
  name: string;
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5' | 'Z6' | 'Z7';
  stages: StageCost[];
  /** Conceptual atlas coords 0–100 from ISLAND-MAP-001 */
  x: number;
  y: number;
};

export const ZONES = [
  { id: 'Z1', name: 'Пляж', unlockLevel: 1 },
  { id: 'Z2', name: 'Берег', unlockLevel: 11 },
  { id: 'Z3', name: 'Роща', unlockLevel: 18 },
  { id: 'Z4', name: 'Центр', unlockLevel: 29 },
  { id: 'Z5', name: 'Лагуна', unlockLevel: 43 },
  { id: 'Z6', name: 'Фестиваль', unlockLevel: 57 },
  { id: 'Z7', name: 'Мыс', unlockLevel: 64 },
] as const;

export const BUILDINGS: BuildingDef[] = [
  { id: 'B01', name: 'Входная арка', zone: 'Z1', stages: [{ unlockLevel: 1, costStars: 1 }, { unlockLevel: 3, costStars: 2 }], x: 16, y: 86 },
  { id: 'B02', name: 'Пляжная дорожка', zone: 'Z1', stages: [{ unlockLevel: 4, costStars: 1 }, { unlockLevel: 5, costStars: 1 }, { unlockLevel: 7, costStars: 2 }], x: 39, y: 88 },
  { id: 'B03', name: 'Мастерская Клеша', zone: 'Z1', stages: [{ unlockLevel: 8, costStars: 1 }, { unlockLevel: 10, costStars: 2 }], x: 66, y: 82 },
  { id: 'B04', name: 'Спасательный причал', zone: 'Z2', stages: [{ unlockLevel: 11, costStars: 1 }, { unlockLevel: 12, costStars: 1 }, { unlockLevel: 14, costStars: 2 }], x: 86, y: 78 },
  { id: 'B05', name: 'Кафе «Кокос и Ко»', zone: 'Z2', stages: [{ unlockLevel: 15, costStars: 1 }, { unlockLevel: 17, costStars: 2 }], x: 56, y: 74 },
  { id: 'B06', name: 'Пальмовая аллея', zone: 'Z3', stages: [{ unlockLevel: 18, costStars: 1 }, { unlockLevel: 19, costStars: 1 }, { unlockLevel: 21, costStars: 2 }], x: 36, y: 66 },
  { id: 'B07', name: 'Пляжные бунгало', zone: 'Z3', stages: [{ unlockLevel: 22, costStars: 1 }, { unlockLevel: 24, costStars: 2 }], x: 68, y: 64 },
  { id: 'B08', name: 'Смотровая площадка', zone: 'Z3', stages: [{ unlockLevel: 25, costStars: 1 }, { unlockLevel: 26, costStars: 1 }, { unlockLevel: 28, costStars: 2 }], x: 14, y: 58 },
  { id: 'B09', name: 'Рынок ракушек', zone: 'Z4', stages: [{ unlockLevel: 29, costStars: 1 }, { unlockLevel: 31, costStars: 2 }], x: 56, y: 53 },
  { id: 'B10', name: 'Фонтан жемчужин', zone: 'Z4', stages: [{ unlockLevel: 32, costStars: 1 }, { unlockLevel: 33, costStars: 1 }, { unlockLevel: 35, costStars: 2 }], x: 36, y: 49 },
  { id: 'B11', name: 'Почтовая станция', zone: 'Z4', stages: [{ unlockLevel: 36, costStars: 1 }, { unlockLevel: 38, costStars: 2 }], x: 78, y: 47 },
  { id: 'B12', name: 'Клуб путешественников', zone: 'Z4', stages: [{ unlockLevel: 39, costStars: 1 }, { unlockLevel: 40, costStars: 1 }, { unlockLevel: 42, costStars: 2 }], x: 19, y: 42 },
  { id: 'B13', name: 'Мост к лагуне', zone: 'Z5', stages: [{ unlockLevel: 43, costStars: 1 }, { unlockLevel: 45, costStars: 2 }], x: 46, y: 37 },
  { id: 'B14', name: 'Лагунный бар', zone: 'Z5', stages: [{ unlockLevel: 46, costStars: 1 }, { unlockLevel: 47, costStars: 1 }, { unlockLevel: 49, costStars: 2 }], x: 76, y: 34 },
  { id: 'B15', name: 'Сад светлячков', zone: 'Z5', stages: [{ unlockLevel: 50, costStars: 1 }, { unlockLevel: 52, costStars: 2 }], x: 22, y: 30 },
  { id: 'B16', name: 'Домик исследователя', zone: 'Z5', stages: [{ unlockLevel: 53, costStars: 1 }, { unlockLevel: 54, costStars: 1 }, { unlockLevel: 56, costStars: 2 }], x: 55, y: 27 },
  { id: 'B17', name: 'Сцена фестиваля', zone: 'Z6', stages: [{ unlockLevel: 57, costStars: 1 }, { unlockLevel: 59, costStars: 2 }], x: 31, y: 21 },
  { id: 'B18', name: 'Отель «Райский»', zone: 'Z6', stages: [{ unlockLevel: 60, costStars: 1 }, { unlockLevel: 61, costStars: 1 }, { unlockLevel: 63, costStars: 2 }], x: 72, y: 18 },
  { id: 'B19', name: 'Башня наблюдений', zone: 'Z7', stages: [{ unlockLevel: 64, costStars: 1 }, { unlockLevel: 66, costStars: 2 }], x: 22, y: 11 },
  { id: 'B20', name: 'Старый маяк', zone: 'Z7', stages: [{ unlockLevel: 67, costStars: 1 }, { unlockLevel: 68, costStars: 1 }, { unlockLevel: 70, costStars: 2 }], x: 58, y: 7 },
];

export function totalStarBudget(): number {
  return BUILDINGS.reduce((s, b) => s + b.stages.reduce((a, st) => a + st.costStars, 0), 0);
}
