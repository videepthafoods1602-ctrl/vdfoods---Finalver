import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './pages/Home';
import HomeAlt from './pages/HomeAlt';
import SlurrpHome from './pages/SlurrpHome';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import FavoritesPage from './pages/FavoritesPage';
import DynamicPage from './pages/DynamicPage';
import MarketExplorer from './pages/MarketExplorer';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import Account from './pages/Account';
import PoliciesPage from './pages/PoliciesPage';
import StoriesPage from './pages/StoriesPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import CartDrawer from './components/CartDrawer';
import MobileBottomBar from './components/MobileBottomBar';

// 🔑 Replace with your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

import SmoothScroll from './components/SmoothScroll';
import AuthModal from './components/AuthModal';
import WhatsAppButton from './components/WhatsAppButton';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <SmoothScroll>
              <Router>
                <AuthModal />
                <CartDrawer />
                <div className="pb-24 lg:pb-0"> {/* Add padding for bottom nav on mobile */}
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/home-alt" element={<HomeAlt />} />
                      <Route path="/slurrp-home" element={<SlurrpHome />} />
                      <Route path="/market-explorer" element={<MarketExplorer />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/page/:slug" element={<DynamicPage />} />
                      <Route path="/policies" element={<PoliciesPage />} />
                      <Route path="/stories" element={<StoriesPage />} />
                      <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Auth mode="login" />} />
                    <Route path="/signup" element={<Auth mode="signup" />} />
                    <Route path="/settings" element={<Account />} />
                  </Routes>
                </div>
                <MobileBottomBar />
                <WhatsAppButton />
              </Router>
            </SmoothScroll>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
