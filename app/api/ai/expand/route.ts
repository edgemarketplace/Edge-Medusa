import { NextRequest, NextResponse } from 'next/server'
import { expandBusinessDescription } from '@/lib/ai'
import { rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = rateLimitResponse(request, 'ai-expand')
  if (limited) return limited

  try {
    const { prompt, businessName, businessType } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const expanded = await expandBusinessDescription(
      businessName || 'this business',
      businessType || 'general',
      prompt,
    );

    return NextResponse.json({ expanded });
  } catch (err: any) {
    console.error('[AI Expand] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
