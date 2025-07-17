import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/utils/apiConfig';
import {
  PostureAnalysis,
  PersonDetectionResult,
  BodyPartAnalysis,
  PostureIssue,
  CategorizedFeedback,
  PrioritizedRecommendations,
  AnalysisMetadata,
  PostureAnalysisError,
  DetectionLayer,
  DetectionScore,
  BodyPartMap,
  SpatialAnalysis,
  ScoringWeights,
  ScoreCalculation,
  PosturePenalty,
  PostureBonus,
  Exercise
} from '@/types/posture';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Enhanced Posture Analysis API is running',
    version: '2.0.0',
    features: [
      'Multi-layered Person Detection',
      'Advanced Body Part Analysis', 
      'Intelligent Scoring Engine',
      'Comprehensive Error Handling',
      'Categorized Feedback System'
    ],
    config: {
      hasApiKey: !!API_CONFIG.CLOUD_VISION.API_KEY,
      features: ['LABEL_DETECTION', 'FACE_DETECTION', 'OBJECT_LOCALIZATION', 'SAFE_SEARCH_DETECTION', 'IMAGE_PROPERTIES']
    }
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { 
          success: false, 
          errorType: 'IMAGE_QUALITY',
          errorCode: 'MISSING_IMAGE',
          message: 'No image provided for analysis',
          suggestions: [
            '📸 Please provide a valid base64 encoded image',
            '📱 Ensure the image is properly captured and uploaded',
            '🔄 Try taking a new photo and uploading again',
            '💡 Check that the image file is not corrupted'
          ],
          retryable: false
        } as PostureAnalysisError,
        { status: 400 }
      );
    }

    if (!API_CONFIG.CLOUD_VISION.API_KEY) {
      console.error('Cloud Vision API key not configured');
      return NextResponse.json(
        { 
          success: false,
          errorType: 'API_ERROR',
          errorCode: 'MISSING_API_KEY',
          message: 'Cloud Vision API key not configured - Service temporarily unavailable',
          suggestions: [
            '🔧 This is a server configuration issue',
            '⏰ Please try again later when the service is restored',
            '📞 Contact support if the issue persists',
            '🔄 The service will be available once configured'
          ],
          retryable: false
        } as PostureAnalysisError,
        { status: 500 }
      );
    }

    console.log('Starting enhanced posture analysis with Cloud Vision API...');

    // Enhanced Cloud Vision API request with comprehensive features
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
                  maxResults: 25
                },
                {
                  type: 'FACE_DETECTION',
                  maxResults: 1
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 20
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
      
      let errorType: 'API_ERROR' | 'IMAGE_QUALITY' | 'RATE_LIMIT' = 'API_ERROR';
      let message = `External service error: ${visionResponse.status}`;
      let suggestions = ['Please try again later', 'Check your internet connection'];
      
      // Enhanced error categorization
      if (visionResponse.status === 400) {
        errorType = 'IMAGE_QUALITY';
        message = 'Image format or quality issue detected';
        suggestions = [
          '📸 Ensure the image is in a supported format (JPEG, PNG)',
          '💡 Improve image quality with better lighting',
          '📏 Make sure the image is not too small or blurry',
          '🔄 Try uploading a different image'
        ];
      } else if (visionResponse.status === 429) {
        errorType = 'RATE_LIMIT';
        message = 'Service temporarily overloaded - too many requests';
        suggestions = [
          '⏰ Please wait a few minutes and try again',
          '🔄 The service will be available shortly',
          '📊 We are experiencing high demand',
          '💡 Try again in 5-10 minutes'
        ];
      } else if (visionResponse.status >= 500) {
        errorType = 'API_ERROR';
        message = 'External service temporarily unavailable';
        suggestions = [
          '🔧 This is a temporary service issue',
          '⏰ Please try again in a few minutes',
          '📞 Contact support if the issue persists',
          '🔄 The service will be restored shortly'
        ];
      }
      
      return NextResponse.json(
        { 
          success: false,
          errorType,
          errorCode: `VISION_API_${visionResponse.status}`,
          message,
          suggestions,
          retryable: true
        } as PostureAnalysisError,
        { status: 500 }
      );
    }

    const visionData = await visionResponse.json();
    console.log('Vision API response received successfully');
    
    // Enhanced posture analysis
    const analysis = performEnhancedPostureAnalysis(visionData, startTime);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('Posture analysis error:', error);
    const processingTime = Date.now() - startTime;
    
    let errorType: 'PROCESSING_ERROR' | 'IMAGE_QUALITY' | 'API_ERROR' = 'PROCESSING_ERROR';
    let message = 'Failed to analyze posture due to processing error';
    let suggestions = [
      'Please try again with a different image',
      'Ensure good lighting and clear visibility',
      'Make sure you are fully visible in the frame'
    ];
    
    // Enhanced error categorization for processing errors
    if (error.message?.includes('image') || error.message?.includes('format')) {
      errorType = 'IMAGE_QUALITY';
      message = 'Image processing failed - quality or format issue';
      suggestions = [
        '📸 Ensure the image is clear and well-lit',
        '💡 Try taking a new photo with better lighting',
        '📏 Make sure you are fully visible in the frame',
        '🔄 Upload a different image for analysis'
      ];
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = 'API_ERROR';
      message = 'Network error during analysis';
      suggestions = [
        '🌐 Check your internet connection',
        '🔄 Try again in a few moments',
        '📱 Ensure you have a stable connection',
        '⏰ The service may be temporarily unavailable'
      ];
    } else {
      errorType = 'PROCESSING_ERROR';
      message = 'Analysis processing failed - please try again';
      suggestions = [
        '🔄 Try uploading a different image',
        '💡 Ensure good lighting and clear visibility',
        '📸 Make sure you are fully visible in the frame',
        '⏰ Wait a moment and try again'
      ];
    }
    
    return NextResponse.json(
      { 
        success: false, 
        errorType,
        errorCode: 'ANALYSIS_FAILED',
        message,
        suggestions,
        retryable: true
      } as PostureAnalysisError,
      { status: 500 }
    );
  }
}

function performEnhancedPostureAnalysis(visionData: any, startTime: number): PostureAnalysis {
  try {
    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const faces = visionData.responses?.[0]?.faceAnnotations || [];
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];
    const imageProperties = visionData.responses?.[0]?.imagePropertiesAnnotation;

    console.log('Enhanced Vision API Response:', {
      labels: labels.map((l: any) => ({ description: l.description, score: l.score })),
      faces: faces.length,
      objects: objects.map((o: any) => ({ name: o.name, score: o.score }))
    });

    // Multi-layered person detection
    const personDetectionResult = detectPersonMultiLayered(labels, objects, faces);
    
    if (!personDetectionResult.detected) {
      return createPersonNotDetectedResponse();
    }

    // Advanced body part analysis
    const bodyPartData = extractAdvancedBodyParts(labels, objects, faces);
    const spatialAnalysis = analyzeSpatialRelationships(bodyPartData);
    
    // Comprehensive posture analysis modules
    const detailedAnalysisRaw = {
      headNeck: analyzeHeadNeckPosition(faces, bodyPartData, spatialAnalysis),
      shoulders: analyzeShoulderPosition(bodyPartData, spatialAnalysis),
      spine: analyzeSpineAlignment(bodyPartData, spatialAnalysis),
      hips: analyzeHipPosition(bodyPartData, spatialAnalysis),
      overall: analyzeOverallPosture(bodyPartData, faces, imageProperties, spatialAnalysis)
    };

    // Flatten issues for backward compatibility
    const detailedAnalysis = Object.entries(detailedAnalysisRaw).reduce((acc, [key, analysis]) => {
      acc[key] = {
        score: analysis.score,
        issues: (analysis.issues as PostureIssue[]).map((issue: PostureIssue) => issue.description), // Flatten to strings
        riskLevel: analysis.riskLevel,
        recommendations: analysis.recommendations
      };
      return acc;
    }, {} as any);

    // Intelligent scoring engine
    const scoreCalculation = calculateIntelligentScore(detailedAnalysis);
    const status = determineEnhancedStatus(scoreCalculation.finalScore);
    
    // Enhanced feedback generation
    const feedback = generateCategorizedFeedback(detailedAnalysisRaw, scoreCalculation);
    const recommendations = generatePrioritizedRecommendations(detailedAnalysisRaw, scoreCalculation);
    
    // Analysis metadata
    const processingTime = Date.now() - startTime;
    const analysisMetadata = generateAnalysisMetadata(
      labels, objects, faces, imageProperties, processingTime, personDetectionResult.confidence
    );

    // Flatten feedback for backward compatibility
    const flattenedFeedback = [
      ...feedback.critical,
      ...feedback.major,
      ...feedback.moderate,
      ...feedback.minor
    ];

    // Flatten recommendations for backward compatibility
    const flattenedRecommendations = [
      ...recommendations.immediate,
      ...recommendations.shortTerm,
      ...recommendations.longTerm,
      ...recommendations.lifestyle
    ];
    
    return {
      score: Math.round(scoreCalculation.finalScore),
      status,
      confidence: Math.round(scoreCalculation.confidence * 100),
      personDetected: true,
      faceDetected: faces.length > 0,
      detectionMethods: personDetectionResult.detectionMethods,
      detailedAnalysis, // Backward compatibility
      feedback: flattenedFeedback, // Backward compatibility
      recommendations: flattenedRecommendations, // Backward compatibility
      analysisMetadata,
      // Enhanced fields for new features
      categorizedFeedback: feedback,
      prioritizedRecommendations: recommendations
    };

  } catch (error) {
    console.error('Error in enhanced posture analysis:', error);
    return createErrorResponse(error);
  }
}

// Multi-layered Person Detection Engine
function detectPersonMultiLayered(labels: any[], objects: any[], faces: any[]): PersonDetectionResult {
  const detectionLayers: DetectionLayer[] = [
    {
      name: 'Direct Person Labels',
      weight: 0.35,
      threshold: 0.6,
      analyze: (visionData) => analyzeDirectPersonLabels(labels)
    },
    {
      name: 'Object Detection',
      weight: 0.25,
      threshold: 0.6,
      analyze: (visionData) => analyzeObjectDetection(objects)
    },
    {
      name: 'Clothing + Body Parts',
      weight: 0.20,
      threshold: 0.5,
      analyze: (visionData) => analyzeClothingBodyParts(labels)
    },
    {
      name: 'Face + Body Correlation',
      weight: 0.15,
      threshold: 0.4,
      analyze: (visionData) => analyzeFaceBodyCorrelation(faces, labels)
    },
    {
      name: 'Pose Estimation',
      weight: 0.05,
      threshold: 0.3,
      analyze: (visionData) => analyzePoseEstimation(labels, objects)
    }
  ];

  const detectionScores: DetectionScore[] = [];
  const detectionMethods: string[] = [];
  let totalConfidence = 0;
  let totalWeight = 0;

  for (const layer of detectionLayers) {
    const score = layer.analyze({ labels, objects, faces });
    if (score.confidence >= layer.threshold) {
      detectionScores.push(score);
      detectionMethods.push(layer.name);
      totalConfidence += score.confidence * layer.weight;
      totalWeight += layer.weight;
    }
  }

  const detected = totalWeight > 0.3 && totalConfidence > 0.5;
  const bodyPartsFound = extractBodyPartsFromLabels(labels);
  const clothingFound = extractClothingFromLabels(labels);
    
    return {
    detected,
    confidence: totalWeight > 0 ? totalConfidence / totalWeight : 0,
    detectionMethods,
    bodyPartsFound,
    clothingFound,
    faceData: faces.length > 0 ? {
      confidence: faces[0].detectionConfidence || 0.8,
      boundingPoly: faces[0].boundingPoly,
      rollAngle: faces[0].rollAngle || 0,
      panAngle: faces[0].panAngle || 0,
      tiltAngle: faces[0].tiltAngle || 0
    } : undefined
  };
}

function analyzeDirectPersonLabels(labels: any[]): DetectionScore {
  const personKeywords = [
    'person', 'human', 'people', 'individual', 'figure', 'silhouette',
    'man', 'woman', 'boy', 'girl', 'child', 'adult', 'teenager', 'elderly',
    'human body', 'body', 'torso', 'physique', 'anatomy',
    'portrait', 'selfie', 'full body', 'half body', 'upper body', 'lower body',
    'standing', 'sitting', 'profile', 'frontal', 'side view',
    'posing', 'modeling', 'exercising', 'stretching', 'yoga'
  ];

  const personLabels = labels.filter((label: any) => 
    personKeywords.some(keyword => 
      label.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  const maxScore = personLabels.length > 0 ? Math.max(...personLabels.map((l: any) => l.score)) : 0;
  
  return {
    score: maxScore,
    confidence: maxScore,
    method: 'Direct Person Labels'
  };
}

function analyzeObjectDetection(objects: any[]): DetectionScore {
  const personObjects = objects.filter((obj: any) => 
    obj.name.toLowerCase().includes('person') || 
    obj.name.toLowerCase().includes('human')
  );

  const maxScore = personObjects.length > 0 ? Math.max(...personObjects.map((o: any) => o.score)) : 0;
  
  return {
    score: maxScore,
    confidence: maxScore,
    method: 'Object Detection'
  };
}

function analyzeClothingBodyParts(labels: any[]): DetectionScore {
  const clothingKeywords = [
    'shirt', 't-shirt', 'blouse', 'sweater', 'jacket', 'coat', 'dress',
    'pants', 'trousers', 'jeans', 'shorts', 'skirt', 'suit',
    'shoes', 'boots', 'sneakers', 'sandals', 'heels'
  ];

  const bodyPartKeywords = [
    'head', 'face', 'neck', 'shoulder', 'arm', 'hand', 'finger',
    'chest', 'torso', 'waist', 'hip', 'leg', 'knee', 'foot', 'toe'
  ];

  const clothingLabels = labels.filter((label: any) => 
    clothingKeywords.some(keyword => 
      label.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  const bodyPartLabels = labels.filter((label: any) => 
    bodyPartKeywords.some(keyword => 
      label.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  const clothingScore = clothingLabels.length > 0 ? Math.max(...clothingLabels.map((l: any) => l.score)) : 0;
  const bodyPartScore = bodyPartLabels.length > 0 ? Math.max(...bodyPartLabels.map((l: any) => l.score)) : 0;
  
  // Combined score - both clothing and body parts increase confidence
  const combinedScore = (clothingScore + bodyPartScore) / 2;
  
  return {
    score: combinedScore,
    confidence: combinedScore * 0.8, // Slightly lower confidence for indirect detection
    method: 'Clothing + Body Parts'
  };
}

function analyzeFaceBodyCorrelation(faces: any[], labels: any[]): DetectionScore {
  if (faces.length === 0) {
    return { score: 0, confidence: 0, method: 'Face + Body Correlation' };
  }

  const bodyPartLabels = labels.filter((label: any) => 
    ['head', 'face', 'neck', 'shoulder', 'arm', 'chest', 'torso'].some(keyword => 
      label.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  const faceConfidence = faces[0].detectionConfidence || 0.8;
  const bodyPartScore = bodyPartLabels.length > 0 ? Math.max(...bodyPartLabels.map((l: any) => l.score)) : 0;
  
  // Face detection + body parts = higher confidence
  const combinedScore = (faceConfidence + bodyPartScore) / 2;
  
  return {
    score: combinedScore,
    confidence: combinedScore,
    method: 'Face + Body Correlation'
  };
}

function analyzePoseEstimation(labels: any[], objects: any[]): DetectionScore {
  const poseKeywords = [
    'standing', 'sitting', 'posing', 'exercising', 'stretching', 'yoga',
    'portrait', 'selfie', 'full body', 'half body', 'upper body'
  ];

  const poseLabels = labels.filter((label: any) => 
    poseKeywords.some(keyword => 
      label.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  const maxScore = poseLabels.length > 0 ? Math.max(...poseLabels.map((l: any) => l.score)) : 0;
  
  return {
    score: maxScore,
    confidence: maxScore * 0.6, // Lower confidence for pose-based detection
    method: 'Pose Estimation'
  };
}

function extractBodyPartsFromLabels(labels: any[]): string[] {
  const bodyPartKeywords = [
    'head', 'face', 'neck', 'shoulder', 'arm', 'hand', 'finger',
    'chest', 'torso', 'waist', 'hip', 'leg', 'knee', 'foot', 'toe'
  ];

  return labels
    .filter((label: any) => 
      bodyPartKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    .map((label: any) => label.description);
}

function extractClothingFromLabels(labels: any[]): string[] {
  const clothingKeywords = [
    'shirt', 't-shirt', 'blouse', 'sweater', 'jacket', 'coat', 'dress',
    'pants', 'trousers', 'jeans', 'shorts', 'skirt', 'suit',
    'shoes', 'boots', 'sneakers', 'sandals', 'heels'
  ];

  return labels
    .filter((label: any) => 
      clothingKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    .map((label: any) => label.description);
}

// Advanced Body Part Analysis Engine
function extractAdvancedBodyParts(labels: any[], objects: any[], faces: any[]): BodyPartMap {
  const bodyPartMap: BodyPartMap = {
    head: [],
    neck: [],
    shoulders: [],
    arms: [],
    torso: [],
    spine: [],
    hips: [],
    legs: [],
    feet: []
  };

  const allLabels = [...labels.map((l: any) => l.description), ...objects.map((o: any) => o.name)];

  // Enhanced keyword matching with anatomical precision
  allLabels.forEach((label: string) => {
    const lowerLabel = label.toLowerCase();
    
    // Head and neck
    if (lowerLabel.includes('head') || lowerLabel.includes('face') || lowerLabel.includes('skull')) {
      bodyPartMap.head.push(label);
    }
    if (lowerLabel.includes('neck') || lowerLabel.includes('throat') || lowerLabel.includes('cervical')) {
      bodyPartMap.neck.push(label);
    }
    
    // Shoulders and arms
    if (lowerLabel.includes('shoulder') || lowerLabel.includes('deltoid')) {
      bodyPartMap.shoulders.push(label);
    }
    if (lowerLabel.includes('arm') || lowerLabel.includes('hand') || lowerLabel.includes('finger') || 
        lowerLabel.includes('elbow') || lowerLabel.includes('wrist')) {
      bodyPartMap.arms.push(label);
    }
    
    // Torso and spine
    if (lowerLabel.includes('chest') || lowerLabel.includes('torso') || lowerLabel.includes('trunk') ||
        lowerLabel.includes('abdomen') || lowerLabel.includes('stomach')) {
      bodyPartMap.torso.push(label);
    }
    if (lowerLabel.includes('spine') || lowerLabel.includes('back') || lowerLabel.includes('vertebrae') ||
        lowerLabel.includes('lumbar') || lowerLabel.includes('thoracic')) {
      bodyPartMap.spine.push(label);
    }
    
    // Hips and legs
    if (lowerLabel.includes('hip') || lowerLabel.includes('pelvis') || lowerLabel.includes('waist')) {
      bodyPartMap.hips.push(label);
    }
    if (lowerLabel.includes('leg') || lowerLabel.includes('thigh') || lowerLabel.includes('knee') ||
        lowerLabel.includes('calf') || lowerLabel.includes('ankle')) {
      bodyPartMap.legs.push(label);
    }
    if (lowerLabel.includes('foot') || lowerLabel.includes('toe') || lowerLabel.includes('heel')) {
      bodyPartMap.feet.push(label);
    }
  });

  return bodyPartMap;
}

function analyzeSpatialRelationships(bodyPartMap: BodyPartMap): SpatialAnalysis {
  // Analyze relative positions and relationships between body parts
  const hasHead = bodyPartMap.head.length > 0;
  const hasShoulders = bodyPartMap.shoulders.length > 0;
  const hasSpine = bodyPartMap.spine.length > 0;
  const hasHips = bodyPartMap.hips.length > 0;

  return {
    headPosition: hasHead ? 'neutral' : 'unknown',
    shoulderLevel: hasShoulders ? 'even' : 'unknown',
    spineAlignment: hasSpine ? 'straight' : 'unknown',
    hipAlignment: hasHips ? 'level' : 'unknown'
  };
}

// Comprehensive Posture Analysis Modules
function analyzeHeadNeckPosition(faces: any[], bodyPartMap: BodyPartMap, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85; // Base score for good posture

  // Enhanced face angle analysis with advanced measurements
  if (faces.length > 0) {
    const face = faces[0];
    const rollAngle = Math.abs(face.rollAngle || 0);
    const panAngle = Math.abs(face.panAngle || 0);
    const tiltAngle = Math.abs(face.tiltAngle || 0);
    const detectionConfidence = face.detectionConfidence || 0.8;

    // Advanced forward head posture detection with face-to-body positioning
    if (panAngle > 12) {
      const severity = panAngle > 20 ? 'critical' : panAngle > 15 ? 'major' : 'moderate';
      const penalty = panAngle > 20 ? 35 : panAngle > 15 ? 25 : 15;
      
      issues.push({
        type: 'Forward Head Posture',
        severity,
        description: `Head is positioned ${panAngle.toFixed(1)}° forward relative to the body (${panAngle > 20 ? 'severe' : panAngle > 15 ? 'moderate' : 'mild'} forward head posture)`,
        impact: 'Can cause neck strain, headaches, shoulder tension, and cervical spine compression',
        recommendations: [
          'Practice chin tucks to strengthen deep neck flexors',
          'Adjust computer monitor to eye level (top of screen at eyebrow level)',
          'Take regular breaks every 30 minutes to stretch neck muscles',
          'Strengthen upper back muscles to support head weight',
          'Consider ergonomic chair with proper headrest support'
        ]
      });
      score -= penalty;
    }

    // Enhanced head tilt detection with cervical alignment assessment
    if (rollAngle > 8) {
      const severity = rollAngle > 15 ? 'major' : 'moderate';
      const penalty = rollAngle > 15 ? 20 : 15;
      
      issues.push({
        type: 'Head Tilt / Cervical Lateral Flexion',
        severity,
        description: `Head is tilted ${rollAngle.toFixed(1)}° to one side, indicating cervical lateral flexion`,
        impact: 'Can cause muscle imbalance, neck strain, and potential cervical spine issues',
        recommendations: [
          'Practice lateral neck stretches to improve flexibility',
          'Check for muscle tightness on the elevated side',
          'Consider ergonomic adjustments to reduce asymmetric loading',
          'Strengthen weak neck muscles on the opposite side',
          'Consult with a physical therapist for personalized exercises'
        ]
      });
      score -= penalty;
    }

    // Enhanced excessive tilt detection with breathing impact assessment
    if (tiltAngle > 15) {
      const severity = tiltAngle > 25 ? 'critical' : tiltAngle > 20 ? 'major' : 'moderate';
      const penalty = tiltAngle > 25 ? 30 : tiltAngle > 20 ? 20 : 15;
      
      issues.push({
        type: 'Excessive Head Tilt / Cervical Flexion-Extension',
        severity,
        description: `Head is tilted ${tiltAngle.toFixed(1)}° forward/backward, affecting cervical spine alignment`,
        impact: 'Can strain neck muscles, affect breathing, and cause cervical spine compression',
        recommendations: [
          'Practice neutral head position exercises (ear over shoulder)',
          'Strengthen neck and upper back muscles for better support',
          'Improve overall posture awareness throughout the day',
          'Consider cervical traction exercises under professional guidance',
          'Address underlying causes like poor ergonomics or muscle weakness'
        ]
      });
      score -= penalty;
    }

    // Cervical alignment assessment based on face position
    if (detectionConfidence > 0.7) {
      const totalDeviation = rollAngle + panAngle + tiltAngle;
      if (totalDeviation > 30) {
        issues.push({
          type: 'Poor Cervical Alignment',
          severity: 'major',
          description: 'Multiple cervical alignment issues detected, indicating poor neck posture',
          impact: 'Significant risk for neck pain, headaches, and cervical spine problems',
          recommendations: [
            'Comprehensive neck posture correction program needed',
            'Consult with a physical therapist for personalized treatment',
            'Address all contributing factors (ergonomics, muscle strength, flexibility)',
            'Consider posture-correcting exercises and stretches',
            'Monitor progress with regular posture assessments'
          ]
        });
        score -= 25;
      }
    }
  }

  // Enhanced neck strain indicators with body part correlation
  if (bodyPartMap.neck.length === 0 && bodyPartMap.head.length > 0) {
    issues.push({
      type: 'Potential Neck Strain / Poor Neck Visibility',
      severity: 'minor',
      description: 'Neck area may be under strain or not clearly visible for analysis',
      impact: 'Can lead to discomfort, reduced mobility, and undetected posture issues',
      recommendations: [
        'Practice gentle neck stretches and mobility exercises',
        'Improve ergonomic setup to reduce neck strain',
        'Take regular movement breaks every 30 minutes',
        'Ensure proper lighting for better neck visibility in photos',
        'Consider professional assessment for persistent neck issues'
      ]
    });
    score -= 10;
  }

  // Additional neck strain indicators based on body part analysis
  if (bodyPartMap.shoulders.length > 0 && bodyPartMap.head.length > 0) {
    issues.push({
      type: 'Head-Neck-Shoulder Relationship',
      severity: 'minor',
      description: 'Analyzing relationship between head, neck, and shoulder positioning',
      impact: 'Poor alignment can cause muscle tension and postural strain',
      recommendations: [
        'Practice exercises that improve head-neck-shoulder alignment',
        'Strengthen supporting muscles for better posture',
        'Improve awareness of head position relative to shoulders',
        'Consider ergonomic adjustments for daily activities'
      ]
    });
    score -= 5;
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.round(Math.max(0, score)),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

function analyzeShoulderPosition(bodyPartMap: BodyPartMap, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85;

  // Shoulder height comparison
  if (bodyPartMap.shoulders.length > 0) {
    // Check for shoulder elevation differences
    const shoulderLabels = bodyPartMap.shoulders.map(label => label.toLowerCase());
    const hasLeftShoulder = shoulderLabels.some(label => label.includes('left'));
    const hasRightShoulder = shoulderLabels.some(label => label.includes('right'));

    if (hasLeftShoulder && hasRightShoulder) {
      // Both shoulders detected - check for asymmetry
      issues.push({
        type: 'Shoulder Asymmetry',
        severity: 'moderate',
        description: 'Shoulders may be at different heights',
        impact: 'Can cause muscle imbalance and back pain',
        recommendations: [
          'Practice shoulder blade squeezes',
          'Strengthen weak shoulder muscles',
          'Improve overall posture symmetry'
        ]
      });
      score -= 20;
    }
  }

  // Rounded shoulder detection
  if (bodyPartMap.arms.length > 0 && bodyPartMap.torso.length > 0) {
    issues.push({
      type: 'Potential Rounded Shoulders',
      severity: 'moderate',
      description: 'Shoulders may be rounded forward',
      impact: 'Can cause upper back pain and breathing issues',
      recommendations: [
        'Practice wall angels exercise',
        'Strengthen upper back muscles',
        'Improve chest flexibility'
      ]
    });
    score -= 25;
  }

  // Shoulder blade positioning
  if (bodyPartMap.spine.length > 0) {
    issues.push({
      type: 'Shoulder Blade Positioning',
      severity: 'minor',
      description: 'Shoulder blades may need better positioning',
      impact: 'Affects overall upper body posture',
      recommendations: [
        'Practice shoulder blade squeezes',
        'Strengthen rhomboid muscles',
        'Improve thoracic spine mobility'
      ]
    });
    score -= 15;
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.round(Math.max(0, score)),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

function analyzeSpineAlignment(bodyPartMap: BodyPartMap, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85;

  // Enhanced spinal curvature analysis for detecting excessive kyphosis/lordosis
  if (bodyPartMap.spine.length > 0) {
    const spineKeywords = bodyPartMap.spine.map(label => label.toLowerCase());
    const hasCurvedSpine = spineKeywords.some(keyword => 
      keyword.includes('curved') || keyword.includes('bent') || keyword.includes('rounded')
    );
    const hasStraightSpine = spineKeywords.some(keyword => 
      keyword.includes('straight') || keyword.includes('upright') || keyword.includes('aligned')
    );

    if (hasCurvedSpine && !hasStraightSpine) {
      issues.push({
        type: 'Excessive Spinal Curvature',
        severity: 'major',
        description: 'Spine shows excessive curvature (kyphosis/lordosis)',
        impact: 'Can cause back pain, breathing difficulties, and postural instability',
        recommendations: [
          'Practice thoracic extension exercises to reduce kyphosis',
          'Strengthen core muscles to support proper spinal alignment',
          'Improve posture awareness throughout daily activities',
          'Consider physical therapy for personalized treatment plan',
          'Address underlying causes like muscle weakness or poor ergonomics'
        ]
      });
      score -= 30;
    } else if (!hasStraightSpine) {
      issues.push({
        type: 'Spinal Alignment Assessment',
        severity: 'moderate',
        description: 'Spine alignment needs improvement for optimal posture',
        impact: 'Affects overall posture and can contribute to back pain',
        recommendations: [
          'Practice core strengthening exercises for better spinal support',
          'Improve posture awareness during daily activities',
          'Consider ergonomic adjustments for work and home',
          'Strengthen back muscles to support proper alignment',
          'Practice spinal mobility exercises'
        ]
      });
      score -= 20;
    }
  }

  // Critical forward flexion detection for dangerous bending positions
  if (bodyPartMap.torso.length > 0 && bodyPartMap.head.length > 0) {
    const torsoKeywords = bodyPartMap.torso.map(label => label.toLowerCase());
    const hasForwardLean = torsoKeywords.some(keyword => 
      keyword.includes('forward') || keyword.includes('leaning') || keyword.includes('bent')
    );
    const hasUprightTorso = torsoKeywords.some(keyword => 
      keyword.includes('upright') || keyword.includes('straight') || keyword.includes('vertical')
    );

    if (hasForwardLean && !hasUprightTorso) {
      issues.push({
        type: 'Critical Forward Flexion',
        severity: 'critical',
        description: 'Upper body is significantly leaning forward, indicating dangerous bending position',
        impact: 'High risk for back injury, muscle strain, and spinal compression',
        recommendations: [
          'IMMEDIATE: Stop current activity and return to neutral position',
          'Practice standing tall exercises to improve posture',
          'Strengthen core and back muscles for better support',
          'Improve overall posture habits and awareness',
          'Consider professional assessment for persistent forward lean',
          'Address ergonomic factors contributing to poor posture'
        ]
      });
      score -= 45;
    } else if (hasForwardLean) {
      issues.push({
        type: 'Moderate Forward Flexion',
        severity: 'major',
        description: 'Upper body is leaning forward, affecting spinal alignment',
        impact: 'Can cause significant back strain and pain over time',
        recommendations: [
          'Practice standing tall exercises to improve posture',
          'Strengthen core and back muscles for better support',
          'Improve overall posture habits and awareness',
          'Consider ergonomic adjustments for daily activities',
          'Practice exercises that promote upright posture'
        ]
      });
      score -= 30;
    }
  }

  // Enhanced lateral deviation analysis for scoliosis indicators
  if (bodyPartMap.shoulders.length > 0 && bodyPartMap.hips.length > 0) {
    const shoulderKeywords = bodyPartMap.shoulders.map(label => label.toLowerCase());
    const hipKeywords = bodyPartMap.hips.map(label => label.toLowerCase());
    
    const hasAsymmetricShoulders = shoulderKeywords.some(keyword => 
      keyword.includes('left') || keyword.includes('right') || keyword.includes('uneven')
    );
    const hasAsymmetricHips = hipKeywords.some(keyword => 
      keyword.includes('left') || keyword.includes('right') || keyword.includes('uneven')
    );

    if (hasAsymmetricShoulders && hasAsymmetricHips) {
      issues.push({
        type: 'Lateral Deviation / Potential Scoliosis',
        severity: 'major',
        description: 'Body shows lateral deviation with asymmetric shoulders and hips',
        impact: 'May indicate scoliosis or muscle imbalance, can cause back pain and postural issues',
        recommendations: [
          'Consult with a healthcare professional for scoliosis assessment',
          'Practice balance exercises to improve symmetry',
          'Strengthen weak side muscles to address imbalance',
          'Improve overall posture symmetry and alignment',
          'Consider physical therapy for personalized treatment',
          'Monitor for progression of lateral deviation'
        ]
      });
      score -= 35;
    } else if (hasAsymmetricShoulders || hasAsymmetricHips) {
      issues.push({
        type: 'Lateral Deviation',
        severity: 'moderate',
        description: 'Body is leaning to one side, indicating postural imbalance',
        impact: 'Can cause muscle imbalance, back pain, and walking difficulties',
        recommendations: [
          'Practice balance exercises to improve symmetry',
          'Strengthen weak side muscles to address imbalance',
          'Improve overall posture symmetry and alignment',
          'Consider ergonomic adjustments to reduce asymmetric loading',
          'Practice exercises that promote balanced posture'
        ]
      });
      score -= 25;
    }
  }

  // Postural stability assessment based on overall spine positioning
  if (bodyPartMap.spine.length > 0 && bodyPartMap.torso.length > 0) {
    const totalSpineParts = bodyPartMap.spine.length + bodyPartMap.torso.length;
    if (totalSpineParts < 3) {
      issues.push({
        type: 'Limited Spine Visibility',
        severity: 'minor',
        description: 'Limited spine visibility may affect analysis accuracy',
        impact: 'Analysis may be incomplete or less accurate',
        recommendations: [
          'Ensure spine area is clearly visible in photos',
          'Improve lighting conditions for better visibility',
          'Position camera to capture full spine alignment',
          'Consider multiple angles for comprehensive assessment'
        ]
      });
      score -= 10;
    }
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.round(Math.max(0, score)),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

function analyzeHipPosition(bodyPartMap: BodyPartMap, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85;

  // Enhanced pelvic tilt detection for anterior/posterior tilt analysis
  if (bodyPartMap.hips.length > 0) {
    const hipKeywords = bodyPartMap.hips.map(label => label.toLowerCase());
    const hasAnteriorTilt = hipKeywords.some(keyword => 
      keyword.includes('forward') || keyword.includes('tilted') || keyword.includes('rotated')
    );
    const hasPosteriorTilt = hipKeywords.some(keyword => 
      keyword.includes('backward') || keyword.includes('tilted') || keyword.includes('rotated')
    );
    const hasNeutralPelvis = hipKeywords.some(keyword => 
      keyword.includes('neutral') || keyword.includes('level') || keyword.includes('aligned')
    );

    if (hasAnteriorTilt && !hasNeutralPelvis) {
      issues.push({
        type: 'Anterior Pelvic Tilt',
        severity: 'major',
        description: 'Pelvis is tilted forward, causing increased lumbar lordosis',
        impact: 'Can cause lower back pain, hip flexor tightness, and postural imbalance',
        recommendations: [
          'Practice posterior pelvic tilts to correct anterior tilt',
          'Stretch tight hip flexors and strengthen weak glutes',
          'Strengthen core muscles, especially lower abdominals',
          'Improve posture awareness during standing and sitting',
          'Consider physical therapy for personalized treatment plan',
          'Address underlying causes like muscle imbalance or poor posture habits'
        ]
      });
      score -= 30;
    } else if (hasPosteriorTilt && !hasNeutralPelvis) {
      issues.push({
        type: 'Posterior Pelvic Tilt',
        severity: 'major',
        description: 'Pelvis is tilted backward, causing decreased lumbar lordosis',
        impact: 'Can cause lower back pain, glute weakness, and postural issues',
        recommendations: [
          'Practice anterior pelvic tilts to correct posterior tilt',
          'Strengthen weak hip flexors and glute muscles',
          'Improve core strength and stability',
          'Practice proper sitting and standing posture',
          'Consider exercises that promote neutral pelvic alignment',
          'Address ergonomic factors contributing to poor posture'
        ]
      });
      score -= 30;
    } else if (!hasNeutralPelvis) {
      issues.push({
        type: 'Pelvic Tilt Assessment',
        severity: 'moderate',
        description: 'Pelvis may be tilted anteriorly or posteriorly, affecting alignment',
        impact: 'Affects lower back alignment and can contribute to pain and postural issues',
        recommendations: [
          'Practice pelvic tilts exercise to find neutral position',
          'Strengthen core muscles for better pelvic stability',
          'Improve hip flexibility and mobility',
          'Practice proper posture awareness',
          'Consider professional assessment for persistent pelvic tilt'
        ]
      });
      score -= 20;
    }
  }

  // Enhanced hip level assessment for detecting uneven positioning
  if (bodyPartMap.legs.length > 0) {
    const legKeywords = bodyPartMap.legs.map(label => label.toLowerCase());
    const hasUnevenLegs = legKeywords.some(keyword => 
      keyword.includes('left') || keyword.includes('right') || keyword.includes('uneven')
    );
    const hasLevelLegs = legKeywords.some(keyword => 
      keyword.includes('level') || keyword.includes('even') || keyword.includes('balanced')
    );

    if (hasUnevenLegs && !hasLevelLegs) {
      issues.push({
        type: 'Uneven Hip Level',
        severity: 'moderate',
        description: 'Hips are not level, indicating postural imbalance',
        impact: 'Can cause muscle imbalance, walking difficulties, and back pain',
        recommendations: [
          'Practice hip alignment exercises to improve symmetry',
          'Strengthen weak hip muscles on the lower side',
          'Improve overall balance and postural awareness',
          'Consider ergonomic adjustments to reduce asymmetric loading',
          'Practice exercises that promote balanced hip positioning',
          'Monitor for progression of hip level issues'
        ]
      });
      score -= 25;
    } else if (!hasLevelLegs) {
      issues.push({
        type: 'Hip Level Assessment',
        severity: 'minor',
        description: 'Hip level needs assessment for optimal alignment',
        impact: 'Can contribute to muscle imbalance and walking issues',
        recommendations: [
          'Practice hip alignment exercises for better symmetry',
          'Strengthen weak hip muscles to improve balance',
          'Improve overall balance and postural awareness',
          'Consider professional assessment for persistent hip level issues'
        ]
      });
      score -= 15;
    }
  }

  // Enhanced lower back alignment analysis relative to pelvis
  if (bodyPartMap.spine.length > 0 && bodyPartMap.hips.length > 0) {
    const spineKeywords = bodyPartMap.spine.map(label => label.toLowerCase());
    const hasLumbarIssues = spineKeywords.some(keyword => 
      keyword.includes('lumbar') || keyword.includes('lower') || keyword.includes('curved')
    );
    const hasAlignedSpine = spineKeywords.some(keyword => 
      keyword.includes('aligned') || keyword.includes('straight') || keyword.includes('neutral')
    );

    if (hasLumbarIssues && !hasAlignedSpine) {
      issues.push({
        type: 'Lower Back Alignment Issues',
        severity: 'major',
        description: 'Lower back (lumbar spine) needs better alignment with pelvis',
        impact: 'Affects overall posture and can cause significant back pain and instability',
        recommendations: [
          'Practice core strengthening exercises for better lumbar support',
          'Improve posture awareness during daily activities',
          'Consider ergonomic adjustments for work and home environments',
          'Strengthen back muscles to support proper alignment',
          'Practice exercises that promote neutral spine position',
          'Consider professional assessment for persistent alignment issues'
        ]
      });
      score -= 30;
    } else if (!hasAlignedSpine) {
      issues.push({
        type: 'Lower Back Alignment Assessment',
        severity: 'moderate',
        description: 'Lower back alignment needs improvement for optimal posture',
        impact: 'Affects overall posture and can contribute to back pain',
        recommendations: [
          'Practice core strengthening for better spinal support',
          'Improve posture awareness during daily activities',
          'Consider ergonomic adjustments for work and home',
          'Strengthen back muscles to support proper alignment',
          'Practice spinal mobility and stability exercises'
        ]
      });
      score -= 25;
    }
  }

  // Core stability indicators based on hip positioning
  if (bodyPartMap.hips.length > 0 && bodyPartMap.torso.length > 0) {
    const totalHipParts = bodyPartMap.hips.length + bodyPartMap.torso.length;
    if (totalHipParts < 3) {
      issues.push({
        type: 'Limited Hip Visibility',
        severity: 'minor',
        description: 'Limited hip area visibility may affect analysis accuracy',
        impact: 'Analysis may be incomplete or less accurate',
        recommendations: [
          'Ensure hip area is clearly visible in photos',
          'Improve lighting conditions for better visibility',
          'Position camera to capture full hip alignment',
          'Consider multiple angles for comprehensive assessment'
        ]
      });
      score -= 10;
    }
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.round(Math.max(0, score)),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

function analyzeOverallPosture(bodyPartMap: BodyPartMap, faces: any[], imageProperties: any, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85;

  // Global alignment assessment
  const totalBodyParts = Object.values(bodyPartMap).reduce((sum: number, parts: string[]) => sum + parts.length, 0);
  
  if (totalBodyParts < 5) {
    issues.push({
      type: 'Limited Body Part Detection',
      severity: 'moderate',
      description: 'Not enough body parts detected for comprehensive analysis',
      impact: 'Analysis may be incomplete',
      recommendations: [
        'Ensure full body is visible in the image',
        'Improve lighting conditions',
        'Position camera to capture entire body'
      ]
    });
    score -= 20;
  }

  // Compensatory pattern detection
  if (bodyPartMap.head.length > 0 && bodyPartMap.shoulders.length > 0) {
    issues.push({
      type: 'Potential Compensatory Patterns',
      severity: 'minor',
      description: 'Body may be using compensatory movements',
      impact: 'Can lead to muscle imbalance over time',
      recommendations: [
        'Practice balanced movement patterns',
        'Strengthen weak areas',
        'Improve overall body awareness'
      ]
    });
      score -= 15;
  }

  // Risk factor analysis
  const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
  const majorIssues = issues.filter(issue => issue.severity === 'major').length;
  
  if (criticalIssues > 0) {
    score -= 40;
  } else if (majorIssues > 2) {
    score -= 30;
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.round(Math.max(0, score)),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

// Intelligent Scoring Engine
function calculateIntelligentScore(detailedAnalysis: any): ScoreCalculation {
  // Enhanced weighted scoring algorithm with proper weighting
  const weights: ScoringWeights = {
    spine: 0.30,        // Most critical for health (30%)
    shoulders: 0.20,    // Major postural component (20%)
    headNeck: 0.20,     // Critical for neck health (20%)
    hips: 0.15,         // Foundation of posture (15%)
    overall: 0.15       // Global assessment (15%)
  };

  // Calculate weighted base score
  const baseScore = 
    detailedAnalysis.spine.score * weights.spine +
    detailedAnalysis.shoulders.score * weights.shoulders +
    detailedAnalysis.headNeck.score * weights.headNeck +
    detailedAnalysis.hips.score * weights.hips +
    detailedAnalysis.overall.score * weights.overall;

  const penalties: PosturePenalty[] = [];
  const bonuses: PostureBonus[] = [];

  // Enhanced penalty system for different severity levels
  Object.entries(detailedAnalysis).forEach(([region, analysis]: [string, any]) => {
    (analysis.issues as PostureIssue[]).forEach((issue: PostureIssue) => {
      let penaltyPoints = 0;
      let penaltyMultiplier = 1.0;
      
      // Base penalty points by severity
      switch (issue.severity) {
        case 'critical':
          penaltyPoints = 80; // Critical issues (90° bending, severe misalignment)
          penaltyMultiplier = 1.2; // Additional penalty for critical issues
          break;
        case 'major':
          penaltyPoints = 45; // Major issues (rounded shoulders, significant tilt)
          penaltyMultiplier = 1.1; // Slight additional penalty for major issues
          break;
        case 'moderate':
          penaltyPoints = 25; // Moderate issues (head tilt, minor asymmetry)
          penaltyMultiplier = 1.0; // Standard penalty
          break;
        case 'minor':
          penaltyPoints = 10; // Minor issues (slight asymmetry, visibility issues)
          penaltyMultiplier = 0.8; // Reduced penalty for minor issues
          break;
      }
      
      // Apply region-specific multipliers for consistency
      const regionMultiplier = weights[region as keyof ScoringWeights] || 1.0;
      const finalPenalty = Math.round(penaltyPoints * penaltyMultiplier * regionMultiplier);
      
      penalties.push({
        type: `${region} - ${issue.type}`,
        severity: issue.severity,
        points: finalPenalty,
        description: issue.description
      });
    });
  });

  // Enhanced bonus system for good posture
  if (baseScore > 85) {
    bonuses.push({
      type: 'Excellent Overall Posture',
      points: 15,
      description: 'Maintaining excellent posture habits across all regions'
    });
  } else if (baseScore > 75) {
    bonuses.push({
      type: 'Good Overall Posture',
      points: 10,
      description: 'Maintaining good posture habits'
    });
  } else if (baseScore > 65) {
    bonuses.push({
      type: 'Fair Posture with Improvement',
      points: 5,
      description: 'Showing some good posture habits'
    });
  }

  // Consistency validation to ensure similar postures get similar scores
  const totalPenalties = penalties.reduce((sum, penalty) => sum + penalty.points, 0);
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.points, 0);
  
  let finalScore = Math.max(0, Math.min(100, baseScore - totalPenalties + totalBonuses));
  
  // Consistency adjustments based on overall pattern
  const criticalIssues = penalties.filter(p => p.severity === 'critical').length;
  const majorIssues = penalties.filter(p => p.severity === 'major').length;
  
  // Ensure critical issues result in poor scores
  if (criticalIssues > 0 && finalScore > 40) {
    finalScore = Math.min(finalScore, 40);
  }
  
  // Ensure multiple major issues result in fair or poor scores
  if (majorIssues > 2 && finalScore > 60) {
    finalScore = Math.min(finalScore, 60);
  }
  
  // Ensure good base scores with few issues get good final scores
  if (baseScore > 80 && totalPenalties < 20) {
    finalScore = Math.max(finalScore, 70);
  }
  
  // Calculate confidence based on analysis completeness and consistency
  const analysisCompleteness = Object.keys(detailedAnalysis).length / 5; // 5 regions
  const issueConsistency = penalties.length > 0 ? Math.min(1, 10 / penalties.length) : 1;
  const confidence = Math.min(0.95, 0.7 + (finalScore / 100) * 0.15 + analysisCompleteness * 0.1);

  return {
    baseScore: Math.round(baseScore),
    penalties,
    bonuses,
    finalScore: Math.round(finalScore),
    confidence
  };
}

function determineEnhancedStatus(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

// Enhanced Feedback Generation System
function generateCategorizedFeedback(detailedAnalysis: any, scoreCalculation: ScoreCalculation): CategorizedFeedback {
  const feedback: CategorizedFeedback = {
    critical: [],
    major: [],
    moderate: [],
    minor: []
  };

  // Enhanced categorization of issues by severity with detailed descriptions
  Object.entries(detailedAnalysis).forEach(([region, analysis]: [string, any]) => {
    (analysis.issues as PostureIssue[]).forEach((issue: PostureIssue) => {
      const regionDisplay = region.charAt(0).toUpperCase() + region.slice(1).replace(/([A-Z])/g, ' $1');
      const message = `[${regionDisplay.toUpperCase()}] ${issue.description}`;
      feedback[issue.severity].push(message);
    });
  });

  // Enhanced score-based feedback with specific guidance
  if (scoreCalculation.finalScore < 30) {
    feedback.critical.push('🚨 CRITICAL: Immediate posture intervention required - Score indicates severe postural issues');
    feedback.critical.push('⚠️ URGENT: Consult with a healthcare professional for comprehensive assessment');
    feedback.critical.push('🛑 STOP: Avoid activities that may worsen current posture problems');
  } else if (scoreCalculation.finalScore < 50) {
    feedback.major.push('⚠️ MAJOR: Significant posture improvements needed - Multiple serious issues detected');
    feedback.major.push('📋 ACTION: Create a structured posture improvement plan');
    feedback.major.push('🏥 CONSIDER: Professional assessment may be beneficial');
  } else if (scoreCalculation.finalScore < 70) {
    feedback.moderate.push('📊 MODERATE: Some posture improvements recommended - Several areas need attention');
    feedback.moderate.push('💪 FOCUS: Prioritize the most critical issues first');
    feedback.moderate.push('📈 PROGRESS: Regular monitoring and exercises will help');
  } else if (scoreCalculation.finalScore < 85) {
    feedback.minor.push('✅ MINOR: Minor posture adjustments suggested - Overall good posture with room for improvement');
    feedback.minor.push('🎯 REFINE: Focus on maintaining good habits and minor corrections');
    feedback.minor.push('🌟 MAINTAIN: Continue current good posture practices');
  } else {
    feedback.minor.push('🏆 EXCELLENT: Outstanding posture! Continue maintaining these good habits');
    feedback.minor.push('💎 PREVENT: Focus on maintaining current excellent posture');
  }

  // Add specific feedback based on detected issues
  const criticalIssues = scoreCalculation.penalties.filter(p => p.severity === 'critical');
  const majorIssues = scoreCalculation.penalties.filter(p => p.severity === 'major');
  
  if (criticalIssues.length > 0) {
    feedback.critical.push(`🚨 ${criticalIssues.length} critical issue(s) detected requiring immediate attention`);
  }
  
  if (majorIssues.length > 0) {
    feedback.major.push(`⚠️ ${majorIssues.length} major issue(s) detected requiring significant improvement`);
  }

  // Add overall posture assessment
  const totalIssues = scoreCalculation.penalties.length;
  if (totalIssues === 0) {
    feedback.minor.push('🎉 No posture issues detected - Excellent posture!');
  } else if (totalIssues <= 2) {
    feedback.minor.push(`📊 Only ${totalIssues} minor issue(s) detected - Great posture overall!`);
  } else if (totalIssues <= 5) {
    feedback.moderate.push(`📊 ${totalIssues} posture issues detected - Several areas need attention`);
  } else {
    feedback.major.push(`📊 ${totalIssues} posture issues detected - Comprehensive improvement plan needed`);
  }

  return feedback;
}

function generatePrioritizedRecommendations(detailedAnalysis: any, scoreCalculation: ScoreCalculation): PrioritizedRecommendations {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];
  const exercises: Exercise[] = [];
  const lifestyle: string[] = [];

  // Enhanced critical issues for immediate attention
  scoreCalculation.penalties
    .filter((penalty: PosturePenalty) => penalty.severity === 'critical')
    .forEach((penalty: PosturePenalty) => {
      immediate.push(`🚨 IMMEDIATE: Address ${penalty.type} - ${penalty.description}`);
      immediate.push(`🛑 STOP: Avoid activities that worsen ${penalty.type.toLowerCase()}`);
      immediate.push(`🏥 SEEK: Professional assessment for ${penalty.type.toLowerCase()}`);
    });

  // Enhanced major issues for short-term goals (1-4 weeks)
  scoreCalculation.penalties
    .filter((penalty: PosturePenalty) => penalty.severity === 'major')
    .forEach((penalty: PosturePenalty) => {
      shortTerm.push(`⚠️ SHORT-TERM (1-4 weeks): Improve ${penalty.type} - ${penalty.description}`);
      shortTerm.push(`💪 FOCUS: Daily exercises targeting ${penalty.type.toLowerCase()}`);
      shortTerm.push(`📋 PLAN: Create specific improvement goals for ${penalty.type.toLowerCase()}`);
    });

  // Enhanced moderate issues for long-term goals (1-3 months)
  scoreCalculation.penalties
    .filter((penalty: PosturePenalty) => penalty.severity === 'moderate')
    .forEach((penalty: PosturePenalty) => {
      longTerm.push(`📊 LONG-TERM (1-3 months): Work on ${penalty.type} - ${penalty.description}`);
      longTerm.push(`🎯 CONSISTENCY: Regular practice for ${penalty.type.toLowerCase()} improvement`);
      longTerm.push(`📈 PROGRESS: Monitor improvements in ${penalty.type.toLowerCase()}`);
    });

  // Enhanced specific exercise recommendations based on detected issues
  const hasNeckIssues = scoreCalculation.penalties.some(p => p.type.includes('headNeck') || p.type.includes('neck'));
  const hasShoulderIssues = scoreCalculation.penalties.some(p => p.type.includes('shoulder'));
  const hasSpineIssues = scoreCalculation.penalties.some(p => p.type.includes('spine'));
  const hasHipIssues = scoreCalculation.penalties.some(p => p.type.includes('hip'));

  // Core exercises for all users
  exercises.push(
    {
      name: 'Core Strengthening - Plank',
      description: 'Strengthen core muscles to support proper posture',
      targetArea: 'Core',
      difficulty: 'beginner',
      duration: '30-60 seconds, 3 sets',
      frequency: 'Daily'
    },
    {
      name: 'Posture Awareness - Wall Stand',
      description: 'Practice proper standing posture against a wall',
      targetArea: 'Full Body',
      difficulty: 'beginner',
      duration: '5-10 minutes',
      frequency: '3 times daily'
    }
  );

  // Specific exercises based on detected issues
  if (hasNeckIssues) {
    exercises.push(
      {
        name: 'Chin Tucks',
        description: 'Strengthen deep neck flexors and improve head position',
        targetArea: 'Neck',
        difficulty: 'beginner',
        duration: '10 repetitions, 3 sets',
        frequency: '3 times daily'
      },
      {
        name: 'Neck Stretches',
        description: 'Improve neck flexibility and reduce muscle tension',
        targetArea: 'Neck',
        difficulty: 'beginner',
        duration: '30 seconds each side, 3 sets',
        frequency: 'Daily'
      }
    );
  }

  if (hasShoulderIssues) {
    exercises.push(
      {
        name: 'Wall Angels',
        description: 'Improve shoulder blade positioning and upper back strength',
        targetArea: 'Shoulders',
        difficulty: 'beginner',
        duration: '10-15 repetitions, 3 sets',
        frequency: 'Daily'
      },
      {
        name: 'Shoulder Blade Squeezes',
        description: 'Strengthen rhomboid muscles and improve shoulder positioning',
        targetArea: 'Shoulders',
        difficulty: 'beginner',
        duration: '10 seconds hold, 10 repetitions',
        frequency: '3 times daily'
      }
    );
  }

  if (hasSpineIssues) {
    exercises.push(
      {
        name: 'Cat-Cow Stretch',
        description: 'Improve spinal mobility and flexibility',
        targetArea: 'Spine',
        difficulty: 'beginner',
        duration: '10 repetitions, 2 sets',
        frequency: 'Daily'
      },
      {
        name: 'Thoracic Extension',
        description: 'Reduce kyphosis and improve upper back posture',
        targetArea: 'Spine',
        difficulty: 'beginner',
        duration: '10 repetitions, 3 sets',
        frequency: 'Daily'
      }
    );
  }

  if (hasHipIssues) {
    exercises.push(
      {
        name: 'Pelvic Tilts',
        description: 'Strengthen core and improve pelvic alignment',
        targetArea: 'Hips',
        difficulty: 'beginner',
        duration: '10 repetitions, 3 sets',
        frequency: 'Daily'
      },
      {
        name: 'Hip Flexor Stretch',
        description: 'Improve hip flexibility and reduce anterior pelvic tilt',
        targetArea: 'Hips',
        difficulty: 'beginner',
        duration: '30 seconds each side, 3 sets',
        frequency: 'Daily'
      }
    );
  }

  // Enhanced lifestyle recommendations
  lifestyle.push(
    '⏰ Take regular breaks from sitting (every 30 minutes)',
    '🪑 Adjust workstation ergonomics for optimal posture',
    '🧘 Practice good posture awareness throughout the day',
    '💧 Stay hydrated to maintain muscle function',
    '😴 Ensure adequate sleep for muscle recovery',
    '🏃‍♂️ Incorporate regular physical activity into daily routine',
    '📱 Limit screen time and practice digital wellness',
    '🎒 Use proper bag carrying techniques to avoid asymmetry'
  );

  // Add specific lifestyle recommendations based on score
  if (scoreCalculation.finalScore < 50) {
    lifestyle.push(
      '🏥 Consider consulting with a physical therapist or posture specialist',
      '📋 Create a structured posture improvement plan',
      '📊 Track progress with regular posture assessments'
    );
  } else if (scoreCalculation.finalScore < 70) {
    lifestyle.push(
      '📈 Set specific posture improvement goals',
      '📱 Use posture reminder apps throughout the day',
      '🎯 Focus on the most critical issues first'
    );
  }

  return {
    immediate,
    shortTerm,
    longTerm,
    exercises,
    lifestyle
  };
}

// Analysis Metadata Generation
function generateAnalysisMetadata(
  labels: any[], 
  objects: any[], 
  faces: any[], 
  imageProperties: any, 
  processingTime: number,
  detectionConfidence: number
): AnalysisMetadata {
  // Enhanced image quality assessment based on available data
  const labelQuality = Math.min(100, (labels.length / 25) * 100);
  const objectQuality = Math.min(100, (objects.length / 15) * 100);
  const faceQuality = faces.length > 0 ? 100 : 0;
  
  const imageQuality = Math.round(
    (labelQuality * 0.4) + // Label detection quality (40%)
    (objectQuality * 0.3) + // Object detection quality (30%)
    (faceQuality * 0.3) // Face detection quality (30%)
  );

  // Enhanced lighting conditions assessment
  let lightingConditions = 'unknown';
  let lightingScore = 0;
  
  if (imageProperties?.dominantColors?.colors) {
    const colors = imageProperties.dominantColors.colors;
    const brightness = colors.reduce((sum: number, color: any) => {
      const rgb = color.color;
      return sum + (rgb.red + rgb.green + rgb.blue) / 3;
    }, 0) / colors.length;
    
    lightingScore = Math.min(100, brightness);
    
    if (brightness > 180) {
      lightingConditions = 'excellent';
    } else if (brightness > 140) {
      lightingConditions = 'good';
    } else if (brightness > 100) {
      lightingConditions = 'moderate';
    } else if (brightness > 60) {
      lightingConditions = 'dim';
    } else {
      lightingConditions = 'poor';
    }
  }

  // Enhanced body visibility calculation
  const labelVisibility = Math.min(100, (labels.length / 20) * 60);
  const objectVisibility = Math.min(100, (objects.length / 10) * 30);
  const faceVisibility = faces.length > 0 ? 20 : 0;
  const personDetectionBonus = labels.some(l => l.description.toLowerCase().includes('person')) ? 10 : 0;
  
  const bodyVisibility = Math.round(
    labelVisibility + 
    objectVisibility + 
    faceVisibility + 
    personDetectionBonus
  );

  // Enhanced processing time tracking
  const processingEfficiency = processingTime < 1000 ? 100 : 
                               processingTime < 2000 ? 80 : 
                               processingTime < 3000 ? 60 : 40;

  // Enhanced detection confidence calculation
  const finalDetectionConfidence = Math.round(
    Math.min(100, 
      detectionConfidence * 100 * 0.6 + // Base detection confidence (60%)
      (imageQuality / 100) * 20 + // Image quality contribution (20%)
      (lightingScore / 100) * 10 + // Lighting contribution (10%)
      (bodyVisibility / 100) * 10 // Body visibility contribution (10%)
    )
  );

  return {
    imageQuality,
    lightingConditions,
    bodyVisibility,
    processingTime,
    detectionConfidence: finalDetectionConfidence
  };
}

// Error Response Functions
function createPersonNotDetectedResponse(): PostureAnalysis {
  return {
    score: 0,
    status: "poor",
    confidence: 5,
    personDetected: false,
    faceDetected: false,
    detectionMethods: [],
    detailedAnalysis: {
      headNeck: createEmptyAnalysis(),
      shoulders: createEmptyAnalysis(),
      spine: createEmptyAnalysis(),
      hips: createEmptyAnalysis(),
      overall: createEmptyAnalysis()
    },
    feedback: [
      "🚨 CRITICAL: No person detected in the image",
      "⚠️ Analysis cannot proceed without clear person detection",
      "📸 Image quality or positioning may be insufficient",
      "🔍 Multiple detection methods failed to identify a person"
    ],
    recommendations: [
      "📱 POSITIONING: Stand in the center of the frame with your full body visible",
      "💡 LIGHTING: Ensure excellent, even lighting on your entire body",
      "🚫 OBSTRUCTIONS: Remove any objects between you and the camera",
      "📏 DISTANCE: Stand 3-6 feet away from the camera for optimal framing",
      "👤 ORIENTATION: Face the camera directly with your full body in view",
      "📸 STABILITY: Use a stable camera position or tripod",
      "🎨 BACKGROUND: Use a plain, contrasting background",
      "👕 CLOTHING: Wear clothing that clearly shows your body shape",
      "🌅 TIMING: Take photos during daylight hours for better lighting",
      "🔄 RETRY: Take multiple photos from different angles"
    ],
    analysisMetadata: {
      imageQuality: 10,
      lightingConditions: 'unknown',
      bodyVisibility: 5,
      processingTime: 0,
      detectionConfidence: 5
    }
  };
}

function createEmptyAnalysis(): BodyPartAnalysis {
  return {
    score: 0,
    issues: [],
    riskLevel: 'critical',
    recommendations: []
  };
}

function createErrorResponse(error: any): PostureAnalysis {
  return {
    score: 25,
    status: "poor",
    confidence: 10,
    personDetected: false,
    faceDetected: false,
    detectionMethods: [],
    detailedAnalysis: {
      headNeck: createEmptyAnalysis(),
      shoulders: createEmptyAnalysis(),
      spine: createEmptyAnalysis(),
      hips: createEmptyAnalysis(),
      overall: createEmptyAnalysis()
    },
    feedback: [
      "🚨 CRITICAL: Analysis failed due to technical issues",
      "⚠️ Image quality may be insufficient for proper analysis",
      "🔧 System encountered an error during processing",
      "📊 Analysis results are incomplete or unreliable"
    ],
    recommendations: [
      "📸 IMAGE QUALITY: Ensure high-quality image capture with good resolution",
      "💡 LIGHTING: Improve lighting conditions for better visibility",
      "📱 CAMERA: Use a stable camera position to avoid blur",
      "🔄 RETRY: Wait a moment and try the analysis again",
      "🌐 CONNECTION: Check your internet connection stability",
      "📋 ALTERNATIVE: Try uploading a different image",
      "⏰ TIMING: The service may be temporarily busy, try again later",
      "📞 SUPPORT: Contact support if the issue persists"
    ],
    analysisMetadata: {
      imageQuality: 20,
      lightingConditions: 'unknown',
      bodyVisibility: 10,
      processingTime: 0,
      detectionConfidence: 10
    }
  };
} 