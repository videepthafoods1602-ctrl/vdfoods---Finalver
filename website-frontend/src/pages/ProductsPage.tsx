import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Leaf, Heart, FilterX, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { API_URL } from '../config';
import { getWhatsAppLink } from '../utils/whatsappHelper';
import { MessageCircle } from 'lucide-react';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category_ids: string[];
    attributes?: Record<string, any>;
    is_active: boolean;
}



export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
    const [maxPrice, setMaxPrice] = useState<number>(10000);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({});
    const { addToCart, formatPrice, currency } = useCart();
    const { openAuthModal } = useAuth();
    const [allCategories, setAllCategories] = useState<any[]>([]);


    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            setSelectedCategory(cat);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch products with current currency preference
                const res = await fetch(`${API_URL}/products/`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                setProducts(data.filter((p: Product) => p.is_active));
            } catch (err) {
                console.error('ProductsPage fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchFavorites = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/favorites/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFavorites(data);
                }
            } catch (err) {
                console.error('Error fetching favorites:', err);
            }
        };


        const fetchAllCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/categories/`);
                const data = await res.json();
                setAllCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchProducts();
        fetchFavorites();
        fetchAllCategories();
    }, [currency, selectedCategory]);

    const toggleFavorite = async (productId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            openAuthModal();
            return;
        }

        const isFavorite = favorites.includes(productId);
        try {
            if (isFavorite) {
                const res = await fetch(`${API_URL}/favorites/${productId}/`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setFavorites(prev => prev.filter(id => id !== productId));
            } else {
                const res = await fetch(`${API_URL}/favorites/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ product_id: productId })
                });
                if (res.ok) setFavorites(prev => [...prev, productId]);
            }
        } catch (err) {
            console.error('Toggle favorite error:', err);
        }
    };


    const highestPriceInDb = Math.max(...products.map(p => p.price), 10000);

    // Filter labels: Show "All" + names of categories found in products
    const filterCategories = [
        { id: 'All', name: 'All' },
        ...allCategories.filter(cat =>
            // Only show categories that have products in the current list
            products.some(p => p.category_ids.includes(cat.id) || p.category_ids.includes(cat._id))
        ).map(cat => ({
            id: cat.id || cat._id,
            name: cat.name
        }))
    ];

    // Ensure we don't have duplicates and preserve order
    const uniqueFilterCategories = filterCategories.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'All' || p.category_ids.includes(selectedCategory);
        const matchesPrice = p.price <= maxPrice;
        return matchesCategory && matchesPrice;
    });

    if (loading) {
        return (
            <div className="h-screen w-full bg-[var(--color-bg)] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Leaf color="var(--color-primary)" size={64} />
                </motion.div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative bg-[#f8f5ee] text-[var(--color-text)] font-sans min-h-screen selection:bg-[var(--color-primary)] selection:text-white overflow-hidden">

            {/* Shared Nav Header */}
            <Header />

            {/* Main Content */}
            <main className="relative z-10 pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">


                    {/* Sticky Modern Filter Bar */}
                    <div className="sticky top-20 z-40 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] mb-12 py-4">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="flex items-center gap-4 mb-4">
                                <Link
                                    to="/categories"
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded-xl border border-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/20 transition-all text-[10px] font-black uppercase tracking-widest group"
                                >
                                    <Leaf size={14} className="group-hover:rotate-12 transition-transform" />
                                    Categories
                                </Link>
                                <div className="h-4 w-[1px] bg-[var(--color-border)] mx-2" />
                                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x flex-1">
                                    {uniqueFilterCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setSearchParams({ category: cat.id });
                                            }}
                                            className={`px-8 py-3 rounded-full font-black uppercase tracking-[0.15em] text-[10px] whitespace-nowrap transition-all snap-center ${selectedCategory === cat.id
                                                ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20'
                                                : 'bg-[var(--color-panel)] text-[var(--color-text)]/40 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-text)]'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sub-Filters & Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-6 mt-4 opacity-70 hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-6 flex-1 max-w-sm">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]/50">Price Cap: {formatPrice(maxPrice)}</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={highestPriceInDb}
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="w-full accent-[var(--color-primary)] bg-[var(--color-border)] h-[2px] rounded-lg appearance-none cursor-pointer hover:h-1 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setSearchParams({});
                                        setMaxPrice(10000);
                                    }}
                                    className="flex items-center gap-2 text-[var(--color-text)]/40 hover:text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest transition-all group"
                                >
                                    <FilterX size={14} className="group-hover:rotate-90 transition-transform" />
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* High-Density Products List (With Images & Variants) */}
                    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto py-4">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, index) => (
                                <motion.div
                                    key={product._id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.3, delay: (index % 20) * 0.02 }}
                                    className="group grid grid-cols-12 items-center bg-[var(--color-panel)]/30 hover:bg-white border border-[var(--color-border)]/50 rounded-[2rem] p-4 md:p-6 transition-all hover:shadow-xl hover:border-[var(--color-primary)]/20"
                                >
                                    {/* Name Column */}
                                    <div className="col-span-12 md:col-span-5 flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] flex items-center justify-center border border-[var(--color-border)] shrink-0">
                                            <Leaf size={24} className="text-[var(--color-primary)] opacity-40" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleFavorite(product._id);
                                                    }}
                                                    className="p-1.5 rounded-full hover:bg-[var(--color-panel)] transition-colors"
                                                >
                                                    <Heart
                                                        size={14}
                                                        className={favorites.includes(product._id) ? "fill-[var(--color-secondary)] text-[var(--color-secondary)]" : "text-[var(--color-text)]/30"}
                                                    />
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl md:text-2xl font-serif font-black text-[var(--color-text)] transition-colors line-clamp-2">
                                                        {product.name}
                                                    </h2>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]/40">100% Organic Heritage</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weight Selection (Variants) */}
                                    <div className="col-span-12 md:col-span-4 flex flex-col gap-3 px-4 py-4 md:py-0">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]/40 mb-1">Select Quantity</div>
                                        <div className="flex flex-wrap gap-2">
                                            {['100g', '250g', '500g', '750g', '1kg', '2.5kg'].map((w) => (
                                                <button
                                                    key={w}
                                                    onClick={() => setSelectedWeights(prev => ({ ...prev, [product._id]: w }))}
                                                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${(selectedWeights[product._id] || (w === '500g' ? '500g' : '')) === w
                                                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                                                        : 'bg-[var(--color-surface)] text-[var(--color-text)]/40 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                                                        }`}
                                                >
                                                    {w === '100g' ? 'Trail 100g' : w}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price & Primary Actions */}
                                    <div className="col-span-12 md:col-span-3 flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-[var(--color-border)]/50 pt-4 md:pt-0">
                                        <div className="flex flex-col items-start md:items-end">
                                            <span className="text-2xl font-serif font-black text-[var(--color-primary)]">{formatPrice(product.price)}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text)]/30 mt-1">Free Delivery</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <a
                                                href={getWhatsAppLink(product.name, selectedWeights[product._id] || '500g')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-shadow group/wa"
                                                title="Bulk Inquiry"
                                            >
                                                <MessageCircle size={20} className="group-hover/wa:rotate-12 transition-transform" />
                                            </a>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    addToCart({
                                                        ...product,
                                                        price: product.price,
                                                        image: product.images?.[0] || '',
                                                        quantity: 1,
                                                        selectedWeight: selectedWeights[product._id] || '500g',
                                                        attributes: product.attributes
                                                    });
                                                }}
                                                disabled={product.stock === 0}
                                                className="flex items-center gap-3 px-6 py-3 bg-[var(--color-text)] text-white rounded-full disabled:opacity-30 disabled:grayscale shadow-lg hover:bg-[var(--color-primary)] transition-all font-black uppercase tracking-widest text-[10px]"
                                            >
                                                <ShoppingBag size={16} />
                                                Add To Cart
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredProducts.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <p className="text-2xl text-[var(--color-text)]/50">No products found in this category</p>
                        </motion.div>
                    )}
                </div>
            </main >

            {/* Footer */}
            < footer className="relative z-10 w-full border-t border-[var(--color-border)] bg-[var(--color-bg)] py-16 text-center" >
                <div className="flex flex-col items-center gap-4">
                    <Leaf className="text-[var(--color-primary)]" size={40} />
                    <h2 className="text-2xl font-serif text-[var(--color-text)] italic">Videeptha Foods</h2>
                    <p className="text-[var(--color-text)]/60 font-light">© 2026 Videeptha Foods. Rooted in Nature.</p>
                </div>
            </footer >
        </div >
    );
}
