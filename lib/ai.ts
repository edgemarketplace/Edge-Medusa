export async function expandBusinessDescription(
  businessName: string,
  businessType: string,
  prompt: string
): Promise<string> {
  return prompt;
}

interface GeneratedSection {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  cta_label?: string;
  cta_link?: string;
  background_color?: string;
  text_color?: string;
}

interface PageStructure {
  slug: string;
  title: string;
  sections: GeneratedSection[];
}

export async function generateSiteContent(
  businessName: string,
  businessType: string,
  offerings: string,
  contactEmail: string,
  tagline: string,
  stylePreset?: string
): Promise<{ pages: PageStructure[] }> {
  console.log('Generating site with fallback structure (no AI)');
  
  const pages: PageStructure[] = [
    {
      slug: 'home',
      title: 'Home',
      sections: [
        {
          id: 'hero-1',
          type: 'hero',
          title: `Welcome to ${businessName}`,
          subtitle: tagline || `Your trusted ${businessType} business`,
          content: `We provide excellent ${businessType} services to our community.`,
          image_url: '',
          cta_label: 'Get Started',
          cta_link: '/contact',
          background_color: '#000000',
          text_color: '#ffffff',
        },
        {
          id: 'text-1',
          type: 'text',
          title: 'About Us',
          content: `Learn more about ${businessName} and our commitment to quality service.`,
          image_url: '',
        },
        {
          id: 'contact-1',
          type: 'contact',
          title: 'Contact Us',
          content: `Get in touch with us at ${contactEmail || 'your email'}.`,
          image_url: '',
        }
      ]
    }
  ];

  return { pages };
}
