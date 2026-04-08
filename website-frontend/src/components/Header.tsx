import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogIn, Search, X, Leaf, MapPin, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Magnetic from './Magnetic';
import HeroTicker from './HeroTicker';
import { API_URL } from '../config';
import { getCategoryImage, formatName } from '../utils/category_utils';
import { useMemo } from 'react';

const DEFAULT_NAV_ITEMS = [
    { label: 'HOME', link: '/' },
    { label: 'SHOP', link: '/categories' },
    { label: 'OUR STORIES', link: '/stories' },
    { label: 'POLICIES', link: '/policies' },
];

const Header = () => {
    const navItems = DEFAULT_NAV_ITEMS;
    const [scrolled, setScrolled] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);

    const { cartCount, setIsCartOpen, locationData, refreshLocation, formatPrice, isDetectingLocation } = useCart();
    const { isLoggedIn, user, openAuthModal } = useAuth();
    const { theme } = useTheme();

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        fetch(`${API_URL}/categories/?_cb=${new Date().getTime()}`).then(res => res.json()).then(setAllCategories);
        fetch(`${API_URL}/products/?_cb=${new Date().getTime()}`).then(res => res.json()).then(setAllProducts);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [showLocationText, setShowLocationText] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLocationText(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const filteredResults = useMemo(() => {
        if (!searchTerm.trim()) return null;
        const term = searchTerm.toLowerCase();
        const matchedCategories = allCategories.filter(c =>
            (c.name?.toLowerCase() || '').includes(term) && (c.is_active !== false)
        );
        const matchedProducts = allProducts.filter(p =>
            (p.name?.toLowerCase() || '').includes(term) && (p.is_active !== false)
        );
        return { matchedCategories, matchedProducts };
    }, [searchTerm, allCategories, allProducts]);

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const isMinimalistPage = ['/settings', '/checkout', '/login', '/signup'].includes(location.pathname);
    const isHomePage = location.pathname === '/';
    const isTransparent = !scrolled;
    const isDarkHeader = isTransparent && isHomePage;

    return (
        <header className="fixed top-0 w-full z-[100] transition-all duration-500 bg-transparent">
            {!isMinimalistPage && (
                <HeroTicker
                    items={theme?.branding?.ticker_text?.length ? theme.branding.ticker_text : ["Say No to Whites", "Authentic Flavors", "Traditional Vedic Methods", "Pure & Organic"]}
                    speed={theme?.branding?.ticker_style?.speed || 25}
                    height="py-2"
                />
            )}

            <nav className={`w-full transition-all duration-500 ${scrolled ? 'py-2 bg-white/95 backdrop-blur-2xl border-b border-[var(--color-border)] shadow-xl' : 'py-5 bg-transparent'}`}>
                <div className="max-w-[1800px] mx-auto px-4 md:px-8 flex items-center justify-between">
                    
                    {/* LEFT: Logo Branding */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex flex-col items-start gap-0 shrink-0 group">
                            <span className={`text-base sm:text-xl md:text-2xl font-serif font-black tracking-widest leading-none mb-1 transition-colors ${isDarkHeader ? 'text-white' : 'text-[#5D2E17]'}`}>
                                VIDYA-PRADEEP
                            </span>
                            <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.05em] font-sans transition-colors ${isDarkHeader ? 'text-white/90' : 'text-black/80'}`}>
                                MILLETS ARE NOT BORING BOSS 😎 😋
                            </span>
                        </Link>
                    </div>

                    {/* CENTER: Navigation Links */}
                    <div className="hidden lg:flex items-center justify-center gap-10">
                        {navItems.map((item, idx) => {
                            const active = isActive(item.link);
                            return (
                                <Link
                                    key={idx}
                                    to={item.link}
                                    className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300
                                        ${active 
                                            ? isDarkHeader ? 'bg-white text-[#5D2E17] shadow-lg' : 'bg-[#5D2E17] text-white shadow-lg' 
                                            : isDarkHeader ? 'text-white/80 hover:text-white' : 'text-black/60 hover:text-[#5D2E17]'}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* RIGHT: Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-4 ml-2">
                        {/* Location Button */}
                        <Magnetic>
                            <button
                                onClick={refreshLocation}
                                className={`flex items-center gap-2 px-5 h-10 rounded-full transition-all text-[10px] font-black uppercase tracking-widest group
                                    ${isDarkHeader ? 'bg-white/10 hover:bg-white text-white hover:text-[#5D2E17]' : 'bg-black/5 hover:bg-[#5D2E17] hover:text-white text-black'}`}
                            >
                                <MapPin size={16} className={`transition-colors ${isDarkHeader ? 'text-white group-hover:text-[#5D2E17]' : 'text-[#5D2E17] group-hover:text-white'}`} />
                                <span className={`transition-all duration-500 overflow-hidden ${showLocationText ? 'max-w-[100px] opacity-100 ml-1' : 'max-w-0 opacity-0 md:max-w-[100px] md:opacity-100 md:ml-1'}`}>
                                    {isDetectingLocation ? '...' : (locationData?.country_name || 'USA')}
                                </span>
                            </button>
                        </Magnetic>

                        {/* Search Bar */}
                        <motion.div
                            initial={false}
                            animate={{ width: isSearchExpanded ? '200px' : '40px' }}
                            className={`relative flex items-center h-10 rounded-full overflow-hidden transition-all border border-transparent focus-within:border-[#5D2E17]/30
                                ${isDarkHeader ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}
                        >
                            {isSearchExpanded && (
                                <div className="flex-1 flex items-center h-full pl-4 pr-1">
                                    <input autoFocus type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="SEARCH..." 
                                        className={`bg-transparent border-none outline-none w-full text-[10px] font-black uppercase leading-tight placeholder:opacity-50
                                            ${isDarkHeader ? 'text-white placeholder:text-white' : 'text-black placeholder:text-black'}`} 
                                    />
                                </div>
                            )}
                            <button onClick={() => { setIsSearchExpanded(!isSearchExpanded); if (isSearchExpanded) setSearchTerm(''); }} 
                                className={`w-10 h-10 flex items-center justify-center shrink-0 transition-colors ${isDarkHeader ? 'hover:bg-white/20' : 'hover:text-[#5D2E17]'}`}
                            >
                                {isSearchExpanded ? <X size={16} /> : <Search size={18} />}
                            </button>
                        </motion.div>

                        <div className="hidden sm:flex">
                        <Magnetic>
                            <Link
                                to="/favorites"
                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all group
                                    ${isDarkHeader ? 'bg-white/10 hover:bg-white text-white hover:text-red-500' : 'bg-black/5 hover:bg-red-50 text-red-500'}`}
                            >
                                <Heart size={18} className="transition-transform group-hover:scale-110" />
                            </Link>
                        </Magnetic>
                        </div>

                        {/* Cart Button */}
                        <Magnetic>
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all group
                                    ${isDarkHeader ? 'bg-white/10 hover:bg-white text-white hover:text-[#5D2E17]' : 'bg-black/5 hover:bg-[#5D2E17] hover:text-white text-black'}`}
                            >
                                <ShoppingBag size={18} />
                                {cartCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 w-5 h-5 text-[9px] font-black rounded-full flex items-center justify-center border-2
                                        ${isDarkHeader ? 'bg-white text-[#5D2E17] border-[#5D2E17]' : 'bg-[#5D2E17] text-white border-white'}`}>
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </Magnetic>

                        {/* Auth Button */}
                        <div className="hidden sm:flex">
                        <Magnetic>
                            {isLoggedIn ? (
                                <Link
                                    to="/settings"
                                    className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden shadow-lg transition-all
                                        ${isDarkHeader ? 'bg-white text-[#5D2E17] hover:bg-white/90' : 'bg-[#5D2E17] text-white hover:bg-[#7a3e1e]'}`}
                                >
                                    {user?.profile?.avatar_url ? (
                                        <img src={user.profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <span className="text-sm font-black">{user?.email?.charAt(0).toUpperCase()}</span>
                                    )}
                                </Link>
                            ) : (
                                <button
                                    onClick={openAuthModal}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-md
                                        ${isDarkHeader ? 'bg-white text-[#5D2E17] hover:bg-white/90' : 'bg-[#5D2E17] text-white hover:bg-[#7a3e1e]'}`}
                                >
                                    <LogIn size={18} />
                                </button>
                            )}
                        </Magnetic>
                        </div>
                    </div>
                </div>

                {/* Search Results Overlay */}
                <AnimatePresence>
                    {searchTerm && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-full max-w-2xl px-6 mt-4">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-white border border-black/10 rounded-[2rem] shadow-2xl overflow-hidden z-[999]">
                                <div className="max-h-[500px] overflow-y-auto p-4 flex flex-col gap-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 px-4 py-2">Suggested Harvests</p>
                                    {filteredResults?.matchedCategories.map((cat) => (
                                        <button key={cat.id || cat._id} onClick={() => { navigate(`/categories?parent=${cat.id || cat._id}`); setSearchTerm(''); setIsSearchExpanded(false); }} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-black/5 transition-all text-left">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                                                {getCategoryImage(cat.name, cat.media_url) ? (
                                                    <img src={getCategoryImage(cat.name, cat.media_url)} className="w-full h-full object-cover" alt={formatName(cat.name)} />
                                                ) : (
                                                    <Leaf className="text-[#84a98c]" size={24} />
                                                )}
                                            </div>
                                            <p className="font-serif font-black text-sm uppercase tracking-tight">{formatName(cat.name)}</p>
                                        </button>
                                    ))}

                                    {filteredResults?.matchedProducts.length ? (
                                        <>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 px-4 py-2 mt-4">Products</p>
                                            {filteredResults?.matchedProducts.slice(0, 8).map((prod: any) => (
                                                <button
                                                    key={prod.id || prod._id}
                                                    onClick={() => {
                                                        const parentId = prod.subcategory_id || (prod.category_ids && prod.category_ids[0]);
                                                        navigate(`/categories?parent=${parentId}`);
                                                        setSearchTerm('');
                                                        setIsSearchExpanded(false);
                                                    }}
                                                    className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-black/5 transition-all text-left"
                                                >
                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-white border border-black/5 flex items-center justify-center">
                                                        {(prod.media_url || (prod.images && prod.images.length > 0)) ? (
                                                            <img
                                                                src={prod.media_url || prod.images[0]}
                                                                className="w-full h-full object-cover"
                                                                alt={prod.name}
                                                            />
                                                        ) : (
                                                            <Leaf className="text-[#84a98c]" size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-serif font-black text-sm uppercase tracking-tight line-clamp-1">{prod.name}</p>
                                                        <p className="text-[10px] font-black tracking-widest text-[#5D2E17]">{formatPrice(Number(prod.price))}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    ) : null}

                                    {filteredResults?.matchedCategories.length === 0 && filteredResults?.matchedProducts.length === 0 && (
                                        <div className="p-12 text-center text-black/30 italic text-[11px] font-bold uppercase tracking-widest">No village matches</div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
};

export default Header;
