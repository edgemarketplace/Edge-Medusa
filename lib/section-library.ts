import type { SectionDefinition, SectionType, TemplateManifest, TemplateFamily } from './types';

// --- Section Library ---

export const SECTION_LIBRARY: Record<SectionType, SectionDefinition> = {
  // Headers
  'header-simple': {
    type: 'header-simple',
    category: 'header',
    label: 'Simple Header',
    description: 'Logo + nav links + CTA button',
    icon: '🔝',
    defaultData: { logoText: '', links: [{ label: 'Home', url: '#' }], ctaText: 'Get started', ctaUrl: '#' },
  },
  'header-promo': {
    type: 'header-promo',
    category: 'header',
    label: 'Promo Header',
    description: 'Announcement bar + simple header',
    icon: '📢',
    defaultData: { announcement: 'Free shipping on orders over $50!', logoText: '', links: [{ label: 'Home', url: '#' }] },
  },
  'header-mega': {
    type: 'header-mega',
    category: 'header',
    label: 'Mega Nav',
    description: 'Header with dropdown mega menu',
    icon: '🗂',
    defaultData: { logoText: '', links: [{ label: 'Shop', url: '#', children: [] }], ctaText: 'Shop now' },
  },

  // Heroes
  'hero-split': {
    type: 'hero-split',
    category: 'hero',
    label: 'Split Hero',
    description: 'Text left, image right',
    icon: '⬜',
    defaultData: { heading: 'Your headline here', subheading: 'A compelling subheading that explains your value.', ctaText: 'Shop now', ctaUrl: '#', imageUrl: '' },
  },
  'hero-visual': {
    type: 'hero-visual',
    category: 'hero',
    label: 'Visual Hero',
    description: 'Full-width background image with overlay text',
    icon: '🖼',
    defaultData: { heading: 'Your headline here', subheading: 'A compelling subheading.', ctaText: 'Shop now', imageUrl: '', overlayOpacity: 0.4 },
  },
  'hero-products': {
    type: 'hero-products',
    category: 'hero',
    label: 'Hero with Products',
    description: 'Hero with featured product cards',
    icon: '🛍',
    defaultData: { heading: 'Featured Products', subheading: 'Our best sellers', ctaText: 'View all', items: [] },
  },
  'hero-cta': {
    type: 'hero-cta',
    category: 'hero',
    label: 'Hero with CTA',
    description: 'Centered hero with email capture',
    icon: '📧',
    defaultData: { heading: 'Join our community', subheading: 'Get exclusive offers and updates.', ctaText: 'Subscribe', showEmailCapture: true },
  },
  'hero-trust': {
    type: 'hero-trust',
    category: 'hero',
    label: 'Hero with Trust Bar',
    description: 'Hero with trust badges below',
    icon: '🛡',
    defaultData: { heading: 'Your headline here', subheading: 'Trusted by thousands.', ctaText: 'Get started', trustBadges: ['Free shipping', '30-day returns', 'Secure checkout'] },
  },

  // Commerce discovery
  'featured-collection': {
    type: 'featured-collection',
    category: 'commerce',
    label: 'Featured Collection',
    description: 'Highlight a curated collection',
    icon: '⭐',
    defaultData: { title: 'Featured Collection', collectionName: '', itemCount: 4 },
  },
  'product-grid': {
    type: 'product-grid',
    category: 'commerce',
    label: 'Product Grid',
    description: 'Grid of products with filters',
    icon: '📦',
    defaultData: { title: 'All Products', columns: 3, showFilters: true, items: [] },
  },
  'best-sellers': {
    type: 'best-sellers',
    category: 'commerce',
    label: 'Best Sellers',
    description: 'Top-selling products carousel',
    icon: '🏆',
    defaultData: { title: 'Best Sellers', items: [] },
  },
  'collection-carousel': {
    type: 'collection-carousel',
    category: 'commerce',
    label: 'Collection Carousel',
    description: 'Swipeable collection cards',
    icon: '🎠',
    defaultData: { title: 'Shop by Category', collections: [] },
  },

  // Storytelling
  'brand-story': {
    type: 'brand-story',
    category: 'storytelling',
    label: 'Brand Story',
    description: 'Full-width brand narrative',
    icon: '📖',
    defaultData: { headline: 'Our Story', body: 'Tell your brand story here.', imageUrl: '' },
  },
  'value-icons': {
    type: 'value-icons',
    category: 'storytelling',
    label: 'Value Icons',
    description: 'Icon grid of key values/benefits',
    icon: '💎',
    defaultData: { title: 'Why choose us', values: [{ icon: '🚚', title: 'Fast delivery', description: '' }] },
  },
  'editorial-split': {
    type: 'editorial-split',
    category: 'storytelling',
    label: 'Editorial Split',
    description: 'Image + text side by side',
    icon: '📰',
    defaultData: { headline: 'Editorial headline', body: 'Supporting text goes here.', imageUrl: '', imageLeft: true },
  },
  'founder-note': {
    type: 'founder-note',
    category: 'storytelling',
    label: 'Founder Note',
    description: 'Personal message from the founder',
    icon: '✍️',
    defaultData: { founderName: '', founderTitle: '', quote: 'Your quote here.', imageUrl: '' },
  },

  // Social proof
  'testimonials': {
    type: 'testimonials',
    category: 'social-proof',
    label: 'Testimonials',
    description: 'Customer testimonial cards',
    icon: '💬',
    defaultData: { title: 'What customers say', testimonials: [{ name: '', quote: '', rating: 5 }] },
  },
  'reviews': {
    type: 'reviews',
    category: 'social-proof',
    label: 'Reviews',
    description: 'Star ratings with review text',
    icon: '⭐',
    defaultData: { title: 'Customer Reviews', reviews: [{ name: '', rating: 5, text: '' }] },
  },
  'logo-bar': {
    type: 'logo-bar',
    category: 'social-proof',
    label: 'Logo Bar',
    description: 'Trusted by / As seen in logos',
    icon: '🏢',
    defaultData: { title: 'Trusted by', logos: [] },
  },
  'stats': {
    type: 'stats',
    category: 'social-proof',
    label: 'Stats',
    description: 'Key numbers and metrics',
    icon: '📊',
    defaultData: { stats: [{ value: '10K+', label: 'Happy customers' }] },
  },
  'press': {
    type: 'press',
    category: 'social-proof',
    label: 'Press Mentions',
    description: 'Press logos and quotes',
    icon: '📰',
    defaultData: { title: 'As seen in', mentions: [{ outlet: '', quote: '' }] },
  },

  // Service selling
  'service-list': {
    type: 'service-list',
    category: 'service',
    label: 'Service List',
    description: 'List of services with descriptions',
    icon: '🔧',
    defaultData: { title: 'Our Services', services: [{ name: '', description: '', price: '' }] },
  },
  'pricing-tiers': {
    type: 'pricing-tiers',
    category: 'service',
    label: 'Pricing Tiers',
    description: 'Side-by-side pricing comparison',
    icon: '💰',
    defaultData: { title: 'Pricing', tiers: [{ name: '', price: '', features: [''], highlighted: false }] },
  },
  'packages': {
    type: 'packages',
    category: 'service',
    label: 'Packages',
    description: 'Service package cards',
    icon: '📋',
    defaultData: { title: 'Packages', packages: [{ name: '', description: '', price: '', features: [''] }] },
  },
  'quote-cta': {
    type: 'quote-cta',
    category: 'service',
    label: 'Quote CTA',
    description: 'Request a quote form',
    icon: '📝',
    defaultData: { headline: 'Get a free quote', subheading: 'Tell us about your project.', ctaText: 'Request quote', showForm: true },
  },
  'booking-cta': {
    type: 'booking-cta',
    category: 'service',
    label: 'Booking CTA',
    description: 'Book an appointment',
    icon: '📅',
    defaultData: { headline: 'Book an appointment', subheading: 'Choose a time that works for you.', ctaText: 'Book now' },
  },

  // Media
  'gallery': {
    type: 'gallery',
    category: 'media',
    label: 'Image Gallery',
    description: 'Grid of images',
    icon: '🖼',
    defaultData: { title: 'Gallery', images: [] },
  },
  'video': {
    type: 'video',
    category: 'media',
    label: 'Video Section',
    description: 'Embedded video player',
    icon: '🎬',
    defaultData: { title: '', videoUrl: '', thumbnailUrl: '' },
  },
  'before-after': {
    type: 'before-after',
    category: 'media',
    label: 'Before & After',
    description: 'Side-by-side comparison slider',
    icon: '🔄',
    defaultData: { title: 'Before & After', pairs: [{ beforeUrl: '', afterUrl: '', label: '' }] },
  },
  'social-gallery': {
    type: 'social-gallery',
    category: 'media',
    label: 'Social Gallery',
    description: 'Instagram/social media feed',
    icon: '📱',
    defaultData: { title: 'Follow us @yourhandle', images: [] },
  },

  // Conversion
  'faq': {
    type: 'faq',
    category: 'conversion',
    label: 'FAQ',
    description: 'Frequently asked questions accordion',
    icon: '❓',
    defaultData: { title: 'Frequently Asked Questions', questions: [{ question: '', answer: '' }] },
  },
  'newsletter': {
    type: 'newsletter',
    category: 'conversion',
    label: 'Newsletter',
    description: 'Email signup section',
    icon: '📧',
    defaultData: { headline: 'Stay in the loop', subheading: 'Get updates and exclusive offers.', ctaText: 'Subscribe' },
  },
  'promo-banner': {
    type: 'promo-banner',
    category: 'conversion',
    label: 'Promo Banner',
    description: 'Full-width promotional banner',
    icon: '🎁',
    defaultData: { text: 'Limited time offer — 20% off everything!', ctaText: 'Shop now', backgroundColor: '#1A1A1A', textColor: '#FFFFFF' },
  },
  'sticky-cta': {
    type: 'sticky-cta',
    category: 'conversion',
    label: 'Sticky CTA',
    description: 'Floating call-to-action bar',
    icon: '📌',
    defaultData: { text: 'Ready to get started?', ctaText: 'Shop now', position: 'bottom' },
  },

  // Footers
  'footer-basic': {
    type: 'footer-basic',
    category: 'footer',
    label: 'Basic Footer',
    description: 'Simple footer with links',
    icon: '🔚',
    defaultData: { logoText: '', links: [{ label: 'Privacy', url: '#' }], copyright: '' },
  },
  'footer-commerce': {
    type: 'footer-commerce',
    category: 'footer',
    label: 'Commerce Footer',
    description: 'Footer with newsletter and links',
    icon: '🛒',
    defaultData: { logoText: '', newsletter: true, columns: [{ title: 'Shop', links: [] }], copyright: '' },
  },
  'footer-service': {
    type: 'footer-service',
    category: 'footer',
    label: 'Service Footer',
    description: 'Footer with contact info and hours',
    icon: '🔧',
    defaultData: { logoText: '', showContact: true, showHours: true, hours: 'Mon-Fri 9am-5pm', copyright: '' },
  },
};

// Grouped by category for the left rail
export const SECTION_CATEGORIES: { category: string; label: string; icon: string; types: SectionType[] }[] = [
  { category: 'header', label: 'Headers', icon: '🔝', types: ['header-simple', 'header-promo', 'header-mega'] },
  { category: 'hero', label: 'Heroes', icon: '🖼', types: ['hero-split', 'hero-visual', 'hero-products', 'hero-cta', 'hero-trust'] },
  { category: 'commerce', label: 'Commerce', icon: '🛍', types: ['featured-collection', 'product-grid', 'best-sellers', 'collection-carousel'] },
  { category: 'storytelling', label: 'Storytelling', icon: '📖', types: ['brand-story', 'value-icons', 'editorial-split', 'founder-note'] },
  { category: 'social-proof', label: 'Social Proof', icon: '💬', types: ['testimonials', 'reviews', 'logo-bar', 'stats', 'press'] },
  { category: 'service', label: 'Services', icon: '🔧', types: ['service-list', 'pricing-tiers', 'packages', 'quote-cta', 'booking-cta'] },
  { category: 'media', label: 'Media', icon: '🎬', types: ['gallery', 'video', 'before-after', 'social-gallery'] },
  { category: 'conversion', label: 'Conversion', icon: '📌', types: ['faq', 'newsletter', 'promo-banner', 'sticky-cta'] },
  { category: 'footer', label: 'Footers', icon: '🔚', types: ['footer-basic', 'footer-commerce', 'footer-service'] },
];

// --- Template Manifests ---

export const TEMPLATE_MANIFESTS: Record<TemplateFamily, TemplateManifest> = {
  'retail-core': {
    family: 'retail-core',
    requiredSections: ['header-simple', 'hero-visual', 'product-grid', 'footer-commerce'],
    recommendedSections: ['featured-collection', 'best-sellers', 'testimonials', 'newsletter', 'faq'],
    allowedSections: ['header-simple', 'header-promo', 'header-mega', 'hero-split', 'hero-visual', 'hero-products', 'hero-cta', 'hero-trust', 'featured-collection', 'product-grid', 'best-sellers', 'collection-carousel', 'brand-story', 'value-icons', 'editorial-split', 'testimonials', 'reviews', 'logo-bar', 'stats', 'gallery', 'video', 'faq', 'newsletter', 'promo-banner', 'sticky-cta', 'footer-basic', 'footer-commerce'],
    maxDuplicates: { 'product-grid': 2, 'hero-visual': 1, 'hero-split': 1, 'testimonials': 1, 'faq': 1 },
  },
  'service-pro': {
    family: 'service-pro',
    requiredSections: ['header-simple', 'hero-split', 'service-list', 'quote-cta', 'footer-service'],
    recommendedSections: ['pricing-tiers', 'testimonials', 'before-after', 'faq', 'value-icons'],
    allowedSections: ['header-simple', 'header-promo', 'hero-split', 'hero-visual', 'hero-cta', 'hero-trust', 'service-list', 'pricing-tiers', 'packages', 'quote-cta', 'booking-cta', 'brand-story', 'value-icons', 'editorial-split', 'founder-note', 'testimonials', 'reviews', 'logo-bar', 'stats', 'gallery', 'video', 'before-after', 'faq', 'newsletter', 'promo-banner', 'footer-basic', 'footer-service'],
    maxDuplicates: { 'service-list': 1, 'pricing-tiers': 1, 'hero-split': 1, 'testimonials': 1 },
  },
  'food-catering': {
    family: 'food-catering',
    requiredSections: ['header-simple', 'hero-visual', 'packages', 'booking-cta', 'footer-service'],
    recommendedSections: ['service-list', 'testimonials', 'gallery', 'faq', 'newsletter'],
    allowedSections: ['header-simple', 'header-promo', 'hero-split', 'hero-visual', 'hero-cta', 'hero-trust', 'service-list', 'packages', 'booking-cta', 'brand-story', 'value-icons', 'testimonials', 'reviews', 'logo-bar', 'stats', 'gallery', 'video', 'before-after', 'social-gallery', 'faq', 'newsletter', 'promo-banner', 'footer-basic', 'footer-service'],
    maxDuplicates: { 'packages': 1, 'hero-visual': 1, 'gallery': 1 },
  },
  'artisan-market': {
    family: 'artisan-market',
    requiredSections: ['header-simple', 'hero-visual', 'product-grid', 'brand-story', 'footer-basic'],
    recommendedSections: ['featured-collection', 'founder-note', 'testimonials', 'gallery', 'newsletter'],
    allowedSections: ['header-simple', 'header-promo', 'header-mega', 'hero-split', 'hero-visual', 'hero-products', 'hero-cta', 'featured-collection', 'product-grid', 'best-sellers', 'collection-carousel', 'brand-story', 'value-icons', 'editorial-split', 'founder-note', 'testimonials', 'reviews', 'logo-bar', 'stats', 'press', 'gallery', 'video', 'social-gallery', 'faq', 'newsletter', 'promo-banner', 'footer-basic', 'footer-commerce'],
    maxDuplicates: { 'product-grid': 2, 'hero-visual': 1, 'gallery': 1 },
  },
  'event-floral': {
    family: 'event-floral',
    requiredSections: ['header-simple', 'hero-visual', 'packages', 'quote-cta', 'footer-basic'],
    recommendedSections: ['gallery', 'testimonials', 'before-after', 'faq', 'newsletter'],
    allowedSections: ['header-simple', 'header-promo', 'hero-split', 'hero-visual', 'hero-cta', 'hero-trust', 'packages', 'quote-cta', 'booking-cta', 'brand-story', 'value-icons', 'editorial-split', 'founder-note', 'testimonials', 'reviews', 'logo-bar', 'stats', 'press', 'gallery', 'video', 'before-after', 'social-gallery', 'faq', 'newsletter', 'promo-banner', 'footer-basic', 'footer-service'],
    maxDuplicates: { 'packages': 1, 'hero-visual': 1, 'gallery': 2, 'testimonials': 1 },
  },
};

// --- Publish Validation ---

import type { GeneratedSection, PublishValidation } from './types';

export function validatePublish(sections: GeneratedSection[], manifest: TemplateManifest): PublishValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sectionTypes = sections.map(s => s.type);
  const typeCounts: Record<string, number> = {};
  sectionTypes.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });

  // Check required sections — accept any type within the same category
  for (const required of manifest.requiredSections) {
    const requiredDef = SECTION_LIBRARY[required];
    if (!requiredDef) continue;
    const category = requiredDef.category;
    
    // For header, hero, footer — accept any type in that category
    if (category === 'header' || category === 'hero' || category === 'footer') {
      const hasType = sectionTypes.some(t => SECTION_LIBRARY[t]?.category === category);
      if (!hasType) {
        const label = category === 'header' ? 'Header' : category === 'hero' ? 'Hero' : 'Footer';
        errors.push(`Missing required section: ${label} (any type)`);
      }
    } else if (!sectionTypes.includes(required)) {
      const def = SECTION_LIBRARY[required];
      errors.push(`Missing required section: ${def?.label || required}`);
    }
  }

  // Check exactly-one constraints (headers, heroes, footers)
  const headerCount = sectionTypes.filter(t => t.startsWith('header-')).length;
  const heroCount = sectionTypes.filter(t => t.startsWith('hero-')).length;
  const footerCount = sectionTypes.filter(t => t.startsWith('footer-')).length;

  if (headerCount === 0) errors.push('Missing required section: Header');
  if (headerCount > 1) errors.push('Only one header section allowed');
  if (heroCount === 0) errors.push('Missing required section: Hero');
  if (heroCount > 1) errors.push('Only one hero section allowed');
  if (footerCount === 0) errors.push('Missing required section: Footer');
  if (footerCount > 1) errors.push('Only one footer section allowed');

  // Check at least one conversion section
  const conversionTypes = ['faq', 'newsletter', 'promo-banner', 'sticky-cta', 'quote-cta', 'booking-cta', 'hero-cta'];
  const hasConversion = sectionTypes.some(t => conversionTypes.includes(t));
  if (!hasConversion) errors.push('Missing required section: At least one conversion section (FAQ, Newsletter, CTA, etc.)');

  // Check at least one offering section
  const offeringTypes = ['product-grid', 'featured-collection', 'best-sellers', 'service-list', 'packages', 'pricing-tiers', 'hero-products'];
  const hasOffering = sectionTypes.some(t => offeringTypes.includes(t));
  if (!hasOffering) errors.push('Missing required section: At least one product/service offering section');

  // Check max duplicates
  for (const [type, max] of Object.entries(manifest.maxDuplicates)) {
    const count = typeCounts[type] || 0;
    if (count > max) {
      const def = SECTION_LIBRARY[type as SectionType];
      errors.push(`Too many "${def?.label || type}" sections (max ${max}, found ${count})`);
    }
  }

  // Check allowed sections
  for (const type of sectionTypes) {
    if (!manifest.allowedSections.includes(type as SectionType)) {
      warnings.push(`Section "${SECTION_LIBRARY[type as SectionType]?.label || type}" is not recommended for this template`);
    }
  }

  // Warnings for recommended sections
  for (const recommended of manifest.recommendedSections) {
    if (!sectionTypes.includes(recommended)) {
      const def = SECTION_LIBRARY[recommended];
      warnings.push(`Recommended: Consider adding a "${def?.label || recommended}" section`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
