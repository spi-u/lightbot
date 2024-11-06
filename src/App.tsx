import {
  Typography,
  Button,
  Box,
  Stack,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useState } from "react";
import styled from "styled-components";
import { LEVELS } from './levels';

// Типы
type Direction = 'north' | 'east' | 'south' | 'west';
type Command = 'forward' | 'left' | 'right';
type CommandType = Command | 'loop';

interface Position {
  x: number;
  y: number;
}

interface LoopCommand {
  type: 'loop';
  iterations: number;
  commands: SimpleCommand[];
  id?: string;
}

interface SimpleCommand {
  type: Command;
  id: string;
  source: 'program';
}

type CommandSource = SimpleCommand | LoopCommand;

interface GameState {
  currentPosition: Position;
  currentDirection: Direction;
  commands: CommandSource[];
  isExecuting: boolean;
  levelCompleted: boolean;
  explosion?: Position;
  currentLevel: number;
  selectedCommands: Set<number>;
}

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

const CommandItem = styled(Typography)<{ isSelected?: boolean; isSelectionMode?: boolean }>`
  && {
    font-size: 1.2rem;
    padding: 8px 12px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;
    background-color: ${props => props.isSelected ? '#e3f2fd' : 'white'};
    border: ${props => props.isSelected ? '2px solid #2196f3' : 'none'};
    
    ${props => props.isSelectionMode && `
      animation: pulse 2s infinite;
      
      @keyframes pulse {
        0% { transform: translateX(0); }
        5% { transform: translateX(5px); }
        10% { transform: translateX(0); }
      }
    `}

    &:hover {
      background-color: ${props => 
        props.isSelectionMode ? '#e3f2fd' : '#fee8e7'};
      color: ${props => 
        props.isSelectionMode ? '#2196f3' : '#f44336'};
    }
  }
`;

// Добавляем новый компонент для салюта
const Firework = styled(Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;

  .firework {
    font-size: 6rem;
    animation: firework 1s infinite;
  }

  @keyframes firework {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 0.8; }
  }

  .message {
    position: absolute;
    color: white;
    font-size: 2rem;
    text-align: center;
    animation: fadeIn 0.5s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CreateLoopDialog = styled(Dialog)`
  .MuiDialog-paper {
    padding: 20px;
  }
`;

const CreateLoopButton = styled(Button)`
  && {
    margin-left: 8px;
  }
`;

const IterationCounter = styled(Box)`
  position: sticky;
  top: 0;
  background-color: #fff;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const App = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPosition: LEVELS[0].startPosition,
    currentDirection: LEVELS[0].startDirection,
    commands: [],
    isExecuting: false,
    levelCompleted: false,
    explosion: undefined,
    currentLevel: 0,
    selectedCommands: new Set()
  });

  const [isLoopDialogOpen, setIsLoopDialogOpen] = useState(false);
  const [loopIterations, setLoopIterations] = useState(2);

  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const addCommand = (command: Command) => {
    if (!gameState.isExecuting) {
      const newCommand: SimpleCommand = {
        id: `${command}-${Date.now()}`,
        type: command,
        source: 'program'
      };
      
      setGameState(prev => ({
        ...prev,
        commands: [...prev.commands, newCommand]
      }));
    }
  };

  const resetLevel = (keepCommands: boolean = false) => {
    const currentLevel = LEVELS[gameState.currentLevel];
    setGameState(prev => ({
      ...prev,
      currentPosition: currentLevel.startPosition,
      currentDirection: currentLevel.startDirection,
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
           pos.x < LEVELS[gameState.currentLevel].grid[0].length && 
           pos.y >= 0 && 
           pos.y < LEVELS[gameState.currentLevel].grid.length && 
           LEVELS[gameState.currentLevel].grid[pos.y][pos.x] !== 1;
  };

  const executeCommands = async () => {
    setGameState(prev => ({ 
      ...prev, 
      isExecuting: true,
      explosion: undefined 
    }));
    
    let hasExploded = false;
    let levelComplete = false;

    const executeCommandsList = async (commands: CommandSource[]) => {
      for (const command of commands) {
        if (hasExploded || levelComplete) break;
        
        if (command.type === 'loop') {
          for (let i = 0; i < command.iterations; i++) {
            await executeCommandsList(command.commands);
            if (hasExploded || levelComplete) {
              // Если произошло столкновение внутри цикла, прерываем выполнение
              break;
            }
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setGameState(prev => {
            const newState = { ...prev };
            
            switch (command.type) {
              case 'forward':
                const newPosition = moveForward(prev.currentPosition, prev.currentDirection);
                if (isValidMove(newPosition)) {
                  newState.currentPosition = newPosition;
                  if (LEVELS[prev.currentLevel].grid[newPosition.y][newPosition.x] === 2) {
                    levelComplete = true;
                    newState.levelCompleted = true;
                    newState.isExecuting = false;
                  }
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

          // Если произошло столкновение, ждем анимацию взрыва и сбрасываем позицию
          if (hasExploded) {
            await new Promise(resolve => setTimeout(resolve, 800));
            resetLevel(true);
            break;
          }
        }
      }
    };

    await executeCommandsList(gameState.commands);
    
    if (!hasExploded && !levelComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      resetLevel(true);
    }

    if (levelComplete) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const nextLevelIndex = gameState.currentLevel + 1;
      if (nextLevelIndex < LEVELS.length) {
        setGameState(prev => ({
          currentPosition: LEVELS[nextLevelIndex].startPosition,
          currentDirection: LEVELS[nextLevelIndex].startDirection,
          commands: [],
          isExecuting: false,
          levelCompleted: false,
          explosion: undefined,
          currentLevel: nextLevelIndex,
          selectedCommands: new Set()
        }));
      }
    }
  };

  const removeCommand = (index: number) => {
    if (!gameState.isExecuting) {
      setGameState(prev => ({
        ...prev,
        commands: prev.commands.filter((_, i) => i !== index)
      }));
    }
  };

  const toggleCommandSelection = (index: number) => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => {
      const newSelection = new Set(prev.selectedCommands);
      
      // Если строка уже выбрана, просто удаляем её
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        // Если это первая выбранная строка
        if (newSelection.size === 0) {
          newSelection.add(index);
        } else {
          // Находим минимальный и максимальный индексы выбранных строк
          const selectedIndices = Array.from(newSelection);
          const minIndex = Math.min(...selectedIndices);
          const maxIndex = Math.max(...selectedIndices);
          
          // Проверяем, является ли новый индекс смежным с текущим выбором
          if (index === minIndex - 1 || index === maxIndex + 1) {
            newSelection.add(index);
          } else {
            // Если выбрана несмежная строка, начинаем новый выбор
            newSelection.clear();
            newSelection.add(index);
          }
        }
      }
      
      return { ...prev, selectedCommands: newSelection };
    });
  };

  const createLoop = () => {
    const selectedIndices = Array.from(gameState.selectedCommands).sort((a, b) => a - b);
    if (selectedIndices.length === 0) return;

    const selectedCommands = selectedIndices.map(index => gameState.commands[index]);
    const newLoop: LoopCommand = {
      type: 'loop',
      iterations: loopIterations,
      commands: selectedCommands as SimpleCommand[]
    };

    const firstIndex = selectedIndices[0];
    setGameState(prev => {
      const newCommands = [...prev.commands];
      newCommands.splice(firstIndex, selectedIndices.length, newLoop);
      return {
        ...prev,
        commands: newCommands,
        selectedCommands: new Set()
      };
    });

    setIsLoopDialogOpen(false);
    setIsSelectionMode(false);
  };

  return (
    <AppContainer>
      <GameTitle variant="h1">
        🤖 Робот-Путешественник - Уровень {gameState.currentLevel + 1}
      </GameTitle>
      
      <GameDescription variant="subtitle1">
        {LEVELS[gameState.currentLevel].description}
      </GameDescription>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: '20px', backgroundColor: '#e3f2fd', position: 'relative' }}>
            {LEVELS[gameState.currentLevel].grid.map((row, y) => (
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
              onClick={() => {
                if (isSelectionMode) {
                  setIsLoopDialogOpen(true);
                } else {
                  setIsSelectionMode(true);
                  setGameState(prev => ({ ...prev, selectedCommands: new Set() }));
                }
              }}
              disabled={gameState.isExecuting || (!isSelectionMode && gameState.commands.length === 0)}
              title={isSelectionMode ? "Создать цикл" : "Выбрать для цикла"}
              sx={{ 
                backgroundColor: isSelectionMode ? '#e91e63' : '#2196f3',
                '&:hover': { 
                  backgroundColor: isSelectionMode ? '#c2185b' : '#1976d2' 
                }
              }}
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z'/%3E%3C/svg%3E"
                   alt="Цикл" />
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
            <Typography variant="h6" sx={{ color: '#2196f3', mb: 1 }}>
              📝 Программа:
            </Typography>
            
            {isSelectionMode && (
              <IterationCounter>
                <TextField
                  type="number"
                  size="small"
                  value={loopIterations}
                  onChange={(e) => setLoopIterations(Math.max(1, parseInt(e.target.value) || 1))}
                  sx={{ width: '80px' }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (gameState.selectedCommands.size > 0) {
                      createLoop();
                    }
                  }}
                  disabled={gameState.selectedCommands.size === 0}
                  sx={{ minWidth: '40px', width: '40px', p: 0 }}
                >
                  ✓
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setGameState(prev => ({ ...prev, selectedCommands: new Set() }));
                  }}
                  sx={{ minWidth: '40px', width: '40px', p: 0 }}
                >
                  ✕
                </Button>
              </IterationCounter>
            )}
            
            {gameState.commands.map((command, index) => (
              <div key={`command-${index}`}>
                {command.type === 'loop' ? (
                  <Box 
                    sx={{ 
                      border: '1px solid #2196f3',
                      borderRadius: '4px',
                      p: 1,
                      mb: 1,
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#fee8e7',
                        borderColor: '#f44336',
                        '& .loop-header': {
                          color: '#f44336'
                        }
                      }
                    }}
                    onClick={() => !gameState.isExecuting && !isSelectionMode && removeCommand(index)}
                  >
                    <Typography 
                      className="loop-header"
                      sx={{ 
                        color: '#2196f3', 
                        mb: 1,
                        transition: 'color 0.2s'
                      }}
                    >
                      🔄 Повторить {command.iterations} раз:
                    </Typography>
                    {command.commands.map((subCommand, subIndex) => (
                      <CommandItem 
                        key={`subcommand-${subIndex}`}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ 
                          pointerEvents: 'none'
                        }}
                      >
                        {subCommand.type === 'forward' ? '⬆️' : 
                         subCommand.type === 'left' ? '⬅️' : 
                         '➡️'}
                      </CommandItem>
                    ))}
                  </Box>
                ) : (
                  <CommandItem
                    isSelected={isSelectionMode && gameState.selectedCommands.has(index)}
                    isSelectionMode={isSelectionMode}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleCommandSelection(index);
                      } else {
                        removeCommand(index);
                      }
                    }}
                  >
                    {index + 1}.{' '}
                    {command.type === 'forward' ? '⬆️' : 
                     command.type === 'left' ? '⬅️' : 
                     '➡️'}
                  </CommandItem>
                )}
              </div>
            ))}

            <CreateLoopDialog
              open={isLoopDialogOpen}
              onClose={() => {
                setIsLoopDialogOpen(false);
                setIsSelectionMode(false);
                setGameState(prev => ({ ...prev, selectedCommands: new Set() }));
              }}
            >
              <DialogTitle>Создание цикла</DialogTitle>
              <DialogContent>
                <TextField
                  type="number"
                  label="Количество повторений"
                  value={loopIterations}
                  onChange={(e) => setLoopIterations(Math.max(1, parseInt(e.target.value) || 1))}
                  fullWidth
                  sx={{ mt: 2 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsLoopDialogOpen(false)}>Отмена</Button>
                <Button onClick={createLoop} variant="contained" color="primary">
                  Создать
                </Button>
              </DialogActions>
            </CreateLoopDialog>
          </CommandList>
        </Grid>
      </Grid>

      {gameState.levelCompleted && (
        <Firework>
          <Box className="firework">
            🎆 🎉 🎆
          </Box>
          <Typography className="message" variant="h4">
            {gameState.currentLevel === LEVELS.length - 1 
              ? "🏆 Поздравляем! Вы прошли игру! 🏆"
              : `Уровень ${gameState.currentLevel + 1} пройден!`
            }
          </Typography>
        </Firework>
      )}
    </AppContainer>
  );
};

export default App;
