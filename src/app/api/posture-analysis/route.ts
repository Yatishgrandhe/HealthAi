import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/apiConfig';

interface PostureAnalysis {
  score: number;
  status: "good" | "fair" | "poor";
  feedback: string[];
  recommendations: string[];
  confidence: number;
  personDetected: boolean;
  faceDetected: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!API_CONFIG.CLOUD_VISION.API_KEY) {
      console.error('Cloud Vision API key not configured');
      return NextResponse.json(
        { success: false, error: 'Cloud Vision API key not configured' },
        { status: 500 }
      );
    }

    console.log('Starting posture analysis with Cloud Vision API...');

    // Enhanced Cloud Vision API request with more features
    const visionResponse = await fetch(
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
                content: image
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 15
                },
                {
                  type: 'FACE_DETECTION',
                  maxResults: 1
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 10
                },
                {
                  type: 'SAFE_SEARCH_DETECTION',
                  maxResults: 1
                },
                {
                  type: 'IMAGE_PROPERTIES',
                  maxResults: 1
                }
              ]
            }
          ]
        })
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', visionResponse.status, errorText);
      throw new Error(`Vision API error: ${visionResponse.status} - ${errorText}`);
    }

    const visionData = await visionResponse.json();
    console.log('Vision API response received successfully');
    
    // Enhanced posture analysis
    const analysis = analyzePostureFromVisionData(visionData);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('Posture analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to analyze posture' 
      },
      { status: 500 }
    );
  }
}

function analyzePostureFromVisionData(visionData: any): PostureAnalysis {
  try {
    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const faces = visionData.responses?.[0]?.faceAnnotations || [];
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];
    const imageProperties = visionData.responses?.[0]?.imagePropertiesAnnotation;

    console.log('Vision API Response:', {
      labels: labels.map((l: any) => ({ description: l.description, score: l.score })),
      faces: faces.length,
      objects: objects.map((o: any) => ({ name: o.name, score: o.score }))
    });

    // Enhanced person detection using multiple methods
    const personDetected = detectPerson(labels, objects);
    const faceDetected = faces.length > 0;
    
    if (!personDetected) {
      return {
        score: 0,
        status: "poor",
        feedback: [
          "No person detected in the image",
          "Please ensure you are fully visible in the camera frame",
          "Try adjusting your position, lighting, or distance from camera"
        ],
        recommendations: [
          "Position yourself in the center of the frame",
          "Ensure good lighting on your face and upper body",
          "Remove any obstructions between you and the camera",
          "Stand about 3-6 feet away from the camera"
        ],
        confidence: 0.1,
        personDetected: false,
        faceDetected: false
      };
    }

    // Enhanced posture analysis
    const analysis = analyzePostureDetails(faces, labels, objects, imageProperties);
    
    return {
      ...analysis,
      personDetected: true,
      faceDetected
    };

  } catch (error) {
    console.error('Error analyzing posture from vision data:', error);
    
    return {
      score: 50,
      status: "fair",
      feedback: [
        "Analysis completed with basic assessment",
        "Consider improving lighting for better results"
      ],
      recommendations: [
        "Maintain good posture throughout the day",
        "Take regular breaks to stretch",
        "Consider ergonomic adjustments"
      ],
      confidence: 0.3,
      personDetected: false,
      faceDetected: false
    };
  }
}

function detectPerson(labels: any[], objects: any[]): boolean {
  // Method 1: Check for person-related labels
  const personLabels = [
    'person', 'human', 'people', 'man', 'woman', 'boy', 'girl', 'child',
    'adult', 'human body', 'portrait', 'face', 'head', 'torso', 'body'
  ];
  
  const hasPersonLabel = labels.some((label: any) => 
    personLabels.some(personLabel => 
      label.description?.toLowerCase().includes(personLabel)
    ) && label.score > 0.7
  );

  // Method 2: Check for person objects
  const hasPersonObject = objects.some((obj: any) => 
    obj.name?.toLowerCase() === 'person' && obj.score > 0.7
  );

  // Method 3: Check for clothing items that indicate a person
  const clothingLabels = [
    'clothing', 'shirt', 't-shirt', 'dress', 'pants', 'jeans', 'jacket',
    'sweater', 'blouse', 'skirt', 'suit', 'uniform'
  ];
  
  const hasClothing = labels.some((label: any) => 
    clothingLabels.some(clothingLabel => 
      label.description?.toLowerCase().includes(clothingLabel)
    ) && label.score > 0.6
  );

  // Method 4: Check for body parts
  const bodyPartLabels = [
    'face', 'head', 'hair', 'eye', 'nose', 'mouth', 'ear', 'neck',
    'shoulder', 'arm', 'hand', 'finger', 'chest', 'torso'
  ];
  
  const hasBodyParts = labels.some((label: any) => 
    bodyPartLabels.some(bodyPart => 
      label.description?.toLowerCase().includes(bodyPart)
    ) && label.score > 0.6
  );

  console.log('Person Detection Results:', {
    hasPersonLabel,
    hasPersonObject,
    hasClothing,
    hasBodyParts
  });

  // Person is detected if any method succeeds
  return hasPersonLabel || hasPersonObject || (hasClothing && hasBodyParts);
}

function analyzePostureDetails(faces: any[], labels: any[], objects: any[], imageProperties: any): Omit<PostureAnalysis, 'personDetected' | 'faceDetected'> {
  let postureScore = 50; // Lower base score for more accurate assessment
  let feedback: string[] = [];
  let recommendations: string[] = [];
  let confidence = 0.7;

  // Enhanced face analysis for posture clues
  if (faces.length > 0) {
    const face = faces[0];
    confidence = Math.min((face.detectionConfidence || 0.5) + 0.3, 0.95);
    
    // Analyze face position and orientation
    const faceAnalysis = analyzeFacePosition(face);
    postureScore += faceAnalysis.scoreAdjustment;
    feedback.push(...faceAnalysis.feedback);
    recommendations.push(...faceAnalysis.recommendations);
  } else {
    feedback.push("Face not clearly detected - consider better lighting and positioning");
    recommendations.push("Improve lighting on your face");
    recommendations.push("Position yourself to face the camera directly");
    confidence = 0.5;
  }

  // Enhanced body posture analysis using body parts and positioning
  const bodyAnalysis = analyzeBodyPosture(labels, objects);
  postureScore += bodyAnalysis.scoreAdjustment;
  feedback.push(...bodyAnalysis.feedback);
  recommendations.push(...bodyAnalysis.recommendations);

  // Analyze image quality and lighting
  const qualityAnalysis = analyzeImageQuality(labels, imageProperties);
  postureScore += qualityAnalysis.scoreAdjustment;
  feedback.push(...qualityAnalysis.feedback);
  recommendations.push(...qualityAnalysis.recommendations);

  // Add specific posture recommendations based on detected issues
  addSpecificPostureRecommendations(labels, objects, recommendations);

  // Determine status with stricter thresholds
  let status: "good" | "fair" | "poor";
  if (postureScore >= 80) {
    status = "good";
  } else if (postureScore >= 60) {
    status = "fair";
  } else {
    status = "poor";
  }

  // Ensure score is within bounds
  postureScore = Math.max(0, Math.min(100, Math.round(postureScore)));

  return {
    score: postureScore,
    status,
    feedback,
    recommendations,
    confidence
  };
}

function analyzeFacePosition(face: any): { scoreAdjustment: number; feedback: string[]; recommendations: string[] } {
  let scoreAdjustment = 0;
  const feedback: string[] = [];
  const recommendations: string[] = [];

  // Check face bounds and positioning
  const faceBounds = face.boundingPoly?.vertices || [];
  if (faceBounds.length >= 4) {
    const faceWidth = Math.abs(faceBounds[1].x - faceBounds[0].x);
    const faceHeight = Math.abs(faceBounds[2].y - faceBounds[0].y);
    const aspectRatio = faceWidth / faceHeight;
    
    if (aspectRatio > 0.7 && aspectRatio < 1.3) {
      scoreAdjustment += 10;
      feedback.push("Good face positioning detected");
    } else {
      feedback.push("Consider facing the camera more directly");
      recommendations.push("Position your face to be more centered and level");
    }
  }

  // Check head angles
  const rollAngle = face.rollAngle || 0;
  const panAngle = face.panAngle || 0;
  const tiltAngle = face.tiltAngle || 0;
  
  if (Math.abs(rollAngle) < 10 && Math.abs(panAngle) < 15 && Math.abs(tiltAngle) < 10) {
    scoreAdjustment += 10;
    feedback.push("Head position appears neutral and well-aligned");
  } else {
    scoreAdjustment -= 5;
    feedback.push("Slight head tilt or rotation detected");
    recommendations.push("Try to keep your head level and facing forward");
  }

  // Check for facial expressions that might indicate poor posture
  const joyLikelihood = face.joyLikelihood || 'UNLIKELY';
  const sorrowLikelihood = face.sorrowLikelihood || 'UNLIKELY';
  
  if (sorrowLikelihood === 'LIKELY' || sorrowLikelihood === 'VERY_LIKELY') {
    scoreAdjustment -= 5;
    feedback.push("Consider maintaining a more positive posture");
  }

  return { scoreAdjustment, feedback, recommendations };
}

function analyzeImageQuality(labels: any[], imageProperties: any): { scoreAdjustment: number; feedback: string[]; recommendations: string[] } {
  let scoreAdjustment = 0;
  const feedback: string[] = [];
  const recommendations: string[] = [];

  // Check for lighting-related labels
  const lightingLabels = labels.filter((label: any) => 
    label.description?.toLowerCase().includes('light') ||
    label.description?.toLowerCase().includes('bright') ||
    label.description?.toLowerCase().includes('dark') ||
    label.description?.toLowerCase().includes('shadow')
  );

  if (lightingLabels.length === 0) {
    feedback.push("Good lighting conditions detected");
    scoreAdjustment += 5;
  } else {
    const hasPoorLighting = lightingLabels.some((label: any) => 
      label.description?.toLowerCase().includes('dark') ||
      label.description?.toLowerCase().includes('shadow')
    );
    
    if (hasPoorLighting) {
      scoreAdjustment -= 5;
      feedback.push("Consider improving lighting for better analysis");
      recommendations.push("Ensure your face is well-lit from the front");
    }
  }

  // Check image properties for brightness
  if (imageProperties?.dominantColors?.colors) {
    const colors = imageProperties.dominantColors.colors;
    const avgBrightness = colors.reduce((sum: number, color: any) => {
      const rgb = color.color;
      return sum + (rgb.red + rgb.green + rgb.blue) / 3;
    }, 0) / colors.length;

    if (avgBrightness < 100) {
      scoreAdjustment -= 3;
      feedback.push("Image appears dark - better lighting would improve analysis");
    } else if (avgBrightness > 200) {
      feedback.push("Good brightness levels detected");
      scoreAdjustment += 2;
    }
  }

  return { scoreAdjustment, feedback, recommendations };
}

function analyzeBodyPosture(labels: any[], objects: any[]): { scoreAdjustment: number; feedback: string[]; recommendations: string[] } {
  let scoreAdjustment = 0;
  const feedback: string[] = [];
  const recommendations: string[] = [];

  // Enhanced body part detection for posture analysis
  const detectedBodyParts = labels.map(l => l.description.toLowerCase());
  const detectedObjects = objects.map(o => o.name.toLowerCase());

  console.log('Body posture analysis - Detected parts:', detectedBodyParts);
  console.log('Body posture analysis - Detected objects:', detectedObjects);

  // Check for slouching indicators
  const slouchingIndicators = [
    'slouched', 'bent', 'hunched', 'rounded', 'curved', 'drooped', 'sagging',
    'collapsed', 'slumped', 'stooped', 'crouched', 'leaning', 'tilted'
  ];

  const hasSlouchingIndicators = slouchingIndicators.some(indicator =>
    detectedBodyParts.some(part => part.includes(indicator))
  );

  if (hasSlouchingIndicators) {
    scoreAdjustment -= 25; // Significant penalty for slouching
    feedback.push("Slouching or poor posture detected");
    recommendations.push("Sit up straight with your back against the chair");
    recommendations.push("Keep your shoulders back and chest open");
    recommendations.push("Align your head with your spine");
  }

  // Check for good posture indicators
  const goodPostureIndicators = [
    'straight', 'upright', 'erect', 'aligned', 'balanced', 'centered',
    'neutral', 'proper', 'correct', 'good', 'healthy'
  ];

  const hasGoodPostureIndicators = goodPostureIndicators.some(indicator =>
    detectedBodyParts.some(part => part.includes(indicator))
  );

  if (hasGoodPostureIndicators) {
    scoreAdjustment += 15;
    feedback.push("Good posture indicators detected");
  }

  // Analyze specific body parts for posture clues
  const bodyPartAnalysis = analyzeSpecificBodyParts(detectedBodyParts);
  scoreAdjustment += bodyPartAnalysis.scoreAdjustment;
  feedback.push(...bodyPartAnalysis.feedback);
  recommendations.push(...bodyPartAnalysis.recommendations);

  // Check for sitting vs standing posture
  const sittingIndicators = ['sitting', 'seated', 'chair', 'couch', 'sofa', 'bed', 'laptop'];
  const standingIndicators = ['standing', 'upright', 'vertical', 'tall'];

  const isSitting = sittingIndicators.some(indicator =>
    [...detectedBodyParts, ...detectedObjects].some(item => item.includes(indicator))
  );

  const isStanding = standingIndicators.some(indicator =>
    detectedBodyParts.some(part => part.includes(indicator))
  );

  if (isSitting) {
    feedback.push("Sitting posture detected");
    recommendations.push("Keep your feet flat on the floor");
    recommendations.push("Maintain a 90-degree angle at your knees and hips");
    recommendations.push("Use lumbar support if available");
  } else if (isStanding) {
    feedback.push("Standing posture detected");
    recommendations.push("Distribute weight evenly on both feet");
    recommendations.push("Keep your knees slightly bent");
    recommendations.push("Engage your core muscles");
  }

  // Check for head and neck position
  const headNeckAnalysis = analyzeHeadNeckPosition(detectedBodyParts);
  scoreAdjustment += headNeckAnalysis.scoreAdjustment;
  feedback.push(...headNeckAnalysis.feedback);
  recommendations.push(...headNeckAnalysis.recommendations);

  return { scoreAdjustment, feedback, recommendations };
}

function analyzeSpecificBodyParts(bodyParts: string[]): { scoreAdjustment: number; feedback: string[]; recommendations: string[] } {
  let scoreAdjustment = 0;
  const feedback: string[] = [];
  const recommendations: string[] = [];

  // Shoulder analysis
  const hasShoulders = bodyParts.some(part => part.includes('shoulder'));
  if (hasShoulders) {
    feedback.push("Shoulder position detected");
    // Check for rounded shoulders (common slouching indicator)
    const roundedShoulderIndicators = ['rounded', 'forward', 'hunched', 'slouched'];
    const hasRoundedShoulders = roundedShoulderIndicators.some(indicator =>
      bodyParts.some(part => part.includes(indicator))
    );
    
    if (hasRoundedShoulders) {
      scoreAdjustment -= 15;
      feedback.push("Rounded shoulders detected - common slouching indicator");
      recommendations.push("Roll your shoulders back and down");
      recommendations.push("Strengthen your upper back muscles");
    } else {
      scoreAdjustment += 10;
      feedback.push("Good shoulder positioning detected");
    }
  }

  // Neck analysis
  const hasNeck = bodyParts.some(part => part.includes('neck'));
  if (hasNeck) {
    feedback.push("Neck position detected");
    // Check for forward head posture (tech neck)
    const forwardHeadIndicators = ['forward', 'extended', 'protruding', 'strained'];
    const hasForwardHead = forwardHeadIndicators.some(indicator =>
      bodyParts.some(part => part.includes(indicator))
    );
    
    if (hasForwardHead) {
      scoreAdjustment -= 20;
      feedback.push("Forward head posture detected - common with device use");
      recommendations.push("Keep your head aligned with your spine");
      recommendations.push("Avoid looking down at devices for extended periods");
      recommendations.push("Perform neck stretches regularly");
    } else {
      scoreAdjustment += 10;
      feedback.push("Good neck alignment detected");
    }
  }

  // Back analysis
  const hasBack = bodyParts.some(part => part.includes('back') || part.includes('spine'));
  if (hasBack) {
    feedback.push("Back position detected");
    const backIssues = ['curved', 'bent', 'rounded', 'hunched', 'slouched'];
    const hasBackIssues = backIssues.some(indicator =>
      bodyParts.some(part => part.includes(indicator))
    );
    
    if (hasBackIssues) {
      scoreAdjustment -= 20;
      feedback.push("Back alignment issues detected");
      recommendations.push("Strengthen your core muscles");
      recommendations.push("Practice good posture exercises");
      recommendations.push("Consider ergonomic adjustments");
    } else {
      scoreAdjustment += 15;
      feedback.push("Good back alignment detected");
    }
  }

  return { scoreAdjustment, feedback, recommendations };
}

function analyzeHeadNeckPosition(bodyParts: string[]): { scoreAdjustment: number; feedback: string[]; recommendations: string[] } {
  let scoreAdjustment = 0;
  const feedback: string[] = [];
  const recommendations: string[] = [];

  // Check for head position indicators
  const headPositionIndicators = ['head', 'face', 'jaw', 'chin'];
  const hasHeadIndicators = headPositionIndicators.some(indicator =>
    bodyParts.some(part => part.includes(indicator))
  );

  if (hasHeadIndicators) {
    // Check for downward head position (common in slouching)
    const downwardIndicators = ['down', 'lowered', 'dropped', 'bent'];
    const hasDownwardHead = downwardIndicators.some(indicator =>
      bodyParts.some(part => part.includes(indicator))
    );
    
    if (hasDownwardHead) {
      scoreAdjustment -= 15;
      feedback.push("Head position appears lowered - common slouching indicator");
      recommendations.push("Lift your chin and keep your head level");
      recommendations.push("Imagine a string pulling your head up from the crown");
    } else {
      scoreAdjustment += 10;
      feedback.push("Good head positioning detected");
    }
  }

  return { scoreAdjustment, feedback, recommendations };
}

function addSpecificPostureRecommendations(labels: any[], objects: any[], recommendations: string[]): void {
  const detectedLabels = labels.map(l => l.description.toLowerCase());
  const detectedObjects = objects.map(o => o.name.toLowerCase());
  const allDetected = [...detectedLabels, ...detectedObjects];

  // Check for device use (common cause of poor posture)
  const deviceIndicators = ['phone', 'laptop', 'computer', 'tablet', 'screen', 'monitor'];
  const hasDeviceUse = deviceIndicators.some(indicator =>
    allDetected.some(item => item.includes(indicator))
  );

  if (hasDeviceUse) {
    recommendations.push("Elevate your device to eye level to reduce neck strain");
    recommendations.push("Take regular breaks from device use (every 30 minutes)");
    recommendations.push("Practice the 20-20-20 rule: look 20 feet away for 20 seconds every 20 minutes");
  }

  // Check for sitting environment
  const sittingEnvironment = ['chair', 'couch', 'sofa', 'bed', 'desk'];
  const hasSittingEnvironment = sittingEnvironment.some(indicator =>
    allDetected.some(item => item.includes(indicator))
  );

  if (hasSittingEnvironment) {
    recommendations.push("Ensure your chair provides proper lumbar support");
    recommendations.push("Keep your feet flat on the floor or use a footrest");
    recommendations.push("Position your screen at arm's length and eye level");
  }

  // Add general posture improvement tips
  recommendations.push("Practice mindful posture checks throughout the day");
  recommendations.push("Strengthen your core and back muscles with regular exercise");
  recommendations.push("Consider using posture reminder apps or devices");
} 