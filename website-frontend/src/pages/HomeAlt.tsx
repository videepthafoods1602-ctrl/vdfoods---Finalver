import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sprout, Sun, Droplet, ShieldCheck, Heart, ShoppingBag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroAlt from '../components/HeroAlt';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

export default function HomeAlt() {
    const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
    const { addToCart, formatPrice } = useCart();

    useEffect(() => {
        const fetchHighlights = async () => {
            try {
                const res = await fetch(`${API_URL}/products/`);
                if (!res.ok) return;
                const data = await res.json();
                // Just grab first 4 as "Highlights" for the alternative page
                setFavoriteProducts(data.slice(0, 4));
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };
        fetchHighlights();
    }, []);

    // Animation Variants
    const fadeUpVariant: any = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.3 }
        }
    };

    return (
        <div className="bg-[var(--color-bg)] text-[var(--color-text)] overflow-x-hidden selection:bg-[var(--color-primary)] selection:text-white">
            <Header />
            
            <HeroAlt />

            {/* Curated Collection Section */}
            <section className="py-32 px-6 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-end justify-between mb-20 gap-8">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerVariants}
                            className="max-w-2xl"
                        >
                            <motion.span variants={fadeUpVariant} className="text-[var(--color-primary)] font-black uppercase tracking-[0.3em] text-sm mb-4 block">
                                The Taste of Truth
                            </motion.span>
                            <motion.h2 variants={fadeUpVariant} className="font-serif text-5xl md:text-7xl font-black text-[var(--color-text)] leading-[1.1]">
                                Handpicked from the <span className="text-[var(--color-secondary)] italic">Heart</span> of Villages.
                            </motion.h2>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <Link to="/categories" className="px-10 py-5 border-[2px] border-[var(--color-text)] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[var(--color-text)] hover:text-white transition-all">
                                View Full Harvest
                            </Link>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {favoriteProducts.map((product: any, idx: number) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-[var(--color-surface)] mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                                    <img 
                                        src={product.images?.[0] || 'https://via.placeholder.com/600'} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {/* Action Buttons Overlay */}
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <button 
                                            onClick={() => addToCart({ ...product, quantity: 1, image: product.images?.[0] })}
                                            className="bg-white text-[var(--color-text)] p-4 rounded-full shadow-xl hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                                        >
                                            <ShoppingBag size={20} />
                                        </button>
                                        <button className="bg-white text-[var(--color-text)] p-4 rounded-full shadow-xl hover:text-red-500 transition-colors">
                                            <Heart size={20} />
                                        </button>
                                    </div>
                                    {/* Badge */}
                                    <div className="absolute top-6 right-6">
                                        <span className="bg-white/80 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            Heritage
                                        </span>
                                    </div>
                                </div>
                                <h3 className="font-serif text-2xl font-black text-[var(--color-text)] mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{product.name}</h3>
                                <p className="text-[var(--color-primary)] font-bold text-lg">{formatPrice(product.price)}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Philosophy Section - Alternative (Full Image Background) */}
            <section className="relative py-48 px-6 overflow-hidden">
                <div className="absolute inset-0">
                    <img src="/assets/indian_village_background.png" className="w-full h-full object-cover brightness-[0.4] grayscale-[0.2]" alt="Background" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                </div>

                <div className="max-w-4xl mx-auto relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <Sprout size={64} className="mx-auto mb-12 text-[var(--color-primary)] opacity-80" />
                        <h2 className="font-serif text-5xl md:text-7xl font-bold mb-12 leading-tight">
                            "Finding tasty & healthy food isn’t <span className="text-[var(--color-primary)] italic">harder</span> anymore."
                        </h2>
                        <p className="text-xl md:text-2xl font-medium text-white/80 mb-16 leading-relaxed max-w-2xl mx-auto">
                            At Videeptha, we look backwards to move forward. Our approach is grounded in Ayurvedic principles and ancient village wisdom.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 items-center justify-center opacity-60">
                            {[
                                { icon: ShieldCheck, text: "Zero Junk" },
                                { icon: Sun, text: "Zero Sugar" },
                                { icon: Droplet, text: "Natural Oils" },
                                { icon: Sprout, text: "Direct Farm" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-4">
                                    <item.icon size={32} />
                                    <span className="uppercase text-[10px] font-black tracking-[0.2em]">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Grid Story Section */}
            <section className="py-32 px-6 bg-[var(--color-surface)]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[800px]">
                        {/* Large Main Box */}
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-7 relative rounded-[3rem] overflow-hidden group shadow-2xl"
                        >
                            <img src="/assets/story_market.png" alt="Market" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-12">
                                <span className="text-[var(--color-primary)] font-black uppercase tracking-widest text-xs mb-4">Direct Connection</span>
                                <h3 className="text-4xl md:text-6xl text-white font-serif font-black mb-8">Empowering Village <br />Farmers Directly.</h3>
                                <Link to="/stories" className="text-white border-b-2 border-white/20 pb-2 w-max hover:border-[var(--color-primary)] transition-all font-bold">Discover Our Journey</Link>
                            </div>
                        </motion.div>

                        {/* Smaller Stacked Boxes */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <motion.div 
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex-1 relative rounded-[3rem] overflow-hidden group shadow-xl"
                            >
                                <img src="/assets/story_farmer.png" alt="Farmer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-8">
                                    <h3 className="text-3xl text-white font-serif font-black">Modern Ayurvedic <br />Principles</h3>
                                </div>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="flex-1 relative rounded-[3rem] overflow-hidden group shadow-xl"
                            >
                                <img src="/assets/story_cooking.png" alt="Cooking" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-8">
                                    <h3 className="text-3xl text-white font-serif font-black">Zero Maida <br />Fillers</h3>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
