import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { API_URL } from '../config';
import {
    User, Mail, Shield, Lock,
    Eye, EyeOff, ArrowRight,
    Smartphone, MapPin, Key, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const API = `${API_URL}/accounts`;

const COUNTRY_CODES = [
    { code: '+91', name: 'India', flag: '🇮🇳', pattern: /^\d{10}$/ },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸', pattern: /^\d{10}$/ },
    { code: '+44', name: 'UK', flag: '🇬🇧', pattern: /^\d{10}$/ },
    { code: '+61', name: 'Australia', flag: '🇦🇺', pattern: /^\d{9,10}$/ },
    { code: '+81', name: 'Japan', flag: '🇯🇵', pattern: /^\d{10}$/ },
    { code: '+971', name: 'UAE', flag: '🇦🇪', pattern: /^\d{9}$/ },
    { code: '+65', name: 'Singapore', flag: '🇸🇬', pattern: /^\d{8}$/ },
];

// ── InputField (exact trial_1) ──────────────────────────────────────────────
const InputField = ({ icon: Icon, type, name, placeholder, value, onChange, isPassword = false, showPassword = false, setShowPassword, error }: any) => (
    <div className="space-y-1">
        <div className="relative group">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]/40 w-5 h-5 group-focus-within:text-[var(--color-primary)] transition-all duration-300 z-10" />
            <input
                name={name}
                type={isPassword ? (showPassword ? 'text' : 'password') : type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full !pl-14 !pr-12 py-3.5 bg-[var(--color-surface)] border-2 border-[var(--color-primary)]/5 rounded-2xl text-sm focus:border-[var(--color-primary)]/40 focus:bg-[var(--color-surface)] focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] outline-none transition-all duration-300 relative z-0 ${error ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : ''}`}
            />
            {isPassword && setShowPassword && (
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors z-10">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
        {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-red-400 font-bold ml-4 uppercase tracking-wider flex items-center gap-1">
                <span className="text-sm">⚠</span> {error}
            </motion.div>
        )}
    </div>
);

// ── PhoneInput (exact trial_1) ──────────────────────────────────────────────
const PhoneInput = ({ value, countryCode, onChange, onCountryChange, error }: any) => (
    <div className="space-y-1">
        <div className="flex gap-2">
            <div className="relative w-32 group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 z-10 pointer-events-none">
                    {COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🌏'}
                </div>
                <select value={countryCode} onChange={(e) => onCountryChange(e.target.value)}
                    className="vintage-input !pl-10 appearance-none w-full !pr-4 cursor-pointer">
                    {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                            {c.flag} {c.code}
                        </option>
                    ))}
                </select>
            </div>
            <div className="relative flex-1 group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 w-5 h-5 group-focus-within:text-primary transition-all duration-300 z-10" />
                <input
                    type="tel"
                    placeholder="Phone Number"
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                    className={`vintage-input w-full !pl-14 relative z-0 ${error ? 'border-red-500/50' : ''}`}
                />
            </div>
        </div>
        {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-red-400 font-bold ml-4 uppercase tracking-wider flex items-center gap-1">
                <span className="text-sm">⚠</span> {error}
            </motion.div>
        )}
    </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
export default function Auth({ mode = 'login', isModal = false }: { mode?: 'login' | 'signup', isModal?: boolean }) {
    const { login, closeAuthModal } = useAuth();
    const { currency } = useCart();
    console.log('Current currency:', currency);
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modes: 'login' | 'signup' | 'reset' | 'unlock'
    const [authMode, setAuthMode] = useState(mode === 'signup' ? 'signup' : 'login');
    // Methods: 'google' | 'email'
    const [method, setMethod] = useState('email');

    // Form state
    const { locationData } = useCart();

    // Form state
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', fullName: '',
        phone: '', countryCode: locationData?.country_code === 'IN' ? '+91' : '+1',
        country: locationData?.country_name || 'United States',
        state: locationData?.region || '',
        city: locationData?.city || '',
        pincode: '',
        street_address: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any>({});

    // Signup flow
    const [signupData, setSignupData] = useState({ step: 1, otp: '', preAuthToken: '' });
    // Reset / unlock flows
    const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '', otpSent: false });
    const [unlockData, setUnlockData] = useState({ email: '', otp: '', otpSent: false });
    const [showUnlockOption, setShowUnlockOption] = useState(false);

    // Profile completion (Google)
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [completionData, setCompletionData] = useState<any>({
        email: '', fullName: '', phone: '', countryCode: locationData?.country_code === 'IN' ? '+91' : '+1', avatarUrl: '',
        preAuthToken: '',
        country: locationData?.country_name || 'United States',
        state: locationData?.region || '',
        city: locationData?.city || '',
        pincode: '',
        street_address: ''
    });
    const [showReactivationModal, setShowReactivationModal] = useState(false);
    const [reactivationEmail, setReactivationEmail] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
    const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (areaSearch.length < 3) {
                setPlaceSuggestions([]);
                return;
            }
            setIsSearchingPlaces(true);
            try {
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(areaSearch)}&limit=5`);
                const data = await res.json();
                setPlaceSuggestions(data.features || []);
            } catch (err) {
                console.error('Photon API error:', err);
            } finally {
                setIsSearchingPlaces(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(debounce);
    }, [areaSearch]);

    // useRef to avoid stale closure in Google OAuth callback
    const authModeRef = useRef(authMode);
    useEffect(() => { authModeRef.current = authMode; }, [authMode]);

    // Update defaults when locationData finally arrives
    useEffect(() => {
        if (locationData && !formData.city && !formData.state) {
            setFormData(prev => ({
                ...prev,
                country: locationData.country_name || prev.country,
                countryCode: locationData.country_code === 'IN' ? '+91' : prev.countryCode,
                state: locationData.region || prev.state,
                city: locationData.city || prev.city
            }));
        }
        if (locationData && !completionData.city && !completionData.state) {
            setCompletionData((prev: any) => ({
                ...prev,
                country: locationData.country_name || prev.country,
                countryCode: locationData.country_code === 'IN' ? '+91' : prev.countryCode,
                state: locationData.region || prev.state,
                city: locationData.city || prev.city
            }));
        }
    }, [locationData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validatePhoneNumber = (phone: string, code: string) => {
        const country = COUNTRY_CODES.find(c => c.code === code);
        if (!phone) return 'Phone number is required';
        if (country && !country.pattern.test(phone)) return `Invalid format for ${country.name}. Check length.`;
        if (!/^\d{7,15}$/.test(phone)) return 'Invalid phone number length';
        return null;
    };

    const validateForm = () => {
        const errors: any = {};
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email address';
        if (authMode === 'signup' && signupData.step === 3) {
            const phoneError = validatePhoneNumber(formData.phone, formData.countryCode);
            if (phoneError) errors.phone = phoneError;
            if (!formData.fullName) errors.fullName = 'Name is required';
            if (!formData.country) errors.country = 'Country is required';
            if (!formData.state) errors.state = 'State is required';
            if (!formData.city) errors.city = 'City is required';
            if (!formData.pincode) errors.pincode = 'Pincode is required';
        }
        if (authMode === 'login' || (authMode === 'signup' && signupData.step === 3)) {
            if (formData.password) {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
                if (!passwordRegex.test(formData.password)) {
                    errors.password = 'Min 8 chars, upper, lower, number & symbol';
                }
            }
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateProfileCompletion = () => {
        const errors: any = {};
        const phoneError = validatePhoneNumber(completionData.phone, completionData.countryCode);
        if (phoneError) errors.phone = phoneError;
        if (!completionData.fullName) errors.fullName = 'Name is required';
        if (!completionData.country) errors.country = 'Country is required';
        if (!completionData.state) errors.state = 'State is required';
        if (!completionData.city) errors.city = 'City is required';
        if (!completionData.pincode) errors.pincode = 'Pincode is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const completeLogin = (data: any) => {
        // Store under 'access_token' — matches AuthContext.refreshUser() and Settings.tsx
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token || '');
        localStorage.setItem('user', JSON.stringify(data.profile || data));
        // Update global AuthContext state
        login(data.access_token, data.refresh_token || '', data.profile || data);
        const role = data.profile?.user_type;
        if (role === 'super_admin' || role === 'assistant_admin' || role === 'product_manager') {
            navigate('/admin');
        } else {
            if (isModal) {
                closeAuthModal();
            } else {
                navigate('/');
            }
        }
    };

    // ── Google OAuth ──────────────────────────────────────────────────────
    const handleGoogleSuccess = async (tokenResponse: any) => {
        setLoading(true); setError('');
        try {
            // Use ref so we always get the current tab (login vs signup)
            const action = authModeRef.current === 'login' ? 'signin' : 'signup';
            // GoogleLogin component returns 'credential' instead of 'access_token'
            const res = await axios.post(`${API}/login/google/`, {
                token: tokenResponse.credential,
                action,
                portal: 'website'
            });
            if (res.data.status === 'needs_reactivation') {
                setReactivationEmail(res.data.email);
                setShowReactivationModal(true);
                setLoading(false);
                return;
            }
            if (res.status === 202) {
                setCompletionData({
                    email: res.data.email,
                    fullName: res.data.full_name,
                    avatarUrl: res.data.avatar_url,
                    phone: '',
                    countryCode: '+91',
                    preAuthToken: res.data.pre_auth_token
                });
                setShowCompletionModal(true);
                setLoading(false);
                return;
            }
            completeLogin(res.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('Account does not exist. Please create an account first.');
            } else if (err.response?.status === 400 && err.response?.data?.error?.includes('already exists')) {
                setError('Account already exists. Please sign in instead.');
            } else {
                setError(err.response?.data?.error || 'Google Login Failed');
            }
        } finally {
            if (!showCompletionModal) setLoading(false);
        }
    };

    // ── Profile Completion ────────────────────────────────────────────────
    const handleProfileCompletion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateProfileCompletion()) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API}/complete-profile/`, {
                pre_auth_token: completionData.preAuthToken,
                phone: `${completionData.countryCode}${completionData.phone}`,
                full_name: completionData.fullName,
                country: completionData.country,
                state: completionData.state,
                city: completionData.city,
                pincode: completionData.pincode,
                street_address: completionData.street_address
            });
            completeLogin(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally { setLoading(false); }
    };

    // ── Email Login / Signup Init ─────────────────────────────────────────
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setError(''); setLoading(true);

        if (authMode === 'login') {
            try {
                const res = await axios.post(`${API}/login/`, {
                    email: formData.email,
                    password: formData.password,
                    portal: 'website'
                });
                if (res.data.status === 'needs_reactivation') {
                    setReactivationEmail(res.data.email);
                    setShowReactivationModal(true);
                    setLoading(false);
                    return;
                }
                completeLogin(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Login Failed');
                if (err.response?.status === 429) setShowUnlockOption(true);
            } finally { setLoading(false); }
            return;
        }

        if (authMode === 'signup') {
            try {
                await axios.post(`${API}/signup/init/`, { email: formData.email });
                setSignupData({ ...signupData, step: 2 });
                setSuccessMessage('Verification code sent.');
            } catch (err: any) {
                setError(err.response?.data?.error || 'Signup Failed');
            } finally { setLoading(false); }
        }
    };

    // ── Signup: Verify OTP ────────────────────────────────────────────────
    const handleSignupVerify = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            const res = await axios.post(`${API}/signup/verify/`, { email: formData.email, otp: signupData.otp });
            setSignupData({ ...signupData, step: 3, preAuthToken: res.data.pre_signup_token });
            setSuccessMessage('Email Verified!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification Failed');
        } finally { setLoading(false); }
    };

    // ── Signup: Complete ──────────────────────────────────────────────────
    const handleSignupComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true); setError('');
        try {
            const res = await axios.post(`${API}/signup/complete/`, {
                pre_signup_token: signupData.preAuthToken,
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
                phone: `${formData.countryCode}${formData.phone}`,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                pincode: formData.pincode,
                street_address: formData.street_address
            });

            // setSuccessMessage('Account created successfully! Please sign in with your credentials.');
            // setSignupData({ step: 1, otp: '', preAuthToken: '' });
            // setAuthMode('login');
            // // Clear passwords so they have to type it again
            // setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

            // Auto login after signup
            completeLogin(res.data);
        } catch (err: any) {
            setError(`Failed to create account: ${err.response?.data?.error || err.message || 'Unknown'}`);
        } finally { setLoading(false); }
    };

    // ── Password Reset ────────────────────────────────────────────────────
    const handlePasswordResetRequest = async () => {
        setLoading(true); setError('');
        try {
            const res = await axios.post(`${API}/password-reset/`, { email: resetData.email });
            setResetData({ ...resetData, otpSent: true });
            if (res.data.dev_otp) setSuccessMessage(`DEV MODE: Your reset code is ${res.data.dev_otp}`);
            else setSuccessMessage('Reset code sent! Check your email.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send reset code');
        } finally { setLoading(false); }
    };

    const handlePasswordResetConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetData.newPassword !== resetData.confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true); setError('');
        try {
            await axios.post(`${API}/password-reset-confirm/`, { email: resetData.email, otp: resetData.otp, new_password: resetData.newPassword });
            setSuccessMessage('Password reset successful! You can now login.');
            setAuthMode('login');
            setResetData({ email: '', otp: '', newPassword: '', confirmPassword: '', otpSent: false });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally { setLoading(false); }
    };

    // ── Unlock Account ────────────────────────────────────────────────────
    const handleUnlockRequest = async () => {
        setLoading(true); setError('');
        try {
            const res = await axios.post(`${API}/unlock/request/`, { email: unlockData.email || formData.email });
            setUnlockData({ ...unlockData, otpSent: true, email: unlockData.email || formData.email });
            if (res.data.dev_otp) setSuccessMessage(`DEV MODE: Unlock code is ${res.data.dev_otp}`);
            else setSuccessMessage('Unlock code sent.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send unlock code');
        } finally { setLoading(false); }
    };

    const handleUnlockConfirm = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            await axios.post(`${API}/unlock/confirm/`, { email: unlockData.email, otp: unlockData.otp });
            setSuccessMessage('Account unlocked!');
            setAuthMode('login');
            setShowUnlockOption(false);
            setUnlockData({ email: '', otp: '', otpSent: false });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to unlock account');
        } finally { setLoading(false); }
    };

    const handleReactivation = async (action: 'restore' | 'wipe') => {
        setLoading(true); setError('');
        try {
            const res = await axios.post(`${API}/reactivate/`, { email: reactivationEmail, action });
            completeLogin(res.data);
            setShowReactivationModal(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Reactivation Failed');
        } finally { setLoading(false); }
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className={`${isModal ? '' : 'min-h-screen'} flex items-center justify-center p-4 relative overflow-hidden`}>
            {/* Background glows — same as trial_1 */}
            {!isModal && (
                <>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full pointer-events-none z-0" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0" />
                </>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-lg relative z-20 mx-auto"
            >
                {/* ── Profile Completion Modal ── */}
                {showCompletionModal ? (
                    <div className="vintage-panel p-8 min-h-[500px] flex flex-col relative overflow-visible">
                        <div className="text-center mb-8 relative z-10">
                            <h2 className="text-3xl font-bold text-primary mb-2 font-serif">Complete Profile</h2>
                            <p className="text-white/50 text-sm italic">Review and add your details</p>
                        </div>
                        <form onSubmit={handleProfileCompletion} className="space-y-6 relative z-10">
                            {completionData.avatarUrl && (
                                <div className="flex justify-center mb-4">
                                    <img src={completionData.avatarUrl} alt="Avatar"
                                        className="w-24 h-24 rounded-full border-4 border-primary shadow-lg" />
                                </div>
                            )}
                            <InputField icon={User} type="text" name="fullName" placeholder="Full Name"
                                value={completionData.fullName}
                                onChange={(e: any) => setCompletionData({ ...completionData, fullName: e.target.value })}
                                error={validationErrors.fullName} />
                            <PhoneInput value={completionData.phone} countryCode={completionData.countryCode}
                                onChange={(val: string) => setCompletionData({ ...completionData, phone: val })}
                                onCountryChange={(code: string) => setCompletionData({ ...completionData, countryCode: code })}
                                error={validationErrors.phone} />

                            <div className="relative group mb-4">
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 w-5 h-5 group-focus-within:text-primary transition-all duration-300 z-10" />
                                        <input
                                            type="text"
                                            placeholder="Search Area / Landmark..."
                                            value={areaSearch}
                                            onChange={(e) => {
                                                setAreaSearch(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            className="vintage-input w-full !pl-14 relative z-0"
                                        />
                                    </div>
                                    {showSuggestions && (areaSearch.length > 2 || placeSuggestions.length > 0) && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] border border-primary/20 rounded-2xl shadow-2xl z-[60] overflow-hidden backdrop-blur-3xl">
                                            {isSearchingPlaces ? (
                                                <div className="p-4 text-center">
                                                    <Loader2 className="animate-spin text-amber-400 mx-auto" size={16} />
                                                </div>
                                            ) : placeSuggestions.length > 0 ? (
                                                <>
                                                    {placeSuggestions.map((feat, idx) => {
                                                        const { name, city, state, country, postcode } = feat.properties;
                                                        const label = [name, city, state, country].filter(Boolean).join(', ');
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setCompletionData({
                                                                        ...completionData,
                                                                        city: city || name || '',
                                                                        state: state || '',
                                                                        country: country || locationData?.country_name || 'United States',
                                                                        pincode: postcode || '',
                                                                        street_address: label
                                                                    });
                                                                    setAreaSearch(label);
                                                                    setShowSuggestions(false);
                                                                }}
                                                                 className="w-full text-left px-6 py-3 hover:bg-[var(--color-primary)]/10 text-xs text-[var(--color-text)] opacity-80 hover:text-[var(--color-text)] transition-all flex items-center gap-3 border-b border-[var(--color-border)]/10 last:border-0"
                                                            >
                                                                <MapPin size={14} className="text-amber-400 shrink-0" />
                                                                <span className="truncate">{label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </>
                                            ) : areaSearch.length > 2 && (
                                                <div className="p-4 text-center text-[10px] text-white/40 italic">No matches found.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField icon={Shield} type="text" name="country" placeholder="Country *"
                                    value={completionData.country}
                                    onChange={(e: any) => setCompletionData({ ...completionData, country: e.target.value })}
                                    error={validationErrors.country} />
                                <InputField icon={Shield} type="text" name="state" placeholder="State/Region *"
                                    value={completionData.state}
                                    onChange={(e: any) => setCompletionData({ ...completionData, state: e.target.value })}
                                    error={validationErrors.state} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField icon={Shield} type="text" name="city" placeholder="City"
                                    value={completionData.city}
                                    onChange={(e: any) => setCompletionData({ ...completionData, city: e.target.value })}
                                    error={validationErrors.city} />
                                <InputField icon={Shield} type="text" name="pincode" placeholder="Pincode/Zip"
                                    value={completionData.pincode}
                                    onChange={(e: any) => setCompletionData({ ...completionData, pincode: e.target.value })}
                                    error={validationErrors.pincode} />
                            </div>
                            <InputField icon={Shield} type="text" name="street_address" placeholder="Street Address"
                                value={completionData.street_address}
                                onChange={(e: any) => setCompletionData({ ...completionData, street_address: e.target.value })} />

                            {error && <div className="text-red-400 text-xs text-center font-serif">❖ {error}</div>}
                            <button type="submit" disabled={loading}
                                className="w-full btn-primary hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                                {loading ? 'Processing...' : 'Complete Sign In'} <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className={`${isModal ? 'min-h-0 py-6' : 'min-h-[600px] py-12'} vintage-panel flex flex-col relative overflow-visible border-2 border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>

                        {/* Royal inner border decoration */}
                        <div className="absolute inset-1 border border-primary/5 rounded-2xl pointer-events-none z-0" />

                        {/* ── Tab Switcher (exact trial_1) ── */}
                        <div className="flex justify-center gap-8 py-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] rounded-t-[inherit]">
                            <button
                                onClick={() => { setAuthMode('login'); setMethod('email'); setError(''); setSuccessMessage(''); setShowUnlockOption(false); }}
                                className={`text-sm font-bold uppercase tracking-[0.2em] font-serif transition-all relative px-4 ${authMode === 'login' ? 'text-primary scale-110' : 'text-[var(--color-text)]/60 hover:text-primary/70'}`}
                            >
                                Sign In
                                {authMode === 'login' && <motion.div layoutId="tab-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_var(--color-primary)]" />}
                            </button>
                            <button
                                onClick={() => { setAuthMode('signup'); setMethod('email'); setError(''); setSuccessMessage(''); setShowUnlockOption(false); setSignupData({ step: 1, otp: '', preAuthToken: '' }); }}
                                className={`text-sm font-bold uppercase tracking-[0.2em] font-serif transition-all relative px-4 ${authMode === 'signup' ? 'text-secondary scale-110' : 'text-[var(--color-text)]/60 hover:text-secondary/70'}`}
                            >
                                Create Account
                                {authMode === 'signup' && <motion.div layoutId="tab-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-secondary shadow-[0_0_15px_var(--color-secondary)]" />}
                            </button>
                        </div>

                        <div className="p-6 sm:p-10 flex-1 flex flex-col bg-transparent relative z-10">

                            {/* Title */}
                            <div className={`text-center ${isModal ? 'mb-6' : 'mb-10'}`}>
                                <p className="text-[var(--color-text)]/50 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-sans">Secure • Verified • Encrypted</p>
                            </div>

                            {/* Alerts */}
                            <AnimatePresence>
                                {(location.state as any)?.from === '/checkout' && !error && !successMessage && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        className="mb-6 bg-primary/10 border border-primary/30 text-primary-light text-xs p-3 rounded text-center font-serif overflow-hidden">
                                        <span className="mr-2">❖</span>Please Sign In or Create an Account to proceed with your checkout.
                                    </motion.div>
                                )}
                                {error && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        className="mb-6 bg-red-950/50 border border-red-500/30 text-red-200 text-xs p-3 rounded text-center font-serif overflow-hidden">
                                        <span className="mr-2">❖</span>{error}
                                    </motion.div>
                                )}
                                {successMessage && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        className="mb-6 bg-green-950/50 border border-green-500/30 text-green-200 text-xs p-3 rounded text-center font-serif overflow-hidden">
                                        <span className="mr-2">❖</span>{successMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Unlock Banner */}
                            {showUnlockOption && authMode === 'login' && (
                                <button onClick={() => { setAuthMode('unlock'); setError(''); }}
                                    className="w-full mb-6 py-2 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/10 transition-all uppercase tracking-wider">
                                    Account Locked — Click to Unlock
                                </button>
                            )}

                            {/* Method Selector (hidden during signup steps 2/3) */}
                            {!(authMode === 'signup' && signupData.step > 1) && (authMode === 'login' || authMode === 'signup') && (
                                <div className="flex gap-4 mb-8">
                                    <button onClick={() => setMethod('google')}
                                        className={`flex-1 py-3 rounded border transition-all text-xs font-bold uppercase tracking-wider ${method === 'google' ? 'bg-[var(--color-surface)] border-[var(--color-primary)] text-[var(--color-primary)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text)]/40 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'}`}>
                                        Google
                                    </button>
                                    <button onClick={() => setMethod('email')}
                                        className={`flex-1 py-3 rounded border transition-all text-xs font-bold uppercase tracking-wider ${method === 'email' ? 'bg-[var(--color-surface)] border-[var(--color-primary)] text-[var(--color-primary)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text)]/40 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'}`}>
                                        Email
                                    </button>
                                </div>
                            )}

                            <div className="flex-1">
                                {/* ── Google Method ── */}
                                {method === 'google' && (
                                    <div className="space-y-4 py-8">
                                        <div className="flex justify-center w-full">
                                            <GoogleLogin
                                                onSuccess={handleGoogleSuccess}
                                                onError={() => setError('Google Login Failed')}
                                                theme="filled_black"
                                                size="large"
                                                type="standard"
                                                shape="rectangular"
                                                text="continue_with"
                                            />
                                        </div>
                                        {loading && <div className="text-center text-white/40 text-xs">Processing...</div>}
                                        <div className="text-center text-[10px] text-[var(--color-text)]/40 uppercase tracking-widest font-bold">Encrypted OAuth 2.0</div>
                                    </div>
                                )}

                                {/* ── Email Method ── */}
                                {method === 'email' && (
                                    <>
                                        {/* LOGIN */}
                                        {authMode === 'login' && (
                                            <form onSubmit={handleEmailAuth} className="space-y-6">
                                                <InputField icon={Mail} type="email" name="email" placeholder="Email Address"
                                                    value={formData.email} onChange={handleInputChange} error={validationErrors.email} />
                                                <div className="space-y-1">
                                                    <InputField icon={Key} type="password" name="password" placeholder="Password"
                                                        value={formData.password} onChange={handleInputChange}
                                                        isPassword showPassword={showPassword} setShowPassword={setShowPassword}
                                                        error={validationErrors.password} />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative w-4 h-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] group-hover:border-primary transition-colors flex items-center justify-center">
                                                                <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer peer" />
                                                                <div className="w-2 h-2 bg-primary rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                            </div>
                                                            <span className="text-[10px] text-[var(--color-text)]/60 group-hover:text-[var(--color-text)] transition-colors uppercase tracking-wider">Keep me signed in</span>
                                                        </label>
                                                        <button type="button" onClick={() => { setAuthMode('reset'); setError(''); setSuccessMessage(''); }}
                                                            className="text-[10px] text-[var(--color-text)]/60 hover:text-primary transition-colors uppercase tracking-wider">
                                                            Forgot Password?
                                                        </button>
                                                    </div>
                                                </div>
                                                <button type="submit" disabled={loading} className="w-full btn-primary mt-6">
                                                    {loading ? 'Processing...' : 'Sign In'} <ArrowRight size={18} />
                                                </button>
                                                <p className="text-center text-xs text-[var(--color-text)]/60 mt-6 font-serif">
                                                    Don't have an account?{' '}
                                                    <button type="button" onClick={() => { setAuthMode('signup'); setMethod('email'); setError(''); setSuccessMessage(''); setSignupData({ step: 1, otp: '', preAuthToken: '' }); }} className="text-[var(--color-secondary)] font-bold hover:underline uppercase tracking-wider">
                                                        Create Account
                                                    </button>
                                                </p>
                                            </form>
                                        )}

                                        {/* SIGNUP */}
                                        {authMode === 'signup' && (
                                            <>
                                                {/* Step 1: Email */}
                                                {signupData.step === 1 && (
                                                    <form onSubmit={handleEmailAuth} className="space-y-6">
                                                        <InputField icon={Mail} type="email" name="email" placeholder="Email Address"
                                                            value={formData.email} onChange={handleInputChange} error={validationErrors.email} />
                                                        <button type="submit" disabled={loading} className="w-full btn-primary">
                                                            {loading ? 'Processing...' : 'Begin Registration'}
                                                        </button>
                                                    </form>
                                                )}

                                                {/* Step 2: OTP */}
                                                {signupData.step === 2 && (
                                                    <form onSubmit={handleSignupVerify} className="space-y-6">
                                                        <div className="text-center text-accent font-serif mb-4">
                                                            A mystical code has been sent to your email
                                                        </div>
                                                        <InputField icon={Key} type="text" name="signupOtp" placeholder="Verification Code"
                                                            value={signupData.otp}
                                                            onChange={(e: any) => setSignupData({ ...signupData, otp: e.target.value })}
                                                            error={validationErrors.otp} />
                                                        <button type="submit" disabled={loading} className="w-full btn-accent">
                                                            {loading ? 'Processing...' : 'Verify Identity'}
                                                        </button>
                                                    </form>
                                                )}

                                                {/* Step 3: Details */}
                                                {signupData.step === 3 && (
                                                    <form onSubmit={handleSignupComplete} className="space-y-5">
                                                        {/* Avatar upload (visual) */}
                                                        <div className="flex justify-center mb-2">
                                                            <label className="relative cursor-pointer group">
                                                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                                                                    {completionData.avatarUrl
                                                                        ? <img src={completionData.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                                                                        : <User className="text-white/30" />}
                                                                </div>
                                                                <div className="absolute bottom-0 right-0 bg-primary text-black p-1 rounded-full">
                                                                    <span className="text-[10px] block">+</span>
                                                                </div>
                                                                <input type="file" className="hidden" accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) setCompletionData({ ...completionData, avatarUrl: URL.createObjectURL(file) });
                                                                    }} />
                                                            </label>
                                                        </div>
                                                        <InputField icon={User} type="text" name="fullName" placeholder="Full Name"
                                                            value={formData.fullName}
                                                            onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                                                            error={validationErrors.fullName} />
                                                        <PhoneInput value={formData.phone} countryCode={formData.countryCode}
                                                            onChange={(val: string) => setFormData({ ...formData, phone: val })}
                                                            onCountryChange={(code: string) => setFormData({ ...formData, countryCode: code })}
                                                            error={validationErrors.phone} />

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <InputField icon={Shield} type="text" name="country" placeholder="Country *"
                                                                value={formData.country}
                                                                onChange={(e: any) => setFormData({ ...formData, country: e.target.value })}
                                                                error={validationErrors.country} />
                                                            <InputField icon={Shield} type="text" name="state" placeholder="State/Region *"
                                                                value={formData.state}
                                                                onChange={(e: any) => setFormData({ ...formData, state: e.target.value })}
                                                                error={validationErrors.state} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <InputField icon={Shield} type="text" name="city" placeholder="City *"
                                                                value={formData.city}
                                                                onChange={(e: any) => setFormData({ ...formData, city: e.target.value })}
                                                                error={validationErrors.city} />
                                                            <InputField icon={Shield} type="text" name="pincode" placeholder="Pincode/Zip *"
                                                                value={formData.pincode}
                                                                onChange={(e: any) => setFormData({ ...formData, pincode: e.target.value })}
                                                                error={validationErrors.pincode} />
                                                        </div>
                                                        <InputField icon={Shield} type="text" name="street_address" placeholder="Street Address"
                                                            value={formData.street_address}
                                                            onChange={(e: any) => setFormData({ ...formData, street_address: e.target.value })} />

                                                        <InputField icon={Lock} type="password" name="password" placeholder="Password"
                                                            value={formData.password} onChange={handleInputChange}
                                                            isPassword showPassword={showPassword} setShowPassword={setShowPassword}
                                                            error={validationErrors.password} />
                                                        <InputField icon={Lock} type="password" name="confirmPassword" placeholder="Confirm Password"
                                                            value={formData.confirmPassword} onChange={handleInputChange}
                                                            isPassword showPassword={showPassword} setShowPassword={setShowPassword}
                                                            error={validationErrors.confirmPassword} />
                                                        <button type="submit" disabled={loading} className="w-full btn-primary mt-6">
                                                            {loading ? 'Processing...' : 'Finalize Account'}
                                                        </button>
                                                        <p className="text-center text-xs text-white/40 mt-6 font-serif">
                                                            Already have an account?{' '}
                                                            <button type="button" onClick={() => { setAuthMode('login'); setMethod('email'); setError(''); setSuccessMessage(''); }} className="text-primary font-bold hover:underline uppercase tracking-wider">
                                                                Sign In
                                                            </button>
                                                        </p>
                                                    </form>
                                                )}
                                            </>
                                        )}

                                        {/* PASSWORD RESET */}
                                        {authMode === 'reset' && (
                                            <div className="space-y-6">
                                                {!resetData.otpSent ? (
                                                    <>
                                                        <div className="text-center text-white/50 text-xs uppercase tracking-widest mb-4">Reset your secret key</div>
                                                        <InputField icon={Mail} type="email" name="resetEmail" placeholder="Email Address"
                                                            value={resetData.email}
                                                            onChange={(e: any) => setResetData({ ...resetData, email: e.target.value })} />
                                                        <button onClick={handlePasswordResetRequest} disabled={loading || !resetData.email}
                                                            className="w-full btn-accent">
                                                            {loading ? 'Processing...' : 'Send Reset Code'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <form onSubmit={handlePasswordResetConfirm} className="space-y-6">
                                                        <InputField icon={Key} type="text" name="resetOtp" placeholder="Reset Code"
                                                            value={resetData.otp}
                                                            onChange={(e: any) => setResetData({ ...resetData, otp: e.target.value })} />
                                                        <InputField icon={Lock} type="password" name="newPassword" placeholder="New Password"
                                                            value={resetData.newPassword}
                                                            onChange={(e: any) => setResetData({ ...resetData, newPassword: e.target.value })}
                                                            isPassword showPassword={showPassword} setShowPassword={setShowPassword} />
                                                        <InputField icon={Lock} type="password" name="confirmNewPassword" placeholder="Confirm New Password"
                                                            value={resetData.confirmPassword}
                                                            onChange={(e: any) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                                                            isPassword showPassword={showPassword} setShowPassword={setShowPassword} />
                                                        <button type="submit" disabled={loading} className="w-full btn-primary">
                                                            {loading ? 'Processing...' : 'Reset Password'}
                                                        </button>
                                                    </form>
                                                )}
                                                <button onClick={() => { setAuthMode('login'); setResetData({ email: '', otp: '', newPassword: '', confirmPassword: '', otpSent: false }); }}
                                                    className="w-full text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest">
                                                    ← Back to Sign In
                                                </button>
                                            </div>
                                        )}

                                        {/* UNLOCK */}
                                        {authMode === 'unlock' && (
                                            <div className="space-y-6">
                                                {!unlockData.otpSent ? (
                                                    <>
                                                        <InputField icon={Mail} type="email" name="unlockEmail" placeholder="Email Address"
                                                            value={unlockData.email || formData.email}
                                                            onChange={(e: any) => setUnlockData({ ...unlockData, email: e.target.value })} />
                                                        <button onClick={handleUnlockRequest} disabled={loading} className="w-full btn-primary">
                                                            {loading ? 'Processing...' : 'Send Unlock Code'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <form onSubmit={handleUnlockConfirm} className="space-y-6">
                                                        <InputField icon={Key} type="text" name="unlockOtp" placeholder="Unlock Code"
                                                            value={unlockData.otp}
                                                            onChange={(e: any) => setUnlockData({ ...unlockData, otp: e.target.value })} />
                                                        <button type="submit" disabled={loading} className="w-full btn-accent">
                                                            {loading ? 'Processing...' : 'Unlock Account'}
                                                        </button>
                                                    </form>
                                                )}
                                                <button onClick={() => { setAuthMode('login'); setShowUnlockOption(false); }}
                                                    className="w-full text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest">
                                                    ← Back to Sign In
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
                }
            </motion.div >

            {/* Reactivation Modal */}
            <AnimatePresence>
                {showReactivationModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)]/20 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_100px_rgba(245,158,11,0.15)] relative overflow-hidden"
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 blur-3xl rounded-full" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-secondary)]/5 blur-3xl rounded-full" />

                            <div className="text-center relative z-10">
                                <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xi flex items-center justify-center mx-auto mb-6">
                                    <Smartphone className="text-[var(--color-primary)]" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold font-serif mb-2 text-[var(--color-primary)]">Welcome Back!</h3>
                                <p className="text-xs text-[var(--color-text)] opacity-60 uppercase tracking-widest font-black mb-6">Account Restoration</p>
                                
                                <div className="bg-[var(--color-bg)]/50 border border-[var(--color-primary)]/10 rounded-2xl p-4 mb-8 text-left space-y-3">
                                    <p className="text-xs flex items-start gap-2 text-[var(--color-text)]">
                                        <span className="text-[var(--color-primary)] mt-1">✦</span>
                                        This account was previously scheduled for deletion.
                                    </p>
                                    <p className="text-xs flex items-start gap-2 text-[var(--color-text)]">
                                        <span className="text-[var(--color-primary)] mt-1">✦</span>
                                        Restoring will bring back all your history and addresses.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleReactivation('restore')}
                                        disabled={loading}
                                        className="w-full py-4 bg-[var(--color-primary)] text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Restore Everything'}
                                    </button>
                                    <button
                                        onClick={() => handleReactivation('wipe')}
                                        disabled={loading}
                                        className="w-full py-4 border-2 border-[var(--color-primary)]/20 text-[var(--color-primary)] font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[var(--color-primary)]/5 transition-all"
                                    >
                                        Start Fresh (Clear Data)
                                    </button>
                                    <button
                                        onClick={() => setShowReactivationModal(false)}
                                        className="text-[10px] text-[var(--color-text)] opacity-40 hover:opacity-100 uppercase tracking-widest font-black pt-2 block mx-auto"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
