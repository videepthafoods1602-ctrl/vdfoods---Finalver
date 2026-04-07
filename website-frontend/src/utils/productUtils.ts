export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category_ids: string[];
    attributes?: Record<string, any>;
    is_active: boolean;
}

export interface ProductGroup {
    baseName: string;
    variants: Product[];
    defaultProduct: Product;
}

const BASE_PRODUCT_LINES = [
    "Nippattu",
    "Dark Chocolate",
    "Payasam",
    "Podi",
    "Pickle",
    "Powder",
    "Cookies",
    "Biscuits",
    "Mixture",
    "Chakli",
    "Chalki",
    "Arisalu",
    "Aresalu",
    "Adhirasam",
    "Kajjikayyi",
    "KajjiKai",
    "Laddu",
    "Laddoo",
    "Laddo",
    "Masala",
    "Elaichi Powder"
];

/**
 * Groups products by their base name if they follow a variation pattern.
 * Delimiters supported: Names containing (...) or "... , Variation"
 * ONLY groups if the variant part looks like a weight or size.
 */
export const groupProductsWithVariants = (products: Product[]): ProductGroup[] => {
    const groups: Record<string, ProductGroup> = {};
    
    // Pattern 1: "Base Name (Variant)"
    const bracketRegex = /^(.*?)\s*\((.*?)\)\s*$/;

    // Cleanup specific database typo to ensure clean splits
    products.forEach(p => {
        if (p.name.includes("Dark Chocalate")) {
            p.name = p.name.replace("Dark Chocalate", "Dark Chocolate");
        }
        if (p.name.includes("DarkChacolate")) {
            p.name = p.name.replace("DarkChacolate", "Dark Chocolate");
        }
        if (p.name.includes("Aresalu")) {
            p.name = p.name.replace("Aresalu", "Arisalu");
        }
        // Force fix the severely mangled Kajjikayyi DB entry so it splits into perfect flavors
        if (p.name.includes("Kajjikayyi Jowar Dryfruit Jowar Sesame")) {
            p.name = "Kajjikayyi Jowar Dryfruit Kajjikayyi Jowar Sesame Kajjikayyi Jowar Coconut VP Special Kajjikayyi Kapli Dryfruit Kajjikayyi Kapli Sesame Kajjikayyi Kapli Coconut VP Special";
        }
    });

    products.forEach(product => {
        // --- Squashed String Processor ---
        if (product.name.length > 40) {
            let matchedBase: string | null = null;
            for (const baseKeyword of BASE_PRODUCT_LINES) {
                const regex = new RegExp(baseKeyword, 'gi');
                const matches = product.name.match(regex);
                if (matches && matches.length > 1) {
                    matchedBase = baseKeyword; // Use standard spelling
                    break;
                }
            }

            if (matchedBase) {
                // Split the string, ignoring empty chunks
                const pieces = product.name.split(new RegExp(`\\s*${matchedBase}\\s*`, 'i')).filter(Boolean);
                
                const groupingKey = matchedBase;
                if (!groups[groupingKey]) {
                    groups[groupingKey] = {
                        baseName: groupingKey,
                        variants: [],
                        defaultProduct: product
                    };
                }
                
                pieces.forEach((piece, idx) => {
                    const cleanPiece = piece.trim();
                    if (cleanPiece && cleanPiece.toLowerCase() !== matchedBase!.toLowerCase()) {
                        groups[groupingKey].variants.push({
                            ...product,
                            _id: `${product._id}_var_${idx}`, // Synthetic ID
                            name: `${matchedBase} ${cleanPiece}`
                        });
                    }
                });
                return; // End processing for this massively squashed string
            }
        }

        let baseName = product.name;
        let isVariant = false;

        const bracketMatch = product.name.match(bracketRegex);

        if (bracketMatch) {
            baseName = bracketMatch[1].trim();
            isVariant = true;
        } else {
            // Smart Keyword Grouping for irregular names
            for (const baseKeyword of BASE_PRODUCT_LINES) {
                // Determine if this core keyword exists in the name and the name has other words
                if (product.name.toLowerCase().includes(baseKeyword.toLowerCase()) && product.name.length > baseKeyword.length) {
                    baseName = baseKeyword; // Capitalized cleanly
                    isVariant = true;
                    break;
                }
            }
        }

        // Normalize grouping key (e.g., Laddoo -> Laddu)
        let groupingKey = isVariant ? baseName : product.name;
        if (groupingKey.toLowerCase().includes("laddo")) groupingKey = "Laddu";
        if (groupingKey.toLowerCase().includes("arisalu") || groupingKey.toLowerCase().includes("aresalu")) groupingKey = "Arisalu";

        if (!groups[groupingKey]) {
            groups[groupingKey] = {
                baseName: groupingKey,
                variants: [],
                defaultProduct: product
            };
        }
        groups[groupingKey].variants.push(product);
    });

    return Object.values(groups).map(group => {
        // Sort variants (weight-based naturally, alphabetical fallback)
        group.variants.sort((a, b) => {
            const getWeightValue = (name: string) => {
                const varName = extractVariantName(name).toLowerCase();
                const num = parseFloat(varName);
                if (isNaN(num)) {
                    // Alphabetic fallback for flavors
                    return 0; // Return 0 to maintain relative order if not a weight, we will use localeCompare below
                }
                if (varName.includes('kg')) return num * 1000;
                if (varName.includes('l')) return num * 1000;
                return num;
            };
            const weightA = getWeightValue(a.name);
            const weightB = getWeightValue(b.name);
            if (weightA && weightB) return weightA - weightB;
            
            // Flavor/String fallback sorting
            return extractVariantName(a.name).localeCompare(extractVariantName(b.name));
        });
        group.defaultProduct = group.variants[0];
        return group;
    });
};

/**
 * Extracts the variant name for the dropdown label.
 */
export const extractVariantName = (fullName: string): string => {
    const bracketRegex = /^(.*?)\s*\((.*?)\)\s*$/;

    const bracketMatch = fullName.match(bracketRegex);
    if (bracketMatch) return bracketMatch[2].trim();

    // Smart Keyword Grouping variant extraction
    for (const baseKeyword of BASE_PRODUCT_LINES) {
        if (fullName.toLowerCase().includes(baseKeyword.toLowerCase()) && fullName.length > baseKeyword.length) {
            // Remove the base keyword (case insensitive) and trim remaining flavor/variant name
            const variantStr = fullName.replace(new RegExp(baseKeyword, "ig"), "").trim();
            // In case it was just something with an extra space or hyphen
            return variantStr || fullName;
        }
    }

    return fullName;
};
