import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeCallAnalysis(callId: string, analysisData: any) {
  const { data, error } = await supabase
    .from('call_analysis')
    .insert({
      call_id: callId,
      analysis: analysisData
    });

  if (error) throw error;
  return data;
}
