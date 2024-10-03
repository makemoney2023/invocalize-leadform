import { NextResponse } from 'next/server';
import { analyzeCall } from '@/utils/blandAI';
import { storeCallAnalysis } from '@/utils/supabase';

export async function POST(req: Request) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Missing call ID' }, { status: 400 });
    }

    const goal = "Understand customer satisfaction and product feedback";
    const questions = [
      ["Who answered the call?", "human or voicemail"],
      ["Positive feedback about the product: ", "string"],
      ["Negative feedback about the product: ", "string"],
      ["Customer confirmed they were satisfied", "boolean"]
    ];

    console.log('Analyzing call:', { callId, goal, questions });

    let analysisResult;
    try {
      analysisResult = await analyzeCall(callId, goal, questions as [string, string][]);
      console.log('Analysis result:', analysisResult);
    } catch (error) {
      console.error('Error in analyzeCall:', error);
      return NextResponse.json({ error: 'Error analyzing call with Bland AI' }, { status: 500 });
    }

    try {
      const storedData = await storeCallAnalysis(callId, analysisResult);
      console.log('Stored analysis data:', storedData);
    } catch (error) {
      console.error('Error in storeCallAnalysis:', error);
      return NextResponse.json({ error: 'Error storing call analysis' }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis: analysisResult.analysis });
  } catch (error) {
    console.error('Error in analyze-call API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}