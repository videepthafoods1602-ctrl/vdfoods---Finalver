import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Block } from '../types';
import { cn } from '../utils/cn';
import Magnetic from './Magnetic';

const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
    const { type, content = {}, styles = {}, animations } = block;

    const isVisible = true;

    if (!isVisible) return null;

    const animationProps = (() => {
        const { type: animType, delay = 0, duration = 0.5 } = animations || {};
        switch (animType) {
            case 'fade':
                return {
                    initial: { opacity: 0 },
                    whileInView: { opacity: 1 },
                    transition: { duration, delay }
                };
            case 'slide-up':
                return {
                    initial: { opacity: 0, y: 50 },
                    whileInView: { opacity: 1, y: 0 },
                    transition: { duration, delay }
                };
            case 'slide-down':
                return {
                    initial: { opacity: 0, y: -50 },
                    whileInView: { opacity: 1, y: 0 },
                    transition: { duration, delay }
                };
            case 'zoom':
                return {
                    initial: { opacity: 0, scale: 0.8 },
                    whileInView: { opacity: 1, scale: 1 },
                    transition: { duration, delay }
                };
            case 'bounce':
                return {
                    initial: { opacity: 0, scale: 0.3 },
                    whileInView: { opacity: 1, scale: 1 },
                    transition: { type: 'spring' as const, damping: 10, stiffness: 100, delay }
                };
            default:
                return {};
        }
    })();

    const commonStyles = {
        textAlign: content.alignment as any,
        color: styles.color,
        fontSize: styles.fontSize,
        ...styles
    };

    switch (type) {
        case 'text':
            return (
                <motion.div
                    {...animationProps}
                    className={cn("space-y-4")}
                    style={commonStyles}
                >
                    {content.heading && (
                        <h2 className="text-4xl md:text-6xl font-black" style={{ color: styles.color || 'inherit' }}>
                            {content.heading}
                        </h2>
                    )}
                    {content.body && (
                        <p className="text-lg opacity-80 max-w-2xl mx-auto" style={{ color: styles.color || 'inherit' }}>
                            {content.body}
                        </p>
                    )}
                </motion.div>
            );

        case 'image':
            return (
                <motion.div
                    {...animationProps}
                    className="rounded-3xl overflow-hidden shadow-2xl relative group"
                    style={{ ...styles, textAlign: content.alignment as any }}
                >
                    <img src={content.url} alt={content.alt || ''} className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700" />
                    {content.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white/80 text-sm font-medium italic">{content.caption}</p>
                        </div>
                    )}
                </motion.div>
            );

        case 'video':
            return (
                <motion.div
                    {...animationProps}
                    className="rounded-3xl overflow-hidden shadow-2xl relative group bg-black"
                    style={{ ...styles, textAlign: content.alignment as any }}
                >
                    <video
                        src={content.url}
                        poster={content.thumbnail}
                        muted={content.muted ?? true}
                        autoPlay={content.autoPlay ?? true}
                        loop={content.loop ?? true}
                        playsInline
                        className="w-full h-auto aspect-video object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    {content.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white/80 text-sm font-medium italic">{content.caption}</p>
                        </div>
                    )}
                </motion.div>
            );

        case 'button':
            const isInternal = content.linkType === 'internal' || (content.link && content.link.startsWith('/'));

            const buttonContent = (
                <Magnetic>
                    <motion.span
                        {...animationProps}
                        className="px-10 py-5 bg-[var(--color-primary)] text-[var(--color-bg)] font-black uppercase tracking-widest transition-all text-sm inline-block shadow-2xl shadow-[var(--color-primary)]/20 hover:brightness-110"
                        style={{
                            borderRadius: '100px',
                            backgroundColor: styles.backgroundColor,
                            color: styles.color
                        }}
                    >
                        {content.text}
                    </motion.span>
                </Magnetic>
            );

            return (
                <div className={cn("flex my-8", content.alignment === 'center' ? 'justify-center' : content.alignment === 'right' ? 'justify-end' : 'justify-start')}>
                    {isInternal ? (
                        <Link to={content.link || '#'}>
                            {buttonContent}
                        </Link>
                    ) : (
                        <a href={content.link || '#'} target="_blank" rel="noopener noreferrer">
                            {buttonContent}
                        </a>
                    )}
                </div>
            );

        default:
            return null;
    }
};

export default BlockRenderer;
