/**
 * Generate 6 demo sites for homepage showcase
 * Run with: npx tsx scripts/generate-demos.ts
 */

import { supabaseAdmin } from '../lib/supabase';
import { generateSiteContent } from '../lib/ai';
import type { TemplateFamily } from '../lib/types';

interface DemoSite {
  brandName: string;
  businessType: TemplateFamily;
  subdomain: string;
  tagline: string;
  offerings: string;
  email: string;
}

const DEMO_SITES: DemoSite[] = [
  {
    brandName: 'Noir Atelier',
    businessType: 'retail-core',
    subdomain: 'noiratelier',
    tagline: 'Curated luxury for the modern wardrobe',
    offerings: 'Women\'s fashion, accessories, jewelry',
    email: 'hello@noiratelier.demo',
  },
  {
    brandName: 'Cedar & Forge',
    businessType: 'food-catering',
    subdomain: 'cedarandforge',
    tagline: 'Farm-to-table catering with rustic elegance',
    offerings: 'Wedding catering, corporate events, private dinners',
    email: 'events@cedarandforge.demo',
  },
  {
    brandName: 'Bloom & Lore',
    businessType: 'event-floral',
    subdomain: 'bloomandlore',
    tagline: 'Editorial florals for life\'s most beautiful moments',
    offerings: 'Wedding flowers, event decor, installations',
    email: 'studio@bloomandlore.demo',
  },
  {
    brandName: 'Earth & Ember',
    businessType: 'artisan-market',
    subdomain: 'earthandember',
    tagline: 'Hand-thrown ceramics for intentional living',
    offerings: 'Pottery, dinnerware, home decor, custom commissions',
    email: 'maker@earthandember.demo',
  },
  {
    brandName: 'Vantage Coaching',
    businessType: 'coach-educator',
    subdomain: 'vantagecoaching',
    tagline: 'Executive coaching for leaders ready to level up',
    offerings: 'Executive coaching, leadership development, career transitions',
    email: 'coach@vantagecoaching.demo',
  },
  {
    brandName: 'Apex Consulting',
    businessType: 'service-pro',
    subdomain: 'apexconsulting',
    tagline: 'Business transformation for high-growth companies',
    offerings: 'Strategy consulting, operations optimization, team scaling',
    email: 'team@apexconsulting.demo',
  },
];

async function generateDemoSite(site: DemoSite) {
  console.log(`\n🎨 Generating: ${site.brandName} (${site.businessType})`);
  
  try {
    // Check if site already exists
    const { data: existing } = await supabaseAdmin
      .from('sites')
      .select('id, subdomain')
      .eq('subdomain', site.subdomain)
      .single();
    
    if (existing) {
      console.log(`  ⚠️  Site ${site.subdomain} already exists, skipping...`);
      return existing.id;
    }
    
    // Create site
    const { data: newSite, error: createError } = await supabaseAdmin
      .from('sites')
      .insert({
        business_name: site.brandName,
        business_type: site.businessType,
        subdomain: site.subdomain,
        email: site.email,
        tagline: site.tagline,
        published: false,
      })
      .select()
      .single();
      
    if (createError || !newSite) {
      console.error(`  ❌ Failed to create site:`, createError);
      return null;
    }
    
    console.log(`  ✅ Site created: ${newSite.id}`);
    
    // Generate content using fixed templates
    console.log(`  🤖 Generating content with AI...`);
    const { pages } = await generateSiteContent(
      site.brandName,
      site.businessType,
      site.offerings,
      site.email,
      site.tagline
    );
    
    console.log(`  ✅ Generated ${pages.length} pages`);
    
    // Save pages to database
    for (const page of pages) {
      const { error: pageError } = await supabaseAdmin
        .from('pages')
        .insert({
          site_id: newSite.id,
          slug: page.slug,
          title: page.title,
          sections: page.sections,
          published: true,
        });
        
      if (pageError) {
        console.error(`  ❌ Failed to save page ${page.slug}:`, pageError);
      }
    }
    
    console.log(`  ✅ Pages saved`);
    
    // Publish the site
    const { error: publishError } = await supabaseAdmin
      .from('sites')
      .update({
        published: true,
        published_at: new Date().toISOString(),
        template_data: { pages, version: 2 },
      })
      .eq('id', newSite.id);
      
    if (publishError) {
      console.error(`  ❌ Failed to publish:`, publishError);
    } else {
      console.log(`  🚀 Published at: https://${site.subdomain}.edgemarketplacehub.com`);
    }
    
    return newSite.id;
    
  } catch (err) {
    console.error(`  ❌ Error:`, err);
    return null;
  }
}

async function main() {
  console.log('🎨 Generating 6 demo sites for Edge Marketplace Hub...\n');
  
  const results = [];
  
  for (const site of DEMO_SITES) {
    const id = await generateDemoSite(site);
    results.push({ name: site.brandName, id, subdomain: site.subdomain });
    
    // Small delay between generations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✨ Demo generation complete!\n');
  console.log('📋 Summary:');
  results.forEach(r => {
    if (r.id) {
      console.log(`  ✅ ${r.name} → https://${r.subdomain}.edgemarketplacehub.com`);
    } else {
      console.log(`  ❌ ${r.name} → FAILED`);
    }
  });
  
  console.log('\n🎯 Next step: Update homepage to showcase these demos');
}

main().catch(console.error);
