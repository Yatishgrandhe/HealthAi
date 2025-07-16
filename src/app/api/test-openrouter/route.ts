import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not configured',
        status: 'not_configured'
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'test' }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.7,
        }
      })
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        status: 'connected',
        message: 'Gemini API is working correctly'
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        status: 'error',
        error: errorData.error?.message || 'Authentication failed',
        statusCode: response.status
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 