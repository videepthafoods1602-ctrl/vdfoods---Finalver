import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Leaf, Heart, FilterX, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { API_URL } from '../config';
import { groupProductsWithVariants, extractVariantName } from '../utils/productUtils';


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
    const [selectedVariantIds, setSelectedVariantIds] = useState<Record<string, string>>({});
    const { addToCart, formatPrice, currency } = useCart();
    const { isLoggedIn, openAuthModal } = useAuth();
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
                const res = await fetch(`${API_URL}/products/?_cb=${new Date().getTime()}`);
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
                const res = await fetch(`${API_URL}/categories/?_cb=${new Date().getTime()}`);
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
            <main className="relative z-10 pt-28 md:pt-36 pb-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">


                    {/* Sticky Modern Filter Bar */}
                    <div className="sticky top-[74px] md:top-24 z-40 bg-[var(--color-bg)]/95 backdrop-blur-xl border-b border-[var(--color-border)] -mx-4 md:-mx-6 mb-6 md:mb-12 py-3 md:py-4">
                        <div className="max-w-7xl mx-auto px-4 md:px-6">
                            <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
                                <Link
                                    to="/categories"
                                    className="flex items-center justify-center p-2.5 md:px-4 md:py-2 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded-xl border border-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/20 transition-all group shrink-0"
                                >
                                    <Leaf size={14} className="group-hover:rotate-12 transition-transform" />
                                    <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-widest">Categories</span>
                                </Link>
                                <div className="h-4 w-[1px] bg-[var(--color-border)] mx-1" />
                                <div className="flex gap-2 md:gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x flex-1">
                                    {uniqueFilterCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setSearchParams({ category: cat.id });
                                            }}
                                            className={`px-5 md:px-8 py-2 md:py-3 rounded-full font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-[8px] md:text-[10px] whitespace-nowrap transition-all snap-center ${selectedCategory === cat.id
                                                ? 'bg-[var(--color-primary)] text-white shadow-lg'
                                                : 'bg-[var(--color-panel)] text-[var(--color-text)]/40 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-text)]'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sub-Filters & Controls */}
                            <div className="flex items-center gap-4 mt-2 opacity-80 overflow-x-auto hide-scrollbar">
                                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]/50 whitespace-nowrap">Cap: {formatPrice(maxPrice)}</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={highestPriceInDb}
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="w-full max-w-[150px] md:max-w-sm accent-[var(--color-primary)] bg-[var(--color-border)] h-[2px] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setSearchParams({});
                                        setMaxPrice(highestPriceInDb);
                                    }}
                                    className="flex items-center justify-center w-8 h-8 md:w-auto md:px-4 md:py-2 rounded-lg md:bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-text)]/40 hover:text-[var(--color-primary)] transition-all group shrink-0"
                                    title="Reset Filters"
                                >
                                    <FilterX size={14} className="group-hover:rotate-90 transition-transform" />
                                    <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-widest">Reset</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* High-Density Products List (With Images & Variants) */}
                    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto py-4">
                        <AnimatePresence mode="popLayout">
                            {(() => {
                                const grouped = groupProductsWithVariants(filteredProducts);
                                return grouped.map((group, index) => {
                                    const selectedId = selectedVariantIds[group.baseName] || group.defaultProduct._id;
                                    const product = group.variants.find(v => v._id === selectedId) || group.defaultProduct;
                                    
                                    return (
                                        <motion.div
                                            key={group.baseName}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.3, delay: (index % 20) * 0.02 }}
                                            className="group bg-[var(--color-panel)]/30 hover:bg-white border border-[var(--color-border)]/50 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 transition-all hover:shadow-xl hover:border-[var(--color-primary)]/20 relative"
                                        >
                                            <Link to={`/products/${product._id}`} className="absolute inset-0 z-0" />
                                            <div className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 md:gap-0 relative z-10 pointer-events-none">
                                                <div className="md:col-span-5 flex items-start md:items-center gap-4 md:gap-6 pointer-events-auto">
                                                    <div className="w-20 h-20 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-white flex items-center justify-center border border-[var(--color-border)] shrink-0 overflow-hidden shadow-sm">
                                                        {product.images?.[0] ? (
                                                            <img 
                                                                src={product.images[0]} 
                                                                alt={product.name} 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                            />
                                                        ) : (
                                                            <div className="p-4 bg-[var(--color-surface)]">
                                                                <Leaf size={24} className="text-[var(--color-primary)] opacity-40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0 pr-2">
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="text-base md:text-lg lg:text-xl font-serif font-black text-[var(--color-text)] transition-colors leading-tight">
                                                                {group.baseName}
                                                            </h2>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[var(--color-text)]/40">Pure Village Heritage</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleFavorite(product._id);
                                                            }}
                                                            className="mt-1 w-fit p-1.5 rounded-full hover:bg-[var(--color-panel)] transition-colors border border-[var(--color-border)]"
                                                        >
                                                            <Heart
                                                                size={12}
                                                                className={favorites.includes(product._id) ? "fill-[var(--color-secondary)] text-[var(--color-secondary)]" : "text-[var(--color-text)]/30"}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
        
                                                <div className="md:col-span-4 flex flex-col gap-2 px-0 md:px-6 pointer-events-auto">
                                                    {group.variants.length > 1 ? (
                                                        <>
                                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]/40">Select Variant</div>
                                                            <div className="relative">
                                                                <select
                                                                    value={selectedId}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedVariantIds(prev => ({ ...prev, [group.baseName]: e.target.value }));
                                                                    }}
                                                                    className="w-full bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none appearance-none cursor-pointer hover:bg-white transition-colors"
                                                                >
                                                                    {group.variants.map((v) => (
                                                                        <option key={v._id} value={v._id}>
                                                                            {extractVariantName(v.name)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                                    <Leaf size={10} />
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]/40">Pack Size</div>
                                                            <span className="text-[10px] font-black">{extractVariantName(product.name)}</span>
                                                        </div>
                                                    )}
                                                </div>
        
                                                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-4 md:gap-8 pointer-events-auto">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xl md:text-2xl font-serif font-black text-[var(--color-primary)]">{formatPrice(product.price)}</span>
                                                        <div className="flex items-center gap-1.5 opacity-40">
                                                            <ShoppingBag size={10} />
                                                            <span className="text-[8px] font-black uppercase">In stock</span>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (!isLoggedIn) {
                                                                openAuthModal();
                                                                return;
                                                            }
                                                            addToCart({
                                                                _id: product._id,
                                                                name: product.name,
                                                                price: product.price,
                                                                image: product.images[0],
                                                                quantity: 1,
                                                                selectedWeight: extractVariantName(product.name)
                                                            });
                                                        }}
                                                        className="h-12 w-12 md:h-14 md:w-14 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20"
                                                    >
                                                        <ShoppingBag size={20} />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                });
                            })()}
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
            </main>
            <footer className="relative z-10 w-full border-t border-[var(--color-border)] bg-[var(--color-bg)] py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                    <Leaf className="text-[var(--color-primary)]" size={40} />
                    <h2 className="text-2xl font-serif text-[var(--color-text)] italic">Videeptha Foods</h2>
                    <p className="text-[var(--color-text)]/60 font-light">© 2026 Videeptha Foods. Rooted in Nature.</p>
                </div>
            </footer>
        </div>
    );
}
