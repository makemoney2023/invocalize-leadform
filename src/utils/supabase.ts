import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeCallAnalysis(callId: string, analysisData: any) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        analysis: analysisData,
        // Include other fields from the Bland AI response here
        call_status: analysisData.status,
        call_length: analysisData.call_length,
        batch_id: analysisData.batch_id,
        to_number: analysisData.to,
        from_number: analysisData.from,
        request_data: analysisData.request_data,
        completed: analysisData.completed,
        inbound: analysisData.inbound,
        queue_status: analysisData.queue_status,
        endpoint_url: analysisData.endpoint_url,
        max_duration: analysisData.max_duration,
        error_message: analysisData.error_message,
        variables: analysisData.variables,
        answered_by: analysisData.answered_by,
        record: analysisData.record,
        recording_url: analysisData.recording_url,
        c_id: analysisData.c_id,
        metadata: analysisData.metadata,
        summary: analysisData.summary,
        price: analysisData.price,
        started_at: analysisData.started_at,
        local_dialing: analysisData.local_dialing,
        call_ended_by: analysisData.call_ended_by,
        pathway_logs: analysisData.pathway_logs,
        analysis_schema: analysisData.analysis_schema,
        corrected_duration: analysisData.corrected_duration,
        end_at: analysisData.end_at,
        concatenated_transcript: analysisData.concatenated_transcript
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
