import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, ShoppingBag, ShieldCheck, Truck, Clock, ChevronRight, Info, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import PromotionSection from '../components/PromotionSection';
import type { Promotion } from '../types';
import { API_URL } from '../config';
import { groupProductsWithVariants, extractVariantName } from '../utils/productUtils';



import type { Product } from '../types';


// ProductDetailPage.tsx now uses Tailwind classes for responsiveness.

const resolveImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return url;
};

export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedWeight, setSelectedWeight] = useState('500g');
    const [variants, setVariants] = useState<Product[]>([]);
    const [baseName, setBaseName] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const { addToCart, formatPrice, currency } = useCart();
    const { isLoggedIn, openAuthModal } = useAuth();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const [prodRes, allProdRes] = await Promise.all([
                    fetch(`${API_URL}/products/${id}/`),
                    fetch(`${API_URL}/products/`)
                ]);

                const prodData = await prodRes.json();
                const allProdData = await allProdRes.json();

                setProduct(prodData);
                setSelectedWeight(extractVariantName(prodData));

                if (Array.isArray(allProdData)) {
                    // Find variant siblings
                    const allGrouped = groupProductsWithVariants(allProdData);
                    const currentGroup = allGrouped.find(g => 
                        g.variants.some(v => v._id === prodData._id)
                    );
                    if (currentGroup) {
                        setVariants(currentGroup.variants);
                        setBaseName(currentGroup.baseName);
                    } else {
                        setBaseName(prodData.name);
                    }

                    if (prodData.category_ids) {
                        const similar = allProdData
                            .filter((p: Product) =>
                                p._id !== id &&
                                p.is_active &&
                                p.category_ids &&
                                p.category_ids.some(cat => prodData.category_ids.includes(cat))
                            )
                            .slice(0, 4);
                        setSimilarProducts(similar.length > 0 ? similar : allProdData.filter((p: Product) => p._id !== id).slice(0, 4));
                    }
                }

                const promoRes = await fetch(`${API_URL}/promotions/?product_id=${prodData._id || id}`);
                const promoData = await promoRes.json();
                if (Array.isArray(promoData)) {
                    setPromotions(promoData.filter(p => p.is_active));
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching product detail:', err);
                setLoading(false);
            }
        };

        const trackView = (productId: string) => {
            fetch(`${API_URL}/track-event/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, event_type: 'view' })
            }).catch(err => console.error('Track view error:', err));
        };

        const checkFavorite = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/favorites/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.includes(id)) setIsFavorite(true);
                }
            } catch (err) { console.error('Error checking favorite:', err); }
        };

        fetchProduct();
        trackView(id as string);
        checkFavorite();
        window.scrollTo(0, 0);
    }, [id, currency]);

    const toggleFavorite = async () => {
        if (!isLoggedIn) {
            openAuthModal();
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            openAuthModal();
            return;
        }

        try {
            if (isFavorite) {
                const res = await fetch(`${API_URL}/favorites/${id}/`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setIsFavorite(false);
            } else {
                const res = await fetch(`${API_URL}/favorites/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ product_id: id })
                });
                if (res.ok) setIsFavorite(true);
            }
        } catch (err) {
            console.error('Toggle favorite error:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Leaf className="text-[var(--color-primary)]" size={64} />
                </motion.div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-center p-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-[var(--color-text)] mb-6 font-serif">Harvest Not Found</h1>
                    <Link to="/products" className="text-[var(--color-primary)] font-black uppercase tracking-widest hover:underline transition-all">
                        View All Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans pt-20">
            <Header />

            <main className="max-w-7xl mx-auto px-6 pt-10 text-left">
                {/* Back Button */}
                <div className="mb-8 w-full flex justify-start">
                    <Link to="/products" className="inline-flex items-center gap-2 text-[var(--color-text)]/70 hover:text-[var(--color-primary)] transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]/70">
                            <span className="hidden md:inline">Back to Market</span>
                            <span className="md:hidden">Back</span>
                        </span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Left: Images */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-square rounded-[2.5rem] overflow-hidden bg-[var(--color-panel)] border border-[var(--color-border)]"
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    src={resolveImageUrl(product?.images?.[activeImage])}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </AnimatePresence>
                        </motion.div>

                        {(product?.images || []).length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {(product?.images || []).map((img, idx) => (
                                    <button
                                        key={idx}
                                        className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-[var(--color-primary)] opacity-100 scale-105' : 'border-transparent opacity-60'}`}
                                        onClick={() => setActiveImage(idx)}
                                    >
                                        <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <span className="text-[var(--color-primary)] font-black uppercase tracking-[0.2em] text-xs mb-4 block">
                                {product.category_ids[0]}
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-[var(--color-text)] mb-6 font-serif leading-tight">
                                {baseName || product.name}
                            </h1>

                            <div className="text-3xl md:text-5xl font-black text-[var(--color-text)] mb-8 flex items-baseline gap-3">
                                {formatPrice(product.price)}
                                <span className="text-xs text-[var(--color-text)]/50 font-medium">Incl. all taxes</span>
                            </div>

                            {/* Analytics Badges */}
                            <div className="flex flex-wrap gap-4 mb-8">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 bg-[var(--color-panel)] px-4 py-2 rounded-full border border-[var(--color-border)] shadow-lg backdrop-blur-md"
                                >
                                    <Clock size={14} className="text-[var(--color-primary)] animate-pulse" />
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--color-text)]/90 whitespace-nowrap">
                                        {product.analytics?.current_watching || 8} watching now
                                    </span>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center gap-2 bg-[var(--color-panel)] px-4 py-2 rounded-full border border-[var(--color-border)] shadow-lg backdrop-blur-md"
                                >
                                    <Heart size={14} className="text-red-500 fill-red-500/20" />
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--color-text)]/90 whitespace-nowrap">
                                        Saved by {product.analytics?.favorites_count || 0} people
                                    </span>
                                </motion.div>
                            </div>

                            <p className="text-base md:text-lg text-[var(--color-text)]/70 leading-relaxed mb-8">
                                {product.description}
                            </p>

                            {/* Weight/Variant Selection */}
                            <div className="mb-10">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]/40 mb-3">
                                    {variants.length > 1 ? 'Select Variant' : 'Pack Size'}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {variants.length > 1 ? (
                                        variants.map((v) => (
                                            <Link
                                                key={v._id}
                                                to={`/products/${v._id}`}
                                                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    product._id === v._id
                                                        ? 'bg-[var(--color-primary)] text-white shadow-lg'
                                                        : 'bg-[var(--color-panel)] text-[var(--color-text)]/40 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                                                }`}
                                            >
                                                {extractVariantName(v)}
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="px-6 py-2.5 rounded-full bg-[var(--color-panel)] text-[var(--color-text)]/70 border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest">
                                            {extractVariantName(product)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <div className="flex items-center bg-[var(--color-panel)] rounded-full p-2 border border-[var(--color-border)] w-fit">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-[var(--color-text)]/10 transition-colors"
                                    >-</button>
                                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-[var(--color-text)]/10 transition-colors"
                                    >+</button>
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white h-14 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-primary)]/20"
                                    onClick={() => {
                                        if (!isLoggedIn) {
                                            openAuthModal();
                                            return;
                                        }
                                        addToCart({
                                            _id: product._id,
                                            name: product.name,
                                            price: Number(product.price),
                                            image: resolveImageUrl(product?.images?.[0]),
                                            quantity: quantity,
                                            selectedWeight: selectedWeight,
                                            attributes: product.attributes
                                        });
                                    }}
                                >
                                    <ShoppingBag size={20} /> Add to Basket
                                </motion.button>



                                <button
                                    type="button"
                                    onClick={toggleFavorite}
                                    className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border transition-all ${isFavorite ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50 text-[var(--color-primary)]' : 'bg-[var(--color-panel)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-text)]/10'}`}
                                >
                                    <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-10 border-t border-[var(--color-border)]">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]"><Truck size={22} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Fast Delivery</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]"><ShieldCheck size={22} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Pure Organic</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]"><Clock size={22} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Farm Fresh</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-2xl font-black text-[var(--color-text)] mb-6 font-serif flex items-center gap-3"><Info size={24} className="text-[var(--color-primary)]" /> Ingredients & Purity</h2>
                        <div className="bg-[var(--color-panel)] p-8 rounded-[2rem] border border-[var(--color-border)]">
                            {product.attributes?.ingredients && product.attributes.ingredients.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {product.attributes.ingredients.map((ing: string, i: number) => (
                                        <span key={i} className="px-4 py-2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-full text-xs font-bold text-[var(--color-text)]/90">{ing}</span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[var(--color-text)]/70 text-sm leading-relaxed">100% pure and natural, sourced directly from our village farms. No artificial additives or preservatives used.</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-2xl font-black text-[var(--color-text)] mb-6 font-serif flex items-center gap-3"><ShieldCheck size={24} className="text-[var(--color-primary)]" /> Purity Guarantee</h2>
                        <div className="bg-[var(--color-panel)] p-8 rounded-[2rem] border border-[var(--color-border)]">
                            <p className="text-[var(--color-text)]/70 text-sm leading-relaxed">All our products undergo rigorous quality checks to ensure they meet our "Village Fresh" standards. We guarantee 100% authenticity and zero adulteration.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Targeted Promotions */}
                {promotions.length > 0 && (
                    <div className="mt-24">
                        <h2 className="text-2xl font-black text-[var(--color-text)] mb-8 font-serif">Exclusive Offers</h2>
                        <PromotionSection promotions={promotions} />
                    </div>
                )}

                {/* Similar Harvests */}
                <div className="mt-32 pb-24">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-[var(--color-text)] mb-2 font-serif">Similar Harvests</h2>
                            <p className="text-[var(--color-text)]/50 text-sm">Complements well with your current selection.</p>
                        </div>
                        <Link to="/products" className="text-[var(--color-primary)] font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:translate-x-1 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {similarProducts.map((p, idx) => (
                            <Link to={`/products/${p._id}`} key={p._id} className="group">
                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                    <div className="aspect-square rounded-3xl overflow-hidden bg-[var(--color-panel)] border border-[var(--color-border)] mb-4 group-hover:border-[var(--color-primary)]/50 transition-all">
                                        <img src={resolveImageUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[var(--color-text)] mb-1 group-hover:text-[var(--color-primary)] transition-colors truncate">{p.name}</h3>
                                    <div className="text-[var(--color-primary)] font-black text-sm">{formatPrice(p.price)}</div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="py-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-center">
                <div className="flex flex-col items-center gap-6">
                    <Leaf size={40} className="text-[var(--color-primary)]" />
                    <h2 className="text-2xl font-serif text-[var(--color-text)] italic">Videeptha Foods</h2>
                    <p className="text-[var(--color-text)]/40 text-sm font-light">© 2026 Videeptha Foods. Authenticity in every grain.</p>
                </div>
            </footer>
        </div>
    );
}
