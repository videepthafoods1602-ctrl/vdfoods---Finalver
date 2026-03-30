import { Link, useLocation } from 'react-router-dom';
import { Home, User, LayoutGrid, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
    const location = useLocation();
    const { isLoggedIn, openAuthModal } = useAuth();

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { label: 'Village', icon: Home, path: '/', count: 0 },
        { label: 'Kitchen', icon: BookOpen, path: '/#stories', count: 0 },
        { label: 'Shop', icon: LayoutGrid, path: '/categories', count: 0 },
        { label: isLoggedIn ? 'Profile' : 'Login', icon: User, path: isLoggedIn ? '/settings' : '/login', count: 0, action: !isLoggedIn ? openAuthModal : null },
    ];

    return (
        <section className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] w-full">
            <div className="bg-[#1a1d18]/95 backdrop-blur-3xl border-t border-white/10 px-8 py-5 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden pb-safe">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/10 to-transparent pointer-events-none" />

                {navItems.map((item, idx) => {
                    const isHashLink = item.path.startsWith('/#');
                    const Content = (
                        <div className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive(item.path) ? 'text-[var(--color-primary)]' : 'text-slate-400'}`}>
                            <motion.div
                                animate={isActive(item.path) ? { scale: [1, 1.2, 1], y: [0, -4, 0] } : {}}
                                transition={{ duration: 0.4 }}
                            >
                                <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                            </motion.div>

                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {item.label}
                            </span>

                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeDot"
                                    className="absolute -bottom-1 w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full shadow-[0_0_10px_var(--color-primary)]"
                                />
                            )}
                        </div>
                    );

                    if (item.action) {
                        return (
                            <button key={idx} onClick={item.action}>
                                {Content}
                            </button>
                        );
                    }

                    return isHashLink ? (
                        <a key={idx} href={item.path}>
                            {Content}
                        </a>
                    ) : (
                        <Link key={idx} to={item.path}>
                            {Content}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default BottomNav;
