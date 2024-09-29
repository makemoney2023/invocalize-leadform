import axios from 'axios';

const BLAND_API_KEY = process.env.BLAND_API_KEY;

export async function analyzeCall(callId: string, goal: string, questions: [string, string][]) {
  try {
    const response = await axios.post(
      `https://api.bland.ai/v1/calls/${callId}/analyze`,
      { goal, questions },
      {
        headers: {
          'Authorization': `Bearer ${BLAND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error analyzing call:', error);
    throw error;
  }
}
