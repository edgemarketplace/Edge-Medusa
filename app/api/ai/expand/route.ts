import { NextRequest, NextResponse } from 'next/server';
import { expandBusinessDescription } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, businessName, businessType } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const expanded = await expandBusinessDescription(
      prompt, 
      businessName || 'this business', 
      businessType || 'general'
    );

    return NextResponse.json({ expanded });
  } catch (err: any) {
    console.error('[AI Expand] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
