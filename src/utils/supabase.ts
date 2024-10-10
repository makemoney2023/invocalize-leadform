import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function storeCallData(callId: string, callData: any, leadId: string) {
  try {
    console.log(`Storing call data for call ${callId}`);
    
    // Format analysis data if necessary
    const formattedAnalysis = formatAnalysisData(callData.analysis);
    
    const updateData = {
      call_id: callId,
      call_status: callData.status,
      call_length: Math.round(callData.call_length) || 0,
      batch_id: callData.batch_id,
      to_number: callData.to,
      from_number: callData.from,
      request_data: callData.request_data,
      completed: callData.completed,
      inbound: callData.inbound,
      queue_status: callData.queue_status,
      endpoint_url: callData.endpoint_url,
      max_duration: callData.max_duration,
      error_message: callData.error_message,
      variables: callData.variables,
      answered_by: callData.answered_by,
      record: callData.record,
      recording_url: callData.recording_url,
      c_id: callData.c_id,
      metadata: callData.metadata,
      summary: callData.summary,
      price: callData.price,
      started_at: callData.started_at,
      local_dialing: callData.local_dialing,
      call_ended_by: callData.call_ended_by,
      pathway_logs: callData.pathway_logs,
      analysis_schema: callData.analysis_schema,
      analysis: formattedAnalysis,
      corrected_duration: callData.corrected_duration,
      end_at: callData.end_at,
      concatenated_transcript: callData.concatenated_transcript,
      transcripts: JSON.stringify(callData.transcripts),
      city: callData.variables?.city || null,
      country: callData.variables?.country || null,
      state: callData.variables?.state || null,
      zip: callData.variables?.zip || null,
      updated_at: new Date().toISOString()
    };

    console.log(`Analysis data being stored:`, JSON.stringify(formattedAnalysis, null, 2));

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    if (error) {
      console.error(`Supabase error for call ${callId}:`, error);
      if (error.message.includes('analysis')) {
        console.error('Error specifically related to analysis data:', formattedAnalysis);
      }
      throw error;
    }
    console.log(`Call data stored successfully for call ${callId}`);
    return data;
  } catch (error) {
    console.error(`Error in storeCallData for call ${callId}:`, error);
    throw error;
  }
}

function formatAnalysisData(analysisData: any) {
  // Add any necessary formatting logic here
  return analysisData;
}