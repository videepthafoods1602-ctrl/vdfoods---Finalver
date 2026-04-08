import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Instant is better for navigation to avoid jarring smooth scrolls
        });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
