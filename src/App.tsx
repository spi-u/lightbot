import { useState, useEffect } from "react";
import useLocalStorageState from "use-local-storage-state";
import styled from "styled-components";
import {
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
  instructions: string;
  portions: number;
  basePortions: number;
}

const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
`;

const RecipeCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 1.5rem;
  margin: 1rem 0;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  text-align: left;
`;

function App() {
  const [recipes, setRecipes] = useLocalStorageState<Recipe[]>("recipes", {
    defaultValue: [],
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (recipes.length === 0) {
      const boilerplateRecipes = [
        {
          id: 1,
          name: "Классическая паста Карбонара",
          ingredients: [
            { name: "Спагетти", amount: 400, unit: "г" },
            { name: "Бекон", amount: 200, unit: "г" },
            { name: "Яйца", amount: 4, unit: "шт" },
            { name: "Пармезан", amount: 100, unit: "г" },
          ],
          instructions: "1. Отварить пасту\n2. Обжарить бекон\n3. Смешать яйца с сыром\n4. Соединить все ингредиенты",
          portions: 4,
          basePortions: 4,
        },
        {
          id: 2,
          name: "Борщ",
          ingredients: [
            { name: "Говядина", amount: 500, unit: "г" },
            { name: "Свекла", amount: 300, unit: "г" },
            { name: "Капуста", amount: 400, unit: "г" },
            { name: "Картофель", amount: 400, unit: "г" },
          ],
          instructions: "1. Сварить бульон\n2. Добавить овощи\n3. Тушить до готовности",
          portions: 6,
          basePortions: 6,
        },
        // ... добавьте еще 3 рецепта по аналогии
      ];
      setRecipes(boilerplateRecipes);
    }
  }, [recipes, setRecipes]);

  const handlePortionChange = (id: number, newPortions: number) => {
    setRecipes(recipes.map(recipe => {
      if (recipe.id === id) {
        const ratio = newPortions / recipe.basePortions;
        const updatedIngredients = recipe.ingredients.map(ing => ({
          ...ing,
          amount: Number((ing.amount * ratio).toFixed(1))
        }));
        return { ...recipe, portions: newPortions, ingredients: updatedIngredients };
      }
      return recipe;
    }));
  };

  return (
    <AppContainer>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
        Книга рецептов
      </Typography>
      
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id}>
          <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50' }}>
            {recipe.name}
          </Typography>
          
          <TextField
            type="number"
            label="Порции"
            value={recipe.portions}
            onChange={(e) => handlePortionChange(recipe.id, Number(e.target.value))}
            sx={{ width: 100, mb: 2 }}
          />
          
          <Typography variant="h6" gutterBottom>Ингредиенты:</Typography>
          <IngredientList>
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx}>
                {ing.name}: {ing.amount} {ing.unit}
              </li>
            ))}
          </IngredientList>
          
          <Typography variant="h6" gutterBottom>Инструкция:</Typography>
          <Typography sx={{ whiteSpace: 'pre-line', textAlign: 'left' }}>
            {recipe.instructions}
          </Typography>
        </RecipeCard>
      ))}
    </AppContainer>
  );
}

export default App;
