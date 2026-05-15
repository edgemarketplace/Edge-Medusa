export type TemplateFamily =
  | 'retail-core'
  | 'service-pro'
  | 'food-catering'
  | 'artisan-market'
  | 'event-floral';

export type SiteStatus = 'draft' | 'ready' | 'live';

export interface InventoryItem {
  id?: string;
  name: string;
  price: string;
  description: string;
  category: string;
  image_url?: string;
}

export interface GeneratedSection {
  type: 'hero' | 'products' | 'about' | 'contact';
  heading?: string;
  subheading?: string;
  headline?: string;
  ctaText?: string;
  body?: string;
  title?: string;
  hero_image_url?: string;
  items?: Array<{
    name: string;
    price: string;
    description: string;
    image_url?: string;
  }>;
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
