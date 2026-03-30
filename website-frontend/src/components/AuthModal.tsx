import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Auth from '../pages/Auth';

const AuthModal: React.FC = () => {
    const { isAuthModalOpen, closeAuthModal } = useAuth();

    return (
        <AnimatePresence>
            {isAuthModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9991] p-6 sm:p-4"
                    >
                        <div className="w-full max-w-lg pointer-events-auto relative">
                            {/* Close Button */}
                            <button
                                onClick={closeAuthModal}
                                className="absolute -top-4 -right-4 w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:border-primary/40 transition-all z-1"
                            >
                                <X size={20} />
                            </button>

                            {/* Auth Card wrapper to override local screen styles if needed */}
                            <div className="overflow-hidden rounded-3xl shadow-2xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                                <Auth isModal={true} />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
