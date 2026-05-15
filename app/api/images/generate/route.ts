import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Generate image using fal.ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, siteId } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const falKey = process.env.FAL_KEY;

    if (!falKey) {
      return NextResponse.json({ error: 'AI image generation not configured. Add FAL_KEY to env vars.' }, { status: 503 });
    }

    // Use fal.ai to generate image
    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${prompt}, professional photography, high quality, no text, no watermark`,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('fal.ai error:', errText);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const result = await res.json();
    const imageUrl = result?.image?.url || result?.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Upload to Supabase storage
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ url: imageUrl }); // Return direct URL if upload fails
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const fileName = `ai-${Date.now()}.jpg`;
    const path = `${siteId}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('site-images')
      .upload(path, Buffer.from(imageBuffer), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      // Return direct URL if upload fails
      return NextResponse.json({ url: imageUrl });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('site-images')
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
