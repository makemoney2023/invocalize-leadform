import { NextResponse } from 'next/server';
import { analyzeCall } from '@/utils/blandAI';
import { storeCallAnalysis } from '@/utils/supabase';

export async function POST(req: Request) {
  try {
    const { callId, goal, questions } = await req.json();

    if (!callId || !goal || !questions) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Analyze the call using Bland AI
    let analysisResult;
    try {
      analysisResult = await analyzeCall(callId, goal, questions);
    } catch (error) {
      console.error('Error in analyzeCall:', error);
      return NextResponse.json({ error: 'Error analyzing call with Bland AI' }, { status: 500 });
    }

    // Store the analysis result in Supabase
    try {
      await storeCallAnalysis(callId, analysisResult);
    } catch (error) {
      console.error('Error in storeCallAnalysis:', error);
      return NextResponse.json({ error: 'Error storing call analysis' }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis: analysisResult });
  } catch (error) {
    console.error('Error in analyze-call API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}