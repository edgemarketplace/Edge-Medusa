import OpenAI from 'openai';
import { GeneratedSection, TemplateFamily, SectionType } from './types';
import { TEMPLATES } from './templates';
import { TEMPLATE_MANIFESTS, SECTION_LIBRARY, PAGE_TEMPLATES } from './section-library';
import { processImagesInPages } from './unsplash';
import { pickRandomPreset, type StylePreset } from './style-presets';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
      throw new Error('OPENAI_API_KEY or GOOGLE_API_KEY is required');
    }
    // Prefer Gemini if available, otherwise OpenAI
    if (process.env.GOOGLE_API_KEY) {
      // Will use Gemini via different path
      throw new Error('Use Gemini path instead');
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openaiInstance;
}

// --- Template System: Fixed Structural Recipes ---

interface TemplateSystemConfig {
  templateName: string;
  industry: string;
  primaryGoal: string;
  designPersonality: string;
  conversionType: string;
  referenceModel: string;
  recommendedBusinesses: string[];
  coreSectionStack: { type: SectionType; purpose: string; required: boolean }[];
  optionalSections: SectionType[];
  styleVariations: string[];
  randomizationRules: {
    allowed: string[];
    restricted: string[];
  };
  contentPriorities: string[];
  mobileBehavior: string;
  trustElements: string[];
  ctaStrategy: {
    primary: string[];
    secondary: string[];
  };
  fallbackLogic: string;
}

const TEMPLATE_SYSTEM: Record<TemplateFamily, TemplateSystemConfig> = {
  'retail-core': {
    templateName: 'CATALOG LUXE',
    industry: 'Retail Core',
    primaryGoal: 'Fast product discovery with premium brand perception',
    designPersonality: 'Editorial luxury storefront',
    conversionType: 'Direct ecommerce purchase',
    referenceModel: 'Houseplant',
    recommendedBusinesses: ['premium retail', 'wellness products', 'gift shops', 'home goods', 'lifestyle brands', 'curated ecommerce'],
    coreSectionStack: [
      { type: 'header-promo', purpose: 'Announcement bar for seasonal offers', required: true },
      { type: 'header-mega', purpose: 'Mega navigation for product discovery', required: true },
      { type: 'hero-products', purpose: 'Hero with featured products', required: true },
      { type: 'featured-collection', purpose: 'Curated browsing with large imagery', required: true },
      { type: 'product-grid', purpose: 'Full catalog browsing', required: true },
      { type: 'collection-carousel', purpose: 'Category-based shopping', required: true },
      { type: 'brand-story', purpose: 'Brand identity and mission', required: true },
      { type: 'founder-note', purpose: 'Founder authenticity and story', required: false },
      { type: 'reviews', purpose: 'Social proof for conversion', required: true },
      { type: 'faq', purpose: 'Address purchase objections', required: true },
      { type: 'newsletter', purpose: 'Email capture for retention', required: true },
      { type: 'footer-commerce', purpose: 'Trust signals and navigation', required: true },
    ],
    optionalSections: ['best-sellers', 'logo-bar', 'stats', 'press', 'editorial-split'],
    styleVariations: ['Dark Luxury', 'Clean Minimal', 'Earthy Maker', 'Colorful Lifestyle', 'Modern Monochrome'],
    randomizationRules: {
      allowed: ['hero layout', 'image crop style', 'review density', 'featured collection position', 'founder section placement', 'typography pairing', 'card corner radius', 'product grid spacing'],
      restricted: ['navigation structure', 'checkout flow', 'product hierarchy', 'CTA placement', 'section order in core stack'],
    },
    contentPriorities: ['Featured products', 'Collection identity', 'Brand credibility', 'Product storytelling', 'Social proof', 'Purchase confidence'],
    mobileBehavior: 'Stack sections vertically, maintain CTA visibility, collapse mega menu to hamburger',
    trustElements: ['customer reviews', 'shipping guarantees', 'featured press', 'sustainability icons', 'secure checkout indicators'],
    ctaStrategy: {
      primary: ['Shop Now', 'Explore Collection', 'View Best Sellers'],
      secondary: ['Learn the Story', 'Meet the Founder'],
    },
    fallbackLogic: 'If product images unavailable, use Unsplash search for "[product type] luxury". If reviews empty, generate 3 generic positive reviews.',
  },

  'service-pro': {
    templateName: 'AUTHORITY CONVERSION',
    industry: 'Service Pro / Coach / Educator',
    primaryGoal: 'Convert visitors into consultations, bookings, or memberships',
    designPersonality: 'Professional authority with transformation focus',
    conversionType: 'Lead generation + authority building',
    referenceModel: 'Pilates By Amanda',
    recommendedBusinesses: ['coaches', 'consultants', 'therapists', 'fitness professionals', 'educators', 'beauty services', 'online experts'],
    coreSectionStack: [
      { type: 'header-promo', purpose: 'Prominent "Book Consult" CTA', required: true },
      { type: 'hero-trust', purpose: 'Authority hero with transformation headline', required: true },
      { type: 'stats', purpose: 'Trust badges and credentials', required: true },
      { type: 'stats', purpose: 'Authority metrics (clients served, success rate)', required: true },
      { type: 'testimonials', purpose: 'Transformation stories with specific results', required: true },
      { type: 'service-list', purpose: 'Service offerings with clear outcomes', required: true },
      { type: 'pricing-tiers', purpose: 'Pricing transparency', required: true },
      { type: 'video', purpose: 'Video testimonial or demo', required: false },
      { type: 'booking-cta', purpose: 'Low-friction consultation booking', required: true },
      { type: 'newsletter', purpose: 'Build email list', required: false },
      { type: 'faq', purpose: 'Address objections', required: true },
      { type: 'footer-service', purpose: 'Contact and credentials', required: true },
    ],
    optionalSections: ['value-icons', 'press', 'logo-bar'],
    styleVariations: ['Premium Consultant', 'Warm Mentor', 'Calm Educator', 'Energetic Coach', 'Authority Expert'],
    randomizationRules: {
      allowed: ['testimonial density', 'stat display style', 'pricing card layout', 'video placement', 'CTA wording'],
      restricted: ['conversion flow', 'booking visibility', 'mobile CTA access', 'section hierarchy', 'trust bar placement'],
    },
    contentPriorities: ['Transformation promise', 'Authority positioning', 'Testimonials', 'Offer clarity', 'Booking CTA', 'Pricing confidence'],
    mobileBehavior: 'Sticky booking CTA, collapse stats to 2-column, prioritize testimonials',
    trustElements: ['Years of experience', 'Clients served', 'Success rate', 'Certifications', 'Media features'],
    ctaStrategy: {
      primary: ['Book a Free Consult', 'Start Your Journey', 'Get Your Roadmap'],
      secondary: ['Watch My Story', 'See Client Results'],
    },
    fallbackLogic: 'If no testimonials, generate 3 transformation stories with specific metrics. If no video, use hero image with play button overlay.',
  },

  'food-catering': {
    templateName: 'HOSPITALITY QUOTE',
    industry: 'Food & Catering',
    primaryGoal: 'Generate quote requests quickly while showcasing premium hospitality quality',
    designPersonality: 'Luxury hospitality presentation',
    conversionType: 'Lead generation',
    referenceModel: 'Très LA Group',
    recommendedBusinesses: ['catering', 'private chefs', 'bakeries', 'event dining', 'hospitality groups', 'venue catering'],
    coreSectionStack: [
      { type: 'header-promo', purpose: 'Seasonal offer announcement', required: true },
      { type: 'header-simple', purpose: 'Clean navigation with inquiry CTA', required: true },
      { type: 'hero-visual', purpose: 'Cinematic food photography', required: true },
      { type: 'hero-trust', purpose: 'Trust bar for events completed', required: false },
      { type: 'packages', purpose: 'Event packages with clear pricing', required: true },
      { type: 'service-list', purpose: 'Menu categories', required: true },
      { type: 'gallery', purpose: 'Event photography portfolio', required: true },
      { type: 'testimonials', purpose: 'Event host testimonials', required: true },
      { type: 'logo-bar', purpose: 'Venue partnerships', required: false },
      { type: 'quote-cta', purpose: 'Event inquiry form', required: true },
      { type: 'booking-cta', purpose: 'Secondary booking CTA', required: false },
      { type: 'faq', purpose: 'Event planning FAQs', required: true },
      { type: 'footer-service', purpose: 'Contact and service areas', required: true },
    ],
    optionalSections: ['value-icons', 'stats', 'press'],
    styleVariations: ['Wedding Luxury', 'Corporate Catering', 'Boutique Chef', 'Modern Hospitality', 'Venue Hybrid'],
    randomizationRules: {
      allowed: ['gallery format', 'package card design', 'trust bar wording', 'image density', 'CTA position'],
      restricted: ['inquiry flow', 'booking visibility', 'mobile CTA access', 'menu structure'],
    },
    contentPriorities: ['Prestige imagery', 'Trust indicators', 'Event types', 'Packages', 'Inquiry conversion', 'Testimonials'],
    mobileBehavior: 'Sticky "Request Quote" CTA, masonry gallery becomes 1-column, collapse packages to accordion',
    trustElements: ['Events completed', 'Health certifications', 'Venue partnerships', 'Food safety ratings', 'Client testimonials'],
    ctaStrategy: {
      primary: ['Book Your Event', 'Request a Quote', 'View Packages'],
      secondary: ['See Our Work', 'Meet the Chef'],
    },
    fallbackLogic: 'If no gallery images, use Unsplash search for "[cuisine type] catering event". Generate 3 event testimonials if empty.',
  },

  'artisan-market': {
    templateName: 'MAKER PROVENANCE',
    industry: 'Artisan Market',
    primaryGoal: 'Increase perceived product value through craftsmanship storytelling',
    designPersonality: 'Handcrafted authenticity with editorial elegance',
    conversionType: 'Editorial ecommerce',
    referenceModel: 'Farmhouse Pottery',
    recommendedBusinesses: ['ceramics', 'handmade goods', 'candles', 'apothecary', 'artisan foods', 'local makers'],
    coreSectionStack: [
      { type: 'header-mega', purpose: 'Maker-focused branding', required: true },
      { type: 'hero-split', purpose: 'Split hero with maker at work or signature product', required: true },
      { type: 'featured-collection', purpose: 'Curated product showcase', required: true },
      { type: 'product-grid', purpose: 'Full product catalog', required: true },
      { type: 'brand-story', purpose: 'Maker story and philosophy', required: true },
      { type: 'value-icons', purpose: 'Values: handmade, local, sustainable', required: true },
      { type: 'founder-note', purpose: 'Personal note from maker', required: true },
      { type: 'editorial-split', purpose: 'Process or materials deep-dive', required: false },
      { type: 'gallery', purpose: 'Workshop or process imagery', required: false },
      { type: 'reviews', purpose: 'Customer love and connection', required: true },
      { type: 'newsletter', purpose: 'Community building', required: true },
      { type: 'footer-commerce', purpose: 'Warm footer with social', required: true },
    ],
    optionalSections: ['stats', 'press', 'collection-carousel'],
    styleVariations: ['Rustic Heritage', 'Scandinavian Craft', 'Handmade Modern', 'Earthy Organic', 'Cozy Farmhouse'],
    randomizationRules: {
      allowed: ['hero layout (split vs visual)', 'gallery style', 'typography pairing', 'card spacing', 'color warmth'],
      restricted: ['craft narrative flow', 'product hierarchy', 'value icon placement', 'founder note position'],
    },
    contentPriorities: ['Craftsmanship', 'Materials', 'Process', 'Founder authenticity', 'Product detail', 'Slow-living lifestyle positioning'],
    mobileBehavior: 'Vertical stack, emphasize founder story, large product images, sticky "Shop Collection" CTA',
    trustElements: ['Handmade badges', 'Local sourcing', 'Small batch indicators', 'Materials transparency', 'Maker guarantees'],
    ctaStrategy: {
      primary: ['Shop the Collection', 'Meet the Maker', 'Explore Our Story'],
      secondary: ['Visit Our Workshop', 'Join Our Community'],
    },
    fallbackLogic: 'If no maker photo, use Unsplash "[craft] workshop". Generate maker story focusing on process and materials.',
  },

  'event-floral': {
    templateName: 'FLORAL EDITORIAL',
    industry: 'Event & Floral',
    primaryGoal: 'Sell visual taste and emotional branding before logistics',
    designPersonality: 'Editorial visual storytelling',
    conversionType: 'Luxury inquiry conversion',
    referenceModel: 'The Naked Florist',
    recommendedBusinesses: ['florists', 'wedding planners', 'event stylists', 'decorators', 'photographers', 'balloon artists'],
    coreSectionStack: [
      { type: 'header-simple', purpose: 'Elegant minimal navigation', required: true },
      { type: 'hero-visual', purpose: 'Full-screen floral imagery with elegant overlay', required: true },
      { type: 'brand-story', purpose: 'Floral philosophy and style', required: true },
      { type: 'founder-note', purpose: 'Founder passion and approach', required: true },
      { type: 'gallery', purpose: 'Immersive portfolio gallery', required: true },
      { type: 'editorial-split', purpose: 'Style or process deep-dive', required: false },
      { type: 'testimonials', purpose: 'Couple/event host emotional testimonials', required: true },
      { type: 'social-gallery', purpose: 'Instagram-style social proof', required: false },
      { type: 'booking-cta', purpose: 'Inquiry form for events', required: true },
      { type: 'faq', purpose: 'Wedding/event planning FAQs', required: true },
      { type: 'footer-basic', purpose: 'Minimal elegant footer', required: true },
    ],
    optionalSections: ['packages', 'value-icons', 'press', 'logo-bar'],
    styleVariations: ['Romantic Editorial', 'Fine Art Pastel', 'Moody Luxury', 'Modern Minimal', 'Garden Organic'],
    randomizationRules: {
      allowed: ['gallery layout', 'hero image crop', 'typography elegance level', 'section spacing', 'image density'],
      restricted: ['emotional narrative flow', 'portfolio-first layout', 'inquiry form placement', 'visual hierarchy'],
    },
    contentPriorities: ['Large visual storytelling', 'Emotional copy', 'Sparse elegant layouts', 'Minimal interface clutter', 'Event type clarity'],
    mobileBehavior: 'Full-screen hero, 1-column gallery, sticky "Start Your Inquiry" CTA, collapse editorial sections',
    trustElements: ['Weddings completed', 'Featured venues', 'Awards', 'Press features', 'Photographer partnerships'],
    ctaStrategy: {
      primary: ['Start Your Inquiry', 'View Our Work', 'Book a Consultation'],
      secondary: ['See Wedding Gallery', 'Meet the Florist'],
    },
    fallbackLogic: 'If no portfolio images, use Unsplash "wedding florals luxury". Generate 3 emotional wedding testimonials.',
  },

  'coach-educator': {
    templateName: 'AUTHORITY CONVERSION',
    industry: 'Coach / Educator',
    primaryGoal: 'Convert visitors into consultations, bookings, or memberships',
    designPersonality: 'Authoritative yet empathetic transformation focus',
    conversionType: 'Lead generation + authority building',
    referenceModel: 'Pilates By Amanda',
    recommendedBusinesses: ['coaches', 'consultants', 'therapists', 'fitness professionals', 'educators', 'online experts'],
    coreSectionStack: [
      { type: 'header-promo', purpose: 'Announcement for new program or limited enrollment', required: true },
      { type: 'hero-trust', purpose: 'Transformation hero with bold claim', required: true },
      { type: 'stats', purpose: 'Credentials and trust badges', required: true },
      { type: 'stats', purpose: 'Transformation metrics', required: true },
      { type: 'testimonials', purpose: 'Specific transformation results', required: true },
      { type: 'service-list', purpose: 'Coaching programs with outcomes', required: true },
      { type: 'pricing-tiers', purpose: 'Program pricing tiers', required: true },
      { type: 'video', purpose: 'Transformation story video', required: false },
      { type: 'booking-cta', purpose: 'Consultation booking', required: true },
      { type: 'newsletter', purpose: 'Lead magnet and email list', required: false },
      { type: 'faq', purpose: 'Address cost and time objections', required: true },
      { type: 'footer-basic', purpose: 'Clean footer with credentials', required: true },
    ],
    optionalSections: ['value-icons', 'press', 'logo-bar'],
    styleVariations: ['Premium Consultant', 'Warm Mentor', 'Calm Educator', 'Energetic Coach', 'Authority Expert'],
    randomizationRules: {
      allowed: ['testimonial format', 'stat presentation', 'pricing card style', 'video placement', 'CTA wording variety'],
      restricted: ['transformation narrative', 'booking flow', 'mobile CTA access', 'authority positioning'],
    },
    contentPriorities: ['Transformation promise', 'Authority positioning', 'Testimonials', 'Offer clarity', 'Booking CTA', 'Pricing confidence'],
    mobileBehavior: 'Sticky "Book Consult" CTA, 2-column stats, prioritize video testimonial, collapse pricing to accordion',
    trustElements: ['Certifications', 'Years experience', 'Clients coached', 'Success rate', 'Media appearances', 'Methodology'],
    ctaStrategy: {
      primary: ['Book a Free Consult', 'Start Your Transformation', 'Get Your Roadmap'],
      secondary: ['Watch My Story', 'See Client Results', 'Download Free Guide'],
    },
    fallbackLogic: 'If no testimonials, generate 3 specific transformation stories with metrics. If no video, use founder photo with play overlay.',
  },
};

// --- Prompt Builder with Fixed Structural Recipes ---

function buildPrompt(
  businessName: string,
  businessType: TemplateFamily,
  offerings: string,
  contactEmail: string,
  tagline: string,
  preset: StylePreset,
): string {
  const template = TEMPLATES[businessType];
  const manifest = TEMPLATE_MANIFESTS[businessType];
  const systemConfig = TEMPLATE_SYSTEM[businessType];

  // Build core section stack instructions
  const coreSectionInstructions = systemConfig.coreSectionStack.map((sec, idx) => {
    const def = SECTION_LIBRARY[sec.type];
    return `  ${idx + 1}. ${def.label} (${sec.type}) — ${sec.required ? 'REQUIRED' : 'OPTIONAL'}
    Purpose: ${sec.purpose}
    Data: ${JSON.stringify(buildSampleData(sec.type, businessName, offerings, businessType), null, 6)}`;
  }).join('\n\n');

  return `You are an ELITE, conversion-focused copywriter creating a premium storefront for "${businessName}" — a ${template.label} business.

## SYSTEM ARCHITECTURE
You are generating content for the **${systemConfig.templateName}** template system.
- Industry: ${systemConfig.industry}
- Design Personality: ${systemConfig.designPersonality}
- Reference Model: ${systemConfig.referenceModel}
- Conversion Type: ${systemConfig.conversionType}

## FIXED STRUCTURAL RECIPE (DO NOT DEVIATE)

You MUST use this EXACT section order for the homepage. This is a LOCKED structure:

${coreSectionInstructions}

Optional sections you MAY add (max 2 total): ${systemConfig.optionalSections.join(', ')}

## RANDOMIZATION RULES (ENFORCE STRICTLY)

### ALLOWED randomization (you MAY vary):
${systemConfig.randomizationRules.allowed.map(r => `- ${r}`).join('\n')}

### RESTRICTED randomization (you MUST NOT change):
${systemConfig.randomizationRules.restricted.map(r => `- ${r}`).join('\n')}

## CONTENT PRIORITIES
Focus on (in order):
${systemConfig.contentPriorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## CTA STRATEGY
Primary CTAs (use these exact phrases):
${systemConfig.ctaStrategy.primary.map(c => `- "${c}"`).join('\n')}

Secondary CTAs:
${systemConfig.ctaStrategy.secondary.map(c => `- "${c}"`).join('\n')}

## TRUST ELEMENTS TO INCLUDE
${systemConfig.trustElements.map(t => `- ${t}`).join('\n')}

## MOBILE BEHAVIOR
${systemConfig.mobileBehavior}

## FALLBACK LOGIC
${systemConfig.fallbackLogic}

## BUSINESS DNA
- Name: "${businessName}" (USE THIS IN EVERY HEADLINE)
- Type: ${businessType}
- What they sell: ${offerings}
- Contact: ${contactEmail}
- Tagline: ${tagline || 'N/A'}

## ⚠️ CRITICAL: VERTICAL-SPECIFIC LANGUAGE
You MUST use language appropriate for ${businessType}:
- retail-core: Talk about PRODUCTS, specs, shipping, returns, reviews, cart, checkout. NEVER use "project", "transformation", "space", "installed", "service call".
- service-pro: Talk about SERVICES, bookings, consultations, results, transformations, trust. Use "project", "space", "service area".
- food-catering: Talk about MENUS, events, catering, dietary options, tastings. Use "guests", "occasion", "menu".
- artisan-market: Talk about CRAFT, handmade, materials, process, provenance. Use "piece", "maker", "workshop".
- event-floral: Talk about BLOOMS, arrangements, weddings, events, seasonal. Use "bouquet", "centerpiece", "ceremony".
- coach-educator: Talk about GROWTH, programs, coaching, mindset, results. Use "client", "transformation", "breakthrough".

## ⚠️ FORBIDDEN WORDS (Never use these — they're generic/template-speak)
- "Professional" (unless part of a certification name)
- "Quality" (too vague — say what makes it quality)
- "Reliable" (prove it instead)
- "We deliver" (boring, passive)
- "Services you can trust" (meaningless)
- "Your satisfaction guaranteed" (generic)
- "High-quality" (empty phrase)
- "Experienced team" (show experience, don't claim it)

## ✅ POWER WORDS TO USE
Transform, Unlock, Breakthrough, Proven, Secret, Revealed, Finally, Exposed, Truth, Myth, Shocking, Counter-intuitive, Never, Ever, Always, Imagine, Instant, Effortless, Guaranteed, Risk-free, Exclusive, Limited, Now, Today

## MANIFEST CONSTRAINTS — MUST FOLLOW EXACTLY:
- Required sections: ${manifest.requiredSections.join(', ')}
- Max duplicates: ${Object.entries(manifest.maxDuplicates).map(([k, v]) => `${k} (max ${v})`).join(', ')}
- YOU MUST NOT generate more than the max allowed for any section type
- **ONLY ONE header section per site** (pick ONE type: header-simple, header-promo, or header-mega)
- **ONLY ONE hero section per site** (pick ONE type: hero-split, hero-visual, hero-products, hero-cta, or hero-trust)
- **ONLY ONE footer section per site** (pick ONE type: footer-basic or footer-service)
- Count your sections BEFORE returning JSON: if you generated 2 heroes, DELETE one

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no code fences) in this exact structure:

{
  "pages": [
    {
      "slug": "home",
      "title": "Home",
      "sections": [
        { "id": "<unique-8-char-id>", "type": "<section-type>", "data": { ... } },
        ...
      ]
    },
    {
      "slug": "about",
      "title": "About",
      "sections": [ ... ]
    },
    {
      "slug": "contact",
      "title": "Contact",
      "sections": [ ... ]
    }
  ]
}

Generate ALL pages. ALL sections. Every field. Real content. POWERFUL copy. Now.`;
}

function buildSampleData(type: SectionType, businessName: string, offerings: string, businessType: string): Record<string, any> {
  const businessLower = businessName.toLowerCase();
  
  const samples: Record<string, any> = {
    'header-simple': { 
      logoText: businessName, 
      links: [{ label: 'Home', url: '#' }, { label: 'Shop', url: '#products' }, { label: 'About', url: '#about' }], 
      ctaText: 'Shop now', 
      ctaUrl: '#products' 
    },
    'header-promo': { 
      announcement: '🔥 Limited: Free shipping on $50+ orders — ends Friday', 
      logoText: businessName, 
      links: [{ label: 'Home', url: '#' }, { label: 'Menu', url: '#menu' }, { label: 'Contact', url: '#contact' }] 
    },
    'header-mega': {
      logoText: businessName,
      links: [{ label: 'Shop', url: '#', children: [{ label: 'New Arrivals', url: '#' }, { label: 'Best Sellers', url: '#' }] }],
      ctaText: 'Shop Now',
      ctaUrl: '#shop'
    },
    'hero-split': { 
      heading: `${businessName}: Your ${offerings.split(',')[0] || 'Space'} Transformed in 48 Hours`, 
      subheading: `Stop settling for mediocre. See why 94% of ${businessName} customers never call anyone else.`, 
      ctaText: 'See the proof', 
      ctaUrl: '#products', 
      imageUrl: '' 
    },
    'hero-visual': { 
      heading: `Why ${businessName} Outperforms Everyone Else`, 
      subheading: `The truth about ${offerings.toLowerCase()} that your current provider won't tell you.`, 
      ctaText: 'Get the facts', 
      imageUrl: '', 
      overlayOpacity: 0.4 
    },
    'hero-products': { 
      heading: `Welcome to ${businessName} — Where ${offerings.split(',')[0] || 'Quality'} Meets Speed`, 
      subheading: offerings, 
      ctaText: 'View all', 
      items: [] 
    },
    'hero-cta': { 
      headline: `Join the ${businessName} Insider Circle`, 
      subheading: `Get exclusive access to new arrivals, insider-only discounts, and early-bird specials.`, 
      ctaText: 'Join now', 
      showEmailCapture: true 
    },
    'hero-trust': { 
      heading: `${businessName}: The 1% of ${businessType} You've Been Looking For`, 
      subheading: `Over 500 customers transformed. 94% report measurable results within 60 days. The numbers don't lie.`, 
      ctaText: 'See my transformation', 
      trustBadges: ['500+ Transformed', '94% Success Rate', '5-Star Rated'], 
      imageUrl: '' 
    },
    'featured-collection': { 
      title: `${businessName} Bestsellers`, 
      collectionName: 'Most Popular', 
      itemCount: 4 
    },
    'product-grid': { 
      title: `${businessName} ${offerings.split(',')[0] || 'Collection'}`, 
      columns: 3, 
      showFilters: true, 
      items: [] 
    },
    'best-sellers': { 
      title: `Why Everyone's Buying From ${businessName}`, 
      items: [] 
    },
    'collection-carousel': { 
      title: `Shop ${businessName} by Category`, 
      collections: [{ name: 'New Arrivals', url: '#' }, { name: 'Bestsellers', url: '#' }, { name: 'Limited Edition', url: '#' }] 
    },
    'brand-story': { 
      headline: `Why ${businessName} Exists`, 
      body: `I started ${businessName} because I was tired of seeing people settle for subpar ${offerings.toLowerCase()}. There had to be a better way — one that actually delivered on its promises.`, 
      imageUrl: '' 
    },
    'value-icons': { 
      title: `Why ${businessName} Wins`, 
      values: [
        { icon: '⚡', title: '2X Faster', description: 'What takes others 2 weeks, we do in 48 hours' }, 
        { icon: '🛡️', title: '5-Year Warranty', description: 'We stand behind every single project, no questions asked' }, 
        { icon: '💎', title: 'Premium Materials', description: 'We use only what we\'d put in our own home' }
      ] 
    },
    'editorial-split': { 
      headline: `The ${businessName} Difference`, 
      body: offerings, 
      imageUrl: '', 
      imageLeft: true 
    },
    'founder-note': { 
      founderName: 'The Founder', 
      founderTitle: `Owner, ${businessName}`, 
      quote: `I built ${businessName} because I knew ${offerings.toLowerCase()} could be done better. Today, we prove it with every single customer.`, 
      imageUrl: '' 
    },
    'testimonials': { 
      title: `Why ${businessName} Customers Never Leave`, 
      testimonials: [
        { name: 'Michael Rodriguez', quote: `I wish I'd found ${businessName} sooner. My only regret is wasting 2 years with their competitor first.`, rating: 5 }, 
        { name: 'Jennifer Walsh', quote: `My neighbors won't stop asking who did my ${offerings.split(',')[0] || 'project'}. ${businessName} literally transformed my entire space.`, rating: 5 }
      ] 
    },
    'reviews': { 
      title: `${businessName} Reviews`, 
      reviews: [
        { name: 'Emily R.', rating: 5, text: `Hands down the best decision I made this year. ${businessName} delivered exactly what they promised.` }, 
        { name: 'David T.', rating: 5, text: `I was skeptical, but ${businessName} proved me wrong. The quality is unmatched.` }
      ] 
    },
    'logo-bar': { 
      title: `As Featured In`, 
      logos: [{ name: 'Vogue' }, { name: 'Forbes' }, { name: 'GQ' }] 
    },
    'stats': { 
      stats: [
        { value: '500+', label: 'Customers Transformed' }, 
        { value: '4.9', label: 'Average Rating' }, 
        { value: '10+', label: 'Years Perfecting Our Craft' }
      ] 
    },
    'press': { 
      title: `What They're Saying About ${businessName}`, 
      mentions: [{ outlet: 'Design Week', quote: `${businessName} is redefining what customers should expect from ${offerings.toLowerCase()}.` }] 
    },
    'service-list': { 
      title: `${businessName} Services`, 
      services: [
        { name: 'Essential Package', description: `Everything you need to get started with ${businessName} — no fluff, just results.`, price: 'From $150' }, 
        { name: 'Premium Experience', description: `White-glove treatment from start to finish. This is what ${businessName} does best.`, price: 'From $350' }
      ] 
    },
    'pricing-tiers': { 
      title: `Choose Your ${businessName} Experience`, 
      tiers: [
        { name: 'Starter', price: '$99', features: ['Fast 48-hour turnaround', 'Premium materials', '2-year warranty'], highlighted: false }, 
        { name: 'Professional', price: '$199', features: ['Everything in Starter', 'Priority scheduling', '5-year warranty', '24/7 support'], highlighted: true }, 
        { name: 'Enterprise', price: '$399', features: ['Everything in Professional', 'Dedicated project manager', 'Lifetime warranty', 'VIP treatment'], highlighted: false }
      ] 
    },
    'packages': { 
      title: `Event Packages`, 
      packages: [
        { name: 'Intimate', description: `Perfect for small gatherings — the fastest way to experience what ${businessName} can do for you.`, price: '$45/person', features: ['48-hour turnaround', 'Premium ingredients'] }, 
        { name: 'Classic', description: `Our most popular choice — the perfect balance of quality and value.`, price: '$75/person', features: ['Everything in Intimate', '5-star service', 'Custom menu'] }
      ] 
    },
    'quote-cta': { 
      headline: `Get Your Free ${businessName} Quote`, 
      subheading: `Tell us about your project. We'll get back to you within 24 hours with a customized plan.`, 
      ctaText: 'Request Quote',
      showForm: true
    },
    'booking-cta': { 
      headline: `Book Your ${businessName} Experience`, 
      subheading: `Ready to get started? Book your consultation today — no commitment required.`, 
      ctaText: 'Book Now',
      showCalendar: true
    },
    'video': {
      title: `See ${businessName} in Action`,
      videoUrl: '',
      thumbnailUrl: '',
      description: `Watch how ${businessName} transforms spaces in record time.`
    },
    'gallery': { 
      title: `${businessName} Gallery`, 
      images: [],
      layout: 'masonry'
    },
    'social-gallery': {
      title: `Follow ${businessName} on Instagram`,
      instagramUrl: 'https://instagram.com',
      images: []
    },
    'faq': { 
      title: `Frequently Asked Questions About ${businessName}`, 
      faqs: [
        { question: `How long does ${businessName} take?`, answer: `Most projects are completed within 48 hours. We'll give you an exact timeline during consultation.` }, 
        { question: `What if I don't like the result?`, answer: `We offer a 100% satisfaction guarantee. If you're not happy, we'll make it right — no questions asked.` }, 
        { question: `How much does ${businessName} cost?`, answer: `Pricing starts at $150 for essentials. Most customers invest $200-400 for full service. Get your free quote today.` }
      ] 
    },
    'newsletter': { 
      title: `Join the ${businessName} Community`, 
      description: `Get exclusive access to new products, insider discounts, and behind-the-scenes content.`, 
      placeholder: 'Enter your email', 
      buttonText: 'Join Now' 
    },
    'footer-commerce': { 
      columns: [
        { title: 'Shop', links: [{ label: 'New Arrivals', url: '#' }, { label: 'Best Sellers', url: '#' }] }, 
        { title: 'Support', links: [{ label: 'Contact Us', url: '#contact' }, { label: 'FAQ', url: '#faq' }] }
      ], 
      socialLinks: [{ platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }] 
    },
    'footer-service': { 
      columns: [
        { title: 'Services', links: [{ label: 'All Services', url: '#services' }, { label: 'Get a Quote', url: '#quote' }] }, 
        { title: 'Contact', links: [{ label: 'Call Us', url: 'tel:555-123-4567' }, { label: 'Email', url: 'mailto:info@example.com' }] }
      ], 
      socialLinks: [{ platform: 'instagram', url: '#' }] 
    },
    'footer-basic': { 
      columns: [
        { title: 'About', links: [{ label: 'Our Story', url: '#about' }, { label: 'Contact', url: '#contact' }] }
      ], 
      socialLinks: [{ platform: 'instagram', url: '#' }] 
    },
  };

  return samples[type] || {};
}

// --- API: Generate Site Content ---

export async function generateSiteContent(
  businessName: string,
  businessType: TemplateFamily,
  offerings: string,
  contactEmail: string,
  tagline: string,
  stylePreset?: StylePreset,
 ): Promise<{ pages: { slug: string; title: string; sections: GeneratedSection[] }[] }> {
  const preset = stylePreset || pickRandomPreset(businessType);
  const promptText = buildPrompt(businessName, businessType, offerings, contactEmail, tagline, preset);

  try {
    // Try Gemini first if available
    if (process.env.GOOGLE_API_KEY) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(promptText);
      const text = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse JSON from AI response:', e);
        // If parsing fails, use a basic fallback
        parsed = getFallbackSiteStructure(businessName, businessType);
      }
      
      // Ensure basic structure exists
      if (!parsed || !parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
        console.warn('AI returned empty or invalid pages array. Using fallback.');
        parsed = getFallbackSiteStructure(businessName, businessType);
      }

      // Process images
      if (parsed.pages) {
        await processImagesInPages(parsed.pages);
      }
      
      return parsed;
    }
    
    // Fallback to OpenAI
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const text = response.choices[0].message.content || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getFallbackSiteStructure(businessName, businessType);
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse JSON from OpenAI response:', e);
      parsed = getFallbackSiteStructure(businessName, businessType);
    }

    if (!parsed || !parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      parsed = getFallbackSiteStructure(businessName, businessType);
    }
    
    // Process images
    if (parsed.pages) {
      await processImagesInPages(parsed.pages);
    }
    
    return parsed;
  } catch (error) {
    console.error('Content generation error:', error);
    // Even on total failure, return a working fallback so the user isn't stuck with an empty canvas
    return getFallbackSiteStructure(businessName, businessType);
  }
}

function getFallbackSiteStructure(businessName: string, businessType: TemplateFamily) {
  return {
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            id: Math.random().toString(36).substring(2, 10),
            type: 'header-simple' as SectionType,
            data: { logoText: businessName, links: [{ label: 'Home', url: '#' }, { label: 'Shop', url: '#products' }], ctaText: 'Shop now', ctaUrl: '#products' }
          },
          {
            id: Math.random().toString(36).substring(2, 10),
            type: 'hero-split' as SectionType,
            data: { 
              heading: `Welcome to ${businessName}`, 
              subheading: 'Experience the best in quality and service. We are here to serve you.', 
              ctaText: 'Explore Now', 
              ctaUrl: '#products', 
              imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8' 
            }
          },
          {
            id: Math.random().toString(36).substring(2, 10),
            type: 'product-grid' as SectionType,
            data: { title: 'Featured Products', columns: 3, items: [] }
          },
          {
            id: Math.random().toString(36).substring(2, 10),
            type: 'footer-basic' as SectionType,
            data: { columns: [{ title: 'About', links: [{ label: 'Our Story', url: '#' }] }], socialLinks: [] }
          }
        ]
      }
    ]
  };
}
