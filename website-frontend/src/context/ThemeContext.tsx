import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
}

interface ThemeSettings {
    branding: {
        name: string;
        logo_url: string;
        ticker_text: string[];
        ticker_style: {
            bg_color?: string;
            text_color?: string;
            speed?: number;
        };
    };
    typography: {
        name: string;
        font_urls: {
            heading?: string;
            body?: string;
        };
        typography_settings: {
            headingFont?: string;
            bodyFont?: string;
        };
    };
    footer: {
        name: string;
        footer_contact: {
            phones?: { label: string; number: string }[];
            email?: string;
            whatsapp_group?: string;
            address?: string;
            social?: { platform: string; url: string }[];
        };
    };
    theme: {
        name: string;
        colors: ThemeColors;
        dark_mode_colors?: ThemeColors;
        light_mode_colors?: ThemeColors;
        button_styles: {
            borderRadius: string;
            padding: string;
            fontSize: string;
            fontWeight: string;
            textTransform: string;
        };
        global_background?: {
            type: 'color' | 'gradient' | 'animation';
            color: string;
            gradient: {
                type: string;
                angle: string;
                stops: string[];
            };
            animation: {
                type: string;
                intensity: string;
            };
        };
    };
}

interface ThemeContextType {
    mode: 'light' | 'dark';
    toggleMode: () => void;
    theme: ThemeSettings | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mode = 'dark';
    const [theme, setTheme] = useState<ThemeSettings | null>(null);

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const response = await fetch(`${API_URL}/theme/`);
                const data = await response.json();
                setTheme(data);
            } catch (error) {
                console.error('Failed to fetch theme:', error);
            }
        };
        fetchTheme();
    }, []);

    useEffect(() => {
        if (!theme) return;

        const root = document.documentElement;

        // Fonts logic
        const head = document.head;
        const fontId = 'dynamic-theme-fonts';
        let link = document.getElementById(fontId) as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            head.appendChild(link);
        }

        const typography = theme.typography;
        if (typography.font_urls?.heading || typography.font_urls?.body) {
            if (typography.font_urls.heading?.startsWith('http')) {
                link.href = typography.font_urls.heading;
            } else {
                const fontsToLoad = [];
                if (typography.typography_settings.bodyFont) fontsToLoad.push(typography.typography_settings.bodyFont);
                if (typography.typography_settings.headingFont) fontsToLoad.push(typography.typography_settings.headingFont);

                if (fontsToLoad.length > 0) {
                    const fontQuery = Array.from(new Set(fontsToLoad)).map(f => f.replace(/\s+/g, '+')).join('&family=');
                    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}:wght@300;400;500;600;700&display=swap`;
                }
            }
        }

        const currentTheme = theme.theme;
        const currentColors = currentTheme.dark_mode_colors || currentTheme.colors;

        // Apply Colors to CSS Variables
        root.style.setProperty('--color-primary', currentColors.primary);

        // Update RGB for transparency effects (e.g. for glows, overlays)
        if (currentColors.primary?.startsWith('#') && currentColors.primary.length === 7) {
            const r = parseInt(currentColors.primary.slice(1, 3), 16);
            const g = parseInt(currentColors.primary.slice(3, 5), 16);
            const b = parseInt(currentColors.primary.slice(5, 7), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
            }
        }
        root.style.setProperty('--color-secondary', '#7b3f00');
        root.style.setProperty('--color-accent', currentColors.accent);
        root.style.setProperty('--color-background', currentColors.background);
        root.style.setProperty('--color-bg', currentColors.background);
        root.style.setProperty('--color-surface', currentColors.surface);
        root.style.setProperty('--color-text', currentColors.text || '#ffffff');

        // Borders and Panels (dynamically adapt to text color for contrast)
        const textColor = currentColors.text || '#ffffff';
        root.style.setProperty('--color-border', `color-mix(in srgb, ${textColor} 15%, transparent)`);
        root.style.setProperty('--color-panel', `color-mix(in srgb, ${textColor} 5%, transparent)`);


        // Buttons
        if (currentTheme.button_styles) {
            root.style.setProperty('--radius-btn', currentTheme.button_styles.borderRadius);
            root.style.setProperty('--padding-btn', currentTheme.button_styles.padding);
            root.style.setProperty('--btn-font-size', currentTheme.button_styles.fontSize || '14px');
        }

        // Typography Names
        root.style.setProperty('--font-sans', typography.typography_settings.bodyFont || '"Outfit", "Inter", system-ui, sans-serif');
        root.style.setProperty('--font-serif', typography.typography_settings.headingFont || '"Cormorant Garamond", "Playfair Display", serif');
        root.style.setProperty('--font-mono', '"IBM Plex Mono", monospace');

        localStorage.setItem('theme-mode', 'dark');
    }, [theme]);

    const toggleMode = () => { /* No-op for now */ };

    return (
        <ThemeContext.Provider value={{ mode, toggleMode, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
