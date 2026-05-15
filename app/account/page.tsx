import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import AccountClient from './AccountClient';

export interface SiteSummary {
  id: string;
  business_name: string;
  business_type: string;
  status: string;
  subdomain: string | null;
  created_at: string;
  updated_at: string;
}

async function getSites(email: string): Promise<SiteSummary[]> {
  const { data, error } = await supabaseAdmin
    .from('sites')
    .select('id, business_name, business_type, status, subdomain, created_at, updated_at')
    .eq('contact_email', email.toLowerCase().trim())
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sites:', error);
    return [];
  }

  return data || [];
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get('auth_email')?.value;

  if (!email) {
    redirect('/login');
  }

  const sites = await getSites(email);

  return <AccountClient email={email} sites={sites} />;
}
