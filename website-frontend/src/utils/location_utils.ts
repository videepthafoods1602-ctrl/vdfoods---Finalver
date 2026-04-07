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
    // 1. Try Native Browser Geolocation
    if ('geolocation' in navigator) {
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 60000
                });
            });

            const { latitude, longitude } = position.coords;

            // Reverse Geocode using Nominatim API mapping
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
            const geoData = await geoRes.json();

            if (geoData && geoData.address) {
                const countryCode = (geoData.address.country_code || '').toUpperCase();
                const isIndia = countryCode === 'IN';

                return {
                    country_code: countryCode || 'US',
                    country_name: geoData.address.country || 'United States',
                    city: geoData.address.city || geoData.address.town || geoData.address.county,
                    region: geoData.address.state,
                    currency: isIndia ? 'INR' : 'USD',
                    coordinates: { latitude, longitude },
                    display_name: geoData.display_name
                };
            }
        } catch (error) {
            console.warn('Native geolocation failed or denied. Trying IP fallbacks.');
        }
    }

    // Secondary attempt: IP Geolocation (Silent, requires no prompt)
    try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        
        if (ipData && ipData.country_code) {
            const isIndia = ipData.country_code === 'IN';
            return {
                country_code: ipData.country_code,
                country_name: ipData.country_name,
                city: ipData.city,
                region: ipData.region,
                currency: isIndia ? 'INR' : 'USD',
                coordinates: { latitude: ipData.latitude, longitude: ipData.longitude }
            };
        }
    } catch (ipError) {
        console.warn('IP Fallback failed. Using ultimate defaults.', ipError);
    }

    // Ultimate fallback if both Native and IP fail
    return {
        country_code: 'IN',
        country_name: 'India',
        currency: 'INR'
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
