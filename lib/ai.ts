import { GeneratedSection, SectionType } from './types';

export async function expandBusinessDescription(
  businessName: string,
  businessType: string,
  prompt: string
): Promise<string> {
  const cleanPrompt = String(prompt || '').trim()
  const cleanName = String(businessName || '').trim() || 'this business'
  const cleanType = String(businessType || '').trim() || 'general'
  const lower = `${cleanPrompt} ${cleanName}`.toLowerCase()
  const isPlumber = lower.includes('plumb') || lower.includes('pipe') || lower.includes('drain') || lower.includes('leak') || lower.includes('water heater')
  const instruction = `Expand this into concise, website-ready business copy.\n\nBusiness name: ${cleanName}\nTemplate/vertical: ${cleanType}\nUser wrote: ${cleanPrompt}\n\nRules:\n- Preserve the user's actual trade and intent.\n- Do not explain what ${cleanType} means.\n- Do not mention software, automotive, SaaS, consulting, or generic professional-services unless the user did.\n- If this is plumbing, write as a local plumbing company: leak repairs, drain clearing, water heaters, fixtures, reasonable pricing, clean work, and prompt response.\n- Output 2-3 plain sentences only, no bullets.`

  try {
    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: instruction }],
        temperature: 0.45,
        max_tokens: 180,
      })
      return response.choices[0].message.content?.trim().replace(/^"|"$/g, '') || cleanPrompt
    }
  } catch (error) {
    console.error('expandBusinessDescription OpenAI failed:', error)
  }

  if (cleanType === 'service-pro' && isPlumber) {
    return `${cleanName} provides reliable local plumbing at reasonable cost, including leak repairs, drain clearing, water heater service, pipe repair, and fixture installation. Customers can expect clear pricing before work begins, careful cleanup, and fast help for urgent plumbing issues.`
  }

  return cleanPrompt
}

/**
 * Validate AI output and detect placeholder/generic content.
 * Returns { valid: true } or { valid: false, reasons: string[] }.
 */
function validateAIOutput(parsed: any): { valid: boolean; reasons?: string[] } {
  const reasons: string[] = []

  if (!parsed || !parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    return { valid: false, reasons: ['Missing pages array'] }
  }

  for (const page of parsed.pages) {
    if (!page.sections || !Array.isArray(page.sections)) {
      reasons.push(`Page "${page.slug || '?'}" missing sections`)
      continue
    }
    for (const section of page.sections) {
      const data = section.data || {}

      // Check for placeholder copy (case-insensitive partial match)
      const allText = JSON.stringify(data).toLowerCase()
      const placeholders = [
        'example item', 'your business', 'your brand', 'enter your',
        'lorem ipsum', 'sample text', 'placeholder', 'your company',
        'your name', 'yourname', 'yourwebsite', 'yourdomain',
      ]
      for (const ph of placeholders) {
        if (allText.includes(ph)) {
          reasons.push(`Section "${section.type || '?'}" contains placeholder text: "${ph}"`)
        }
      }

      // Check product items for generic names
      const items = data.items || data.tiers || data.packages || []
      for (const it of items) {
        const name = (it.name || '').toLowerCase()
        const desc = (it.description || '').toLowerCase()
        if (name && (name.includes('example') || name.includes('sample') || name.includes('item'))) {
          reasons.push(`Product name looks generic: "${it.name}"`)
        }
        if (desc && (desc.includes('short description') || desc.includes('describe your'))) {
          reasons.push(`Product description looks generic: "${it.description}"`)
        }
      }

      // Testimonials shouldn't be "Example Name"
      const testimonials = data.testimonials || []
      for (const t of testimonials) {
        const name = (t.name || '').toLowerCase()
        if (name.includes('sarah m') || name.includes('james k') || name.includes('maya t') || name.includes('john doe')) {
          reasons.push(`Testimonial name looks like a prompt example: "${t.name}"`)
        }
      }
    }
  }

  if (reasons.length > 0) {
    return { valid: false, reasons: reasons.slice(0, 5) } // cap at 5
  }
  return { valid: true }
}

/**
 * Quality gates for AI output beyond placeholder check.
 */
function enforceQuality(parsed: any): { valid: boolean; reasons?: string[] } {
  const reasons: string[] = []

  const allSections = parsed.pages.flatMap((p: any) => p.sections || [])
  const types = allSections.map((s: any) => s.type)

  // Must have header + footer
  if (!types.some((t: string) => t.startsWith('header-'))) {
    reasons.push('Missing header section')
  }
  if (!types.some((t: string) => t.startsWith('footer-'))) {
    reasons.push('Missing footer section')
  }

  // Must have at least one commerce or conversion section
  const hasCommerce = types.some((t: string) =>
    ['product-grid', 'featured-collection', 'best-sellers',
     'service-list', 'pricing-tiers', 'packages', 'quote-cta', 'booking-cta',
     'hero-products', 'collection-carousel'].includes(t)
  )
  if (!hasCommerce) {
    reasons.push('Missing commerce or conversion section')
  }

  // Must have at least 5 sections
  if (allSections.length < 5) {
    reasons.push(`Only ${allSections.length} sections (min 5)`)
  }

  if (reasons.length > 0) {
    return { valid: false, reasons }
  }
  return { valid: true }
}

export async function generateSiteContent(
  businessName: string,
  businessType: string,
  offerings: string,
  contactEmail: string,
  tagline: string,
  stylePreset?: string
): Promise<{ pages: { slug: string; title: string; sections: GeneratedSection[] }[] }> {
  const promptText = buildPrompt(businessName, businessType, offerings, contactEmail, tagline, stylePreset)

  // Try OpenAI first (more reliable)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.7,
        max_tokens: 4000,
      })
      const text = response.choices[0].message.content || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed && parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          const placeholderCheck = validateAIOutput(parsed)
          const qualityCheck = enforceQuality(parsed)
          if (placeholderCheck.valid && qualityCheck.valid) {
            console.log('[AI] OpenAI output validated successfully')
            return parsed
          }
          const allReasons = [
            ...(placeholderCheck.reasons || []),
            ...(qualityCheck.reasons || []),
          ]
          console.warn('[AI] OpenAI output rejected — falling back:', allReasons.join('; '))
        }
      }
    } catch (error) {
      console.error('OpenAI generation failed:', error)
    }
  }

  // Try Gemini as backup
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(promptText)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed && parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          const placeholderCheck = validateAIOutput(parsed)
          const qualityCheck = enforceQuality(parsed)
          if (placeholderCheck.valid && qualityCheck.valid) {
            console.log('[AI] Gemini output validated successfully')
            return parsed
          }
          const allReasons = [
            ...(placeholderCheck.reasons || []),
            ...(qualityCheck.reasons || []),
          ]
          console.warn('[AI] Gemini output rejected — falling back:', allReasons.join('; '))
        }
      }
    } catch (error) {
      console.error('Gemini generation failed, using fallback:', error)
    }
  }

  // Fallback
  console.log('[AI] All AI paths failed. Using hardcoded fallback structure.')
  return generateFallbackSiteContent(businessName, businessType, offerings, contactEmail, tagline)
}

function buildPrompt(
  businessName: string,
  businessType: string,
  offerings: string,
  contactEmail: string,
  tagline: string,
  stylePreset?: string
): string {
  // Map business types to recommended sections and psychology
  const verticalGuidance: Record<string, string> = {
    'retail-core': `This is a PRODUCT/RETAIL business. Focus on: catalog, product discovery, trust badges, seasonal promos, email capture. Use commerce sections heavily.`,
    'service-pro': `This is a SERVICE business. Focus on: trust, process, testimonials, quote requests, booking. Use service-list, pricing-tiers, quote-cta, stats. Avoid product-grid.`,
    'food-catering': `This is a FOOD/CATERING business. Focus on: menus, appetite imagery, event types, booking, gallery. Use hero-products, service-list (menus), gallery, testimonials, booking-cta.`,
    'artisan-market': `This is a HANDMADE/ARTISAN business. Focus on: maker story, process, provenance, limited editions, founder narrative. Use brand-story, founder-note, editorial-split, product-grid, gallery.`,
    'event-floral': `This is an EVENT/FLORAL business. Focus on: gallery, transformation, luxury, inquiry form, social proof. Use gallery, hero-visual, testimonials, quote-cta, logo-bar.`,
    'coach-educator': `This is a COACHING/EDUCATION business. Focus on: transformation, packages, social proof, free resource, booking. Use hero-trust, pricing-tiers, testimonials, newsletter, quote-cta.`,
  };

  const vertical = verticalGuidance[businessType] || `This is a ${businessType} business. Use a mix of hero, commerce/storytelling, social proof, and conversion sections.`;

  return `You are an elite web designer and conversion copywriter. You create complete, high-converting website structures.

BUSINESS: "${businessName}"
TYPE: ${businessType}
${vertical}

WHAT THEY OFFER: ${offerings || 'Products and services'}
TAGLINE: ${tagline || 'Quality you can trust'}
CONTACT: ${contactEmail || ''}
STYLE: ${stylePreset || 'milano'} (milano = luxury serif, ocean = calm blues, sunlit = warm amber, sage = organic green)

OUTPUT FORMAT — JSON only, no markdown fences, no extra text:
{
  "pages": [
    {
      "slug": "home",
      "title": "Home",
      "sections": [
        {
          "id": "hero-1",
          "type": "hero-split",
          "data": {
            "heading": "Compelling 4-8 word headline",
            "subheading": "2 sentences that explain the unique value proposition",
            "ctaText": "Shop Now / Book / Get Quote",
            "ctaUrl": "#",
            "imageUrl": "https://images.unsplash.com/photo-RELEVANT_ID?w=1200&h=700&fit=crop&auto=format",
            "overlayOpacity": 0.35,
            "trustBadges": ["Free shipping", "Secure checkout", "5-star rated"]
          }
        },
        {
          "id": "value-1",
          "type": "value-icons",
          "data": {
            "title": "Why choose us",
            "values": [
              {"icon":"✦","title":"Handcrafted","description":"Made with care"},
              {"icon":"✦","title":"Fast Delivery","description":"Ships in 2 days"},
              {"icon":"✦","title":"Premium Quality","description":"Only the best materials"}
            ]
          }
        },
        {
          "id": "products-1",
          "type": "featured-collection",
          "data": {
            "title": "Featured",
            "items": [
              {"name":"Example Item","price":"$49","description":"Short description","image_url":"https://images.unsplash.com/photo-RELEVANT_ID?w=600&h=400&fit=crop"}
            ],
            "columns": 3,
            "itemCount": 6
          }
        },
        {
          "id": "story-1",
          "type": "brand-story",
          "data": {
            "headline": "Our Story",
            "body": "3-4 sentences about the business origin, mission, and passion.",
            "imageUrl": "https://images.unsplash.com/photo-RELEVANT_ID?w=800&h=600&fit=crop"
          }
        },
        {
          "id": "testimonials-1",
          "type": "testimonials",
          "data": {
            "title": "What customers say",
            "testimonials": [
              {"name":"Sarah M.","quote":"Absolutely loved the experience. Highly recommend!","rating":5},
              {"name":"James K.","quote":"Exceeded my expectations. Will definitely return.","rating":5}
            ]
          }
        },
        {
          "id": "cta-1",
          "type": "quote-cta",
          "data": {
            "headline": "Ready to get started?",
            "subheading": "Contact us today and let's bring your vision to life.",
            "ctaText": "Contact us",
            "showForm": true
          }
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Generate 7-9 sections for the home page. NEVER fewer than 6.
2. Use ONLY these section types (pick relevant ones for the vertical):
   - header-simple, header-promo, header-mega
   - hero-split, hero-visual, hero-products, hero-cta, hero-trust
   - featured-collection, product-grid, best-sellers, collection-carousel
   - service-list, packages, pricing-tiers
   - brand-story, value-icons, editorial-split, founder-note
   - testimonials, reviews, logo-bar, stats, press
   - quote-cta, booking-cta, newsletter, faq, promo-banner
   - gallery, video
   - footer-basic, footer-commerce, footer-service
3. FIRST section MUST ALWAYS be a header (header-simple, header-promo, or header-mega).
4. LAST section MUST ALWAYS be a footer (footer-basic, footer-commerce, or footer-service).
5. Every section MUST have "id" (unique), "type", and "data".
6. Write REAL, SPECIFIC copy — never generic filler. Use actual product types and price points from the offerings.
7. For product/service items, generate 3-6 SPECIFIC items with realistic names and prices based on the business type (e.g., for retail: "The Classic Tote — $89", "Waxed Canvas Backpack — $145"). NEVER use "Example Item" or generic placeholder names.
8. For imageUrl, use REAL Unsplash URLs. Pick IDs relevant to the business type:
   - Food/catering: photo-1504674900247-0877df9cc836, photo-1559339352-11d035aa65de
   - Retail/products: photo-1607089264410, photo-1441986300917-64674bd600d8
   - Services/consulting: photo-1557804506, photo-1556761175-5973dc0f32e7
   - Floral/events: photo-1490750967868-58cb75069ed6, photo-1527529482837-4698179b6e2a
   - Artisan/handmade: photo-1452860606245-08befc0ff44b, photo-1516975080664-ed2fc6a32937
   - Coaching/education: photo-1522202176988-66273c2fd55f, photo-1503676260728-1c00da094a0b
   If unsure, leave imageUrl as "".
8. NEVER use relative paths. NEVER use placeholder text like "Lorem ipsum".
9. The output must be ONLY valid JSON. No markdown, no explanations.`;
}

function generateFallbackSiteContent(
  businessName: string,
  businessType: string,
  offerings: string,
  contactEmail: string,
  tagline: string,
  stylePreset?: string
) {
  const isService = businessType.includes('service') || businessType.includes('coach') || businessType.includes('consulting');
  const isRetail = businessType.includes('retail') || businessType.includes('shop');
  const isFood = businessType.includes('food') || businessType.includes('catering') || businessType.includes('restaurant');
  const isFloral = businessType.includes('floral') || businessType.includes('event');
  const isArtisan = businessType.includes('artisan') || businessType.includes('maker');

  const footerType = isService ? 'footer-service' : 'footer-commerce';

  // Generators for specific verticals
  const generateRetailSections = (): GeneratedSection[] => {
    const productCategories: Record<string, { name: string; price: string; desc: string }[]> = {
      clothing: [
        { name: 'The Classic Oxford', price: '$89', desc: 'Premium cotton button-down in sky blue or crisp white' },
        { name: 'Merino Wool Crew', price: '$65', desc: 'Ultra-soft Italian merino, three-season staple' },
        { name: 'Slim Chino Stone', price: '$98', desc: 'Japanese twill with just the right stretch' },
        { name: 'Harrington Jacket', price: '$145', desc: 'Water-resistant shell with quilted lining' },
        { name: 'Cashmere Scarf', price: '$78', desc: 'Scottish-spun, five timeless colorways' },
        { name: 'Leather Weekender', price: '$245', desc: 'Full-grain leather, hand-stitched handles' },
      ],
      leather: [
        { name: 'Field Messenger', price: '$185', desc: 'Waxed canvas with full-grain leather flap and brass hardware' },
        { name: 'Heritage Briefcase', price: '$295', desc: 'Hand-burnished bridle leather, laptop sleeve' },
        { name: 'Utility Belt', price: '$65', desc: '5.5oz bridle leather with solid brass buckle' },
        { name: 'Passport Wallet', price: '$48', desc: 'Four card slots, two passport pockets, hand-sewn' },
        { name: 'Travel Dopp', price: '$95', desc: 'Structured leather toiletry kit, YKK zipper' },
        { name: 'Key Fob Set', price: '$32', desc: 'Three hand-dyed leather key loops' },
      ],
      jewelry: [
        { name: 'Lunar Pendant', price: '$120', desc: 'Sterling silver with brushed matte moon disc' },
        { name: 'Chain Bracelet', price: '$85', desc: 'Box chain in sterling silver, 7.5" with lobster clasp' },
        { name: 'Bar Studs', price: '$65', desc: 'Minimalist gold-fill bar studs, 12mm' },
        { name: 'Signet Ring', price: '$145', desc: 'Custom engraving on recycled sterling silver' },
        { name: 'Hoop Set', price: '$98', desc: 'Three graduated sizes in 14k gold-fill' },
        { name: 'Pearl Drop', price: '$155', desc: 'Freshwater pearl with gold-fill chain' },
      ],
      home: [
        { name: 'Linen Sheet Set', price: '$220', desc: 'Belgian flax linen, pre-washed for softness' },
        { name: 'Ceramic Vase', price: '$68', desc: 'Hand-thrown stoneware, reactive glaze' },
        { name: 'Wool Throw', price: '$140', desc: 'Lambswool blend with herringbone weave' },
        { name: 'Oak Serving Board', price: '$55', desc: 'End-grain European oak with natural oil finish' },
        { name: 'Brass Candlestick', price: '$42', desc: 'Solid brass, weighted base, timeless silhouette' },
        { name: 'Rattan Basket', price: '$38', desc: 'Hand-woven rattan, two-tone natural and black' },
      ],
      beauty: [
        { name: 'Vitamin C Serum', price: '$48', desc: '20% stabilized vitamin C with hyaluronic acid' },
        { name: 'Night Recovery Cream', price: '$62', desc: 'Peptide complex with bakuchiol, fragrance-free' },
        { name: 'Glow Facial Oil', price: '$42', desc: 'Organic rosehip and sea buckthorn, 30ml' },
        { name: 'Mineral SPF 50', price: '$34', desc: 'Zinc oxide, reef-safe, tinted universal' },
        { name: 'Lip Repair Balm', price: '$18', desc: 'Shea and mango butter with SPF 15' },
        { name: 'Clay Mask Set', price: '$28', desc: 'Three-clay detox mask with bamboo charcoal' },
      ],
    };

    // Pick a random category or default
    let products = productCategories.clothing;
    const offeringLower = (offerings || '').toLowerCase();
    if (offeringLower.includes('leather') || offeringLower.includes('bag')) products = productCategories.leather;
    else if (offeringLower.includes('jewelry') || offeringLower.includes('ring') || offeringLower.includes('gold')) products = productCategories.jewelry;
    else if (offeringLower.includes('home') || offeringLower.includes('decor') || offeringLower.includes('furniture')) products = productCategories.home;
    else if (offeringLower.includes('skin') || offeringLower.includes('beauty') || offeringLower.includes('cream')) products = productCategories.beauty;

    return [
      {
        id: 'header-1',
        type: 'header-simple',
        data: {
          logoText: businessName,
          links: [
            { label: 'Shop', url: '#shop' },
            { label: 'About', url: '#about' },
            { label: 'Contact', url: '#contact' },
          ],
          ctaText: 'Shop Now',
          ctaUrl: '#shop',
        },
      },
      {
        id: 'hero-1',
        type: 'hero-split',
        data: {
          heading: tagline || `Modern essentials, thoughtfully made`,
          subheading: offerings || `Discover ${businessName} — curated pieces designed for everyday confidence and lasting quality.`,
          ctaText: 'Shop the Collection',
          ctaUrl: '#shop',
          imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=700&fit=crop',
          overlayOpacity: 0.35,
          trustBadges: ['Free shipping over $50', '30-day returns', '5-star rated'],
        },
      },
      {
        id: 'value-1',
        type: 'value-icons',
        data: {
          title: 'The difference is in the details',
          values: [
            { icon: '📦', title: 'Free Shipping', description: 'Complimentary on orders over $50. Arrives in 3-5 days.' },
            { icon: '✨', title: 'Small Batch', description: 'Limited runs. No mass production. Every piece matters.' },
            { icon: '🔄', title: 'Easy Returns', description: '30-day hassle-free returns. No questions asked.' },
          ],
        },
      },
      {
        id: 'products-1',
        type: 'product-grid',
        data: {
          title: 'Shop the Collection',
          items: products.slice(0, 6).map((p, i) => ({ ...p, id: `prod-${i}` })),
          columns: 3,
          itemCount: 6,
        },
      },
      {
        id: 'story-1',
        type: 'brand-story',
        data: {
          headline: 'Made with intention',
          body: `${businessName} started with a frustration: too many products that looked good but fell apart. We partner directly with craftspeople and small mills to offer pieces that get better with age — not worse. No trends. No compromises. Just honest goods you'll reach for every day.`,
          imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop',
        },
      },
      {
        id: 'collection-1',
        type: 'featured-collection',
        data: {
          title: 'New Arrivals',
          items: products.slice(0, 3).map((p, i) => ({ ...p, id: `new-${i}` })),
          columns: 3,
          itemCount: 3,
        },
      },
      {
        id: 'testimonials-1',
        type: 'testimonials',
        data: {
          title: 'What customers say',
          testimonials: [
            { name: 'Maya T., NYC', quote: 'The quality is absolutely next level. I bought the tote 6 months ago and it looks brand new.', rating: 5 },
            { name: 'James L., Portland', quote: 'Finally a brand that delivers on its promises. Fast shipping, beautiful packaging, perfect product.', rating: 5 },
            { name: 'Sarah K., Austin', quote: 'This is my third purchase. The consistency is what keeps me coming back.', rating: 5 },
          ],
        },
      },
      {
        id: 'trust-1',
        type: 'trust-badges',
        data: {
          badges: [
            { label: 'SSL Secure', icon: '🔒' },
            { label: 'Free Shipping $50+', icon: '🚚' },
            { label: 'Support', icon: '💬' },
            { label: '30-Day Returns', icon: '✓' },
          ],
        },
      },
      {
        id: 'newsletter-1',
        type: 'newsletter',
        data: {
          title: 'Get early access',
          description: 'New drops sell out fast. Join the list to shop before everyone else.',
          ctaText: 'Subscribe',
        },
      },
      {
        id: 'footer-1',
        type: 'footer-commerce',
        data: {
          logoText: businessName,
          showContact: true,
          showHours: false,
          hours: '',
          copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
        },
      },
    ];
  };

  const generateFoodSections = (): GeneratedSection[] => {
    const menuItems = [
      { name: 'Signature Burger', price: '$16', desc: 'Dry-aged beef, brioche bun, aged cheddar, house pickles' },
      { name: 'Truffle Flatbread', price: '$18', desc: 'Wild mushrooms, truffle oil, fontina, fresh thyme' },
      { name: 'Crispy Brussels', price: '$12', desc: 'Fried brussels sprouts with fish sauce vinaigrette' },
      { name: 'Cacio e Pepe', price: '$22', desc: 'Fresh bucatini, pecorino romano, tellicherry pepper' },
      { name: 'Wagyu Carpaccio', price: '$24', desc: 'Paper-thin wagyu, parmesan shavings, truffle oil' },
      { name: 'Lava Cake', price: '$10', desc: 'Valrhona dark chocolate, molten center, sea salt' },
    ];
    const cateringItems = [
      { name: 'Corporate Lunch', price: '$35/person', desc: 'Sandwich platter, seasonal salad, dessert, drinks' },
      { name: 'Event Buffet', price: '$55/person', desc: 'Three entrees, sides, bread service, dessert station' },
      { name: 'Cocktail Reception', price: '$75/person', desc: 'Passed canapés, charcuterie, open bar package' },
    ];

    return [
      {
        id: 'header-1',
        type: 'header-simple',
        data: {
          logoText: businessName,
          links: [
            { label: 'Menu', url: '#menu' },
            { label: 'Catering', url: '#catering' },
            { label: 'About', url: '#about' },
          ],
          ctaText: 'Order Now',
          ctaUrl: '#menu',
        },
      },
      {
        id: 'hero-1',
        type: 'hero-split',
        data: {
          heading: tagline || 'Flavors worth sharing',
          subheading: offerings || `${businessName} brings artisan cooking and bold flavors to every plate. Farm-fresh ingredients. Zero shortcuts.`,
          ctaText: 'View Menu',
          ctaUrl: '#menu',
          imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=700&fit=crop',
          overlayOpacity: 0.4,
          trustBadges: ['Farm fresh', 'Same-day delivery', 'Group orders welcome'],
        },
      },
      {
        id: 'value-1',
        type: 'value-icons',
        data: {
          title: 'What makes us different',
          values: [
            { icon: '🌿', title: 'Farm Fresh', description: 'Sourced from local farms, delivered same day' },
            { icon: '👨‍🍳', title: 'Craft Kitchen', description: 'Every dish made from scratch by our team' },
            { icon: '🚚', title: 'Hot Delivery', description: 'Temperature-controlled vans. Arrives piping hot.' },
          ],
        },
      },
      {
        id: 'products-1',
        type: 'product-grid',
        data: {
          title: 'Popular Dishes',
          items: menuItems.slice(0, 6).map((p, i) => ({ ...p, id: `food-${i}` })),
          columns: 3,
          itemCount: 6,
        },
      },
      {
        id: 'collection-1',
        type: 'featured-collection',
        data: {
          title: 'Catering Packages',
          items: cateringItems.map((p, i) => ({ ...p, id: `cat-${i}` })),
          columns: 3,
          itemCount: 3,
        },
      },
      {
        id: 'story-1',
        type: 'brand-story',
        data: {
          headline: 'From our kitchen to your table',
          body: `${businessName} started in a pop-up kitchen with a simple idea: food should taste like it was made by someone who cares. Every ingredient is sourced from farms we know by name. Every recipe is tested obsessively. And every order is prepared the moment you place it.`,
          imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
        },
      },
      {
        id: 'testimonials-1',
        type: 'testimonials',
        data: {
          title: 'What food lovers say',
          testimonials: [
            { name: 'Rachel M.', quote: 'Best catering decision we made. The truffle flatbread disappeared in 5 minutes.', rating: 5 },
            { name: 'David W.', quote: 'We order weekly for office lunch. Never had a single complaint.', rating: 5 },
            { name: 'Amara J.', quote: 'The wagyu carpaccio was the highlight of our anniversary dinner.', rating: 5 },
          ],
        },
      },
      {
        id: 'trust-1',
        type: 'trust-badges',
        data: {
          badges: [
            { label: 'Local Sourced', icon: '🌿' },
            { label: 'Hot Delivery', icon: '🚚' },
            { label: 'Order by 10am', icon: '⏰' },
            { label: 'Custom Menus', icon: '🍽️' },
          ],
        },
      },
      {
        id: 'footer-1',
        type: 'footer-commerce',
        data: {
          logoText: businessName,
          showContact: true,
          showHours: true,
          hours: 'Mon-Fri: 10am-8pm | Sat-Sun: 9am-9pm',
          copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
        },
      },
    ];
  };

  const generateServiceSections = (): GeneratedSection[] => [
    {
      id: 'header-1',
      type: 'header-simple',
      data: {
        logoText: businessName,
        links: [
          { label: 'Services', url: '#services' },
          { label: 'About', url: '#about' },
          { label: 'Contact', url: '#contact' },
        ],
        ctaText: 'Book Free Consultation',
        ctaUrl: '#contact',
      },
    },
    {
      id: 'hero-1',
      type: 'hero-split',
      data: {
        heading: tagline || 'Expert solutions, delivered',
        subheading: offerings || `${businessName} helps businesses grow faster with proven strategies and dedicated support.`,
        ctaText: 'Book a Free Call',
        ctaUrl: '#contact',
        imageUrl: '',
        overlayOpacity: 0.35,
        trustBadges: ['Free consultation', 'Proven results', 'Satisfaction guaranteed'],
      },
    },
    {
      id: 'value-1',
      type: 'value-icons',
      data: {
        title: 'Why clients trust us',
        values: [
          { icon: '🎯', title: 'Data-Driven', description: 'Every decision backed by research and metrics' },
          { icon: '🚀', title: 'Fast Execution', description: 'Projects delivered on time, every time' },
          { icon: '🤝', title: 'Partnership', description: 'We work as an extension of your team' },
        ],
      },
    },
    {
      id: 'services-1',
      type: 'service-list',
      data: {
        title: 'Our Services',
        items: [
          { name: 'Strategy Session', price: '$150', description: '90-minute deep dive into your goals, market position, and growth opportunities' },
          { name: 'Implementation Plan', price: '$950', description: 'Full roadmap with timelines, milestones, and resource requirements' },
          { name: 'Ongoing Management', price: '$2,500/mo', description: 'Monthly execution, reporting, and optimization with weekly check-ins' },
          { name: 'Crisis Response', price: 'Custom', description: 'Rapid intervention for urgent challenges — available within 24 hours' },
        ],
      },
    },
    {
      id: 'pricing-1',
      type: 'pricing-tiers',
      data: {
        title: 'Packages',
        tiers: [
          { name: 'Starter', price: '$750', description: 'Perfect for new projects', features: ['1 strategy session', 'Written recommendations', 'Email support for 30 days'], highlighted: false },
          { name: 'Growth', price: '$2,500/mo', description: 'For scaling businesses', features: ['Weekly strategy calls', 'Full execution support', 'Monthly performance report', 'Priority support'], highlighted: true },
          { name: 'Enterprise', price: 'Custom', description: 'For large organizations', features: ['Dedicated strategist', 'On-site workshops', 'Custom reporting dashboard', 'Annual planning retreat'], highlighted: false },
        ],
      },
    },
    {
      id: 'stats-1',
      type: 'stats',
      data: {
        stats: [
          { value: '150+', label: 'Clients served' },
          { value: '98%', label: 'Retention rate' },
          { value: '3x', label: 'Average growth' },
          { value: '24h', label: 'Response time' },
        ],
      },
    },
    {
      id: 'testimonials-1',
      type: 'testimonials',
      data: {
        title: 'Client results',
        testimonials: [
          { name: 'TechStart Inc.', quote: 'They helped us triple our MRR in 6 months. The best investment we made.', rating: 5 },
          { name: 'BrightPath Consulting', quote: 'Professional, responsive, and incredibly knowledgeable. Highly recommend.', rating: 5 },
        ],
      },
    },
    {
      id: 'cta-1',
      type: 'quote-cta',
      data: {
        headline: 'Ready to grow?',
        subheading: `Book a free 30-minute consultation with ${businessName}. No commitment. Just clarity.`,
        ctaText: 'Schedule a Call',
        showForm: true,
      },
    },
    {
      id: 'footer-1',
      type: 'footer-service',
      data: {
        logoText: businessName,
        showContact: true,
        showHours: false,
        hours: '',
        copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
      },
    },
  ];

  let sections: GeneratedSection[];
  if (isRetail) sections = generateRetailSections();
  else if (isFood) sections = generateFoodSections();
  else sections = generateServiceSections();

  // Ensure header and footer exist
  if (!sections.some(s => s.type.startsWith('header-'))) {
    sections.unshift({
      id: 'header-1',
      type: 'header-simple',
      data: { logoText: businessName, links: [{ label: 'Home', url: '/' }], ctaText: 'Get Started', ctaUrl: '#' },
    });
  }
  if (!sections.some(s => s.type.startsWith('footer-'))) {
    sections.push({
      id: 'footer-1',
      type: footerType as SectionType,
      data: { logoText: businessName, showContact: true, showHours: false, hours: '', copyright: `© ${new Date().getFullYear()} ${businessName}` },
    });
  }

  return {
    pages: [{ slug: 'home', title: 'Home', sections }],
  };
}
