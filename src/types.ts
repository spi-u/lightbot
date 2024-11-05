export type Direction = 'north' | 'east' | 'south' | 'west';
export type Command = 'forward' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface GameLevel {
  id: number;
  grid: number[][];  // 0 - пустая клетка, 1 - стена, 2 - цель
  startPosition: Position;
  startDirection: Direction;
  name: string;
  description: string;
}

export interface GameState {
  currentPosition: Position;
  currentDirection: Direction;
  commands: Command[];
  isExecuting: boolean;
  levelCompleted: boolean;
} 