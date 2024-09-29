import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const BLAND_API_KEY = process.env.BLAND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function pollCallStatus(callId: string, leadId: string) {
  let callCompleted = false;
  let attempts = 0;
  const maxAttempts = 10; // Poll for up to 5 minutes (30 seconds * 10 attempts)

  while (!callCompleted && attempts < maxAttempts) {
    try {
      const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, {
        headers: {
          'Authorization': BLAND_API_KEY
        }
      });

      const callDetails = response.data;

      // Update Supabase with the current call status
      const updateData: { call_status: string; call_duration?: number } = {
        call_status: callDetails.status
      };

      if (callDetails.status === 'completed') {
        updateData.call_duration = callDetails.call_length || 0;
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      console.log(`Call status: ${callDetails.status}`);

      if (callDetails.status === 'completed' || callDetails.status === 'error') {
        callCompleted = true;
        if (callDetails.status === 'completed') {
          // Start polling for transcript
          pollTranscript(callId, leadId);
        }
      } else {
        console.log(`Waiting for call completion... (Attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
      }
    } catch (error) {
      console.error('Error polling call status:', error);
      attempts++;
    }
  }

  if (!callCompleted) {
    console.error('Max polling attempts reached. Call status may not be available.');
    await supabase
      .from('leads')
      .update({
        call_status: 'unknown'
      })
      .eq('id', leadId);
  }
}

async function pollTranscript(callId: string, leadId: string) {
  let transcriptReceived = false;
  let attempts = 0;
  const maxAttempts = 20; // Poll for up to 10 minutes (30 seconds * 20 attempts)

  while (!transcriptReceived && attempts < maxAttempts) {
    try {
      const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, {
        headers: {
          'Authorization': BLAND_API_KEY
        }
      });

      const callDetails = response.data;

      if (callDetails.status === 'completed' && callDetails.transcripts) {
        const transcriptData = {
          concatenated_transcript: callDetails.concatenated_transcript,
          transcripts: callDetails.transcripts,
          summary: callDetails.summary,
          call_length: callDetails.call_length,
          answered_by: callDetails.answered_by,
          call_ended_by: callDetails.call_ended_by
        };

        await supabase
          .from('leads')
          .update({
            call_transcript: JSON.stringify(transcriptData),
            call_duration: callDetails.corrected_duration || callDetails.call_length
          })
          .eq('id', leadId);

        console.log('Transcript received and stored');
        transcriptReceived = true;
      } else if (callDetails.status === 'error') {
        console.error('Call ended with an error:', callDetails.error_message);
        transcriptReceived = true; // Stop polling on error
      } else {
        console.log(`Waiting for transcript... (Attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
      }
    } catch (error) {
      console.error('Error polling for transcript:', error);
      attempts++;
    }
  }

  if (!transcriptReceived) {
    console.error('Max polling attempts reached. Transcript may not be available.');
  }
}

export async function POST(req: Request) {
  if (!BLAND_API_KEY) {
    console.error('Bland API key is not configured');
    return NextResponse.json({ error: 'Bland API key is not configured' }, { status: 500 });
  }

  try {
    const { name, email, phoneNumber, company, role, useCase } = await req.json();

    // Insert lead data into Supabase
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({ name, email, phone_number: phoneNumber, company, role, use_case: useCase })
      .select()
      .single();

    if (leadError) throw leadError;

    const leadId = leadData.id;

    // Initiate call with Bland AI
    const blandApiResponse = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: phoneNumber,
        task: `You are an AI assistant calling ${name} from ${company}. They recently submitted a form expressing interest in our AI voice agent demo. Their role is ${role} and their use case is: ${useCase}. Your task is to briefly introduce yourself, thank them for their interest, and demonstrate the capabilities of our AI voice agent based on their use case.`,
        voice: "maya",
        first_sentence: `Hello, is this ${name}?`,
        wait_for_greeting: true,
        interruption_threshold: 123,
        model: "enhanced",
        temperature: 0.7,
        metadata: { leadId, name, email, company, role, useCase }
      },
      {
        headers: {
          'Authorization': BLAND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const callId = blandApiResponse.data.call_id;

    if (!callId) {
      throw new Error('Failed to get call ID from Bland AI');
    }

    // Update lead entry with initial call ID
    await supabase
      .from('leads')
      .update({ call_id: callId })
      .eq('id', leadId);

    // Start polling for call status in the background
    pollCallStatus(callId, leadId);

    return NextResponse.json({ success: true, callId, leadId });
  } catch (error: any) {
    console.error('Error in send-call API route:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}