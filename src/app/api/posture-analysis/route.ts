import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/apiConfig';

interface PersonDetectionResult {
  detected: boolean;
  confidence: number;
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  details: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }
    if (!API_CONFIG.CLOUD_VISION.API_KEY) {
      return NextResponse.json({ success: false, error: 'Cloud Vision API key not configured' }, { status: 500 });
    }

    // Call Google Cloud Vision API with OBJECT_LOCALIZATION and LABEL_DETECTION
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_CONFIG.CLOUD_VISION.API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                { type: 'LABEL_DETECTION', maxResults: 20 },
              ],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      return NextResponse.json({ success: false, error: `Vision API error: ${visionResponse.status} - ${errorText}` }, { status: 500 });
    }

    const visionData = await visionResponse.json();
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];
    const labels = visionData.responses?.[0]?.labelAnnotations || [];

    // Enhanced person detection logic
    const personDetection = detectPersonAnywhere(objects, labels);
    if (!personDetection.detected) {
      return NextResponse.json({
        success: false,
        error: 'No person detected in the image. Please ensure your full body is visible anywhere in the frame.',
        details: personDetection.details,
        confidence: personDetection.confidence,
      }, { status: 422 });
    }

    // If person detected, return bounding box and confidence
    return NextResponse.json({
      success: true,
      person: {
        detected: true,
        confidence: personDetection.confidence,
        boundingBox: personDetection.boundingBox,
        details: personDetection.details,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to analyze image' }, { status: 500 });
  }
}

function detectPersonAnywhere(
  objects: any[],
  labels: any[]
): PersonDetectionResult {
  // Look for any object with name 'Person' (case-insensitive)
  const personObjects = objects.filter(
    (obj: any) => obj.name && obj.name.toLowerCase() === 'person' && obj.score > 0.5
  );
  const details: string[] = [];
  let bestBox = undefined;
  let bestScore = 0;

  if (personObjects.length > 0) {
    // Find the person with the highest score
    const best = personObjects.reduce((a, b) => (a.score > b.score ? a : b));
    bestScore = best.score;
    // Bounding box is relative (0-1), convert to left/top/width/height
    if (best.boundingPoly && best.boundingPoly.normalizedVertices?.length >= 4) {
      const verts = best.boundingPoly.normalizedVertices;
      const left = Math.min(...verts.map((v: any) => v.x ?? 0));
      const right = Math.max(...verts.map((v: any) => v.x ?? 0));
      const top = Math.min(...verts.map((v: any) => v.y ?? 0));
      const bottom = Math.max(...verts.map((v: any) => v.y ?? 0));
      bestBox = {
        left,
        top,
        width: right - left,
        height: bottom - top,
      };
      details.push(`Person detected with confidence ${best.score.toFixed(2)} at box [${left.toFixed(2)}, ${top.toFixed(2)}, ${right.toFixed(2)}, ${bottom.toFixed(2)}]`);
    } else {
      details.push('Person detected but bounding box is missing or incomplete.');
    }
  }

  // Fallback: check for strong person-related labels
  if (!bestBox) {
    const personKeywords = ['person', 'human', 'man', 'woman', 'boy', 'girl', 'people', 'body', 'selfie', 'portrait'];
    const strongLabels = labels.filter(
      (label: any) =>
        personKeywords.some((kw) => label.description?.toLowerCase().includes(kw)) &&
        label.score > 0.7
    );
    if (strongLabels.length > 0) {
      bestScore = Math.max(...strongLabels.map((l: any) => l.score));
      details.push(`Person-like label(s) detected: ${strongLabels.map((l: any) => l.description).join(', ')}`);
    }
  }

  const detected = !!bestBox || bestScore > 0.7;
  return {
    detected,
    confidence: Math.round((bestScore || 0) * 100),
    boundingBox: bestBox,
    details,
  };
} 