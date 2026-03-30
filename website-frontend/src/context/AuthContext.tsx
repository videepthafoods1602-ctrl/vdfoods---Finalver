import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const API = `${API_URL}/accounts`;

export interface Profile {
    user_type: string;
    is_verified: boolean;
    profile_completed: boolean;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    customer_id?: string;
    plain_email?: string;
    country_code?: string;
    preferred_currency?: string;
    cart_data?: any[];
    addresses?: any[];
}

interface AuthUser {
    id: string;
    email: string;
    username: string;
    is_staff: boolean;
    profile?: Profile;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    isLoggedIn: boolean;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    login: (accessToken: string, refreshToken: string, userData?: AuthUser) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const setAuthHeaders = (token: string) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const clearAuthHeaders = () => {
        delete axios.defaults.headers.common['Authorization'];
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { setLoading(false); return; }
        try {
            setAuthHeaders(token);
            const { data } = await axios.get(`${API}/me/`);
            // Flatten: merge top-level user fields + profile nested
            setUser({ ...data.user, profile: data.profile });
        } catch {
            // Try refresh
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API}/token/refresh/`, { refresh_token: refreshToken });
                    localStorage.setItem('access_token', data.access_token);
                    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
                    setAuthHeaders(data.access_token);
                    const meRes = await axios.get(`${API}/me/`);
                    setUser({ ...meRes.data.user, profile: meRes.data.profile });
                } catch {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    clearAuthHeaders();
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const login = (accessToken: string, refreshToken: string, userData?: AuthUser) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        setAuthHeaders(accessToken);
        if (userData) setUser(userData);
        else refreshUser();
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        try {
            if (refreshToken) await axios.post(`${API}/logout/`, { refresh: refreshToken });
        } catch { /* ignore */ }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        clearAuthHeaders();
        setUser(null);
    };

    useEffect(() => {
        refreshUser();

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url && !originalRequest.url.includes('/token/refresh/')) {
                    originalRequest._retry = true;
                    try {
                        const refreshToken = localStorage.getItem('refresh_token');
                        if (refreshToken) {
                            const { data } = await axios.post(`${API}/token/refresh/`, { refresh_token: refreshToken });
                            localStorage.setItem('access_token', data.access_token);
                            if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
                            setAuthHeaders(data.access_token);
                            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(responseInterceptor);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isLoggedIn: !!user,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
