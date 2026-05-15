import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { GeneratedSection, TemplateFamily } from './types';
import { TEMPLATES } from './templates';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const gemini = process.env.GOOGLE_API_KEY ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY }) : null;

function getStyleDirection(businessType: TemplateFamily): string {
  const template = TEMPLATES[businessType];
  switch (businessType) {
    case 'retail-core':
      return 'Minimal luxury, clean product grids, large imagery, confident typography';
    case 'service-pro':
      return 'Trustworthy, professional, clear service cards, before/after sections, testimonials';
    case 'food-catering':
      return 'Appetizing, warm, menu-focused, inviting imagery, booking CTAs';
    case 'artisan-market':
      return 'Story-rich, textured, human-centered, warm tones, maker narrative';
    case 'event-floral':
      return 'Elegant, romantic, gallery-led, premium feel, soft colors';
    default:
      return 'Clean, modern, professional';
  }
}

function buildPrompt(businessName: string, businessType: TemplateFamily, offerings: string): string {
  const template = TEMPLATES[businessType];
  const style = getStyleDirection(businessType);

  return `You are a storefront designer for "${businessName}", a ${template.label} business that sells ${offerings}.

Design a single-page storefront. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "sections": [
    {
      "type": "hero",
      "heading": "<compelling headline using the business name>",
      "subheading": "<1-2 sentences about what they offer>",
      "ctaText": "<action button text>"
    },
    {
      "type": "products",
      "title": "<section title>",
      "items": [
        { "name": "<product/service name>", "price": "<price like $45>", "description": "<short description>" }
      ]
    },
    {
      "type": "about",
      "headline": "<about section headline>",
      "body": "<2-3 sentences about the business, its mission, and what makes it special>"
    },
    {
      "type": "contact",
      "title": "<contact CTA title>",
      "ctaText": "<contact button text>"
    }
  ]
}

Requirements:
- Generate 4-6 realistic products/services for the "products" items array
- Prices should be realistic for the business type
- The hero heading should be compelling and use the business name
- Style direction: ${style}
- The about section should tell a brief brand story
- All text should be in a ${template.kicker} tone

Return ONLY the JSON object, nothing else.`;
}

export async function generateStorefront(
  businessName: string,
  businessType: TemplateFamily,
  offerings: string
): Promise<GeneratedSection[]> {
  const prompt = buildPrompt(businessName, businessType, offerings);

  let rawText: string;

  if (gemini) {
    const result = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    rawText = result.text || '{}';
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    rawText = response.choices[0].message.content || '{}';
  } else {
    throw new Error('No AI provider configured');
  }

  // Clean up the response
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  return parsed.sections as GeneratedSection[];
}
