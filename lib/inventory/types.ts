export type InventorySourceType = 'manual' | 'stripe' | 'printify' | 'hybrid'
export type InventorySyncStatus = 'idle' | 'pending' | 'synced' | 'error'
export type InventoryFulfillmentMode = 'manual' | 'printify'
export type InventoryPricingMode = 'manual' | 'stripe'
export type InventoryStatus = 'active' | 'draft' | 'archived'

export type InventorySourceRefs = {
  stripe_product_id?: string | null
  stripe_price_id?: string | null
  printify_product_id?: string | null
  printify_shop_id?: string | null
  medusa_product_id?: string | null
  medusa_variant_ids?: string[] | null
}

export type InventoryVariantInput = {
  name: string
  value: string
  price_adjustment?: string | number | null
  sku?: string | null
}

export type InventoryCatalogInput = {
  id?: string
  site_id?: string
  name: string
  description?: string
  price?: string | number
  image_url?: string | null
  category?: string
  sku?: string | null
  stock?: number | null
  variants?: InventoryVariantInput[] | null
  enabled?: boolean
  metadata?: Record<string, any> | null
  source_type?: InventorySourceType
  source_refs?: InventorySourceRefs
  sync_status?: InventorySyncStatus
  sync_error?: string | null
  fulfillment_mode?: InventoryFulfillmentMode
  pricing_mode?: InventoryPricingMode
  status?: InventoryStatus
  external_updated_at?: string | null
  last_synced_at?: string | null
}

export type InventoryCatalogRow = InventoryCatalogInput & {
  id: string
  site_id: string
  created_at?: string
  updated_at?: string
}
