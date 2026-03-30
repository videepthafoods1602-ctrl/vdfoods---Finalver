import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, User, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MobileBottomNav = () => {
    const location = useLocation();
    const { isLoggedIn, openAuthModal } = useAuth();

    const isActive = (path: string) => {
        if (path === "/" && location.pathname === "/") return true;
        if (path !== "/" && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="fixed bottom-0 left-0 w-full bg-[var(--color-bg)] border-t border-[var(--color-border)] z-[200] lg:hidden pb-safe shadow-[0_-5px_20px_var(--color-border)]">
            <div className="grid grid-cols-4 h-16">

                {/* Home */}
                <Link
                    to="/"
                    className={`flex flex-col items-center justify-center text-xs ${isActive("/") ? "text-[var(--color-primary)] font-bold scale-105" : "text-[var(--color-text)]/60"
                        }`}
                >
                    <Home size={20} />
                    Home
                </Link>

                {/* Shop */}
                <Link
                    to="/categories"
                    className={`flex flex-col items-center justify-center text-xs ${isActive("/categories") ? "text-[var(--color-primary)] font-bold scale-105" : "text-[var(--color-text)]/60"
                        }`}
                >
                    <ShoppingBag size={20} />
                    Shop
                </Link>

                {/* Stories */}
                <Link
                    to="/stories"
                    className={`flex flex-col items-center justify-center text-xs ${isActive("/stories") ? "text-[var(--color-primary)] font-bold scale-105" : "text-[var(--color-text)]/60"
                        }`}
                >
                    <BookOpen size={20} />
                    Stories
                </Link>

                {/* Profile / Login */}
                {isLoggedIn ? (
                    <Link
                        to="/settings"
                        className={`flex flex-col items-center justify-center text-xs ${isActive("/settings") ? "text-[var(--color-primary)] font-bold scale-105" : "text-[var(--color-text)]/60"
                            }`}
                    >
                        <User size={20} />
                        Profile
                    </Link>
                ) : (
                    <button
                        onClick={openAuthModal}
                        className={`flex flex-col items-center justify-center text-xs text-[var(--color-text)]/60`}
                    >
                        <User size={20} />
                        Login
                    </button>
                )}

            </div>
        </div>
    );
};

export default MobileBottomNav;