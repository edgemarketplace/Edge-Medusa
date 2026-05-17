import { supabaseAdmin } from './supabase'

export type DomainEvent = {
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload?: Record<string, any>
}

export async function emitEvent(event: DomainEvent) {
  try {
    const { error } = await supabaseAdmin.from('domain_events').insert({
      id: crypto.randomUUID(),
      aggregate_type: event.aggregate_type,
      aggregate_id: event.aggregate_id,
      event_type: event.event_type,
      payload: event.payload || {},
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[events] failed to emit event:', error.message)
    }
  } catch (err) {
    console.error('[events] unexpected error:', err)
  }
}

// Convenience helpers for common events
export const Events = {
  sitePublished: (siteId: string, businessName: string | null) =>
    emitEvent({
      aggregate_type: 'site',
      aggregate_id: siteId,
      event_type: 'site.published',
      payload: { business_name: businessName },
    }),

  siteUpdated: (siteId: string, changes: Record<string, any>) =>
    emitEvent({
      aggregate_type: 'site',
      aggregate_id: siteId,
      event_type: 'site.updated',
      payload: changes,
    }),

  productCreated: (siteId: string, productId: string, name: string | null) =>
    emitEvent({
      aggregate_type: 'inventory_item',
      aggregate_id: productId,
      event_type: 'product.created',
      payload: { site_id: siteId, name },
    }),

  productUpdated: (siteId: string, productId: string, changes: Record<string, any>) =>
    emitEvent({
      aggregate_type: 'inventory_item',
      aggregate_id: productId,
      event_type: 'product.updated',
      payload: { site_id: siteId, ...changes },
    }),

  channelVisibilityUpdated: (siteId: string, channel: string, visible: boolean) =>
    emitEvent({
      aggregate_type: 'site',
      aggregate_id: siteId,
      event_type: 'channel_visibility.updated',
      payload: { channel, visible },
    }),

  pageUpdated: (siteId: string, pageId: string, sectionCount: number) =>
    emitEvent({
      aggregate_type: 'page',
      aggregate_id: pageId,
      event_type: 'page.updated',
      payload: { site_id: siteId, section_count: sectionCount },
    }),

  published: (siteId: string, businessName: string | null, organizationId?: string | null) =>
    emitEvent({
      aggregate_type: 'site',
      aggregate_id: siteId,
      event_type: 'publication.approved',
      payload: { business_name: businessName, organization_id: organizationId },
    }),

  rejected: (siteId: string, businessName: string | null, reason: string) =>
    emitEvent({
      aggregate_type: 'site',
      aggregate_id: siteId,
      event_type: 'publication.rejected',
      payload: { business_name: businessName, reason },
    }),
}
