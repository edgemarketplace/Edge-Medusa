import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    }

    // Get inventory count
    const { count: productCount } = await supabaseAdmin
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('enabled', true);

    // Get low stock count (stock < 5)
    const { count: lowStockCount } = await supabaseAdmin
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .lt('stock', 5);

    // TODO: Get actual orders from Stripe when available
    // For now, return mock data
    return NextResponse.json({
      totalOrders: 0,
      totalRevenue: 0,
      activeProducts: productCount || 0,
      lowStockItems: lowStockCount || 0,
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
