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
  error?: string;
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
    font-size: 1rem;
    padding: 8px 16px;
    border-radius: 8px;
    text-transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
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
    animation: explosion 0.5s ease-in-out;
    @keyframes explosion {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
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

// Добавляем новый компонент для модального окна с ошибкой
const ErrorOverlay = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  z-index: 1000;
`;

const ErrorMessage = styled(Box)`
  background-color: #ffebee;
  padding: 20px 40px;
  border-radius: 12px;
  border: 2px solid #ff5252;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const App = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPosition: LEVEL_1.startPosition,
    currentDirection: LEVEL_1.startDirection,
    commands: [],
    isExecuting: false,
    levelCompleted: false,
    error: undefined,
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

  const resetLevel = () => {
    setGameState({
      currentPosition: LEVEL_1.startPosition,
      currentDirection: LEVEL_1.startDirection,
      commands: [],
      isExecuting: false,
      levelCompleted: false,
      error: undefined,
      explosion: undefined
    });
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
      error: undefined,
      explosion: undefined 
    }));
    
    for (const command of gameState.commands) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGameState(prev => {
        const newState = { ...prev };
        
        switch (command) {
          case 'forward':
            const newPosition = moveForward(prev.currentPosition, prev.currentDirection);
            if (isValidMove(newPosition)) {
              newState.currentPosition = newPosition;
            } else {
              newState.explosion = prev.currentPosition;
              newState.error = isOutOfBounds(newPosition) 
                ? "Робот вышел за пределы поля!" 
                : "Робот врезался в препятствие!";
              newState.isExecuting = false;
              return newState;
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

      if (gameState.error) break;
    }
    
    if (!gameState.error) {
      if (LEVEL_1.grid[gameState.currentPosition.y][gameState.currentPosition.x] === 2) {
        setGameState(prev => ({ ...prev, levelCompleted: true }));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setGameState(prev => ({ 
          ...prev, 
          currentPosition: LEVEL_1.startPosition,
          currentDirection: LEVEL_1.startDirection,
          isExecuting: false,
          error: "Робот не достиг цели. Попробуй другую последовательность команд!"
        }));
      }
    }
  };

  const isOutOfBounds = (pos: Position): boolean => {
    return pos.x < 0 || 
           pos.x >= LEVEL_1.grid[0].length || 
           pos.y < 0 || 
           pos.y >= LEVEL_1.grid.length;
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
            
            {/* Заменяем старое сообщение об ошибке на новое модальное окно */}
            {gameState.error && (
              <ErrorOverlay>
                <ErrorMessage>
                  <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 'bold' }}>
                    ⚠️ {gameState.error}
                  </Typography>
                </ErrorMessage>
              </ErrorOverlay>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <CommandButton
              variant="contained"
              onClick={() => addCommand('forward')}
              disabled={gameState.isExecuting}
              sx={{ backgroundColor: '#4caf50' }}
            >
              Вперёд
            </CommandButton>
            <CommandButton
              variant="contained"
              onClick={() => addCommand('left')}
              disabled={gameState.isExecuting}
              sx={{ backgroundColor: '#ff9800' }}
            >
              Налево
            </CommandButton>
            <CommandButton
              variant="contained"
              onClick={() => addCommand('right')}
              disabled={gameState.isExecuting}
              sx={{ backgroundColor: '#ff9800' }}
            >
              Направо
            </CommandButton>
            <CommandButton
              variant="contained"
              color="secondary"
              onClick={executeCommands}
              disabled={gameState.isExecuting || gameState.commands.length === 0}
              sx={{ backgroundColor: '#2196f3' }}
            >
              Запустить
            </CommandButton>
            <CommandButton
              variant="outlined"
              onClick={resetLevel}
              disabled={gameState.isExecuting}
              sx={{ color: '#f44336', borderColor: '#f44336' }}
            >
              Сбросить
            </CommandButton>
          </Stack>

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
