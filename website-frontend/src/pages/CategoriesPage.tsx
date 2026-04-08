import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { getCategoryImage, formatName } from '../utils/category_utils';
import { groupProductsWithVariants, extractVariantName } from '../utils/productUtils';
import type { Product } from '../types';


interface DbCategory {
    id: string;
    _id?: string;
    name: string;
    description: string;
    media_url?: string;
    parent_id?: string;
    subcategories?: any[];
}


interface ProductListRowProps {
    product: Product;
    isFavorite: boolean;
    toggleFavorite: (productId: string) => void;
    hideImage?: boolean;
}

const StandardProductListRow = ({ product, isFavorite, toggleFavorite, hideImage }: ProductListRowProps) => {
    const isLiquid = product.name.toLowerCase().match(/(oil|juice|syrup|squash|drops|liquid|kanji|soda|fizz)/);
    
    const quantities = isLiquid ? [
        { label: 'TRIAL 100ML', mult: 1 },
        { label: '250ML', mult: 2.5 },
        { label: '500ML', mult: 5 },
        { label: '750ML', mult: 7.5 },
        { label: '1L', mult: 10 },
        { label: '2.5L', mult: 25 },
    ] : [
        { label: 'TRIAL 100G', mult: 1 },
        { label: '250G', mult: 2.5 },
        { label: '500G', mult: 5 },
        { label: '750G', mult: 7.5 },
        { label: '1KG', mult: 10 },
        { label: '2.5KG', mult: 25 },
    ];

    const [selectedQty, setSelectedQty] = useState(quantities[2]); // Default 500g/500ml

    const { addToCart, formatPrice } = useCart();
    const { isLoggedIn, openAuthModal } = useAuth();

    const basePrice = product.price || 0.00;
    const finalPrice = (basePrice * selectedQty.mult).toFixed(2);
    
    const hasImage = !hideImage && (product.media_url || (product.images && product.images.length > 0));
    const imageUrl = product.media_url || (product.images && product.images[0]);

    return (
        <div className="w-full flex flex-col md:flex-row items-center justify-between bg-white border border-[var(--color-border)] rounded-[1.5rem] md:rounded-[2rem] p-4 md:px-6 md:py-3 shadow-sm hover:shadow-md transition-shadow gap-4 md:gap-0">
            {/* Left Section: Icon & Details */}
            <div className="flex items-center gap-4 md:gap-6 min-w-0 w-full md:flex-1">
                <div className="w-16 h-16 bg-[#eaf4ec] rounded-2xl flex items-center justify-center shrink-0 border border-[#c4e3cb] overflow-hidden">
                    {hasImage ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <Leaf className="text-[#84a98c]" size={24} />
                    )}
                </div>
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product._id);
                    }}
                    className={`transition-colors shrink-0 ${isFavorite ? 'text-red-500' : 'text-[var(--color-text)]/40 hover:text-red-500'}`}
                >
                    <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                </button>
                
                <div className="flex flex-col min-w-0 pr-4">
                    <h3 className="font-serif font-black text-[var(--color-text)] text-sm md:text-base leading-tight break-words">
                        {product.name}
                    </h3>
                    <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase text-[var(--color-text)]/50 mt-1">
                        Pure Village Heritage
                    </span>
                </div>
            </div>

        <div className="flex flex-col items-start w-full md:w-auto md:px-8 shrink-0 py-2 md:py-0 border-t md:border-t-0 md:border-l border-[var(--color-border)]/20 md:border-transparent">
                <span className="text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase text-[var(--color-text)]/40 md:text-[var(--color-text)]/60 mb-2 md:mb-3">
                    {product.attributes?.dropdown_options?.length ? 'SELECT VARIANT' : 'SELECT QUANTITY'}
                </span>
                <div className="flex flex-wrap gap-2 max-w-[320px]">
                    {product.attributes?.dropdown_options?.length ? (
                        <div className="relative w-full min-w-[140px]">
                            <select
                                value={selectedQty.label}
                                onChange={(e) => {
                                    const found = product.attributes?.dropdown_options?.indexOf(e.target.value);
                                    if (found !== undefined && found !== -1) {
                                        setSelectedQty({ label: e.target.value, mult: 1 });
                                    }
                                }}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[var(--color-border)] focus:border-[#3b7167] outline-none appearance-none cursor-pointer hover:bg-[var(--color-surface)] transition-colors w-full"
                            >
                                {product.attributes.dropdown_options.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Leaf size={10} />
                            </div>
                        </div>
                    ) : (
                        quantities.map(qty => {
                            const active = selectedQty.label === qty.label;
                            return (
                                <button
                                    key={qty.label}
                                    onClick={() => setSelectedQty(qty)}
                                    className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider transition-all border
                                        ${active 
                                            ? 'bg-[#3b7167] text-white border-[#3b7167] shadow-sm' 
                                            : 'bg-transparent text-[var(--color-text)]/60 border-[var(--color-border)] hover:border-[#3b7167]/50'
                                        }
                                    `}
                                >
                                    {qty.label}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 w-full md:w-auto md:shrink-0 md:pl-10 border-t md:border-t-0 md:border-l border-[var(--color-border)]/50 pt-3 md:pt-0">
                <div className="flex flex-col items-start md:items-center min-w-[70px] md:min-w-[80px]">
                    <span className="font-serif font-black text-xl md:text-2xl text-[#3b7167]">
                        {formatPrice(Number(finalPrice))}
                    </span>
                    <span className="text-[7px] md:text-[8px] font-black tracking-[0.2em] uppercase text-[var(--color-text)]/50 mt-0.5 md:mt-1">
                        FREE DELIVERY
                    </span>
                </div>

                <button 
                    onClick={() => {
                        if (!isLoggedIn) {
                            openAuthModal();
                            return;
                        }
                        addToCart({
                            _id: product._id,
                            name: product.name,
                            price: Number(finalPrice),
                            image: imageUrl || '',
                            quantity: 1,
                            selectedWeight: selectedQty.label,
                        });
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#111111] hover:bg-black text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full transition-all group shadow-lg md:shadow-xl"
                >
                    <ShoppingBag size={14} className="text-white/80 group-hover:text-white transition-colors" />
                    <span className="text-[9px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">Add to Cart</span>
                </button>
            </div>
        </div>
    );
};

interface GroupedProductListRowProps {
    product: Product;
    isFavorite: boolean;
    toggleFavorite: (productId: string) => void;
    variants: Product[];
    baseName: string;
    hideImage?: boolean;
}

const GroupedProductListRow = ({ product, isFavorite, toggleFavorite, variants, baseName, hideImage }: GroupedProductListRowProps) => {
    const [selectedId, setSelectedId] = useState(product._id);
    const activeProduct = variants.find(v => v._id === selectedId) || product;

    const { addToCart, formatPrice } = useCart();
    const { isLoggedIn, openAuthModal } = useAuth();

    const basePrice = activeProduct.price || 0.00;
    const finalPrice = basePrice.toFixed(2);

    const hasImage = !hideImage && (activeProduct.media_url || (activeProduct.images && activeProduct.images.length > 0));
    const imageUrl = activeProduct.media_url || (activeProduct.images && activeProduct.images[0]);

    return (
        <div className="w-full flex flex-col md:flex-row items-center justify-between bg-white border border-[var(--color-border)] rounded-[1.5rem] md:rounded-[2rem] p-4 md:px-6 md:py-5 shadow-sm hover:shadow-md transition-shadow gap-4 md:gap-0">
            {/* Left Section */}
            <div className="flex items-center gap-4 md:gap-6 min-w-0 w-full md:w-5/12">
                <div className="w-16 h-16 bg-[#eaf4ec] rounded-2xl flex items-center justify-center shrink-0 border border-[#c4e3cb] overflow-hidden">
                    {hasImage ? (
                        <img src={imageUrl} alt={baseName} className="w-full h-full object-cover" />
                    ) : (
                        <Leaf className="text-[#84a98c]" size={24} />
                    )}
                </div>
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(activeProduct._id);
                    }}
                    className={`transition-colors shrink-0 ${isFavorite ? 'text-red-500' : 'text-[var(--color-text)]/40 hover:text-red-500'}`}
                >
                    <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                </button>
                
                <div className="flex flex-col min-w-0 flex-1 pr-4">
                    <h3 className="font-serif font-black text-[var(--color-text)] text-sm md:text-lg leading-tight break-words">
                        {baseName}
                    </h3>
                    <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase text-[var(--color-text)]/50 mt-1">
                        Pure Village Heritage
                    </span>
                </div>
            </div>

            {/* Middle Section: Dropdown */}
            <div className="flex flex-col items-start w-full md:w-3/12 md:px-6 shrink-0 py-2 md:py-0 border-t md:border-t-0 md:border-l border-[var(--color-border)]/20">
                <span className="text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase text-[var(--color-text)]/40 md:text-[var(--color-text)]/60 mb-2 md:mb-3">
                    SELECT VARIANT
                </span>
                <div className="relative w-full min-w-[140px]">
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[var(--color-border)] focus:border-[#3b7167] outline-none appearance-none cursor-pointer hover:bg-[var(--color-surface)] transition-colors w-full"
                    >
                        {variants.map((v) => (
                            <option key={v._id} value={v._id}>
                                {extractVariantName(v)}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <Leaf size={10} />
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 w-full md:w-auto md:shrink-0 md:pl-10 border-t md:border-t-0 md:border-l border-[var(--color-border)]/50 pt-3 md:pt-0">
                <div className="flex flex-col items-start md:items-center min-w-[70px] md:min-w-[80px]">
                    <span className="font-serif font-black text-xl md:text-2xl text-[#3b7167]">
                        {formatPrice(Number(finalPrice))}
                    </span>
                    <span className="text-[7px] md:text-[8px] font-black tracking-[0.2em] uppercase text-[var(--color-text)]/50 mt-0.5 md:mt-1">
                        FREE DELIVERY
                    </span>
                </div>

                <button 
                    onClick={() => {
                        if (!isLoggedIn) {
                            openAuthModal();
                            return;
                        }
                        addToCart({
                            _id: activeProduct._id.split('_var_')[0],
                            name: activeProduct.name,
                            price: Number(activeProduct.price),
                            image: imageUrl || '',
                            quantity: 1,
                            selectedWeight: extractVariantName(activeProduct),
                        });
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#111111] hover:bg-black text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full transition-all group shadow-lg md:shadow-xl"
                >
                    <ShoppingBag size={14} className="text-white/80 group-hover:text-white transition-colors" />
                    <span className="text-[9px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">Add to Cart</span>
                </button>
            </div>
        </div>
    );
};

export default function CategoriesPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const parentId = searchParams.get('parent');

    const [categories, setCategories] = useState<DbCategory[]>([]);
    const [allCategories, setAllCategories] = useState<DbCategory[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [currentParent, setCurrentParent] = useState<DbCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);
    const { openAuthModal } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                fetch(`${API_URL}/categories/?_cb=${new Date().getTime()}`),
                fetch(`${API_URL}/products/?_cb=${new Date().getTime()}`)
            ]);

            const categoriesData = await categoriesRes.json();
            const productsData = await productsRes.json();

            const activeCats = categoriesData.filter((c: any) => c.is_active !== false);
            setAllCategories(activeCats);
            setAllProducts(productsData.filter((p: any) => p.is_active));

            if (parentId) {
                const found = activeCats.find((c: any) => c.id === parentId || c._id === parentId);
                setCurrentParent(found || null);
                setCategories(activeCats.filter((c: any) => c.parent_id === parentId));
            } else {
                setCurrentParent(null);
                setCategories(activeCats.filter((c: any) => !c.parent_id || c.parent_id === 'null'));
            }
        } catch (err) {
            console.error('Data fetching error:', err);
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
                const data = await res.json(); // API returns IDs
                setFavorites(data);
            }
        } catch (err) {
            console.error('Error fetching favorites:', err);
        }
    };

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

    useEffect(() => {
        fetchAllData();
        fetchFavorites();
        window.scrollTo(0, 0);
    }, [parentId]);


    const filteredProducts = useMemo(() => {
        if (!parentId) return [];
        // Show products belonging to the current category ID (subcategory or main category)
        return allProducts.filter(p => p.subcategory_id === parentId || (p.category_ids && p.category_ids.includes(parentId)));
    }, [parentId, allProducts]);


    const handleCategoryClick = (category: DbCategory) => {
        if (!category) return;

        // ✨ Precision Redundancy Detection: Cryptographic ID match + Strict Name match
        const targetId = category.id || category._id;
        const matches = allCategories.filter(cat => 
            cat.parent_id && targetId && (cat.parent_id === targetId)
        );
        
        const hasRedundantSub = matches.length === 1 && 
                               matches[0].name.toLowerCase().trim() === category.name.toLowerCase().trim();

        if (hasRedundantSub) {
            // Secure Drill-Through to the correct sub-harvest
            const subId = matches[0].id || matches[0]._id;
            navigate(`/categories?parent=${subId}`);
        } else {
            const currentId = category.id || category._id;
            navigate(`/categories?parent=${currentId}`);
        }
    };

    const resolveImageUrl = (url: string | undefined, name: string) => {
        return getCategoryImage(name, url);
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-[var(--color-bg)] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Leaf className="text-[var(--color-primary)]" size={64} />
                </motion.div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative bg-[var(--color-bg)] text-[var(--color-text)] font-sans min-h-screen selection:bg-[var(--color-primary)] selection:text-white pb-32">
            <Header />

            <main className="relative z-10 pt-44 pb-12 px-6">
                <div className="max-w-7xl mx-auto w-full">

                    {/* Header Section: Back Button + Title */}
                    <div className="relative mb-6 flex flex-col items-start md:items-center">
                        {/* Breadcrumbs / Back button */}
                        <AnimatePresence>
                            {parentId && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="w-full flex justify-start mb-4 md:mb-0"
                                >
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="md:absolute left-0 top-1.5 md:top-4 flex items-center gap-2 text-[var(--color-text)]/40 hover:text-[var(--color-primary)] font-black uppercase tracking-widest text-[9px] transition-colors text-left"
                                    >
                                        <ArrowLeft size={14} />
                                        <span className="hidden md:inline">Back to {currentParent?.parent_id ? 'Subcategories' : 'Main Collections'}</span>
                                        <span className="md:hidden">Back</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {parentId && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-center w-full"
                            >
                                <div className="flex flex-col items-center">
                                    <h1 className="text-3xl md:text-5xl font-black text-[var(--color-text)] mb-1 font-serif uppercase leading-tight">
                                        {currentParent ? (
                                            <><span className="italic text-[var(--color-primary)]">{formatName(currentParent.name)}</span></>
                                        ) : (
                                            <>Our <span className="italic text-[var(--color-primary)]">Collections</span></>
                                        )}
                                    </h1>
                                    <p className="text-sm md:text-base text-[var(--color-text)]/70 max-w-2xl mx-auto font-medium">
                                        {currentParent?.description || (parentId ? 'Detailed sub-categories for your selection.' : 'Select a category below to explore our specific harvests.')}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Category Display Logic */}
                    {!parentId ? (
                        /* Top Level: Arched Gallery Portals (Dynamic Unique Layout) */
                        <div className="w-full pt-6 md:pt-12 pb-40 px-4 md:px-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row items-center justify-center gap-6 md:gap-8 max-w-5xl mx-auto">
                                {categories.map((category, index) => {
                                    const isPremium = category.name.toLowerCase().includes('premium');
                                    let shopImage = isPremium ? '/assets/categories/vds_elite_heritage.png' : '/assets/categories/vds_base_heritage.png';
                                    const fallbackImage = isPremium 
                                        ? 'https://images.unsplash.com/photo-1583258292688-d50049448833?auto=format&fit=crop&q=80&w=1000' 
                                        : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000';
                                    
                                    const accentGlow = isPremium ? 'rgba(184,134,11,0.3)' : 'rgba(62,124,118,0.2)';
                                    
                                    return (
                                        <motion.div
                                            key={category.id}
                                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1, 
                                                y: [0, -15, 0], // Breathing animation
                                            }}
                                            transition={{ 
                                                opacity: { duration: 1.5, delay: index * 0.4 },
                                                scale: { duration: 1.5, delay: index * 0.4 },
                                                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                                            }}
                                            whileHover={{ scale: 1.05, rotateY: index === 0 ? 5 : -5, z: 50 }}
                                            className="relative w-full max-w-[280px] md:max-w-[320px] lg:flex-1 cursor-pointer perspective-1000 group mx-auto"
                                            onClick={() => handleCategoryClick(category)}
                                        >
                                            <div 
                                                className={`aspect-[3/4] rounded-t-[4rem] rounded-b-2xl overflow-hidden relative border-2 border-[var(--color-secondary)]/20 shadow-2xl transition-all duration-[800ms] group-hover:border-[var(--color-primary)]/40`}
                                                style={{
                                                    boxShadow: `0 50px 100px -20px ${accentGlow}`
                                                }}
                                            >
                                                <img
                                                    src={shopImage}
                                                    onError={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        if (img.src !== fallbackImage) img.src = fallbackImage;
                                                    }}
                                                    alt={formatName(category.name)}
                                                    className="w-full h-full object-cover object-top transition-all duration-[2000ms] group-hover:scale-110 group-hover:brightness-110"
                                                />
                                                
                                                {/* Floating Label revealed on hover */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-12">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-secondary)] mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                                                        {isPremium ? "Elite Harvest" : "Native Harvest"}
                                                    </p>
                                                    <h3 className="text-3xl font-serif font-black text-white uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform duration-700 delay-100">
                                                        {formatName(category.name)}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Luxury Glass Pedestal shadow */}
                                            <div className="absolute -bottom-10 left-10 right-10 h-10 bg-[var(--color-primary)]/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Sub Level: Boutique Editorial Gallery (Jewelry-Box Grid) */
                        <div className="w-full py-4 px-2 md:px-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-[1400px] mx-auto">
                                {categories.map((category, index) => {
                                    const catImage = resolveImageUrl(category.media_url, category.name);
                                    
                                    // 🎭 Editorial Staggering: Mixed aspect ratios
                                    const isPortrait = (index % 3 === 0);
                                    
                                    return (
                                        <motion.div
                                            key={category.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            transition={{ duration: 0.8, delay: (index % 4) * 0.1 }}
                                            className="relative group cursor-pointer"
                                            onClick={() => handleCategoryClick(category)}
                                        >
                                            <div className={`relative ${isPortrait ? 'aspect-[3/4]' : 'aspect-[4/5]'} rounded-[2rem] overflow-hidden shadow-xl border border-[var(--color-secondary)]/10 bg-[var(--color-panel)] transition-all duration-700 group-hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)]`}>
                                                <img 
                                                    src={catImage}
                                                    alt={formatName(category.name)}
                                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                                />
                                                
                                                {/* Elevated Glass Caption with reduced opacity for sub-level */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                                                
                                                <div className="absolute inset-0 p-4 flex flex-col justify-end items-start text-left">
                                                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                                                        <div className="flex items-center gap-2 mb-2 opacity-50">
                                                            <span className="w-4 h-[1.5px] bg-white rounded-full" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">
                                                                Detail
                                                            </span>
                                                        </div>
                                                        <h2 className="text-sm md:text-xl font-serif font-black text-white uppercase tracking-tight leading-tight group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                                                            {formatName(category.name)}
                                                        </h2>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                                
                            {/* Products List (if applicable) - ONLY shows if NO more categories exist for a pure drill-down experience */}
                            {categories.length === 0 && filteredProducts && filteredProducts.length > 0 && (
                                <div className="mt-12 px-2 md:px-6 w-full max-w-[1400px] mx-auto pb-8">
                                    <div className="flex flex-col gap-4 md:gap-5">
                                        {(() => {
                                            const grouped = groupProductsWithVariants(filteredProducts);
                                            return grouped.map((group) => {
                                                const hasDropdown = group.variants.some(v => v.attributes?.dropdown_options?.length) || group.variants.length > 1;
                                                if (hasDropdown) {
                                                    return (
                                                        <motion.div
                                                            key={group.baseName}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5 }}
                                                        >
                                                            <GroupedProductListRow 
                                                                product={group.defaultProduct} 
                                                                variants={group.variants}
                                                                baseName={group.baseName}
                                                                isFavorite={favorites.includes(group.defaultProduct._id)} 
                                                                toggleFavorite={toggleFavorite}
                                                                hideImage={
                                                                    currentParent?.name.toLowerCase().includes('premium special') && 
                                                                    group.baseName.toLowerCase().includes('chocolate')
                                                                }
                                                            />
                                                        </motion.div>
                                                    );
                                                }
                                                return (
                                                    <motion.div
                                                        key={group.defaultProduct._id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <StandardProductListRow 
                                                            product={group.defaultProduct} 
                                                            isFavorite={favorites.includes(group.defaultProduct._id)} 
                                                            toggleFavorite={toggleFavorite}
                                                            hideImage={
                                                                currentParent?.name.toLowerCase().includes('premium special') && 
                                                                group.defaultProduct.name.toLowerCase().includes('chocolate')
                                                            }
                                                        />
                                                    </motion.div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {categories.length === 0 && filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <Leaf className="mx-auto text-[var(--color-text)]/10 mb-4" size={48} />
                            <p className="text-xl text-[var(--color-text)]/40">No items found in this collection.</p>
                            {parentId && (
                                <button onClick={() => navigate(-1)} className="mt-4 text-[var(--color-primary)] font-black uppercase text-[10px] tracking-widest">Go Back</button>
                            )}
                        </div>
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
