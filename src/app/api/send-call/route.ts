import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { initiateCall, analyzeCall, fetchLatestCallDetails } from '@/utils/blandAI';
import { storeCallData } from '@/utils/supabase';

const BLAND_API_KEY = process.env.BLAND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function pollCallStatus(callId: string, leadId: string) {
  const maxAttempts = 20;
  const pollInterval = 15000;
  const analysisRetries = 3;

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    try {
      const callDetails = await fetchLatestCallDetails(callId);
      console.log(`Poll attempt ${attempts + 1}: Call status - ${callDetails.status}`);
      
      if (callDetails.status === 'completed') {
        let analysisResult;
        for (let i = 0; i < analysisRetries; i++) {
          try {
            analysisResult = await analyzeCall(callId);
            break;
          } catch (error) {
            console.error(`Analysis attempt ${i + 1} failed:`, error);
            if (i === analysisRetries - 1) throw error;
          }
        }
        
        await storeCallData(callId, { 
          ...callDetails, 
          analysis: analysisResult, 
          summary: callDetails.summary, 
          recording_url: callDetails.recording_url 
        }, leadId);
        return;
      } else if (callDetails.status === 'failed' || callDetails.status === 'error') {
        await storeCallData(callId, callDetails, leadId);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error polling call status:', error);
      if (attempts === maxAttempts - 1) {
        await supabase
          .from('leads')
          .update({ call_status: 'error', error_message: String(error) })
          .eq('id', leadId);
        throw new Error('Max polling attempts reached. Call status could not be determined.');
      }
    }
  }
}

export async function POST(req: Request) {
  if (!BLAND_API_KEY) {
    console.error('Bland API key is not configured');
    return NextResponse.json({ error: 'Bland API key is not configured' }, { status: 500 });
  }

  try {
    const { name, email, phoneNumber, company, role, useCase } = await req.json();

    console.log('Received form data:', { name, email, phoneNumber, company, role, useCase });

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({ name, email, phone_number: phoneNumber, company, role, use_case: useCase })
      .select()
      .single();

    if (leadError) {
      console.error('Error inserting lead data:', leadError);
      throw leadError;
    }

    const leadId = leadData.id;
    console.log('Lead inserted with ID:', leadId);

    const blandApiResponse = await initiateCall(phoneNumber, `You are an AI assistant calling ${name} from ${company}. They recently submitted a form expressing interest in our AI voice agent demo. Their role is ${role} and their use case is: ${useCase}. Your task is to briefly introduce yourself, thank them for their interest, and demonstrate the capabilities of our AI voice agent based on their use case.`, { leadId, name, email, company, role, useCase });

    await storeCallData(blandApiResponse.call_id, blandApiResponse, leadId);

    // Start polling for call status
    pollCallStatus(blandApiResponse.call_id, leadId);

    return NextResponse.json({ success: true, callId: blandApiResponse.call_id, leadId });
  } catch (error: any) {
    console.error('Error in send-call API route:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}