import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogIn, ChevronLeft, Home, MapPin, Heart, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Magnetic from './Magnetic';
import HeroTicker from './HeroTicker';
import { API_URL } from '../config';

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

    const { cartCount, setIsCartOpen, locationData, refreshLocation } = useCart();
    const { isLoggedIn, user, openAuthModal } = useAuth();
    const { theme } = useTheme();

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_URL}/navigation/`)
            .then(res => res.json())
            .then(data => {
                if (data?.items?.length > 0) {
                    setNavItems(data.items);
                }
            })
            .catch(err => console.error('Failed to fetch nav:', err));

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path.startsWith('/#')) return false;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const isNestedPage = location.pathname !== '/';
    const isMinimalistPage = ['/settings', '/checkout', '/login', '/signup'].includes(location.pathname);

    return (
        <header className="fixed top-0 w-full z-[100] transition-all duration-500 bg-transparent">
            {/* Top Ticker - Always at top */}
            {!isMinimalistPage && (
                <HeroTicker
                    items={theme?.branding?.ticker_text?.length ? theme.branding.ticker_text : ["Say No to Whites", "Authentic Village Flavors", "Traditional Vedic Methods", "Pure & Organic"]}
                    speed={theme?.branding?.ticker_style?.speed || 25}
                    height="py-2"
                />
            )}

            <nav
                className={`w-full transition-all duration-500 bg-transparent ${scrolled
                    ? 'py-4 bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b border-[var(--color-border)] shadow-2xl'
                    : 'py-6'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {isMinimalistPage ? (
                        <div className="flex items-center gap-4">
                            <Magnetic>
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-panel)] hover:bg-[var(--color-panel)] text-[var(--color-text)]/80 rounded-xl border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Home size={16} />
                                    Village
                                </Link>
                            </Magnetic>
                        </div>
                    ) : (
                        <>
                            {/* Logo & Back button for mobile */}
                            <div className="flex items-center gap-2">
                                {isNestedPage && (
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="p-2 sm:hidden bg-[var(--color-panel)] rounded-xl border border-[var(--color-border)] text-[var(--color-text)]/80 active:scale-90 transition-all mr-2"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                )}

                                <Link to="/" className="flex items-center gap-3 group">
                                    <div className={isNestedPage ? "hidden sm:block" : "block"}>
                                        <span className={`text-lg sm:text-2xl font-black tracking-wider font-['Gagalin'] uppercase block leading-none text-[var(--color-secondary)]`}>
                                            VIDYA-PRADEEP
                                        </span>
                                        <span className={`text-[10px] sm:text-xs font-black uppercase font-['Gagalin'] tracking-wider block mt-1 ${scrolled ? 'text-[var(--color-text)]' : 'text-black/80'}`}>
                                            MILLETS ARE NOT BORING BOSS 😎🤪
                                        </span>
                                    </div>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center gap-1">
                                {navItems.map((item: any, idx: number) => {
                                    const safeLink = item.link === '/#stories' ? '/stories' : item.link;
                                    return (
                                        <Magnetic key={idx}>
                                            <Link
                                                to={safeLink}
                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isActive(safeLink)
                                                    ? 'bg-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-secondary)]/20'
                                                    : scrolled 
                                                        ? 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
                                                        : 'text-black/70 hover:text-black hover:bg-black/10'
                                                    }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </Magnetic>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div
                                        onClick={async () => {
                                            setShowLocationTooltip(true);
                                            await refreshLocation();
                                            setTimeout(() => setShowLocationTooltip(false), 3000);
                                        }}
                                        className="flex items-center justify-center gap-2 text-[var(--color-text)] text-[10px] font-black uppercase tracking-widest bg-[var(--color-panel)] w-11 h-11 md:w-auto md:px-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-panel)] transition-colors cursor-pointer"
                                    >
                                        <MapPin className="text-[var(--color-secondary)] flex-shrink-0 drop-shadow-[0_0_8px_var(--color-secondary)] w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                        <span className="hidden md:inline truncate">
                                            {locationData?.country_name || 'United States'}
                                        </span>
                                    </div>

                                    <AnimatePresence>
                                        {showLocationTooltip && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full right-0 mt-3 bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl shadow-2xl flex flex-col gap-1 w-48 z-[150] pointer-events-none"
                                            >
                                                <span className="text-[9px] uppercase text-[var(--color-text)]/60 font-bold tracking-widest mb-1">Pricing Region</span>
                                                <span className="text-sm font-bold text-[var(--color-text)] leading-tight">{locationData?.country_name || 'United States'}</span>
                                                <span className="text-xs text-[var(--color-primary)] font-black uppercase tracking-widest mt-1">{locationData?.currency === 'INR' ? '₹ Rupees (INR)' : '$ Dollars (USD)'}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <Magnetic>
                                    <Link
                                        to="/categories"
                                        className="relative flex items-center justify-center w-11 h-11 bg-[var(--color-panel)] hover:bg-white rounded-2xl border border-[var(--color-border)] transition-all group"
                                    >
                                        <Search
                                            className={`${scrolled ? 'text-[var(--color-text)]/80' : 'text-black/80'} group-hover:text-[var(--color-secondary)] w-4.5 h-4.5 sm:w-5 sm:h-5`}
                                        />
                                    </Link>
                                </Magnetic>

                                <Magnetic>
                                    <Link
                                        to="/favorites"
                                        className="relative flex items-center justify-center w-11 h-11 bg-[var(--color-panel)] hover:bg-white rounded-2xl border border-[var(--color-border)] transition-all group mr-2"
                                    >
                                        <Heart
                                            className={`${scrolled ? 'text-[var(--color-text)]/80' : 'text-black/80'} group-hover:text-red-500 w-4.5 h-4.5 sm:w-5 sm:h-5`}
                                        />
                                    </Link>
                                </Magnetic>

                                <Magnetic>
                                    <button
                                        onClick={() => setIsCartOpen(true)}
                                        className="relative flex items-center justify-center w-11 h-11 bg-[var(--color-panel)] hover:bg-white rounded-2xl border border-[var(--color-border)] transition-all group"
                                    >
                                        <ShoppingBag
                                            className={`${scrolled ? 'text-[var(--color-text)]/80' : 'text-black/80'} group-hover:text-[var(--color-secondary)] w-4.5 h-4.5 sm:w-5 sm:h-5`}
                                        />

                                        {cartCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-primary)] text-[var(--color-bg)] text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-[var(--color-bg)]">
                                                {cartCount}
                                            </span>
                                        )}
                                    </button>
                                </Magnetic>

                                <div className="hidden lg:block">
                                    {isLoggedIn ? (
                                        <Link
                                            to="/settings"
                                            className="flex items-center p-1.5 bg-[var(--color-secondary)]/5 hover:bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 rounded-2xl transition-all group overflow-hidden"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-bg)] font-black text-xs overflow-hidden">
                                                {user?.profile?.avatar_url ? (
                                                    <img
                                                        src={user.profile.avatar_url}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    user?.email?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={openAuthModal}
                                            className="flex items-center justify-center w-11 h-11 bg-[var(--color-secondary)] text-white rounded-2xl shadow-xl shadow-[var(--color-secondary)]/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <LogIn className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
