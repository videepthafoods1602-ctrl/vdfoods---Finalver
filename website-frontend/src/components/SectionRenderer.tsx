import React from 'react';
import { motion } from 'framer-motion';
import type { Section } from '../types';
import BlockRenderer from './BlockRenderer';
import { cn } from '../utils/cn';

const SectionRenderer: React.FC<{ section: Section }> = ({ section }) => {
    const { layout, styles = {}, blocks, background_type, background_video, background_gradient, background_animation } = section;

    const renderBackground = () => {
        switch (background_type) {
            case 'video':
                return (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <video
                            autoPlay
                            loop
                            muted={background_video?.muted ?? true}
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ opacity: background_video?.opacity ?? 1 }}
                        >
                            <source src={background_video?.url} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black/20" /> {/* Overlay for better text readability */}
                    </div>
                );
            case 'gradient':
                const gradientStr = background_gradient?.type === 'radial'
                    ? `radial-gradient(circle, ${background_gradient.stops.join(', ')})`
                    : `linear-gradient(${background_gradient?.angle || '135deg'}, ${background_gradient?.stops.join(', ') || 'var(--color-bg), var(--color-surface)'})`;
                return (
                    <div
                        className="absolute inset-0"
                        style={{ background: gradientStr }}
                    />
                );
            case 'animation':
                if (background_animation?.type === 'mesh') {
                    return (
                        <div className="absolute inset-0 overflow-hidden bg-slate-950">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 90, 0],
                                    x: [0, 100, 0],
                                    y: [0, 50, 0],
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-1/2 -left-1/2 w-full h-full bg-[var(--color-primary)]/20 rounded-full blur-[120px]"
                            />
                            <motion.div
                                animate={{
                                    scale: [1.2, 1, 1.2],
                                    rotate: [90, 0, 90],
                                    x: [0, -100, 0],
                                    y: [0, -50, 0],
                                }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[var(--color-accent)]/20 rounded-full blur-[120px]"
                            />
                        </div>
                    );
                }
                return null;
            case 'image':
                return (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${styles.backgroundImage})` }}
                    />
                );
            default:
                return (
                    <div
                        className="absolute inset-0 transition-colors duration-500"
                        style={{ backgroundColor: styles.backgroundColor }}
                    />
                );
        }
    };

    return (
        <section
            className={cn(
                "relative py-24 overflow-hidden",
                layout === 'full' ? 'w-full' : 'max-w-7xl mx-auto px-6 mb-12 rounded-[2.5rem]'
            )}
        >
            {renderBackground()}

            <div className={cn(
                "relative z-10 grid gap-16",
                layout === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'
            )}>
                {blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
        </section>
    );
};

export default SectionRenderer;
