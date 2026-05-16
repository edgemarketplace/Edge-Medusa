import { GeneratedSection, SectionType } from './types';

export async function expandBusinessDescription(
  businessName: string,
  businessType: string,
  prompt: string
): Promise<string> {
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
  console.log('Generating site with fallback structure (no AI)');
  
  const pages = [
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
  ];

  return { pages };
}
