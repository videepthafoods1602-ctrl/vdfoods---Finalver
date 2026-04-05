import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MousePointer2, ArrowRight } from 'lucide-react';

export default function HeroAlt() {
    return (
        <section className="relative min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden bg-[var(--color-bg)]">
            {/* Left Content Side */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-32 lg:py-0 z-10 relative">
                {/* Decorative Element */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-24 left-12 lg:left-24"
                >
                    <span className="text-[var(--color-primary)] font-black uppercase tracking-[0.3em] text-xs md:text-sm mb-4 block">
                        ESTD. 2024 • THE TASTE OF TRUTH
                    </span>
                    <div className="w-12 h-[2px] bg-[var(--color-primary)]"></div>
                </motion.div>

                <div className="max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="font-serif text-6xl md:text-8xl lg:text-[7rem] leading-[0.9] font-black text-[var(--color-text)] mb-6">
                            Ancient <br />
                            <span className="text-[var(--color-primary)] italic">Wisdom.</span>
                        </h1>
                        <div 
                            className="text-4xl md:text-5xl text-[var(--color-secondary)] tracking-tight mb-8 opacity-90"
                            style={{ fontFamily: 'var(--font-namaste)', textTransform: 'none' }}
                        >
                            svastam prakrtham - snehitam
                        </div>
                    </motion.div>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-[var(--color-text-dim)] mb-12 leading-relaxed max-w-md font-medium"
                    >
                        We bridge the gap between heritage village farms and your modern kitchen. Honest, untouched, and nutrient-dense foods for a vibrant life.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-6 items-start sm:items-center"
                    >
                        <Link to="/categories" className="group relative">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-10 py-5 bg-[var(--color-primary)] text-white rounded-full font-bold uppercase tracking-widest text-sm shadow-2xl flex items-center gap-3 overflow-hidden"
                            >
                                <span className="relative z-10 text-white">Explore Harvest</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10 text-white" />
                                <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </motion.div>
                        </Link>

                        <Link to="/stories" className="flex items-center gap-3 text-[var(--color-text)] font-black uppercase tracking-widest text-xs hover:text-[var(--color-primary)] transition-colors group">
                            <span className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-primary)] transition-colors">
                                <MousePointer2 className="w-4 h-4" />
                            </span>
                            Our Roots
                        </Link>
                    </motion.div>
                </div>

                {/* Vertical Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 left-12 lg:left-24 hidden lg:flex flex-col items-center gap-4"
                >
                    <div className="w-[1px] h-24 bg-gradient-to-b from-[var(--color-primary)] to-transparent"></div>
                    <span className="[writing-mode:vertical-lr] uppercase tracking-[0.5em] text-[10px] font-black text-[var(--color-text-dim)]">SCROLL TO DISCOVER</span>
                </motion.div>
            </div>

            {/* Right Visual Side */}
            <div className="flex-1 relative min-h-[50vh] lg:min-h-screen">
                <motion.div 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img 
                        src="/assets/background.png" 
                        alt="Heritage Village Grains" 
                        className="w-full h-full object-cover brightness-[0.9]"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-transparent to-transparent lg:block hidden"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-transparent to-transparent lg:hidden"></div>
                </motion.div>

                {/* Floating Product Cards */}
                <motion.div 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute top-1/4 -left-12 lg:-left-24 z-20 hidden lg:block"
                >
                    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-2xl max-w-[240px]">
                        <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-white shadow-inner">
                            <img src="/assets/ragi_balls_millet.png" alt="Ragi Millets" className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-serif font-black text-xl text-[var(--color-text)] mb-1">Finger Millets</h4>
                        <p className="text-xs text-[var(--color-text-dim)] font-medium leading-relaxed">Sourced directly from the red soils of Salem, Tamil Nadu.</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-1/4 right-12 z-20 hidden xl:block"
                >
                    <div className="bg-[var(--color-primary)] text-white p-8 rounded-[2.5rem] shadow-2xl max-w-[280px]">
                        <p className="text-2xl font-serif italic mb-4 leading-tight">"Finding tasty & healthy food isn’t harder anymore."</p>
                        <div className="flex items-center gap-4">
                            <div className="h-0.5 w-8 bg-white/50"></div>
                            <span className="uppercase text-[10px] font-black tracking-widest text-white/80">— LOVE VIDYA</span>
                        </div>
                    </div>
                </motion.div>

                {/* Decorative Circle */}
                <div className="absolute top-12 right-12 w-32 h-32 rounded-full border border-[var(--color-primary)]/20 animate-pulse hidden lg:block"></div>
            </div>

            {/* Mobile Badge */}
            <div className="lg:hidden absolute bottom-6 right-6 z-20">
                <div className="w-20 h-20 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white p-2 text-center shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-tighter">Pure Heritage</span>
                </div>
            </div>
        </section>
    );
}
