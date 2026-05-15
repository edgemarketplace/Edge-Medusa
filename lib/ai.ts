import OpenAI from 'openai';
import { GeneratedSection, TemplateFamily, SectionType } from './types';
import { TEMPLATES } from './templates';
import { TEMPLATE_MANIFESTS, SECTION_LIBRARY } from './section-library';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getStyleDirection(businessType: TemplateFamily): string {
  switch (businessType) {
    case 'retail-core': return 'Minimal luxury, clean product grids, large imagery, confident typography';
    case 'service-pro': return 'Trustworthy, professional, clear service cards, before/after sections, testimonials';
    case 'food-catering': return 'Appetizing, warm, menu-focused, inviting imagery, booking CTAs';
    case 'artisan-market': return 'Story-rich, textured, human-centered, warm tones, maker narrative';
    case 'event-floral': return 'Elegant, romantic, gallery-led, premium feel, soft colors';
    default: return 'Clean, modern, professional';
  }
}

function buildPrompt(businessName: string, businessType: TemplateFamily, offerings: string): string {
  const template = TEMPLATES[businessType];
  const manifest = TEMPLATE_MANIFESTS[businessType];
  const style = getStyleDirection(businessType);

  // Build the required + recommended section list with their data shapes
  const sectionShapes = [...manifest.requiredSections, ...manifest.recommendedSections.slice(0, 3)]
    .map(type => {
      const def = SECTION_LIBRARY[type];
      const sampleData = Object.entries(def.defaultData)
        .filter(([k]) => k !== 'items')
        .map(([k, v]) => `"${k}": "${typeof v === 'string' ? v : JSON.stringify(v)}"`)
        .join(', ');
      return `    { "id": "<unique-id>", "type": "${type}", "data": { ${sampleData} } }`;
    })
    .join(',\n');

  return `You are a storefront designer for "${businessName}", a ${template.label} business that sells ${offerings}.

Design a complete storefront with the following sections. Return ONLY valid JSON (no markdown, no code fences):

{
  "sections": [
${sectionShapes},
    { "id": "<unique-id>", "type": "product-grid", "data": { "title": "Our Products", "columns": 3, "items": [] } },
    { "id": "<unique-id>", "type": "testimonials", "data": { "title": "What customers say", "testimonials": [{"name": "<name>", "quote": "<quote>", "rating": 5}] } },
    { "id": "<unique-id>", "type": "faq", "data": { "title": "Frequently Asked Questions", "questions": [{"question": "<question>", "answer": "<answer>"}] } },
    { "id": "<unique-id>", "type": "footer-commerce", "data": { "logoText": "${businessName}", "newsletter": true, "copyright": "© ${new Date().getFullYear()} ${businessName}" } }
  ]
}

Requirements:
- Generate unique short IDs for each section (e.g. "a1b2c3d4")
- Fill in realistic, compelling content for ALL text fields
- Generate 2-3 testimonials with realistic names and quotes
- Generate 2-3 FAQ items relevant to the business
- Prices should be realistic for the business type
- Style direction: ${style}
- All text should be in a ${template.kicker} tone
- The hero heading should be compelling and reference the business

Return ONLY the JSON object, nothing else.`;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function generateStorefront(
  businessName: string,
  businessType: TemplateFamily,
  offerings: string
): Promise<GeneratedSection[]> {
  const prompt = buildPrompt(businessName, businessType, offerings);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const rawText = response.choices[0].message.content || '{}';
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  // Ensure all sections have IDs and valid types
  const sections: GeneratedSection[] = (parsed.sections || []).map((s: any) => ({
    id: s.id || genId(),
    type: s.type as SectionType,
    data: s.data || {},
  }));

  return sections;
}
