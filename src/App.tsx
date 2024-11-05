import {
  Typography,
  Button,
  Box,
  Stack,
  Paper,
  Grid,
} from "@mui/material";
import { useState } from "react";
import styled from "styled-components";

// Типы
type Direction = 'north' | 'east' | 'south' | 'west';
type Command = 'forward' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  currentPosition: Position;
  currentDirection: Direction;
  commands: Command[];
  isExecuting: boolean;
  levelCompleted: boolean;
  explosion?: Position;
}

// Уровни
const LEVEL_1 = {
  grid: [
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 1, 1, 0, 0, 2],
  ],
  startPosition: { x: 0, y: 0 },
  startDirection: 'east' as Direction,
  description: "Помоги роботу добраться до зелёной клетки!"
};

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f0f9ff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const GameTitle = styled(Typography)`
  color: #2196f3;
  text-align: center;
  font-size: 2.5rem !important;
  margin-bottom: 1rem !important;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const GameDescription = styled(Typography)`
  color: #666;
  text-align: center;
  font-size: 1.2rem !important;
  margin-bottom: 2rem !important;
`;

const CommandButton = styled(Button)`
  && {
    min-width: 50px;
    width: 50px;
    height: 50px;
    padding: 0;
    border-radius: 8px;
    margin: 4px;
    
    img {
      width: 32px;
      height: 32px;
    }
  }
`;

const ButtonContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const GameCell = styled(Box)<{ 
  isTarget?: boolean; 
  isWall?: boolean; 
  isRobot?: boolean; 
  direction?: Direction;
  isExplosion?: boolean;
}>`
  width: 50px;
  height: 50px;
  border: 2px solid #e3f2fd;
  border-radius: 8px;
  background-color: ${props => 
    props.isExplosion ? '#ffeb3b' :
    props.isTarget ? '#81c784' : 
    props.isWall ? '#ff5252' : '#fff'};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  
  &::after {
    content: '${props => 
      props.isExplosion ? '💥' :
      props.isRobot ? '▲' : ''}';
    color: #1976d2;
    transform: rotate(${props => 
      props.direction === 'east' ? '90deg' :
      props.direction === 'south' ? '180deg' :
      props.direction === 'west' ? '270deg' : '0deg'
    });
  }

  ${props => props.isExplosion && `
    animation: explosion 0.8s ease-in-out;
    @keyframes explosion {
      0% { transform: scale(1); background-color: #ffeb3b; }
      50% { transform: scale(1.2); background-color: #ff9800; }
      100% { transform: scale(1); background-color: #fff; }
    }
  `}
`;

const CommandList = styled(Box)`
  background-color: #fff;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const CommandItem = styled(Typography)`
  && {
    font-size: 1.2rem;
    padding: 4px 0;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const App = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPosition: LEVEL_1.startPosition,
    currentDirection: LEVEL_1.startDirection,
    commands: [],
    isExecuting: false,
    levelCompleted: false,
    explosion: undefined
  });

  const addCommand = (command: Command) => {
    if (!gameState.isExecuting) {
      setGameState(prev => ({
        ...prev,
        commands: [...prev.commands, command]
      }));
    }
  };

  const resetLevel = (keepCommands: boolean = false) => {
    setGameState(prev => ({
      ...prev,
      currentPosition: LEVEL_1.startPosition,
      currentDirection: LEVEL_1.startDirection,
      commands: keepCommands ? prev.commands : [],
      isExecuting: false,
      levelCompleted: false,
      explosion: undefined
    }));
  };

  const moveForward = (pos: Position, dir: Direction): Position => {
    switch (dir) {
      case 'north': return { ...pos, y: pos.y - 1 };
      case 'east': return { ...pos, x: pos.x + 1 };
      case 'south': return { ...pos, y: pos.y + 1 };
      case 'west': return { ...pos, x: pos.x - 1 };
    }
  };

  const rotateDirection = (dir: Direction, rotation: 'left' | 'right'): Direction => {
    const directions: Direction[] = ['north', 'east', 'south', 'west'];
    const currentIndex = directions.indexOf(dir);
    const delta = rotation === 'left' ? -1 : 1;
    const newIndex = (currentIndex + delta + 4) % 4;
    return directions[newIndex];
  };

  const isValidMove = (pos: Position): boolean => {
    return pos.x >= 0 && 
           pos.x < LEVEL_1.grid[0].length && 
           pos.y >= 0 && 
           pos.y < LEVEL_1.grid.length && 
           LEVEL_1.grid[pos.y][pos.x] !== 1;
  };

  const executeCommands = async () => {
    setGameState(prev => ({ 
      ...prev, 
      isExecuting: true,
      explosion: undefined 
    }));
    
    let hasExploded = false;

    for (const command of gameState.commands) {
      if (hasExploded) break;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGameState(prev => {
        const newState = { ...prev };
        
        switch (command) {
          case 'forward':
            const newPosition = moveForward(prev.currentPosition, prev.currentDirection);
            if (isValidMove(newPosition)) {
              newState.currentPosition = newPosition;
            } else {
              hasExploded = true;
              newState.explosion = prev.currentPosition;
              newState.isExecuting = false;
            }
            break;
          case 'left':
            newState.currentDirection = rotateDirection(prev.currentDirection, 'left');
            break;
          case 'right':
            newState.currentDirection = rotateDirection(prev.currentDirection, 'right');
            break;
        }
        
        return newState;
      });

      if (hasExploded) {
        await new Promise(resolve => setTimeout(resolve, 800));
        resetLevel(true);
        break;
      }
    }
    
    if (!hasExploded) {
      const finalPosition = gameState.currentPosition;
      if (LEVEL_1.grid[finalPosition.y][finalPosition.x] === 2) {
        setGameState(prev => ({ ...prev, levelCompleted: true }));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        resetLevel(true);
      }
    }
  };

  return (
    <AppContainer>
      <GameTitle variant="h1">
        🤖 Робот-Путешественник
      </GameTitle>
      
      <GameDescription variant="subtitle1">
        Помоги роботу добраться до зелёной клетки! Составь правильную последовательность команд.
      </GameDescription>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: '20px', backgroundColor: '#e3f2fd', position: 'relative' }}>
            {LEVEL_1.grid.map((row, y) => (
              <Box key={y} sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                {row.map((cell, x) => (
                  <GameCell
                    key={`${x}-${y}`}
                    isTarget={cell === 2}
                    isWall={cell === 1}
                    isRobot={gameState.currentPosition.x === x && gameState.currentPosition.y === y}
                    direction={gameState.currentPosition.x === x && gameState.currentPosition.y === y ? gameState.currentDirection : undefined}
                    isExplosion={gameState.explosion?.x === x && gameState.explosion?.y === y}
                    sx={{ m: 0.25 }}
                  />
                ))}
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <ButtonContainer>
            <CommandButton
              variant="contained"
              onClick={() => addCommand('forward')}
              disabled={gameState.isExecuting}
              title="Вперёд"
              sx={{ 
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#45a049' }
              }}
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z'/%3E%3C/svg%3E" 
                   alt="Вперёд" />
            </CommandButton>
            
            <CommandButton
              variant="contained"
              onClick={() => addCommand('left')}
              disabled={gameState.isExecuting}
              title="Налево"
              sx={{ 
                backgroundColor: '#ff9800',
                '&:hover': { backgroundColor: '#f57c00' }
              }}
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'/%3E%3C/svg%3E" 
                   alt="Налево" />
            </CommandButton>
            
            <CommandButton
              variant="contained"
              onClick={() => addCommand('right')}
              disabled={gameState.isExecuting}
              title="Направо"
              sx={{ 
                backgroundColor: '#ff9800',
                '&:hover': { backgroundColor: '#f57c00' }
              }}
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z'/%3E%3C/svg%3E" 
                   alt="Направо" />
            </CommandButton>
            
            <CommandButton
              variant="contained"
              onClick={executeCommands}
              disabled={gameState.isExecuting || gameState.commands.length === 0}
              title="Запустить"
              sx={{ 
                backgroundColor: '#2196f3',
                '&:hover': { backgroundColor: '#1976d2' }
              }}
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E" 
                   alt="Запустить" />
            </CommandButton>
            
            <CommandButton
              variant="outlined"
              onClick={() => resetLevel(false)}
              disabled={gameState.isExecuting}
              title="Сбросить"
              sx={{ 
                color: '#f44336',
                borderColor: '#f44336',
                '&:hover': { 
                  backgroundColor: 'rgba(244, 67, 54, 0.04)',
                  borderColor: '#d32f2f'
                }
              }}
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f44336'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E" 
                   alt="Сбросить" />
            </CommandButton>
          </ButtonContainer>

          <CommandList sx={{ mt: 2, maxHeight: '300px', overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#2196f3' }}>
              📝 Программа:
            </Typography>
            {gameState.commands.map((command, index) => (
              <CommandItem key={index}>
                {index + 1}.{' '}
                {command === 'forward' ? '⬆️' : 
                 command === 'left' ? '⬅️' : 
                 '➡️'}
              </CommandItem>
            ))}
          </CommandList>
        </Grid>
      </Grid>

      {gameState.levelCompleted && (
        <Box sx={{ 
          mt: 3, 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#81c784',
          borderRadius: '15px',
          animation: 'bounce 0.5s infinite'
        }}>
          <Typography variant="h4" sx={{ color: '#fff' }}>
            🎉 Поздравляем! Уровень пройден! 🎉
          </Typography>
        </Box>
      )}
    </AppContainer>
  );
};

export default App;
