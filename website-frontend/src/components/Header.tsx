import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, LogIn, Home, MapPin, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Magnetic from './Magnetic';
import HeroTicker from './HeroTicker';
import { API_URL } from '../config';
import { getCategoryImage } from '../utils/category_utils';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const DEFAULT_NAV_ITEMS = [
    { label: 'Village', link: '/' },
    { label: 'Market Explorer', link: '/market-explorer' },
    { label: 'Shop', link: '/categories' },
    { label: 'Kitchen Stories', link: '/stories' },
    { label: 'Policies', link: '/policies' },
];

const Header = () => {
    const [navItems, setNavItems] = useState<any[]>(DEFAULT_NAV_ITEMS);
    const [scrolled, setScrolled] = useState(false);
    const [showLocationTooltip, setShowLocationTooltip] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);

    const { cartCount, setIsCartOpen, locationData, refreshLocation } = useCart();
    const { isLoggedIn, user, openAuthModal } = useAuth();
    const { theme } = useTheme();

    const location = useLocation();

    useEffect(() => {
        fetch(`${API_URL}/navigation/`)
            .then(res => res.json())
            .then(data => {
                if (data?.items?.length > 0) {
                    const brandedItems = data.items.map((item: any) => {
                        let finalLink = item.link;
                        
                        // Mapping logic for standard pages
                        if (item.link === '/categories') finalLink = '/categories';
                        if (item.label?.toLowerCase().includes('stories')) finalLink = '/stories';
                        if (item.label?.toLowerCase().includes('policy')) finalLink = '/policies';
                        
                        return {
                            ...item,
                            link: finalLink,
                            label: item.link === '/categories' ? 'Shop' : item.label
                        };
                    });
                    setNavItems(brandedItems);
                }
            })
            .catch(err => console.error('Failed to fetch nav:', err));

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        fetch(`${API_URL}/categories/`).then(res => res.json()).then(setAllCategories);
        fetch(`${API_URL}/products/`).then(res => res.json()).then(setAllProducts);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigate = useNavigate();

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
        if (path.startsWith('/#')) return false;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const isMinimalistPage = ['/settings', '/checkout', '/login', '/signup'].includes(location.pathname);
    const isBackToHomeRequired = ['/categories', '/products'].some(path => location.pathname.startsWith(path));
    const isHomePage = ['/', '/home-alt', '/slurrp-home'].includes(location.pathname);

    return (
        <header className="fixed top-0 w-full z-[100] transition-all duration-500 bg-transparent">
            {!isMinimalistPage && (
                <HeroTicker
                    items={theme?.branding?.ticker_text?.length ? theme.branding.ticker_text : ["Say No to Whites", "Authentic Village Flavors", "Traditional Vedic Methods", "Pure & Organic"]}
                    speed={theme?.branding?.ticker_style?.speed || 25}
                    height="py-2"
                />
            )}

            <nav className={`w-full transition-all duration-500 bg-transparent ${scrolled ? 'py-2 bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b border-[var(--color-border)] shadow-2xl' : 'py-3'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {isMinimalistPage || isBackToHomeRequired ? (
                        <div className="flex items-center gap-4">
                            <Magnetic>
                                <Link to="/" className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-panel)] hover:bg-[var(--color-panel)] text-[var(--color-text)]/80 rounded-xl border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
                                    <Home size={16} className="text-[var(--color-primary)]" />
                                    Village
                                </Link>
                            </Magnetic>
                            {isBackToHomeRequired && (
                                <Link to="/" className="hidden sm:flex items-center gap-3">
                                    <span className="text-lg font-black font-['Gagalin'] tracking-wider uppercase block leading-none text-[var(--color-secondary)]">Vidya-Pradeep</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                                <Magnetic>
                                    <button
                                        onClick={() => setIsMenuOpen(true)}
                                        className={`flex items-center justify-center w-11 h-11 rounded-2xl border transition-all group ${isHomePage ? 'lg:hidden' : ''} ${scrolled ? 'bg-[var(--color-panel)] border-[var(--color-border)] text-[var(--color-text)]' : isHomePage ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'} hover:bg-[var(--color-secondary)] hover:text-white hover:border-[var(--color-secondary)]`}
                                    >
                                        <Menu size={20} />
                                    </button>
                                </Magnetic>

                                <Link to="/" className="flex items-center gap-3 group">
                                    <div>
                                        <span className={`text-lg sm:text-2xl font-black tracking-wider font-['Gagalin'] uppercase block leading-none ${(scrolled || !isHomePage) ? 'text-[var(--color-secondary)]' : 'text-white'}`}>Vidya-Pradeep</span>
                                        <span className={`text-[10px] sm:text-xs font-black uppercase font-['Gagalin'] tracking-wider block mt-1 ${scrolled ? 'text-[var(--color-text)]' : isHomePage ? 'text-white/80' : 'text-black/80'}`}>MILLETS ARE NOT BORING BOSS 😎🤪</span>
                                    </div>
                                </Link>
                            </div>

                            {isHomePage && (
                                <div className="hidden lg:flex items-center gap-8">
                                    {navItems.map((item, idx) => {
                                        const active = isActive(item.link);
                                        return (
                                            <Link
                                                key={idx}
                                                to={item.link}
                                                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:translate-y-[-2px] ${active ? 'text-[var(--color-primary)]' : (scrolled || !isHomePage) ? 'text-[var(--color-text)]/60 hover:text-[var(--color-primary)]' : 'text-white/70 hover:text-white'}`}
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex items-center gap-3">
                        {/* Location Button - Desktop Only */}
                        <div className="hidden md:flex items-center gap-2">
                            <Magnetic>
                                <button
                                    onClick={async () => {
                                        setShowLocationTooltip(!showLocationTooltip);
                                        await refreshLocation();
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest
                                        ${scrolled 
                                            ? 'bg-[var(--color-panel)] border-[var(--color-border)] text-[var(--color-text)]' 
                                            : isHomePage 
                                                ? 'bg-white/10 border-white/20 text-white' 
                                                : 'bg-black/5 border-black/10 text-black'}
                                    `}
                                >
                                    <MapPin size={14} className={scrolled || !isHomePage ? 'text-[var(--color-primary)]' : 'text-white'} />
                                    <span className="hidden lg:inline">{locationData?.city || locationData?.country_name || 'Village'}</span>
                                </button>
                            </Magnetic>
                        </div>

                        {/* Search Bar */}
                        <motion.div 
                            initial={false}
                            animate={{ width: isSearchExpanded ? '200px' : '44px' }}
                            className={`relative flex items-center border rounded-full overflow-hidden transition-all ${scrolled ? 'bg-[var(--color-panel)] border-[var(--color-border)]' : isHomePage ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10'}`}
                        >
                            {isSearchExpanded && (
                                <div className="flex-1 flex items-center h-full pl-4 pr-1">
                                    <input autoFocus type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none w-full text-[10px] sm:text-xs font-black uppercase leading-tight placeholder:text-[var(--color-text)]/30 text-[var(--color-text)]" />
                                </div>
                            )}
                            <button onClick={() => { setIsSearchExpanded(!isSearchExpanded); if (isSearchExpanded) setSearchTerm(''); }} className={`w-10 h-10 flex items-center justify-center shrink-0 transition-colors ${isSearchExpanded ? 'hover:text-red-500' : 'hover:text-[var(--color-primary)]'}`}>
                                {isSearchExpanded ? <X size={16} /> : <Search size={18} />}
                            </button>
                        </motion.div>

                        {/* Cart Button */}
                        <Magnetic>
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative flex items-center justify-center w-11 h-11 rounded-2xl border transition-all group
                                    ${scrolled 
                                        ? 'bg-[var(--color-panel)] border-[var(--color-border)] text-[var(--color-text)]' 
                                        : isHomePage 
                                            ? 'bg-white/10 border-white/20 text-white' 
                                            : 'bg-black/5 border-black/10 text-black'}
                                    hover:bg-[var(--color-secondary)] hover:text-white hover:border-[var(--color-secondary)]
                                `}
                            >
                                <ShoppingBag size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </Magnetic>

                        {/* Auth / Profile Button */}
                        <Magnetic>
                            {isLoggedIn ? (
                                <Link
                                    to="/settings"
                                    className={`flex items-center justify-center w-11 h-11 rounded-2xl border overflow-hidden transition-all
                                        ${scrolled 
                                            ? 'bg-[var(--color-panel)] border-[var(--color-border)] text-[var(--color-secondary)]' 
                                            : isHomePage 
                                                ? 'bg-white/10 border-white/20 text-white' 
                                                : 'bg-black/5 border-black/10 text-black'}
                                    `}
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
                                    className={`flex items-center justify-center w-11 h-11 rounded-2xl border transition-all group
                                        ${scrolled 
                                            ? 'bg-[var(--color-panel)] border-[var(--color-border)] text-[var(--color-text)]' 
                                            : isHomePage 
                                                ? 'bg-white/10 border-white/20 text-white' 
                                                : 'bg-black/5 border-black/10 text-black'}
                                        hover:bg-[var(--color-secondary)] hover:text-white hover:border-[var(--color-secondary)]
                                    `}
                                >
                                    <LogIn size={20} />
                                </button>
                            )}
                        </Magnetic>

                        <AnimatePresence>
                            {searchTerm && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full w-full max-w-[320px] mt-3 bg-white border border-[var(--color-border)] rounded-[2rem] shadow-2xl overflow-hidden z-[999]">
                                    <div className="max-h-[350px] overflow-y-auto p-3 flex flex-col gap-1">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text)]/30 px-3 py-2">Suggested Harvests</p>
                                        {filteredResults?.matchedCategories.map((cat) => (
                                            <button key={cat.id || cat._id} onClick={() => { navigate(`/categories?parent=${cat.id || cat._id}`); setSearchTerm(''); setIsSearchExpanded(false); }} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-[var(--color-primary)]/5 transition-all group text-left">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[var(--color-border)]/50 bg-[var(--color-panel)]">
                                                    <img src={getCategoryImage(cat.name, cat.media_url)} className="w-full h-full object-cover" alt={cat.name} />
                                                </div>
                                                <p className="font-serif font-black text-xs md:text-sm uppercase tracking-tight">{cat.name}</p>
                                            </button>
                                        ))}

                                        {filteredResults?.matchedProducts.length ? (
                                            <>
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text)]/30 px-3 py-2 mt-2">Products</p>
                                                {filteredResults?.matchedProducts.slice(0, 5).map((prod: any) => (
                                                    <button 
                                                        key={prod.id || prod._id} 
                                                        onClick={() => {
                                                            const parentId = prod.subcategory_id || (prod.category_ids && prod.category_ids[0]);
                                                            navigate(`/categories?parent=${parentId}`);
                                                            setSearchTerm('');
                                                            setIsSearchExpanded(false);
                                                        }} 
                                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-[var(--color-primary)]/5 transition-all group text-left"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[var(--color-border)]/50 bg-[#f9fbf9]">
                                                            <img src={prod.media_url || (prod.images && prod.images[0])} className="w-full h-full object-cover" alt={prod.name} />
                                                        </div>
                                                        <div>
                                                            <p className="font-serif font-black text-xs md:text-sm uppercase tracking-tight line-clamp-1">{prod.name}</p>
                                                            <p className="text-[8px] font-black tracking-widest text-[var(--color-primary)]">₹{prod.price}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        ) : null}

                                        {filteredResults?.matchedCategories.length === 0 && filteredResults?.matchedProducts.length === 0 && (
                                            <div className="p-8 text-center text-[var(--color-text)]/30 italic text-[10px] font-bold uppercase tracking-widest">No village matches</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 h-screen w-full max-w-[400px] bg-[var(--color-bg)] shadow-[50px_0_100px_rgba(0,0,0,0.3)] z-[201] flex flex-col p-10 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3">
                                    <span className="text-xl font-black font-['Gagalin'] text-[var(--color-secondary)] uppercase">Vidya-Pradeep</span>
                                </Link>
                                <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-panel)] border border-[var(--color-border)] hover:bg-black hover:text-white transition-all"><X size={18} /></button>
                            </div>
                            <div className="flex items-center justify-between bg-[var(--color-panel)] p-4 rounded-3xl mb-12 border border-[var(--color-border)]">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsCartOpen(true)} className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <ShoppingBag size={20} className="text-[var(--color-secondary)]" />
                                        {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={async () => { setShowLocationTooltip(!showLocationTooltip); await refreshLocation(); }} className="flex items-center gap-2 px-3 h-12 bg-white rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest"><MapPin size={16} className="text-[var(--color-secondary)]" />{locationData?.country_name || 'India'}</button>
                                     {isLoggedIn ? <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="w-12 h-12 rounded-2xl bg-[var(--color-secondary)] text-white flex items-center justify-center font-black">{user?.email?.charAt(0).toUpperCase()}</Link> : <button onClick={openAuthModal} className="w-12 h-12 rounded-2xl bg-[var(--color-secondary)] text-white flex items-center justify-center"><LogIn size={20} /></button>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-4 mb-auto">
                                {navItems.map((item, idx) => (
                                    <Link key={idx} to={item.link} onClick={() => setIsMenuOpen(false)} className={`text-3xl font-serif font-black uppercase tracking-tighter transition-all hover:translate-x-4 ${isActive(item.link) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)] hover:text-[var(--color-primary)]'}`}>{item.label}</Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
