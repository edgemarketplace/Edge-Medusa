/**
 * Style presets per vertical - 5 per business type
 * Used to randomize safe variables while keeping section order fixed
 */

import type { TemplateFamily } from './types';

export interface StylePreset {
  name: string;
  description: string;
  // Hero style preference (which hero type to emphasize)
  heroStyle: 'hero-visual' | 'hero-split' | 'hero-cta' | 'hero-trust' | 'hero-products';
  // Layout preferences (safe variables to randomize)
  layout: {
    featuredCollectionTitle: string[];
    heroProductCount: number;
    reviewDensity: 'low' | 'medium' | 'high';
    founderPlacement: 'before-products' | 'after-products' | 'none';
    galleryCropStyle: 'square' | 'portrait' | 'landscape' | 'masonry';
    testimonialStyle: 'grid' | 'carousel' | 'single-column';
  };
  // Content tone adjustments
  tone: {
    headlineStyle: 'bold' | 'elegant' | 'playful' | 'authoritative';
    ctaStyle: 'urgent' | 'inviting' | 'exclusive';
  };
}

export const STYLE_PRESETS: Record<TemplateFamily, StylePreset[]> = {
  'retail-core': [
    {
      name: 'dark luxury',
      description: 'Oversized editorial imagery, muted luxury palette',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Curated for You', 'Luxury Collection', 'Editor\'s Picks', 'Premium Selection'],
        heroProductCount: 4,
        reviewDensity: 'medium',
        founderPlacement: 'after-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'exclusive' },
    },
    {
      name: 'clean minimal',
      description: 'Whitespace-heavy layouts, serif headlines',
      heroStyle: 'hero-split',
      layout: {
        featuredCollectionTitle: ['New Arrivals', 'Minimal Essentials', 'Clean Design', 'Simple Pleasures'],
        heroProductCount: 3,
        reviewDensity: 'low',
        founderPlacement: 'none',
        galleryCropStyle: 'square',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'colorful lifestyle',
      description: 'Vibrant colors, lifestyle photography',
      heroStyle: 'hero-products',
      layout: {
        featuredCollectionTitle: ['Shop by Vibe', 'Color Your Life', 'Lifestyle Picks', 'Trending Now'],
        heroProductCount: 5,
        reviewDensity: 'high',
        founderPlacement: 'before-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'carousel',
      },
      tone: { headlineStyle: 'playful', ctaStyle: 'urgent' },
    },
    {
      name: 'earthy maker',
      description: 'Natural textures, handmade aesthetic',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Handcrafted', 'Natural Collection', 'Artisan Picks', 'Earth Made'],
        heroProductCount: 3,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'square',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'modern monochrome',
      description: 'Black and white, bold typography',
      heroStyle: 'hero-trust',
      layout: {
        featuredCollectionTitle: ['Modern Essentials', 'Monochrome Edit', 'Bold Basics', 'Clean Cut'],
        heroProductCount: 4,
        reviewDensity: 'low',
        founderPlacement: 'none',
        galleryCropStyle: 'square',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'urgent' },
    },
  ],

  'service-pro': [
    {
      name: 'authority expert',
      description: 'Bold headlines, trust badges, professional imagery',
      heroStyle: 'hero-cta',
      layout: {
        featuredCollectionTitle: ['Expert Services', 'Proven Methods', 'Authority Programs', 'Certified Solutions'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'after-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'authoritative', ctaStyle: 'urgent' },
    },
    {
      name: 'warm mentor',
      description: 'Friendly tone, personal stories, inviting',
      heroStyle: 'hero-trust',
      layout: {
        featuredCollectionTitle: ['Your Journey', 'Mentorship Programs', 'Growth Paths', 'Success Stories'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'premium consultant',
      description: 'High-end aesthetic, exclusive positioning',
      heroStyle: 'hero-cta',
      layout: {
        featuredCollectionTitle: ['Elite Programs', 'Premium Access', 'Exclusive Services', 'VIP Experience'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'after-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'authoritative', ctaStyle: 'exclusive' },
    },
    {
      name: 'energetic coach',
      description: 'Dynamic, high-energy, transformation focus',
      heroStyle: 'hero-cta',
      layout: {
        featuredCollectionTitle: ['Transform Now', 'Energy Programs', 'Dynamic Results', 'Power Sessions'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'before-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'carousel',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'urgent' },
    },
    {
      name: 'calm educator',
      description: 'Peaceful, methodical, trust-building',
      heroStyle: 'hero-trust',
      layout: {
        featuredCollectionTitle: ['Learn Calmly', 'Peaceful Programs', 'Methodical Growth', 'Steady Progress'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'square',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
  ],

  'food-catering': [
    {
      name: 'wedding catering',
      description: 'Romantic, elegant, celebration-focused',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Wedding Packages', 'Celebration Menus', 'Romantic Dining', 'Dream Day Catering'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'after-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'corporate catering',
      description: 'Professional, efficient, business-focused',
      heroStyle: 'hero-trust',
      layout: {
        featuredCollectionTitle: ['Corporate Packages', 'Business Lunches', 'Executive Dining', 'Professional Catering'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'none',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'authoritative', ctaStyle: 'urgent' },
    },
    {
      name: 'chef-led boutique',
      description: 'Culinary artistry, intimate, gourmet',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Chef\'s Selection', 'Gourmet Experience', 'Boutique Menus', 'Artisan Cuisine'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'before-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'exclusive' },
    },
    {
      name: 'drop-off lunch service',
      description: 'Convenient, fresh, everyday catering',
      heroStyle: 'hero-split',
      layout: {
        featuredCollectionTitle: ['Lunch Favorites', 'Daily Menus', 'Fresh & Fast', 'Convenient Catering'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'none',
        galleryCropStyle: 'square',
        testimonialStyle: 'carousel',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'urgent' },
    },
    {
      name: 'event venue + catering hybrid',
      description: 'Full-service, luxury events, complete solution',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Complete Packages', 'Venue & Catering', 'Full-Service Events', 'Luxury Experience'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'after-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'authoritative', ctaStyle: 'exclusive' },
    },
  ],

  'artisan-market': [
    {
      name: 'rustic heritage',
      description: 'Traditional craft, warm tones, heritage aesthetic',
      heroStyle: 'hero-split',
      layout: {
        featuredCollectionTitle: ['Heritage Collection', 'Traditional Crafts', 'Timeless Pieces', 'Rustic Originals'],
        heroProductCount: 3,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'square',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'clean handmade modern',
      description: 'Minimalist craft, clean lines, contemporary',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Modern Handmade', 'Clean Design', 'Contemporary Craft', 'Minimalist Makes'],
        heroProductCount: 4,
        reviewDensity: 'low',
        founderPlacement: 'none',
        galleryCropStyle: 'square',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'inviting' },
    },
    {
      name: 'earthy organic',
      description: 'Natural materials, organic shapes, eco-friendly',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Organic Collection', 'Natural Makes', 'Eco-Friendly', 'Sustainable Crafts'],
        heroProductCount: 3,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'scandinavian craft',
      description: 'Light woods, minimalist, functional beauty',
      heroStyle: 'hero-split',
      layout: {
        featuredCollectionTitle: ['Nordic Collection', 'Scandi Simplicity', 'Light & Airy', 'Functional Beauty'],
        heroProductCount: 4,
        reviewDensity: 'low',
        founderPlacement: 'none',
        galleryCropStyle: 'square',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'inviting' },
    },
    {
      name: 'cozy farmhouse',
      description: 'Warm, inviting, homey, comfortable',
      heroStyle: 'hero-split',
      layout: {
        featuredCollectionTitle: ['Farmhouse Favorites', 'Cozy Makes', 'Home Comforts', 'Warm & Welcoming'],
        heroProductCount: 3,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
  ],

  'event-floral': [
    {
      name: 'romantic editorial',
      description: 'Soft pinks, romantic lighting, editorial style',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Romantic Blooms', 'Editorial Arrangements', 'Soft & Dreamy', 'Love in Bloom'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'before-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'modern minimalist',
      description: 'Clean lines, single blooms, architectural',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Modern Arrangements', 'Minimalist Blooms', 'Clean & Bold', 'Architectural Design'],
        heroProductCount: 0,
        reviewDensity: 'low',
        founderPlacement: 'none',
        galleryCropStyle: 'square',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'exclusive' },
    },
    {
      name: 'garden luxury',
      description: 'Lush greenery, abundant arrangements, luxury',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Luxury Gardens', 'Lush Arrangements', 'Abundant Blooms', 'Garden Splendor'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'after-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'carousel',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'exclusive' },
    },
    {
      name: 'moody dramatic',
      description: 'Dark tones, dramatic lighting, bold statements',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Dramatic Designs', 'Moody Blooms', 'Bold Statements', 'Dark & Dramatic'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'after-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'exclusive' },
    },
    {
      name: 'soft pastel fine-art',
      description: 'Pastel tones, watercolor aesthetic, delicate',
      heroStyle: 'hero-visual',
      layout: {
        featuredCollectionTitle: ['Pastel Dreams', 'Fine Art Florals', 'Soft & Delicate', 'Watercolor Blooms'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
  ],

  'coach-educator': [
    {
      name: 'authority expert',
      description: 'Bold headlines, trust badges, professional imagery',
      heroStyle: 'hero-cta',
      layout: {
        featuredCollectionTitle: ['Expert Coaching', 'Proven Programs', 'Authority Methods', 'Certified Results'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'after-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'authoritative', ctaStyle: 'urgent' },
    },
    {
      name: 'warm mentor',
      description: 'Friendly tone, personal stories, inviting',
      heroStyle: 'hero-trust',
      layout: {
        featuredCollectionTitle: ['Your Journey', 'Mentorship Programs', 'Growth Paths', 'Success Stories'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
    {
      name: 'premium consultant',
      description: 'High-end aesthetic, exclusive positioning',
      heroStyle: 'hero-cta',
      layout: {
        featuredCollectionTitle: ['Elite Coaching', 'Premium Access', 'Exclusive Programs', 'VIP Experience'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'after-products',
        galleryCropStyle: 'portrait',
        testimonialStyle: 'grid',
      },
      tone: { headlineStyle: 'authoritative', ctaStyle: 'exclusive' },
    },
    {
      name: 'energetic coach',
      description: 'Dynamic, high-energy, transformation focus',
      heroStyle: 'hero-cta',
      layout: {
        featuredCollectionTitle: ['Transform Now', 'Energy Coaching', 'Dynamic Results', 'Power Sessions'],
        heroProductCount: 0,
        reviewDensity: 'high',
        founderPlacement: 'before-products',
        galleryCropStyle: 'landscape',
        testimonialStyle: 'carousel',
      },
      tone: { headlineStyle: 'bold', ctaStyle: 'urgent' },
    },
    {
      name: 'calm educator',
      description: 'Peaceful, methodical, trust-building',
      heroStyle: 'hero-trust',
      layout: {
        featuredCollectionTitle: ['Learn Calmly', 'Peaceful Programs', 'Methodical Growth', 'Steady Progress'],
        heroProductCount: 0,
        reviewDensity: 'medium',
        founderPlacement: 'before-products',
        galleryCropStyle: 'square',
        testimonialStyle: 'single-column',
      },
      tone: { headlineStyle: 'elegant', ctaStyle: 'inviting' },
    },
  ],
};

/**
 * Pick a random style preset for a given business type
 */
export function pickRandomPreset(businessType: TemplateFamily): StylePreset {
  const presets = STYLE_PRESETS[businessType] || STYLE_PRESETS['retail-core'];
  return presets[Math.floor(Math.random() * presets.length)];
}
