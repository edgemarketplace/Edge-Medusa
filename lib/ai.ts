import { GeneratedSection, SectionType } from './types';

export async function expandBusinessDescription(
  businessName: string,
  businessType: string,
  prompt: string
): Promise<string> {
  try {
    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });
      return response.choices[0].message.content?.trim().replace(/^"|"$/g, '') || prompt;
    }
  } catch (error) {
    console.error('expandBusinessDescription OpenAI failed:', error);
  }
  return prompt;
}

export async function generateSiteContent(
  businessName: string,
  businessType: string,
  offerings: string,
  contactEmail: string,
  tagline: string,
  stylePreset?: string
): Promise<{ pages: { slug: string; title: string; sections: GeneratedSection[] }[] }> {
  const promptText = buildPrompt(businessName, businessType, offerings, contactEmail, tagline, stylePreset);
  
  // Try OpenAI first (more reliable)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.7,
        max_tokens: 4000,
      });
      const text = response.choices[0].message.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('OpenAI generation failed:', error);
    }
  }

  // Try Gemini as backup
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(promptText);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Gemini generation failed, using fallback:', error);
    }
  }

  // Fallback
  console.log('All AI paths failed. Using hardcoded fallback structure.');
  return getFallbackSiteStructure(businessName, businessType, contactEmail, tagline);
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
6. Write REAL, SPECIFIC copy — never generic filler. Use the business name and offerings.
7. For imageUrl, use REAL Unsplash URLs. Pick IDs relevant to the business type:
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

function getFallbackSiteStructure(
  businessName: string,
  businessType: string,
  contactEmail: string,
  tagline: string
): { pages: { slug: string; title: string; sections: GeneratedSection[] }[] } {
  const isService = businessType.includes('service') || businessType.includes('coach');
  const footerType = isService ? 'footer-service' : 'footer-commerce';
  return {
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            id: 'header-1',
            type: 'header-simple' as SectionType,
            data: {
              logoText: businessName,
              links: [
                { label: 'Home', url: '/' },
                { label: 'About', url: '#about' },
                { label: 'Contact', url: '#contact' },
              ],
              ctaText: isService ? 'Book Now' : 'Shop Now',
              ctaUrl: '#',
            },
          },
          {
            id: 'hero-1',
            type: 'hero-split' as SectionType,
            data: {
              heading: `Welcome to ${businessName}`,
              subheading: tagline || `Your trusted ${businessType} partner`,
              ctaText: 'Get Started',
              ctaUrl: '#',
              imageUrl: '',
              overlayOpacity: 0.35,
              trustBadges: ['Quality guaranteed', 'Fast response', 'Expert team'],
            },
          },
          {
            id: 'value-1',
            type: 'value-icons' as SectionType,
            data: {
              title: 'Why choose us',
              values: [
                { icon: '✦', title: 'Expertise', description: 'Years of industry experience' },
                { icon: '✦', title: 'Quality', description: 'Premium materials and service' },
                { icon: '✦', title: 'Support', description: 'Dedicated customer care' },
              ],
            },
          },
          {
            id: 'story-1',
            type: 'brand-story' as SectionType,
            data: {
              headline: 'Our Story',
              body: `${businessName} was founded with a simple mission: to deliver exceptional ${businessType} experiences. Every project reflects our commitment to quality, creativity, and customer satisfaction.`,
              imageUrl: '',
            },
          },
          {
            id: 'testimonials-1',
            type: 'testimonials' as SectionType,
            data: {
              title: 'What customers say',
              testimonials: [
                { name: 'Alex R.', quote: 'Absolutely outstanding service. Would highly recommend!', rating: 5 },
                { name: 'Jordan T.', quote: 'The attention to detail exceeded all my expectations.', rating: 5 },
              ],
            },
          },
          {
            id: 'cta-1',
            type: 'quote-cta' as SectionType,
            data: {
              headline: 'Ready to get started?',
              subheading: `Contact ${businessName} today and let's discuss your project.`,
              ctaText: 'Contact us',
              showForm: true,
            },
          },
          {
            id: 'footer-1',
            type: footerType as SectionType,
            data: {
              logoText: businessName,
              showContact: true,
              showHours: false,
              hours: '',
              copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
            },
          },
        ],
      },
    ],
  };
}
