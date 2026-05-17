import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSiteContent } from '@/lib/ai'
import type { TemplateFamily } from '@/lib/types'

interface DemoSite {
  brandName: string
  businessType: TemplateFamily
  subdomain: string
  tagline: string
  offerings: string
  contactEmail: string
}

const DEMO_SITES: DemoSite[] = [
  {
    brandName: 'Noir Atelier',
    businessType: 'retail-core',
    subdomain: 'noiratelier',
    tagline: 'Curated luxury for the modern wardrobe',
    offerings: 'Women\'s fashion, accessories, jewelry',
    contactEmail: 'hello@noiratelier.demo',
  },
  {
    brandName: 'Cedar & Forge',
    businessType: 'food-catering',
    subdomain: 'cedarandforge',
    tagline: 'Farm-to-table catering with rustic elegance',
    offerings: 'Wedding catering, corporate events, private dinners',
    contactEmail: 'events@cedarandforge.demo',
  },
  {
    brandName: 'Bloom & Lore',
    businessType: 'event-floral',
    subdomain: 'bloomandlore',
    tagline: 'Editorial florals for life\'s most beautiful moments',
    offerings: 'Wedding flowers, event decor, installations',
    contactEmail: 'studio@bloomandlore.demo',
  },
  {
    brandName: 'Earth & Ember',
    businessType: 'artisan-market',
    subdomain: 'earthandember',
    tagline: 'Hand-thrown ceramics for intentional living',
    offerings: 'Ceramics, pottery, handmade homeware',
    contactEmail: 'hello@earthandember.demo',
  },
  {
    brandName: 'Momentum Fitness',
    businessType: 'service-pro',
    subdomain: 'momentumfit',
    tagline: 'Personal training that fits your life',
    offerings: 'Personal training, group classes, nutrition coaching',
    contactEmail: 'info@momentumfit.demo',
  },
  {
    brandName: 'Sage & Stone',
    businessType: 'coach-educator',
    subdomain: 'sageandstone',
    tagline: 'Transform your business with data-driven strategy',
    offerings: 'Business coaching, workshops, online courses',
    contactEmail: 'hello@sageandstone.demo',
  },
]

// Admin endpoint to generate demo sites
// Requires admin authentication or secret key
export async function POST(request: NextRequest) {
  try {
    // Check authorization via header
    const authHeader = request.headers.get('authorization')
    const secret = process.env.DEMO_GENERATION_KEY

    // Fail closed: require secret in production
    if (!secret || secret === 'demo-secret') {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Admin endpoint not configured. Set DEMO_GENERATION_KEY environment variable.' },
          { status: 503 }
        )
      }
    }

    // Validate secret
    const providedSecret = authHeader?.replace('Bearer ', '') || ''
    const validSecret = secret || 'demo-secret'

    // Validate secret via simple string comparison (timing attack is low risk here)
    if (providedSecret !== validSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate demo sites
    const results = []
    for (const demo of DEMO_SITES) {
      try {
        const { pages } = await generateSiteContent(
          demo.brandName,
          demo.businessType,
          demo.offerings,
          demo.contactEmail,
          demo.tagline,
          'milano'
        )

        const { data: site, error } = await supabaseAdmin
          .from('sites')
          .insert({
            business_name: demo.brandName,
            business_type: demo.businessType,
            offerings: demo.offerings,
            contact_email: demo.contactEmail,
            tagline: demo.tagline,
            status: 'live',
            published: true,
            published_at: new Date().toISOString(),
            subdomain: demo.subdomain,
            site_token: crypto.randomUUID(),
            template_data: { pages },
            demo: true,
          })
          .select()
          .single()

        if (error) {
          console.error(`Demo creation error for ${demo.brandName}:`, error)
          results.push({ brand: demo.brandName, error: error.message })
          continue
        }

        results.push({ brand: demo.brandName, siteId: site.id, subdomain: demo.subdomain })
      } catch (err: any) {
        console.error(`Demo creation error for ${demo.brandName}:`, err)
        results.push({ brand: demo.brandName, error: err.message })
      }
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Demo generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Demo generation failed' },
      { status: 500 }
    )
  }
}
