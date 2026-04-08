export interface Product {
    _id: string;
    id?: string;
    name: string;
    description: string;
    price: number;
    weight?: string;
    media_url?: string;
    image?: string;
    images?: string[];
    subcategory_id?: string;
    category_ids: string[];
    stock: number;
    is_active: boolean;
    analytics?: {
        views: number;
        sales: number;
        revenue: number;
        current_watching?: number;
        favorites_count?: number;
    };
    attributes?: {
        ingredients?: string[];
        allergens?: string[];
        nutrition?: {
            calories: string;
            protein: string;
            carbohydrates: string;
            fat: string;
        };
        dropdown_options?: string[];
        shop?: string;
    };
}

export interface Category {
    _id: string;
    id?: string;
    name: string;
    description: string;
    media_url?: string;
    parent_id?: string;
    subcategories?: any[];
}

export interface SubCategory {
    _id: string;
    id: string;
    category_id: string;
    name: string;
    description: string;
    media_url?: string;
}

export interface User {
    _id: string;
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
}

export interface ProductGroup {
    baseName: string;
    variants: Product[];
    defaultProduct: Product;
}

export interface Promotion {
    id: string;
    _id?: string;
    title: string;
    description: string;
    discount_percent?: number;
    is_active: boolean;
    image_url?: string;
    product_id?: string;
    
    // Complex fields for PromotionSection
    background_type?: 'image' | 'video' | 'gradient' | 'color';
    background_image?: string;
    background_video?: string;
    background_gradient?: {
        type: string;
        angle: string;
        stops: string[];
    };
    background_color?: string;
    subtitle?: string;
    subtitle_size?: string;
    subtitle_font?: string;
    subtitle_color?: string;
    title_size?: string;
    title_font?: string;
    title_color?: string;
    ctaLink: string;
    ctaText: string;
    coupon_code?: string;
}

export interface Block {
    id: string;
    type: string;
    content: any;
    styles: any;
    animations?: {
        type?: string;
        delay?: number;
        duration?: number;
    };
}

export interface Section {
    id: string;
    type: string;
    settings: any;
    blocks: Block[];
    layout?: 'full' | 'split' | string;
    styles?: {
        backgroundImage?: string;
        backgroundColor?: string;
    };
    background_type?: 'video' | 'gradient' | 'animation' | 'image' | 'color';
    background_video?: {
        url: string;
        muted?: boolean;
        opacity?: number;
    };
    background_gradient?: {
        type: 'radial' | 'linear';
        angle?: string;
        stops: string[];
    };
    background_animation?: {
        type: 'mesh' | string;
    };
}

export interface Page {
    id?: string;
    _id?: string;
    name: string;
    slug: string;
    sections: Section[];
}

export interface StoryContent {
    type: 'heading' | 'subheading' | 'text' | 'image' | 'video';
    content?: string;
    url?: string;
    caption?: string;
}

export interface Story {
    _id: string;
    title: string;
    shortExcerpt: string;
    heroImage: string;
    thumbnailImage: string;
    subtitle?: string;
    fullStoryContent: StoryContent[];
    is_active: boolean;
}
