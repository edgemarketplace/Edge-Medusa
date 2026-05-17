// Shippo shipping integration
// Uses SHIPPO_API_KEY from env vars (set in Vercel)

interface ShippoAddress {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

interface ShippoParcel {
  length: string;
  width: string;
  height: string;
  distance_unit: string;
  weight: string;
  mass_unit: string;
}

interface ShippoRate {
  object_id: string;
  provider: string;
  servicelevel: { name: string; token: string };
  amount: string;
  currency: string;
  duration_terms?: string;
  estimated_days?: number;
}

function getHeaders(): Record<string, string> {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) throw new Error('SHIPPO_API_KEY not set');
  return {
    'Authorization': `ShippoToken ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function createShipment(
  fromAddress: ShippoAddress,
  toAddress: ShippoAddress,
  parcels: ShippoParcel[]
): Promise<{ object_id: string; rates: ShippoRate[] }> {
  const res = await fetch('https://api.goshippo.com/shipments/', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      address_from: fromAddress,
      address_to: toAddress,
      parcels,
      async: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shippo shipment failed: ${err}`);
  }

  return res.json();
}

// Quick helper: get cheapest rate for a shipment
export async function getCheapestRate(
  fromAddress: ShippoAddress,
  toAddress: ShippoAddress,
  parcels: ShippoParcel[]
): Promise<ShippoRate | null> {
  const shipment = await createShipment(fromAddress, toAddress, parcels);
  if (!shipment.rates || shipment.rates.length === 0) return null;
  
  // Sort by amount (cheapest first)
  const sorted = [...shipment.rates].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
  return sorted[0];
}

// Default parcel presets based on order size
export function getParcelForItemCount(count: number): ShippoParcel {
  if (count <= 2) {
    // Small box (shoebox)
    return {
      length: '8',
      width: '6',
      height: '4',
      distance_unit: 'in',
      weight: '1',
      mass_unit: 'lb',
    };
  }
  if (count <= 5) {
    // Medium box
    return {
      length: '12',
      width: '10',
      height: '8',
      distance_unit: 'in',
      weight: '3',
      mass_unit: 'lb',
    };
  }
  // Large box
  return {
    length: '18',
    width: '14',
    height: '12',
    distance_unit: 'in',
    weight: '5',
    mass_unit: 'lb',
  };
}

// Create a transaction (buy label) once order is confirmed
export async function createTransaction(rateId: string): Promise<{ label_url: string; tracking_number: string; tracking_url_provider?: string }> {
  const res = await fetch('https://api.goshippo.com/transactions/', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      rate: rateId,
      label_file_type: 'PDF',
      async: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shippo transaction failed: ${err}`);
  }

  const data = await res.json();
  return {
    label_url: data.label_url,
    tracking_number: data.tracking_number || '',
    tracking_url_provider: data.tracking_url_provider,
  };
}

// Simple validation: check if Shippo is configured
export function isShippoConfigured(): boolean {
  return !!process.env.SHIPPO_API_KEY;
}
