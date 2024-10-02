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
  const maxAttempts = 10;

  while (!callCompleted && attempts < maxAttempts) {
    try {
      const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, {
        headers: {
          'Authorization': BLAND_API_KEY
        }
      });

      const callDetails = response.data;

      const updateData = {
        call_status: callDetails.status,
        call_length: callDetails.call_length,
        batch_id: callDetails.batch_id,
        to_number: callDetails.to,
        from_number: callDetails.from,
        request_data: callDetails.request_data,
        completed: callDetails.completed,
        inbound: callDetails.inbound,
        queue_status: callDetails.queue_status,
        endpoint_url: callDetails.endpoint_url,
        max_duration: callDetails.max_duration,
        error_message: callDetails.error_message,
        variables: callDetails.variables,
        answered_by: callDetails.answered_by,
        record: callDetails.record,
        recording_url: callDetails.recording_url,
        c_id: callDetails.c_id,
        metadata: callDetails.metadata,
        summary: callDetails.summary,
        price: callDetails.price,
        started_at: callDetails.started_at,
        local_dialing: callDetails.local_dialing,
        call_ended_by: callDetails.call_ended_by,
        pathway_logs: callDetails.pathway_logs,
        analysis_schema: callDetails.analysis_schema,
        status: callDetails.status,
        corrected_duration: callDetails.corrected_duration,
        end_at: callDetails.end_at
      };

      await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      console.log(`Call status: ${callDetails.status}`);

      if (callDetails.status === 'completed' || callDetails.status === 'error') {
        callCompleted = true;
        if (callDetails.status === 'completed') {
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
      .update({ call_status: 'unknown' })
      .eq('id', leadId);
  }
}

async function pollTranscript(callId: string, leadId: string) {
  let transcriptReceived = false;
  let attempts = 0;
  const maxAttempts = 20;

  while (!transcriptReceived && attempts < maxAttempts) {
    try {
      const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, {
        headers: {
          'Authorization': BLAND_API_KEY
        }
      });

      const callDetails = response.data;

      if (callDetails.status === 'completed' && callDetails.transcripts) {
        const updateData = {
          call_transcript: callDetails.transcripts,
          concatenated_transcript: callDetails.concatenated_transcript,
          call_duration: callDetails.call_length,
          summary: callDetails.summary,
          analysis: callDetails.analysis,
          pathway: callDetails.pathway,
          call_status: callDetails.status,
          price: callDetails.price,
          started_at: callDetails.started_at,
          end_at: callDetails.end_at,
          call_ended_by: callDetails.call_ended_by
        };

        await supabase
          .from('leads')
          .update(updateData)
          .eq('id', leadId);

        console.log('Transcript and call details received and stored');
        transcriptReceived = true;
      } else if (callDetails.status === 'error') {
        console.error('Call ended with an error:', callDetails.error_message);
        transcriptReceived = true;
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