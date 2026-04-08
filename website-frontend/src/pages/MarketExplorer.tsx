import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Loader2, Sparkles, ShoppingBag, FilterX } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { deduplicateBy, getCategoryImage, formatName } from '../utils/category_utils';

interface Category {
    id: string;
    _id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    thumbnail_image_url?: string;
    banner_image_url?: string;
    banner_details?: {
        title?: string;
        subtitle?: string;
        description?: string;
    };
    category_id?: string;
    subcategories?: Category[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    dropdown?: string;
}

const MarketExplorer: React.FC = () => {
    const navigate = useNavigate();
    const { formatPrice } = useCart();
    const [searchParams] = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
    const [selectedMain, setSelectedMain] = useState<Category | null>(null);
    const [selectedSub, setSelectedSub] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/categories/`);
            // The API returns all categories; we filter for Level 1 (parent=null)
            const mainCats = data.filter((cat: Category) => !cat.parent_id);
            setCategories(deduplicateBy(mainCats, 'name'));

            // Handle Deep Linking (Optional)
            const mainId = searchParams.get('mainCategory');
            if (mainId) {
                const found = mainCats.find((c: Category) => c.id === mainId || c._id === mainId);
                if (found) {
                    setSelectedMain(found);
                    setViewLevel(2);
                }
            }
        } catch (err) {
            console.error("Failed to fetch categories", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (categoryId: string) => {
        setFetchingProducts(true);
        try {
            const { data } = await axios.get(`${API_URL}/products/?category=${categoryId}`);
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setFetchingProducts(false);
        }
    };

    const handleMainClick = (cat: Category) => {
        if (cat.subcategories && cat.subcategories.length > 0) {
            setSelectedMain(cat);
            setViewLevel(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // No subcategories? Go to Level 3 directly (showing products of Main)
            setSelectedMain(cat);
            setSelectedSub(null);
            setViewLevel(3);
            fetchProducts(cat.id || cat._id);
        }
    };

    const handleSubClick = (sub: Category) => {
        setSelectedSub(sub);
        setViewLevel(3);
        fetchProducts(sub.id || sub._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        if (viewLevel === 3) {
            if (selectedSub) {
                setViewLevel(2);
                setSelectedSub(null);
            } else {
                setViewLevel(1);
                setSelectedMain(null);
            }
        } else if (viewLevel === 2) {
            setViewLevel(1);
            setSelectedMain(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans pb-20">
            <Header />
            
            <main className="max-w-[1400px] mx-auto px-4 pt-32">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        {viewLevel > 1 && (
                            <button 
                                onClick={handleBack}
                                className="p-2 hover:bg-[var(--color-panel)] rounded-full transition-colors border border-[var(--color-border)]"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h1 className="text-4xl md:text-6xl font-black font-serif italic tracking-tight">
                            {viewLevel === 1 ? 'Discovery Lobby' : 
                             viewLevel === 2 ? (selectedMain ? formatName(selectedMain.name) : '') : 
                             formatName(selectedSub?.name || selectedMain?.name || '')}
                        </h1>
                    </div>
                    <p className="text-lg opacity-60 max-w-2xl">
                        {viewLevel === 1 
                            ? 'Our artisanal collections rooted in tradition, crafted for the modern wellness seeker.' 
                            : viewLevel === 2 
                            ? selectedMain?.banner_details?.description || `Explore our refined collection of ${selectedMain ? formatName(selectedMain.name) : ''}.`
                            : `Curated collection of ${formatName(selectedSub?.name || selectedMain?.name || '')} essentials.`}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {viewLevel === 1 ? (
                        <motion.div 
                            key="level-1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {/* "All Products" Card */}
                            <motion.div 
                                onClick={() => navigate('/products')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative h-[400px] rounded-[40px] overflow-hidden cursor-pointer group shadow-2xl border border-[var(--color-border)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-amber-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex flex-col justify-end p-10 z-10">
                                    <Sparkles className="text-white mb-4 animate-pulse" size={32} />
                                    <h2 className="text-4xl font-bold text-white mb-2 leading-tight">All Heritage<br/>Collections</h2>
                                    <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                                        Browse Everything <ChevronRight size={16} />
                                    </div>
                                </div>
                            </motion.div>

                            {categories.map((cat) => (
                                <motion.div 
                                    key={cat.id || cat._id}
                                    onClick={() => handleMainClick(cat)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative h-[400px] rounded-[40px] overflow-hidden cursor-pointer group shadow-lg border border-[var(--color-border)] bg-[var(--color-panel)]"
                                >
                                    <img 
                                        src={getCategoryImage(cat.name, cat.banner_image_url)} 
                                        alt={cat.name}
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    
                                    <div className="absolute inset-0 flex flex-col justify-end p-10 z-10 text-white">
                                        <h2 className="text-3xl font-black mb-2 font-serif">{formatName(cat.name)}</h2>
                                        <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-widest text-xs">
                                            {cat.subcategories?.length || 0} Specialties <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : viewLevel === 2 ? (
                        <motion.div 
                            key="level-2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-12"
                        >

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {selectedMain?.subcategories?.map((sub) => (
                                    <motion.div 
                                        key={sub.id || sub._id}
                                        onClick={() => handleSubClick(sub)}
                                        whileHover={{ y: -5 }}
                                        className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] cursor-pointer group shadow-sm hover:shadow-xl transition-all"
                                    >
                                        <div className="h-40 rounded-2xl bg-[var(--color-panel)] mb-6 overflow-hidden">
                                            <img 
                                                src={getCategoryImage(sub.name, sub.thumbnail_image_url)} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                alt={sub.name} 
                                            />
                                        </div>
                                        <h3 className="text-lg font-black leading-tight mb-2">{formatName(sub.name)}</h3>
                                        <p className="text-xs text-[var(--color-text-dim)] line-clamp-2">
                                            Explore our curated list of {(sub.name ? formatName(sub.name) : '').toLowerCase()} products.
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="level-3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-12"
                        >
                            {fetchingProducts ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-amber-500" size={40} />
                                    <p className="font-bold tracking-widest text-xs uppercase opacity-40">Gathering Heritage items...</p>
                                </div>
                            ) : products.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {products.map((product) => (
                                        <motion.div 
                                            key={product.id}
                                            className="bg-[var(--color-panel)] rounded-[32px] overflow-hidden border border-[var(--color-border)] shadow-sm group relative"
                                        >
                                            <div className="aspect-[4/5] bg-[var(--color-surface)] relative overflow-hidden">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-amber-500/20">
                                                        <ShoppingBag size={64} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                            </div>
                                            <div className="p-8">
                                                <h3 className="text-xl font-black mb-2 line-clamp-1">{product.name}</h3>
                                                <p className="text-sm opacity-60 mb-6 line-clamp-2 min-h-[40px]">{product.description || 'Traditional ingredients prepared with contemporary standards.'}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl font-black text-amber-500">{formatPrice(product.price || 0)}</span>
                                                    <button 
                                                        disabled
                                                        className="px-6 py-2 bg-[var(--color-border)] text-[var(--color-text-dim)] rounded-full text-xs font-bold uppercase tracking-wider cursor-not-allowed opacity-50"
                                                    >
                                                        Details Locked
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[var(--color-panel)] rounded-[40px] border border-dashed border-[var(--color-border)]">
                                    <FilterX className="text-amber-500/30" size={64} />
                                    <h3 className="text-2xl font-bold">No items found here yet</h3>
                                    <p className="text-[var(--color-text-dim)]">Our artisans are still preparing the best for this section.</p>
                                    <button onClick={handleBack} className="mt-4 text-amber-500 font-bold uppercase tracking-widest text-xs p-4 hover:bg-amber-500/10 rounded-2xl transition-all">Go Back</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default MarketExplorer;
