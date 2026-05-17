import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rate-limit'

// Search Unsplash for images
export async function GET(request: NextRequest) {
  const limited = rateLimitResponse(request, 'images-search')
  if (limited) return limited

  try {
    const query = request.nextUrl.searchParams.get('q');
    const count = parseInt(request.nextUrl.searchParams.get('count') || '9');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!unsplashKey) {
      // Return placeholder images if no API key
      return NextResponse.json([
        { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', thumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', alt: 'Placeholder image 1' },
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200', thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200', alt: 'Placeholder image 2' },
        { url: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200', thumb: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200', alt: 'Placeholder image 3' },
      ]);
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Unsplash API error' }, { status: 500 });
    }

    const data = await res.json();
    const images = data.results.map((img: any) => ({
      url: img.urls.regular,
      thumb: img.urls.small,
      alt: img.alt_description || img.description || 'Unsplash image',
    }));

    return NextResponse.json(images);
  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
