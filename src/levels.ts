import { GameLevel } from './types';

export const LEVELS: GameLevel[] = [
  {
    id: 1,
    name: "Первые шаги",
    description: "Дойдите до синей клетки",
    grid: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 2],
    ],
    startPosition: { x: 0, y: 0 },
    startDirection: 'east'
  },
  {
    id: 2,
    name: "Поворот",
    description: "Научитесь поворачивать",
    grid: [
      [0, 0, 0],
      [0, 1, 2],
      [0, 0, 0],
    ],
    startPosition: { x: 0, y: 0 },
    startDirection: 'east'
  },
  // Добавьте больше уровней по желанию
]; 