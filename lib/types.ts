export type TemplateFamily =
  | 'retail-core'
  | 'service-pro'
  | 'food-catering'
  | 'artisan-market'
  | 'event-floral'
  | 'coach-educator';

export type SiteStatus = 'draft' | 'ready' | 'live';

// --- Section Categories & Types ---

export type SectionCategory =
  | 'header'
  | 'hero'
  | 'commerce'
  | 'storytelling'
  | 'social-proof'
  | 'service'
  | 'media'
  | 'conversion'
  | 'footer';

export type SectionType =
  // Headers
  | 'header-simple'
  | 'header-promo'
  | 'header-mega'
  // Heroes
  | 'hero-split'
  | 'hero-visual'
  | 'hero-products'
  | 'hero-cta'
  | 'hero-trust'
  // Commerce discovery
  | 'featured-collection'
  | 'product-grid'
  | 'best-sellers'
  | 'collection-carousel'
  // Storytelling
  | 'brand-story'
  | 'value-icons'
  | 'editorial-split'
  | 'founder-note'
  // Social proof
  | 'testimonials'
  | 'reviews'
  | 'logo-bar'
  | 'stats'
  | 'press'
  // Service selling
  | 'service-list'
  | 'pricing-tiers'
  | 'packages'
  | 'quote-cta'
  | 'booking-cta'
  // Media
  | 'gallery'
  | 'video'
  | 'before-after'
  | 'social-gallery'
  // Conversion
  | 'faq'
  | 'newsletter'
  | 'promo-banner'
  | 'sticky-cta'
  | 'trust-badges'
  // Footers
  | 'footer-basic'
  | 'footer-commerce'
  | 'footer-service';

export interface SectionDefinition {
  type: SectionType;
  category: SectionCategory;
  label: string;
  description: string;
  icon: string;
  defaultData: Record<string, any>;
}

// --- Template Manifest ---

export interface TemplateManifest {
  family: TemplateFamily;
  requiredSections: SectionType[];
  requiredCategories?: Partial<Record<SectionCategory, number>>; // e.g. { commerce: 1, story: 1 }
  recommendedSections: SectionType[];
  allowedSections: SectionType[];
  maxDuplicates: Partial<Record<SectionType, number>>;
}

// --- Data Models ---

export interface InventoryItem {
  id?: string;
  name: string;
  price: string;
  description: string;
  category: string;
  image_url?: string;
  // Enhanced fields
  variants?: Array<{
    name: string;
    price: string;
    sku?: string;
  }>;
  stock?: number;
  sku?: string;
  tax_rate?: number;
  shipping_class?: 'standard' | 'express' | 'free';
  weight?: number;
  enabled?: boolean;
}

export interface GeneratedSection {
  id: string;
  type: SectionType;
  data: Record<string, any>;
}

export interface SiteData {
  id: string;
  business_name: string;
  business_type: TemplateFamily;
  offerings: string;
  contact_email: string;
  tagline: string;
  theme_id: string;
  template_data: {
    sections: GeneratedSection[];
  };
  status: SiteStatus;
  subdomain: string | null;
  stripe_account_id: string | null;
  site_token: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateDefinition {
  family: TemplateFamily;
  label: string;
  kicker: string;
  headline: string;
  summary: string;
  demoUrl: string;
  primaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

// --- Theme System ---

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or short label
  tokens: ThemeTokens;
}

export interface ThemeTokens {
  // Colors
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  // Typography
  headingFont: string;
  bodyFont: string;
  // Radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;
  // Shadows
  shadowSm: string;
  shadowMd: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'milano',
    name: 'Milano',
    description: 'Editorial luxury with serif headlines and muted tones',
    preview: '🖤',
    tokens: {
      primary: '#2D2D2D',
      primaryHover: '#3D3D3D',
      secondary: '#F9F8F6',
      accent: '#B8860B',
      background: '#F9F8F6',
      surface: '#FFFFFF',
      text: '#2D2D2D',
      textMuted: '#777777',
      textInverse: '#FFFFFF',
      border: '#E5E5E5',
      headingFont: '"Playfair Display", Georgia, serif',
      bodyFont: '"Lora", Georgia, serif',
      radiusSm: '2px',
      radiusMd: '6px',
      radiusLg: '12px',
      radiusFull: '9999px',
      shadowSm: '0 1px 3px rgba(0,0,0,0.04)',
      shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'botanical',
    name: 'Botanical',
    description: 'Fresh, organic feel with sage greens and warm whites',
    preview: '🌿',
    tokens: {
      primary: '#16A34A',
      primaryHover: '#15803D',
      secondary: '#F0FDF4',
      accent: '#86EFAC',
      background: '#FEFFFE',
      surface: '#F0FDF4',
      text: '#14532D',
      textMuted: '#4ADE80',
      textInverse: '#FFFFFF',
      border: '#BBF7D0',
      headingFont: '"Lora", Georgia, serif',
      bodyFont: '"Source Sans 3", system-ui, sans-serif',
      radiusSm: '8px',
      radiusMd: '16px',
      radiusLg: '24px',
      radiusFull: '9999px',
      shadowSm: '0 1px 3px rgba(22,163,74,0.06)',
      shadowMd: '0 4px 16px rgba(22,163,74,0.12)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Bold, confident dark theme with sharp contrast',
    preview: '🌙',
    tokens: {
      primary: '#2E2A5A',
      primaryHover: '#3E3A6A',
      secondary: '#1A1A2E',
      accent: '#7C3AED',
      background: '#0F0F1A',
      surface: '#1A1A2E',
      text: '#E2E8F0',
      textMuted: '#8888AA',
      textInverse: '#0F0F1A',
      border: '#2A2A3E',
      headingFont: '"Space Grotesk", system-ui, sans-serif',
      bodyFont: '"Inter", system-ui, sans-serif',
      radiusSm: '2px',
      radiusMd: '6px',
      radiusLg: '12px',
      radiusFull: '9999px',
      shadowSm: '0 1px 3px rgba(0,0,0,0.2)',
      shadowMd: '0 4px 20px rgba(0,0,0,0.3)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm, inviting tones with terracotta and cream',
    preview: '🌅',
    tokens: {
      primary: '#B45309',
      primaryHover: '#92400E',
      secondary: '#FFF8F0',
      accent: '#D4A574',
      background: '#FFFBF5',
      surface: '#FFFFFF',
      text: '#3D2B1F',
      textMuted: '#8B7355',
      textInverse: '#FFFFFF',
      border: '#F0E6D8',
      headingFont: '"Lora", Georgia, serif',
      bodyFont: '"Source Sans 3", system-ui, sans-serif',
      radiusSm: '6px',
      radiusMd: '12px',
      radiusLg: '24px',
      radiusFull: '9999px',
      shadowSm: '0 1px 3px rgba(180,83,9,0.06)',
      shadowMd: '0 4px 16px rgba(180,83,9,0.12)',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Clean, minimal with crisp whites and cool grays',
    preview: '❄️',
    tokens: {
      primary: '#1D4ED8',
      primaryHover: '#1E40AF',
      secondary: '#F8FAFC',
      accent: '#06B6D4',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      textMuted: '#64748B',
      textInverse: '#FFFFFF',
      border: '#E2E8F0',
      headingFont: '"Plus Jakarta Sans", system-ui, sans-serif',
      bodyFont: '"Inter", system-ui, sans-serif',
      radiusSm: '4px',
      radiusMd: '8px',
      radiusLg: '16px',
      radiusFull: '9999px',
      shadowSm: '0 1px 2px rgba(0,0,0,0.04)',
      shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Pick your own 3 brand colors',
    preview: '🎨',
    tokens: {
      primary: '#2D2D2D',
      primaryHover: '#3D3D3D',
      secondary: '#F9F8F6',
      accent: '#B8860B',
      background: '#F9F8F6',
      surface: '#FFFFFF',
      text: '#2D2D2D',
      textMuted: '#777777',
      textInverse: '#FFFFFF',
      border: '#E5E5E5',
      headingFont: '"Playfair Display", Georgia, serif',
      bodyFont: '"Lora", Georgia, serif',
      radiusSm: '2px',
      radiusMd: '6px',
      radiusLg: '12px',
      radiusFull: '9999px',
      shadowSm: '0 1px 3px rgba(0,0,0,0.04)',
      shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
    },
  },
];

export interface PageData {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  sections: GeneratedSection[];
  created_at: string;
  updated_at: string;
}

// --- Publish Validation ---

export interface PublishValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
