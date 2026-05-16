import OpenAI from 'openai';
import { GeneratedSection, TemplateFamily, SectionType } from './types';
import { TEMPLATES } from './templates';
import { TEMPLATE_MANIFESTS, SECTION_LIBRARY } from './section-library';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

// --- Vertical-specific funnel definitions ---

interface FunnelDef {
  psychology: string;
  pagePurpose: string;
  requiredSections: { type: SectionType; purpose: string; tips: string }[];
  contentTone: string;
  milanoCues: string;
  sampleCopy: Record<string, string[]>;
}

const FUNNEL_DEFS: Record<TemplateFamily, FunnelDef> = {
  'retail-core': {
    psychology: 'discovery + desire + trust. Customers browse, fall in love with products, need social proof to convert.',
    pagePurpose: 'Establish brand identity, feature collections, drive browsing and purchase.',
    requiredSections: [
      { type: 'header-simple', purpose: 'Clean navigation that doesn\'t distract from products', tips: 'Minimal links, prominent logo, subtle CTA' },
      { type: 'hero-visual', purpose: 'Editorial brand moment — oversized imagery, serif headline', tips: 'Full-bleed lifestyle image, muted overlay, confident serif typography' },
      { type: 'featured-collection', purpose: 'Curated browsing — 4 hero products with large imagery', tips: 'Large product cards, minimal text, let images sell' },
      { type: 'product-grid', purpose: 'Full catalog browsing with filters', tips: 'Clean grid, hover states, quick-add buttons' },
      { type: 'testimonials', purpose: 'Social proof to convert browsers', tips: 'Real-sounding names, specific praise, star ratings' },
      { type: 'newsletter', purpose: 'Capture emails for return visits', tips: 'Simple signup, promise exclusivity' },
      { type: 'footer-commerce', purpose: 'Trust signals, links, newsletter', tips: 'Clean columns, payment icons, social links' },
    ],
    contentTone: 'Confident, curated, editorial. Short punchy headlines. Product descriptions that evoke feeling, not just features.',
    milanoCues: 'Oversized editorial imagery. Whitespace-heavy layouts. Serif headlines (playfair display style). Muted luxury palette (cream, charcoal, sage, terracotta). Horizontal collection grids. Magazine-style product spacing.',
    sampleCopy: {
      heroHeading: ['Curated for the modern home', 'Thoughtfully designed, beautifully made', 'Where style meets substance', 'Discover your new favorites'],
      heroSubheading: ['Explore our collection of handpicked pieces designed to elevate everyday living.', 'Each piece is carefully sourced and crafted with intention.', 'Timeless design for the modern lifestyle.'],
      ctaText: ['Shop the collection', 'Explore now', 'Discover more', 'View all'],
      testimonialQuotes: [
        'The quality is incredible — everything arrived beautifully packaged.',
        'I get compliments every time I wear their pieces. Truly unique.',
        'Finally found a brand that matches my aesthetic perfectly.',
        'Fast shipping, beautiful products. Will definitely order again.',
      ],
    },
  },

  'service-pro': {
    psychology: 'trust + credibility + booking. Customers need proof before they commit. Reduce friction to contact.',
    pagePurpose: 'Establish trust immediately, showcase work, generate quote requests.',
    requiredSections: [
      { type: 'header-simple', purpose: 'Professional navigation with prominent CTA', tips: 'Phone number visible, "Get a quote" button' },
      { type: 'hero-split', purpose: 'Authority hero — bold headline, service image, trust badges', tips: 'Strong contrast, confidence-driven layout, before/after hint' },
      { type: 'service-list', purpose: 'Clear service offerings with pricing ranges', tips: 'Structured layout, benefit-focused descriptions, starting prices' },
      { type: 'before-after', purpose: 'Visual proof of work quality', tips: 'High-quality transformation images, brief context' },
      { type: 'value-icons', purpose: 'Why choose us — icon grid of differentiators', tips: 'Licensed, insured, satisfaction guarantee, years of experience' },
      { type: 'testimonials', purpose: 'Customer proof with specific results', tips: 'Before/after context, specific praise, real names' },
      { type: 'quote-cta', purpose: 'Conversion endpoint — make it easy to request a quote', tips: 'Simple form, fast response promise, no commitment' },
      { type: 'footer-service', purpose: 'Contact info, service areas, hours', tips: 'Phone, email, service area map, business hours' },
    ],
    contentTone: 'Confident, professional, direct. Lead with benefits and results. Use specific numbers (years, customers served, satisfaction rate).',
    milanoCues: 'Bold typography. Strong contrast (dark backgrounds, white text). Confidence-driven layouts. Clean hierarchy. Professional photography. Icon-driven trust sections.',
    sampleCopy: {
      heroHeading: ['Professional results you can see', 'Trusted by 500+ homeowners', 'Your property, perfected', 'Quality work, guaranteed'],
      heroSubheading: ['We deliver professional [service] with a focus on quality, reliability, and your complete satisfaction.', 'Serving [area] for over X years. Licensed, insured, and committed to excellence.'],
      ctaText: ['Get a free quote', 'Request estimate', 'Book now', 'Call today'],
      serviceDescriptions: [
        'Complete service from start to finish. We handle everything so you don\'t have to.',
        'Professional-grade results using commercial equipment and proven techniques.',
        'Customized to your specific needs. No job too big or small.',
      ],
      testimonialQuotes: [
        'They transformed our space completely. Professional, on time, and the results exceeded expectations.',
        'Best investment we\'ve made in our home. The team was courteous and the work was flawless.',
        'I\'ve used several services before — these guys are on another level. Highly recommend.',
        'Quick response, fair pricing, and the quality of work was outstanding. Will use again.',
      ],
    },
  },

  'food-catering': {
    psychology: 'appetite + urgency + event conversion. Customers need to taste with their eyes first, then book for events.',
    pagePurpose: 'Showcase food quality, highlight packages, drive catering inquiries.',
    requiredSections: [
      { type: 'header-promo', purpose: 'Announcement bar for seasonal offers + clean nav', tips: 'Promo banner for holiday/event season' },
      { type: 'hero-visual', purpose: 'Appetite hero — cinematic food photography with overlay', tips: 'Rich food imagery, warm tones, bold pricing highlight' },
      { type: 'packages', purpose: 'Event packages with clear pricing tiers', tips: '3 tiers (intimate, standard, premium), per-person pricing, inclusions listed' },
      { type: 'service-list', purpose: 'Menu categories with descriptions', tips: 'Appetizers, mains, desserts, beverages — brief evocative descriptions' },
      { type: 'gallery', purpose: 'Visual proof — event photos, plated dishes', tips: 'Masonry grid, warm lighting, professional food photography' },
      { type: 'testimonials', purpose: 'Event host testimonials', tips: 'Specific event context, praise for food quality and service' },
      { type: 'booking-cta', purpose: 'Event inquiry form with date/headcount', tips: 'Simple form, quick response promise, deposit info' },
      { type: 'footer-service', purpose: 'Contact, service areas, social links', tips: 'Phone, email, Instagram, service radius' },
    ],
    contentTone: 'Warm, inviting, appetite-inducing. Use sensory language (fresh, handcrafted, locally-sourced). Highlight event experience, not just food.',
    milanoCues: 'Cinematic food photography. Rich textures. Bold pricing highlights. Elegant menu typography. Warm editorial presentation. Visual richness.',
    sampleCopy: {
      heroHeading: ['Exceptional food for unforgettable events', 'Crafted with passion, served with pride', 'Your event, elevated', 'Fresh. Local. Unforgettable.'],
      heroSubheading: ['From intimate gatherings to grand celebrations, we create memorable dining experiences tailored to your vision.', 'Locally sourced ingredients, expertly prepared, beautifully presented.'],
      ctaText: ['Book your event', 'Request a quote', 'View packages', 'Plan your menu'],
      packageNames: ['Taco Bar Package', 'Full Catering Spread', 'Premium Fiesta'],
      testimonialQuotes: [
        'The food was absolutely incredible. Our guests are still talking about it weeks later!',
        'Professional, punctual, and the presentation was stunning. Made our event so special.',
        'Best catering we\'ve ever had. Every dish was fresh, flavorful, and beautifully plated.',
        'They handled everything perfectly so we could enjoy our own party. Highly recommend!',
      ],
    },
  },

  'artisan-market': {
    psychology: 'story + authenticity + craftsmanship. Customers buy the maker, not just the product. Emotional connection drives purchase.',
    pagePurpose: 'Establish artisan identity, tell the story, showcase products with context.',
    requiredSections: [
      { type: 'header-simple', purpose: 'Warm, handcrafted feel navigation', tips: 'Simple nav, maker-focused branding' },
      { type: 'hero-visual', purpose: 'Story-driven hero — maker at work or signature product', tips: 'Warm, textured imagery. Handcrafted feeling. Serif headline.' },
      { type: 'brand-story', purpose: 'Founder story — why you make what you make', tips: 'Personal, authentic, process-focused. Show the hands behind the work.' },
      { type: 'product-grid', purpose: 'Curated product showcase with artisan notes', tips: 'Large product images, brief maker notes, materials mentioned' },
      { type: 'value-icons', purpose: 'Values — handmade, local, sustainable, etc.', tips: 'Icon grid: handmade, locally sourced, small batch, sustainable' },
      { type: 'testimonials', purpose: 'Customer love — emotional connection stories', tips: 'Customers who love the story, not just the product' },
      { type: 'newsletter', purpose: 'Build community, announce new products/markets', tips: 'Promise: new products, market dates, behind-the-scenes' },
      { type: 'footer-basic', purpose: 'Simple, warm footer with social and contact', tips: 'Instagram link, market schedule, email' },
    ],
    contentTone: 'Warm, personal, authentic. First-person where appropriate. Focus on process, materials, and the human story behind each piece.',
    milanoCues: 'Organic spacing. Textured visuals. Handcrafted feeling. Documentary/editorial mix. Warm imagery. Serif headlines with body serif.',
    sampleCopy: {
      heroHeading: ['Handcrafted with intention', 'Made by hand, with heart', 'Where craft meets community', 'Thoughtfully made, beautifully yours'],
      heroSubheading: ['Every piece is carefully crafted by hand using traditional techniques and the finest materials.', 'Born from a passion for [craft], made with love in [location].'],
      ctaText: ['Shop the collection', 'Meet the maker', 'Explore our story', 'Find us at markets'],
      storyBody: [
        'It started with a simple idea: create [products] that honor traditional craftsmanship while fitting beautifully into modern life.',
        'Every piece begins with carefully selected materials and hours of dedicated handwork. No shortcuts, no mass production — just honest craft.',
      ],
      testimonialQuotes: [
        'You can feel the love and care in every piece. It\'s not just a product, it\'s a story.',
        'I love knowing exactly who made this and the care that went into it. Truly special.',
        'The quality is unmatched. These are heirloom pieces that will last for years.',
      ],
    },
  },

  'event-floral': {
    psychology: 'aspiration + elegance + trust. Customers are planning once-in-a-lifetime moments. They need to feel confident in their choice.',
    pagePurpose: 'Create emotional impact, showcase portfolio, capture high-value inquiries.',
    requiredSections: [
      { type: 'header-simple', purpose: 'Elegant, minimal navigation', tips: 'Clean typography, subtle branding, inquiry CTA' },
      { type: 'hero-visual', purpose: 'Cinematic hero — full-screen floral imagery with elegant overlay', tips: 'Full-bleed luxury floral photography, soft serif headline, subtle animation feel' },
      { type: 'packages', purpose: 'Service tiers — simplify high-ticket buying', tips: '3 tiers (intimate, classic, luxury), starting prices, key inclusions' },
      { type: 'gallery', purpose: 'Portfolio proof — immersive gallery-first layout', tips: 'Full-bleed images, masonry grid, category filters (weddings, events, installations)' },
      { type: 'testimonials', purpose: 'Couple/event host testimonials with emotional weight', tips: 'Specific event details, emotional language, photographer credits' },
      { type: 'value-icons', purpose: 'Trust signals — experience, awards, process', tips: 'Years of experience, events completed, awards, consultation process' },
      { type: 'quote-cta', purpose: 'Inquiry form — capture event details and budget', tips: 'Event date, venue, guest count, budget range, consultation booking' },
      { type: 'footer-basic', purpose: 'Minimal, elegant footer', tips: 'Contact, Instagram, service areas' },
    ],
    contentTone: 'Elegant, aspirational, confident. Use refined language. Focus on the experience and emotion, not just the product. Photography does the heavy lifting.',
    milanoCues: 'Full-screen imagery. Luxury editorial feel. Soft transitions. Premium hierarchy. Gallery-first layouts. Serif headlines. Muted romantic palette (blush, sage, cream, gold).',
    sampleCopy: {
      heroHeading: ['Floral artistry for life\'s most beautiful moments', 'Where flowers become art', 'Elegant florals, unforgettable events', 'Crafted with passion, designed for you'],
      heroSubheading: ['From intimate ceremonies to grand celebrations, we create bespoke floral designs that transform spaces and capture hearts.', 'Every arrangement is thoughtfully designed to reflect your unique vision and style.'],
      ctaText: ['Start your inquiry', 'View our work', 'Book a consultation', 'Explore packages'],
      packageNames: ['Intimate', 'Classic', 'Luxury'],
      testimonialQuotes: [
        'They completely exceeded our expectations. Every detail was perfect and our guests couldn\'t stop talking about the flowers.',
        'Working with them was an absolute dream. They understood our vision perfectly and brought it to life beautifully.',
        'The most stunning floral design I\'ve ever seen. Truly works of art that made our day unforgettable.',
        'Professional, creative, and so easy to work with. The florals were the highlight of our event.',
      ],
    },
  },

  'coach-educator': {
    psychology: 'trust + transformation + authority. Clients need to believe you can transform their life/skill, then see a clear path to get there.',
    pagePurpose: 'Establish authority, show transformation proof, drive coaching/consultation bookings.',
    requiredSections: [
      { type: 'header-simple', purpose: 'Clean navigation with prominent "Book Consult" CTA', tips: 'Logo, minimal links, "Book Now" button top-right' },
      { type: 'hero-trust', purpose: 'Authority hero — transformation headline, trust badges (years experience, clients served)', tips: 'Bold claim of transformation, 3 key trust metrics, serif headline' },
      { type: 'service-list', purpose: 'Coaching packages with clear outcomes', tips: 'Package names like "Career Pivot", "Leadership Mastery", outcomes-driven descriptions, price ranges' },
      { type: 'testimonials', purpose: 'Transformation stories with specific results', tips: 'Before/after states, specific metrics (got promoted, landed dream job), full names with photos' },
      { type: 'value-icons', purpose: 'Why choose you — credentials, methodology, results', tips: 'Certifications, years experience, unique methodology, satisfaction rate' },
      { type: 'faq', purpose: 'Address objections (cost, time, fit)', tips: 'Real concerns: "Is coaching right for me?", "How fast will I see results?", "What if it doesn\'t work?"' },
      { type: 'booking-cta', purpose: 'Low-friction consultation booking', tips: 'Simple form, promise of 24hr response, no commitment language' },
      { type: 'footer-basic', purpose: 'Clean footer with social links and credentials', tips: 'LinkedIn, Instagram, certifications listed, contact email' },
    ],
    contentTone: 'Authoritative yet empathetic. Lead with transformation outcomes. Use specific numbers (X clients coached, Y% success rate). Sound like a proven expert who cares.',
    milanoCues: 'Clean, editorial layout. Serif headlines. Muted purple/charcoal palette. Whitespace-heavy. Testimonial cards with large quotes. Professional photography of you/your workspace.',
    sampleCopy: {
      heroHeading: ['Transform your career in 90 days', 'Unlock your leadership potential', 'Go from stuck to thriving', 'Your breakthrough starts here'],
      heroSubheading: ['I help professionals like you break through barriers and achieve the career you\'ve always wanted. Proven methodology, real results.', 'Over 500 professionals coached. 94% report measurable progress within 60 days.'],
      ctaText: ['Book a free consult', 'Start your journey', 'See how I help', 'Get your roadmap'],
      serviceDescriptions: [
        '6-week intensive coaching program with weekly 1:1 sessions, customized action plan, and lifetime access to resource library.',
        'Group coaching mastermind with peer accountability, bi-weekly calls, and exclusive workshops for accelerated growth.',
        'Executive leadership coaching for senior leaders ready to step into C-suite roles with confidence and strategy.',
      ],
      testimonialQuotes: [
        'Working with [Name] changed my entire trajectory. I went from feeling stuck to landing my dream role in just 3 months!',
        'The clarity I gained from our sessions was priceless. I finally understand my value and how to communicate it.',
        'Best investment I\'ve ever made in myself. The ROI isn\'t just financial — it\'s a complete mindset shift.',
        'I was skeptical at first, but the methodology really works. I\'ve been promoted twice in 8 months!',
      ],
    },
  },
};

// --- Prompt Builder ---

function buildPrompt(
  businessName: string,
  businessType: TemplateFamily,
  offerings: string,
  contactEmail: string,
  tagline: string,
): string {
  const template = TEMPLATES[businessType];
  const manifest = TEMPLATE_MANIFESTS[businessType];
  const funnel = FUNNEL_DEFS[businessType];

  // Build section-by-section instructions
  const sectionInstructions = funnel.requiredSections.map((sec, idx) => {
    const def = SECTION_LIBRARY[sec.type];
    const sampleData = buildSampleData(sec.type, businessName, offerings, funnel);
    return `  ${idx + 1}. ${def.label} (${sec.type})
    Purpose: ${sec.purpose}
    Tips: ${sec.tips}
    Data: ${JSON.stringify(sampleData, null, 6)}`;
  }).join('\n\n');

  return `You are an ELITE, conversion-focused copywriter creating a premium storefront for "${businessName}" — a ${template.label} business.

## YOUR MISSION
Generate content that makes visitors IMMEDIATELY want to buy/book. This is NOT a template — it's a custom, high-converting storefront for THIS specific business.

## BUSINESS DNA
- Name: "${businessName}" (USE THIS IN EVERY HEADLINE)
- Type: ${businessType}
- What they sell: ${offerings}
- Contact: ${contactEmail}
- Tagline: ${tagline || 'N/A'}

## VERTICAL PSYCHOLOGY
${funnel.psychology}

## CONTENT TONE
${funnel.contentTone}

## MILANO VISUAL STYLE
${funnel.milanoCues}

## ⚠️ FORBIDDEN WORDS (Never use these — they're generic/template-speak)
- "Professional" (unless part of a certification name)
- "Quality" (too vague — say what makes it quality)
- "Reliable" (prove it instead)
- "We deliver" (boring, passive)
- "Services you can trust" (meaningless)
- "Your satisfaction guaranteed" (generic)
- "High-quality" (empty phrase)
- "Experienced team" (show experience, don't claim it)

## ✅ POWER WORDS TO USE (Make copy sticky)
Transform, Unlock, Breakthrough, Proven, Secret, Revealed, Finally, Exposed, Truth, Myth, Shocking, Counter-intuitive, Never, Ever, Always, Imagine, Instant, Effortless, Guaranteed, Risk-free, Exclusive, Limited, Now, Today

## HEADLINE FORMULAS (Follow these patterns)
1. "[Business Name]: [Specific Benefit] in [Timeframe]"
2. "The [Truth/Secret] About [Industry] That [Authority Figure] Won't Tell You"
3. "Why [Number]% of [Customers] Fire Their [Competitor Type] (And Why You Should Too)"
4. "[Business Name] vs. Everyone Else: Here's the [Number]X Difference"
5. "Stop [Pain Point]. Start [Desired Outcome] with [Business Name]"

## BAD VS GOOD EXAMPLES
❌ BAD: "Professional results you can see"
✅ GOOD: "${businessName}: See Why 94% of Our Customers Never Call Anyone Else"

❌ BAD: "We deliver professional epoxy flooring services"
✅ GOOD: "${businessName}: Your Garage Floor Shouldn't Embarrass You When Neighbors Visit"

❌ BAD: "Complete professional service"
✅ GOOD: "We've Transformed 500+ Floors in 2 Years — Here's What We Discovered About What Actually Lasts"

## SECTIONS TO GENERATE
${sectionInstructions}

## CRITICAL RULES (Violate these and the store fails)
1. EVERY headline MUST include "${businessName}" or a specific benefit metric
2. NO placeholder text. NO "Lorem ipsum". NO "Your text here"
3. Testimonials: Use FULL names (not "Sarah M."), specific results ("saved $5,000"), and emotional language
4. FAQs: Address REAL objections ("What if I hate it?", "How long does it really take?") — NOT generic questions
5. Pricing: Use REAL market rates. Add "Limited time" or scarcity elements
6. CTAs: Use urgency words ("Book now", "Get instant access", "Start my transformation") — NEVER "Submit" or "Click here"
7. Imagery: Leave imageUrl EMPTY — merchant adds their own photos later
8. Write like a HUMAN expert, not an AI. Use contractions (you're, we're, don't)
9. Every section must feel CUSTOM — if a visitor saw this, they should think "This was written just for me"
10. Use the sample copy style above as INSPIRATION only — create ORIGINAL content for ${businessName}

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no code fences) in this exact structure:

{
  "sections": [
    { "id": "<unique-8-char-id>", "type": "<section-type>", "data": { ... } },
    ...
  ]
}

Generate ALL sections. Every field. Real content. POWERFUL copy. Now.`;
}

function buildSampleData(type: SectionType, businessName: string, offerings: string, funnel: FunnelDef): Record<string, any> {
  // Generate powerful, specific sample data that matches our "forbidden words" / "power words" style
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
      title: `${funnel.sampleCopy.packageNames?.[0] || 'Transformation'} Packages`, 
      packages: [
        { name: funnel.sampleCopy.packageNames?.[0] || 'Starter', description: `The fastest way to experience what ${businessName} can do for you.`, price: '$45', features: ['48-hour turnaround', 'Premium materials'] }, 
        { name: funnel.sampleCopy.packageNames?.[1] || 'Professional', description: `Our most popular choice — the perfect balance of speed and luxury.`, price: '$75', features: ['Everything in Starter', '5-year warranty', 'Priority support'] }
      ] 
    },
    'quote-cta': { 
      headline: `Get Your Free ${businessName} Quote`, 
      subheading: `Tell us about your project. We'll get back to you within 24 hours with a customized plan.`, 
      ctaText: 'Get my quote', 
      showForm: true 
    },
    'booking-cta': { 
      headline: `Book Your ${businessName} Consultation`, 
      subheading: `Pick a time that works for you. Meet with our experts and see why 94% of customers say yes.`, 
      ctaText: 'Book now' 
    },
    'gallery': { 
      title: `${businessName} Transformations`, 
      images: [] 
    },
    'video': { 
      title: `${businessName} in Action`, 
      videoUrl: '', 
      thumbnailUrl: '' 
    },
    'before-after': { 
      title: `${businessName} Before & After`, 
      pairs: [{ beforeUrl: '', afterUrl: '', label: `Recent ${businessName} project` }] 
    },
    'social-gallery': { 
      title: `Follow ${businessName} on Instagram`, 
      images: [] 
    },
    'faq': { 
      title: `Your ${businessName} Questions, Answered`, 
      questions: [
        { question: `Why is ${businessName} more expensive than competitors?`, answer: `We don't cut corners. Every material, every technique, every hour spent is an investment in your satisfaction. Cheap alternatives cost 3X more in the long run.` }, 
        { question: `What if I hate the result?`, answer: `That's why we have a 100% satisfaction guarantee. If you're not thrilled, we'll make it right — no questions asked.` }, 
        { question: `How fast can ${businessName} really deliver?`, answer: `Most projects are completed in 48 hours. We've optimized our process to be 2X faster than industry standard without sacrificing quality.` }
      ] 
    },
    'newsletter': { 
      headline: `Join the ${businessName} Inner Circle`, 
      subheading: `Get insider-only discounts, early access to new services, and exclusive tips.`, 
      ctaText: 'Join free' 
    },
    'promo-banner': { 
      text: `🎉 Limited: ${businessName} is booking 48 hours out — secure your spot now!`, 
      ctaText: 'Book now', 
      backgroundColor: '#1A1A1A', 
      textColor: '#FFFFFF' 
    },
    'sticky-cta': { 
      text: `Ready to transform with ${businessName}?`, 
      ctaText: 'Start now', 
      position: 'bottom' 
    },
    'footer-basic': { 
      logoText: businessName, 
      links: [{ label: 'Privacy', url: '#' }, { label: 'Terms', url: '#' }, { label: 'Contact', url: '#' }], 
      copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.` 
    },
    'footer-commerce': { 
      logoText: businessName, 
      newsletter: true, 
      columns: [
        { title: 'Shop', links: [{ label: 'New Arrivals', url: '#' }, { label: 'Bestsellers', url: '#' }, { label: 'Sale', url: '#' }] }, 
        { title: 'Help', links: [{ label: 'FAQ', url: '#' }, { label: 'Shipping', url: '#' }, { label: 'Returns', url: '#' }] }
      ], 
      copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.` 
    },
    'footer-service': { 
      logoText: businessName, 
      showContact: true, 
      showHours: true, 
      hours: 'Mon-Fri 8am-6pm, Sat 9am-3pm', 
      copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.` 
    },
  };

  return samples[type] || SECTION_LIBRARY[type]?.defaultData || {};
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// --- Main Generation Function ---

export async function generateStorefront(
  businessName: string,
  businessType: TemplateFamily,
  offerings: string = '',
  contactEmail: string = '',
  tagline: string = '',
): Promise<GeneratedSection[]> {
  const prompt = buildPrompt(businessName, businessType, offerings, contactEmail, tagline);

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8, // Slightly creative but consistent
  });

  const rawText = response.choices[0].message.content || '{}';
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  // Validate and fix sections
  const sections: GeneratedSection[] = (parsed.sections || []).map((s: any) => {
    const type = s.type as SectionType;
    const def = SECTION_LIBRARY[type];
    return {
      id: s.id || genId(),
      type,
      data: def ? { ...def.defaultData, ...(s.data || {}) } : (s.data || {}),
    };
  });

  return sections;
}
