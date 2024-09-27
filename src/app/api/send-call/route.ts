import { NextResponse } from 'next/server';
import axios from 'axios';

const BLAND_API_KEY = process.env.BLAND_API_KEY;

export async function POST(req: Request) {
  if (!BLAND_API_KEY) {
    return NextResponse.json({ error: 'Bland API key is not configured' }, { status: 500 })
  }

  try {
    const { name, email, phoneNumber, company, role, useCase } = await req.json()

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
        metadata: {
          name,
          email,
          company,
          role,
          useCase
        }
      },
      {
        headers: {
          'Authorization': BLAND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    return NextResponse.json({ success: true, callId: blandApiResponse.data.call_id })
  } catch (error) {
    console.error('Error calling Bland API:', error)
    return NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 })
  }
}
