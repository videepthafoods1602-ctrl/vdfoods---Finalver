import type { Product, ProductGroup } from '../types';

/**
 * Groups products by name and processes the 'dropdown' field to create variants.
 */
export const groupProductsWithVariants = (products: Product[]): ProductGroup[] => {
    const groups: ProductGroup[] = [];
    const processedIds = new Set<string>();

    if (!Array.isArray(products)) return [];

    // Step 1: Normalize names to identify base products (e.g. "Honey 500g" -> "Honey")
    const getBaseName = (name: string) => {
        // Remove trailing weights/quantities (e.g. " 500g", " 1kg", " 100 ml", " (500g)")
        return name.replace(/\s*\(?\d+\s*(g|kg|ml|l|packets|pcs|oz|lb)\)?\s*$/i, '').trim();
    };

    // Step 1: Identify Main Products and their variants
    products.forEach(p => {
        const labels = p.attributes?.dropdown_options || [];
        if (labels.length > 0) {
            const parentImage = (p.images && p.images.length > 0) ? p.images[0] : p.media_url;
            
            // For each label, try to find a real product that matches the name
            const syntheticVariants = labels.map((label, idx) => {
                // Look for a real product with this exact name in the filtered list
                const realMatch = products.find(real => real.name.trim().toLowerCase() === label.trim().toLowerCase());
                
                if (realMatch) {
                    processedIds.add(realMatch._id);
                    return {
                        ...realMatch,
                        weight: label // Use the dropdown label as the weight/variant name
                    };
                }

                // Fallback to synthetic if no real product found
                return {
                    ...p,
                    _id: `${p._id}_var_${idx}`,
                    images: p.images && p.images.length > 0 ? p.images : (p.media_url ? [p.media_url] : []),
                    media_url: parentImage,
                    weight: label, 
                };
            });

            groups.push({
                baseName: p.name,
                variants: syntheticVariants,
                defaultProduct: syntheticVariants[0]
            });
            processedIds.add(p._id);
        }
    });

    // Step 2: Handle remaining products using name-based grouping (Case B)
    const productsByBaseName = new Map<string, Product[]>();
    products.filter(p => !processedIds.has(p._id)).forEach(p => {
        const bName = getBaseName(p.name);
        if (!productsByBaseName.has(bName)) productsByBaseName.set(bName, []);
        productsByBaseName.get(bName)?.push(p);
    });

    productsByBaseName.forEach((variants, bName) => {
        if (variants.length > 1) {
            groups.push({
                baseName: bName,
                variants: variants,
                defaultProduct: variants[0]
            });
        } else {
            const only = variants[0];
            groups.push({
                baseName: only.name,
                variants: [only],
                defaultProduct: only
            });
        }
        variants.forEach(v => processedIds.add(v._id));
    });

    return groups;
};

/**
 * Extracts the variant name for the dropdown label.
 */
export const extractVariantName = (product: Product | any): string => {
    if (typeof product === 'string') return product;
    // Prefer the synthetic weight/label we added, fallback to name
    return product.weight || product.name;
};
