     1|export type TemplateFamily =
     2|  | 'retail-core'
     3|  | 'service-pro'
     4|  | 'food-catering'
     5|  | 'artisan-market'
     6|  | 'event-floral'
     7|  | 'coach-educator';
     8|
     9|export type SiteStatus = 'draft' | 'ready' | 'live';
    10|
    11|// --- Section Categories & Types ---
    12|
    13|export type SectionCategory =
    14|  | 'header'
    15|  | 'hero'
    16|  | 'commerce'
    17|  | 'storytelling'
    18|  | 'social-proof'
    19|  | 'service'
    20|  | 'media'
    21|  | 'conversion'
    22|  | 'footer';
    23|
    24|export type SectionType =
    25|  // Headers
    26|  | 'header-simple'
    27|  | 'header-promo'
    28|  | 'header-mega'
    29|  // Heroes
    30|  | 'hero-split'
    31|  | 'hero-visual'
    32|  | 'hero-products'
    33|  | 'hero-cta'
    34|  | 'hero-trust'
    35|  // Commerce discovery
    36|  | 'featured-collection'
    37|  | 'product-grid'
    38|  | 'best-sellers'
    39|  | 'collection-carousel'
    40|  // Storytelling
    41|  | 'brand-story'
    42|  | 'value-icons'
    43|  | 'editorial-split'
    44|  | 'founder-note'
    45|  // Social proof
    46|  | 'testimonials'
    47|  | 'reviews'
    48|  | 'logo-bar'
    49|  | 'stats'
    50|  | 'press'
    51|  // Service selling
    52|  | 'service-list'
    53|  | 'pricing-tiers'
    54|  | 'packages'
    55|  | 'quote-cta'
    56|  | 'booking-cta'
    57|  // Media
    58|  | 'gallery'
    59|  | 'video'
    60|  | 'before-after'
    61|  | 'social-gallery'
    62|  // Conversion
    63|  | 'faq'
    64|  | 'newsletter'
    65|  | 'promo-banner'
    66|  | 'sticky-cta'
    67|  // Footers
    68|  | 'footer-basic'
    69|  | 'footer-commerce'
    70|  | 'footer-service';
    71|
    72|export interface SectionDefinition {
    73|  type: SectionType;
    74|  category: SectionCategory;
    75|  label: string;
    76|  description: string;
    77|  icon: string;
    78|  defaultData: Record<string, any>;
    79|}
    80|
    81|// --- Template Manifest ---
    82|
    83|export interface TemplateManifest {
    84|  family: TemplateFamily;
    85|  requiredSections: SectionType[];
    86|  recommendedSections: SectionType[];
    87|  allowedSections: SectionType[];
    88|  maxDuplicates: Partial<Record<SectionType, number>>;
    89|}
    90|
    91|// --- Data Models ---
    92|
    93|export interface InventoryItem {
    94|  id?: string;
    95|  name: string;
    96|  price: string;
    97|  description: string;
    98|  category: string;
    99|  image_url?: string;
   100|  // Enhanced fields
   101|  variants?: Array<{
   102|    name: string;
   103|    price: string;
   104|    sku?: string;
   105|  }>;
   106|  stock?: number;
   107|  sku?: string;
   108|  tax_rate?: number;
   109|  shipping_class?: 'standard' | 'express' | 'free';
   110|  weight?: number;
   111|  enabled?: boolean;
   112|}
   113|
   114|export interface GeneratedSection {
   115|  id: string;
   116|  type: SectionType;
   117|  data: Record<string, any>;
   118|}
   119|export interface SiteData {
   120|  id: string;
   121|  business_name: string;
   122|  business_type: TemplateFamily;
   123|  offerings: string;
   124|  contact_email: string;
   125|  tagline: string;
   126|  theme_id: string;
   127|  template_data: {
   128|    sections: GeneratedSection[];
   129|  };
   130|  status: SiteStatus;
   131|  subdomain: string | null;
   132|  stripe_account_id: string | null;
   133|  site_token: string;
   134|  created_at: string;
   135|  updated_at: string;
   136|}
   137|
   138|export interface TemplateDefinition {
   139|  family: TemplateFamily;
   140|  label: string;
   141|  kicker: string;
   142|  headline: string;
   143|  summary: string;
   144|  primaryColor: string;
   145|  fontFamily: string;
   146|  borderRadius: string;
   147|}
   148|
   149|// --- Theme System ---
   150|
   151|export interface ThemePreset {
   152|  id: string;
   153|  name: string;
   154|  description: string;
   155|  preview: string; // emoji or short label
   156|  tokens: ThemeTokens;
   157|}
   158|
   159|export interface ThemeTokens {
   160|  // Colors
   161|  primary: string;
   162|  primaryHover: string;
   163|  secondary: string;
   164|  accent: string;
   165|  background: string;
   166|  surface: string;
   167|  text: string;
   168|  textMuted: string;
   169|  textInverse: string;
   170|  border: string;
   171|  // Typography
   172|  headingFont: string;
   173|  bodyFont: string;
   174|  // Radius
   175|  radiusSm: string;
   176|  radiusMd: string;
   177|  radiusLg: string;
   178|  radiusFull: string;
   179|  // Shadows
   180|  shadowSm: string;
   181|  shadowMd: string;
   182|}
   183|
   184|
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
    id: 'noir',
    name: 'Noir',
    description: 'Ultra-minimal black and white with dramatic typography',
    preview: '🖤',
    tokens: {
      primary: '#1A1A1A',
      primaryHover: '#333333',
      secondary: '#F5F5F5',
      accent: '#FF3366',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#1A1A1A',
      textMuted: '#737373',
      textInverse: '#FFFFFF',
      border: '#E5E5E5',
      headingFont: '"Syne", system-ui, sans-serif',
      bodyFont: '"Inter", system-ui, sans-serif',
      radiusSm: '0px',
      radiusMd: '2px',
      radiusLg: '4px',
      radiusFull: '9999px',
      shadowSm: 'none',
      shadowMd: '0 2px 8px rgba(0,0,0,0.08)',
    },
  },
];
export interface PageData {
   344|  id: string;
   345|  site_id: string;
   346|  slug: string;
   347|  title: string;
   348|  sections: GeneratedSection[];
   349|  created_at: string;
   350|  updated_at: string;
   351|}
   352|
   353|// --- Publish Validation ---
   354|
   355|export interface PublishValidation {
   356|  valid: boolean;
   357|  errors: string[];
   358|  warnings: string[];
   359|}
   360|