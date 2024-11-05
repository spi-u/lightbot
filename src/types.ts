export type Direction = 'north' | 'east' | 'south' | 'west';
export type Command = 'forward' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface GameLevel {
  id: number;
  name: string;
  description: string;
  grid: number[][];
  startPosition: Position;
  startDirection: Direction;
}

export interface GameState {
  currentPosition: Position;
  currentDirection: Direction;
  commands: Command[];
  isExecuting: boolean;
  levelCompleted: boolean;
  explosion?: Position;
  currentLevel: number;
} 