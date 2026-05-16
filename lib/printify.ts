/**
 * Printify API Integration
 * Documentation: https://developers.printify.com/
 */

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: { src: string; variant_ids: number[] }[];
  variants: { id: number; price: number; title: string }[];
}

/**
 * Fetch all shops for the given API key
 */
export async function getPrintifyShops(apiKey: string): Promise<PrintifyShop[]> {
  try {
    const res = await fetch(`${PRINTIFY_BASE_URL}/shops.json`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch Printify shops');
    }

    return await res.json();
  } catch (err) {
    console.error('[Printify] Error fetching shops:', err);
    throw err;
  }
}

/**
 * Fetch products for a specific shop
 */
export async function getPrintifyProducts(apiKey: string, shopId: string | number): Promise<PrintifyProduct[]> {
  try {
    const res = await fetch(`${PRINTIFY_BASE_URL}/shops/${shopId}/products.json`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch Printify products');
    }

    const data = await res.json();
    return data.data; // Printify returns products in a 'data' array
  } catch (err) {
    console.error('[Printify] Error fetching products:', err);
    throw err;
  }
}

/**
 * Sync Printify products to local inventory format
 */
export function mapPrintifyToInventory(product: PrintifyProduct): any {
  return {
    name: product.title,
    description: product.description.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...',
    price: product.variants[0]?.price / 100 || 0, // Printify prices are in cents
    image_url: product.images[0]?.src || '',
    category: 'Printify',
    stock_status: 'in_stock',
    metadata: {
      printify_id: product.id,
      source: 'printify'
    }
  };
}
