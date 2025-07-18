import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This is just for debugging - in a real app, localStorage is client-side only
    // But we can check if the data structure is correct by looking at the request
    const url = new URL(request.url);
    const testData = url.searchParams.get('testData');
    
    if (testData) {
      try {
        const parsed = JSON.parse(testData);
        return NextResponse.json({ 
          success: true, 
          isValid: true, 
          data: parsed,
          count: Array.isArray(parsed) ? parsed.length : 'not an array'
        });
      } catch (parseError) {
        return NextResponse.json({ 
          success: false, 
          isValid: false, 
          error: 'Invalid JSON' 
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint ready. Send testData parameter to validate JSON structure.' 
    });
  } catch (error) {
    console.error('Test localStorage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 