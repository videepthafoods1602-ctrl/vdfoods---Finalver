export interface LocationData {
    country_code: string;
    country_name: string;
    city?: string;
    region?: string;
    currency: 'USD' | 'INR';
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    display_name?: string;
}

export const detectLocation = async (): Promise<LocationData> => {
    console.log('Starting location detection...');
    
    // 1. Try Native Browser Geolocation
    if ('geolocation' in navigator) {
        try {
            // Check permissions API if available (Chrome/Firefox/Android)
            if (navigator.permissions && navigator.permissions.query) {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                console.log('Geolocation permission status:', status.state);
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 12000, // Increased to 12s for mobile GPS warm-up
                    maximumAge: 60000
                });
            });

            const { latitude, longitude } = position.coords;
            console.log('Got coordinates:', latitude, longitude);

            // Reverse Geocode using Nominatim API mapping
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
                headers: { 'User-Agent': 'VideepthaFoodsLocBot/1.0' }
            });
            const geoData = await geoRes.json();

            if (geoData && geoData.address) {
                const country_code = (geoData.address.country_code || 'US').toUpperCase();
                const isIndia = country_code === 'IN';

                const result: LocationData = {
                    country_code,
                    country_name: isIndia ? 'India' : (geoData.address.country || 'USA'),
                    city: isIndia ? undefined : (geoData.address.city || geoData.address.town || geoData.address.county),
                    region: isIndia ? undefined : geoData.address.state,
                    currency: isIndia ? 'INR' : 'USD',
                    coordinates: { latitude, longitude },
                    display_name: isIndia ? 'India' : (geoData.display_name || 'USA')
                };
                console.log('Native detection result:', result);
                return result;
            }
        } catch (error: any) {
            console.warn('Native geolocation failed or denied:', error.message || error);
        }
    }

    // Secondary attempt: IP Geolocation (Silent, requires no prompt)
    // Primary IP Provider: ipapi.co
    try {
        console.log('Attempting primary IP fallback (ipapi.co)...');
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();

        if (ipData && ipData.country_code) {
            const isIndia = ipData.country_code === 'IN';
            const result: LocationData = {
                country_code: ipData.country_code || 'US',
                country_name: isIndia ? 'India' : (ipData.country_name || 'USA'),
                city: isIndia ? undefined : ipData.city,
                region: isIndia ? undefined : ipData.region,
                currency: isIndia ? 'INR' : 'USD',
                coordinates: { latitude: ipData.latitude, longitude: ipData.longitude }
            };
            console.log('Primary IP detection result:', result);
            return result;
        }
    } catch (ipError) {
        console.warn('Primary IP Fallback (ipapi.co) failed. Trying secondary...');
    }

    // Tertiary attempt: Another IP Geolocation Provider (ipwho.is or similar)
    try {
        console.log('Attempting secondary IP fallback (ipwho.is)...');
        const ipRes = await fetch('https://ipwho.is/');
        const ipData = await ipRes.json();

        if (ipData && ipData.success) {
            const isIndia = ipData.country_code === 'IN';
            const result: LocationData = {
                country_code: ipData.country_code || 'US',
                country_name: isIndia ? 'India' : (ipData.country || 'USA'),
                city: isIndia ? undefined : ipData.city,
                region: isIndia ? undefined : ipData.region,
                currency: isIndia ? 'INR' : 'USD',
                coordinates: { latitude: ipData.latitude, longitude: ipData.longitude }
            };
            console.log('Secondary IP detection result:', result);
            return result;
        }
    } catch (secIpError) {
        console.warn('Secondary IP Fallback failed. Using ultimate defaults.');
    }

    // Ultimate fallback if all attempts fail
    console.log('All detection attempts failed. Returning USA default.');
    return {
        country_code: 'US',
        country_name: 'USA',
        currency: 'USD'
    };
};

export const getExchangeRate = async (): Promise<number> => {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        return data.rates.INR || 80.0;
    } catch (error) {
        console.error('Exchange rate fetch failed, using fallback:', error);
        return 80.0;
    }
};

export const getCurrencySymbol = (currency: 'USD' | 'INR') => {
    return currency === 'INR' ? '₹' : '$';
};

export const formatPrice = (price: number, currency: 'USD' | 'INR', rate: number = 80.0) => {
    const symbol = getCurrencySymbol(currency);
    // Base price is USD
    const convertedPrice = currency === 'INR' ? price * rate : price;
    return `${symbol}${convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
