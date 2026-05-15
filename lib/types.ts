export type TemplateFamily =
  | 'retail-core'
  | 'service-pro'
  | 'food-catering'
  | 'artisan-market'
  | 'event-floral';

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
  primaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

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
