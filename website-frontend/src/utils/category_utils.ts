export const deduplicateBy = (arr: any[], key: string) => {
    const seen = new Set();
    return arr.filter(item => {
        const val = item[key];
        if (seen.has(val)) {
            return false;
        }
        seen.add(val);
        return true;
    });
};

/**
 * Formats a string by adding a space before capital letters (e.g., "DarkChocolate" -> "Dark Chocolate").
 * Also handles specific brand overrides like "Vd's Premium".
 */
export const formatName = (name: string): string => {
    if (!name) return "";
    
    // 1. Specialized overrides for the brand
    const lower = name.toLowerCase().trim()
        .replace(/["']/g, '') // remove quotes
        .replace(/\s+/g, ''); // remove spaces for matching

    if (lower.includes('vdspremium') || lower.includes('vdspremiumspecial') || lower.includes('vdsspremium')) {
        return "Vd's Premium Special";
    }

    // 2. Insert a space before any uppercase letter preceded by a lowercase letter or digit
    // and between two uppercase letters if the second is followed by lowercase (e.g. BABYFood -> BABY Food)
    let formatted = name.trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

    // 3. Spelling and specific spacing corrections
    if (formatted.toLowerCase().includes('horsegram')) {
        formatted = formatted.replace(/Horsegram/gi, 'Horse Gram');
    }
    
    // Common combined all-caps cases (heuristics for user reported "combined names")
    const upNoSpace = formatted.toUpperCase().replace(/\s/g, '');
    if (upNoSpace === 'BABYFOOD') formatted = 'BABY FOOD';
    if (upNoSpace === 'BIRYANIMIX') formatted = 'BIRYANI MIX';
    if (upNoSpace === 'BODYRELAX') formatted = 'BODY RELAX';

    formatted = formatted
        .replace(/Payasm/gi, 'Payasam')
        .replace(/Horse GramPayasam/gi, 'Horse Gram Payasam')
        .replace(/DarkChocolet/gi, 'Dark Chocolate')
        .replace(/DarkChocolate/gi, 'Dark Chocolate')
        .replace(/Dark Chocalate/gi, 'Dark Chocolate')
        .replace(/Chocalate/gi, 'Chocolate')
        .replace(/BeatHunger/gi, 'Beat Hunger')
        .replace(/Gut Friendly fruit drinks/gi, 'Gut Friendly')
        .replace(/Babyfood/gi, 'Baby Food')
        .replace(/Pickel/gi, 'Pickle')
        .replace(/Main Category/gi, 'Main Category')
        .replace(/Sub Category/gi, 'Sub Category')
        .replace(/\s+/g, ' ')
        .trim();

    return formatted;
};

const CATEGORY_IMAGES: Record<string, string> = {
    // --- HIGH PRIORITY BRAND OVERRIDES ---
    'feel good feel lite': '/assets/categories/vds_feel_good_feel_lite.png',

    // --- EXACT SPREADS MAPPING ---
    'vegan mayonnaise': '/assets/categories/vegan_mayonnaise.jpeg',
    'mayonnaise': '/assets/categories/mayonnaise.jpeg',
    'sweet spreads': '/assets/categories/sweet_spreads.jpeg',
    'vegan butter': '/assets/categories/vegan_butter.jpeg',
    'vegan sauce': '/assets/categories/vegan_sause.jpeg',
    'vegan sause': '/assets/categories/vegan_sause.jpeg',
    'sauce': '/assets/categories/sause.jpeg',
    'sause': '/assets/categories/sause.jpeg',

    // --- NORMAL STORE SPECIALTIES ---
    'at pocket': '/assets/categories/vds_at_pocket_main.jpg',
    'baby food': '/assets/categories/vds_baby_food_main.jpg',
    'biryani mix': '/assets/categories/vds_biryani_mix_main.jpg',
    'body relax': '/assets/categories/vds_body_relax_main.jpg',
    'beat hunger': '/assets/categories/vds_beat_hunger_sub.jpg',
    'candies': '/assets/categories/vds_candies_heritage_main.jpg',
    'cooking oil': '/assets/categories/cooking_oil_main.png',
    'cold pressed': '/assets/categories/cold_pressed_oil_sub.png',
    'dark chocolate': '/assets/categories/vds_dark_chocolate_heritage_main.png',
    'diabetic': '/assets/categories/vds_diabetic_friendly_heritage_main.png',
    'dryfruit': '/assets/categories/dryfruit_special_main.png',
    'energy drink': '/assets/categories/energy_drinks_main.png',
    'gut friendly': '/assets/categories/vds_gut_friendly_drinks_heritage_main.png',
    'herbal tea': '/assets/categories/vds_herbal_tea_heritage_main.png',
    'instant chutney': '/assets/categories/vds_chutney_bharani_sub_1775359616348.png',
    'podi': '/assets/categories/vds_podi_heritage_sub_1775359588127.png',
    'milk mix': '/assets/categories/vds_milk_mix_main_heritage.png',
    'mouth freshner': '/assets/categories/vds_mouth_freshner_main.jpg',
    'pickles': '/assets/categories/vds_pickles_main.jpg',
    'payasam': '/assets/categories/Payasam.png',
    'payasma': '/assets/categories/Payasam.png',
    'pulao': '/assets/categories/vds_pulao_main.jpg',
    'ready to cook': '/assets/categories/vds_ready_to_cook_main.jpg',
    'roti': '/assets/categories/vds_roti_flour_main.jpg',

    // --- PREMIUM STORE COLLECTIONS (Fixed Spacing & Names) ---
    "vd's premium special": '/assets/categories/VDSpecial.jpeg',
    'millet rice': '/assets/Premium_Rice_Varieties.jpeg',
    'rice varieties': '/assets/Premium_Sub_Rice_Variety.jpeg',
    'millets': '/assets/Premium_sub_Millet_Variety.jpeg',
    'mix for cooked millet': '/assets/Mix_For_Cooked_Millets.jpeg',
    'premium masalas': '/assets/categories/vds_masala_brass_sub_1775359602328.png',
    'kitchen masala': '/assets/categories/vds_masala_brass_sub_1775359602328.png',
    'vegetable masala': '/assets/categories/vds_masala_main.jpg',
    'home made masala': '/assets/categories/vds_masala_brass_sub_1775359602328.png',
    'heritage sweets': '/assets/categories/vds_sweets_heritage_sub_1775359637327.png',
    'hair & massage oils': '/assets/categories/vds_massage_oils_sub.jpg',
    'abhyanga snana': '/assets/categories/vds_abhyanga_snana_sub.jpg',
    'ready to mix': '/assets/categories/Ready_To_Mix.jpeg',
    'instant samber': '/assets/categories/InstantSamber.png',
    'samber powder': '/assets/categories/InstantSamber.png',
    '6 months': '/assets/categories/BF6.png',
    '8 months': '/assets/categories/BF8.png',
    '12 months': '/assets/categories/BF12.png',
    '2 years': '/assets/categories/BF2Y.png',
    '4 years': '/assets/categories/BF4Y.png',
    'ready to eat': '/assets/categories/Readytoeat.jpeg',
    'museli': '/assets/categories/Museli.jpeg',
    'diabetic friendly sweets': '/assets/categories/vds_sweets_heritage_sub_1775359637327.png',
    'tools': '/assets/Tools.jpeg',
    'womens friendly': '/assets/categories/women_health_wellness_hero_1774757984956.png',
    'women friendly': '/assets/categories/women_health_wellness_hero_1774757984956.png',
    'periods friendly': '/assets/categories/women_health_wellness_hero_1774757984956.png',
    'women health': '/assets/categories/women_health_wellness_hero_1774757984956.png',
    'flour': '/assets/categories/flour.jpeg',
    'flours': '/assets/categories/flour.jpeg',
    'poha': '/assets/categories/poha.jpeg',
    'rava': '/assets/categories/rava.jpeg',

    // --- COLLECTION HEROES (Broad Matches) ---
    'masala': '/assets/categories/masala_spices_collection_hero_1774757490910.png',
    'spice': '/assets/categories/masala_spices_collection_hero_1774757490910.png',
    'pickle': '/assets/categories/pickles_jar_hero_1774757530659.png',
    'pickel': '/assets/categories/pickles_jar_hero_1774757530659.png',
    'spreads': '/assets/categories/spreads_mayonnaise_collection_hero_1774757436728.png',
    'sweets & savory': '/assets/categories/sweets_savory_collection_hero_1774757418927.png',
    'savouries': '/assets/categories/sweets_savory_collection_hero_1774757418927.png',
    'pasta & noodles': '/assets/categories/pasta_noodles_collection_hero_1774757897086.png',
    'natural sweeteners': '/assets/categories/natural_sweeteners_hero_1774757913510.png',
    'soup & ganji': '/assets/categories/soup_ganji_hero_1774757930273.png',
    "kid's combo": '/assets/categories/KidsCombo.png',
    "kids combo": '/assets/categories/KidsCombo.png',
};

const DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506484334402-40ff2269c4f1?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488459711615-de64ef5993f7?auto=format&fit=crop&q=80',
];

export const getCategoryImage = (name: string, currentUrl?: string) => {
    if (!name) return DEFAULT_IMAGES[0];

    // Step 0: Absolute exact string match (case-insensitive)
    const rawLower = name.toLowerCase().trim();
    if (CATEGORY_IMAGES[rawLower]) return CATEGORY_IMAGES[rawLower];

    // Step 1: Normalize (Remove EVERYTHING but letters/numbers for flexible matching)
    const extremeNormalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchName = extremeNormalize(name);

    // Step 2: Length-descending loose match
    const sortedKeys = Object.keys(CATEGORY_IMAGES).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const normalizedKey = extremeNormalize(key);
        if (normalizedKey.length > 2 && (searchName.includes(normalizedKey) || normalizedKey.includes(searchName))) {
            return CATEGORY_IMAGES[key];
        }
    }

    // fallback to DB url
    if (currentUrl && currentUrl.length > 10) return currentUrl;

    // Ultimate fallback
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return DEFAULT_IMAGES[hash % DEFAULT_IMAGES.length];
};
