import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/apiConfig';

export async function GET(request: NextRequest) {
  try {
    // Check API configuration
    const configStatus = {
      cloudVisionApiKey: !!API_CONFIG.CLOUD_VISION.API_KEY,
      cloudVisionApiKeyLength: API_CONFIG.CLOUD_VISION.API_KEY?.length || 0,
      cloudVisionBaseUrl: API_CONFIG.CLOUD_VISION.BASE_URL,
    };

    // Test Cloud Vision API with a simple request
    if (API_CONFIG.CLOUD_VISION.API_KEY) {
      try {
        const testResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${API_CONFIG.CLOUD_VISION.API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  image: {
                    content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                  },
                  features: [
                    {
                      type: 'LABEL_DETECTION',
                      maxResults: 1
                    }
                  ]
                }
              ]
            })
          }
        );

        const testResult = await testResponse.json();
        
        return NextResponse.json({
          success: true,
          message: 'Posture analysis API is properly configured',
          configStatus,
          apiTest: {
            status: testResponse.status,
            ok: testResponse.ok,
            hasResponse: !!testResult,
            error: testResult.error || null
          }
        });
      } catch (apiError: any) {
        return NextResponse.json({
          success: false,
          message: 'API configuration issue detected',
          configStatus,
          apiTest: {
            error: apiError.message
          }
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cloud Vision API key not configured',
        configStatus
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 