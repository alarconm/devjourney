import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const v0ApiKey = process.env.V0_API_KEY;

  const response = await fetch('https://api.v0.dev/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${v0ApiKey}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
