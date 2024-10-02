import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeCallAnalysis(callId: string, analysisData: any) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        analysis: analysisData.analysis,
        call_status: analysisData.callDetails.status,
        call_length: analysisData.callDetails.call_length,
        batch_id: analysisData.callDetails.batch_id,
        to_number: analysisData.callDetails.to,
        from_number: analysisData.callDetails.from,
        request_data: analysisData.callDetails.request_data,
        completed: analysisData.callDetails.completed,
        inbound: analysisData.callDetails.inbound,
        queue_status: analysisData.callDetails.queue_status,
        endpoint_url: analysisData.callDetails.endpoint_url,
        max_duration: analysisData.callDetails.max_duration,
        error_message: analysisData.callDetails.error_message,
        variables: analysisData.callDetails.variables,
        answered_by: analysisData.callDetails.answered_by,
        record: analysisData.callDetails.record,
        recording_url: analysisData.callDetails.recording_url,
        c_id: analysisData.callDetails.c_id,
        metadata: analysisData.callDetails.metadata,
        summary: analysisData.callDetails.summary,
        price: analysisData.callDetails.price,
        started_at: analysisData.callDetails.started_at,
        local_dialing: analysisData.callDetails.local_dialing,
        call_ended_by: analysisData.callDetails.call_ended_by,
        pathway: analysisData.callDetails.pathway,
        analysis_schema: analysisData.callDetails.analysis_schema,
        corrected_duration: analysisData.callDetails.corrected_duration,
        end_at: analysisData.callDetails.end_at,
        concatenated_transcript: analysisData.callDetails.concatenated_transcript,
        transcripts: analysisData.callDetails.transcripts
      })
      .eq('call_id', callId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Analysis data stored successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in storeCallAnalysis:', error);
    throw error;
  }
}
