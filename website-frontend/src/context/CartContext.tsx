import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { detectLocation, getCurrencySymbol, formatPrice as utilsFormatPrice, getExchangeRate } from '../utils/location_utils';
import { API_URL } from '../config';

interface CartItem {
    _id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    selectedWeight?: string;
    attributes?: Record<string, any>;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    currency: string;
    currencySymbol: string;
    formatPrice: (amount: number, targetCurrency?: 'USD' | 'INR') => string;
    locationData: any;
    setLocationData: (data: any) => void;
    refreshLocation: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [detectedCurrency, setDetectedCurrency] = useState<string>(() => {
        return localStorage.getItem('detected_currency') || 'USD';
    });
    const [locationData, setLocationData] = useState<any>(() => {
        const saved = localStorage.getItem('user_location');
        return saved ? JSON.parse(saved) : null;
    });
    const [exchangeRate, setExchangeRate] = useState<number>(() => {
        return Number(localStorage.getItem('usd_inr_rate')) || 80.0;
    });

    const { user } = useAuth();

    useEffect(() => {
        const performDetection = async (force: boolean = false) => {
            // Check if already detected in this session
            const sessionDetected = sessionStorage.getItem('location_detected');
            if (!force && sessionDetected && locationData) {
                console.log('Location already detected in this session.');
            } else if (!localStorage.getItem('user_location_override') || force) {
                const locData = await detectLocation();
                setLocationData(locData);
                setDetectedCurrency(locData.currency);
                localStorage.setItem('user_location', JSON.stringify(locData));
                localStorage.setItem('detected_currency', locData.currency);
                sessionStorage.setItem('location_detected', 'true');
                console.log('Location updated via IP/Geo:', locData.country_name, locData.currency);
            }

            // 2. Fetch Latest Exchange Rate (Refresh once a day or on mount)
            const lastRateUpdate = localStorage.getItem('usd_inr_rate_updated');
            const now = new Date().getTime();
            const oneDay = 24 * 60 * 60 * 1000;

            if (!lastRateUpdate || (now - new Date(lastRateUpdate).getTime() > oneDay)) {
                const rate = await getExchangeRate();
                setExchangeRate(rate);
                localStorage.setItem('usd_inr_rate', rate.toString());
                localStorage.setItem('usd_inr_rate_updated', new Date().toISOString());
            }
        };
        
        performDetection();
    }, [user]);

    const refreshLocation = async () => {
        const locData = await detectLocation();
        setLocationData(locData);
        setDetectedCurrency(locData.currency);
        localStorage.setItem('user_location', JSON.stringify(locData));
        localStorage.setItem('detected_currency', locData.currency);
        sessionStorage.setItem('location_detected', 'true');
        console.log('Location force-refreshed via IP/Geo:', locData.country_name, locData.currency);
    };

    const syncCart = async (items: CartItem[]) => {
        if (!user) return;
        try {
            await axios.post(`${API_URL}/accounts/me/cart/`, { items });
            console.log('Cart synced with server');
        } catch (err) {
            console.warn('Cart sync failed:', err);
        }
    };

    // Cart Sync & Seeding Logic
    useEffect(() => {
        if (user) {
            // Load cart from profile on login if local cart is empty
            if (cartCount === 0 && user.profile?.cart_data) {
                setCartItems(user.profile.cart_data);
            }
        } else {
            // Strictly no session without signup: Clear cart on logout
            setCartItems([]);
            localStorage.removeItem('village_kitchen_cart');
            localStorage.removeItem('village_kitchen_cart_updated');
        }
    }, [user]);

    useEffect(() => {
        if (user && cartItems.length > 0) {
            const debounce = setTimeout(() => {
                syncCart(cartItems);
            }, 2000);
            return () => clearTimeout(debounce);
        }
    }, [cartItems, user]);

    const currency = useMemo(() => {
        // Always prioritize the live geographically detected currency over the default backend value
        return (detectedCurrency || 'USD') as 'USD' | 'INR';
    }, [detectedCurrency]);

    const currencySymbol = useMemo(() => {
        return getCurrencySymbol(currency);
    }, [currency]);

    const formatPrice = (amount: number, targetCurrency?: 'USD' | 'INR') => {
        return utilsFormatPrice(amount, targetCurrency || currency, exchangeRate);
    };

    useEffect(() => {
        if (user) {
            localStorage.setItem('village_kitchen_cart', JSON.stringify(cartItems));
            localStorage.setItem('village_kitchen_cart_updated', new Date().toISOString());
        }
    }, [cartItems, user]);

    const addToCart = (item: CartItem) => {
        if (!user) {
            alert('Please sign in to add items to your cart.');
            return;
        }

        // Track cart addition analytics
        fetch(`${API_URL}/track-event/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: item._id, event_type: 'cart_add' })
        }).catch(err => console.error('Track cart_add error:', err));

        setCartItems(prev => {
            const existing = prev.find(i => i._id === item._id && i.selectedWeight === item.selectedWeight);
            if (existing) {
                return prev.map(i => (i._id === item._id && i.selectedWeight === item.selectedWeight)
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                );
            }
            return [...prev, item];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCartItems(prev => prev.filter(item => item._id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(id);
            return;
        }
        setCartItems(prev => prev.map(item =>
            item._id === id ? { ...item, quantity } : item
        ));
    };

    const clearCart = async () => {
        setCartItems([]);
        if (user) {
            await syncCart([]);
        }
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            isCartOpen,
            setIsCartOpen,
            currency,
            currencySymbol,
            formatPrice,
            locationData,
            setLocationData,
            refreshLocation
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
