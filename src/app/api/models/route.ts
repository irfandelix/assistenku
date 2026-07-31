import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY missing' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const validModels = data.models
      ? data.models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')).map((m: any) => m.name)
      : data;

    return NextResponse.json({ validModels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
