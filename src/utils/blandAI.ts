import axios from 'axios';

const BLAND_API_KEY = process.env.BLAND_API_KEY;

export async function initiateCall(phoneNumber: string, task: string, metadata: any) {
  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: phoneNumber,
        task,
        voice: "maya",
        first_sentence: `Hello, is this ${metadata.name}?`,
        wait_for_greeting: true,
        interruption_threshold: 123,
        model: "enhanced",
        temperature: 0.7,
        metadata
      },
      {
        headers: {
          'Authorization': BLAND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error initiating call:', error);
    throw error;
  }
}

export async function analyzeCall(callId: string, goal: string, questions: [string, string][]) {
  try {
    const analysisResponse = await fetch(`https://api.bland.ai/v1/calls/${callId}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BLAND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ goal, questions })
    });

    const callDetailsResponse = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BLAND_API_KEY}`
      }
    });

    const analysisData = await analysisResponse.json();
    const callDetails = await callDetailsResponse.json();

    return {
      analysis: analysisData,
      callDetails: callDetails
    };
  } catch (error) {
    console.error('Error analyzing call:', error);
    throw error;
  }
}