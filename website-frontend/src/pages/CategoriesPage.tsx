import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Heart, ShoppingBag, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import { API_URL } from '../config';
import { getCategoryImage } from '../utils/category_utils';

interface DbCategory {
    id: string;
    _id?: string;
    name: string;
    description: string;
    media_url?: string;
    parent_id?: string;
    subcategories?: any[];
}

interface Product {
    id: string;
    _id: string;
    name: string;
    description: string;
    price: number;
    media_url?: string;
    weight?: string;
    images: string[];
    subcategory_id?: string;
    category_ids?: string[];
}

const ProductListRow = ({ product }: { product: Product }) => {
    // Detect liquid if name contains oil, juice, syrup, squash, drops, liquid
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

    // Location-based currency
    const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Asia/Kolkata') || Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Asia/Calcutta');
    const currency = isIndia ? '₹' : '$';

    const basePrice = product.price || 0.00;
    const finalPrice = (basePrice * selectedQty.mult).toFixed(2);
    
    // Determine image using the same helper from component scope (if imported at top level) or we can just use the product media_url directly
    const hasImage = product.media_url || (product.images && product.images.length > 0);
    const imageUrl = product.media_url || (product.images && product.images[0]);

    return (
        <div className="w-full flex items-center justify-between bg-white border border-[var(--color-border)] rounded-[2rem] px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
            {/* Left Section: Icon & Details */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
                <div className="w-16 h-16 bg-[#eaf4ec] rounded-2xl flex items-center justify-center shrink-0 border border-[#c4e3cb] overflow-hidden">
                    {hasImage ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <Leaf className="text-[#84a98c]" size={24} />
                    )}
                </div>
                
                <button className="text-[var(--color-text)]/40 hover:text-red-500 transition-colors shrink-0">
                    <Heart size={20} />
                </button>
                
                <div className="flex flex-col min-w-0 pr-4">
                    <h3 className="font-serif font-black text-[var(--color-text)] text-base truncate">
                        {product.name}
                    </h3>
                    <span className="text-[9px] font-black tracking-widest uppercase text-[var(--color-text)]/50 mt-1">
                        100% ORGANIC HERITAGE
                    </span>
                </div>
            </div>

            {/* Middle Section: Quantities */}
            <div className="flex flex-col items-start px-8 shrink-0">
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--color-text)]/60 mb-3">
                    SELECT QUANTITY
                </span>
                <div className="flex flex-wrap gap-2 max-w-[320px]">
                    {quantities.map(qty => {
                        const active = selectedQty.label === qty.label;
                        return (
                            <button
                                key={qty.label}
                                onClick={() => setSelectedQty(qty)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all border
                                    ${active 
                                        ? 'bg-[#3b7167] text-white border-[#3b7167]' 
                                        : 'bg-transparent text-[var(--color-text)]/60 border-[var(--color-border)] hover:border-[#3b7167]/50'
                                    }
                                `}
                            >
                                {qty.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-8 shrink-0 pl-10 border-l border-[var(--color-border)]/50">
                <div className="flex flex-col items-center min-w-[80px]">
                    <span className="font-serif font-black text-2xl text-[#3b7167]">
                        {currency}{finalPrice}
                    </span>
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase text-[var(--color-text)]/50 mt-1">
                        FREE DELIVERY
                    </span>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#1dd76b] flex items-center justify-center text-white cursor-pointer hover:bg-[#16bd5d] transition-colors shadow-lg shadow-[#1dd76b]/20">
                    <MessageCircle size={20} />
                </div>

                <button className="flex items-center gap-3 bg-[#111111] hover:bg-black text-white px-8 py-3.5 rounded-full transition-all group shadow-xl">
                    <ShoppingBag size={16} className="text-white/80 group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase">Add to Cart</span>
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
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                fetch(`${API_URL}/categories/`),
                fetch(`${API_URL}/products/`)
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

    useEffect(() => {
        fetchAllData();
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

            <main className="relative z-10 pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto w-full">

                    {/* Header Section: Back Button + Title */}
                    <div className="relative mb-6 flex flex-col items-center">
                        {/* Breadcrumbs / Back button */}
                        <AnimatePresence>
                            {parentId && (
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onClick={() => navigate(-1)}
                                    className="absolute left-0 top-1.5 md:top-4 flex items-center gap-2 text-[var(--color-text)]/40 hover:text-[var(--color-primary)] font-black uppercase tracking-widest text-[9px] transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                    <span className="hidden md:inline">Back to {currentParent?.parent_id ? 'Subcategories' : 'Main Collections'}</span>
                                    <span className="md:hidden">Back</span>
                                </motion.button>
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
                                            <>Explore <span className="italic text-[var(--color-primary)]">{currentParent.name}</span></>
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
                                                    alt={category.name}
                                                    className="w-full h-full object-cover object-top transition-all duration-[2000ms] group-hover:scale-110 group-hover:brightness-110"
                                                />
                                                
                                                {/* Floating Label revealed on hover */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-12">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-secondary)] mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                                                        {isPremium ? "Elite Harvest" : "Native Harvest"}
                                                    </p>
                                                    <h3 className="text-3xl font-serif font-black text-white uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform duration-700 delay-100">
                                                        {category.name}
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
                                                    alt={category.name}
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
                                                            {category.name}
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
                                <div className="flex flex-col gap-4 mt-12 px-6 w-full max-w-[1400px] mx-auto overflow-x-auto pb-8">
                                    <div className="min-w-[1100px] flex flex-col gap-5">
                                        {filteredProducts.map((product) => (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <ProductListRow product={product} />
                                            </motion.div>
                                        ))}
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
