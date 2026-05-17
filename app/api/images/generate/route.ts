import { NextRequest, NextResponse } from 'next/server';

// AI image generation has been removed — Unsplash stock images are used instead.
// This endpoint returns a helpful error for any legacy calls.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'AI image generation is disabled. Use Unsplash stock images instead.',
      alternative: 'Use the /api/unsplash endpoint for curated stock photography.',
    },
    { status: 503 }
  );
}
