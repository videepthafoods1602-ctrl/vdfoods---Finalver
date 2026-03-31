import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart, formatPrice } = useCart();

    useEffect(() => {
        const fetchFavorites = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const favRes = await fetch(`${API_URL}/favorites/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!favRes.ok) throw new Error('Failed to fetch favorites');
                const favIds = await favRes.json();
                
                if (Array.isArray(favIds) && favIds.length > 0) {
                    const prodRes = await fetch(`${API_URL}/products/`);
                    const allProducts = await prodRes.json();
                    setFavorites(allProducts.filter((p: any) => favIds.includes(p._id)));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    const removeFromFavorites = async (productId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/favorites/${productId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setFavorites(prev => prev.filter(p => p._id !== productId));
            }
        } catch (err) {
            console.error('Remove favorite error:', err);
        }
    };

    const resolveImageUrl = (url: string | undefined) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('http')) return url;
        return url;
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans pt-32 pb-20 px-6">
            <Header />
            <div className="max-w-7xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-[var(--color-text)]/70 hover:text-[var(--color-primary)] transition-colors mb-8">
                    <ArrowLeft size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Back Home</span>
                </Link>

                <h1 className="text-5xl md:text-6xl font-black text-[var(--color-text)] mb-2 font-serif flex items-center gap-4">
                    <Heart size={40} className="text-red-500 fill-red-500/20" /> Your Favorites
                </h1>
                <p className="text-[var(--color-text)]/70 text-lg mb-12">Your handpicked pure & authentic harvests.</p>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <Heart size={40} className="text-[var(--color-primary)]" />
                        </motion.div>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-24 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)]">
                        <Heart size={64} className="mx-auto text-[var(--color-text)]/20 mb-6" />
                        <h2 className="text-2xl font-black text-[var(--color-text)] mb-4 font-serif">Empty Basket</h2>
                        <p className="text-[var(--color-text)]/60 max-w-md mx-auto mb-8 text-lg">You haven't saved any items yet. Heart your favorite village products to see them here.</p>
                        <Link to="/products" className="inline-flex items-center bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {favorites.map((product) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group flex flex-col items-center bg-[var(--color-panel)] border border-[var(--color-border)] rounded-3xl p-4 md:p-6 hover:border-[var(--color-primary)]/50 transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="w-full aspect-square relative mb-6 block rounded-2xl overflow-hidden bg-white/50">
                                    <Link to={`/products/${product._id}`} className="block w-full h-full">
                                        <img
                                            src={resolveImageUrl(product.images[0])}
                                            alt={product.name}
                                            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                        />
                                    </Link>
                                    <button
                                        onClick={() => removeFromFavorites(product._id)}
                                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
                                        title="Remove from favorites"
                                    >
                                        <Heart size={14} className="fill-white" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center w-full text-center mt-auto gap-2">
                                    <Link to={`/products/${product._id}`}>
                                        <h2 className="text-lg md:text-xl font-serif font-black text-[var(--color-text)] leading-tight h-14 overflow-hidden line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                            {product.name}
                                        </h2>
                                    </Link>
                                    
                                    <span className="text-sm font-black text-[var(--color-primary)] tracking-wider mt-1">{formatPrice(product.price)}</span>
                                    
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addToCart({ ...product, price: product.price, image: resolveImageUrl(product.images[0]), quantity: 1, attributes: product.attributes });
                                        }}
                                        className="w-full mt-4 bg-[var(--color-text)] text-white hover:bg-[var(--color-primary)] py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors shadow-md"
                                    >
                                        Add to Basket
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
