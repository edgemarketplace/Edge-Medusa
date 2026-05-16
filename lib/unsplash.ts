/**
 * Unsplash API integration for auto-fetching section images
 */

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Fetch a single image URL from Unsplash based on search term
 */
export async function fetchUnsplashImage(searchTerm: string): Promise<string | null> {
  if (!UNSPLASH_KEY) {
    console.warn('UNSPLASH_ACCESS_KEY not set');
    return null;
  }

  if (!searchTerm || searchTerm.trim() === '') {
    return null;
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`;
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.results || [];
    if (results.length === 0) return null;

    return results[0].urls.regular;
  } catch (error) {
    console.error('Unsplash error:', error);
    return null;
  }
}

/**
 * Process all sections in pages and replace image search terms with actual URLs
 */
export async function processImagesInPages(pages: any[]): Promise<any[]> {
  const result = [...pages];

  for (const page of result) {
    for (const section of page.sections || []) {
      await processSectionImages(section);
    }
  }

  return result;
}

async function processSectionImages(section: any) {
  const data = section.data;
  if (!data) return;

  // Process direct imageUrl fields
  if (data.imageUrl && typeof data.imageUrl === 'string' && !data.imageUrl.startsWith('http')) {
    const url = await fetchUnsplashImage(data.imageUrl);
    if (url) data.imageUrl = url;
  }

  // Process arrays with images
  const arrayFields = ['items', 'testimonials', 'reviews', 'pairs', 'collections'];
  for (const field of arrayFields) {
    if (!data[field] || !Array.isArray(data[field])) continue;
    for (const item of data[field]) {
      if (item.imageUrl && typeof item.imageUrl === 'string' && !item.imageUrl.startsWith('http')) {
        const url = await fetchUnsplashImage(item.imageUrl);
        if (url) item.imageUrl = url;
      }
      if (item.beforeUrl && typeof item.beforeUrl === 'string' && !item.beforeUrl.startsWith('http')) {
        const url = await fetchUnsplashImage(item.beforeUrl);
        if (url) item.beforeUrl = url;
      }
      if (item.afterUrl && typeof item.afterUrl === 'string' && !item.afterUrl.startsWith('http')) {
        const url = await fetchUnsplashImage(item.afterUrl);
        if (url) item.afterUrl = url;
      }
    }
  }

  // Process gallery images
  if (data.images && Array.isArray(data.images)) {
    for (const img of data.images) {
      if (img.url && typeof img.url === 'string' && !img.url.startsWith('http')) {
        const url = await fetchUnsplashImage(img.url);
        if (url) img.url = url;
      }
    }
  }
}
