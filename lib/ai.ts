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
  
  // Try Gemini first
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
      console.error('Gemini generation failed, falling back to OpenAI:', error);
    }
  }

  // Try OpenAI
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
  return `You are an expert web designer and copywriter. Generate a complete website structure for a ${businessType} business called "${businessName}".

Business details:
- Offerings: ${offerings}
- Contact: ${contactEmail}
- Tagline: ${tagline}
- Style: ${stylePreset || 'modern'}

Generate a JSON response with this structure:
{
  "pages": [
    {
      "slug": "home",
      "title": "Home",
      "sections": [
        {
          "id": "hero-1",
          "type": "hero-products",
          "data": {
            "headline": "Compelling hero headline",
            "subheading": "Supporting subheading text",
            "ctaText": "Call to action",
            "ctaUrl": "/contact",
            "imageUrl": "",
            "background": "#000000",
            "textColor": "#ffffff"
          }
        },
        {
          "id": "text-1",
          "type": "brand-story",
          "data": {
            "headline": "About Us",
            "body": "Our story and mission",
            "imageUrl": ""
          }
        }
      ]
    }
  ]
}

IMPORTANT: Use ONLY these section types: hero-products, brand-story, quote-cta, featured-collection, product-grid, testimonials, gallery, faq, newsletter, contact-simple.
Each section MUST have an "id", "type", and "data" field. The "data" field should match the expected fields for that section type.`;
}

function getFallbackSiteStructure(
  businessName: string,
  businessType: string,
  contactEmail: string,
  tagline: string
): { pages: { slug: string; title: string; sections: GeneratedSection[] }[] } {
  return {
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            id: 'hero-1',
            type: 'hero-products' as SectionType,
            data: {
              headline: `Welcome to ${businessName}`,
              subheading: tagline || `Your trusted ${businessType} business`,
              ctaText: 'Get Started',
              ctaUrl: '/contact',
              imageUrl: '',
              background: '#000000',
              textColor: '#ffffff',
            }
          },
          {
            id: 'text-1',
            type: 'brand-story' as SectionType,
            data: {
              headline: 'About Us',
              body: `Learn more about ${businessName} and our commitment to quality service.`,
              imageUrl: '',
            }
          },
          {
            id: 'contact-1',
            type: 'quote-cta' as SectionType,
            data: {
              headline: 'Contact Us',
              body: `Get in touch with us at ${contactEmail || 'your email'}.`,
              imageUrl: '',
            }
          }
        ]
      }
    ]
  };
}
