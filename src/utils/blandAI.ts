import axios from 'axios';

const BLAND_API_KEY = process.env.BLAND_API_KEY;

export async function initiateCall(phoneNumber: string, task: string, metadata: any) {
  if (!BLAND_API_KEY) {
    throw new Error('Bland API key is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: phoneNumber,
        task,
        voice: "maya",
        first_sentence: `Hello, is this ${metadata.name}?`,
        wait_for_greeting: true,
        model: "enhanced",
        temperature: 0.7,
        record: true,
        metadata,
        summary_prompt: "Concisely summarize the call, including key points discussed and any actions or decisions made.",
        analysis_prompt: "Analyze the call for customer satisfaction, key insights, and areas for improvement.",
        analysis_schema: {
          "customer_satisfaction": "number",
          "key_points": "array",
          "areas_for_improvement": "array"
        },
        questions: [
          ["Who answered the call?", "human or voicemail"],
          ["Positive feedback about the product: ", "string"],
          ["Negative feedback about the product: ", "string"],
          ["Customer confirmed they were satisfied", "boolean"]
        ],
        answered_by_enabled: true,
        max_duration: 600, // 10 minutes
      },
      {
        headers: {
          'Authorization': BLAND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Bland API response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error initiating call:', error.response.data);
    } else {
      console.error('Error initiating call:', error);
    }
    throw error;
  }
}

export async function analyzeCall(callId: string) {
  if (!BLAND_API_KEY) {
    throw new Error('Bland API key is not configured');
  }

  try {
    const response = await axios.post(
      `https://api.bland.ai/v1/calls/${callId}/analyze`,
      {
        questions: [
          ["Who answered the call?", "human or voicemail"],
          ["Positive feedback about the product: ", "string"],
          ["Negative feedback about the product: ", "string"],
          ["Customer confirmed they were satisfied", "boolean"]
        ]
      },
      {
        headers: {
          'Authorization': BLAND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.answers;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error analyzing call:', error.response.data);
    } else {
      console.error('Error analyzing call:', error);
    }
    throw error;
  }
}

export async function fetchLatestCallDetails(callId: string) {
  if (!BLAND_API_KEY) {
    throw new Error('Bland API key is not configured');
  }

  try {
    const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: {
        'Authorization': BLAND_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Latest call details:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error fetching latest call details:', error.response.data);
    } else {
      console.error('Error fetching latest call details:', error);
    }
    throw error;
  }
}