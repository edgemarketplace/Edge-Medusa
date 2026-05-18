import type Stripe from 'stripe'
import type { InventoryCatalogInput, InventorySourceRefs, InventorySourceType } from './types'
import type { PrintifyProduct } from '@/lib/printify'

function mergeSourceTypes(current?: InventorySourceType, incoming?: InventorySourceType): InventorySourceType {
  if (!current) return incoming || 'manual'
  if (!incoming || current === incoming) return current
  return 'hybrid'
}

function isFilled(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function chooseField<T>(current: T | null | undefined, incoming: T | null | undefined, preferCurrent: boolean) {
  if (preferCurrent && isFilled(current)) return current
  if (isFilled(incoming)) return incoming
  return current ?? incoming
}

function prefersManualOverrides(current?: Partial<InventoryCatalogInput> | null, incoming?: InventoryCatalogInput | null) {
  const currentSource = current?.source_type
  const incomingSource = incoming?.source_type
  return (currentSource === 'manual' || currentSource === 'hybrid') && incomingSource !== 'manual'
}

export function mergeSourceRefs(current?: InventorySourceRefs, incoming?: InventorySourceRefs): InventorySourceRefs {
  return {
    ...(current || {}),
    ...(incoming || {}),
  }
}

export function mergeCatalogDraft(
  current: Partial<InventoryCatalogInput> | null | undefined,
  incoming: InventoryCatalogInput,
): InventoryCatalogInput {
  const preserveManual = prefersManualOverrides(current, incoming)
  const incomingWantsStripePricing = incoming.pricing_mode === 'stripe'
  const keepCurrentStripePricing = current?.pricing_mode === 'stripe' && incoming.source_type !== 'manual'
  const preservePrintifyFulfillment = current?.fulfillment_mode === 'printify' && incoming.source_type !== 'manual'

  const mergedPrice = incomingWantsStripePricing
    ? incoming.price
    : keepCurrentStripePricing
      ? current?.price
      : chooseField(current?.price, incoming.price, preserveManual)

  return {
    ...current,
    ...incoming,
    name: chooseField(current?.name, incoming.name, false) || '',
    description: chooseField(current?.description, incoming.description, preserveManual) || '',
    image_url: chooseField(current?.image_url, incoming.image_url, preserveManual) || null,
    category: chooseField(current?.category, incoming.category, preserveManual) || '',
    sku: chooseField(current?.sku, incoming.sku, preserveManual) || null,
    stock: preserveManual && current?.stock != null ? current.stock : (incoming.stock ?? current?.stock ?? null),
    variants: chooseField(current?.variants, incoming.variants, preserveManual) || null,
    price: mergedPrice ?? undefined,
    source_type: mergeSourceTypes(current?.source_type, incoming.source_type),
    source_refs: mergeSourceRefs(current?.source_refs, incoming.source_refs),
    metadata: {
      ...(current?.metadata || {}),
      ...(incoming.metadata || {}),
    },
    enabled: incoming.source_type === 'manual'
      ? incoming.enabled ?? current?.enabled ?? true
      : current?.enabled === false
        ? false
        : incoming.enabled ?? current?.enabled ?? true,
    status: incoming.status || current?.status || 'active',
    sync_status: incoming.sync_status || current?.sync_status || 'idle',
    sync_error: incoming.sync_error ?? current?.sync_error ?? null,
    pricing_mode: incomingWantsStripePricing
      ? 'stripe'
      : keepCurrentStripePricing
        ? 'stripe'
        : incoming.pricing_mode || current?.pricing_mode || 'manual',
    fulfillment_mode: incoming.fulfillment_mode === 'printify'
      ? 'printify'
      : preservePrintifyFulfillment
        ? 'printify'
        : incoming.fulfillment_mode || current?.fulfillment_mode || 'manual',
    external_updated_at: incoming.external_updated_at || current?.external_updated_at || null,
    last_synced_at: incoming.last_synced_at || current?.last_synced_at || null,
  }
}

export function mapPrintifyProductToCatalog(product: PrintifyProduct, shopId: string | number): InventoryCatalogInput {
  const rawProduct = product as any
  return {
    name: product.title,
    description: product.description.replace(/<[^>]*>?/gm, '').trim().slice(0, 500),
    price: (product.variants[0]?.price || 0) / 100,
    image_url: product.images[0]?.src || null,
    category: 'Printify',
    stock: null,
    enabled: true,
    variants: product.variants.map((variant) => ({
      name: 'Variant',
      value: variant.title,
      sku: String(variant.id),
    })),
    source_type: 'printify',
    source_refs: {
      printify_product_id: product.id,
      printify_shop_id: String(shopId),
    },
    fulfillment_mode: 'printify',
    pricing_mode: 'manual',
    sync_status: 'synced',
    metadata: {
      source: 'printify',
      printify_blueprint_id: rawProduct.blueprint_id,
      printify_variant_count: product.variants.length,
    },
    external_updated_at: rawProduct.updated_at,
    last_synced_at: new Date().toISOString(),
  }
}

export function mapStripeProductToCatalog(
  product: Stripe.Product,
  price: Stripe.Price | null | undefined,
): InventoryCatalogInput {
  const amount = typeof price?.unit_amount === 'number' ? price.unit_amount / 100 : 0
  const interval = price?.recurring?.interval
  const intervalCount = price?.recurring?.interval_count
  const recurrenceLabel = interval
    ? `${intervalCount && intervalCount > 1 ? `${intervalCount} ` : ''}${interval}`
    : null

  return {
    name: product.name,
    description: product.description || '',
    price: amount,
    image_url: product.images?.[0] || null,
    category: String(product.metadata?.category || 'Stripe'),
    sku: product.metadata?.sku || null,
    stock: product.metadata?.stock ? Number(product.metadata.stock) : null,
    enabled: product.active !== false,
    variants: recurrenceLabel
      ? [
          {
            name: 'Billing',
            value: recurrenceLabel,
            sku: price?.id || undefined,
          },
        ]
      : null,
    source_type: 'stripe',
    source_refs: {
      stripe_product_id: product.id,
      stripe_price_id: price?.id || null,
    },
    fulfillment_mode: product.metadata?.fulfillment_mode === 'printify' ? 'printify' : 'manual',
    pricing_mode: 'stripe',
    sync_status: 'synced',
    metadata: {
      source: 'stripe',
      stripe_currency: price?.currency || null,
      stripe_price_type: price?.type || null,
      stripe_recurring_interval: interval || null,
      stripe_livemode: product.livemode,
      stripe_url: typeof product.metadata?.url === 'string' ? product.metadata.url : null,
    },
    external_updated_at: typeof product.updated === 'number' ? new Date(product.updated * 1000).toISOString() : null,
    last_synced_at: new Date().toISOString(),
  }
}
