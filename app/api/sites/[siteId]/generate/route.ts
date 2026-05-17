import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import { generateSiteContent } from '@/lib/ai'
import { rateLimitResponse } from '@/lib/rate-limit'
import type { GeneratedSection } from '@/lib/types'

function normalizePage(page: any, fallbackSlug: string) {
  const slug = String(page?.slug || fallbackSlug).toLowerCase().replace(/[^a-z0-9-]/g, '-') || fallbackSlug
  const title = String(page?.title || slug.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '))
  const sections = Array.isArray(page?.sections) ? page.sections : []
  return { slug, title, sections }
}

async function upsertPages(siteId: string, pages: Array<{ slug: string; title: string; sections: GeneratedSection[] }>) {
  for (const page of pages) {
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('pages')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', page.slug)
      .maybeSingle()

    if (lookupError) {
      console.warn('Pages lookup failed; continuing with template_data only:', lookupError.message)
      return
    }

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from('pages')
        .update({ title: page.title, sections: page.sections, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) console.warn('Page update failed:', error.message)
    } else {
      const { error } = await supabaseAdmin
        .from('pages')
        .insert({ site_id: siteId, slug: page.slug, title: page.title, sections: page.sections, is_published: true })
      if (error) console.warn('Page insert failed:', error.message)
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const limited = rateLimitResponse(request, 'ai-generate')
  if (limited) return limited

  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { data: site, error: fetchError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      )
    }

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    const { business_name, business_type, contact_email, offerings, tagline } = site

    const generated = await generateSiteContent(
      business_name || '',
      business_type || 'service-pro',
      offerings || '',
      contact_email || '',
      tagline || '',
      site.style_preset || site.template_data?.style_preset || site.template_data?.theme_id || 'milano',
    )

    const pages = generated.pages.map((page, index) => normalizePage(page, index === 0 ? 'home' : `page-${index + 1}`))
    const homePage = pages.find(page => page.slug === 'home') || pages[0]
    const secondaryPages = pages.filter(page => page.slug !== homePage.slug)
    const defaultServiceSections = [
      { id: 'services-overview', type: 'service-list' as const, data: { title: business_type === 'service-pro' ? 'Products / Services' : 'Products / Services', services: business_type === 'service-pro' ? [
        { name: 'Primary Service', description: offerings || 'Describe your main customer offer here.', price: 'Request quote' },
        { name: 'Priority Help', description: 'For urgent jobs that need a faster response.', price: 'Custom quote' },
      ] : [] } },
      { id: 'services-cta', type: 'quote-cta' as const, data: { headline: 'Need help choosing?', subheading: 'Tell us what you need and we will recommend the right next step.', ctaText: 'Contact us' } },
    ]
    const quickPages = [
      { slug: 'services', title: business_type === 'retail-core' ? 'Products' : 'Products / Services', sections: defaultServiceSections },
      { slug: 'about', title: 'About Us', sections: [
        { id: 'about-story', type: 'brand-story' as const, data: { headline: `About ${business_name || 'us'}`, body: offerings || 'Tell customers who you serve, what you do best, and why your work is different.', imageUrl: business_type === 'service-pro' ? 'local service professional at work' : 'small business owner working' } },
        { id: 'about-values', type: 'value-icons' as const, data: { title: 'How we work', values: [{ icon: '💬', title: 'Clear communication', description: 'Customers know what happens next.' }, { icon: '🧾', title: 'Fair pricing', description: 'Simple expectations before work begins.' }, { icon: '✅', title: 'Reliable delivery', description: 'A finished job customers can trust.' }] } },
      ] },
      { slug: 'contact', title: 'Contact Us', sections: [
        { id: 'contact-hero', type: 'quote-cta' as const, data: { headline: 'Contact us', subheading: `Reach ${business_name || 'us'} at ${contact_email || 'your email'} or send the details of what you need.`, ctaText: 'Send request' } },
        { id: 'contact-faq', type: 'faq' as const, data: { title: 'Before you reach out', questions: [{ question: 'What should I include?', answer: 'Share what you need, your timing, location, and any helpful photos or details.' }, { question: 'How fast do you reply?', answer: 'Most inquiries receive a response the same business day.' }] } },
      ] },
    ]

    const allPages = [
      homePage,
      ...secondaryPages,
      ...quickPages.filter(page => !pages.some(existing => existing.slug === page.slug)),
    ]

    await upsertPages(siteId, allPages)

    const existingTemplateData = site.template_data && typeof site.template_data === 'object' ? site.template_data : {}
    const { error: updateError } = await supabaseAdmin
      .from('sites')
      .update({
        template_data: {
          ...existingTemplateData,
          pages: [homePage],
          sections: homePage.sections,
        },
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Update error:', JSON.stringify(updateError))
      return NextResponse.json(
        { error: `Failed to save: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pages: [homePage],
      allPages,
      pageTitles: allPages.map((p: any) => p.title),
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
