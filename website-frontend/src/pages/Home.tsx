import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Volume2, VolumeX, Sprout, Sun, Droplet, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Home() {
    // Media States
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);

    const { addToCart, formatPrice, locationData, refreshLocation } = useCart();
    const { isLoggedIn, openAuthModal } = useAuth();

    const heroVideoRef = useRef<HTMLVideoElement>(null);
    const philosophyVideoRef = useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        const fetchFavoritesData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const favRes = await fetch(`${API_URL}/favorites/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!favRes.ok) return;
                const favIds = await favRes.json();
                if (!Array.isArray(favIds) || favIds.length === 0) return;

                const prodRes = await fetch(`${API_URL}/products/?_cb=${new Date().getTime()}`);
                if (!prodRes.ok) return;
                const allProducts = await prodRes.json();

                const favData = allProducts.filter((p: any) => favIds.includes(p._id));
                setFavoriteProducts(favData);
            } catch (err) {
                console.error("Failed to fetch favorites:", err);
            }
        };



        fetchFavoritesData();
    }, []);

    const toggleAudio = () => {
        if (heroVideoRef.current) {
            heroVideoRef.current.muted = !heroVideoRef.current.muted;
            setIsVideoMuted(heroVideoRef.current.muted);
        }
    };

    const handlePhilosophyVideoHover = (isHovering: boolean) => {
        if (philosophyVideoRef.current) {
            philosophyVideoRef.current.muted = !isHovering;
        }
    };

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
    const flyInLeftVariant: any = {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };
    const flyInRightVariant: any = {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };
    const scaleVariant: any = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="bg-[var(--color-bg)] text-[var(--color-text)] overflow-x-hidden">
            <Header />

            {/* Main Hero */}
            <section className="relative min-h-[100svh] overflow-hidden flex items-center justify-center">
                {/* Background Video using user uploaded video5.mp4 */}
                <video
                    key="/assets/Video2.mp4"
                    ref={heroVideoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover z-0 blur-[3px] scale-[1.05] brightness-[0.85]"
                    poster="/assets/background.png"
                >
                    <source src="/assets/Video2.mp4" type="video/mp4" />
                </video>


                <motion.div
                    className="relative z-10 text-center px-4 pt-32 pb-16"
                    initial="hidden"
                    animate="visible"
                    variants={staggerVariants}
                >
                    {/* Floating Location Badge */}
                    <motion.div 
                        variants={fadeUpVariant}
                        className="mb-8 flex justify-center"
                    >
                        <button
                            onClick={refreshLocation}
                            className="group flex items-center gap-3 px-6 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full hover:bg-white/20 transition-all shadow-2xl"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center border border-[var(--color-primary)]/30 group-hover:scale-110 transition-transform">
                                <MapPin size={16} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 leading-none mb-1">Village Harvested for</p>
                                <p className="text-sm font-serif font-black text-white leading-none uppercase tracking-widest">
                                    {locationData?.city ? `${locationData.city}, ` : ''}{locationData?.country_name || 'Detecting Location...'}
                                </p>
                            </div>
                        </button>
                    </motion.div>
                    <motion.div variants={fadeUpVariant} className="relative inline-block mb-10">
                        {/* Sweeping Leaf Animation Wrapper */}
                        <div className="absolute -top-8 -left-4 md:-top-12 md:-left-8 pointer-events-none overflow-visible">
                            <motion.div
                                animate={{ rotate: [-5, 15, -5], x: [0, 15, 0], y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-10 h-10 md:w-16 md:h-16 text-[#4ea93b] opacity-90 drop-shadow-lg"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                                </svg>
                            </motion.div>
                        </div>

                        <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[5rem] font-black uppercase tracking-[2px] md:tracking-[6px] mb-3 drop-shadow-2xl text-[var(--color-secondary)]">
                            VIDEEPTHA FOODS
                        </h2>
                        <div 
                            className="text-3xl sm:text-4xl md:text-6xl text-[#1a202c] tracking-[-1px] mb-6 opacity-100 drop-shadow-md text-balance"
                            style={{ fontFamily: 'var(--font-namaste)', textTransform: 'none' }}
                        >
                            svastam prakrtham - snehitam
                        </div>
                    </motion.div>

                    <motion.p variants={fadeUpVariant} className="text-2xl sm:text-3xl md:text-4xl max-w-[950px] mx-auto mb-12 leading-relaxed font-medium text-[var(--color-text)] drop-shadow-md">
                        Grow stronger - live healthier.<br />
                        We do bring you a powerhouse in small packets for a better today tomorrow...
                    </motion.p>

                    <motion.div variants={fadeUpVariant} className="flex gap-4 justify-center items-center flex-wrap">
                        <Link to="/categories">
                            <motion.div
                                whileHover={{ scale: 1.05, x: 10 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-full font-bold tracking-widest uppercase text-sm shadow-xl"
                            >
                                The Taste of Truth
                            </motion.div>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Floating Mute/Unmute Icon for Hero Video */}
                <button
                    onClick={toggleAudio}
                    className="absolute bottom-10 right-10 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full w-14 h-14 flex items-center justify-center cursor-pointer shadow-2xl text-[var(--color-text)] backdrop-blur-md hover:bg-[var(--color-panel)] transition-colors"
                    aria-label={isVideoMuted ? 'Unmute Video' : 'Mute Video'}
                >
                    {isVideoMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
            </section>

            {/* Philosophy Section */}
            <section id="philosophy" className="py-24 px-6 bg-[var(--color-surface)]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={flyInLeftVariant}
                    >
                        <h3 className="text-[var(--color-primary)] uppercase tracking-widest font-black mb-4">Our Promise</h3>
                        <h2 className="font-serif text-4xl md:text-5xl font-black mb-8 text-[var(--color-text)]">Food Made With <span className="text-[var(--color-secondary)]">Love & Purity</span></h2>

                        <p className="text-lg text-[var(--color-text)]/80 leading-relaxed mb-6">
                            Ancient Indian culture views food (Anna) not just as physical fuel, but as a divine manifestation (Brahman) directly linked to the health of the body, mind, and the spirit. The lifestyle was based on Sattva (purity), moderation, and living in harmony with nature.
                        </p>

                        <p className="text-lg text-[var(--color-text)]/80 leading-relaxed">
                            At Videeptha , we look backwards to move forward. Our approach is grounded in Ayurvedic principles and ancient village wisdom. We meticulously research every raw material, working directly with soil-conscious farmers, and have worked meticulously on each and every recipe to bring better health and authentic taste to you and your family.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="bg-white rounded-[2rem] border border-[var(--color-border)] shadow-xl overflow-hidden"
                    >
                        <div className="p-8 pb-6">
                            <h3 className="font-serif text-center text-[var(--color-primary)] text-2xl mb-4 leading-relaxed font-bold">
                                अन्नं ब्रह्म रसो विष्णुः, भोक्ता देवो महेश्वरः।<br />
                                एवम् ज्ञात्वा तु यो भुङ्क्ते, अन्नदोषो न लिप्यते॥
                            </h3>
                            <p className="text-center italic mb-4 text-[var(--color-text)]/70">
                                "Food is Brahma, its taste is Vishnu, and the consumer is Shiva. Knowing this, the one who eats is not tainted by any impurities of the food."
                            </p>
                            <div className="w-12 h-[2px] bg-[var(--color-secondary)] mx-auto mb-4"></div>
                            <p className="text-center text-sm font-bold text-[var(--color-primary)] uppercase tracking-widest">— Bhojan Mantra (Common Mealtime Prayer)</p>
                        </div>
                        {/* Video 4 (Chanting/Mantra) - Muted by default, unmuting on hover */}
                        <div className="w-full border-t-2 border-[var(--color-border)]">
                            <video
                                ref={philosophyVideoRef}
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls
                                onMouseEnter={() => handlePhilosophyVideoHover(true)}
                                onMouseLeave={() => handlePhilosophyVideoHover(false)}
                                className="w-full h-auto block max-h-[400px] object-cover"
                            >
                                <source src="/assets/video4.mp4" type="video/mp4" />
                            </video>
                        </div>
                    </motion.div>
                </div>
            </section>



            {/* About Us Section */}
            <section id="about-us" className="py-24 px-6 bg-white text-[var(--color-text)]">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerVariants}
                        className="flex flex-col gap-10 text-center"
                    >
                        <motion.div variants={fadeUpVariant}>
                            <h2 className="text-5xl md:text-6xl text-[var(--color-primary)] mb-8 font-serif font-black">About Us</h2>

                            <p className="text-2xl text-[var(--color-text)]/90 leading-relaxed mb-6">
                                We, <strong className="text-[var(--color-secondary)] text-3xl font-black">Vidya – Pradeep</strong>, want to bring a unique blend of foods & a small healthy revolution in every kitchen.
                            </p>

                            <p className="text-2xl md:text-3xl text-[var(--color-secondary)] italic font-bold mb-12">
                                "Finding tasty & healthy food isn’t harder anymore."
                            </p>

                            <div className="bg-[#FFFFFF] p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-[var(--color-border)]">
                                <h3 className="text-4xl text-[#3b2416] mb-6 font-serif font-black">Food!!!!!</h3>
                                <p className="text-xl md:text-2xl text-[#1a1a1a]/80 leading-relaxed mb-8">
                                    A beautiful unsaid, unspoken, unsung expression.<br />
                                    But valued, celebrated, cherished, loved – enjoyed emotion.<br />
                                    My karma questioned me to a journey of finding the essence of my life.<br />
                                    And service is the only thing I can do to satisfy my soul.<br />
                                    And food is one such positive karma towards society.
                                </p>

                                <p className="text-2xl font-bold text-[var(--color-primary)] italic mb-6">
                                    "Fasten, speed up, get indulged in love of real food."
                                </p>

                                <p className="text-xl font-bold text-[var(--color-primary)] uppercase tracking-widest">— Love Vidya</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Sanskrit Quote Break */}
            <section className="py-32 px-6 bg-[var(--color-primary)] text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerVariants}
                    className="max-w-4xl mx-auto relative z-10"
                >
                    <motion.div variants={scaleVariant} className="text-4xl md:text-5xl mb-6 text-[var(--color-bg)] font-serif font-bold">
                        अहं वैश्वानरो भूत्वा प्राणिनां देहमाश्रितः।
                    </motion.div>
                    <motion.div variants={scaleVariant} className="text-xl md:text-2xl text-[var(--color-bg)]/80 italic font-medium">
                        "The Divine digests food in four ways within living beings." <br /> — Bhagavad Gita (15.14)
                    </motion.div>
                    <motion.p variants={flyInRightVariant} className="mt-10 text-lg md:text-xl text-[var(--color-bg)]/90 max-w-2xl mx-auto leading-relaxed">
                        Ancient Indian medicine emphasizes that the body is nourished by the "fire" of digestion. At Videeptha Foods, we honor this fire by preparing foods that are easy to digest, unpolished, and naturally potent.
                    </motion.p>
                </motion.div>
            </section>

            {/* Our Nature - Scrolling Grid / Marquee fallback */}
            <section id="our-nature" className="py-24 bg-[var(--color-surface)] overflow-hidden">
                <motion.h2
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant}
                    className="text-[var(--color-text)] text-4xl md:text-5xl font-black mb-16 text-center font-serif"
                >
                    Our Nature
                </motion.h2>

                <div className="relative z-10 w-full overflow-hidden py-12">
                    <div className="animate-marquee hover:pause-animation flex gap-6 px-6">
                        {/* Repeat items twice for seamless loop */}
                        {[1, 2].map((set) => (
                            <React.Fragment key={set}>
                                <div className="w-[280px] bg-[#FDF8F0] border border-[var(--color-border)] p-6 rounded-3xl shrink-0 hover:border-[var(--color-primary)] transition-colors shadow-sm hover:shadow-md">
                                    <Sprout size={40} className="text-[var(--color-accent)] mb-4" />
                                    <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                                        No <span className="font-bold text-[var(--color-secondary)]">Wheat</span> or <span className="font-bold text-[var(--color-secondary)]">Maida</span> fillers. Our millets retain their bran layer, providing maximum dietary fiber and slow-release energy.
                                    </p>
                                </div>
                                <div className="w-[280px] bg-[#F9F0E6] border-2 border-[var(--color-secondary)] p-6 rounded-3xl shrink-0 hover:border-[var(--color-primary)] transition-all shadow-xl hover:shadow-2xl scale-105 z-10 mx-2">
                                    <Sun size={48} className="text-[var(--color-secondary)] mb-4" />
                                    <p className="text-sm text-[var(--color-text)] leading-relaxed font-medium">
                                        Nature's best for your family. We use <span className="font-bold text-[var(--color-secondary)]">Zero Sugar</span>, <span className="font-bold text-[var(--color-secondary)]">Zero Maida</span>, <span className="font-bold text-[var(--color-secondary)]">Zero Wheat</span>, and <span className="font-bold text-[var(--color-secondary)]">Zero Tamarind</span>—only pure, unrefined natural alternatives.
                                    </p>
                                </div>
                                <div className="w-[280px] bg-[#FDF8F0] border border-[var(--color-border)] p-6 rounded-3xl shrink-0 hover:border-[var(--color-primary)] transition-colors shadow-sm hover:shadow-md">
                                    <ShieldCheck size={40} className="text-[var(--color-primary)] mb-4" />
                                    <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                                        We trace every ingredient back to the earth. By working <span className="font-bold text-[var(--color-secondary)]">Direct</span> with village farmers, we ensure fair trade and untampered crop quality.
                                    </p>
                                </div>
                                <div className="w-[280px] bg-[#FDF8F0] border border-[var(--color-border)] p-6 rounded-3xl shrink-0 hover:border-[var(--color-accent)] transition-colors shadow-sm hover:shadow-md">
                                    <Droplet size={40} className="text-[var(--color-accent)] mb-4" />
                                    <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                                        Wooden-churned (Chekku) oils and stone-ground flours. <span className="font-bold text-[var(--color-secondary)]">Zero</span> high-heat processing to preserve antioxidants.
                                    </p>
                                </div>
                                <div className="w-[280px] bg-[#FDF8F0] border border-[var(--color-border)] p-6 rounded-3xl shrink-0 hover:border-[var(--color-primary)] transition-colors shadow-sm hover:shadow-md">
                                    <Leaf size={40} className="text-[var(--color-primary)] mb-4" />
                                    <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                                        Food is spiritual fuel. Every recipe is <span className="font-bold text-[var(--color-secondary)]">Sattvic</span>—clean, natural, and specifically designed for family health.
                                    </p>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* Favorite Products Section */}
            {favoriteProducts.length > 0 && (
                <section className="py-24 px-6 bg-white border-t border-[var(--color-border)]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text)] font-serif mb-2">Your Saved Harvests</h2>
                                <p className="text-[var(--color-text)]/60 text-lg">Pick up right where you left off.</p>
                            </div>
                            <Link to="/products" className="hidden sm:flex text-[var(--color-primary)] font-black uppercase tracking-widest text-xs items-center gap-2 hover:translate-x-1 transition-transform">
                                View All Products <span className="text-lg">→</span>
                            </Link>
                        </div>

                        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 snap-x">
                            {favoriteProducts.map((product) => (
                                <motion.div
                                    key={product._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="min-w-[280px] max-w-[280px] snap-start bg-[var(--color-panel)] border border-[var(--color-border)] rounded-3xl p-5 hover:border-[var(--color-primary)]/50 transition-all hover:-translate-y-2 shadow-lg group flex flex-col"
                                >
                                    <Link to={`/products/${product._id}`} className="block w-full aspect-[4/5] rounded-2xl overflow-hidden mb-5 bg-white">
                                        <img
                                            src={product.images?.[0] || 'https://via.placeholder.com/300'}
                                            alt={product.name}
                                            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </Link>

                                    <div className="flex flex-col flex-1 mt-auto">
                                        <Link to={`/products/${product._id}`}>
                                            <h3 className="font-black font-serif text-xl text-[var(--color-text)] line-clamp-2 leading-tight group-hover:text-[var(--color-primary)] transition-colors">{product.name}</h3>
                                        </Link>
                                        <div className="text-[var(--color-primary)] font-black mt-2 mb-4">{formatPrice(product.price)}</div>

                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (!isLoggedIn) {
                                                    openAuthModal();
                                                    return;
                                                }
                                                addToCart({ ...product, price: product.price, image: product.images?.[0] || '', quantity: 1 });
                                            }}
                                            className="w-full py-3 bg-[var(--color-text)] text-white hover:bg-[var(--color-primary)] rounded-full font-bold uppercase tracking-widest text-xs transition-colors mt-auto shadow-md"
                                        >
                                            Add to Basket
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Explore All Products Banner */}
            <section className="bg-[var(--color-bg)] overflow-hidden border-t border-[var(--color-border)]">
                <div className="grid grid-cols-1 md:grid-cols-2 relative z-10 w-full min-h-[400px]">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative w-full h-64 md:h-full block overflow-hidden"
                    >
                        <img
                            src="/assets/background.png"
                            alt="Videeptha Foods Products Range"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-[var(--color-bg)]/80 pointer-events-none" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="p-12 md:p-20 flex flex-col justify-center border-l-0 md:border-l border-[var(--color-border)] z-10 bg-[var(--color-bg)]"
                    >
                        <h3 className="text-4xl md:text-5xl font-serif font-black text-[var(--color-primary)] mb-6 leading-tight">Discover Our Entire Range</h3>
                        <p className="text-[var(--color-text)]/80 text-xl font-medium mb-10 leading-relaxed">Explore over 600+ authentic, untouched products from the heart of our villages.</p>
                        <Link to="/categories">
                            <motion.div
                                whileHover={{ scale: 1.05, x: 15 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-[var(--color-secondary)] text-[var(--color-bg)] rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center self-start shadow-xl w-max"
                            >
                                WAY TO YOUR GRANDMA KITCHEN
                            </motion.div>
                        </Link>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
