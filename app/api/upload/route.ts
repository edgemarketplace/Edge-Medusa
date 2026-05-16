import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const siteId = formData.get('siteId') as string;

    if (!file || !siteId) {
      return NextResponse.json({ error: 'File and siteId required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Create bucket if not exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'product-images');
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880, // 5MB
      });
    }

    // Upload file
    const fileExt = file.name.split('.').pop();
    const fileName = `${siteId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
