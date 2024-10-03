import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function storeInitialCallData(leadId: string, callId: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ call_id: callId })
      .eq('id', leadId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Initial call data stored successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in storeInitialCallData:', error);
    throw error;
  }
}

export async function storeCallAnalysis(callId: string, analysisData: any) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        analysis: analysisData.analysis,
        call_status: analysisData.callDetails.status,
        call_length: Math.round(analysisData.callDetails.call_length),
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
        local_dialing: analysisData.callDetails.local_dialing
      })
      .eq('call_id', callId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Call analysis stored successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in storeCallAnalysis:', error);
    throw error;
  }
}