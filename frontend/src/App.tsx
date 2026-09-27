import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import VariationsPage from './pages/VariationsPage';
import IngredientsPage from './pages/IngredientsPage';
import ShoppingPage from './pages/ShoppingPage';
import RecipePage from './pages/RecipePage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="variations/:dishId" element={<VariationsPage />} />
          <Route path="ingredients/:variationId" element={<IngredientsPage />} />
          <Route path="shopping/:variationId" element={<ShoppingPage />} />
          <Route path="recipe/:variationId" element={<RecipePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
