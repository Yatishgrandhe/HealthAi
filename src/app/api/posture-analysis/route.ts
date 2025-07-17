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
          message: 'No image provided',
          suggestions: ['Please provide a valid base64 encoded image'],
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
          message: 'Cloud Vision API key not configured',
          suggestions: ['Please configure the Cloud Vision API key'],
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
      return NextResponse.json(
        { 
          success: false,
          errorType: 'API_ERROR',
          errorCode: `VISION_API_${visionResponse.status}`,
          message: `Vision API error: ${visionResponse.status}`,
          suggestions: ['Please try again later', 'Check your internet connection'],
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
    
    return NextResponse.json(
      { 
        success: false,
        errorType: 'PROCESSING_ERROR',
        errorCode: 'ANALYSIS_FAILED',
        message: error.message || 'Failed to analyze posture',
        suggestions: [
          'Please try again with a different image',
          'Ensure good lighting and clear visibility',
          'Make sure you are fully visible in the frame'
        ],
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
    const detailedAnalysis = {
      headNeck: analyzeHeadNeckPosition(faces, bodyPartData, spatialAnalysis),
      shoulders: analyzeShoulderPosition(bodyPartData, spatialAnalysis),
      spine: analyzeSpineAlignment(bodyPartData, spatialAnalysis),
      hips: analyzeHipPosition(bodyPartData, spatialAnalysis),
      overall: analyzeOverallPosture(bodyPartData, faces, imageProperties, spatialAnalysis)
    };

    // Intelligent scoring engine
    const scoreCalculation = calculateIntelligentScore(detailedAnalysis);
    const status = determineEnhancedStatus(scoreCalculation.finalScore);
    
    // Enhanced feedback generation
    const feedback = generateCategorizedFeedback(detailedAnalysis, scoreCalculation);
    const recommendations = generatePrioritizedRecommendations(detailedAnalysis, scoreCalculation);
    
    // Analysis metadata
    const processingTime = Date.now() - startTime;
    const analysisMetadata = generateAnalysisMetadata(
      labels, objects, faces, imageProperties, processingTime, personDetectionResult.confidence
    );

    return {
      score: scoreCalculation.finalScore,
      status,
      confidence: scoreCalculation.confidence,
      personDetected: true,
      faceDetected: faces.length > 0,
      detectionMethods: personDetectionResult.detectionMethods,
      detailedAnalysis,
      feedback,
      recommendations,
      analysisMetadata
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

  // Face angle analysis
  if (faces.length > 0) {
    const face = faces[0];
    const rollAngle = Math.abs(face.rollAngle || 0);
    const panAngle = Math.abs(face.panAngle || 0);
    const tiltAngle = Math.abs(face.tiltAngle || 0);

    // Forward head posture detection
    if (panAngle > 15) {
      issues.push({
        type: 'Forward Head Posture',
        severity: 'major',
        description: 'Head is positioned forward relative to the body',
        impact: 'Can cause neck strain, headaches, and shoulder tension',
        recommendations: [
          'Practice chin tucks to strengthen neck muscles',
          'Adjust computer monitor to eye level',
          'Take regular breaks to stretch neck muscles'
        ]
      });
      score -= 25;
    }

    // Head tilt detection
    if (rollAngle > 10) {
      issues.push({
        type: 'Head Tilt',
        severity: 'moderate',
        description: 'Head is tilted to one side',
        impact: 'Can cause muscle imbalance and neck strain',
        recommendations: [
          'Practice neck stretches to improve flexibility',
          'Check for muscle tightness on one side',
          'Consider ergonomic adjustments'
        ]
      });
      score -= 15;
    }

    // Excessive tilt detection
    if (tiltAngle > 20) {
      issues.push({
        type: 'Excessive Head Tilt',
        severity: 'moderate',
        description: 'Head is tilted too far forward or backward',
        impact: 'Can strain neck muscles and affect breathing',
        recommendations: [
          'Practice neutral head position exercises',
          'Strengthen neck and upper back muscles',
          'Improve overall posture awareness'
        ]
      });
      score -= 20;
    }
  }

  // Neck strain indicators
  if (bodyPartMap.neck.length === 0 && bodyPartMap.head.length > 0) {
    issues.push({
      type: 'Potential Neck Strain',
      severity: 'minor',
      description: 'Neck area may be under strain',
      impact: 'Can lead to discomfort and reduced mobility',
      recommendations: [
        'Practice gentle neck stretches',
        'Improve ergonomic setup',
        'Take regular movement breaks'
      ]
    });
    score -= 10;
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.max(0, score),
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
    score: Math.max(0, score),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

function analyzeSpineAlignment(bodyPartMap: BodyPartMap, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85;

  // Spinal curvature analysis
  if (bodyPartMap.spine.length > 0) {
    issues.push({
      type: 'Spinal Alignment',
      severity: 'moderate',
      description: 'Spine may need better alignment',
      impact: 'Affects overall posture and can cause back pain',
      recommendations: [
        'Practice core strengthening exercises',
        'Improve posture awareness',
        'Consider ergonomic adjustments'
      ]
    });
    score -= 20;
  }

  // Forward flexion detection
  if (bodyPartMap.torso.length > 0 && bodyPartMap.head.length > 0) {
    issues.push({
      type: 'Forward Flexion',
      severity: 'major',
      description: 'Upper body may be leaning forward',
      impact: 'Can cause significant back strain and pain',
      recommendations: [
        'Practice standing tall exercises',
        'Strengthen core and back muscles',
        'Improve overall posture habits'
      ]
    });
    score -= 30;
  }

  // Lateral deviation analysis
  if (bodyPartMap.shoulders.length > 0 && bodyPartMap.hips.length > 0) {
    issues.push({
      type: 'Lateral Deviation',
      severity: 'moderate',
      description: 'Body may be leaning to one side',
      impact: 'Can cause muscle imbalance and back pain',
      recommendations: [
        'Practice balance exercises',
        'Strengthen weak side muscles',
        'Improve overall symmetry'
      ]
    });
    score -= 25;
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.max(0, score),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

function analyzeHipPosition(bodyPartMap: BodyPartMap, spatialAnalysis: SpatialAnalysis): BodyPartAnalysis {
  const issues: PostureIssue[] = [];
  let score = 85;

  // Pelvic tilt detection
  if (bodyPartMap.hips.length > 0) {
    issues.push({
      type: 'Pelvic Tilt',
      severity: 'moderate',
      description: 'Pelvis may be tilted anteriorly or posteriorly',
      impact: 'Affects lower back alignment and can cause pain',
      recommendations: [
        'Practice pelvic tilts exercise',
        'Strengthen core muscles',
        'Improve hip flexibility'
      ]
    });
    score -= 20;
  }

  // Hip level assessment
  if (bodyPartMap.legs.length > 0) {
    issues.push({
      type: 'Hip Level',
      severity: 'minor',
      description: 'Hips may not be level',
      impact: 'Can cause muscle imbalance and walking issues',
      recommendations: [
        'Practice hip alignment exercises',
        'Strengthen weak hip muscles',
        'Improve overall balance'
      ]
    });
    score -= 15;
  }

  // Lower back alignment
  if (bodyPartMap.spine.length > 0 && bodyPartMap.hips.length > 0) {
    issues.push({
      type: 'Lower Back Alignment',
      severity: 'moderate',
      description: 'Lower back may need better alignment with pelvis',
      impact: 'Affects overall posture and can cause back pain',
      recommendations: [
        'Practice core strengthening',
        'Improve posture awareness',
        'Consider ergonomic adjustments'
      ]
    });
    score -= 25;
  }

  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  return {
    score: Math.max(0, score),
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
    score: Math.max(0, score),
    issues,
    riskLevel,
    recommendations: issues.flatMap(issue => issue.recommendations)
  };
}

// Intelligent Scoring Engine
function calculateIntelligentScore(detailedAnalysis: any): ScoreCalculation {
  const weights: ScoringWeights = {
    spine: 0.30,
    shoulders: 0.20,
    headNeck: 0.20,
    hips: 0.15,
    overall: 0.15
  };

  const baseScore = 
    detailedAnalysis.spine.score * weights.spine +
    detailedAnalysis.shoulders.score * weights.shoulders +
    detailedAnalysis.headNeck.score * weights.headNeck +
    detailedAnalysis.hips.score * weights.hips +
    detailedAnalysis.overall.score * weights.overall;

  const penalties: PosturePenalty[] = [];
  const bonuses: PostureBonus[] = [];

  // Apply penalties based on severity
  Object.entries(detailedAnalysis).forEach(([region, analysis]: [string, any]) => {
    (analysis as BodyPartAnalysis).issues.forEach((issue: PostureIssue) => {
      let penaltyPoints = 0;
      switch (issue.severity) {
        case 'critical':
          penaltyPoints = 80;
          break;
        case 'major':
          penaltyPoints = 45;
          break;
        case 'moderate':
          penaltyPoints = 25;
          break;
        case 'minor':
          penaltyPoints = 10;
          break;
      }
      
      penalties.push({
        type: `${region} - ${issue.type}`,
        severity: issue.severity,
        points: penaltyPoints,
        description: issue.description
      });
    });
  });

  // Apply bonuses for good posture
  if (baseScore > 80) {
    bonuses.push({
      type: 'Good Overall Posture',
      points: 10,
      description: 'Maintaining good posture habits'
    });
  }

  const totalPenalties = penalties.reduce((sum, penalty) => sum + penalty.points, 0);
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.points, 0);
  
  const finalScore = Math.max(0, Math.min(100, baseScore - totalPenalties + totalBonuses));
  
  // Calculate confidence based on analysis completeness
  const confidence = Math.min(0.95, 0.7 + (finalScore / 100) * 0.25);

  return {
    baseScore,
    penalties,
    bonuses,
    finalScore,
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

  // Categorize issues by severity
  Object.entries(detailedAnalysis).forEach(([region, analysis]: [string, any]) => {
    (analysis as BodyPartAnalysis).issues.forEach((issue: PostureIssue) => {
      const message = `[${region.toUpperCase()}] ${issue.description}`;
      feedback[issue.severity].push(message);
    });
  });

  // Add score-based feedback
  if (scoreCalculation.finalScore < 30) {
    feedback.critical.push('CRITICAL: Immediate posture intervention required');
  } else if (scoreCalculation.finalScore < 50) {
    feedback.major.push('MAJOR: Significant posture improvements needed');
  } else if (scoreCalculation.finalScore < 70) {
    feedback.moderate.push('MODERATE: Some posture improvements recommended');
  } else if (scoreCalculation.finalScore < 85) {
    feedback.minor.push('MINOR: Minor posture adjustments suggested');
  }

  return feedback;
}

function generatePrioritizedRecommendations(detailedAnalysis: any, scoreCalculation: ScoreCalculation): PrioritizedRecommendations {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];
  const exercises: Exercise[] = [];
  const lifestyle: string[] = [];

  // Critical issues need immediate attention
  scoreCalculation.penalties
    .filter((penalty: PosturePenalty) => penalty.severity === 'critical')
    .forEach((penalty: PosturePenalty) => {
      immediate.push(`Address ${penalty.type}: ${penalty.description}`);
    });

  // Major issues for short-term goals
  scoreCalculation.penalties
    .filter((penalty: PosturePenalty) => penalty.severity === 'major')
    .forEach((penalty: PosturePenalty) => {
      shortTerm.push(`Improve ${penalty.type}: ${penalty.description}`);
    });

  // Moderate issues for long-term goals
  scoreCalculation.penalties
    .filter((penalty: PosturePenalty) => penalty.severity === 'moderate')
    .forEach((penalty: PosturePenalty) => {
      longTerm.push(`Work on ${penalty.type}: ${penalty.description}`);
    });

  // Generate specific exercises
  exercises.push(
    {
      name: 'Chin Tucks',
      description: 'Strengthen neck muscles and improve head position',
      targetArea: 'Neck',
      difficulty: 'beginner',
      duration: '5-10 minutes',
      frequency: '3 times daily'
    },
    {
      name: 'Wall Angels',
      description: 'Improve shoulder blade positioning and upper back strength',
      targetArea: 'Shoulders',
      difficulty: 'beginner',
      duration: '10-15 minutes',
      frequency: 'Daily'
    },
    {
      name: 'Pelvic Tilts',
      description: 'Strengthen core and improve pelvic alignment',
      targetArea: 'Hips',
      difficulty: 'beginner',
      duration: '5-10 minutes',
      frequency: 'Daily'
    }
  );

  // Lifestyle recommendations
  lifestyle.push(
    'Take regular breaks from sitting (every 30 minutes)',
    'Adjust workstation ergonomics',
    'Practice good posture awareness throughout the day',
    'Consider posture-correcting exercises or physical therapy'
  );

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
  // Assess image quality based on available data
  const imageQuality = Math.min(100, 
    50 + // Base quality
    (labels.length > 10 ? 20 : 0) + // Good label detection
    (objects.length > 5 ? 15 : 0) + // Good object detection
    (faces.length > 0 ? 15 : 0) // Face detection
  );

  // Determine lighting conditions
  let lightingConditions = 'unknown';
  if (imageProperties?.dominantColors?.colors) {
    const colors = imageProperties.dominantColors.colors;
    const brightness = colors.reduce((sum: number, color: any) => {
      const rgb = color.color;
      return sum + (rgb.red + rgb.green + rgb.blue) / 3;
    }, 0) / colors.length;
    
    if (brightness > 200) lightingConditions = 'bright';
    else if (brightness > 100) lightingConditions = 'moderate';
    else lightingConditions = 'dim';
  }

  // Calculate body visibility
  const bodyVisibility = Math.min(100, 
    (labels.length / 20) * 50 + // Label-based visibility
    (objects.length / 10) * 30 + // Object-based visibility
    (faces.length > 0 ? 20 : 0) // Face detection bonus
  );

  return {
    imageQuality,
    lightingConditions,
    bodyVisibility,
    processingTime,
    detectionConfidence
  };
}

// Error Response Functions
function createPersonNotDetectedResponse(): PostureAnalysis {
  return {
    score: 0,
    status: "poor",
    confidence: 0.05,
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
    feedback: {
      critical: [
        "❌ CRITICAL: No person detected in the image",
        "⚠️ You must be fully visible in the camera frame",
        "🚫 Analysis cannot proceed without clear person detection"
      ],
      major: [],
      moderate: [],
      minor: []
    },
    recommendations: {
      immediate: [
        "📱 Position yourself in the center of the frame",
        "💡 Ensure excellent lighting on your entire body"
      ],
      shortTerm: [
        "🚫 Remove any obstructions between you and the camera",
        "📏 Stand 3-6 feet away from the camera"
      ],
      longTerm: [
        "👤 Face the camera directly with your full body visible",
        "📸 Use a stable camera position"
      ],
      exercises: [],
      lifestyle: []
    },
    analysisMetadata: {
      imageQuality: 10,
      lightingConditions: 'unknown',
      bodyVisibility: 5,
      processingTime: 0,
      detectionConfidence: 0.05
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
    confidence: 0.1,
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
    feedback: {
      critical: [
        "❌ Analysis failed due to technical issues",
        "⚠️ Image quality may be insufficient for proper analysis"
      ],
      major: [],
      moderate: [],
      minor: []
    },
    recommendations: {
      immediate: [
        "📸 Ensure high-quality image capture",
        "💡 Improve lighting conditions"
      ],
      shortTerm: [
        "📱 Use a stable camera position",
        "🔄 Retry the analysis"
      ],
      longTerm: [],
      exercises: [],
      lifestyle: []
    },
    analysisMetadata: {
      imageQuality: 20,
      lightingConditions: 'unknown',
      bodyVisibility: 10,
      processingTime: 0,
      detectionConfidence: 0.1
    }
  };
} 