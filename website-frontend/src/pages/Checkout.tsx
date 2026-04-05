import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, CreditCard, Truck, ShieldCheck, MapPin, Phone, User, ChevronRight, Plus, Minus, Trash2, Info, Loader2, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { API_URL } from '../config';

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: "'Outfit', sans-serif",
        paddingTop: '120px',
        paddingBottom: '100px',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
        gap: '48px',
    },
    section: {
        background: 'var(--color-surface)',
        borderRadius: '32px',
        border: '1px solid var(--color-border)',
        padding: '40px',
        marginBottom: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 800,
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: "'Playfair Display', serif",
        color: 'var(--color-primary)',
    },
    inputGroup: {
        marginBottom: '24px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--color-text-dim)',
        marginBottom: '8px',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.02)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '16px',
        color: 'var(--color-text)',
        fontSize: '16px',
        outline: 'none',
        transition: 'all 0.3s ease',
    },
    summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
        fontSize: '16px',
        color: 'var(--color-text-dim)',
    },
    total: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '24px',
        fontWeight: 900,
        color: 'var(--color-text)',
    },
    orderBtn: {
        width: '100%',
        background: 'var(--color-primary)',
        color: 'var(--color-text)',
        border: 'none',
        borderRadius: '100px',
        padding: '20px',
        fontSize: '18px',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '32px',
        boxShadow: '0 20px 40px rgba(92, 141, 55, 0.2)',
    },
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
    },
    modalContent: {
        backgroundColor: 'var(--color-surface)',
        borderRadius: '40px',
        maxWidth: '500px',
        width: '100%',
        padding: '48px',
        textAlign: 'center' as const,
        position: 'relative' as const,
        border: '1px solid var(--color-border)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
    }
};

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart, formatPrice, currency, locationData, updateQuantity, removeFromCart, addToCart } = useCart();
    const { user, isLoggedIn, loading: authLoading, openAuthModal, refreshUser } = useAuth();
    const navigate = useNavigate();

    const parseWeight = (weightStr: string) => {
        if (!weightStr) return 0;
        const num = parseFloat(weightStr.replace(/[^\d.]/g, '')) || 0;
        const unit = weightStr.toLowerCase();
        if (unit.includes('kg')) return num * 1000;
        if (unit.includes('ml') || unit.includes('g')) return num;
        return num; // Default grams
    };

    const totalWeight = cartItems.reduce((acc, item: any) => {
        const weightVal = parseWeight(item.attributes?.weight || item.selectedWeight || '0');
        return acc + (weightVal * item.quantity);
    }, 0);

    const isBulkOrder = totalWeight >= 4700; // 4.7kg = 4700g

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<any>({
        full_name: '',
        phone: '',
        street_address: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        country: locationData?.country_name || 'United States'
    });

    useEffect(() => {
        if (locationData && !newAddress.city && !newAddress.state) {
            setNewAddress((prev: any) => ({
                ...prev,
                country: locationData.country_name || prev.country,
                city: locationData.city || prev.city,
                state: locationData.region || prev.state
            }));
        }
    }, [locationData]);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const [favorites, setFavorites] = useState<any[]>([]);

    useEffect(() => {
        const fetchFavorites = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const favRes = await fetch(`${API_URL}/favorites/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (favRes.ok) {
                    const favIds = await favRes.json();
                    if (Array.isArray(favIds) && favIds.length > 0) {
                        const prodRes = await fetch(`${API_URL}/products/`);
                        const allProducts = await prodRes.json();
                        setFavorites(allProducts.filter((p: any) => favIds.includes(p._id)));
                    }
                }
            } catch (err) {
                console.error('Fetch favorites error:', err);
            }
        };
        fetchFavorites();
    }, []);

    const toggleFavorite = async (productId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const isFav = favorites.some(f => f._id === productId);
        try {
            if (isFav) {
                await axios.delete(`${API_URL}/favorites/${productId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFavorites(prev => prev.filter(f => f._id !== productId));
            } else {
                await axios.post(`${API_URL}/favorites/`, { product_id: productId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const prodRes = await axios.get(`${API_URL}/products/${productId}/`);
                setFavorites(prev => [...prev, prodRes.data]);
            }
        } catch (err) {
            console.error('Toggle favorite error:', err);
        }
    };

    // Enforce Login
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            openAuthModal();
        }
    }, [isLoggedIn, authLoading, openAuthModal]);

    if (authLoading || !isLoggedIn) return <div style={styles.page}><div style={styles.container}>Loading Account...</div></div>;

    const addresses = user?.profile?.addresses || [];

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        setCouponError('');
        try {
            const token = localStorage.getItem('access_token');
            const { data } = await axios.post(`${API_URL}/coupons/validate/`, {
                code: couponCode,
                total_amount: cartTotal
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppliedCoupon(data);
            setDiscountAmount(data.discount);
            setCouponError('');
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code');
            setAppliedCoupon(null);
            setDiscountAmount(0);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleAddAddress = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const combinedAddress = newAddress.landmark ? `${newAddress.street_address}\nLandmark: ${newAddress.landmark}` : newAddress.street_address;
            const addressPayload = { ...newAddress };
            delete addressPayload.landmark;

            const response = await axios.post(`${API_URL}/accounts/addresses/`, {
                ...addressPayload,
                street_address: combinedAddress,
                address_type: 'shipping'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh user data to get the newly created address
            const updatedUser = await refreshUser();
            
            // Auto-select the new address
            const newId = response.data.id || response.data._id;
            if (newId) {
                setSelectedAddressId(newId);
            } else if (updatedUser?.profile?.addresses && updatedUser.profile.addresses.length > 0) {
                const addresses = updatedUser.profile.addresses;
                const lastAddr = addresses[addresses.length - 1];
                setSelectedAddressId(lastAddr.id || lastAddr._id);
            }
            
            setIsAddingAddress(false);
            return response.data;
        } catch (err) {
            alert('Failed to add address');
            console.error('Add address error:', err);
            throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();

        try {
            const token = localStorage.getItem('access_token');
            let finalAddress = null;

            // 1. If currently in "Add Address" mode, save it first
            if (isAddingAddress) {
                // Quick validation
                if (!newAddress.full_name || !newAddress.phone || !newAddress.street_address) {
                    alert('Please complete the address details.');
                    return;
                }
                const savedAddressResponse = await handleAddAddress();
                const combinedAddress = savedAddressResponse.street_address; 
                finalAddress = { 
                    ...newAddress, 
                    street_address: combinedAddress, 
                    address_type: 'shipping', 
                    id: savedAddressResponse.id || savedAddressResponse._id 
                };
            } else {
                if (!selectedAddressId) {
                    alert('Please select a shipping address');
                    return;
                }
                finalAddress = addresses.find((a: any) => a.id === selectedAddressId || a._id === selectedAddressId);
            }

            if (!finalAddress) {
                alert('Invalid shipping address selected.');
                return;
            }

            const data = {
                items: cartItems.map(item => ({
                    product_id: item._id || (item as any).id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price_at_purchase: item.price
                })),
                total_amount: cartTotal - discountAmount,
                currency: currency || 'USD',
                device_location: locationData || {},
                shipping_address: finalAddress
            };

            setIsSubmitting(true);
            const endpoint = isBulkOrder ? `${API_URL}/bulk-orders/` : `${API_URL}/orders/`;
            
            const response = await axios.post(endpoint, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setOrderInfo(response.data);
            setOrderSuccess(true);
            await clearCart(); // Ensure it's cleared before modal shows
            
        } catch (err: any) {
            if (err.response?.status === 400) {
                alert('Order Error:\n' + JSON.stringify(err.response?.data, null, 2));
            } else {
                console.error('Order Error:', err.response?.data || err);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={styles.container}>
                    <ShoppingBag size={80} color="var(--color-primary)" style={{ marginBottom: '24px' }} />
                    <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px' }}>Your Basket is Empty</h1>
                    <p style={{ color: 'var(--color-text)', opacity: 0.6, marginBottom: '32px' }}>Add some village goodness before checking out.</p>
                    <Link to="/products" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <ArrowLeft size={18} /> Browse Market
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <Header />
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                <header style={{ marginBottom: '48px' }}>
                    <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text)', opacity: 0.6, textDecoration: 'none', fontWeight: 600, marginBottom: '24px' }}>
                        <ArrowLeft size={18} /> Back to Market
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-4xl md:text-[48px] font-black font-serif text-[var(--color-text)]">Finalize Your Harvest</h1>
                        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-panel)] text-[var(--color-text)] rounded-full border border-[var(--color-border)] text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">
                            <Plus size={16} /> Shop More
                        </Link>
                    </div>
                </header>

                <div className="flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12">
                    <div className="lg:pr-5">
                        <form onSubmit={handleSubmit}>
                            <div style={styles.section} className="p-6 md:p-10">
                                <h2 style={styles.sectionTitle} className="text-xl md:text-2xl"><User size={24} color="var(--color-primary)" /> Account Info</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Email (Verified)</label>
                                        <input
                                            type="text"
                                            style={{ ...styles.input, opacity: 0.5 }}
                                            disabled
                                            value={user?.email || ''}
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Customer ID</label>
                                        <input
                                            type="text"
                                            style={{ ...styles.input, opacity: 0.5 }}
                                            disabled
                                            value={user?.profile?.customer_id || ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.section} className="p-6 md:p-10">
                                <h2 style={styles.sectionTitle} className="text-xl md:text-2xl"><MapPin size={24} color="var(--color-primary)" /> Shipping Address</h2>

                                <div style={{ marginBottom: '24px' }}>
                                    {addresses.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                            {addresses.map((addr: any) => (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => {
                                                        setSelectedAddressId(addr.id);
                                                        setIsAddingAddress(false);
                                                    }}
                                                    style={{
                                                        padding: '20px',
                                                        borderRadius: '20px',
                                                        border: selectedAddressId === addr.id ? '2px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                        background: selectedAddressId === addr.id ? 'rgba(92, 141, 55, 0.05)' : 'transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 800, marginBottom: '8px' }}>{addr.full_name}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.6, lineHeight: '1.6' }}>
                                                        {addr.street_address}<br />
                                                        {addr.city}, {addr.state} {addr.pincode}<br />
                                                        {addr.phone}
                                                    </div>
                                                </div>
                                            ))}
                                            <div
                                                onClick={() => {
                                                    setIsAddingAddress(true);
                                                    setSelectedAddressId(null);
                                                }}
                                                style={{
                                                    padding: '20px',
                                                    borderRadius: '20px',
                                                    border: isAddingAddress ? '2px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: isAddingAddress ? 'rgba(92, 141, 55, 0.05)' : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    color: isAddingAddress ? 'var(--color-primary)' : '#94a3b8'
                                                }}
                                            >
                                                <Plus size={24} />
                                                <span style={{ fontWeight: 700, fontSize: '14px' }}>Add New Address</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: '24px', padding: '40px' }}>
                                            <MapPin size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                            <p style={{ color: 'var(--color-text)', opacity: 0.6, fontSize: '14px', marginBottom: '16px' }}>No saved addresses found.</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingAddress(true)}
                                                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '16px' }}
                                            >
                                                + Add Your First Address
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isAddingAddress && (
                                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '32px', marginTop: '32px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>New Shipping Address</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>Full Name</label>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    required={isAddingAddress}
                                                    value={newAddress.full_name}
                                                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                                                />
                                            </div>
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>Phone Number</label>
                                                <input
                                                    type="tel"
                                                    style={styles.input}
                                                    required={isAddingAddress}
                                                    value={newAddress.phone}
                                                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Street Address</label>
                                            <textarea
                                                style={{ ...styles.input, height: '80px', resize: 'none' }}
                                                required={isAddingAddress}
                                                value={newAddress.street_address}
                                                onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Landmark (Optional)</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={newAddress.landmark || ''}
                                                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                                                placeholder="e.g. Near White Church"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>City</label>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    required={isAddingAddress}
                                                    value={newAddress.city}
                                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                />
                                            </div>
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>State</label>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    required={isAddingAddress}
                                                    value={newAddress.state}
                                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                                />
                                            </div>
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>Pincode</label>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    required={isAddingAddress}
                                                    value={newAddress.pincode}
                                                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddAddress}
                                            style={{ ...styles.orderBtn, marginTop: '16px', paddingTop: '12px', paddingBottom: '12px', fontSize: '14px' }}
                                        >
                                            Save Address
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={styles.section} className="p-6 md:p-10">
                                <h2 style={styles.sectionTitle} className="text-xl md:text-2xl"><CreditCard size={24} color="var(--color-primary)" /> Payment Method</h2>
                                <div style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--color-primary)', background: 'rgba(92, 141, 55, 0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '6px solid var(--color-primary)' }} />
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '18px' }}>Offline Payment</div>
                                        <div style={{ color: 'var(--color-text)', opacity: 0.6, fontSize: '14px' }}>Our manager will contact you for order confirmation and payment-related things.</div>
                                    </div>
                                </div>
                            </div>

                            {favorites.length > 0 && (
                                <div style={styles.section} className="p-6 md:p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }} className="text-xl md:text-2xl">
                                            <Heart size={24} color="#ef4444" fill="#ef4444" /> From Your Favorites
                                        </h2>
                                        <Link to="/products" className="text-xs font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline">
                                            See All Products
                                        </Link>
                                    </div>
                                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                                        {favorites.map((product) => (
                                            <div key={product._id} className="min-w-[200px] bg-[var(--color-panel)] rounded-2xl p-4 border border-[var(--color-border)] relative group">
                                                <button 
                                                    onClick={() => toggleFavorite(product._id)}
                                                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full transition-transform hover:scale-110"
                                                >
                                                    <Heart size={12} fill="white" />
                                                </button>
                                                <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-white/50">
                                                    <img src={product.images[0]} className="w-full h-full object-cover mix-blend-multiply" />
                                                </div>
                                                <h3 className="text-sm font-bold truncate mb-1">{product.name}</h3>
                                                <p className="text-[var(--color-primary)] font-black text-xs mb-3">{formatPrice(product.price)}</p>
                                                <button 
                                                    onClick={() => addToCart({ ...product, price: product.price, image: product.images[0], quantity: 1 })}
                                                    className="w-full py-2 bg-[var(--color-text)] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[var(--color-primary)] transition-colors"
                                                >
                                                    Add to Basket
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div>
                        <div style={{ position: 'sticky', top: '140px' }}>
                            <div style={styles.section} className="p-6 md:p-10">
                                <h2 style={styles.sectionTitle} className="text-xl md:text-2xl">Order Summary</h2>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '32px' }}>
                                    {cartItems.map(item => (
                                        <div key={item._id} style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                                            <img src={item.image} style={{ width: '70px', height: '70px', borderRadius: '16px', objectFit: 'cover', background: '#f5f5f5' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text)', marginBottom: '4px' }}>{item.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '4px 10px' }}>
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateQuantity(item._id, item.quantity - 1)} 
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', padding: '4px', color: 'var(--color-text)', opacity: 0.7 }}
                                                        >
                                                            <Minus size={14} strokeWidth={3} />
                                                        </button>
                                                        <span style={{ fontWeight: 900, fontSize: '14px', minWidth: '20px', textAlign: 'center', color: 'var(--color-primary)' }}>{item.quantity}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateQuantity(item._id, item.quantity + 1)} 
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', padding: '4px', color: 'var(--color-text)', opacity: 0.7 }}
                                                        >
                                                            <Plus size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeFromCart(item._id)}
                                                        style={{ 
                                                            width: '32px', 
                                                            height: '32px', 
                                                            borderRadius: '10px', 
                                                            border: 'none', 
                                                            background: 'rgba(239, 68, 68, 0.1)', 
                                                            cursor: 'pointer', 
                                                            color: '#ef4444', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        className="hover:scale-110 active:scale-95"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 900, color: 'var(--color-primary)' }}>{formatPrice(item.price * item.quantity)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.summaryItem}>
                                    <span>Subtotal</span>
                                    <span>{formatPrice(cartTotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div style={{ ...styles.summaryItem, color: 'var(--color-primary)' }}>
                                        <span>Discount ({appliedCoupon?.code})</span>
                                        <span>-{formatPrice(discountAmount)}</span>
                                    </div>
                                )}
                                <div style={styles.summaryItem}>
                                    <span>Delivery Fee</span>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>FREE</span>
                                </div>
                                <div style={styles.total}>
                                    <span>Grand Total</span>
                                    <span>{formatPrice(cartTotal - discountAmount)}</span>
                                </div>

                                {isBulkOrder && (
                                    <div style={{ 
                                        marginTop: '24px', 
                                        padding: '16px', 
                                        background: 'rgba(239, 68, 68, 0.05)', 
                                        border: '1px solid #ef4444', 
                                        borderRadius: '16px',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'start'
                                    }}>
                                        <div className="bg-red-500 p-1.5 rounded-full mt-0.5">
                                            <Info size={14} color="white" />
                                        </div>
                                        <div>
                                            <p style={{ color: '#ef4444', fontWeight: 800, fontSize: '13px', margin: 0 }}>Bulk Harvest Rule (4.7kg+)</p>
                                            <p style={{ color: '#ef4444', fontSize: '12px', opacity: 0.8, margin: '4px 0 0' }}>
                                                Your order exceeds 4.7kg. It will be recorded as a Bulk Request; our manager will review the details and update you soon for delivery.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Coupon Input */}
                                <div style={{ marginTop: '32px', position: 'relative' }}>
                                    <label style={{ ...styles.label, marginBottom: '12px' }}>Promo Code</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="Enter code..."
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            style={{ ...styles.input, flex: 1, textTransform: 'uppercase' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={validatingCoupon}
                                            style={{
                                                padding: '0 24px',
                                                borderRadius: '16px',
                                                backgroundColor: 'var(--color-primary)',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '12px',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {validatingCoupon ? '...' : 'APPLY'}
                                        </button>
                                    </div>
                                    {couponError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px', position: 'absolute' }}>{couponError}</p>}
                                    {appliedCoupon && !couponError && <p style={{ color: 'var(--color-primary)', fontSize: '11px', marginTop: '8px', position: 'absolute' }}>Coupon applied!</p>}
                                </div>

                                <motion.button
                                    whileHover={{ scale: (isSubmitting || orderSuccess) ? 1 : 1.02 }}
                                    whileTap={{ scale: (isSubmitting || orderSuccess) ? 1 : 0.98 }}
                                    animate={isBulkOrder ? {
                                        x: [0, -4, 4, -4, 4, 0],
                                        transition: { repeat: Infinity, duration: 1.5, repeatType: "loop" as const }
                                    } : {}}
                                    disabled={isSubmitting || orderSuccess}
                                    style={{
                                        ...styles.orderBtn,
                                        opacity: (isSubmitting || orderSuccess) ? 0.6 : 1,
                                        cursor: (isSubmitting || orderSuccess) ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={handleSubmit}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing Order...
                                        </>
                                    ) : orderSuccess ? (
                                        <>
                                            <ShieldCheck size={20} />
                                            {isBulkOrder ? 'Bulk Order Received!' : 'Order Placed Successfully!'}
                                        </>
                                    ) : (
                                        <>
                                            {isBulkOrder ? 'Confirm Bulk Order' : 'Confirm Order'} <ChevronRight size={20} />
                                        </>
                                    )}
                                </motion.button>

                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>
                                        <ShieldCheck size={20} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                                        Secure Ordering
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>
                                        <Truck size={20} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                                        Fast Delivery
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>
                                        <Phone size={20} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                                        24/7 Support
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {orderSuccess && (
                <div style={styles.modalOverlay}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        style={{ ...styles.modalContent, padding: '64px 48px' }}
                    >
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '100px', 
                                backgroundColor: 'var(--color-primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                margin: '0 auto 32px',
                                boxShadow: '0 20px 40px rgba(92, 141, 55, 0.3)'
                            }}
                        >
                            <ShieldCheck size={50} color="white" />
                        </motion.div>
                        <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '16px', fontFamily: "'Playfair Display', serif" }}>
                            Harvest Confirmed!
                        </h2>
                        <p style={{ color: 'var(--color-text)', opacity: 0.7, marginBottom: '32px', lineHeight: '1.6', fontSize: '16px' }}>
                            Your order <strong style={{color: 'var(--color-primary)'}}>#{orderInfo?.order_number || 'N/A'}</strong> has been received by the village. Our manager will contact you shortly for payment and confirmation.
                        </p>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '28px', borderRadius: '28px', marginBottom: '32px', textAlign: 'left' as const, border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                                <span style={{ opacity: 0.6 }}>Final Harvest Total:</span>
                                <span style={{ fontWeight: 900, color: 'var(--color-primary)' }}>{formatPrice(orderInfo?.total_amount || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                                <span style={{ opacity: 0.6 }}>Items Prepared:</span>
                                <span style={{ fontWeight: 800 }}>{orderInfo?.items?.length || 0} Products</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button 
                                onClick={() => navigate('/')}
                                style={{ ...styles.orderBtn, marginTop: 0, padding: '24px' }}
                            >
                                <ArrowLeft size={20} /> Back to Village Home
                            </button>
                            <Link 
                                to="/account?tab=orders"
                                style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '8px',
                                    color: 'var(--color-text)', 
                                    textDecoration: 'none', 
                                    fontWeight: 700, 
                                    fontSize: '15px',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.opacity = '0.6')}
                            >
                                View Detailed Order Status <ChevronRight size={16} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;
